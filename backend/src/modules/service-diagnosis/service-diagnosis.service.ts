import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { AuditService } from '../audit/audit.service';
import { DEV_SERVICE_JOBS } from '../service-jobs/service-jobs.service';

export const DEV_DIAGNOSES: any[] = [];
export const DEV_APPROVALS: any[] = [];

@Injectable()
export class ServiceDiagnosisService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDiagnosisDto, actorUserId: string) {
    const serviceJobId = dto.serviceJobId || 'job-dev-01';
    const additionalCost = dto.additionalCost || 0;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const job = await this.prisma.serviceJob.findUnique({
        where: { id: serviceJobId },
      });

      if (!job) throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);

      const result = await this.prisma.$transaction(async (tx) => {
        const diagnosis = await tx.serviceDiagnosis.create({
          data: {
            serviceJobId,
            mechanicId: dto.mechanicId,
            findings: dto.findings,
            recommendedWork: dto.recommendedWork,
            severity: dto.severity || 'MEDIUM',
            additionalCost,
            images: dto.images || [],
            notes: dto.notes || null,
          },
        });

        await tx.serviceJob.update({
          where: { id: serviceJobId },
          data: {
            diagnosis: dto.findings,
            status: additionalCost > 0 ? 'WAITING_FOR_APPROVAL' : 'IN_PROGRESS',
          },
        });

        if (additionalCost > 0) {
          await tx.serviceApproval.create({
            data: {
              serviceJobId,
              additionalWorkDesc: dto.recommendedWork,
              estimatedCost: additionalCost,
              decision: 'PENDING',
            },
          });
        }

        return diagnosis;
      });

      await this.auditService.log({
        actorUserId,
        action: 'SERVICE_DIAGNOSIS_RECORDED',
        entityType: 'ServiceDiagnosis',
        entityId: result.id,
        metadata: { serviceJobId: dto.serviceJobId, additionalCost },
      }).catch(() => {});

      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    const newDiag = {
      id: `diag-${Date.now()}`,
      serviceJobId,
      mechanicId: dto.mechanicId,
      findings: dto.findings,
      recommendedWork: dto.recommendedWork,
      severity: dto.severity || 'MEDIUM',
      additionalCost,
      images: dto.images || [],
      notes: dto.notes || null,
      createdAt: new Date().toISOString(),
    };
    DEV_DIAGNOSES.unshift(newDiag);

    const devJob = DEV_SERVICE_JOBS.find((j) => j.id === serviceJobId);
    if (devJob) {
      devJob.diagnosis = dto.findings;
      devJob.status = additionalCost > 0 ? 'WAITING_FOR_APPROVAL' : 'IN_PROGRESS';
      if (!devJob.diagnoses) devJob.diagnoses = [];
      devJob.diagnoses.push(newDiag);

      if (additionalCost > 0) {
        const newApproval = {
          id: `appr-${Date.now()}`,
          serviceJobId,
          additionalWorkDesc: dto.recommendedWork,
          estimatedCost: additionalCost,
          decision: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        DEV_APPROVALS.unshift(newApproval);
        if (!devJob.approvals) devJob.approvals = [];
        devJob.approvals.push(newApproval);
      }
    }

    return newDiag;
  }

  async findByJob(serviceJobId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const items = await this.prisma.serviceDiagnosis.findMany({
        where: { serviceJobId },
        include: { mechanic: true },
        orderBy: { createdAt: 'desc' },
      });
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_DIAGNOSES.filter((d) => d.serviceJobId === serviceJobId);
  }

  async respondToApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', customerNotes?: string, actorUserId?: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const approval = await this.prisma.serviceApproval.findUnique({
        where: { id: approvalId },
        include: { serviceJob: true },
      });

      if (!approval) throw new NotFoundException(`Approval Request ID '${approvalId}' not found`);

      const updated = await this.prisma.$transaction(async (tx) => {
        const app = await tx.serviceApproval.update({
          where: { id: approvalId },
          data: {
            decision,
            customerNotes,
            decidedAt: new Date(),
          },
        });

        if (decision === 'APPROVED') {
          const newEstimatedCost = Number(approval.serviceJob.estimatedCost) + Number(approval.estimatedCost);
          await tx.serviceJob.update({
            where: { id: approval.serviceJobId },
            data: {
              estimatedCost: newEstimatedCost,
              status: 'IN_PROGRESS',
            },
          });
        } else {
          await tx.serviceJob.update({
            where: { id: approval.serviceJobId },
            data: { status: 'IN_PROGRESS' },
          });
        }

        return app;
      });

      await this.auditService.log({
        actorUserId,
        action: `CUSTOMER_WORK_APPROVAL_${decision}`,
        entityType: 'ServiceApproval',
        entityId: approvalId,
        metadata: { serviceJobId: approval.serviceJobId, decision },
      }).catch(() => {});

      return updated;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    const devAppr = DEV_APPROVALS.find((a) => a.id === approvalId);
    if (devAppr) {
      devAppr.decision = decision;
      devAppr.customerNotes = customerNotes;
      devAppr.decidedAt = new Date().toISOString();

      const devJob = DEV_SERVICE_JOBS.find((j) => j.id === devAppr.serviceJobId);
      if (devJob) {
        devJob.status = 'IN_PROGRESS';
      }
      return devAppr;
    }

    return {
      id: approvalId,
      decision,
      customerNotes,
      decidedAt: new Date().toISOString(),
    };
  }
}
