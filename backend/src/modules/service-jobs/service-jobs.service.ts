import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { AuditService } from '../audit/audit.service';
import { ServiceJobStatus } from '@prisma/client';

@Injectable()
export class ServiceJobsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateJobCardDto, actorUserId: string) {
    const jobNumber = `JOB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException(`Branch ID '${dto.branchId}' not found`);

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
        status: 'OPEN',
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

    if (dto.appointmentId) {
      await this.prisma.serviceAppointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'CONVERTED_TO_JOB' },
      }).catch(() => {});
    }

    await this.auditService.log({
      actorUserId,
      action: 'SERVICE_JOB_CREATED',
      entityType: 'ServiceJob',
      entityId: job.id,
      metadata: { jobNumber, customerId: dto.customerId, vehicleId: dto.vehicleId },
    }).catch(() => {});

    return job;
  }

  async assignMechanic(id: string, mechanicId: string, actorUserId: string) {
    const job = await this.findOne(id);

    const updated = await this.prisma.serviceJob.update({
      where: { id },
      data: {
        assignedMechanicId: mechanicId,
        status: job.status === 'OPEN' ? 'CHECKED_IN' : job.status,
      },
      include: { assignedMechanic: true },
    });

    await this.auditService.log({
      actorUserId,
      action: 'SERVICE_JOB_MECHANIC_ASSIGNED',
      entityType: 'ServiceJob',
      entityId: id,
      metadata: { jobNumber: job.jobNumber, mechanicId },
    }).catch(() => {});

    return updated;
  }

  async updateStatus(id: string, newStatus: ServiceJobStatus, actorUserId: string, notes?: string) {
    const job = await this.findOne(id);

    if (newStatus === 'COMPLETED') {
      const hasPassedQc = job.qcInspections?.some((qc: any) => qc.status === 'PASSED');
      if (!hasPassedQc) {
        throw new BadRequestException(
          `Service Job '${job.jobNumber || id}' cannot be COMPLETED without a PASSED Quality Control inspection`,
        );
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
      actorUserId,
      action: `SERVICE_JOB_STATUS_${newStatus}`,
      entityType: 'ServiceJob',
      entityId: id,
      metadata: { jobNumber: job.jobNumber, previousStatus: job.status, newStatus },
    }).catch(() => {});

    return updated;
  }

  async findByMechanic(mechanicId: string, status?: ServiceJobStatus) {
    const where: any = { assignedMechanicId: mechanicId };
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
      },
    });
  }

  async findAll(branchId?: string, customerId?: string, status?: ServiceJobStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.serviceJob.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          vehicle: true,
          serviceAdvisor: true,
          assignedMechanic: true,
          branch: true,
        },
      }),
      this.prisma.serviceJob.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { variant: { include: { model: { include: { manufacturer: true } } } } } },
        branch: true,
        serviceAdvisor: true,
        assignedMechanic: true,
        diagnoses: true,
        labourItems: true,
        jobParts: { include: { part: true } },
        approvals: true,
        qcInspections: true,
        serviceInvoice: { include: { items: true, payments: true } },
      },
    });

    if (!job) throw new NotFoundException(`Service Job ID '${id}' not found`);
    return job;
  }
}
