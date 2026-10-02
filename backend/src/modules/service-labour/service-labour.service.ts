import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLabourDto } from './dto/create-labour.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceLabourService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateLabourDto, actorUserId: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: dto.serviceJobId },
    });

    if (!job) throw new NotFoundException(`Service Job ID '${dto.serviceJobId}' not found`);

    // Backend Monetary Calculation
    const hours = dto.hours;
    const hourlyRate = dto.hourlyRate;
    const discount = dto.discount || 0;
    const taxRate = dto.taxRate ?? 18;

    const baseAmount = hours * hourlyRate - discount;
    const taxAmount = Math.round(baseAmount * (taxRate / 100) * 100) / 100;
    const totalAmount = baseAmount + taxAmount;

    const labour = await this.prisma.serviceLabour.create({
      data: {
        serviceJobId: dto.serviceJobId,
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
    });

    return labour;
  }

  async findByJob(serviceJobId: string) {
    return this.prisma.serviceLabour.findMany({
      where: { serviceJobId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
