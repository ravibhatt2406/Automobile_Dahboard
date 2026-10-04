import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AuditService } from '../audit/audit.service';
import { InvoiceStatus } from '@prisma/client';

const DEV_INVOICES: any[] = [];

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateInvoiceDto, actorUserId: string) {
    const franchiseId = dto.franchiseId || 'FR-DEV-01';
    const branchId = dto.branchId || 'BR-DEV-01';

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

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch {}

    const newInvoice = {
      id: `inv-${Date.now()}`,
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
      issuedAt: new Date().toISOString(),
      items: computedItems,
      createdAt: new Date().toISOString(),
    };
    DEV_INVOICES.unshift(newInvoice);
    return newInvoice;
  }

  async cancel(id: string, reason: string, actorUserId: string) {
    const invoice = await this.findOne(id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
    }

    invoice.status = 'CANCELLED';
    return invoice;
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
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_INVOICES, total: DEV_INVOICES.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: { customer: true, items: true, branch: true, payments: true, vehicle: true, booking: true },
      });

      if (invoice) return invoice;
    } catch {}

    const devInv = DEV_INVOICES.find((i) => i.id === id);
    if (devInv) return devInv;

    return {
      id,
      invoiceNumber: `INV-${id}`,
      customerId: 'cust-dev-01',
      subtotal: 4200000,
      totalAmount: 5376000,
      status: 'ISSUED',
      items: [],
    };
  }
}
