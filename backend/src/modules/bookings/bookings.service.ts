import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  async create(dto: CreateBookingDto, user?: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');

    // 1. Customer resolution
    let customerIdToUse = dto.customerId;
    if (isCustomer) {
      if (user.customerId) {
        customerIdToUse = user.customerId;
      } else {
        const cust = await this.prisma.customer.findFirst({ where: { userId: actorUserId } });
        if (!cust) throw new ForbiddenException('No customer profile associated with user account');
        customerIdToUse = cust.id;
      }
    }

    if (!customerIdToUse) {
      throw new BadRequestException('customerId is required');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { OR: [{ id: customerIdToUse }, { phone: customerIdToUse }, { email: customerIdToUse }] },
    });
    if (!customer) {
      throw new NotFoundException(`Customer '${customerIdToUse}' not found`);
    }

    if (isCustomer && customer.userId && customer.userId !== actorUserId) {
      throw new ForbiddenException('Cannot create booking for another customer');
    }

    // 2. Quotation resolution
    if (!dto.quotationId) {
      throw new BadRequestException('quotationId is required');
    }
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: dto.quotationId },
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation '${dto.quotationId}' not found`);
    }
    if (quotation.customerId !== customer.id) {
      throw new BadRequestException('Quotation does not belong to specified customer');
    }

    // 3. Branch resolution
    const branchIdToUse = dto.branchId || quotation.branchId;
    if (!branchIdToUse) {
      throw new BadRequestException('branchId is required');
    }
    const branch = await this.prisma.branch.findFirst({
      where: { OR: [{ id: branchIdToUse }, { code: branchIdToUse }] },
    });
    if (!branch) {
      throw new NotFoundException(`Branch '${branchIdToUse}' not found`);
    }
    if (quotation.branchId && quotation.branchId !== branch.id) {
      throw new BadRequestException('Branch does not match quotation branch');
    }

    // Tenant boundary checks for non-superadmin internal users
    if (!isSuperAdmin && !isCustomer) {
      if (user?.branchId && user.branchId !== branch.id) {
        throw new ForbiddenException('Cannot create booking for another branch');
      }
      if (user?.franchiseId && user.franchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot create booking for another franchise');
      }
    }

    // 4. Salesperson resolution
    let salesperson: any = null;
    if (dto.salespersonEmployeeId) {
      salesperson = await this.prisma.employee.findFirst({
        where: { OR: [{ id: dto.salespersonEmployeeId }, { employeeCode: dto.salespersonEmployeeId }] },
      });
      if (!salesperson) {
        throw new NotFoundException(`Salesperson '${dto.salespersonEmployeeId}' not found`);
      }
    } else if (quotation.salespersonEmployeeId) {
      salesperson = await this.prisma.employee.findUnique({
        where: { id: quotation.salespersonEmployeeId },
      });
    } else if (actorUserId) {
      salesperson = await this.prisma.employee.findFirst({
        where: { userId: actorUserId, branchId: branch.id },
      });
    }

    if (!salesperson) {
      salesperson = await this.prisma.employee.findFirst({
        where: { branchId: branch.id, status: 'ACTIVE' },
      });
    }
    if (!salesperson) {
      throw new NotFoundException(`No active employee found for branch '${branch.name}'`);
    }

    const bookingNumber = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalAmount = Number(quotation.totalAmount);

    return await this.prisma.$transaction(async (tx) => {
      // If a specific vehicle is being reserved, check it's available and belongs to branch
      if (dto.vehicleId) {
        const vehicle = await tx.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle) throw new NotFoundException(`Vehicle ID '${dto.vehicleId}' not found`);

        if (vehicle.branchId !== branch.id) {
          throw new BadRequestException('Selected vehicle does not belong to booking branch');
        }

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
        actorUserId: actorUserId || 'SYSTEM',
        action: 'BOOKING_CONFIRMED',
        entityType: 'Booking',
        entityId: booking.id,
        metadata: { bookingNumber, vehicleId: dto.vehicleId, totalAmount },
      }).catch(() => {});

      return booking;
    });
  }

  async findAll(branchId?: string, status?: BookingStatus, limit = 50, offset = 0, user?: any) {
    const where: any = {};
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCustomer = userRoles.includes('CUSTOMER');

    if (isCustomer) {
      if (!user?.customerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = user.customerId;
    } else if (!isSuperAdmin) {
      if (user?.branchId) {
        if (branchId && branchId !== user.branchId) {
          throw new ForbiddenException('Cannot access bookings from another branch');
        }
        where.branchId = user.branchId;
      } else if (user?.franchiseId) {
        where.branch = { franchiseId: user.franchiseId };
        if (branchId) {
          const branchInFranchise = await this.prisma.branch.findFirst({
            where: { id: branchId, franchiseId: user.franchiseId },
          });
          if (!branchInFranchise) {
            throw new ForbiddenException('Branch does not belong to your franchise');
          }
          where.branchId = branchId;
        }
      }
    } else {
      if (branchId) where.branchId = branchId;
    }

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

  async findOne(id: string, user?: any) {
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

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');

      if (isCustomer) {
        if (!user.customerId || booking.customerId !== user.customerId) {
          throw new ForbiddenException('Access denied to booking');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && booking.branchId !== user.branchId) {
          throw new ForbiddenException('Access denied to booking in another branch');
        }
        if (user.franchiseId && booking.branch?.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Access denied to booking in another franchise');
        }
      }
    }

    return booking;
  }

  async cancel(id: string, reason: string, user: any) {
    const booking = await this.findOne(id, user);

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
        actorUserId: user?.id || 'SYSTEM',
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: id,
        metadata: { bookingNumber: booking.bookingNumber, reason },
      }).catch(() => {});

      return updated;
    });
  }
}
