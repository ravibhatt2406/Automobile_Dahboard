import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateFinanceApplicationDto } from './dto/create-finance-application.dto';
import { AuditService } from '../audit/audit.service';
import { FinanceStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateFinanceApplicationDto, actorUserId: string) {
    const existing = await this.prisma.financeApplication.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existing) {
      throw new ConflictException(`Finance application already exists for Booking ID '${dto.bookingId}'`);
    }

    const applicationNumber = `FIN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const application = await this.prisma.financeApplication.create({
      data: {
        applicationNumber,
        customerId: dto.customerId,
        bookingId: dto.bookingId,
        financeProvider: dto.financeProvider,
        loanAmount: dto.loanAmount,
        downPayment: dto.downPayment,
        tenureMonths: dto.tenureMonths,
        interestRate: dto.interestRate || null,
        remarks: dto.remarks || null,
        status: 'SUBMITTED',
      },
      include: {
        customer: true,
        booking: true,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FINANCE_APPLICATION_SUBMITTED',
      entityType: 'FinanceApplication',
      entityId: application.id,
      metadata: { applicationNumber, provider: dto.financeProvider, loanAmount: dto.loanAmount },
    });

    return application;
  }

  async updateStatus(id: string, status: FinanceStatus, remarks?: string, actorUserId?: string) {
    const app = await this.findOne(id);

    const updated = await this.prisma.financeApplication.update({
      where: { id },
      data: {
        status,
        remarks: remarks ? `${app.remarks || ''}\nStatus update (${status}): ${remarks}` : app.remarks,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: `FINANCE_APPLICATION_${status}`,
      entityType: 'FinanceApplication',
      entityId: id,
      metadata: { applicationNumber: app.applicationNumber, status },
    });

    return updated;
  }

  async findAll(customerId?: string, status?: FinanceStatus, limit = 50, offset = 0) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.financeApplication.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, booking: true },
      }),
      this.prisma.financeApplication.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const app = await this.prisma.financeApplication.findUnique({
      where: { id },
      include: { customer: true, booking: true },
    });

    if (!app) {
      throw new NotFoundException(`Finance Application ID '${id}' not found`);
    }

    return app;
  }
}
