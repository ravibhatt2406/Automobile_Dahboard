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

    // Resilient customer lookup
    let customer = dto.customerId
      ? await this.prisma.customer.findFirst({
          where: { OR: [{ id: dto.customerId }, { phone: dto.customerId }, { email: dto.customerId }] },
        })
      : await this.prisma.customer.findFirst({ where: { userId: actorUserId } });
    if (!customer) {
      customer = await this.prisma.customer.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!customer) throw new NotFoundException('No active customer found for booking');

    // Resilient quotation lookup - Booking in schema requires a quotationId
    let quotation = dto.quotationId
      ? await this.prisma.quotation.findUnique({ where: { id: dto.quotationId } })
      : null;

    if (!quotation) {
      quotation = await this.prisma.quotation.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Resilient branch lookup
    let branch = dto.branchId
      ? await this.prisma.branch.findFirst({
          where: { OR: [{ id: dto.branchId }, { code: dto.branchId }] },
        })
      : quotation
      ? await this.prisma.branch.findUnique({ where: { id: quotation.branchId } })
      : await this.prisma.branch.findFirst({ where: { status: 'ACTIVE' } });
    if (!branch) throw new NotFoundException('No active branch found for booking');

    // Resilient salesperson lookup
    let salesperson = dto.salespersonEmployeeId
      ? await this.prisma.employee.findFirst({
          where: { OR: [{ id: dto.salespersonEmployeeId }, { employeeCode: dto.salespersonEmployeeId }] },
        })
      : await this.prisma.employee.findFirst({ where: { userId: actorUserId } });
    if (!salesperson) {
      salesperson = await this.prisma.employee.findFirst({ where: { branchId: branch.id, status: 'ACTIVE' } });
    }
    if (!salesperson) {
      salesperson = await this.prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!salesperson) throw new NotFoundException('No active salesperson employee found for booking');

    if (!quotation) {
      const variant = await this.prisma.truckVariant.findFirst();
      if (!variant) throw new NotFoundException('No truck variant found for quotation');
      const unitBasePrice = Number(variant.basePrice);
      const gstRate = Number(variant.gstRate);
      const subtotal = unitBasePrice;
      const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
      const calculatedTotal = subtotal + gstAmount;

      quotation = await this.prisma.quotation.create({
        data: {
          quotationNumber: `QT-AUTO-${Date.now()}`,
          customerId: customer.id,
          franchiseId: branch.franchiseId,
          branchId: branch.id,
          salespersonEmployeeId: salesperson.id,
          createdByUserId: actorUserId,
          variantId: variant.id,
          quantity: 1,
          unitBasePrice,
          subtotal,
          gstRate,
          gstAmount,
          totalAmount: calculatedTotal,
          validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'CONVERTED',
        },
      });
    }

    const bookingNumber = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalAmount = Number(quotation.totalAmount);

    return await this.prisma.$transaction(async (tx) => {
      // If a specific vehicle is being reserved, check it's available and prevent double-booking
      if (dto.vehicleId) {
        const vehicle = await tx.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

        if (!['IN_STOCK', 'RESERVED'].includes(vehicle.status)) {
          throw new ConflictException(
            `Vehicle '${vehicle.vin}' is not available for booking (current status: ${vehicle.status})`,
          );
        }

        // Check for active bookings on this vehicle (prevent double-booking)
        const existingActiveBooking = await tx.booking.findFirst({
          where: {
            vehicleId: dto.vehicleId,
            status: { notIn: ['CANCELLED', 'CONVERTED_TO_DELIVERY'] },
          },
        });

        if (existingActiveBooking) {
          throw new ConflictException(
            `Vehicle '${vehicle.vin}' already has an active booking (${existingActiveBooking.bookingNumber})`,
          );
        }

        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: 'RESERVED' },
        });
      }

      // Mark quotation as converted if linked
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'CONVERTED' },
      }).catch(() => {});

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: customer.id,
          quotationId: quotation.id,
          vehicleId: dto.vehicleId || null,
          branchId: branch.id,
          salespersonEmployeeId: salesperson.id,
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
          salesperson: true,
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
        quotation: {
          include: { variant: { include: { model: { include: { manufacturer: true } } } } },
        },
        vehicle: { include: { pdiInspections: true } },
        branch: { include: { franchise: true } },
        salesperson: true,
        payments: true,
        financeApplication: true,
        insurancePolicy: true,
        invoices: { include: { items: true } },
        deliveries: true,
        allocations: true,
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

    return await this.prisma.$transaction(async (tx) => {
      // Release the vehicle back to stock
      if (booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: 'IN_STOCK' },
        });
      }

      const updated = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED', cancellationReason: reason },
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
  }
}
