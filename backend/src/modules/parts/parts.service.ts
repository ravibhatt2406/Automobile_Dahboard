import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
    if (existing) {
      throw new BadRequestException(`Part number '${dto.partNumber}' already exists`);
    }

    let targetBranch: any = null;
    if (dto.branchId) {
      targetBranch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
      });
      if (!targetBranch) {
        throw new NotFoundException(`Branch '${dto.branchId}' not found`);
      }
      if (dto.franchiseId && targetBranch.franchiseId !== dto.franchiseId) {
        throw new BadRequestException(
          `Branch '${targetBranch.name}' does not belong to specified franchise '${dto.franchiseId}'`,
        );
      }
    } else if (dto.franchiseId) {
      const franchise = await this.prisma.franchise.findUnique({
        where: { id: dto.franchiseId },
      });
      if (!franchise) {
        throw new NotFoundException(`Franchise '${dto.franchiseId}' not found`);
      }
    }

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

    if (targetBranch) {
      const initialQty = dto.quantityOnHand ?? dto.stockQuantity ?? 0;
      await this.prisma.partStock.create({
        data: {
          partId: part.id,
          branchId: targetBranch.id,
          quantityOnHand: initialQty,
          quantityReserved: 0,
        },
      }).catch(() => {});
    }

    await this.auditService.log({
      actorUserId,
      action: 'PART_CREATED',
      entityType: 'Part',
      entityId: part.id,
      metadata: { partNumber: dto.partNumber, name: dto.name, branchId: targetBranch?.id },
    }).catch(() => {});

    return part;
  }

  async updateStock(dto: UpdateStockDto, actorUserId: string, user?: any) {
    const part = await this.prisma.part.findUnique({ where: { id: dto.partId } });
    if (!part) {
      throw new NotFoundException(`Part ID '${dto.partId}' not found`);
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch ID '${dto.branchId}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        if (user.branchId && user.branchId !== dto.branchId) {
          throw new ForbiddenException('Cannot update stock for another branch');
        }
        if (user.franchiseId && branch.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot update stock for another franchise');
        }
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let stock = await tx.partStock.findUnique({
        where: {
          partId_branchId: { partId: dto.partId, branchId: dto.branchId },
        },
      });

      if (!stock) {
        stock = await tx.partStock.create({
          data: {
            partId: dto.partId,
            branchId: dto.branchId,
            quantityOnHand: 0,
            quantityReserved: 0,
          },
        });
      }

      // Concurrency lock using PostgreSQL SELECT FOR UPDATE
      const [lockedStock] = await tx.$queryRaw<any[]>`
        SELECT id, quantity_on_hand, quantity_reserved
        FROM part_stocks
        WHERE id = ${stock.id}
        FOR UPDATE
      `;

      let newOnHand = lockedStock ? Number(lockedStock.quantity_on_hand) : stock.quantityOnHand;
      let newReserved = lockedStock ? Number(lockedStock.quantity_reserved) : stock.quantityReserved;

      if (dto.movementType === 'PURCHASE' || dto.movementType === 'RETURN') {
        newOnHand += dto.quantity;
      } else if (dto.movementType === 'ISSUE') {
        if (newOnHand < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for Part '${part.name}'. Available: ${newOnHand}, Requested: ${dto.quantity}`,
          );
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
        throw new BadRequestException(`Stock change rejected: Negative stock not permitted (${newOnHand})`);
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
  }

  async issuePartToJob(dto: IssuePartToJobDto, actorUserId: string, user?: any) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: dto.serviceJobId },
      include: { branch: true },
    });
    if (!job) {
      throw new NotFoundException(`Service Job ID '${dto.serviceJobId}' not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        if (user.branchId && job.branchId !== user.branchId) {
          throw new ForbiddenException('Cannot issue parts for a job in another branch');
        }
        if (user.franchiseId && job.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot issue parts for a job in another franchise');
        }
      }
    }

    const part = await this.prisma.part.findUnique({ where: { id: dto.partId } });
    if (!part) {
      throw new NotFoundException(`Part ID '${dto.partId}' not found`);
    }
    if (part.status !== 'ACTIVE') {
      throw new BadRequestException(`Part '${part.name}' is not ACTIVE`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let stock = await tx.partStock.findUnique({
        where: { partId_branchId: { partId: dto.partId, branchId: job.branchId } },
      });

      if (!stock) {
        stock = await tx.partStock.create({
          data: {
            partId: dto.partId,
            branchId: job.branchId,
            quantityOnHand: 0,
            quantityReserved: 0,
          },
        });
      }

      // Row-level lock to prevent concurrency race conditions
      const [lockedStock] = await tx.$queryRaw<any[]>`
        SELECT id, quantity_on_hand, quantity_reserved
        FROM part_stocks
        WHERE id = ${stock.id}
        FOR UPDATE
      `;

      const available = lockedStock ? Number(lockedStock.quantity_on_hand) : stock.quantityOnHand;
      if (available < dto.quantity) {
        throw new BadRequestException(
          `Insufficient Stock in Branch for Part '${part.name}'. Available: ${available}, Requested: ${dto.quantity}`,
        );
      }

      const newOnHand = available - dto.quantity;
      if (newOnHand < 0) {
        throw new BadRequestException(`Stock change rejected: Negative stock not permitted`);
      }

      await tx.partStock.update({
        where: { id: stock.id },
        data: { quantityOnHand: newOnHand },
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

      // Update job actualCost and transition from WAITING_FOR_PARTS to IN_PROGRESS if needed
      const currentCost = Number(job.actualCost || 0);
      await tx.serviceJob.update({
        where: { id: dto.serviceJobId },
        data: {
          actualCost: currentCost + totalAmount,
          status: job.status === 'WAITING_FOR_PARTS' ? 'IN_PROGRESS' : job.status,
        },
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
  }

  async findOnePart(id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id },
      include: { stocks: { include: { branch: true } } },
    });
    if (!part) {
      throw new NotFoundException(`Part ID '${id}' not found`);
    }
    return part;
  }

  async updatePart(id: string, dto: Partial<CreatePartDto>, actorUserId?: string) {
    await this.findOnePart(id);
    const updated = await this.prisma.part.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        ...(dto.gstRate !== undefined && { gstRate: dto.gstRate }),
      },
      include: { stocks: { include: { branch: true } } },
    });

    if (actorUserId) {
      await this.auditService.log({
        actorUserId,
        action: 'PART_UPDATED',
        entityType: 'Part',
        entityId: id,
        metadata: dto,
      }).catch(() => {});
    }

    return updated;
  }

  async findAllParts(
    category?: string,
    search?: string,
    branchId?: string,
    limit = 50,
    offset = 0,
    user?: any,
    franchiseId?: string,
  ) {
    const roles: string[] = user?.roles || [];
    const scope = user?.effectiveScope;
    const isSuperAdmin = scope ? scope.isActingSuperAdmin : (user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN'));
    const isFranchiseLevel = scope ? scope.isActingFranchiseLevel : roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));

    const where: any = {};
    if (category && category !== 'ALL') where.category = category;

    if (user && !isSuperAdmin) {
      if (isFranchiseLevel) {
        const userFranchiseId = scope?.effectiveFranchiseId || user.franchiseId || user.assignedFranchiseId;
        if (franchiseId && franchiseId !== 'ALL' && franchiseId !== userFranchiseId) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
        }
        if (branchId && branchId !== 'ALL') {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (!b || b.franchiseId !== userFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
          where.stocks = { some: { branchId: b.id } };
        } else {
          where.stocks = { some: { branch: { franchiseId: userFranchiseId } } };
        }
      } else {
        // Branch Level
        const userBranchId = scope?.effectiveBranchId || user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
        if (
          branchId &&
          branchId !== 'ALL' &&
          branchId !== userBranchId &&
          branchId !== user.employeeProfile?.branch?.code
        ) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
        }
        where.stocks = { some: { branchId: userBranchId } };
      }
    } else {
      // Super Admin or system internal
      if (franchiseId && franchiseId !== 'ALL') {
        if (branchId && branchId !== 'ALL') {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (b && b.franchiseId !== franchiseId) {
            throw new BadRequestException('Selected branch does not belong to the selected franchise');
          }
          where.stocks = { some: { branchId: b ? b.id : branchId } };
        } else {
          where.stocks = { some: { branch: { franchiseId } } };
        }
      } else if (branchId && branchId !== 'ALL') {
        const b = await this.prisma.branch.findFirst({
          where: { OR: [{ id: branchId }, { code: branchId }] },
        });
        where.stocks = { some: { branchId: b ? b.id : branchId } };
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { partNumber: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { manufacturer: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

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

  async findStockByBranch(branchId: string, user?: any) {
    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isFranchiseLevel = userRoles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
      if (!isSuperAdmin) {
        if (isFranchiseLevel) {
          const userFranchiseId = user.franchiseId || user.assignedFranchiseId;
          const branch = await this.prisma.branch.findFirst({ where: { id: branchId } });
          if (!branch || branch.franchiseId !== userFranchiseId) {
            throw new ForbiddenException('Cannot view stock for a branch in another franchise');
          }
        } else {
          if (user.branchId && user.branchId !== branchId) {
            throw new ForbiddenException('Cannot view stock for another branch');
          }
        }
      }
    }

    return this.prisma.partStock.findMany({
      where: { branchId },
      include: { part: true },
    });
  }
}
