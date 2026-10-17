import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { AuditService } from '../audit/audit.service';
import { ServiceJobStatus } from '@prisma/client';

const ALLOWED_SERVICE_JOB_TRANSITIONS: Record<ServiceJobStatus, ServiceJobStatus[]> = {
  OPEN: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['DIAGNOSIS', 'IN_PROGRESS', 'CANCELLED'],
  DIAGNOSIS: ['WAITING_FOR_APPROVAL', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'CANCELLED'],
  WAITING_FOR_APPROVAL: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_PARTS', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  WAITING_FOR_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  QUALITY_CHECK: ['READY_FOR_DELIVERY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  READY_FOR_DELIVERY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ServiceJobsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateJobCardDto, user: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    const jobNumber = `JOB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

    if (vehicle.customerId && vehicle.customerId !== dto.customerId) {
      throw new BadRequestException('Vehicle is not owned by the specified customer');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException(`Branch ID '${dto.branchId}' not found`);

    if (!isSuperAdmin) {
      if (user?.branchId && user.branchId !== branch.id) {
        throw new ForbiddenException('Cannot create service job for another branch');
      }
      if (user?.franchiseId && user.franchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot create service job for another franchise');
      }
    }

    // Validate service advisor exists and belongs to branch
    const advisor = await this.prisma.employee.findUnique({
      where: { id: dto.serviceAdvisorId },
      include: { branch: true },
    });
    if (!advisor) {
      throw new NotFoundException(`Service advisor employee ID '${dto.serviceAdvisorId}' not found`);
    }
    if (advisor.status !== 'ACTIVE') {
      throw new BadRequestException(`Service advisor is not ACTIVE (current status: ${advisor.status})`);
    }
    if (advisor.branchId !== dto.branchId) {
      throw new BadRequestException('Service advisor belongs to another branch');
    }

    // Validate assigned mechanic if provided
    if (dto.assignedMechanicId) {
      const mechanic = await this.prisma.employee.findUnique({
        where: { id: dto.assignedMechanicId },
        include: { branch: true },
      });
      if (!mechanic) {
        throw new NotFoundException(`Mechanic employee ID '${dto.assignedMechanicId}' not found`);
      }
      if (mechanic.status !== 'ACTIVE') {
        throw new BadRequestException(`Mechanic is not ACTIVE (current status: ${mechanic.status})`);
      }
      if (mechanic.branchId !== dto.branchId) {
        throw new BadRequestException('Mechanic belongs to another branch');
      }
    }

    // Validate appointment if provided
    if (dto.appointmentId) {
      const appt = await this.prisma.serviceAppointment.findUnique({ where: { id: dto.appointmentId } });
      if (!appt) throw new NotFoundException(`Appointment ID '${dto.appointmentId}' not found`);
      if (appt.customerId !== dto.customerId) {
        throw new BadRequestException('Appointment customer does not match job customer');
      }
      if (appt.vehicleId !== dto.vehicleId) {
        throw new BadRequestException('Appointment vehicle does not match job vehicle');
      }
      if (appt.branchId !== dto.branchId) {
        throw new BadRequestException('Appointment branch does not match job branch');
      }
    }

    const job = await this.prisma.serviceJob.create({
      data: {
        jobNumber,
        appointmentId: dto.appointmentId || null,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        branchId: dto.branchId,
        serviceAdvisorId: dto.serviceAdvisorId,
        assignedMechanicId: dto.assignedMechanicId || null,
        complaint: dto.complaint,
        odometer: dto.odometer || Number(vehicle.mileage) || 0,
        fuelLevel: dto.fuelLevel || '50%',
        estimatedCompletionTime: dto.estimatedCompletionTime ? new Date(dto.estimatedCompletionTime) : null,
        estimatedCost: dto.estimatedCost || 0,
        warrantyCoverage: dto.warrantyCoverage ?? false,
        warrantyClaimRef: dto.warrantyClaimRef || null,
        notes: dto.notes || null,
        status: dto.assignedMechanicId ? 'CHECKED_IN' : 'OPEN',
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
        serviceAdvisor: true,
        assignedMechanic: true,
        diagnoses: true,
        labourItems: true,
        jobParts: true,
        approvals: true,
        qcInspections: true,
      },
    });

    // Update vehicle status to SERVICE
    await this.prisma.vehicle.update({
      where: { id: dto.vehicleId },
      data: { status: 'SERVICE' },
    }).catch(() => {});

    if (dto.appointmentId) {
      await this.prisma.serviceAppointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'CONVERTED_TO_JOB' },
      }).catch(() => {});
    }

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'SERVICE_JOB_CREATED',
      entityType: 'ServiceJob',
      entityId: job.id,
      metadata: { jobNumber, customerId: dto.customerId, vehicleId: dto.vehicleId },
    }).catch(() => {});

    return job;
  }

  async assignMechanic(id: string, mechanicId: string, user: any) {
    const job = await this.findOne(id, user);

    const mechanic = await this.prisma.employee.findUnique({
      where: { id: mechanicId },
      include: { branch: true },
    });
    if (!mechanic) {
      throw new NotFoundException(`Mechanic employee ID '${mechanicId}' not found`);
    }
    if (mechanic.status !== 'ACTIVE') {
      throw new BadRequestException(`Mechanic is not ACTIVE (current status: ${mechanic.status})`);
    }
    if (mechanic.branchId !== job.branchId) {
      throw new BadRequestException(
        `Mechanic belongs to branch '${mechanic.branch?.name || mechanic.branchId}', not the job's branch`,
      );
    }

    const updated = await this.prisma.serviceJob.update({
      where: { id },
      data: {
        assignedMechanicId: mechanicId,
        status: job.status === 'OPEN' ? 'CHECKED_IN' : job.status,
      },
      include: { assignedMechanic: true },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'SERVICE_JOB_MECHANIC_ASSIGNED',
      entityType: 'ServiceJob',
      entityId: id,
      metadata: { jobNumber: job.jobNumber, mechanicId },
    }).catch(() => {});

    return updated;
  }

  async updateStatus(id: string, newStatus: ServiceJobStatus, user: any, notes?: string) {
    const job = await this.findOne(id, user);

    const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isBranchManager = userRoles.includes('BRANCH_MANAGER') || userRoles.includes('BRANCH_OWNER');
    const isAdvisor = userRoles.includes('SERVICE_ADVISOR');
    const isMechanic = userRoles.includes('MECHANIC') && !isSuperAdmin && !isBranchManager && !isAdvisor;

    if (isMechanic && (newStatus === 'COMPLETED' || newStatus === 'CANCELLED')) {
      throw new ForbiddenException('Mechanics cannot mark jobs as COMPLETED or CANCELLED');
    }

    if (job.status !== newStatus) {
      const allowed = ALLOWED_SERVICE_JOB_TRANSITIONS[job.status as ServiceJobStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Invalid status transition from '${job.status}' to '${newStatus}'. Allowed transitions: [${allowed.join(', ')}]`,
        );
      }
    }

    if (newStatus === 'COMPLETED') {
      const hasPassedQc = job.qcInspections?.some((qc: any) => qc.status === 'PASSED');
      if (!hasPassedQc) {
        throw new BadRequestException(
          `Service Job '${job.jobNumber || id}' cannot be COMPLETED without a PASSED Quality Control inspection`,
        );
      }

      // Generate final service invoice if not already present
      if (!job.serviceInvoiceId) {
        const branch = job.branch || (await this.prisma.branch.findUnique({ where: { id: job.branchId } }));
        const invoiceNumber = `INV-SRV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

        let subtotal = 0;
        let taxableAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        const invoiceItemsData: any[] = [];

        // Parts lines
        for (const jp of job.jobParts || []) {
          const partPrice = Number(jp.unitPrice);
          const partGst = Number(jp.gstRate || 18);
          const lineTaxable = partPrice * jp.quantity;
          const lineGst = Math.round(lineTaxable * (partGst / 100) * 100) / 100;
          const lineTotal = lineTaxable + lineGst;

          subtotal += lineTaxable;
          taxableAmount += lineTaxable;
          cgstAmount += lineGst / 2;
          sgstAmount += lineGst / 2;

          invoiceItemsData.push({
            description: `Part: ${jp.part?.name || 'Spare Part'} (${jp.part?.partNumber || ''})`,
            quantity: jp.quantity,
            unitPrice: partPrice,
            taxableAmount: lineTaxable,
            gstRate: partGst,
            gstAmount: lineGst,
            totalAmount: lineTotal,
          });
        }

        // Labour lines
        for (const lb of job.labourItems || []) {
          const hours = Number(lb.hours);
          const hourlyRate = Number(lb.hourlyRate);
          const discount = Number(lb.discount || 0);
          const lineTaxable = hours * hourlyRate - discount;
          const taxRate = Number(lb.taxRate || 18);
          const lineGst = Math.round(lineTaxable * (taxRate / 100) * 100) / 100;
          const lineTotal = lineTaxable + lineGst;

          subtotal += lineTaxable;
          taxableAmount += lineTaxable;
          cgstAmount += lineGst / 2;
          sgstAmount += lineGst / 2;

          invoiceItemsData.push({
            description: `Labour: ${lb.description} (${lb.labourType})`,
            quantity: Math.max(1, Math.round(hours)),
            unitPrice: hourlyRate,
            taxableAmount: lineTaxable,
            gstRate: taxRate,
            gstAmount: lineGst,
            totalAmount: lineTotal,
          });
        }

        const totalAmount = taxableAmount + cgstAmount + sgstAmount;
        const customer = job.customer || (await this.prisma.customer.findUnique({ where: { id: job.customerId } }));
        const billingAddress = customer?.address || `${branch?.name || 'Dealership'} Workshop Center`;

        const invoice = await this.prisma.invoice.create({
          data: {
            invoiceNumber,
            customerId: job.customerId,
            vehicleId: job.vehicleId,
            branchId: job.branchId,
            franchiseId: branch?.franchiseId || '',
            billingAddress,
            gstin: customer?.gstin || null,
            subtotal,
            discount: 0,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount: 0,
            totalAmount,
            status: 'ISSUED',
            paymentStatus: 'UNPAID',
            issuedAt: new Date(),
            items: {
              create: invoiceItemsData,
            },
          },
        });

        await this.prisma.serviceJob.update({
          where: { id },
          data: { serviceInvoiceId: invoice.id },
        });
      }

      // Transition vehicle back to DELIVERED status if it was in SERVICE
      const v = await this.prisma.vehicle.findUnique({ where: { id: job.vehicleId } });
      if (v && v.status === 'SERVICE') {
        await this.prisma.vehicle.update({
          where: { id: job.vehicleId },
          data: { status: 'DELIVERED' },
        });
      }
    }

    const updated = await this.prisma.serviceJob.update({
      where: { id },
      data: {
        status: newStatus,
        notes: notes ? `${job.notes || ''}\n[Status: ${newStatus}] ${notes}` : job.notes,
        actualCompletionTime: newStatus === 'COMPLETED' ? new Date() : (job.actualCompletionTime ?? undefined),
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: `SERVICE_JOB_STATUS_${newStatus}`,
      entityType: 'ServiceJob',
      entityId: id,
      metadata: { jobNumber: job.jobNumber, previousStatus: job.status, newStatus },
    }).catch(() => {});

    return updated;
  }

  async findByMechanic(user: any, requestedMechanicId?: string, status?: ServiceJobStatus) {
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isBranchManager = userRoles.includes('BRANCH_MANAGER') || userRoles.includes('BRANCH_OWNER');
    const isMechanic = userRoles.includes('MECHANIC');

    let targetMechanicId: string | null = null;

    if (isMechanic && !isSuperAdmin && !isBranchManager) {
      // Mechanic identity CANNOT be overridden by query or client parameter
      targetMechanicId = user?.employeeId || user?.employeeProfile?.id;
      if (!targetMechanicId) {
        const employee = await this.prisma.employee.findFirst({ where: { userId: user?.id } });
        targetMechanicId = employee?.id || null;
      }
      if (!targetMechanicId) {
        throw new ForbiddenException('Authenticated user is not registered as an employee mechanic');
      }
    } else {
      targetMechanicId = requestedMechanicId || user?.employeeId || user?.employeeProfile?.id;
    }

    if (!targetMechanicId && !isSuperAdmin && !isBranchManager) {
      throw new BadRequestException('Mechanic employee identity could not be determined');
    }

    const where: any = {};
    if (targetMechanicId) {
      where.assignedMechanicId = targetMechanicId;
    }

    // Branch isolation
    if (!isSuperAdmin) {
      if (user?.branchId) {
        where.branchId = user.branchId;
      } else if (user?.franchiseId) {
        where.branch = { franchiseId: user.franchiseId };
      }
    }

    if (status) where.status = status;

    return this.prisma.serviceJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        vehicle: { include: { variant: { include: { model: true } } } },
        diagnoses: true,
        jobParts: { include: { part: true } },
        labourItems: true,
        qcInspections: true,
      },
    });
  }

  async getVehicleServiceHistory(vehicleId: string, user: any) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { branch: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID '${vehicleId}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');

      if (isCustomer) {
        const customerId =
          user.customerId ||
          (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!vehicle.customerId || vehicle.customerId !== customerId) {
          throw new ForbiddenException('Cannot access service history for a vehicle not owned by you');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && vehicle.branchId !== user.branchId) {
          throw new ForbiddenException('Cannot access service history for vehicle in another branch');
        }
        if (user.franchiseId && vehicle.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot access service history for vehicle in another franchise');
        }
      }
    }

    return this.prisma.serviceJob.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        vehicle: { include: { variant: { include: { model: true } } } },
        serviceAdvisor: true,
        assignedMechanic: true,
        diagnoses: true,
        jobParts: { include: { part: true } },
        labourItems: true,
        qcInspections: true,
        serviceInvoice: { include: { items: true, payments: true } },
      },
    });
  }

  async findAll(
    branchId?: string,
    customerId?: string,
    status?: ServiceJobStatus,
    search?: string,
    limit = 50,
    offset = 0,
    user?: any,
    franchiseId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');
    const isBranchManager = userRoles.includes('BRANCH_MANAGER') || userRoles.includes('BRANCH_OWNER');
    const isAdvisor = userRoles.includes('SERVICE_ADVISOR');
    const isMechanic = userRoles.includes('MECHANIC') && !isSuperAdmin && !isBranchManager && !isAdvisor;

    if (isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        (await this.prisma.customer.findFirst({ where: { userId: user?.id } }))?.id;
      if (!resolvedCustomerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = resolvedCustomerId;
    } else if (isMechanic) {
      let targetMechanicId = user?.employeeId || user?.employeeProfile?.id;
      if (!targetMechanicId) {
        const employee = await this.prisma.employee.findFirst({ where: { userId: user?.id } });
        targetMechanicId = employee?.id || null;
      }
      if (targetMechanicId) {
        where.assignedMechanicId = targetMechanicId;
      }
    } else if (!isSuperAdmin) {
      if (user?.branchId) {
        if (branchId && branchId !== 'ALL' && branchId !== user.branchId) {
          throw new ForbiddenException('Cannot access service jobs from another branch');
        }
        where.branchId = user.branchId;
      } else if (user?.franchiseId) {
        if (franchiseId && franchiseId !== 'ALL' && franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot access service jobs from another franchise');
        }
        where.branch = { franchiseId: user.franchiseId };
        if (branchId && branchId !== 'ALL') {
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
      // Super Admin
      if (franchiseId && franchiseId !== 'ALL') {
        where.branch = { franchiseId };
        if (branchId && branchId !== 'ALL') {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (b && b.franchiseId !== franchiseId) {
            throw new BadRequestException('Selected branch does not belong to the selected franchise');
          }
          where.branchId = b ? b.id : branchId;
        }
      } else if (branchId && branchId !== 'ALL') {
        const b = await this.prisma.branch.findFirst({
          where: { OR: [{ id: branchId }, { code: branchId }] },
        });
        where.branchId = b ? b.id : branchId;
      }
      if (customerId) where.customerId = customerId;
    }

    if (status) where.status = status;

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { jobNumber: { contains: s, mode: 'insensitive' } },
        { complaint: { contains: s, mode: 'insensitive' } },
        { vehicle: { vin: { contains: s, mode: 'insensitive' } } },
        { vehicle: { registrationNumber: { contains: s, mode: 'insensitive' } } },
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { customer: { companyName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.serviceJob.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          vehicle: true,
          serviceAdvisor: { include: { user: { select: { id: true, email: true, phone: true } } } },
          assignedMechanic: { include: { user: { select: { id: true, email: true, phone: true } } } },
          branch: true,
          qcInspections: true,
          serviceInvoice: true,
        },
      }),
      this.prisma.serviceJob.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { variant: { include: { model: { include: { manufacturer: true } } } } } },
        branch: { include: { franchise: true } },
        serviceAdvisor: { include: { user: { select: { id: true, email: true, phone: true } } } },
        assignedMechanic: { include: { user: { select: { id: true, email: true, phone: true } } } },
        diagnoses: true,
        labourItems: true,
        jobParts: { include: { part: true } },
        approvals: true,
        qcInspections: true,
        serviceInvoice: { include: { items: true, payments: true } },
      },
    });

    if (!job) throw new NotFoundException(`Service Job ID '${id}' not found`);

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');
      const isBranchManager = userRoles.includes('BRANCH_MANAGER') || userRoles.includes('BRANCH_OWNER');
      const isAdvisor = userRoles.includes('SERVICE_ADVISOR');
      const isMechanic = userRoles.includes('MECHANIC') && !isSuperAdmin && !isBranchManager && !isAdvisor;

      if (isCustomer) {
        const resolvedCustomerId =
          user.customerId ||
          (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!resolvedCustomerId || job.customerId !== resolvedCustomerId) {
          throw new ForbiddenException('Access denied to service job');
        }
      } else if (isMechanic) {
        let targetMechanicId = user?.employeeId || user?.employeeProfile?.id;
        if (!targetMechanicId) {
          const employee = await this.prisma.employee.findFirst({ where: { userId: user?.id } });
          targetMechanicId = employee?.id || null;
        }
        if (targetMechanicId && job.assignedMechanicId && job.assignedMechanicId !== targetMechanicId) {
          throw new ForbiddenException('Mechanics can only access service jobs assigned to them');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && job.branchId !== user.branchId) {
          throw new ForbiddenException('Access denied to service job in another branch');
        }
        if (user.franchiseId && job.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Access denied to service job in another franchise');
        }
      }
    }

    return job;
  }
}
