import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateServiceQcDto } from './dto/create-service-qc.dto';
import { AuditService } from '../audit/audit.service';
import { DEV_SERVICE_JOBS } from '../service-jobs/service-jobs.service';

export const DEV_SERVICE_QC: any[] = [];

@Injectable()
export class ServiceQcService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateServiceQcDto, inspectorUserId: string) {
    const serviceJobId = dto.serviceJobId || 'job-dev-01';

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const job = await this.prisma.serviceJob.findUnique({
        where: { id: serviceJobId },
      });
      if (!job) throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);

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
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    const newQc = {
      id: `qc-${Date.now()}`,
      serviceJobId,
      inspectorUserId,
      checklist: dto.checklist,
      status: dto.status,
      failedItems: dto.failedItems || [],
      remarks: dto.remarks || null,
      images: dto.images || [],
      createdAt: new Date().toISOString(),
    };
    DEV_SERVICE_QC.unshift(newQc);

    const devJob = DEV_SERVICE_JOBS.find((j) => j.id === serviceJobId);
    if (devJob) {
      if (dto.status === 'PASSED') devJob.status = 'READY_FOR_DELIVERY';
      else if (dto.status === 'FAILED') devJob.status = 'IN_PROGRESS';
      if (!devJob.qcInspections) devJob.qcInspections = [];
      devJob.qcInspections.push(newQc);
    }

    return newQc;
  }

  async findByJob(serviceJobId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const items = await this.prisma.serviceQc.findMany({
        where: { serviceJobId },
        orderBy: { createdAt: 'desc' },
      });
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_SERVICE_QC.filter((q) => q.serviceJobId === serviceJobId);
  }
}
