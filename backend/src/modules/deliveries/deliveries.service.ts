import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AuditService } from '../audit/audit.service';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDeliveryDto, actorUserId: string) {
    // 1. Verify Customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);
    }

    // 2. Verify Booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking ID '${dto.bookingId}' not found`);
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cannot deliver vehicle for a CANCELLED booking');
    }

    // 3. Verify Vehicle & PDI status
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { pdiInspections: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);
    }
    if (vehicle.status === 'DELIVERED' || vehicle.status === 'SOLD') {
      throw new BadRequestException(`Vehicle VIN '${vehicle.vin}' is already delivered/sold`);
    }

    const passedPdi = vehicle.pdiInspections.some((pdi) => pdi.status === 'PASSED');
    if (!passedPdi && vehicle.status !== 'PDI_COMPLETED') {
      throw new BadRequestException(
        `Delivery Blocked: Vehicle VIN '${vehicle.vin}' has NOT passed PDI inspection`
      );
    }

    // 4. Verify Invoice
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ID '${dto.invoiceId}' not found`);
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Delivery Blocked: Invoice is CANCELLED');
    }

    const deliveryNumber = `DEL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          deliveryNumber,
          customerId: dto.customerId,
          vehicleId: dto.vehicleId,
          bookingId: dto.bookingId,
          invoiceId: dto.invoiceId,
          deliveryEmployeeId: dto.deliveryEmployeeId,
          deliveryLocation: dto.deliveryLocation,
          odometerReading: dto.odometerReading || 0,
          customerAcknowledgement: dto.customerAcknowledgement ?? true,
          documentsKey: dto.documentsKey || null,
          status: 'COMPLETED',
        },
      });

      // Update Vehicle status to DELIVERED and set Customer ownership
      await tx.vehicle.update({
        where: { id: dto.vehicleId },
        data: {
          status: 'DELIVERED',
          customerId: dto.customerId,
        },
      });

      // Update Booking status to CONVERTED_TO_DELIVERY
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
        vin: vehicle.vin,
        customerId: dto.customerId,
        bookingId: dto.bookingId,
      },
    });

    return result;
  }

  async findAll(status?: DeliveryStatus, limit = 50, offset = 0) {
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

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { variant: { include: { model: true } } } },
        booking: true,
        invoice: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ID '${id}' not found`);
    }

    return delivery;
  }
}
