import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLabourDto } from './dto/create-labour.dto';
import { AuditService } from '../audit/audit.service';
import { DEV_SERVICE_JOBS } from '../service-jobs/service-jobs.service';

export const DEV_SERVICE_LABOUR: any[] = [];

@Injectable()
export class ServiceLabourService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateLabourDto, actorUserId: string) {
    const serviceJobId = dto.serviceJobId || 'job-dev-01';
    const hours = dto.hours;
    const hourlyRate = dto.hourlyRate;
    const discount = dto.discount || 0;
    const taxRate = dto.taxRate ?? 18;

    const baseAmount = hours * hourlyRate - discount;
    const taxAmount = Math.round(baseAmount * (taxRate / 100) * 100) / 100;
    const totalAmount = baseAmount + taxAmount;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const job = await this.prisma.serviceJob.findUnique({
        where: { id: serviceJobId },
      });

      if (!job) throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);

      const labour = await this.prisma.serviceLabour.create({
        data: {
          serviceJobId,
          labourType: dto.labourType,
          description: dto.description,
          hours,
          hourlyRate,
          discount,
          taxRate,
          totalAmount,
        },
      });

      await this.auditService.log({
        actorUserId,
        action: 'SERVICE_LABOUR_ADDED',
        entityType: 'ServiceLabour',
        entityId: labour.id,
        metadata: { serviceJobId: dto.serviceJobId, totalAmount },
      }).catch(() => {});

      return labour;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
    }

    const newLabour = {
      id: `lab-${Date.now()}`,
      serviceJobId,
      labourType: dto.labourType,
      description: dto.description,
      hours,
      hourlyRate,
      discount,
      taxRate,
      totalAmount,
      createdAt: new Date().toISOString(),
    };
    DEV_SERVICE_LABOUR.unshift(newLabour);

    const devJob = DEV_SERVICE_JOBS.find((j) => j.id === serviceJobId);
    if (devJob) {
      if (!devJob.labourItems) devJob.labourItems = [];
      devJob.labourItems.push(newLabour);
    }

    return newLabour;
  }

  async findByJob(serviceJobId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const items = await this.prisma.serviceLabour.findMany({
        where: { serviceJobId },
        orderBy: { createdAt: 'desc' },
      });
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_SERVICE_LABOUR.filter((l) => l.serviceJobId === serviceJobId);
  }
}
