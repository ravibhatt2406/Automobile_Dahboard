import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { AuditService } from '../audit/audit.service';
import { QuotationStatus } from '@prisma/client';

@Injectable()
export class QuotationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateQuotationDto, creatorUserId: string) {
    // 1. Load Variant to get canonical Base Price & GST Rate
    const variant = await this.prisma.truckVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Truck Variant ID '${dto.variantId}' not found`);
    }

    // 2. Server-side Monetary Calculation
    const unitBasePrice = Number(variant.basePrice);
    const quantity = dto.quantity || 1;
    const baseTotal = unitBasePrice * quantity;
    const accessories = dto.accessoriesAmount || 0;
    const insurance = dto.insuranceAmount || 0;
    const registration = dto.registrationAmount || 0;
    const financeCharges = dto.financeCharges || 0;
    const discount = dto.discountAmount || 0;

    const subtotal = baseTotal + accessories + insurance + registration + financeCharges - discount;
    const gstRate = Number(variant.gstRate);
    const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
    const totalAmount = subtotal + gstAmount;

    const quotationNumber = `QT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: dto.customerId,
        leadId: dto.leadId || null,
        franchiseId: dto.franchiseId,
        branchId: dto.branchId,
        salespersonEmployeeId: dto.salespersonEmployeeId,
        createdByUserId: creatorUserId,
        variantId: dto.variantId,
        quantity,
        unitBasePrice,
        accessoriesAmount: accessories,
        insuranceAmount: insurance,
        registrationAmount: registration,
        financeCharges,
        discountAmount: discount,
        subtotal,
        gstRate,
        gstAmount,
        totalAmount,
        validityDate: new Date(dto.validityDate),
        notes: dto.notes,
        status: discount > 50000 ? 'PENDING_APPROVAL' : 'SUBMITTED',
      },
      include: {
        customer: true,
        variant: { include: { model: { include: { manufacturer: true } } } },
        branch: true,
      },
    });

    await this.auditService.log({
      actorUserId: creatorUserId,
      action: 'QUOTATION_CREATED',
      entityType: 'Quotation',
      entityId: quotation.id,
      metadata: { quotationNumber, totalAmount, status: quotation.status },
    });

    return quotation;
  }

  async findAll(branchId?: string, status?: QuotationStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          variant: { include: { model: { include: { manufacturer: true } } } },
          branch: true,
          salesperson: true,
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        lead: true,
        franchise: true,
        branch: true,
        salesperson: true,
        variant: { include: { model: { include: { manufacturer: true } } } },
        bookings: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation ID '${id}' not found`);
    }

    return quotation;
  }

  async approve(id: string, approverUserId: string) {
    const quotation = await this.findOne(id);

    if (quotation.status !== 'PENDING_APPROVAL' && quotation.status !== 'SUBMITTED') {
      throw new BadRequestException(`Quotation status '${quotation.status}' cannot be approved`);
    }

    // Self-approval prevention for non-Super-Admins
    if (quotation.createdByUserId === approverUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: approverUserId } });
      if (user?.accountType !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Self-Approval Violation: You cannot approve a quotation created by yourself');
      }
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.auditService.log({
      actorUserId: approverUserId,
      action: 'QUOTATION_APPROVED',
      entityType: 'Quotation',
      entityId: id,
      metadata: { quotationNumber: quotation.quotationNumber },
    });

    return updated;
  }

  async reject(id: string, reason: string, actorUserId: string) {
    const quotation = await this.findOne(id);

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'REJECTED', notes: `REJECTED: ${reason}` },
    });

    await this.auditService.log({
      actorUserId,
      action: 'QUOTATION_REJECTED',
      entityType: 'Quotation',
      entityId: id,
      metadata: { quotationNumber: quotation.quotationNumber, reason },
    });

    return updated;
  }
}
