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
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);
    }

    const initialStatus = dto.status || (dto.failedItems && dto.failedItems.length > 0 ? 'FAILED' : 'PASSED');

    const result = await this.prisma.$transaction(async (tx) => {
      const pdi = await tx.pdiInspection.create({
        data: {
          vehicleId: dto.vehicleId,
          bookingId: dto.bookingId || null,
          inspectorUserId,
          checklist: dto.checklist,
          status: initialStatus,
          failedItems: dto.failedItems || [],
          remarks: dto.remarks || null,
          images: dto.images || [],
        },
      });

      if (initialStatus === 'PASSED') {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: 'PDI_COMPLETED' },
        });
      } else if (initialStatus === 'FAILED') {
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
      metadata: { vehicleId: dto.vehicleId, vin: vehicle.vin, status: initialStatus },
    });

    return result;
  }

  async update(id: string, updates: Partial<CreatePdiDto>, actorUserId: string) {
    const pdi = await this.findOne(id);

    const newStatus = updates.status || (updates.failedItems && updates.failedItems.length > 0 ? 'FAILED' : pdi.status);

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

      if (newStatus === 'PASSED') {
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
    });

    return result;
  }

  async findByVehicle(vehicleId: string) {
    return this.prisma.pdiInspection.findMany({
      where: { vehicleId },
      orderBy: { inspectionDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const pdi = await this.prisma.pdiInspection.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!pdi) {
      throw new NotFoundException(`PDI Inspection ID '${id}' not found`);
    }

    return pdi;
  }
}
