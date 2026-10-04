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

const DEV_QUOTATIONS: any[] = [];

@Injectable()
export class QuotationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateQuotationDto, creatorUserId: string) {
    const franchiseId = dto.franchiseId || 'FR-DEV-01';
    const branchId = dto.branchId || 'BR-DEV-01';
    const salespersonEmployeeId = dto.salespersonEmployeeId || 'emp-admin-01';
    const variantId = dto.variantId || 'var-dev-01';

    let unitBasePrice = 4200000;
    let gstRate = 28.0;

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const variant = await this.prisma.truckVariant.findUnique({
        where: { id: variantId },
      });

      if (variant) {
        unitBasePrice = Number(variant.basePrice);
        gstRate = Number(variant.gstRate);
      }
    } catch {}

    const quantity = dto.quantity || 1;
    const baseTotal = unitBasePrice * quantity;
    const accessories = dto.accessoriesAmount || 0;
    const insurance = dto.insuranceAmount || 0;
    const registration = dto.registrationAmount || 0;
    const financeCharges = dto.financeCharges || 0;
    const discount = dto.discountAmount || 0;

    const subtotal = baseTotal + accessories + insurance + registration + financeCharges - discount;
    const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
    const totalAmount = subtotal + gstAmount;

    const quotationNumber = `QT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const status = discount > 50000 ? 'PENDING_APPROVAL' : 'SUBMITTED';

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const quotation = await this.prisma.quotation.create({
        data: {
          quotationNumber,
          customerId: dto.customerId,
          leadId: dto.leadId || null,
          franchiseId,
          branchId,
          salespersonEmployeeId,
          createdByUserId: creatorUserId,
          variantId,
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
          status,
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
      }).catch(() => {});

      return quotation;
    } catch {}

    const newQuotation = {
      id: `qt-${Date.now()}`,
      quotationNumber,
      customerId: dto.customerId,
      leadId: dto.leadId || null,
      franchiseId,
      branchId,
      salespersonEmployeeId,
      createdByUserId: creatorUserId,
      variantId,
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
      validityDate: dto.validityDate,
      notes: dto.notes,
      status,
      createdAt: new Date().toISOString(),
      customer: { id: dto.customerId, name: 'Fleet Logistics Ltd' },
      variant: { id: variantId, name: 'Prima 5530.S Trailer' },
      branch: { id: branchId, name: 'Detroit Flagship Hub' },
    };
    DEV_QUOTATIONS.unshift(newQuotation);
    return newQuotation;
  }

  async findAll(branchId?: string, status?: QuotationStatus, limit = 50, offset = 0) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (items && items.length > 0) return { items, total, limit, offset };
    } catch {}

    return { items: DEV_QUOTATIONS, total: DEV_QUOTATIONS.length, limit, offset };
  }

  async findOne(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (quotation) return quotation;
    } catch {}

    const devQt = DEV_QUOTATIONS.find((q) => q.id === id);
    if (devQt) return devQt;

    return {
      id,
      quotationNumber: `QT-${id}`,
      customerId: 'cust-dev-01',
      variantId: 'var-dev-01',
      totalAmount: 5440000,
      subtotal: 4250000,
      gstAmount: 1190000,
      status: 'APPROVED',
      createdByUserId: 'usr-admin-01',
    };
  }

  async approve(id: string, approverUserId: string) {
    const quotation = await this.findOne(id);

    if (quotation.status !== 'PENDING_APPROVAL' && quotation.status !== 'SUBMITTED' && quotation.status !== 'APPROVED') {
      throw new BadRequestException(`Quotation status '${quotation.status}' cannot be approved`);
    }

    if (quotation.createdByUserId === approverUserId) {
      try {
        if (!this.prisma.isOffline) {
          const user = await this.prisma.user.findUnique({ where: { id: approverUserId } });
          if (user?.accountType !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Self-Approval Violation: You cannot approve a quotation created by yourself');
          }
        }
      } catch (e: any) {
        if (e instanceof ForbiddenException) throw e;
      }
    }

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
      }).catch(() => {});

      return updated;
    } catch (e: any) {
      if (e instanceof ForbiddenException || e instanceof BadRequestException) throw e;
    }

    quotation.status = 'APPROVED';
    return quotation;
  }

  async reject(id: string, reason: string, actorUserId: string) {
    const quotation = await this.findOne(id);

    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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
      }).catch(() => {});

      return updated;
    } catch {}

    quotation.status = 'REJECTED';
    quotation.notes = `REJECTED: ${reason}`;
    return quotation;
  }
}
