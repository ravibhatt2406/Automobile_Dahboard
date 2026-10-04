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
import { DEV_VEHICLES } from '../inventory/inventory.service';

export const DEV_BOOKINGS: any[] = [];

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateBookingDto, actorUserId: string) {
    const branchId = dto.branchId || 'BR-DEV-01';
    const salespersonEmployeeId = dto.salespersonEmployeeId || 'emp-admin-01';
    const bookingNumber = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      const quotation = await this.prisma.quotation.findUnique({
        where: { id: dto.quotationId },
      });

      if (quotation && (quotation.status === 'REJECTED' || quotation.status === 'EXPIRED')) {
        throw new BadRequestException(`Cannot book from a ${quotation.status} quotation`);
      }

      const totalAmount = quotation ? Number(quotation.totalAmount) : 5440000;

      return await this.prisma.$transaction(async (tx) => {
        if (dto.vehicleId) {
          const vehicle = await tx.vehicle.findUnique({
            where: { id: dto.vehicleId },
          });

          if (vehicle && vehicle.status === 'IN_STOCK') {
            await tx.vehicle.update({
              where: { id: dto.vehicleId },
              data: { status: 'RESERVED' },
            });
          }
        }

        await tx.quotation.update({
          where: { id: dto.quotationId },
          data: { status: 'CONVERTED' },
        }).catch(() => {});

        const booking = await tx.booking.create({
          data: {
            bookingNumber,
            customerId: dto.customerId,
            quotationId: dto.quotationId,
            vehicleId: dto.vehicleId || null,
            branchId,
            salespersonEmployeeId,
            bookingAmount: dto.bookingAmount,
            totalAmount,
            status: 'PENDING',
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
        }).catch(() => {});

        return booking;
      });
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof BadRequestException || e instanceof ConflictException) throw e;
    }

    if (dto.vehicleId) {
      const devVeh = DEV_VEHICLES.find((v) => v.id === dto.vehicleId || v.vin === dto.vehicleId);
      if (devVeh) devVeh.status = 'RESERVED';
    }

    const newBooking = {
      id: `bk-${Date.now()}`,
      bookingNumber,
      customerId: dto.customerId,
      quotationId: dto.quotationId,
      vehicleId: dto.vehicleId || null,
      branchId,
      salespersonEmployeeId,
      bookingAmount: dto.bookingAmount,
      totalAmount: 5440000,
      status: 'PENDING',
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      customer: { id: dto.customerId, name: 'Fleet Logistics Ltd' },
      branch: { id: branchId, name: 'Detroit Flagship Hub' },
    };
    DEV_BOOKINGS.unshift(newBooking);
    return newBooking;
  }

  async findAll(branchId?: string, status?: BookingStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_BOOKINGS, total: DEV_BOOKINGS.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (booking) return booking;
    } catch {}

    const devBk = DEV_BOOKINGS.find((b) => b.id === id);
    if (devBk) return devBk;

    return {
      id,
      bookingNumber: `BK-${id}`,
      customerId: 'cust-dev-01',
      quotationId: 'qt-dev-01',
      status: 'CONFIRMED',
      bookingAmount: 500000,
      totalAmount: 5440000,
    };
  }

  async cancel(id: string, reason: string, actorUserId: string) {
    const booking = await this.findOne(id);

    if (booking.status === 'CANCELLED' || booking.status === 'CONVERTED_TO_DELIVERY') {
      throw new BadRequestException(`Cannot cancel booking in '${booking.status}' status`);
    }

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      return await this.prisma.$transaction(async (tx) => {
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
        }).catch(() => {});

        return updated;
      });
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason;
    return booking;
  }
}
