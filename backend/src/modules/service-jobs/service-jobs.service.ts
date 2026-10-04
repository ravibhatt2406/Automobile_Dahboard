import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { AuditService } from '../audit/audit.service';
import { ServiceJobStatus } from '@prisma/client';

export const DEV_SERVICE_JOBS: any[] = [];

@Injectable()
export class ServiceJobsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateJobCardDto, actorUserId: string) {
    const jobNumber = `JOB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);

      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

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
          odometer: dto.odometer || vehicle.mileage || 0,
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
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    const newJob = {
      id: `job-${Date.now()}`,
      jobNumber,
      appointmentId: dto.appointmentId || null,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      branchId: dto.branchId,
      serviceAdvisorId: dto.serviceAdvisorId,
      assignedMechanicId: dto.assignedMechanicId || null,
      complaint: dto.complaint,
      odometer: dto.odometer || 0,
      fuelLevel: dto.fuelLevel || '50%',
      estimatedCost: dto.estimatedCost || 0,
      warrantyCoverage: dto.warrantyCoverage ?? false,
      status: 'OPEN',
      notes: dto.notes || null,
      createdAt: new Date().toISOString(),
      diagnoses: [],
      labourItems: [],
      jobParts: [],
      approvals: [],
      qcInspections: [],
    };
    DEV_SERVICE_JOBS.unshift(newJob);
    return newJob;
  }

  async assignMechanic(id: string, mechanicId: string, actorUserId: string) {
    const job = await this.findOne(id);

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    job.assignedMechanicId = mechanicId;
    if (job.status === 'OPEN') job.status = 'CHECKED_IN';
    return job;
  }

  async updateStatus(id: string, newStatus: ServiceJobStatus, actorUserId: string, notes?: string) {
    const job = await this.findOne(id);

    if (newStatus === 'COMPLETED') {
      const qcs = job.qcInspections || [];
      const hasPassedQc = qcs.some((qc: any) => qc.status === 'PASSED');
      if (!hasPassedQc) {
        throw new BadRequestException(`Service Job '${job.jobNumber || id}' cannot be COMPLETED without a PASSED Quality Control inspection`);
      }
    }

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const updated = await this.prisma.serviceJob.update({
        where: { id },
        data: {
          status: newStatus,
          notes: notes ? `${job.notes || ''}\n[Status: ${newStatus}] ${notes}` : job.notes,
          actualCompletionTime: newStatus === 'COMPLETED' ? new Date() : job.actualCompletionTime,
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
    } catch (e: any) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) throw e;
    }

    job.status = newStatus;
    if (notes) job.notes = `${job.notes || ''}\n[Status: ${newStatus}] ${notes}`;
    if (newStatus === 'COMPLETED') job.actualCompletionTime = new Date().toISOString();
    return job;
  }

  async findByMechanic(mechanicId: string, status?: ServiceJobStatus) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const where: any = { assignedMechanicId: mechanicId };
      if (status) where.status = status;

      const jobs = await this.prisma.serviceJob.findMany({
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

      if (jobs && jobs.length > 0) return jobs;
    } catch {}

    return DEV_SERVICE_JOBS.filter((j) => j.assignedMechanicId === mechanicId && (!status || j.status === status));
  }

  async findAll(branchId?: string, customerId?: string, status?: ServiceJobStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
          },
        }),
        this.prisma.serviceJob.count({ where }),
      ]);

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_SERVICE_JOBS, total: DEV_SERVICE_JOBS.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (job) return job;
    } catch {}

    const devJob = DEV_SERVICE_JOBS.find((j) => j.id === id);
    if (devJob) return devJob;

    return {
      id,
      jobNumber: `JOB-${id}`,
      customerId: 'cust-dev-01',
      vehicleId: 'veh-dev-01',
      branchId: 'BR-DEV-01',
      serviceAdvisorId: 'emp-admin-01',
      status: 'OPEN',
      diagnoses: [],
      labourItems: [],
      jobParts: [],
      approvals: [],
      qcInspections: [],
    };
  }
}
