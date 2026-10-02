import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateServiceQcDto } from './dto/create-service-qc.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceQcService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateServiceQcDto, inspectorUserId: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: dto.serviceJobId },
    });
    if (!job) throw new NotFoundException(`Service Job ID '${dto.serviceJobId}' not found`);

    const result = await this.prisma.$transaction(async (tx) => {
      const qc = await tx.serviceQc.create({
        data: {
          serviceJobId: dto.serviceJobId,
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
          where: { id: dto.serviceJobId },
          data: { status: 'READY_FOR_DELIVERY' },
        });
      } else if (dto.status === 'FAILED') {
        await tx.serviceJob.update({
          where: { id: dto.serviceJobId },
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
    });

    return result;
  }

  async findByJob(serviceJobId: string) {
    return this.prisma.serviceQc.findMany({
      where: { serviceJobId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
