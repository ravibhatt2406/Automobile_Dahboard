import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePdiDto } from './dto/create-pdi.dto';
import { AuditService } from '../audit/audit.service';
import { PdiStatus } from '@prisma/client';
import { DEV_VEHICLES } from '../inventory/inventory.service';

const DEV_PDIS: any[] = [];

@Injectable()
export class PdiService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePdiDto, inspectorUserId: string) {
    const initialStatus = dto.status || (dto.failedItems && dto.failedItems.length > 0 ? 'FAILED' : 'PASSED');

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const vehicleId = dto.vehicleId || 'veh-dev-01';
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      const result = await this.prisma.$transaction(async (tx) => {
        const pdi = await tx.pdiInspection.create({
          data: {
            vehicleId,
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
        metadata: { vehicleId: dto.vehicleId, status: initialStatus },
      }).catch(() => {});

      return result;
    } catch {}

    if (dto.vehicleId) {
      const devVeh = DEV_VEHICLES.find((v) => v.id === dto.vehicleId || v.vin === dto.vehicleId);
      if (devVeh) devVeh.status = initialStatus === 'PASSED' ? 'PDI_COMPLETED' : 'SERVICE';
    }

    const newPdi = {
      id: `pdi-${Date.now()}`,
      vehicleId: dto.vehicleId,
      bookingId: dto.bookingId || null,
      inspectorUserId,
      checklist: dto.checklist,
      status: initialStatus,
      failedItems: dto.failedItems || [],
      remarks: dto.remarks || null,
      images: dto.images || [],
      createdAt: new Date().toISOString(),
    };
    DEV_PDIS.unshift(newPdi);
    return newPdi;
  }

  async update(id: string, updates: Partial<CreatePdiDto>, actorUserId: string) {
    const pdi = await this.findOne(id);
    const newStatus = updates.status || (updates.failedItems && updates.failedItems.length > 0 ? 'FAILED' : pdi.status);

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
      }).catch(() => {});

      return result;
    } catch {}

    pdi.status = newStatus;
    return pdi;
  }

  async findByVehicle(vehicleId: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const items = await this.prisma.pdiInspection.findMany({
        where: { vehicleId },
        orderBy: { inspectionDate: 'desc' },
      });
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_PDIS.filter((p) => p.vehicleId === vehicleId);
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const pdi = await this.prisma.pdiInspection.findUnique({
        where: { id },
        include: { vehicle: true },
      });

      if (pdi) return pdi;
    } catch {}

    const devPdi = DEV_PDIS.find((p) => p.id === id);
    if (devPdi) return devPdi;

    return {
      id,
      vehicleId: 'veh-dev-01',
      status: 'PASSED',
    };
  }
}
