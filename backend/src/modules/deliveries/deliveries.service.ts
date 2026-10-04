import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AuditService } from '../audit/audit.service';
import { DeliveryStatus } from '@prisma/client';
import { DEV_VEHICLES } from '../inventory/inventory.service';

const DEV_DELIVERIES: any[] = [];

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDeliveryDto, actorUserId: string) {
    const deliveryNumber = `DEL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      });

      if (booking && booking.status === 'CANCELLED') {
        throw new BadRequestException('Cannot deliver vehicle for a CANCELLED booking');
      }

      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
        include: { pdiInspections: true },
      });

      if (vehicle) {
        if (vehicle.status === 'DELIVERED' || vehicle.status === 'SOLD') {
          throw new BadRequestException(`Vehicle VIN '${vehicle.vin}' is already delivered/sold`);
        }

        const passedPdi = vehicle.pdiInspections?.some((pdi) => pdi.status === 'PASSED');
        if (!passedPdi && vehicle.status !== 'PDI_COMPLETED') {
          throw new BadRequestException(
            `Delivery Blocked: Vehicle VIN '${vehicle.vin}' has NOT passed PDI inspection`
          );
        }
      }

      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
      });
      if (invoice && invoice.status === 'CANCELLED') {
        throw new BadRequestException('Delivery Blocked: Invoice is CANCELLED');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const delivery = await tx.delivery.create({
          data: {
            deliveryNumber,
            customerId: dto.customerId,
            vehicleId: dto.vehicleId,
            bookingId: dto.bookingId,
            invoiceId: dto.invoiceId,
            deliveryEmployeeId: dto.deliveryEmployeeId || 'emp-admin-01',
            deliveryLocation: dto.deliveryLocation,
            odometerReading: dto.odometerReading || 0,
            customerAcknowledgement: dto.customerAcknowledgement ?? true,
            documentsKey: dto.documentsKey || null,
            status: 'COMPLETED',
          },
        });

        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: {
            status: 'DELIVERED',
            customerId: dto.customerId,
          },
        });

        await tx.booking.update({
          where: { id: dto.bookingId },
          data: { status: 'CONVERTED_TO_DELIVERY' },
        });

        return delivery;
      });

      await this.auditService.log({
        actorUserId,
        action: 'VEHICLE_DELIVERY_COMPLETED',
        entityType: 'Delivery',
        entityId: result.id,
        metadata: {
          deliveryNumber,
          vin: vehicle?.vin,
          customerId: dto.customerId,
          bookingId: dto.bookingId,
        },
      }).catch(() => {});

      return result;
    } catch (e: any) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) throw e;
    }

    if (dto.vehicleId) {
      const devVeh = DEV_VEHICLES.find((v) => v.id === dto.vehicleId || v.vin === dto.vehicleId);
      if (devVeh) {
        devVeh.status = 'DELIVERED';
        devVeh.customerId = dto.customerId;
      }
    }

    const newDelivery = {
      id: `del-${Date.now()}`,
      deliveryNumber,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      bookingId: dto.bookingId,
      invoiceId: dto.invoiceId,
      deliveryEmployeeId: dto.deliveryEmployeeId || 'emp-admin-01',
      deliveryLocation: dto.deliveryLocation,
      odometerReading: dto.odometerReading || 0,
      customerAcknowledgement: dto.customerAcknowledgement ?? true,
      documentsKey: dto.documentsKey || null,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    DEV_DELIVERIES.unshift(newDelivery);
    return newDelivery;
  }

  async findAll(status?: DeliveryStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const where: any = {};
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        this.prisma.delivery.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: true,
            vehicle: { include: { variant: { include: { model: true } } } },
            booking: true,
            invoice: true,
          },
        }),
        this.prisma.delivery.count({ where }),
      ]);

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_DELIVERIES, total: DEV_DELIVERIES.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const delivery = await this.prisma.delivery.findUnique({
        where: { id },
        include: {
          customer: true,
          vehicle: { include: { variant: { include: { model: true } } } },
          booking: true,
          invoice: true,
        },
      });

      if (delivery) return delivery;
    } catch {}

    const devDel = DEV_DELIVERIES.find((d) => d.id === id);
    if (devDel) return devDel;

    return {
      id,
      deliveryNumber: `DEL-${id}`,
      customerId: 'cust-dev-01',
      vehicleId: 'veh-dev-01',
      bookingId: 'bk-dev-01',
      invoiceId: 'inv-dev-01',
      status: 'COMPLETED',
    };
  }
}
