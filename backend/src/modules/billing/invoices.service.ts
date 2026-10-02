import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AuditService } from '../audit/audit.service';
import { InvoiceStatus, InvoicePaymentStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInvoiceDto, actorUserId: string) {
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
        franchiseId: dto.franchiseId,
        branchId: dto.branchId,
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
    });

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
    });

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
      include: { customer: true, items: true, branch: true, payments: true, vehicle: true, booking: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ID '${id}' not found`);
    }

    return invoice;
  }
}
