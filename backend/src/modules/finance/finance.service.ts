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

  async create(dto: CreateFinanceApplicationDto, actorUserId: string, user?: any) {
    if (Number(dto.loanAmount) <= 0) {
      throw new BadRequestException('Loan principal amount must be positive.');
    }
    if (Number(dto.downPayment) < 0) {
      throw new BadRequestException('Down payment cannot be negative.');
    }
    if (!dto.tenureMonths || dto.tenureMonths < 1) {
      throw new BadRequestException('Loan tenure months must be at least 1.');
    }

    // 1. Customer validation
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ID '${dto.customerId}' not found in database.`);
    }

    // 2. Vehicle validation
    let resolvedVehicleId = dto.vehicleId || null;
    if (resolvedVehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: resolvedVehicleId },
        include: { branch: true },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle ID '${resolvedVehicleId}' not found.`);
      }
    }

    // 3. Resolve or validate booking
    let resolvedBookingId = dto.bookingId;
    if (resolvedBookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: resolvedBookingId },
        include: { branch: true, vehicle: true },
      });
      if (!booking) {
        throw new NotFoundException(`Booking ID '${resolvedBookingId}' not found.`);
      }
      if (booking.customerId !== dto.customerId) {
        throw new BadRequestException(`Booking ID '${resolvedBookingId}' does not belong to the selected customer.`);
      }
      if (resolvedVehicleId && booking.vehicleId && booking.vehicleId !== resolvedVehicleId) {
        throw new BadRequestException('Selected vehicle does not match the vehicle linked to the selected booking.');
      }
      if (!resolvedVehicleId && booking.vehicleId) {
        resolvedVehicleId = booking.vehicleId;
      }

      // Check tenant scope for booking
      if (user) {
        const scope = user.effectiveScope || (await resolveUserScope(this.prisma, user));
        if (!scope.isActingSuperAdmin) {
          if (scope.isActingFranchiseLevel) {
            if (scope.effectiveFranchiseId && booking.branch?.franchiseId !== scope.effectiveFranchiseId) {
              throw new ForbiddenException('Booking belongs to another franchise.');
            }
          } else if (scope.effectiveBranchId && booking.branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Booking belongs to another branch.');
          }
        }
      }
    } else {
      const candidateBookings = await this.prisma.booking.findMany({
        where: {
          customerId: dto.customerId,
          ...(resolvedVehicleId ? { vehicleId: resolvedVehicleId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { branch: true },
      });

      let availableBooking: any = null;
      for (const b of candidateBookings) {
        const existingApp = await this.prisma.financeApplication.findUnique({
          where: { bookingId: b.id },
        });
        if (!existingApp) {
          availableBooking = b;
          break;
        }
      }

      if (!availableBooking) {
        if (candidateBookings.length > 0) {
          throw new ConflictException(
            'All existing bookings for this customer/vehicle already have a finance application.',
          );
        }
        throw new BadRequestException(
          'No booking found for this customer and vehicle. An active deal booking is required to record commercial finance.',
        );
      }

      resolvedBookingId = availableBooking.id;
      if (!resolvedVehicleId && availableBooking.vehicleId) {
        resolvedVehicleId = availableBooking.vehicleId;
      }
    }

    if (!resolvedBookingId) {
      throw new BadRequestException('A valid deal booking ID is required to record commercial finance.');
    }

    const applicationNumber = `FIN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const existing = await this.prisma.financeApplication.findUnique({
      where: { bookingId: resolvedBookingId },
    });
    if (existing) {
      throw new ConflictException(`Finance application already exists for Booking ID '${resolvedBookingId}'`);
    }

    const interestMethod = dto.interestMethod || 'REDUCING_BALANCE';
    let calculatedEmi = dto.emiAmount;
    const p = Number(dto.loanAmount);
    const n = Number(dto.tenureMonths);
    const rate = dto.interestRate ? Number(dto.interestRate) : 0;

    if (!calculatedEmi && rate > 0 && n > 0 && p > 0) {
      if (interestMethod === 'FLAT_RATE') {
        const totalInterest = p * (rate / 100) * (n / 12);
        calculatedEmi = Math.round((p + totalInterest) / n);
      } else {
        // Reducing balance
        const r = rate / 12 / 100;
        calculatedEmi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      }
    }

    const application = await this.prisma.financeApplication.create({
      data: {
        applicationNumber,
        customerId: dto.customerId,
        bookingId: resolvedBookingId,
        vehicleId: resolvedVehicleId,
        financeProvider: dto.financeProvider,
        loanReference: dto.loanReference || null,
        vehiclePrice: dto.vehiclePrice ? new Prisma.Decimal(dto.vehiclePrice) : null,
        loanAmount: new Prisma.Decimal(dto.loanAmount),
        downPayment: new Prisma.Decimal(dto.downPayment),
        tenureMonths: dto.tenureMonths,
        interestRate: dto.interestRate ? new Prisma.Decimal(dto.interestRate) : null,
        interestMethod,
        emiAmount: calculatedEmi ? new Prisma.Decimal(calculatedEmi) : null,
        firstEmiDate: dto.firstEmiDate ? new Date(dto.firstEmiDate) : null,
        documentKey: dto.documentKey || null,
        remarks: dto.remarks || null,
        status: FinanceStatus.SUBMITTED,
        isManual: true,
      },
      include: {
        customer: true,
        booking: {
          include: {
            branch: { include: { franchise: true } },
            quotation: { include: { variant: true } },
            vehicle: true,
          },
        },
        vehicle: {
          include: { variant: true, branch: true },
        },
      },
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
        interestMethod,
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
        user || { id: actorUserId, effectiveScope: { isActingSuperAdmin: true } },
      ).catch(() => {});
    }

    return this.findOne(application.id, user);
  }

  async updateStatus(id: string, status: FinanceStatus, remarks?: string, actorUserId?: string, user?: any) {
    const app = await this.findOne(id, user);

    // Validate status transition state machine
    const current = app.status;
    const allowedTransitions: Record<FinanceStatus, FinanceStatus[]> = {
      [FinanceStatus.DRAFT]: [FinanceStatus.SUBMITTED, FinanceStatus.CANCELLED],
      [FinanceStatus.SUBMITTED]: [FinanceStatus.UNDER_REVIEW, FinanceStatus.CANCELLED],
      [FinanceStatus.UNDER_REVIEW]: [FinanceStatus.APPROVED, FinanceStatus.REJECTED, FinanceStatus.CANCELLED],
      [FinanceStatus.APPROVED]: [FinanceStatus.DISBURSED, FinanceStatus.CANCELLED],
      [FinanceStatus.DISBURSED]: [], // Disbursed is terminal active loan
      [FinanceStatus.REJECTED]: [],  // Terminal
      [FinanceStatus.CANCELLED]: [], // Terminal
    };

    if (current !== status) {
      const allowed = allowedTransitions[current] || [];
      if (!allowed.includes(status)) {
        throw new BadRequestException(
          `Invalid finance status transition from '${current}' to '${status}'. Allowed transitions: [${allowed.join(', ') || 'NONE'}]`,
        );
      }
    }

    const now = new Date();
    const isApproving = status === FinanceStatus.APPROVED && current !== FinanceStatus.APPROVED;
    const isDisbursing = status === FinanceStatus.DISBURSED && current !== FinanceStatus.DISBURSED;

    const updated = await this.prisma.financeApplication.update({
      where: { id },
      data: {
        status,
        remarks: remarks ? `${app.remarks || ''}\n[Status: ${status}] ${remarks}`.trim() : app.remarks,
        approvedAt: isApproving ? now : app.approvedAt,
        disbursedAt: isDisbursing ? now : app.disbursedAt,
        disbursedAmount: isDisbursing ? app.loanAmount : app.disbursedAmount,
      },
      include: {
        customer: true,
        booking: {
          include: { branch: true, vehicle: true },
        },
        vehicle: true,
      },
    });

    await this.auditService.log({
      actorUserId: actorUserId || 'SYSTEM',
      action: `FINANCE_APPLICATION_${status}`,
      entityType: 'FinanceApplication',
      entityId: id,
      metadata: {
        applicationNumber: app.applicationNumber,
        previousStatus: current,
        newStatus: status,
        remarks,
      },
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
    vehicleId?: string,
  ) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (vehicleId) where.vehicleId = vehicleId;
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
              branch: { include: { franchise: true } },
              quotation: {
                include: { variant: true },
              },
              vehicle: true,
            },
          },
          vehicle: {
            include: { variant: true, branch: true },
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

  async getDashboardStats(user?: any, branchId?: string, franchiseId?: string) {
    const scope = user?.effectiveScope || (user ? await resolveUserScope(this.prisma, user, branchId, franchiseId) : null);
    const where: any = {};

    if (scope?.isCustomer) {
      const resolvedCustomerId =
        user?.customerId ||
        user?.customerProfile?.id ||
        (await this.prisma.customer.findFirst({ where: { userId: user?.id } }))?.id;
      if (!resolvedCustomerId) {
        return {
          totalApplications: 0,
          pendingReview: 0,
          approvedLoans: 0,
          awaitingDisbursement: 0,
          activeAgreements: 0,
          upcomingInstallments: 0,
          overdueInstallments: 0,
          totalOverdueAmount: 0,
          totalOutstandingBalance: 0,
        };
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

    const apps = await this.prisma.financeApplication.findMany({
      where,
      select: {
        id: true,
        status: true,
        loanAmount: true,
        disbursedAt: true,
        emiSchedules: {
          select: {
            dueDate: true,
            emiAmount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
    });

    const now = new Date();
    let pendingReview = 0;
    let approvedLoans = 0;
    let awaitingDisbursement = 0;
    let activeAgreements = 0;
    let upcomingInstallments = 0;
    let overdueInstallments = 0;
    let totalOverdueAmount = 0;
    let totalOutstandingBalance = 0;

    for (const app of apps) {
      if (([FinanceStatus.DRAFT, FinanceStatus.SUBMITTED, FinanceStatus.UNDER_REVIEW] as FinanceStatus[]).includes(app.status)) {
        pendingReview++;
      } else if (app.status === FinanceStatus.APPROVED) {
        approvedLoans++;
        if (!app.disbursedAt) {
          awaitingDisbursement++;
        }
      } else if (app.status === FinanceStatus.DISBURSED) {
        activeAgreements++;
      }

      // Calculate schedule balances
      let appPaid = 0;
      let appTotalObligation = 0;
      for (const s of app.emiSchedules) {
        const emi = Number(s.emiAmount);
        const paid = Number(s.paidAmount);
        appPaid += paid;
        appTotalObligation += emi;

        if (paid < emi) {
          if (new Date(s.dueDate) < now) {
            overdueInstallments++;
            totalOverdueAmount += (emi - paid);
          } else {
            upcomingInstallments++;
          }
        }
      }

      if (appTotalObligation > 0) {
        totalOutstandingBalance += Math.max(0, appTotalObligation - appPaid);
      } else if (([FinanceStatus.APPROVED, FinanceStatus.DISBURSED] as FinanceStatus[]).includes(app.status)) {
        totalOutstandingBalance += Number(app.loanAmount);
      }
    }

    return {
      totalApplications: apps.length,
      pendingReview,
      approvedLoans,
      awaitingDisbursement,
      activeAgreements,
      upcomingInstallments,
      overdueInstallments,
      totalOverdueAmount,
      totalOutstandingBalance,
    };
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
        vehicle: {
          include: { variant: true, branch: true },
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
        const branchId = app.booking?.branchId || app.vehicle?.branchId;
        const franchiseId = app.booking?.branch?.franchiseId || app.vehicle?.branch?.franchiseId;

        if (scope.isActingFranchiseLevel) {
          if (scope.effectiveFranchiseId && franchiseId !== scope.effectiveFranchiseId) {
            throw new ForbiddenException('Access denied to finance application in another franchise');
          }
          if (scope.effectiveBranchId && branchId !== scope.effectiveBranchId) {
            throw new ForbiddenException('Access denied to finance application in another branch');
          }
        } else {
          if (scope.effectiveBranchId && branchId !== scope.effectiveBranchId) {
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
      throw new BadRequestException('Tenure months must be specified and positive.');
    }

    const rate = dto.interestRate !== undefined ? dto.interestRate : (app.interestRate ? Number(app.interestRate) : 0);
    const principal = Number(app.loanAmount);
    const isFlatRate = app.interestMethod === 'FLAT_RATE';

    let monthlyEmi = dto.customEmiAmount;

    if (!monthlyEmi) {
      if (rate > 0) {
        if (isFlatRate) {
          const totalInterest = principal * (rate / 100) * (tenure / 12);
          monthlyEmi = Math.round((principal + totalInterest) / tenure);
        } else {
          // Reducing balance
          const r = rate / 12 / 100;
          monthlyEmi = Math.round((principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));
        }
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
    let remainingPrincipal = principal;
    const monthlyRate = rate > 0 ? rate / 12 / 100 : 0;
    const flatInterestPerMonth = isFlatRate && rate > 0 ? Math.round((principal * (rate / 100)) / 12) : 0;

    for (let i = 1; i <= tenure; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      let interestComponent: number;
      let principalComponent: number;

      if (isFlatRate) {
        interestComponent = flatInterestPerMonth;
        principalComponent = monthlyEmi - interestComponent;
      } else {
        interestComponent = Math.round(remainingPrincipal * monthlyRate);
        principalComponent = monthlyEmi - interestComponent;
      }

      // Handle final installment rounding to match principal exactly
      if (i === tenure || principalComponent > remainingPrincipal) {
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
      metadata: { tenure, monthlyEmi, firstDueDate, interestMethod: app.interestMethod },
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
            vehicle: true,
            customer: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`EMI Schedule installment ID '${emiScheduleId}' not found`);
    }

    if (Number(dto.amount) <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    // Tenant scope check
    if (user) {
      const scope = user?.effectiveScope || (await resolveUserScope(this.prisma, user));
      if (!scope.isActingSuperAdmin) {
        const branchId = schedule.financeApplication?.booking?.branchId || schedule.financeApplication?.vehicle?.branchId;
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
            vehicle: true,
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

  async getHistory(id: string, user?: any) {
    await this.findOne(id, user);

    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'FinanceApplication',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: {
          select: { id: true, email: true, accountType: true },
        },
      },
    });
  }

  async attachDocument(id: string, fileDto: any, actorUserId: string, user?: any) {
    const app = await this.findOne(id, user);

    const fileId = `FILE-FIN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const file = await this.prisma.fileAttachment.create({
      data: {
        fileId,
        entityType: 'FinanceApplication',
        entityId: id,
        storageKey: fileDto.storageKey || `finance/${app.applicationNumber}/${fileDto.filename || 'agreement.pdf'}`,
        filename: fileDto.filename || 'loan_agreement.pdf',
        mimeType: fileDto.mimeType || 'application/pdf',
        size: fileDto.size || 1024,
        uploadedByUserId: actorUserId,
      },
    });

    await this.prisma.financeApplication.update({
      where: { id },
      data: { documentKey: file.storageKey },
    });

    await this.auditService.log({
      actorUserId,
      action: 'FINANCE_DOCUMENT_ATTACHED',
      entityType: 'FinanceApplication',
      entityId: id,
      metadata: { fileId, filename: file.filename, storageKey: file.storageKey },
    }).catch(() => {});

    return file;
  }
}
