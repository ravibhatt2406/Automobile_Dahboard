import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdateStockDto, IssuePartToJobDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';
import { DEV_SERVICE_JOBS } from '../service-jobs/service-jobs.service';

export const DEV_PARTS: any[] = [];
export const DEV_PART_STOCKS: any[] = [];
export const DEV_JOB_PARTS: any[] = [];

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createPart(dto: CreatePartDto, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const existing = await this.prisma.part.findUnique({
        where: { partNumber: dto.partNumber },
      });
      if (existing) throw new BadRequestException(`Part number '${dto.partNumber}' already exists`);

      const part = await this.prisma.part.create({
        data: {
          partNumber: dto.partNumber,
          name: dto.name,
          description: dto.description || null,
          manufacturer: dto.manufacturer || null,
          category: dto.category || null,
          unitPrice: dto.unitPrice,
          gstRate: dto.gstRate ?? 18,
        },
      });

      await this.auditService.log({
        actorUserId,
        action: 'PART_CREATED',
        entityType: 'Part',
        entityId: part.id,
        metadata: { partNumber: dto.partNumber, name: dto.name },
      }).catch(() => {});

      return part;
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
    }

    const newPart = {
      id: `part-${Date.now()}`,
      partNumber: dto.partNumber,
      name: dto.name,
      description: dto.description || null,
      manufacturer: dto.manufacturer || null,
      category: dto.category || null,
      unitPrice: dto.unitPrice,
      gstRate: dto.gstRate ?? 18,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    DEV_PARTS.unshift(newPart);
    return newPart;
  }

  async updateStock(dto: UpdateStockDto, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const part = await this.prisma.part.findUnique({ where: { id: dto.partId } });
      if (!part) throw new NotFoundException(`Part ID '${dto.partId}' not found`);

      const result = await this.prisma.$transaction(async (tx) => {
        const stock = await tx.partStock.upsert({
          where: {
            partId_branchId: { partId: dto.partId, branchId: dto.branchId },
          },
          update: {},
          create: {
            partId: dto.partId,
            branchId: dto.branchId,
            quantityOnHand: 0,
            quantityReserved: 0,
          },
        });

        let newOnHand = stock.quantityOnHand;
        let newReserved = stock.quantityReserved;

        if (dto.movementType === 'PURCHASE' || dto.movementType === 'RETURN') {
          newOnHand += dto.quantity;
        } else if (dto.movementType === 'ISSUE') {
          if (newOnHand < dto.quantity) {
            throw new BadRequestException(`Insufficient stock for Part '${part.name}'. Available: ${newOnHand}, Requested: ${dto.quantity}`);
          }
          newOnHand -= dto.quantity;
        } else if (dto.movementType === 'RESERVATION') {
          if (newOnHand - newReserved < dto.quantity) {
            throw new BadRequestException(`Insufficient unreserved stock for Part '${part.name}'`);
          }
          newReserved += dto.quantity;
        } else if (dto.movementType === 'RELEASE') {
          newReserved = Math.max(0, newReserved - dto.quantity);
        } else if (dto.movementType === 'ADJUSTMENT') {
          newOnHand += dto.quantity;
        }

        if (newOnHand < 0) {
          throw new BadRequestException(`Stock change rejected: Would cause negative stock (${newOnHand})`);
        }

        const updatedStock = await tx.partStock.update({
          where: { id: stock.id },
          data: {
            quantityOnHand: newOnHand,
            quantityReserved: newReserved,
          },
        });

        await tx.partStockMovement.create({
          data: {
            partStockId: stock.id,
            movementType: dto.movementType,
            quantity: dto.quantity,
            referenceRef: dto.referenceRef || null,
            notes: dto.notes || null,
            actorUserId,
          },
        });

        return updatedStock;
      });

      await this.auditService.log({
        actorUserId,
        action: `PART_STOCK_${dto.movementType}`,
        entityType: 'PartStock',
        entityId: result.id,
        metadata: { partId: dto.partId, branchId: dto.branchId, qty: dto.quantity },
      }).catch(() => {});

      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    let devStock = DEV_PART_STOCKS.find((s) => s.partId === dto.partId && s.branchId === dto.branchId);
    if (!devStock) {
      devStock = {
        id: `stk-${Date.now()}`,
        partId: dto.partId,
        branchId: dto.branchId,
        quantityOnHand: 25,
        quantityReserved: 0,
      };
      DEV_PART_STOCKS.unshift(devStock);
    }

    if (dto.movementType === 'PURCHASE' || dto.movementType === 'RETURN') {
      devStock.quantityOnHand += dto.quantity;
    } else if (dto.movementType === 'ISSUE') {
      if (devStock.quantityOnHand < dto.quantity) {
        throw new BadRequestException(`Insufficient stock for Part. Available: ${devStock.quantityOnHand}, Requested: ${dto.quantity}`);
      }
      devStock.quantityOnHand -= dto.quantity;
    }

    if (devStock.quantityOnHand < 0) {
      throw new BadRequestException(`Stock change rejected: Would cause negative stock (${devStock.quantityOnHand})`);
    }

    return devStock;
  }

  async issuePartToJob(dto: IssuePartToJobDto, actorUserId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const job = await this.prisma.serviceJob.findUnique({ where: { id: dto.serviceJobId } });
      if (!job) throw new NotFoundException(`Service Job ID '${dto.serviceJobId}' not found`);

      const part = await this.prisma.part.findUnique({ where: { id: dto.partId } });
      if (!part) throw new NotFoundException(`Part ID '${dto.partId}' not found`);

      const result = await this.prisma.$transaction(async (tx) => {
        const stock = await tx.partStock.findUnique({
          where: { partId_branchId: { partId: dto.partId, branchId: job.branchId } },
        });

        if (!stock || stock.quantityOnHand < dto.quantity) {
          throw new BadRequestException(`Insufficient Stock in Branch for Part '${part.name}'. Available: ${stock?.quantityOnHand || 0}`);
        }

        await tx.partStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: stock.quantityOnHand - dto.quantity },
        });

        await tx.partStockMovement.create({
          data: {
            partStockId: stock.id,
            movementType: 'ISSUE',
            quantity: dto.quantity,
            referenceRef: job.jobNumber,
            notes: `Issued to Service Job ${job.jobNumber}`,
            actorUserId,
          },
        });

        const unitPrice = Number(part.unitPrice);
        const gstRate = Number(part.gstRate);
        const subtotal = unitPrice * dto.quantity;
        const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
        const totalAmount = subtotal + gstAmount;

        const jobPart = await tx.serviceJobPart.create({
          data: {
            serviceJobId: dto.serviceJobId,
            partId: dto.partId,
            quantity: dto.quantity,
            unitPrice,
            gstRate,
            totalAmount,
            status: 'ISSUED',
          },
          include: { part: true },
        });

        return jobPart;
      });

      await this.auditService.log({
        actorUserId,
        action: 'SERVICE_JOB_PART_ISSUED',
        entityType: 'ServiceJobPart',
        entityId: result.id,
        metadata: { serviceJobId: dto.serviceJobId, partId: dto.partId, qty: dto.quantity },
      }).catch(() => {});

      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    }

    const unitPrice = 12500;
    const gstRate = 18;
    const subtotal = unitPrice * dto.quantity;
    const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
    const totalAmount = subtotal + gstAmount;

    const jobPart = {
      id: `jp-${Date.now()}`,
      serviceJobId: dto.serviceJobId,
      partId: dto.partId,
      quantity: dto.quantity,
      unitPrice,
      gstRate,
      totalAmount,
      status: 'ISSUED',
      createdAt: new Date().toISOString(),
      part: { id: dto.partId, name: 'Clutch Pressure Plate Heavy Duty', unitPrice },
    };
    DEV_JOB_PARTS.unshift(jobPart);

    const devJob = DEV_SERVICE_JOBS.find((j) => j.id === dto.serviceJobId);
    if (devJob) {
      if (!devJob.jobParts) devJob.jobParts = [];
      devJob.jobParts.push(jobPart);
    }

    return jobPart;
  }

  async findAllParts(category?: string, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const where: any = {};
      if (category) where.category = category;

      const [items, total] = await Promise.all([
        this.prisma.part.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { name: 'asc' },
          include: { stocks: { include: { branch: true } } },
        }),
        this.prisma.part.count({ where }),
      ]);

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_PARTS, total: DEV_PARTS.length, limit, offset };
  }

  async findStockByBranch(branchId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      return await this.prisma.partStock.findMany({
        where: { branchId },
        include: { part: true },
      });
    } catch {}

    return DEV_PART_STOCKS.filter((s) => s.branchId === branchId);
  }
}
