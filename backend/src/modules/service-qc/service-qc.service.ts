import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateServiceQcDto } from './dto/create-service-qc.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceQcService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateServiceQcDto, inspectorUserId: string, user?: any) {
    if (!dto.serviceJobId) {
      throw new BadRequestException('serviceJobId is required');
    }
    const serviceJobId: string = dto.serviceJobId;

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
          throw new ForbiddenException('Cannot perform QC on a job in another branch');
        }
        if (user.franchiseId && job.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot perform QC on a job in another franchise');
        }
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const qc = await tx.serviceQc.create({
        data: {
          serviceJobId,
          inspectorUserId,
          checklist: dto.checklist,
          status: dto.status,
          failedItems: dto.failedItems || [],
          remarks: dto.remarks || null,
          images: dto.images || [],
        },
      });

      if (dto.status === 'PASSED') {
        await tx.serviceJob.update({
          where: { id: serviceJobId },
          data: { status: 'READY_FOR_DELIVERY' },
        });
      } else if (dto.status === 'FAILED') {
        await tx.serviceJob.update({
          where: { id: serviceJobId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return qc;
    });

    await this.auditService.log({
      actorUserId: inspectorUserId,
      action: `SERVICE_QC_${dto.status}`,
      entityType: 'ServiceQc',
      entityId: result.id,
      metadata: { serviceJobId: dto.serviceJobId, status: dto.status },
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
          throw new ForbiddenException('Cannot view QC for another customer job');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && job.branchId !== user.branchId) {
          throw new ForbiddenException('Cannot view QC for job in another branch');
        }
      }
    }

    return this.prisma.serviceQc.findMany({
      where: { serviceJobId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
