import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdateStockDto, IssuePartToJobDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createPart(dto: CreatePartDto, actorUserId: string) {
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
    });

    return part;
  }

  async updateStock(dto: UpdateStockDto, actorUserId: string) {
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
    });

    return result;
  }

  async issuePartToJob(dto: IssuePartToJobDto, actorUserId: string) {
    const job = await this.prisma.serviceJob.findUnique({ where: { id: dto.serviceJobId } });
    if (!job) throw new NotFoundException(`Service Job ID '${dto.serviceJobId}' not found`);

    const part = await this.prisma.part.findUnique({ where: { id: dto.partId } });
    if (!part) throw new NotFoundException(`Part ID '${dto.partId}' not found`);

    // Deduct Stock in Branch & Create ServiceJobPart record
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
    });

    return result;
  }

  async findAllParts(category?: string, limit = 50, offset = 0) {
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

    return { items, total, limit, offset };
  }

  async findStockByBranch(branchId: string) {
    return this.prisma.partStock.findMany({
      where: { branchId },
      include: { part: true },
    });
  }
}
