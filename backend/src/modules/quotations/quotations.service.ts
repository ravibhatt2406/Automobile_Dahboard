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
    // Resilient Customer Resolution
    let customer = dto.customerId
      ? await this.prisma.customer.findFirst({
          where: { OR: [{ id: dto.customerId }, { phone: dto.customerId }, { email: dto.customerId }] },
        })
      : await this.prisma.customer.findFirst({ where: { userId: creatorUserId } });

    if (!customer) {
      customer = await this.prisma.customer.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!customer) throw new NotFoundException('No active customer found for quotation');

    // Resilient Variant Resolution
    let variant = dto.variantId
      ? await this.prisma.truckVariant.findFirst({
          where: { OR: [{ id: dto.variantId }, { name: dto.variantId }] },
        })
      : await this.prisma.truckVariant.findFirst();
    if (!variant) throw new NotFoundException('No truck variant found for quotation');

    // Resilient Branch Resolution
    let branch = dto.branchId
      ? await this.prisma.branch.findFirst({
          where: { OR: [{ id: dto.branchId }, { code: dto.branchId }] },
        })
      : await this.prisma.branch.findFirst({ where: { status: 'ACTIVE' } });
    if (!branch) throw new NotFoundException('No active branch found for quotation');

    // Resilient Salesperson Resolution
    let salesperson = dto.salespersonEmployeeId
      ? await this.prisma.employee.findFirst({
          where: { OR: [{ id: dto.salespersonEmployeeId }, { employeeCode: dto.salespersonEmployeeId }] },
        })
      : await this.prisma.employee.findFirst({ where: { userId: creatorUserId } });

    if (!salesperson) {
      salesperson = await this.prisma.employee.findFirst({
        where: { branchId: branch.id, status: 'ACTIVE' },
      });
    }
    if (!salesperson) {
      salesperson = await this.prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!salesperson) throw new NotFoundException('No active employee found for quotation');

    const unitBasePrice = Number(variant.basePrice);
    const gstRate = Number(variant.gstRate);

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
    const validityDate = dto.validityDate ? new Date(dto.validityDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customer.id,
        leadId: dto.leadId || null,
        franchiseId: dto.franchiseId || branch.franchiseId,
        branchId: branch.id,
        salespersonEmployeeId: salesperson.id,
        createdByUserId: creatorUserId,
        variantId: variant.id,
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
        validityDate,
        notes: dto.notes,
        status,
      },
      include: {
        customer: true,
        variant: { include: { model: { include: { manufacturer: true } } } },
        branch: true,
        salesperson: true,
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
  }

  async findAll(branchId?: string, customerId?: string, status?: QuotationStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (customerId) where.customerId = customerId;
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
        franchise: true,
        branch: true,
        salesperson: true,
        variant: { include: { model: { include: { manufacturer: true } } } },
        bookings: true,
        items: true,
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

    if (quotation.createdByUserId === approverUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: approverUserId } });
      if (user?.accountType !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Self-Approval Violation: You cannot approve a quotation you created');
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
    }).catch(() => {});

    return updated;
  }

  async reject(id: string, reason: string, actorUserId: string) {
    const quotation = await this.findOne(id);

    if (quotation.status === 'CONVERTED' || quotation.status === 'EXPIRED') {
      throw new BadRequestException(`Cannot reject a ${quotation.status} quotation`);
    }

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
  }

  async expire(id: string, actorUserId: string) {
    const quotation = await this.findOne(id);

    if (!['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'].includes(quotation.status)) {
      throw new BadRequestException(`Cannot expire quotation in status '${quotation.status}'`);
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });

    await this.auditService.log({
      actorUserId,
      action: 'QUOTATION_EXPIRED',
      entityType: 'Quotation',
      entityId: id,
      metadata: { quotationNumber: quotation.quotationNumber },
    }).catch(() => {});

    return updated;
  }
}
