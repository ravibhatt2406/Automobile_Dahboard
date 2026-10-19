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
import { resolveUserScope } from '@/common/utils/scope.util';

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
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: { bookingId: dto.bookingId, status: { not: 'CANCELLED' } },
      });
      if (existingInvoice) {
        throw new BadRequestException(
          `An active invoice (${existingInvoice.invoiceNumber}) already exists for booking '${dto.bookingId}'`,
        );
      }

      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { branch: true },
      });
      if (booking) {
        branchId = branchId || booking.branchId;
        franchiseId = franchiseId || booking.branch?.franchiseId;
      }
    }

    if (dto.serviceJobId) {
      const serviceJob = await this.prisma.serviceJob.findUnique({
        where: { id: dto.serviceJobId },
        include: { serviceInvoice: true },
      });
      if (!serviceJob) {
        throw new NotFoundException(`Service Job with ID '${dto.serviceJobId}' not found`);
      }
      if (serviceJob.serviceInvoiceId && serviceJob.serviceInvoice?.status !== 'CANCELLED') {
        throw new BadRequestException(
          `An active invoice already exists for service job '${dto.serviceJobId}'`,
        );
      }
      branchId = branchId || serviceJob.branchId;
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
        payments: true,
        booking: true,
        vehicle: true,
        serviceJobs: true,
      },
    });

    if (dto.serviceJobId) {
      await this.prisma.serviceJob.update({
        where: { id: dto.serviceJobId },
        data: { serviceInvoiceId: invoice.id },
      }).catch(() => {});
    }

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
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);

    if (scope?.isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        user?.customerProfile?.id ||
        (await this.prisma.customer.findFirst({ where: { userId: user?.id } }))?.id;
      if (!resolvedCustomerId) {
        return { items: [], total: 0, limit, offset };
      }
      where.customerId = resolvedCustomerId;
    } else if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.franchiseId = scope.effectiveFranchiseId;
        if (scope.effectiveBranchId) {
          where.branchId = scope.effectiveBranchId;
        }
      } else {
        where.branchId = scope.effectiveBranchId;
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.franchiseId = scope.effectiveFranchiseId;
        if (scope.effectiveBranchId) {
          where.branchId = scope.effectiveBranchId;
        }
      } else if (scope.effectiveBranchId) {
        where.branchId = scope.effectiveBranchId;
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
        include: {
          customer: true,
          items: true,
          branch: true,
          payments: true,
          booking: true,
          vehicle: true,
          serviceJobs: true,
        },
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
        serviceJobs: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (scope.isCustomer) {
        const resolvedCustomerId =
          user.customerId ||
          user.customerProfile?.id ||
          (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!resolvedCustomerId || invoice.customerId !== resolvedCustomerId) {
          throw new ForbiddenException('Access denied to invoice');
        }
      } else if (!scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && invoice.franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to invoice in another franchise');
          }
          if (scope.effectiveBranchId && invoice.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to invoice in another branch');
          }
        } else {
          if (scope.effectiveBranchId && invoice.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to invoice in another branch');
          }
        }
      }
    }

    return invoice;
  }

  async recordPayment(
    id: string,
    dto: { amount: number; paymentMethod?: string; transactionReference?: string },
    user: any,
  ) {
    const invoice = await this.findOne(id, user);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record payment for a cancelled invoice');
    }

    if (invoice.paymentStatus === 'PAID') {
      throw new BadRequestException('Invoice is already fully paid');
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const existingPayments = await this.prisma.payment.aggregate({
      where: {
        invoiceId: id,
        status: 'SUCCESS',
      },
      _sum: { amount: true },
    });

    const alreadyPaid = Number(existingPayments._sum.amount || 0);
    const invoiceTotal = Number(invoice.totalAmount);
    const remainingBalance = Math.max(0, invoiceTotal - alreadyPaid);

    if (dto.amount > remainingBalance) {
      throw new BadRequestException(
        `Payment amount (₹${dto.amount}) cannot exceed remaining invoice balance of ₹${remainingBalance}`,
      );
    }

    let bookingId: string | null = invoice.bookingId;
    if (!bookingId) {
      const fallbackBooking = await this.prisma.booking.findFirst({
        where: { customerId: invoice.customerId, branchId: invoice.branchId },
      });
      if (fallbackBooking) {
        bookingId = fallbackBooking.id;
      }
    }

    if (!bookingId) {
      const anyBooking = await this.prisma.booking.findFirst({
        where: { branchId: invoice.branchId },
      });
      if (anyBooking) {
        bookingId = anyBooking.id;
      } else {
        const anyAnyBooking = await this.prisma.booking.findFirst();
        if (anyAnyBooking) {
          bookingId = anyAnyBooking.id;
        }
      }
    }

    if (!bookingId) {
      throw new BadRequestException('Cannot record payment: No associated booking record found.');
    }

    const newTotalPaid = alreadyPaid + dto.amount;
    const isFullyPaid = newTotalPaid >= invoiceTotal;
    const nextPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        invoiceId: id,
        amount: dto.amount,
        currency: 'INR',
        gateway: dto.paymentMethod || 'DIRECT_SETTLEMENT',
        gatewayPaymentId: dto.transactionReference || `PAY-INV-${Date.now()}`,
        status: 'SUCCESS',
        paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
        paidAt: new Date(),
      },
    });

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        paymentStatus: nextPaymentStatus,
        status: isFullyPaid ? 'PAID' : invoice.status,
      },
      include: {
        customer: true,
        items: true,
        branch: { include: { franchise: true } },
        payments: true,
        vehicle: true,
        booking: true,
        serviceJobs: true,
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'PAYMENT_RECORDED',
      entityType: 'Invoice',
      entityId: id,
      metadata: { paymentId: payment.id, amount: dto.amount, isFullyPaid },
    }).catch(() => {});

    return updatedInvoice;
  }

  async renderPrintableHtml(id: string, user?: any): Promise<string> {
    const invoice = await this.findOne(id, user);
    const branch = invoice.branch;
    const customer = invoice.customer;
    const items = invoice.items || [];
    const payments = invoice.payments || [];
    const totalPaid = payments
      .filter((p: any) => p.status === 'SUCCESS')
      .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    const balanceDue = Math.max(0, Number(invoice.totalAmount) - totalPaid);

    const itemsRows = items
      .map(
        (it: any, idx: number) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <strong>${it.description}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${it.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₹${Number(it.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₹${Number(it.taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${it.gstRate}%</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₹${Number(it.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: bold;">₹${Number(it.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #f8fafc; }
    .invoice-card { max-width: 860px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #0f172a; }
    .brand span { color: #f59e0b; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-unpaid { background: #fee2e2; color: #991b1b; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f1f5f9; padding: 10px; font-size: 12px; text-transform: uppercase; color: #475569; text-align: left; }
    .summary-box { width: 340px; margin-left: auto; margin-top: 25px; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .summary-total { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #0f172a; font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 6px; }
    .print-btn { background: #0f172a; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-bottom: 20px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 860px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end; gap: 10px;">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">TITAN<span>AUTO</span></div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Commercial Vehicles & Fleet Solutions</div>
        <div style="font-size: 12px; color: #334155; margin-top: 8px;"><strong>Branch:</strong> ${branch?.name || 'Authorized Dealership'}</div>
        <div style="font-size: 12px; color: #64748b;">${branch?.address || ''} • Code: ${branch?.code || ''}</div>
      </div>
      <div style="text-align: right;">
        <h1 style="margin: 0; font-size: 22px; color: #0f172a;">TAX INVOICE</h1>
        <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px;">#${invoice.invoiceNumber}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div style="margin-top: 8px;">
          <span class="badge ${invoice.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">${invoice.paymentStatus}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Billed To (Customer):</div>
        <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${customer?.name || 'Customer'}</div>
        ${customer?.companyName ? `<div style="font-size: 13px; color: #475569;">${customer.companyName}</div>` : ''}
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${invoice.billingAddress || customer?.address || ''}</div>
        ${customer?.phone ? `<div style="font-size: 12px; color: #64748b;">Phone: ${customer.phone}</div>` : ''}
        ${invoice.gstin || customer?.gstin ? `<div style="font-size: 12px; color: #0f172a; margin-top: 4px;"><strong>GSTIN:</strong> ${invoice.gstin || customer?.gstin}</div>` : ''}
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Transaction References:</div>
        ${invoice.booking ? `<div style="font-size: 12px; color: #334155;"><strong>Booking Reference:</strong> #${invoice.booking.bookingNumber || invoice.bookingId}</div>` : ''}
        ${invoice.vehicle ? `<div style="font-size: 12px; color: #334155;"><strong>Vehicle:</strong> ${invoice.vehicle.registrationNumber ? `${invoice.vehicle.registrationNumber} (VIN: ${invoice.vehicle.vin})` : `VIN: ${invoice.vehicle.vin}`}</div>` : ''}
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Invoice Status: <strong>${invoice.status}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Taxable</th>
          <th style="text-align: center;">GST %</th>
          <th style="text-align: right;">GST Amt</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>₹${Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${Number(invoice.discount) > 0 ? `
      <div class="summary-row" style="color: #16a34a;">
        <span>Discount:</span>
        <span>-₹${Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="summary-row">
        <span>Taxable Amount:</span>
        <span>₹${Number(invoice.taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${Number(invoice.cgstAmount) > 0 ? `
      <div class="summary-row">
        <span>CGST:</span>
        <span>₹${Number(invoice.cgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      ${Number(invoice.sgstAmount) > 0 ? `
      <div class="summary-row">
        <span>SGST:</span>
        <span>₹${Number(invoice.sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      ${Number(invoice.igstAmount) > 0 ? `
      <div class="summary-row">
        <span>IGST:</span>
        <span>₹${Number(invoice.igstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="summary-total">
        <span>Grand Total:</span>
        <span>₹${Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row" style="margin-top: 6px;">
        <span>Paid to Date:</span>
        <span>₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row" style="font-weight: 700; color: ${balanceDue > 0 ? '#b91c1c' : '#15803d'};">
        <span>Balance Due:</span>
        <span>₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
      <div>This is a computer-generated tax invoice issued by Titan Auto Fleet Management System.</div>
      <div>Authorized Signatory</div>
    </div>
  </div>
</body>
</html>`;
  }
}
