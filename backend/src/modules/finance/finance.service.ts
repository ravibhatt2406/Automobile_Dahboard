import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateFinanceApplicationDto } from './dto/create-finance-application.dto';
import { GenerateEmiScheduleDto } from './dto/generate-emi-schedule.dto';
import { RecordEmiPaymentDto } from './dto/record-emi-payment.dto';
import { AuditService } from '../audit/audit.service';
import { FinanceStatus, EmiScheduleStatus, Prisma } from '@prisma/client';
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

    let calculatedEmi = dto.emiAmount;
    if (!calculatedEmi && dto.interestRate && dto.tenureMonths && dto.loanAmount) {
      const p = Number(dto.loanAmount);
      const r = Number(dto.interestRate) / 12 / 100;
      const n = Number(dto.tenureMonths);
      calculatedEmi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    const application = await this.prisma.financeApplication.create({
      data: {
        applicationNumber,
        customerId: dto.customerId,
        bookingId: dto.bookingId,
        financeProvider: dto.financeProvider,
        loanReference: dto.loanReference || null,
        loanAmount: new Prisma.Decimal(dto.loanAmount),
        downPayment: new Prisma.Decimal(dto.downPayment),
        tenureMonths: dto.tenureMonths,
        interestRate: dto.interestRate ? new Prisma.Decimal(dto.interestRate) : null,
        emiAmount: calculatedEmi ? new Prisma.Decimal(calculatedEmi) : null,
        firstEmiDate: dto.firstEmiDate ? new Date(dto.firstEmiDate) : null,
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
      metadata: {
        applicationNumber,
        provider: dto.financeProvider,
        loanAmount: dto.loanAmount,
        loanReference: dto.loanReference,
      },
    }).catch(() => {});

    // If firstEmiDate is provided, auto-generate schedule
    if (dto.firstEmiDate && calculatedEmi) {
      await this.generateEmiSchedule(
        application.id,
        {
          firstDueDate: dto.firstEmiDate,
          customEmiAmount: calculatedEmi,
          tenureMonths: dto.tenureMonths,
          interestRate: dto.interestRate,
        },
        { id: actorUserId },
      ).catch(() => {});
    }

    return application;
  }

  async updateStatus(id: string, status: FinanceStatus, remarks?: string, actorUserId?: string) {
    const app = await this.findOne(id);

    const updated = await this.prisma.financeApplication.update({
      where: { id },
      data: {
        status,
        remarks: remarks ? `${app.remarks || ''}\nStatus update (${status}): ${remarks}` : app.remarks,
        disbursedAt: status === 'APPROVED' && !app.disbursedAt ? new Date() : app.disbursedAt,
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
          booking: {
            include: {
              branch: true,
              quotation: {
                include: { variant: true },
              },
            },
          },
          emiSchedules: {
            orderBy: { installmentNumber: 'asc' },
          },
        },
      }),
      this.prisma.financeApplication.count({ where }),
    ]);

    // Enrich items with live EMI calculations
    const enriched = items.map((app) => {
      const now = new Date();
      let totalPaidEmi = 0;
      let totalOverdueEmi = 0;
      let overdueCount = 0;
      let nextDueEmi: any = null;

      for (const s of app.emiSchedules) {
        const paid = Number(s.paidAmount);
        const emi = Number(s.emiAmount);
        totalPaidEmi += paid;

        if (paid < emi && new Date(s.dueDate) < now) {
          overdueCount++;
          totalOverdueEmi += (emi - paid);
        }

        if (paid < emi && (!nextDueEmi || new Date(s.dueDate) < new Date(nextDueEmi.dueDate))) {
          nextDueEmi = s;
        }
      }

      const totalEmiSum = app.emiSchedules.reduce((sum, s) => sum + Number(s.emiAmount), 0);
      const outstandingEmi = totalEmiSum > 0 ? totalEmiSum - totalPaidEmi : Number(app.loanAmount);

      return {
        ...app,
        emiSummary: {
          totalSchedules: app.emiSchedules.length,
          totalPaidEmi,
          outstandingEmi,
          overdueCount,
          totalOverdueEmi,
          nextDueDate: nextDueEmi ? nextDueEmi.dueDate : null,
          nextDueAmount: nextDueEmi ? Number(nextDueEmi.emiAmount) - Number(nextDueEmi.paidAmount) : 0,
        },
      };
    });

    return { items: enriched, total, limit, offset };
  }

  async findOne(id: string, user?: any) {
    const app = await this.prisma.financeApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        booking: {
          include: {
            branch: { include: { franchise: true } },
            quotation: {
              include: { variant: true },
            },
            vehicle: true,
          },
        },
        emiSchedules: {
          orderBy: { installmentNumber: 'asc' },
        },
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

    // Dynamic overdue check
    const now = new Date();
    const schedulesWithLiveStatus = app.emiSchedules.map((s) => {
      let liveStatus = s.status;
      const paid = Number(s.paidAmount);
      const emi = Number(s.emiAmount);
      if (paid >= emi) {
        liveStatus = EmiScheduleStatus.PAID;
      } else if (new Date(s.dueDate) < now) {
        liveStatus = EmiScheduleStatus.OVERDUE;
      } else if (paid > 0) {
        liveStatus = EmiScheduleStatus.PARTIALLY_PAID;
      } else {
        liveStatus = EmiScheduleStatus.UPCOMING;
      }
      return { ...s, liveStatus, remainingAmount: emi - paid };
    });

    const totalPaid = schedulesWithLiveStatus.reduce((sum, s) => sum + Number(s.paidAmount), 0);
    const totalEmiObligation = schedulesWithLiveStatus.reduce((sum, s) => sum + Number(s.emiAmount), 0);
    const overdueSchedules = schedulesWithLiveStatus.filter((s) => s.liveStatus === EmiScheduleStatus.OVERDUE);
    const totalOverdueAmount = overdueSchedules.reduce((sum, s) => sum + s.remainingAmount, 0);

    return {
      ...app,
      emiSchedules: schedulesWithLiveStatus,
      emiSummary: {
        totalInstallments: schedulesWithLiveStatus.length,
        paidInstallments: schedulesWithLiveStatus.filter((s) => s.liveStatus === EmiScheduleStatus.PAID).length,
        overdueInstallments: overdueSchedules.length,
        totalPaid,
        totalEmiObligation,
        outstandingAmount: totalEmiObligation - totalPaid,
        totalOverdueAmount,
      },
    };
  }

  async generateEmiSchedule(financeApplicationId: string, dto: GenerateEmiScheduleDto, user: any) {
    const app = await this.findOne(financeApplicationId, user);

    const tenure = dto.tenureMonths || app.tenureMonths;
    if (!tenure || tenure < 1) {
      throw new BadRequestException('Tenure months must be specified');
    }

    let monthlyEmi = dto.customEmiAmount;
    const rate = dto.interestRate !== undefined ? dto.interestRate : (app.interestRate ? Number(app.interestRate) : 0);
    const principal = Number(app.loanAmount);

    if (!monthlyEmi) {
      if (rate > 0) {
        const r = rate / 12 / 100;
        monthlyEmi = Math.round((principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));
      } else {
        monthlyEmi = Math.round(principal / tenure);
      }
    }

    const firstDueDate = new Date(dto.firstDueDate);
    if (isNaN(firstDueDate.getTime())) {
      throw new BadRequestException('Invalid firstDueDate');
    }

    // Preserve any already paid schedules
    const existingPaid = await this.prisma.financeEmiSchedule.findMany({
      where: {
        financeApplicationId,
        paidAmount: { gt: 0 },
      },
    });

    if (existingPaid.length > 0) {
      throw new BadRequestException(
        `Cannot regenerate schedule: ${existingPaid.length} installments have already been recorded as paid.`,
      );
    }

    // Delete existing un-paid schedules
    await this.prisma.financeEmiSchedule.deleteMany({
      where: { financeApplicationId },
    });

    const schedulesToCreate: Prisma.FinanceEmiScheduleCreateManyInput[] = [];
    const monthlyRate = rate > 0 ? rate / 12 / 100 : 0;
    let remainingPrincipal = principal;

    for (let i = 1; i <= tenure; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      let interestComponent = Math.round(remainingPrincipal * monthlyRate);
      let principalComponent = monthlyEmi - interestComponent;
      if (principalComponent > remainingPrincipal || i === tenure) {
        principalComponent = remainingPrincipal;
      }
      remainingPrincipal = Math.max(0, remainingPrincipal - principalComponent);

      schedulesToCreate.push({
        financeApplicationId,
        installmentNumber: i,
        dueDate,
        emiAmount: new Prisma.Decimal(monthlyEmi),
        principalComponent: new Prisma.Decimal(principalComponent),
        interestComponent: new Prisma.Decimal(interestComponent),
        paidAmount: new Prisma.Decimal(0),
        status: EmiScheduleStatus.UPCOMING,
      });
    }

    await this.prisma.financeEmiSchedule.createMany({
      data: schedulesToCreate,
    });

    // Update finance app with firstEmiDate & emiAmount
    await this.prisma.financeApplication.update({
      where: { id: financeApplicationId },
      data: {
        firstEmiDate: firstDueDate,
        emiAmount: new Prisma.Decimal(monthlyEmi),
        tenureMonths: tenure,
        interestRate: rate > 0 ? new Prisma.Decimal(rate) : null,
      },
    });

    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'FINANCE_EMI_SCHEDULE_GENERATED',
      entityType: 'FinanceApplication',
      entityId: financeApplicationId,
      metadata: { tenure, monthlyEmi, firstDueDate },
    }).catch(() => {});

    return this.findOne(financeApplicationId, user);
  }

  async recordEmiPayment(emiScheduleId: string, dto: RecordEmiPaymentDto, user: any) {
    const schedule = await this.prisma.financeEmiSchedule.findUnique({
      where: { id: emiScheduleId },
      include: {
        financeApplication: {
          include: {
            booking: { include: { branch: true } },
            customer: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`EMI Schedule installment ID '${emiScheduleId}' not found`);
    }

    // Tenant scope check
    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (!scope.isActingSuperAdmin) {
        const branchId = schedule.financeApplication?.booking?.branchId;
        const franchiseId = schedule.financeApplication?.booking?.branch?.franchiseId;
        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to EMI in another franchise');
          }
          if (scope.effectiveBranchId && branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to EMI in another branch');
          }
        } else {
          if (scope.effectiveBranchId && branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to EMI in another branch');
          }
        }
      }
    }

    const currentPaid = Number(schedule.paidAmount);
    const emiAmount = Number(schedule.emiAmount);
    const newPaid = currentPaid + Number(dto.amount);

    let newStatus: EmiScheduleStatus = EmiScheduleStatus.PARTIALLY_PAID;
    if (newPaid >= emiAmount) {
      newStatus = EmiScheduleStatus.PAID;
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    const updated = await this.prisma.financeEmiSchedule.update({
      where: { id: emiScheduleId },
      data: {
        paidAmount: new Prisma.Decimal(newPaid),
        status: newStatus,
        paidAt,
        paymentMode: dto.paymentMode,
        paymentReference: dto.paymentReference,
        receiptUrl: dto.receiptUrl || schedule.receiptUrl,
        notes: dto.notes ? `${schedule.notes || ''}\n${dto.notes}`.trim() : schedule.notes,
        recordedByEmployeeId: user?.id || null,
      },
    });

    // CRITICAL: We DO NOT create or modify Invoice or dealership Payments.
    // Financier EMI collections are debts owed to third-party financiers and not dealership sales revenue.
    await this.auditService.log({
      actorUserId: user?.id || 'SYSTEM',
      action: 'FINANCE_EMI_PAYMENT_RECORDED',
      entityType: 'FinanceEmiSchedule',
      entityId: emiScheduleId,
      metadata: {
        financeApplicationId: schedule.financeApplicationId,
        installmentNumber: schedule.installmentNumber,
        amount: dto.amount,
        paymentMode: dto.paymentMode,
        paymentReference: dto.paymentReference,
        newStatus,
      },
    }).catch(() => {});

    return updated;
  }

  async getOverdueEmis(branchId?: string, franchiseId?: string, limit = 50, user?: any) {
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);
    const now = new Date();

    const where: any = {
      dueDate: { lt: now },
      status: { not: EmiScheduleStatus.PAID },
    };

    if (scope && !scope.isActingSuperAdmin) {
      if (scope.isActingFranchiseLevel) {
        where.financeApplication = {
          booking: { branch: { franchiseId: scope.effectiveFranchiseId } },
        };
        if (scope.effectiveBranchId) {
          where.financeApplication.booking.branchId = scope.effectiveBranchId;
        }
      } else {
        where.financeApplication = {
          booking: { branchId: scope.effectiveBranchId },
        };
      }
    }

    const items = await this.prisma.financeEmiSchedule.findMany({
      where,
      take: limit,
      orderBy: { dueDate: 'asc' },
      include: {
        financeApplication: {
          include: {
            customer: true,
            booking: {
              include: {
                branch: true,
                vehicle: true,
              },
            },
          },
        },
      },
    });

    const enriched = items.map((item) => {
      const emi = Number(item.emiAmount);
      const paid = Number(item.paidAmount);
      const overdueAmount = emi - paid;
      const daysOverdue = Math.floor((now.getTime() - new Date(item.dueDate).getTime()) / (1000 * 3600 * 24));

      return {
        ...item,
        overdueAmount,
        daysOverdue,
      };
    });

    return {
      items: enriched,
      total: enriched.length,
      totalOverdueAmount: enriched.reduce((sum, i) => sum + i.overdueAmount, 0),
    };
  }
}
