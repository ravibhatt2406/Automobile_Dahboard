import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceDiagnosisService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDiagnosisDto, actorUserId: string, user?: any) {
    if (!dto.serviceJobId) {
      throw new BadRequestException('serviceJobId is required');
    }
    const serviceJobId: string = dto.serviceJobId;
    const additionalCost = dto.additionalCost || 0;

    const job = await this.prisma.serviceJob.findUnique({
      where: { id: serviceJobId },
      include: { branch: true },
    });

    if (!job) {
      throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        if (user.branchId && job.branchId !== user.branchId) {
          throw new ForbiddenException('Cannot record diagnosis for a job in another branch');
        }
        if (user.franchiseId && job.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot record diagnosis for a job in another franchise');
        }
      }
    }

    // Determine mechanic ID
    let mechanicId = dto.mechanicId || user?.employeeId || user?.employeeProfile?.id;
    if (!mechanicId) {
      const emp = await this.prisma.employee.findFirst({ where: { userId: actorUserId } });
      mechanicId = emp?.id;
    }
    if (!mechanicId && job.assignedMechanicId) {
      mechanicId = job.assignedMechanicId;
    }
    if (!mechanicId) {
      throw new BadRequestException('Mechanic identity required to record diagnosis');
    }

    const mechanic = await this.prisma.employee.findUnique({ where: { id: mechanicId } });
    if (!mechanic) {
      throw new NotFoundException(`Mechanic with ID '${mechanicId}' not found`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const diagnosis = await tx.serviceDiagnosis.create({
        data: {
          serviceJobId,
          mechanicId,
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

  async findByJob(serviceJobId: string, user?: any) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: serviceJobId },
      include: { branch: true },
    });
    if (!job) {
      throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');
      if (isCustomer) {
        const customerId = user.customerId || (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!customerId || job.customerId !== customerId) {
          throw new ForbiddenException('Cannot view diagnosis for another customer job');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && job.branchId !== user.branchId) {
          throw new ForbiddenException('Cannot view diagnosis for job in another branch');
        }
      }
    }

    return this.prisma.serviceDiagnosis.findMany({
      where: { serviceJobId },
      include: { mechanic: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToApproval(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    customerNotes?: string,
    actorUserId?: string,
    user?: any,
  ) {
    const approval = await this.prisma.serviceApproval.findUnique({
      where: { id: approvalId },
      include: { serviceJob: true },
    });

    if (!approval) {
      throw new NotFoundException(`Approval Request ID '${approvalId}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isCustomer = userRoles.includes('CUSTOMER');
      if (isCustomer) {
        const customerId = user.customerId || (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!customerId || approval.serviceJob.customerId !== customerId) {
          throw new ForbiddenException('Cannot respond to approval for another customer job');
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.serviceApproval.update({
        where: { id: approvalId },
        data: {
          decision,
          customerNotes: customerNotes || null,
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
      actorUserId: actorUserId || 'SYSTEM',
      action: `CUSTOMER_WORK_APPROVAL_${decision}`,
      entityType: 'ServiceApproval',
      entityId: approvalId,
      metadata: { serviceJobId: approval.serviceJobId, decision },
    }).catch(() => {});

    return updated;
  }
}
