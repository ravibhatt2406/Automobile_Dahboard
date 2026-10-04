import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  async create(dto: CreateInvoiceDto, actorUserId: string) {
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
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) {
        throw new BadRequestException('No branches available for invoice generation');
      }
      branchId = firstBranch.id;
      franchiseId = franchiseId || firstBranch.franchiseId;
    }

    if (!franchiseId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${branchId} not found`);
      }
      franchiseId = branch.franchiseId;
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
      actorUserId,
      action: 'INVOICE_ISSUED',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, totalAmount, gstin: dto.gstin },
    }).catch(() => {});

    return invoice;
  }

  async cancel(id: string, reason: string, actorUserId: string) {
    const invoice = await this.findOne(id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: id,
      metadata: { invoiceNumber: invoice.invoiceNumber, reason },
    }).catch(() => {});

    return updated;
  }

  async generatePdfData(id: string) {
    const invoice = await this.findOne(id);
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

  async findAll(branchId?: string, status?: InvoiceStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

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

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        branch: true,
        payments: true,
        vehicle: true,
        booking: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }
}
