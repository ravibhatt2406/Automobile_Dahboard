import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuditService } from '../audit/audit.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class ServiceAppointmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateAppointmentDto, user: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');

    let customerIdToUse = dto.customerId;
    if (isCustomer) {
      customerIdToUse =
        user?.customerId ||
        (await this.prisma.customer.findFirst({ where: { userId: actorUserId } }))?.id ||
        dto.customerId;
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: customerIdToUse } });
    if (!customer) throw new NotFoundException(`Customer ID '${customerIdToUse}' not found`);

    if (isCustomer && customer.userId && customer.userId !== actorUserId) {
      throw new ForbiddenException('Cannot book service appointment for another customer');
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

    // Customer must own the vehicle
    if (isCustomer && (!vehicle.customerId || vehicle.customerId !== customer.id)) {
      throw new ForbiddenException('Cannot book service for a vehicle not owned by you');
    }

    if (!isCustomer && vehicle.customerId && vehicle.customerId !== customer.id) {
      throw new BadRequestException('Vehicle is not owned by the specified customer');
    }

    // Vehicle eligibility check
    const ineligibleStatuses = ['ORDERED', 'IN_TRANSIT', 'BLOCKED'];
    if (ineligibleStatuses.includes(vehicle.status)) {
      throw new BadRequestException(`Vehicle with status '${vehicle.status}' is not eligible for service booking`);
    }

    // Appointment time validation
    const prefDate = new Date(dto.preferredDate);
    if (isNaN(prefDate.getTime())) {
      throw new BadRequestException('Invalid appointment preferred date');
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    if (prefDate < yesterday) {
      throw new BadRequestException('Appointment preferred date cannot be in the past');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException(`Branch ID '${dto.branchId}' not found`);

    if (!isSuperAdmin && !isCustomer) {
      if (user?.branchId && user.branchId !== branch.id) {
        throw new ForbiddenException('Cannot create appointment in another branch');
      }
      if (user?.franchiseId && user.franchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot create appointment in another franchise');
      }
    }

    const appointmentNumber = `APT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const appointment = await this.prisma.serviceAppointment.create({
      data: {
        appointmentNumber,
        customerId: customer.id,
        vehicleId: dto.vehicleId,
        branchId: dto.branchId,
        serviceAdvisorId: dto.serviceAdvisorId || null,
        requestedService: dto.requestedService,
        preferredDate: new Date(dto.preferredDate),
        preferredTime: dto.preferredTime || '09:00 AM',
        customerNotes: dto.customerNotes || null,
        status: 'REQUESTED',
      },
      include: { customer: true, vehicle: true, branch: true, serviceAdvisor: true },
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'SERVICE_APPOINTMENT_REQUESTED',
      entityType: 'ServiceAppointment',
      entityId: appointment.id,
      metadata: { appointmentNumber, customerId: customer.id, vehicleId: dto.vehicleId },
    }).catch(() => {});

    return appointment;
  }

  async updateStatus(id: string, status: AppointmentStatus, serviceAdvisorId?: string, user?: any) {
    const appt = await this.findOne(id, user);

    const updated = await this.prisma.serviceAppointment.update({
      where: { id },
      data: {
        status,
        serviceAdvisorId: serviceAdvisorId || appt.serviceAdvisorId,
      },
      include: { customer: true, vehicle: true, branch: true, serviceAdvisor: true },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: `SERVICE_APPOINTMENT_${status}`,
      entityType: 'ServiceAppointment',
      entityId: id,
      metadata: { appointmentNumber: appt.appointmentNumber, status },
    }).catch(() => {});

    return updated;
  }

  async reschedule(id: string, newDate: string, newTime?: string, user?: any) {
    const appt = await this.findOne(id, user);

    const updated = await this.prisma.serviceAppointment.update({
      where: { id },
      data: {
        preferredDate: new Date(newDate),
        preferredTime: newTime || appt.preferredTime,
        status: 'RESCHEDULED',
      },
      include: { customer: true, vehicle: true, branch: true, serviceAdvisor: true },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'SERVICE_APPOINTMENT_RESCHEDULED',
      entityType: 'ServiceAppointment',
      entityId: id,
      metadata: { appointmentNumber: appt.appointmentNumber, newDate },
    }).catch(() => {});

    return updated;
  }

  async findAll(branchId?: string, customerId?: string, status?: AppointmentStatus, limit = 50, offset = 0, user?: any) {
    const where: any = {};
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');

    if (isCustomer) {
      if (!user?.customerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = user.customerId;
    } else if (!isSuperAdmin) {
      if (user?.branchId) {
        if (branchId && branchId !== user.branchId) {
          throw new ForbiddenException('Cannot access appointments from another branch');
        }
        where.branchId = user.branchId;
      } else if (user?.franchiseId) {
        where.branch = { franchiseId: user.franchiseId };
        if (branchId) {
          const branchInFranchise = await this.prisma.branch.findFirst({
            where: { id: branchId, franchiseId: user.franchiseId },
          });
          if (!branchInFranchise) {
            throw new ForbiddenException('Branch does not belong to your franchise');
          }
          where.branchId = branchId;
        }
      }
    } else {
      if (branchId) where.branchId = branchId;
      if (customerId) where.customerId = customerId;
    }

    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.serviceAppointment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { preferredDate: 'asc' },
        include: { customer: true, vehicle: true, branch: true, serviceAdvisor: true },
      }),
      this.prisma.serviceAppointment.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const appt = await this.prisma.serviceAppointment.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        branch: { include: { franchise: true } },
        serviceAdvisor: true,
        serviceJobs: true,
      },
    });

    if (!appt) {
      throw new NotFoundException(`Service Appointment ID '${id}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');

      if (isCustomer) {
        if (!user.customerId || appt.customerId !== user.customerId) {
          throw new ForbiddenException('Access denied to service appointment');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && appt.branchId !== user.branchId) {
          throw new ForbiddenException('Access denied to appointment in another branch');
        }
        if (user.franchiseId && appt.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Access denied to appointment in another franchise');
        }
      }
    }

    return appt;
  }

  async cancel(id: string, user: any) {
    const appt = await this.findOne(id, user);

    if (appt.status === 'CANCELLED' || appt.status === 'COMPLETED' || appt.status === 'CONVERTED_TO_JOB') {
      throw new BadRequestException(`Cannot cancel appointment in '${appt.status}' status`);
    }

    const updated = await this.prisma.serviceAppointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'SERVICE_APPOINTMENT_CANCELLED',
      entityType: 'ServiceAppointment',
      entityId: id,
      metadata: { appointmentNumber: appt.appointmentNumber },
    }).catch(() => {});

    return updated;
  }
}
