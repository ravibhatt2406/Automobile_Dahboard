import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuditService } from '../audit/audit.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateBookingDto, actorUserId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ID '${dto.customerId}' not found`);
    }

    const quotation = await this.prisma.quotation.findUnique({
      where: { id: dto.quotationId },
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation ID '${dto.quotationId}' not found`);
    }

    if (quotation.status === 'REJECTED' || quotation.status === 'EXPIRED') {
      throw new BadRequestException(`Cannot book from a ${quotation.status} quotation`);
    }

    const totalAmount = Number(quotation.totalAmount);
    const bookingNumber = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return this.prisma.$transaction(async (tx) => {
      // If vehicleId is provided during booking creation, verify & reserve it transactionally
      if (dto.vehicleId) {
        const vehicle = await tx.vehicle.findUnique({
          where: { id: dto.vehicleId },
        });

        if (!vehicle) {
          throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);
        }

        if (vehicle.status !== 'IN_STOCK') {
          throw new ConflictException(
            `Vehicle VIN '${vehicle.vin}' is unavailable for booking (Current status: ${vehicle.status})`,
          );
        }

        // Reserve vehicle
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: 'RESERVED' },
        });
      }

      // Mark quotation as CONVERTED
      await tx.quotation.update({
        where: { id: dto.quotationId },
        data: { status: 'CONVERTED' },
      });

      // Update lead status to CONVERTED if lead exists
      if (quotation.leadId) {
        await tx.lead.update({
          where: { id: quotation.leadId },
          data: { status: 'CONVERTED' },
        });
      }

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: dto.customerId,
          quotationId: dto.quotationId,
          vehicleId: dto.vehicleId || null,
          branchId: dto.branchId,
          salespersonEmployeeId: dto.salespersonEmployeeId,
          bookingAmount: dto.bookingAmount,
          totalAmount,
          status: 'CONFIRMED',
          notes: dto.notes,
        },
        include: {
          customer: true,
          quotation: { include: { variant: true } },
          vehicle: true,
          branch: true,
        },
      });

      await this.auditService.log({
        actorUserId,
        action: 'BOOKING_CONFIRMED',
        entityType: 'Booking',
        entityId: booking.id,
        metadata: { bookingNumber, vehicleId: dto.vehicleId, totalAmount },
      });

      return booking;
    });
  }

  async findAll(branchId?: string, status?: BookingStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          quotation: { include: { variant: true } },
          vehicle: true,
          branch: true,
          salesperson: true,
          payments: true,
          financeApplication: true,
          insurancePolicy: true,
          invoices: true,
          deliveries: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: { include: { variant: { include: { model: { include: { manufacturer: true } } } } } },
        vehicle: { include: { pdiInspections: true } },
        branch: { include: { franchise: true } },
        salesperson: true,
        payments: true,
        financeApplication: true,
        insurancePolicy: true,
        invoices: { include: { items: true } },
        deliveries: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID '${id}' not found`);
    }

    return booking;
  }

  async cancel(id: string, reason: string, actorUserId: string) {
    const booking = await this.findOne(id);

    if (booking.status === 'CANCELLED' || booking.status === 'CONVERTED_TO_DELIVERY') {
      throw new BadRequestException(`Cannot cancel booking in '${booking.status}' status`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Unreserve vehicle if associated
      if (booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: 'IN_STOCK' },
        });
      }

      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
        },
      });

      await this.auditService.log({
        actorUserId,
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: id,
        metadata: { bookingNumber: booking.bookingNumber, reason },
      });

      return updated;
    });
  }
}
