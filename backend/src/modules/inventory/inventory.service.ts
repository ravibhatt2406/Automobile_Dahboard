import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { AuditService } from '../audit/audit.service';
import { VehicleStatus } from '@prisma/client';

const ALLOWED_STATUS_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  IN_STOCK: ['RESERVED', 'ALLOCATED', 'SERVICE', 'BLOCKED', 'TRANSFERRED'],
  RESERVED: ['IN_STOCK', 'ALLOCATED', 'BLOCKED'],
  ALLOCATED: ['IN_STOCK', 'RESERVED', 'PDI_PENDING', 'PDI_COMPLETED', 'BLOCKED'],
  PDI_PENDING: ['PDI_COMPLETED', 'SERVICE', 'ALLOCATED', 'IN_STOCK'],
  PDI_COMPLETED: ['DELIVERED', 'PDI_PENDING', 'IN_STOCK'],
  DELIVERED: ['SOLD'],
  SOLD: [],
  SERVICE: ['IN_STOCK', 'PDI_PENDING'],
  TRANSFERRED: ['IN_STOCK'],
  BLOCKED: ['IN_STOCK'],
};

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateVehicleDto, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const existingVin = await this.prisma.vehicle.findUnique({
      where: { vin: dto.vin },
    });
    if (existingVin) {
      throw new ConflictException(`VIN/Chassis '${dto.vin}' already exists in inventory`);
    }

    const existingEngine = await this.prisma.vehicle.findUnique({
      where: { engineNumber: dto.engineNumber },
    });
    if (existingEngine) {
      throw new ConflictException(`Engine Number '${dto.engineNumber}' already exists`);
    }

    if (!dto.branchId) {
      throw new BadRequestException('branchId is required');
    }

    // Validate branch exists - NO SILENT FALLBACK
    const branch = await this.prisma.branch.findFirst({
      where: {
        OR: [{ id: dto.branchId }, { code: dto.branchId }],
      },
      include: { franchise: true },
    });
    if (!branch) {
      throw new NotFoundException(`Branch '${dto.branchId}' not found`);
    }
    if (branch.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot add vehicle to inactive branch '${branch.name}'`);
    }

    // Scope check on creator
    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const userBranchId = user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
        const userFranchiseId = user.franchiseId || user.assignedFranchiseId || user.employeeProfile?.branch?.franchiseId;
        const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
        if (isFranchiseLevel) {
          if (branch.franchiseId !== userFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Cannot add vehicle to another franchise');
          }
        } else {
          if (branch.id !== userBranchId && branch.code !== userBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Cannot add vehicle to another branch');
          }
        }
      }
    }

    if (!dto.variantId) {
      throw new BadRequestException('variantId is required');
    }

    // Validate variant exists - NO SILENT FALLBACK
    const variant = await this.prisma.truckVariant.findFirst({
      where: {
        OR: [{ id: dto.variantId }, { name: dto.variantId }],
      },
    });
    if (!variant) {
      throw new NotFoundException(`Truck variant '${dto.variantId}' not found`);
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        vin: dto.vin,
        engineNumber: dto.engineNumber,
        variantId: variant.id,
        branchId: branch.id,
        manufacturingYear: dto.manufacturingYear,
        color: dto.color,
        baseCost: dto.baseCost,
        sellingPrice: dto.sellingPrice,
        images: dto.images || [],
        status: 'IN_STOCK',
      },
      include: {
        variant: { include: { model: { include: { manufacturer: true } } } },
        branch: true,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'VEHICLE_CREATED',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      metadata: { vin: vehicle.vin, branchId: vehicle.branchId },
    }).catch(() => {});

    return vehicle;
  }

  async findAll(
    branchId?: string,
    status?: VehicleStatus,
    variantId?: string,
    search?: string,
    limit = 50,
    offset = 0,
    user?: any,
  ) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isCustomer = user?.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user?.employeeProfile);

    const where: any = {};
    if (status) where.status = status;
    if (variantId) where.variantId = variantId;

    if (user && isCustomer) {
      const customerId = user.customerId || user.customerProfile?.id;
      if (!customerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = customerId;
    } else if (user && !isSuperAdmin) {
      const userBranchId = user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
      const userFranchiseId = user.franchiseId || user.assignedFranchiseId || user.employeeProfile?.branch?.franchiseId;

      if (isFranchiseLevel) {
        if (branchId) {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (!b || b.franchiseId !== userFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
          where.branchId = b.id;
        } else {
          where.branch = { franchiseId: userFranchiseId };
        }
      } else {
        // Branch Level
        if (
          branchId &&
          branchId !== userBranchId &&
          branchId !== user.employeeProfile?.branch?.code
        ) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
        }
        where.branchId = userBranchId;
      }
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { vin: { contains: q, mode: 'insensitive' as const } },
        { engineNumber: { contains: q, mode: 'insensitive' as const } },
        { color: { contains: q, mode: 'insensitive' as const } },
        { variant: { name: { contains: q, mode: 'insensitive' as const } } },
        { variant: { model: { name: { contains: q, mode: 'insensitive' as const } } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: { include: { model: { include: { manufacturer: true } } } },
          branch: true,
          customer: true,
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async getStockSummary(branchId?: string, user?: any) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
    const isCustomer = user?.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user?.employeeProfile);

    const where: any = {};

    if (user && isCustomer) {
      const customerId = user.customerId || user.customerProfile?.id;
      if (!customerId) {
        return {
          totalVehicles: 0,
          inStock: 0,
          reserved: 0,
          allocated: 0,
          service: 0,
          delivered: 0,
          sold: 0,
          blocked: 0,
          pdiPending: 0,
          pdiCompleted: 0,
          totalValue: 0,
        };
      }
      where.customerId = customerId;
    } else if (user && !isSuperAdmin) {
      const userBranchId = user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
      const userFranchiseId = user.franchiseId || user.assignedFranchiseId || user.employeeProfile?.branch?.franchiseId;

      if (isFranchiseLevel) {
        if (branchId) {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (b && b.franchiseId === userFranchiseId) {
            where.branchId = b.id;
          } else {
            where.branch = { franchiseId: userFranchiseId };
          }
        } else {
          where.branch = { franchiseId: userFranchiseId };
        }
      } else {
        where.branchId = userBranchId;
      }
    } else if (branchId) {
      where.branchId = branchId;
    }

    const [statusCounts, inStockSum] = await Promise.all([
      this.prisma.vehicle.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.vehicle.aggregate({
        where: { ...where, status: 'IN_STOCK' },
        _sum: { sellingPrice: true },
      }),
    ]);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const sc of statusCounts) {
      counts[sc.status] = sc._count.status;
      total += sc._count.status;
    }

    return {
      totalVehicles: total,
      inStock: counts['IN_STOCK'] || 0,
      reserved: counts['RESERVED'] || 0,
      allocated: counts['ALLOCATED'] || 0,
      service: counts['SERVICE'] || 0,
      delivered: counts['DELIVERED'] || 0,
      sold: counts['SOLD'] || 0,
      blocked: counts['BLOCKED'] || 0,
      pdiPending: counts['PDI_PENDING'] || 0,
      pdiCompleted: counts['PDI_COMPLETED'] || 0,
      totalValue: Number(inStockSum._sum.sellingPrice || 0),
    };
  }

  async findOne(id: string, user?: any) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        variant: { include: { model: { include: { manufacturer: true } } } },
        branch: { include: { franchise: true } },
        customer: true,
        bookings: { include: { customer: true } },
        pdiInspections: { orderBy: { inspectionDate: 'desc' } },
        allocations: { orderBy: { allocatedAt: 'desc' } },
        deliveries: true,
        serviceJobs: {
          include: {
            assignedMechanic: {
              include: { user: { select: { id: true, email: true, phone: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID '${id}' not found`);
    }

    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const isCustomer = user.accountType === 'CUSTOMER' || (roles.includes('CUSTOMER') && !user.employeeProfile);
        if (isCustomer) {
          const customerId = user.customerProfile?.id || user.customerId;
          if (!vehicle.customerId || vehicle.customerId !== customerId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized vehicle access');
          }
        } else {
          const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
          const userFranchiseId = user.assignedFranchiseId || user.franchiseId || user.employeeProfile?.branch?.franchiseId;
          const userBranchId = user.assignedBranchId || user.branchId || user.employeeProfile?.branchId;

          if (isFranchiseLevel) {
            if (userFranchiseId && vehicle.branch?.franchiseId !== userFranchiseId) {
              throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
            }
          } else {
            // Branch level
            if (userBranchId && vehicle.branchId !== userBranchId && vehicle.branch?.code !== userBranchId) {
              throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
            }
          }
        }
      }
    }

    return vehicle;
  }

  async update(id: string, dto: Partial<CreateVehicleDto>, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const vehicle = await this.findOne(id, user);

    if (['SOLD', 'DELIVERED'].includes(vehicle.status) && (dto.sellingPrice || dto.baseCost)) {
      throw new BadRequestException('Cannot modify pricing on a sold/delivered vehicle');
    }

    let variantId = vehicle.variantId;
    if (dto.variantId && dto.variantId !== vehicle.variantId) {
      const variant = await this.prisma.truckVariant.findFirst({
        where: { OR: [{ id: dto.variantId }, { name: dto.variantId }] },
      });
      if (!variant) {
        throw new NotFoundException(`Truck variant '${dto.variantId}' not found`);
      }
      variantId = variant.id;
    }

    let branchId = vehicle.branchId;
    if (dto.branchId && dto.branchId !== vehicle.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { OR: [{ id: dto.branchId }, { code: dto.branchId }] },
      });
      if (!branch) {
        throw new NotFoundException(`Branch '${dto.branchId}' not found`);
      }
      if (branch.status !== 'ACTIVE') {
        throw new BadRequestException(`Cannot reassign vehicle to inactive branch '${branch.name}'`);
      }

      if (user) {
        const roles: string[] = user.roles || [];
        const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
        if (!isSuperAdmin) {
          const userBranchId = user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
          const userFranchiseId = user.franchiseId || user.assignedFranchiseId || user.employeeProfile?.branch?.franchiseId;
          const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
          if (isFranchiseLevel) {
            if (branch.franchiseId !== userFranchiseId) {
              throw new ForbiddenException('Multi-tenant scope violation: Cannot transfer vehicle to another franchise');
            }
          } else {
            if (branch.id !== userBranchId && branch.code !== userBranchId) {
              throw new ForbiddenException('Multi-tenant scope violation: Cannot transfer vehicle to another branch');
            }
          }
        }
      }
      branchId = branch.id;
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        color: dto.color ?? vehicle.color,
        sellingPrice: dto.sellingPrice !== undefined ? dto.sellingPrice : vehicle.sellingPrice,
        baseCost: dto.baseCost !== undefined ? dto.baseCost : vehicle.baseCost,
        images: dto.images ?? vehicle.images,
        manufacturingYear: dto.manufacturingYear ?? vehicle.manufacturingYear,
        variantId,
        branchId,
      },
      include: {
        variant: { include: { model: { include: { manufacturer: true } } } },
        branch: true,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'VEHICLE_UPDATED',
      entityType: 'Vehicle',
      entityId: id,
      metadata: { vin: vehicle.vin, branchId, variantId },
    }).catch(() => {});

    return updated;
  }

  async updateStatus(id: string, newStatus: VehicleStatus, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const vehicle = await this.findOne(id, user);

    if (vehicle.status === newStatus) {
      return vehicle;
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[vehicle.status as VehicleStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid vehicle status transition: Cannot transition from '${vehicle.status}' to '${newStatus}'`,
      );
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.auditService.log({
      actorUserId,
      action: 'VEHICLE_STATUS_CHANGED',
      entityType: 'Vehicle',
      entityId: id,
      metadata: { previousStatus: vehicle.status, newStatus },
    }).catch(() => {});

    return updated;
  }

  async deactivate(id: string, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    const targetVehicle = await this.findOne(id, user);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: targetVehicle.id },
      include: {
        _count: {
          select: {
            bookings: true,
            pdiInspections: true,
            deliveries: true,
            serviceJobs: true,
            invoices: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID '${id}' not found`);
    }

    const counts = vehicle._count;
    const hasHistory =
      counts.bookings > 0 ||
      counts.pdiInspections > 0 ||
      counts.deliveries > 0 ||
      counts.serviceJobs > 0 ||
      counts.invoices > 0;

    if (hasHistory) {
      // Soft deactivate - mark as BLOCKED
      const updated = await this.prisma.vehicle.update({
        where: { id },
        data: { status: 'BLOCKED' },
      });

      await this.auditService.log({
        actorUserId,
        action: 'VEHICLE_DEACTIVATED',
        entityType: 'Vehicle',
        entityId: id,
        metadata: { vin: vehicle.vin, reason: 'Has historical records, soft deactivated' },
      }).catch(() => {});

      return {
        success: true,
        message: `Vehicle '${vehicle.vin}' deactivated (has historical records, preserved)`,
        vehicle: updated,
      };
    }

    // Safe to hard delete if no history
    await this.prisma.vehicle.delete({ where: { id } });

    await this.auditService.log({
      actorUserId,
      action: 'VEHICLE_DELETED',
      entityType: 'Vehicle',
      entityId: id,
      metadata: { vin: vehicle.vin },
    }).catch(() => {});

    return { success: true, message: `Vehicle '${vehicle.vin}' permanently removed` };
  }

  async allocateVehicle(id: string, bookingId: string, userOrId: any) {
    const actorUserId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const user = typeof userOrId === 'object' ? userOrId : null;

    if (!bookingId) {
      throw new BadRequestException('bookingId is required to allocate a vehicle');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { quotation: true, customer: true, branch: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking ID '${bookingId}' not found`);
    }
    if (['CANCELLED', 'CONVERTED_TO_DELIVERY'].includes(booking.status)) {
      throw new BadRequestException(`Cannot allocate vehicle to a ${booking.status} booking`);
    }

    // Branch scoping for the actor
    if (user) {
      const roles: string[] = user.roles || [];
      const isSuperAdmin = user.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin) {
        const userBranchId = user.branchId || user.assignedBranchId || user.employeeProfile?.branchId;
        const userFranchiseId = user.franchiseId || user.assignedFranchiseId || user.employeeProfile?.branch?.franchiseId;
        const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));
        if (isFranchiseLevel) {
          if (booking.branch?.franchiseId !== userFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Cannot allocate across franchises');
          }
        } else {
          if (booking.branchId !== userBranchId && booking.branch?.code !== userBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Cannot allocate across branches');
          }
        }
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // Row-level lock on the vehicle in PostgreSQL to prevent race-condition double allocation
      const [lockedVehicle] = await tx.$queryRaw<any[]>`
        SELECT id, status, branch_id, variant_id, vin FROM vehicles
        WHERE id = ${id} FOR UPDATE
      `;
      if (!lockedVehicle) {
        throw new NotFoundException(`Vehicle ID '${id}' not found`);
      }

      if (['SOLD', 'DELIVERED'].includes(lockedVehicle.status)) {
        throw new ConflictException(
          `Vehicle '${lockedVehicle.vin}' is already ${lockedVehicle.status} and cannot be allocated`
        );
      }

      if (!['IN_STOCK', 'RESERVED'].includes(lockedVehicle.status)) {
        throw new ConflictException(
          `Vehicle '${lockedVehicle.vin}' is not available for allocation (current status: ${lockedVehicle.status})`
        );
      }

      // Validate branch matches booking branch
      if (lockedVehicle.branch_id !== booking.branchId) {
        throw new BadRequestException(
          `Branch mismatch: Vehicle belongs to branch '${lockedVehicle.branch_id}' but booking belongs to branch '${booking.branchId}'`
        );
      }

      // Validate variant matches booking quotation variant if quotation has variantId
      if (booking.quotation?.variantId && lockedVehicle.variant_id !== booking.quotation.variantId) {
        throw new BadRequestException(
          `Variant mismatch: Vehicle variant does not match booking quotation variant`
        );
      }

      // Check if booking already had another vehicle allocated
      if (booking.vehicleId && booking.vehicleId !== id) {
        const previousVehicle = await tx.vehicle.findUnique({ where: { id: booking.vehicleId } });
        if (previousVehicle && previousVehicle.status === 'ALLOCATED') {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: { status: 'IN_STOCK' },
          });
        }
      }

      const allocation = await tx.vehicleAllocation.create({
        data: {
          vehicleId: id,
          bookingId,
          allocatedByUserId: actorUserId || 'SYSTEM',
          previousVehicleStatus: lockedVehicle.status,
          notes: `Allocated to booking ${booking.bookingNumber}`,
        },
      });

      await tx.vehicle.update({
        where: { id },
        data: { status: 'ALLOCATED' },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { vehicleId: id, status: 'CONFIRMED' },
      });

      await this.auditService.log({
        actorUserId: actorUserId || 'SYSTEM',
        action: 'VEHICLE_ALLOCATED',
        entityType: 'Vehicle',
        entityId: id,
        metadata: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          previousStatus: lockedVehicle.status,
          newStatus: 'ALLOCATED',
        },
      }).catch(() => {});

      return { ...allocation, status: 'ALLOCATED', bookingNumber: booking.bookingNumber };
    });
  }

  async getHistory(id: string, user?: any) {
    const vehicle = await this.findOne(id, user);

    const [allocations, pdiInspections, deliveries, auditLogs] = await Promise.all([
      this.prisma.vehicleAllocation.findMany({
        where: { vehicleId: id },
        orderBy: { allocatedAt: 'desc' },
        include: { booking: { include: { customer: true } } },
      }),
      this.prisma.pdiInspection.findMany({
        where: { vehicleId: id },
        orderBy: { inspectionDate: 'desc' },
      }),
      this.prisma.delivery.findMany({
        where: { vehicleId: id },
        orderBy: { deliveryDate: 'desc' },
        include: { customer: true, booking: true },
      }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'Vehicle', entityId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      vehicleId: id,
      vin: vehicle.vin,
      currentStatus: vehicle.status,
      allocations,
      pdiInspections,
      deliveries,
      auditLogs,
    };
  }
}
