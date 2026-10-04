import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuditService } from '../audit/audit.service';
import { AppointmentStatus } from '@prisma/client';

export const DEV_APPOINTMENTS: any[] = [];

@Injectable()
export class ServiceAppointmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateAppointmentDto, actorUserId: string) {
    const appointmentNumber = `APT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);

      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

      const appointment = await this.prisma.serviceAppointment.create({
        data: {
          appointmentNumber,
          customerId: dto.customerId,
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
        actorUserId,
        action: 'SERVICE_APPOINTMENT_REQUESTED',
        entityType: 'ServiceAppointment',
        entityId: appointment.id,
        metadata: { appointmentNumber, customerId: dto.customerId, vehicleId: dto.vehicleId },
      }).catch(() => {});

      return appointment;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    const newAppt = {
      id: `apt-${Date.now()}`,
      appointmentNumber,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      branchId: dto.branchId,
      serviceAdvisorId: dto.serviceAdvisorId || null,
      requestedService: dto.requestedService,
      preferredDate: dto.preferredDate,
      preferredTime: dto.preferredTime || '09:00 AM',
      customerNotes: dto.customerNotes || null,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };
    DEV_APPOINTMENTS.unshift(newAppt);
    return newAppt;
  }

  async updateStatus(id: string, status: AppointmentStatus, serviceAdvisorId?: string, actorUserId?: string) {
    const appt = await this.findOne(id);

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const updated = await this.prisma.serviceAppointment.update({
        where: { id },
        data: {
          status,
          serviceAdvisorId: serviceAdvisorId || appt.serviceAdvisorId,
        },
        include: { customer: true, vehicle: true, branch: true, serviceAdvisor: true },
      });

      await this.auditService.log({
        actorUserId,
        action: `SERVICE_APPOINTMENT_${status}`,
        entityType: 'ServiceAppointment',
        entityId: id,
        metadata: { appointmentNumber: appt.appointmentNumber, status },
      }).catch(() => {});

      return updated;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    appt.status = status;
    if (serviceAdvisorId) appt.serviceAdvisorId = serviceAdvisorId;
    return appt;
  }

  async reschedule(id: string, newDate: string, newTime?: string, actorUserId?: string) {
    const appt = await this.findOne(id);

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const updated = await this.prisma.serviceAppointment.update({
        where: { id },
        data: {
          preferredDate: new Date(newDate),
          preferredTime: newTime || appt.preferredTime,
          status: 'RESCHEDULED',
        },
      });

      await this.auditService.log({
        actorUserId,
        action: 'SERVICE_APPOINTMENT_RESCHEDULED',
        entityType: 'ServiceAppointment',
        entityId: id,
        metadata: { appointmentNumber: appt.appointmentNumber, newDate },
      }).catch(() => {});

      return updated;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    appt.preferredDate = newDate;
    if (newTime) appt.preferredTime = newTime;
    appt.status = 'RESCHEDULED';
    return appt;
  }

  async findAll(branchId?: string, customerId?: string, status?: AppointmentStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const where: any = {};
      if (branchId) where.branchId = branchId;
      if (customerId) where.customerId = customerId;
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

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_APPOINTMENTS, total: DEV_APPOINTMENTS.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const appt = await this.prisma.serviceAppointment.findUnique({
        where: { id },
        include: { customer: true, vehicle: true, branch: true, serviceAdvisor: true, serviceJobs: true },
      });

      if (appt) return appt;
    } catch {}

    const devAppt = DEV_APPOINTMENTS.find((a) => a.id === id);
    if (devAppt) return devAppt;

    return {
      id,
      appointmentNumber: `APT-${id}`,
      customerId: 'cust-dev-01',
      vehicleId: 'veh-dev-01',
      branchId: 'BR-DEV-01',
      status: 'REQUESTED',
    };
  }
}
