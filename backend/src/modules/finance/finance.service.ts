import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateFinanceApplicationDto } from './dto/create-finance-application.dto';
import { AuditService } from '../audit/audit.service';
import { FinanceStatus } from '@prisma/client';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateFinanceApplicationDto, actorUserId: string) {
    const applicationNumber = `FIN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const existing = await this.prisma.financeApplication.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existing) {
      throw new ConflictException(`Finance application already exists for Booking ID '${dto.bookingId}'`);
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException(`Booking ID '${dto.bookingId}' not found`);

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
      include: { customer: true, booking: true },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FINANCE_APPLICATION_SUBMITTED',
      entityType: 'FinanceApplication',
      entityId: application.id,
      metadata: { applicationNumber, provider: dto.financeProvider, loanAmount: dto.loanAmount },
    }).catch(() => {});

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
    }).catch(() => {});

    return updated;
  }

  async findAll(
    customerId?: string,
    status?: FinanceStatus,
    limit = 50,
    offset = 0,
    user?: any,
    branchId?: string,
    franchiseId?: string,
  ) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

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
        where.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.booking = { branchId: scope.effectiveBranchId };
        }
      } else {
        where.booking = { branchId: scope.effectiveBranchId };
      }
    } else if (scope?.isActingSuperAdmin) {
      if (scope.effectiveFranchiseId) {
        where.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
        if (scope.effectiveBranchId) {
          where.booking = { branchId: scope.effectiveBranchId };
        }
      } else if (scope.effectiveBranchId) {
        where.booking = { branchId: scope.effectiveBranchId };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.financeApplication.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          booking: { include: { branch: true } },
        },
      }),
      this.prisma.financeApplication.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const app = await this.prisma.financeApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        booking: { include: { branch: true } },
      },
    });

    if (!app) throw new NotFoundException(`Finance Application ID '${id}' not found`);

    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (scope.isCustomer) {
        const resolvedCustomerId =
          user.customerId ||
          user.customerProfile?.id ||
          (await this.prisma.customer.findFirst({ where: { userId: user.id } }))?.id;
        if (!resolvedCustomerId || app.customerId !== resolvedCustomerId) {
          throw new ForbiddenException('Access denied to finance application');
        }
      } else if (!scope.isActingSuperAdmin) {
        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && app.booking?.branch?.franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to finance application in another franchise');
          }
          if (scope.effectiveBranchId && app.booking?.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to finance application in another branch');
          }
        } else {
          if (scope.effectiveBranchId && app.booking?.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to finance application in another branch');
          }
        }
      }
    }

    return app;
  }
}
