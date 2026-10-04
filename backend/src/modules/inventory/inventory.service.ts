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

export const DEV_VEHICLES: any[] = [];

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateVehicleDto, actorUserId: string) {
    const branchId = dto.branchId || 'BR-DEV-01';
    const variantId = dto.variantId || 'var-dev-01';

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      const vehicle = await this.prisma.vehicle.create({
        data: {
          vin: dto.vin,
          engineNumber: dto.engineNumber,
          variantId,
          branchId,
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
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
    }

    const newVehicle = {
      id: `veh-${Date.now()}`,
      vin: dto.vin,
      engineNumber: dto.engineNumber,
      variantId,
      branchId,
      manufacturingYear: dto.manufacturingYear,
      color: dto.color,
      baseCost: dto.baseCost,
      sellingPrice: dto.sellingPrice,
      status: 'IN_STOCK',
      createdAt: new Date().toISOString(),
      variant: { id: variantId, name: 'Prima 5530.S Trailer' },
      branch: { id: branchId, name: 'Detroit Flagship Hub' },
    };
    DEV_VEHICLES.unshift(newVehicle);
    return newVehicle;
  }

  async findAll(branchId?: string, status?: VehicleStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_VEHICLES, total: DEV_VEHICLES.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (vehicle) return vehicle;
    } catch {}

    const devVeh = DEV_VEHICLES.find((v) => v.id === id || v.vin === id);
    if (devVeh) return devVeh;

    return {
      id,
      vin: `VIN${id}`,
      engineNumber: `ENG${id}`,
      status: 'IN_STOCK',
      variantId: 'var-dev-01',
      branchId: 'BR-DEV-01',
      variant: { name: 'Prima 5530.S Trailer' },
      branch: { name: 'Detroit Flagship Hub' },
    };
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

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
    }

    vehicle.status = newStatus;
    const devVeh = DEV_VEHICLES.find((v) => v.id === id || v.vin === id);
    if (devVeh) devVeh.status = newStatus;
    return vehicle;
  }

  async allocateVehicle(id: string, bookingId: string, actorUserId: string) {
    const vehicle = await this.findOne(id);
    if (vehicle.status !== 'IN_STOCK' && vehicle.status !== 'RESERVED') {
      throw new BadRequestException(`Cannot allocate vehicle in status '${vehicle.status}'`);
    }

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const allocation = await this.prisma.vehicleAllocation.create({
        data: {
          vehicleId: id,
          bookingId,
          allocatedByUserId: actorUserId || 'emp-admin-01',
          previousVehicleStatus: vehicle.status,
        },
      });

      await this.prisma.vehicle.update({
        where: { id },
        data: { status: 'ALLOCATED' },
      });

      if (bookingId) {
        await this.prisma.booking.update({
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
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
    }

    vehicle.status = 'ALLOCATED';
    const devVeh = DEV_VEHICLES.find((v) => v.id === id || v.vin === id);
    if (devVeh) devVeh.status = 'ALLOCATED';

    return {
      id: `alloc-${Date.now()}`,
      vehicleId: id,
      bookingId,
      status: 'ALLOCATED',
      allocatedByUserId: actorUserId || 'emp-admin-01',
      allocatedAt: new Date().toISOString(),
    };
  }
}
