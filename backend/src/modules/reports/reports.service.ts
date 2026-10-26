import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async resolveScope(user?: any, branchId?: string, franchiseId?: string) {
    const roles: string[] = user?.roles || [];
    const scope = user?.effectiveScope;
    const isSuperAdmin = scope
      ? (scope.isActingSuperAdmin || scope.isRealSuperAdmin)
      : user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = scope
      ? scope.isActingFranchiseLevel
      : roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));

    let effectiveBranchId =
      scope?.effectiveBranchId || (branchId && branchId !== 'ALL' ? branchId : undefined);
    let effectiveFranchiseId =
      scope?.effectiveFranchiseId || (franchiseId && franchiseId !== 'ALL' ? franchiseId : undefined);

    if (user && !isSuperAdmin) {
      if (isFranchiseLevel) {
        const userFranchiseId =
          scope?.effectiveFranchiseId || user.assignedFranchiseId || user.franchiseId;
        if (effectiveFranchiseId && effectiveFranchiseId !== userFranchiseId) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized franchise access');
        }
        effectiveFranchiseId = userFranchiseId;

        if (effectiveBranchId) {
          const b = await this.prisma.branch.findFirst({
            where: { OR: [{ id: effectiveBranchId }, { code: effectiveBranchId }] },
          });
          if (!b || b.franchiseId !== userFranchiseId) {
            throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
          }
          effectiveBranchId = b.id;
        }
      } else {
        // Branch Level
        const userBranchId =
          user.assignedBranchId || user.branchId || user.employeeProfile?.branchId;
        if (
          effectiveBranchId &&
          effectiveBranchId !== userBranchId &&
          effectiveBranchId !== user.employeeProfile?.branch?.code
        ) {
          throw new ForbiddenException('Multi-tenant scope violation: Unauthorized branch access');
        }
        effectiveBranchId = userBranchId;
      }
    } else if (isSuperAdmin) {
      if (effectiveFranchiseId && effectiveBranchId) {
        const b = await this.prisma.branch.findFirst({
          where: { OR: [{ id: effectiveBranchId }, { code: effectiveBranchId }] },
        });
        if (b && b.franchiseId !== effectiveFranchiseId) {
          throw new BadRequestException('Selected branch does not belong to the selected franchise');
        }
        effectiveBranchId = b ? b.id : effectiveBranchId;
      } else if (effectiveBranchId) {
        const b = await this.prisma.branch.findFirst({
          where: { OR: [{ id: effectiveBranchId }, { code: effectiveBranchId }] },
        });
        effectiveBranchId = b ? b.id : effectiveBranchId;
      }
    }

    return { effectiveBranchId, effectiveFranchiseId };
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      return { gte: new Date(startDate) };
    } else if (endDate) {
      return { lte: new Date(endDate) };
    }
    return undefined;
  }

  async getSalesReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const where: any = {};
    const dateFilter = this.buildDateFilter(startDate, endDate);
    if (dateFilter) where.createdAt = dateFilter;

    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
    }

    const [
      totalLeads,
      totalQuotations,
      totalBookings,
      revenueAgg,
      collectedAgg,
      unpaidInvoicesAgg,
      bookingsList,
      deliveriesList,
    ] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.quotation.count({
        where: {
          ...(effectiveBranchId
            ? { branchId: effectiveBranchId }
            : effectiveFranchiseId
            ? { franchiseId: effectiveFranchiseId }
            : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.aggregate({
        where: { ...where, status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          booking: where,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...(effectiveBranchId
            ? { branchId: effectiveBranchId }
            : effectiveFranchiseId
            ? { franchiseId: effectiveFranchiseId }
            : {}),
          paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          status: 'ISSUED',
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.booking.findMany({
        where,
        select: {
          createdAt: true,
          totalAmount: true,
          status: true,
          branch: { select: { name: true } },
          vehicle: { select: { variant: { select: { name: true } } } },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.delivery.findMany({
        where: {
          ...(effectiveBranchId
            ? { booking: { branchId: effectiveBranchId } }
            : effectiveFranchiseId
            ? { booking: { branch: { franchiseId: effectiveFranchiseId } } }
            : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { status: true },
      }),
    ]);

    // Aggregate monthly bookings
    const monthlyMap: Record<string, { count: number; revenue: number }> = {};
    for (const b of bookingsList) {
      const monthKey = new Date(b.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { count: 0, revenue: 0 };
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].revenue += Number(b.totalAmount || 0);
    }
    const bookingsByMonth = Object.entries(monthlyMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Aggregate sales by branch
    const branchMap: Record<string, { count: number; revenue: number }> = {};
    for (const b of bookingsList) {
      const name = b.branch?.name || 'Unknown Branch';
      if (!branchMap[name]) branchMap[name] = { count: 0, revenue: 0 };
      branchMap[name].count += 1;
      branchMap[name].revenue += Number(b.totalAmount || 0);
    }
    const salesByBranch = Object.entries(branchMap).map(([branchName, data]) => ({
      branchName,
      ...data,
    }));

    // Aggregate sales by vehicle model
    const modelMap: Record<string, { count: number; revenue: number }> = {};
    for (const b of bookingsList) {
      const model = b.vehicle?.variant?.name || 'Standard Commercial Truck';
      if (!modelMap[model]) modelMap[model] = { count: 0, revenue: 0 };
      modelMap[model].count += 1;
      modelMap[model].revenue += Number(b.totalAmount || 0);
    }
    const salesByModel = Object.entries(modelMap).map(([model, data]) => ({ model, ...data }));

    // Aggregate deliveries by status
    const deliveryStatusMap: Record<string, number> = {};
    for (const d of deliveriesList) {
      deliveryStatusMap[d.status] = (deliveryStatusMap[d.status] || 0) + 1;
    }
    const deliveriesByStatus = Object.entries(deliveryStatusMap).map(([status, count]) => ({
      status,
      count,
    }));

    return {
      totalLeads,
      totalQuotations,
      totalBookings,
      conversionRate:
        totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100 * 100) / 100 : 0,
      totalRevenue: Number(revenueAgg._sum?.totalAmount || 0),
      totalCollectedPayments: Number(collectedAgg._sum?.amount || 0),
      outstandingInvoicesAmount: Number(unpaidInvoicesAgg._sum?.totalAmount || 0),
      bookingsByMonth,
      salesByBranch,
      salesByModel,
      deliveriesByStatus,
    };
  }

  async getSalesOverview(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
    groupBy: 'day' | 'week' | 'month' = 'month',
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    // Build date filter
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const dateFilter = { gte: start, lte: end };

    // Query authorized branches in scope
    const branchWhere: any = {};
    if (effectiveBranchId) {
      branchWhere.id = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      branchWhere.franchiseId = effectiveFranchiseId;
    }
    const authorizedBranches = await this.prisma.branch.findMany({
      where: branchWhere,
      include: { franchise: true },
      orderBy: { name: 'asc' },
    });
    const authorizedBranchIds = authorizedBranches.map((b) => b.id);

    // Invoice where filter
    const invoiceWhere: any = {
      status: { in: ['ISSUED', 'PAID'] },
      branchId: { in: authorizedBranchIds },
      createdAt: dateFilter,
    };

    // Payment where filter
    const paymentWhere: any = {
      status: 'SUCCESS',
      createdAt: dateFilter,
      OR: [
        { invoice: { branchId: { in: authorizedBranchIds } } },
        { booking: { branchId: { in: authorizedBranchIds } } },
      ],
    };

    // Delivery where filter
    const deliveryWhere: any = {
      status: 'COMPLETED',
      deliveryDate: dateFilter,
      booking: { branchId: { in: authorizedBranchIds } },
    };

    // Fetch invoices, payments, deliveries, bookings in parallel
    const [
      invoices,
      payments,
      deliveries,
      confirmedBookingsCount,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          branch: { include: { franchise: true } },
          payments: { where: { status: 'SUCCESS' } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: paymentWhere,
        include: {
          invoice: { select: { branchId: true } },
          booking: { select: { branchId: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.delivery.findMany({
        where: deliveryWhere,
        include: {
          booking: { select: { branchId: true, vehicleId: true } },
        },
      }),
      this.prisma.booking.count({
        where: {
          branchId: { in: authorizedBranchIds },
          status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] },
          createdAt: dateFilter,
        },
      }),
    ]);

    // 1. Overall Summary Calculations
    let grossSales = 0;
    let netSales = 0;
    let discountsTotal = 0;
    let outstandingReceivables = 0;

    for (const inv of invoices) {
      const invTotal = Number(inv.totalAmount || 0);
      const invDiscount = Number(inv.discount || 0);
      const invGross = invTotal + invDiscount;
      grossSales += invGross;
      netSales += invTotal;
      discountsTotal += invDiscount;

      // Outstanding balance on issued invoice
      if (inv.paymentStatus === 'UNPAID' || inv.paymentStatus === 'PARTIALLY_PAID') {
        const paidOnInvoice = inv.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
        outstandingReceivables += Math.max(0, invTotal - paidOnInvoice);
      }
    }

    const paymentsReceived = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const vehiclesSold = deliveries.length;

    // Helper for period keys
    const getPeriodKey = (d: Date): string => {
      if (groupBy === 'day') {
        return d.toISOString().slice(0, 10);
      }
      if (groupBy === 'week') {
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
        return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      }
      return d.toISOString().slice(0, 7);
    };

    // 2. Sales Trend Aggregation
    const trendMap: Record<string, { period: string; grossSales: number; netSales: number; count: number }> = {};
    for (const inv of invoices) {
      const pKey = getPeriodKey(new Date(inv.createdAt));
      if (!trendMap[pKey]) {
        trendMap[pKey] = { period: pKey, grossSales: 0, netSales: 0, count: 0 };
      }
      const invTotal = Number(inv.totalAmount || 0);
      const invDiscount = Number(inv.discount || 0);
      trendMap[pKey].grossSales += (invTotal + invDiscount);
      trendMap[pKey].netSales += invTotal;
      trendMap[pKey].count += 1;
    }

    // 3. Sales vs Payments Aggregation by Period
    const salesVsPaymentsMap: Record<string, { period: string; invoicedSales: number; paymentsReceived: number }> = {};
    for (const inv of invoices) {
      const pKey = getPeriodKey(new Date(inv.createdAt));
      if (!salesVsPaymentsMap[pKey]) {
        salesVsPaymentsMap[pKey] = { period: pKey, invoicedSales: 0, paymentsReceived: 0 };
      }
      salesVsPaymentsMap[pKey].invoicedSales += Number(inv.totalAmount || 0);
    }
    for (const pay of payments) {
      const pKey = getPeriodKey(new Date(pay.createdAt));
      if (!salesVsPaymentsMap[pKey]) {
        salesVsPaymentsMap[pKey] = { period: pKey, invoicedSales: 0, paymentsReceived: 0 };
      }
      salesVsPaymentsMap[pKey].paymentsReceived += Number(pay.amount || 0);
    }

    const salesTrend = Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
    const salesVsPayments = Object.values(salesVsPaymentsMap).sort((a, b) => a.period.localeCompare(b.period));

    // 4. Branch Comparison Breakdown
    const branchComparisonMap: Record<string, {
      branchId: string;
      branchName: string;
      branchCode: string;
      franchiseName: string;
      city?: string;
      grossSales: number;
      netSales: number;
      paymentsReceived: number;
      outstandingReceivables: number;
      vehiclesSold: number;
      invoicesCount: number;
    }> = {};

    for (const b of authorizedBranches) {
      branchComparisonMap[b.id] = {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        franchiseName: b.franchise?.name || 'Commercial Network',
        city: b.city || undefined,
        grossSales: 0,
        netSales: 0,
        paymentsReceived: 0,
        outstandingReceivables: 0,
        vehiclesSold: 0,
        invoicesCount: 0,
      };
    }

    for (const inv of invoices) {
      const bEntry = branchComparisonMap[inv.branchId];
      if (bEntry) {
        const invTotal = Number(inv.totalAmount || 0);
        const invDiscount = Number(inv.discount || 0);
        bEntry.grossSales += (invTotal + invDiscount);
        bEntry.netSales += invTotal;
        bEntry.invoicesCount += 1;
        if (inv.paymentStatus === 'UNPAID' || inv.paymentStatus === 'PARTIALLY_PAID') {
          const paidOnInvoice = inv.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
          bEntry.outstandingReceivables += Math.max(0, invTotal - paidOnInvoice);
        }
      }
    }

    for (const pay of payments) {
      const bId = pay.invoice?.branchId || pay.booking?.branchId;
      if (bId && branchComparisonMap[bId]) {
        branchComparisonMap[bId].paymentsReceived += Number(pay.amount || 0);
      }
    }

    for (const d of deliveries) {
      const bId = d.booking?.branchId;
      if (bId && branchComparisonMap[bId]) {
        branchComparisonMap[bId].vehiclesSold += 1;
      }
    }

    const branchComparison = Object.values(branchComparisonMap).sort((a, b) => b.netSales - a.netSales);

    // 5. Sales Distribution (Market Share by Branch)
    const salesDistribution = branchComparison
      .filter((b) => b.netSales > 0)
      .map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
        branchCode: b.branchCode,
        value: b.netSales,
        percentage: netSales > 0 ? Math.round((b.netSales / netSales) * 1000) / 10 : 0,
      }));

    return {
      summary: {
        grossSales,
        netSales,
        discountsTotal,
        paymentsReceived,
        outstandingReceivables,
        vehiclesSold,
        confirmedBookingsCount,
      },
      salesTrend,
      branchComparison,
      salesVsPayments,
      salesDistribution,
      scopedFranchiseId: effectiveFranchiseId || null,
      scopedBranchId: effectiveBranchId || null,
      totalBranchesInScope: authorizedBranches.length,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        groupBy,
      },
    };
  }

  async getCRMReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const where: any = {};
    const dateFilter = this.buildDateFilter(startDate, endDate);
    if (dateFilter) where.createdAt = dateFilter;

    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.franchiseId = effectiveFranchiseId;
    }

    const [leads, overdueFollowUpsCount, campaignLeadsCount, campaignQuotationsCount] =
      await Promise.all([
        this.prisma.lead.findMany({
          where,
          select: {
            id: true,
            status: true,
            source: true,
            campaignId: true,
            quotations: { select: { id: true } },
          },
        }),
        this.prisma.followUp.count({
          where: {
            status: 'PENDING',
            scheduledAt: { lt: new Date() },
            lead: where,
          },
        }),
        this.prisma.lead.count({
          where: { ...where, campaignId: { not: null } },
        }),
        this.prisma.quotation.count({
          where: {
            lead: { ...where, campaignId: { not: null } },
          },
        }),
      ]);

    const totalLeads = leads.length;
    const leadsByStage: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      CONVERTED: 0,
      LOST: 0,
    };
    const leadsBySource: Record<string, number> = {};
    let leadsWithQuotations = 0;
    let leadsWon = 0;

    for (const l of leads) {
      leadsByStage[l.status] = (leadsByStage[l.status] || 0) + 1;
      const src = l.source || 'DIRECT_WALKIN';
      leadsBySource[src] = (leadsBySource[src] || 0) + 1;

      if (l.quotations && l.quotations.length > 0) leadsWithQuotations++;
      if (l.status === 'CONVERTED') leadsWon++;
    }

    const leadToQuoteConversion =
      totalLeads > 0 ? Math.round((leadsWithQuotations / totalLeads) * 100 * 100) / 100 : 0;
    const leadToBookingConversion =
      totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100 * 100) / 100 : 0;

    return {
      totalLeads,
      leadsByStage,
      leadsBySource: Object.entries(leadsBySource).map(([source, count]) => ({ source, count })),
      leadToQuoteConversion,
      leadToBookingConversion,
      overdueFollowUpsCount,
      campaignAttribution: {
        attributedLeads: campaignLeadsCount,
        attributedQuotations: campaignQuotationsCount,
        attributedBookings: leadsWon,
      },
    };
  }

  async getInventoryReport(branchId?: string, user?: any, franchiseId?: string) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const where: any = {};
    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
    }

    const [inStock, reserved, allocated, pdiCompleted, delivered, vehicles] = await Promise.all([
      this.prisma.vehicle.count({ where: { ...where, status: 'IN_STOCK' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'RESERVED' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'ALLOCATED' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'PDI_COMPLETED' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.vehicle.findMany({
        where,
        select: {
          status: true,
          variant: { select: { name: true } },
        },
      }),
    ]);

    const variantMap: Record<string, { inStock: number; total: number }> = {};
    for (const v of vehicles) {
      const name = v.variant?.name || 'Commercial Truck';
      if (!variantMap[name]) variantMap[name] = { inStock: 0, total: 0 };
      variantMap[name].total += 1;
      if (v.status === 'IN_STOCK') variantMap[name].inStock += 1;
    }

    const inventoryByVariant = Object.entries(variantMap).map(([variantName, data]) => ({
      variantName,
      ...data,
    }));

    return {
      inStock,
      reserved,
      allocated,
      pdiCompleted,
      delivered,
      totalPhysicalInventory: inStock + reserved + allocated + pdiCompleted,
      inventoryByVariant,
    };
  }

  async getServiceReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const where: any = {};
    const dateFilter = this.buildDateFilter(startDate, endDate);
    if (dateFilter) where.createdAt = dateFilter;

    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
    }

    const [appointments, openJobs, completedJobs, awaitingParts, revenueAgg, jobsList] =
      await Promise.all([
        this.prisma.serviceAppointment.count({ where }),
        this.prisma.serviceJob.count({
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        }),
        this.prisma.serviceJob.count({ where: { ...where, status: 'COMPLETED' } }),
        this.prisma.serviceJob.count({ where: { ...where, status: 'WAITING_FOR_PARTS' } }),
        this.prisma.serviceJob.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { actualCost: true },
        }),
        this.prisma.serviceJob.findMany({
          where,
          select: {
            status: true,
            createdAt: true,
            actualCompletionTime: true,
            branch: { select: { name: true } },
          },
        }),
      ]);

    const jobsByStatus: Record<string, number> = {};
    const branchWorkload: Record<string, number> = {};
    let totalCompletedDurationMs = 0;
    let completedWithTimestampsCount = 0;

    for (const j of jobsList) {
      jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1;
      const bName = j.branch?.name || 'General Workshop';
      if (!['COMPLETED', 'CANCELLED'].includes(j.status)) {
        branchWorkload[bName] = (branchWorkload[bName] || 0) + 1;
      }
      if (j.status === 'COMPLETED' && j.actualCompletionTime && j.createdAt) {
        const diffMs = new Date(j.actualCompletionTime).getTime() - new Date(j.createdAt).getTime();
        if (diffMs > 0) {
          totalCompletedDurationMs += diffMs;
          completedWithTimestampsCount++;
        }
      }
    }

    const averageTurnaroundHours =
      completedWithTimestampsCount > 0
        ? Math.round((totalCompletedDurationMs / (completedWithTimestampsCount * 3600 * 1000)) * 10) /
          10
        : 0;

    return {
      appointments,
      openJobs,
      completedJobs,
      awaitingPartsJobs: awaitingParts,
      serviceRevenue: Number(revenueAgg._sum.actualCost || 0),
      averageTurnaroundHours,
      jobsByStatus,
      workloadByBranch: Object.entries(branchWorkload).map(([branchName, activeJobs]) => ({
        branchName,
        activeJobs,
      })),
    };
  }

  async getComplianceReport(branchId?: string, user?: any, franchiseId?: string) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const vehicleWhere: any = {};
    if (effectiveBranchId) {
      vehicleWhere.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      vehicleWhere.branch = { franchiseId: effectiveFranchiseId };
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [docs, expiredCount, expiringSoonCount, validCount] = await Promise.all([
      this.prisma.vehicleComplianceDocument.findMany({
        where: { vehicle: vehicleWhere },
        include: {
          vehicle: {
            select: {
              vin: true,
              registrationNumber: true,
              branch: { select: { name: true } },
            },
          },
        },
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.vehicleComplianceDocument.count({
        where: {
          vehicle: vehicleWhere,
          OR: [{ status: 'EXPIRED' }, { expiryDate: { lt: now } }],
        },
      }),
      this.prisma.vehicleComplianceDocument.count({
        where: {
          vehicle: vehicleWhere,
          status: { not: 'EXPIRED' },
          expiryDate: { gte: now, lte: in30Days },
        },
      }),
      this.prisma.vehicleComplianceDocument.count({
        where: {
          vehicle: vehicleWhere,
          status: 'VALID',
          expiryDate: { gt: in30Days },
        },
      }),
    ]);

    const byType: Record<string, { total: number; expired: number; expiringSoon: number }> = {};
    const byBranch: Record<string, { total: number; expired: number; expiringSoon: number }> = {};

    for (const d of docs) {
      const t = d.documentType;
      if (!byType[t]) byType[t] = { total: 0, expired: 0, expiringSoon: 0 };
      byType[t].total += 1;

      const bName = d.vehicle?.branch?.name || 'Main Yard';
      if (!byBranch[bName]) byBranch[bName] = { total: 0, expired: 0, expiringSoon: 0 };
      byBranch[bName].total += 1;

      const isExp = d.status === 'EXPIRED' || (d.expiryDate && new Date(d.expiryDate) < now);
      const isSoon =
        !isExp &&
        d.expiryDate &&
        new Date(d.expiryDate) >= now &&
        new Date(d.expiryDate) <= in30Days;

      if (isExp) {
        byType[t].expired += 1;
        byBranch[bName].expired += 1;
      } else if (isSoon) {
        byType[t].expiringSoon += 1;
        byBranch[bName].expiringSoon += 1;
      }
    }

    const urgentDocuments = docs
      .filter((d) => {
        if (!d.expiryDate) return false;
        const dt = new Date(d.expiryDate);
        return dt <= in30Days;
      })
      .slice(0, 10)
      .map((d) => ({
        id: d.id,
        documentType: d.documentType,
        documentNumber: d.documentNumber,
        vin: d.vehicle?.vin,
        registrationNumber: d.vehicle?.registrationNumber,
        branchName: d.vehicle?.branch?.name,
        expiryDate: d.expiryDate,
        isExpired: d.expiryDate ? new Date(d.expiryDate) < now : false,
      }));

    return {
      expiredCount,
      expiringSoonCount,
      validCount,
      totalDocuments: docs.length,
      documentsByType: Object.entries(byType).map(([documentType, data]) => ({
        documentType,
        ...data,
      })),
      documentsByBranch: Object.entries(byBranch).map(([branchName, data]) => ({
        branchName,
        ...data,
      })),
      urgentDocuments,
    };
  }

  async getFinanceReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const where: any = {};
    const paymentWhere: any = { status: 'SUCCESS' };
    const dateFilter = this.buildDateFilter(startDate, endDate);

    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
      paymentWhere.booking = { branchId: effectiveBranchId };
    } else if (effectiveFranchiseId) {
      where.franchiseId = effectiveFranchiseId;
      paymentWhere.booking = { branch: { franchiseId: effectiveFranchiseId } };
    }

    if (dateFilter) {
      where.createdAt = dateFilter;
      paymentWhere.createdAt = dateFilter;
    }

    const [
      issuedInvoices,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
      invoiceAgg,
      paymentsAgg,
      emiScheduleList,
    ] = await Promise.all([
      this.prisma.invoice.count({ where: { ...where, status: 'ISSUED' } }),
      this.prisma.invoice.count({ where: { ...where, paymentStatus: 'PAID' } }),
      this.prisma.invoice.count({ where: { ...where, paymentStatus: 'PARTIALLY_PAID' } }),
      this.prisma.invoice.count({ where: { ...where, paymentStatus: 'UNPAID' } }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'ISSUED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
      this.prisma.financeEmiSchedule.findMany({
        where: {
          financeApplication: {
            booking: {
              ...(effectiveBranchId
                ? { branchId: effectiveBranchId }
                : effectiveFranchiseId
                ? { branch: { franchiseId: effectiveFranchiseId } }
                : {}),
            },
          },
        },
        select: {
          status: true,
          emiAmount: true,
          paidAmount: true,
          dueDate: true,
        },
      }),
    ]);

    const totalInvoiceAmount = Number(invoiceAgg._sum?.totalAmount || 0);
    const totalCollectedPayments = Number(paymentsAgg._sum?.amount || 0);
    const outstandingBalances = Math.max(0, totalInvoiceAmount - totalCollectedPayments);

    // Calculate Third-Party EMI Telemetry completely isolated from Dealership Revenue
    let totalEmiObligations = 0;
    let totalEmiCollected = 0;
    let overdueEmiCount = 0;
    let overdueEmiAmount = 0;
    let upcomingEmiCount = 0;

    for (const emi of emiScheduleList) {
      const amt = Number(emi.emiAmount || 0);
      const paid = Number(emi.paidAmount || 0);
      totalEmiObligations += amt;
      totalEmiCollected += paid;

      if (emi.status === 'OVERDUE') {
        overdueEmiCount++;
        overdueEmiAmount += Math.max(0, amt - paid);
      } else if (emi.status === 'UPCOMING') {
        upcomingEmiCount++;
      }
    }

    return {
      // 1. Dealership Revenue & Collections
      issuedInvoices,
      issuedInvoicesCount: issuedInvoices,
      paidInvoices,
      paidInvoicesCount: paidInvoices,
      partialInvoices,
      partialInvoicesCount: partialInvoices,
      unpaidInvoices,
      unpaidInvoicesCount: unpaidInvoices,
      totalInvoiceAmount,
      totalCollectedPayments,
      outstandingBalances,
      byPaymentStatus: [
        { status: 'PAID', count: paidInvoices },
        { status: 'PARTIALLY_PAID', count: partialInvoices },
        { status: 'UNPAID', count: unpaidInvoices },
      ],
      // 2. Third-Party EMI Schedules (Completely distinct from dealership sales revenue)
      emiSummary: {
        totalEmiObligations,
        totalEmiCollected,
        overdueEmiCount,
        overdueEmiAmount,
        upcomingEmiCount,
      },
    };
  }

  async exportReportCsv(
    category: 'sales' | 'crm' | 'inventory' | 'service' | 'compliance' | 'finance',
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ): Promise<string> {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(
      user,
      branchId,
      franchiseId,
    );

    const where: any = {};
    const dateFilter = this.buildDateFilter(startDate, endDate);
    if (dateFilter) where.createdAt = dateFilter;
    if (effectiveBranchId) where.branchId = effectiveBranchId;
    else if (effectiveFranchiseId) where.branch = { franchiseId: effectiveFranchiseId };

    if (category === 'sales') {
      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          branch: { select: { name: true } },
          vehicle: { select: { vin: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'BookingNumber,Date,Customer,Phone,Branch,VIN,Status,TotalAmount\n';
      const rows = bookings.map(
        (b) =>
          `"${b.bookingNumber}","${b.createdAt.toISOString().slice(0, 10)}","${b.customer?.name || ''}","${b.customer?.phone || ''}","${b.branch?.name || ''}","${b.vehicle?.vin || ''}","${b.status}",${b.totalAmount || 0}`,
      );
      return header + rows.join('\n');
    }

    if (category === 'crm') {
      const leads = await this.prisma.lead.findMany({
        where: {
          ...(effectiveBranchId
            ? { branchId: effectiveBranchId }
            : effectiveFranchiseId
            ? { franchiseId: effectiveFranchiseId }
            : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: {
          customer: { select: { name: true, phone: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'LeadID,Date,Customer,Phone,Branch,Source,Status,Priority\n';
      const rows = leads.map(
        (l) =>
          `"${l.id.slice(0, 8)}","${l.createdAt.toISOString().slice(0, 10)}","${l.customer?.name || ''}","${l.customer?.phone || ''}","${l.branch?.name || ''}","${l.source}","${l.status}","${l.priority}"`,
      );
      return header + rows.join('\n');
    }

    if (category === 'inventory') {
      const vehicles = await this.prisma.vehicle.findMany({
        where,
        include: {
          variant: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'VIN,Model,Registration,Branch,Status,SellingPrice\n';
      const rows = vehicles.map(
        (v) =>
          `"${v.vin}","${v.variant?.name || ''}","${v.registrationNumber || 'PENDING'}","${v.branch?.name || ''}","${v.status}",${v.sellingPrice || 0}`,
      );
      return header + rows.join('\n');
    }

    if (category === 'service') {
      const jobs = await this.prisma.serviceJob.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          vehicle: { select: { vin: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'JobNumber,Date,Customer,VIN,Branch,Status,Cost\n';
      const rows = jobs.map(
        (j) =>
          `"${j.jobNumber}","${j.createdAt.toISOString().slice(0, 10)}","${j.customer?.name || ''}","${j.vehicle?.vin || ''}","${j.branch?.name || ''}","${j.status}",${j.actualCost || 0}`,
      );
      return header + rows.join('\n');
    }

    if (category === 'compliance') {
      const docs = await this.prisma.vehicleComplianceDocument.findMany({
        where: { vehicle: where },
        include: {
          vehicle: { select: { vin: true, registrationNumber: true, branch: { select: { name: true } } } },
        },
        orderBy: { expiryDate: 'asc' },
      });

      const header = 'DocumentType,DocumentNumber,VIN,Registration,Branch,ExpiryDate,Status\n';
      const rows = docs.map(
        (d) =>
          `"${d.documentType}","${d.documentNumber}","${d.vehicle?.vin || ''}","${d.vehicle?.registrationNumber || ''}","${d.vehicle?.branch?.name || ''}","${d.expiryDate ? d.expiryDate.toISOString().slice(0, 10) : ''}","${d.status}"`,
      );
      return header + rows.join('\n');
    }

    // Default finance
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...(effectiveBranchId
          ? { branchId: effectiveBranchId }
          : effectiveFranchiseId
          ? { franchiseId: effectiveFranchiseId }
          : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        customer: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'InvoiceNumber,Date,Customer,Branch,PaymentStatus,TotalAmount\n';
    const rows = invoices.map(
      (inv) =>
        `"${inv.invoiceNumber}","${inv.createdAt.toISOString().slice(0, 10)}","${inv.customer?.name || ''}","${inv.branch?.name || ''}","${inv.paymentStatus}",${inv.totalAmount || 0}`,
    );
    return header + rows.join('\n');
  }
}
