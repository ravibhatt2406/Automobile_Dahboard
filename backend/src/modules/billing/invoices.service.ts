import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AuditService } from '../audit/audit.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInvoiceDto, user: any) {
    const actorUserId = user?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    let branchId = dto.branchId;
    let franchiseId = dto.franchiseId;

    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { branch: true },
      });
      if (booking) {
        branchId = branchId || booking.branchId;
        franchiseId = franchiseId || booking.branch?.franchiseId;
      }
    }

    if (!branchId) {
      throw new BadRequestException('branchId is required for invoice generation');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    franchiseId = franchiseId || branch.franchiseId;

    if (!isSuperAdmin) {
      if (user?.branchId && user.branchId !== branch.id) {
        throw new ForbiddenException('Cannot generate invoice for another branch');
      }
      if (user?.franchiseId && user.franchiseId !== branch.franchiseId) {
        throw new ForbiddenException('Cannot generate invoice for another franchise');
      }
    }

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const computedItems = dto.items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      const rate = item.gstRate ?? 28;
      const gstAmount = Math.round(lineSubtotal * (rate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + gstAmount;

      subtotal += lineSubtotal;

      if (dto.isInterState) {
        totalIgst += gstAmount;
      } else {
        const halfGst = Math.round((gstAmount / 2) * 100) / 100;
        totalCgst += halfGst;
        totalSgst += halfGst;
      }

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxableAmount: lineSubtotal,
        gstRate: rate,
        gstAmount,
        totalAmount: lineTotal,
      };
    });

    const discount = dto.discount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const totalTax = totalCgst + totalSgst + totalIgst;
    const totalAmount = taxableAmount + totalTax;

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: dto.customerId,
        bookingId: dto.bookingId || null,
        vehicleId: dto.vehicleId || null,
        franchiseId,
        branchId,
        billingAddress: dto.billingAddress,
        gstin: dto.gstin || null,
        subtotal,
        discount,
        taxableAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        totalAmount,
        status: 'ISSUED',
        issuedAt: new Date(),
        items: {
          create: computedItems,
        },
      },
      include: {
        customer: true,
        items: true,
        branch: true,
      },
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'INVOICE_ISSUED',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, totalAmount, gstin: dto.gstin },
    }).catch(() => {});

    return invoice;
  }

  async cancel(id: string, reason: string, user: any) {
    const invoice = await this.findOne(id, user);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: id,
      metadata: { invoiceNumber: invoice.invoiceNumber, reason },
    }).catch(() => {});

    return updated;
  }

  async generatePdfData(id: string, user?: any) {
    const invoice = await this.findOne(id, user);
    return {
      pdfHeader: `TITAN AUTO INVOICE - ${invoice.invoiceNumber}`,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      customer: invoice.customer,
      items: invoice.items,
      subtotal: invoice.subtotal,
      cgst: invoice.cgstAmount,
      sgst: invoice.sgstAmount,
      igst: invoice.igstAmount,
      totalAmount: invoice.totalAmount,
      downloadUrl: `/api/v1/invoices/${id}/pdf/download`,
    };
  }

  async findAll(
    branchId?: string,
    status?: InvoiceStatus,
    limit = 50,
    offset = 0,
    user?: any,
    franchiseId?: string,
    startDate?: string,
    endDate?: string,
  ) {
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
        if (branchId && branchId !== 'ALL' && branchId !== user.branchId) {
          throw new ForbiddenException('Cannot access invoices from another branch');
        }
        where.branchId = user.branchId;
      } else if (user?.franchiseId) {
        if (franchiseId && franchiseId !== 'ALL' && franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Cannot access invoices from another franchise');
        }
        where.franchiseId = user.franchiseId;
        if (branchId && branchId !== 'ALL') {
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
      // Super Admin
      if (franchiseId && franchiseId !== 'ALL') {
        where.franchiseId = franchiseId;
        if (branchId && branchId !== 'ALL') {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: branchId }, { code: branchId }] },
          });
          if (b && b.franchiseId !== franchiseId) {
            throw new BadRequestException('Selected branch does not belong to the selected franchise');
          }
          where.branchId = b ? b.id : branchId;
        }
      } else if (branchId && branchId !== 'ALL') {
        const b = await this.prisma.branch.findFirst({
          where: { OR: [{ id: branchId }, { code: branchId }] },
        });
        where.branchId = b ? b.id : branchId;
      }
    }

    if (status) where.status = status;

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, items: true, branch: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        branch: { include: { franchise: true } },
        payments: true,
        vehicle: true,
        booking: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (user) {
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCustomer = userRoles.includes('CUSTOMER');

      if (isCustomer) {
        if (!user.customerId || invoice.customerId !== user.customerId) {
          throw new ForbiddenException('Access denied to invoice');
        }
      } else if (!isSuperAdmin) {
        if (user.branchId && invoice.branchId !== user.branchId) {
          throw new ForbiddenException('Access denied to invoice in another branch');
        }
        if (user.franchiseId && invoice.franchiseId !== user.franchiseId) {
          throw new ForbiddenException('Access denied to invoice in another franchise');
        }
      }
    }

    return invoice;
  }
}
