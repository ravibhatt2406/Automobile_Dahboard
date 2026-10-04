import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePdiDto } from './dto/create-pdi.dto';
import { AuditService } from '../audit/audit.service';
import { PdiStatus } from '@prisma/client';

@Injectable()
export class PdiService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePdiDto, inspectorUserId: string) {
    const initialStatus = (dto.status as PdiStatus) || (dto.failedItems && dto.failedItems.length > 0 ? PdiStatus.FAILED : PdiStatus.PASSED);

    if (!dto.vehicleId) {
      throw new BadRequestException('Vehicle ID is required for PDI inspection');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const pdi = await tx.pdiInspection.create({
        data: {
          vehicleId: dto.vehicleId!,
          bookingId: dto.bookingId || null,
          inspectorUserId,
          checklist: dto.checklist,
          status: initialStatus,
          failedItems: dto.failedItems || [],
          remarks: dto.remarks || null,
          images: dto.images || [],
        },
      });

      if (initialStatus === PdiStatus.PASSED) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: 'PDI_COMPLETED' },
        });
      } else if (initialStatus === PdiStatus.FAILED) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: 'SERVICE' },
        });
      }

      return pdi;
    });

    await this.auditService.log({
      actorUserId: inspectorUserId,
      action: `PDI_INSPECTION_${initialStatus}`,
      entityType: 'PdiInspection',
      entityId: result.id,
      metadata: { vehicleId: dto.vehicleId, status: initialStatus },
    }).catch(() => {});

    return result;
  }

  async update(id: string, updates: Partial<CreatePdiDto>, actorUserId: string) {
    const pdi = await this.findOne(id);
    const newStatus = (updates.status as PdiStatus) || (updates.failedItems && updates.failedItems.length > 0 ? PdiStatus.FAILED : pdi.status);

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPdi = await tx.pdiInspection.update({
        where: { id },
        data: {
          checklist: (updates.checklist as any) || (pdi.checklist as any),
          status: newStatus,
          failedItems: updates.failedItems ?? pdi.failedItems,
          remarks: updates.remarks ?? pdi.remarks,
          images: updates.images ?? pdi.images,
        },
      });

      if (newStatus === PdiStatus.PASSED) {
        await tx.vehicle.update({
          where: { id: pdi.vehicleId },
          data: { status: 'PDI_COMPLETED' },
        });
      }

      return updatedPdi;
    });

    await this.auditService.log({
      actorUserId,
      action: `PDI_INSPECTION_UPDATED_${newStatus}`,
      entityType: 'PdiInspection',
      entityId: id,
      metadata: { vehicleId: pdi.vehicleId, status: newStatus },
    }).catch(() => {});

    return result;
  }

  async findByVehicle(vehicleId: string) {
    return this.prisma.pdiInspection.findMany({
      where: { vehicleId },
      orderBy: { inspectionDate: 'desc' },
      include: { vehicle: true },
    });
  }

  async findOne(id: string) {
    const pdi = await this.prisma.pdiInspection.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!pdi) {
      throw new NotFoundException(`PDI inspection with ID ${id} not found`);
    }

    return pdi;
  }
}
