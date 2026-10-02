import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceDiagnosisService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDiagnosisDto, actorUserId: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: dto.serviceJobId },
    });

    if (!job) throw new NotFoundException(`Service Job ID '${dto.serviceJobId}' not found`);

    const additionalCost = dto.additionalCost || 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const diagnosis = await tx.serviceDiagnosis.create({
        data: {
          serviceJobId: dto.serviceJobId,
          mechanicId: dto.mechanicId,
          findings: dto.findings,
          recommendedWork: dto.recommendedWork,
          severity: dto.severity || 'MEDIUM',
          additionalCost,
          images: dto.images || [],
          notes: dto.notes || null,
        },
      });

      // Update ServiceJob diagnosis summary
      await tx.serviceJob.update({
        where: { id: dto.serviceJobId },
        data: {
          diagnosis: dto.findings,
          status: additionalCost > 0 ? 'WAITING_FOR_APPROVAL' : 'IN_PROGRESS',
        },
      });

      // If additional cost incurred, automatically trigger ServiceApproval record for customer
      if (additionalCost > 0) {
        await tx.serviceApproval.create({
          data: {
            serviceJobId: dto.serviceJobId,
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
    });

    return result;
  }

  async findByJob(serviceJobId: string) {
    return this.prisma.serviceDiagnosis.findMany({
      where: { serviceJobId },
      include: { mechanic: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', customerNotes?: string, actorUserId?: string) {
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
    });

    return updated;
  }
}
