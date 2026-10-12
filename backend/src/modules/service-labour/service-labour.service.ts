import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLabourDto } from './dto/create-labour.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceLabourService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateLabourDto, actorUserId: string, user?: any) {
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
          throw new ForbiddenException('Cannot add labour for a job in another branch');
        }
        if (user.franchiseId && job.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot add labour for a job in another franchise');
        }
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const labour = await tx.serviceLabour.create({
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

      const currentCost = Number(job.actualCost || 0);
      await tx.serviceJob.update({
        where: { id: serviceJobId },
        data: { actualCost: currentCost + totalAmount },
      });

      return labour;
    });

    await this.auditService.log({
      actorUserId,
      action: 'SERVICE_LABOUR_ADDED',
      entityType: 'ServiceLabour',
      entityId: result.id,
      metadata: { serviceJobId: dto.serviceJobId, totalAmount },
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
          throw new ForbiddenException('Cannot view labour for another customer job');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && job.branchId !== user.branchId) {
          throw new ForbiddenException('Cannot view labour for job in another branch');
        }
      }
    }

    return this.prisma.serviceLabour.findMany({
      where: { serviceJobId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
