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

    const vehicle = await this.prisma.vehicle.create({
      data: {
        vin: dto.vin,
        engineNumber: dto.engineNumber,
        variantId: dto.variantId,
        branchId: dto.branchId,
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
    });

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

  async updateStatus(id: string, newStatus: VehicleStatus, actorUserId: string) {
    const vehicle = await this.findOne(id);

    if (vehicle.status === newStatus) {
      return vehicle;
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[vehicle.status] || [];
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
    });

    return updated;
  }
}
