import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    if (!dto.serviceJobId) {
      throw new BadRequestException('serviceJobId is required');
    }
    const serviceJobId: string = dto.serviceJobId;
    const additionalCost = dto.additionalCost || 0;

    const job = await this.prisma.serviceJob.findUnique({
      where: { id: serviceJobId },
    });

    if (!job) {
      throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);
    }

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
  }

  async findByJob(serviceJobId: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: serviceJobId },
    });
    if (!job) {
      throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);
    }

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

    if (!approval) {
      throw new NotFoundException(`Approval Request ID '${approvalId}' not found`);
    }

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
  }
}
