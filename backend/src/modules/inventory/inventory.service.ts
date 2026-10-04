import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { AuditService } from '../audit/audit.service';
import { VehicleStatus } from '@prisma/client';

const ALLOWED_STATUS_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  IN_STOCK: ['RESERVED', 'ALLOCATED', 'SERVICE', 'BLOCKED', 'TRANSFERRED'],
  RESERVED: ['IN_STOCK', 'ALLOCATED', 'BLOCKED'],
  ALLOCATED: ['RESERVED', 'PDI_PENDING', 'PDI_COMPLETED'],
  PDI_PENDING: ['PDI_COMPLETED', 'SERVICE', 'ALLOCATED'],
  PDI_COMPLETED: ['DELIVERED', 'PDI_PENDING'],
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

  async create(dto: CreateVehicleDto, actorUserId: string) {
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

    // Validate branch exists and is active
    let branch = await this.prisma.branch.findFirst({
      where: {
        OR: [{ id: dto.branchId }, { code: dto.branchId }],
      },
    });
    if (!branch) {
      branch = await this.prisma.branch.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!branch) {
      throw new NotFoundException(`No active branch found for vehicle assignment`);
    }
    if (branch.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot add vehicle to inactive branch '${branch.name}'`);
    }

    // Validate variant exists
    let variant: any = null;
    if (dto.variantId) {
      variant = await this.prisma.truckVariant.findFirst({
        where: {
          OR: [{ id: dto.variantId }, { name: dto.variantId }],
        },
      });
    }
    if (!variant && dto.model) {
      variant = await this.prisma.truckVariant.findFirst({
        where: {
          OR: [
            { name: { contains: dto.model, mode: 'insensitive' } },
            { model: { name: { contains: dto.model, mode: 'insensitive' } } },
          ],
        },
      });
    }
    if (!variant) {
      variant = await this.prisma.truckVariant.findFirst();
    }
    if (!variant) {
      throw new NotFoundException(`No truck variant found for vehicle`);
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

  async findAll(branchId?: string, status?: VehicleStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

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

  async findOne(id: string) {
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
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID '${id}' not found`);
    }

    return vehicle;
  }

  async update(id: string, dto: Partial<CreateVehicleDto>, actorUserId: string) {
    const vehicle = await this.findOne(id);

    if (['SOLD', 'DELIVERED'].includes(vehicle.status) && (dto.sellingPrice || dto.baseCost)) {
      throw new BadRequestException('Cannot modify pricing on a sold/delivered vehicle');
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        color: dto.color,
        sellingPrice: dto.sellingPrice,
        baseCost: dto.baseCost,
        images: dto.images,
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
      metadata: { vin: vehicle.vin },
    }).catch(() => {});

    return updated;
  }

  async updateStatus(id: string, newStatus: VehicleStatus, actorUserId: string) {
    const vehicle = await this.findOne(id);

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

  async deactivate(id: string, actorUserId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
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

  async allocateVehicle(id: string, bookingId: string, actorUserId: string) {
    const vehicle = await this.findOne(id);
    if (vehicle.status !== 'IN_STOCK' && vehicle.status !== 'RESERVED') {
      throw new BadRequestException(`Cannot allocate vehicle in status '${vehicle.status}'`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const allocation = await tx.vehicleAllocation.create({
        data: {
          vehicleId: id,
          bookingId,
          allocatedByUserId: actorUserId,
          previousVehicleStatus: vehicle.status,
        },
      });

      await tx.vehicle.update({
        where: { id },
        data: { status: 'ALLOCATED' },
      });

      if (bookingId) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { vehicleId: id, status: 'CONFIRMED' },
        }).catch(() => {});
      }

      await this.auditService.log({
        actorUserId,
        action: 'VEHICLE_ALLOCATED',
        entityType: 'Vehicle',
        entityId: id,
        metadata: { bookingId },
      }).catch(() => {});

      return { ...allocation, status: 'ALLOCATED' };
    });
  }
}
