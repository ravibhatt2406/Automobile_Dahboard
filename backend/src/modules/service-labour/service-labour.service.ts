import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    if (!dto.serviceJobId) {
      throw new BadRequestException('serviceJobId is required');
    }
    const serviceJobId: string = dto.serviceJobId;
    const hours = dto.hours;
    const hourlyRate = dto.hourlyRate;
    const discount = dto.discount || 0;
    const taxRate = dto.taxRate ?? 18;

    const baseAmount = hours * hourlyRate - discount;
    const taxAmount = Math.round(baseAmount * (taxRate / 100) * 100) / 100;
    const totalAmount = baseAmount + taxAmount;

    const job = await this.prisma.serviceJob.findUnique({
      where: { id: serviceJobId },
    });

    if (!job) {
      throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);
    }

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
  }

  async findByJob(serviceJobId: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: serviceJobId },
    });
    if (!job) {
      throw new NotFoundException(`Service Job ID '${serviceJobId}' not found`);
    }

    return this.prisma.serviceLabour.findMany({
      where: { serviceJobId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
