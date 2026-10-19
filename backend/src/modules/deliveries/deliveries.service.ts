import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AuditService } from '../audit/audit.service';
import { DeliveryStatus } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDeliveryDto, actorUserId: string) {
    const deliveryNumber = `DEL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { customer: true, vehicle: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cannot deliver vehicle for a CANCELLED booking');
    }
    if (booking.customerId !== dto.customerId) {
      throw new BadRequestException('Customer does not match booking customer');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { pdiInspections: true, branch: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    if (vehicle.status === 'DELIVERED' || vehicle.status === 'SOLD') {
      throw new BadRequestException(`Vehicle VIN '${vehicle.vin}' is already delivered/sold`);
    }

    if (booking.vehicleId && booking.vehicleId !== dto.vehicleId) {
      throw new BadRequestException('Vehicle does not match allocated booking vehicle');
    }

    if (vehicle.branchId !== booking.branchId) {
      throw new BadRequestException('Vehicle branch does not match booking branch');
    }

    // MANDATORY PDI REQUIREMENT
    const passedPdi = vehicle.pdiInspections?.some((pdi) => pdi.status === 'PASSED');
    if (!passedPdi && vehicle.status !== 'PDI_COMPLETED') {
      throw new BadRequestException(
        `Delivery Blocked: Vehicle VIN '${vehicle.vin}' has NOT passed mandatory PDI inspection`
      );
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Delivery Blocked: Invoice is CANCELLED');
    }
    if (invoice.customerId !== dto.customerId) {
      throw new BadRequestException('Invoice does not belong to the delivery customer');
    }
    if (invoice.bookingId && invoice.bookingId !== dto.bookingId) {
      throw new BadRequestException('Invoice is not linked to the delivery booking');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          deliveryNumber,
          customerId: dto.customerId,
          vehicleId: dto.vehicleId,
          bookingId: dto.bookingId,
          invoiceId: dto.invoiceId,
          deliveryEmployeeId: dto.deliveryEmployeeId || actorUserId,
          deliveryLocation: dto.deliveryLocation,
          odometerReading: dto.odometerReading || 0,
          customerAcknowledgement: dto.customerAcknowledgement ?? true,
          documentsKey: dto.documentsKey || null,
          status: 'COMPLETED',
        },
      });

      // Transfer vehicle ownership and update status
      await tx.vehicle.update({
        where: { id: dto.vehicleId },
        data: {
          status: 'DELIVERED',
          customerId: dto.customerId,
        },
      });

      // Complete booking lifecycle
      await tx.booking.update({
        where: { id: dto.bookingId },
        data: {
          status: 'CONVERTED_TO_DELIVERY',
          vehicleId: dto.vehicleId,
        },
      });

      // Update invoice associations if not already linked
      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          vehicleId: dto.vehicleId,
          bookingId: dto.bookingId,
        },
      }).catch(() => {});

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
    }).catch(() => {});

    await this.auditService.log({
      actorUserId,
      action: 'VEHICLE_STATUS_CHANGED',
      entityType: 'Vehicle',
      entityId: dto.vehicleId,
      metadata: {
        previousStatus: vehicle.status,
        newStatus: 'DELIVERED',
        deliveryId: result.id,
        customerId: dto.customerId,
      },
    }).catch(() => {});

    return result;
  }

  async findAll(
    status?: DeliveryStatus,
    limit = 50,
    offset = 0,
    user?: any,
    branchId?: string,
    franchiseId?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;

    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);

    if (user && scope?.isCustomer) {
      const customerId = user.customerId || user.customerProfile?.id;
      if (!customerId) return { items: [], total: 0, limit, offset };
      where.customerId = customerId;
    } else if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.vehicle = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.vehicle = { branchId: scope.effectiveBranchId };
        }
      } else {
        where.vehicle = { branchId: scope.effectiveBranchId };
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.vehicle = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.vehicle = { branchId: scope.effectiveBranchId };
        }
      } else if (scope.effectiveBranchId) {
        where.vehicle = { branchId: scope.effectiveBranchId };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          vehicle: { include: { variant: { include: { model: true } }, branch: true } },
          booking: true,
          invoice: true,
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { variant: { include: { model: true } }, branch: { include: { franchise: true } } } },
        booking: true,
        invoice: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (scope.isCustomer) {
        const customerId = user.customerId || user.customerProfile?.id;
        if (delivery.customerId !== customerId) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized delivery access');
        }
      } else if (!scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          if (delivery.vehicle?.branch?.franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
          }
          if (scope.effectiveBranchId && delivery.vehicle?.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
        } else {
          if (delivery.vehicle?.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
        }
      }
    }

    return delivery;
  }
}
