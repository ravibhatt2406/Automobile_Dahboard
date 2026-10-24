import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { resolveUserScope } from '@/common/utils/scope.util';

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminDashboard(queryFranchiseId?: string, queryBranchId?: string, user?: any) {
    const scope = user
      ? await resolveUserScope(this.prisma, user, queryBranchId, queryFranchiseId, 'SUPER_ADMIN')
      : null;

    const franchiseWhere: any = { status: 'ACTIVE' };
    const branchWhere: any = { status: 'ACTIVE' };
    const employeeWhere: any = { status: 'ACTIVE' };
    const vehicleWhere: any = {};
    const bookingWhere: any = {};
    const serviceJobWhere: any = {};
    const approvalWhere: any = { status: 'PENDING' };
    const paymentWhere: any = { status: 'SUCCESS' };
    const campaignWhere: any = {};
    const deliveryWhere: any = {};
    const complianceWhere: any = {};
    const financeWhere: any = {};
    const financeEmiWhere: any = {};
    const customerWhere: any = { status: 'ACTIVE' };

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (scope?.effectiveBranchId) {
      branchWhere.id = scope.effectiveBranchId;
      employeeWhere.branchId = scope.effectiveBranchId;
      vehicleWhere.branchId = scope.effectiveBranchId;
      bookingWhere.branchId = scope.effectiveBranchId;
      serviceJobWhere.branchId = scope.effectiveBranchId;
      approvalWhere.employee = { branchId: scope.effectiveBranchId };
      paymentWhere.booking = { branchId: scope.effectiveBranchId };
      campaignWhere.branchId = scope.effectiveBranchId;
      deliveryWhere.booking = { branchId: scope.effectiveBranchId };
      complianceWhere.vehicle = { branchId: scope.effectiveBranchId };
      financeWhere.booking = { branchId: scope.effectiveBranchId };
      financeEmiWhere.financeApplication = { booking: { branchId: scope.effectiveBranchId } };
      customerWhere.OR = [
        { preferredBranchId: scope.effectiveBranchId },
        { quotations: { some: { branchId: scope.effectiveBranchId } } },
        { bookings: { some: { branchId: scope.effectiveBranchId } } },
        { vehicles: { some: { branchId: scope.effectiveBranchId } } },
        { leads: { some: { branchId: scope.effectiveBranchId } } },
        { serviceJobs: { some: { branchId: scope.effectiveBranchId } } },
      ];
    } else if (scope?.effectiveFranchiseId) {
      franchiseWhere.id = scope.effectiveFranchiseId;
      branchWhere.franchiseId = scope.effectiveFranchiseId;
      employeeWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      vehicleWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      bookingWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      serviceJobWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      approvalWhere.employee = { branch: { franchiseId: scope.effectiveFranchiseId } };
      paymentWhere.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
      campaignWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      deliveryWhere.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
      complianceWhere.vehicle = { branch: { franchiseId: scope.effectiveFranchiseId } };
      financeWhere.booking = { branch: { franchiseId: scope.effectiveFranchiseId } };
      financeEmiWhere.financeApplication = { booking: { branch: { franchiseId: scope.effectiveFranchiseId } } };
      customerWhere.OR = [
        { preferredBranch: { franchiseId: scope.effectiveFranchiseId } },
        { franchiseLinks: { some: { franchiseId: scope.effectiveFranchiseId } } },
        { quotations: { franchiseId: scope.effectiveFranchiseId } },
        { bookings: { branch: { franchiseId: scope.effectiveFranchiseId } } },
        { vehicles: { branch: { franchiseId: scope.effectiveFranchiseId } } },
        { leads: { franchiseId: scope.effectiveFranchiseId } },
        { serviceJobs: { branch: { franchiseId: scope.effectiveFranchiseId } } },
      ];
    }

    const [
      franchiseCount,
      branchCount,
      employeeCount,
      customerCount,
      vehicleCount,
      inStockVehicleCount,
      reservedVehicleCount,
      bookingCount,
      serviceJobCount,
      activeServiceJobCount,
      pendingApprovals,
      revenueAgg,
      paymentsAgg,
      campaignsCount,
      activeCampaignsCount,
      inTransitDeliveries,
      completedDeliveries,
      complianceAlerts,
      activeFinanceApps,
      overdueEmis,
      recentBookings,
      topBranches,
    ] = await Promise.all([
      this.prisma.franchise.count({ where: franchiseWhere }),
      this.prisma.branch.count({ where: branchWhere }),
      this.prisma.employee.count({ where: employeeWhere }),
      this.prisma.customer.count({ where: customerWhere }),
      this.prisma.vehicle.count({ where: vehicleWhere }),
      this.prisma.vehicle.count({ where: { ...vehicleWhere, status: 'IN_STOCK' } }),
      this.prisma.vehicle.count({ where: { ...vehicleWhere, status: 'RESERVED' } }),
      this.prisma.booking.count({ where: bookingWhere }),
      this.prisma.serviceJob.count({ where: serviceJobWhere }),
      this.prisma.serviceJob.count({
        where: { ...serviceJobWhere, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      this.prisma.employeeApprovalRequest.count({ where: approvalWhere }),
      this.prisma.booking.aggregate({
        where: { ...bookingWhere, status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
      this.prisma.campaign.count({ where: campaignWhere }),
      this.prisma.campaign.count({ where: { ...campaignWhere, status: 'ACTIVE' } }),
      this.prisma.delivery.count({
        where: { ...deliveryWhere, status: { in: ['PENDING', 'READY'] } },
      }),
      this.prisma.delivery.count({
        where: { ...deliveryWhere, status: 'COMPLETED' },
      }),
      this.prisma.vehicleComplianceDocument.count({
        where: {
          ...complianceWhere,
          OR: [{ status: 'EXPIRED' }, { expiryDate: { lte: in30Days } }],
        },
      }),
      this.prisma.financeApplication.count({
        where: { ...financeWhere, status: { in: ['APPROVED', 'DISBURSED'] } },
      }),
      this.prisma.financeEmiSchedule.count({
        where: { ...financeEmiWhere, status: 'OVERDUE' },
      }),
      this.prisma.booking.findMany({
        where: bookingWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          vehicle: { select: { vin: true, color: true } },
          branch: { select: { name: true, code: true } },
        },
      }),
      this.prisma.branch.findMany({
        where: branchWhere,
        take: 5,
        include: {
          franchise: { select: { name: true } },
          _count: {
            select: {
              vehicles: true,
              employees: true,
              bookings: true,
              serviceJobs: true,
            },
          },
        },
      }),
    ]);

    return {
      franchiseCount,
      branchCount,
      employeeCount,
      customerCount,
      vehicleCount,
      inStockVehicleCount,
      reservedVehicleCount,
      bookingCount,
      serviceJobCount,
      activeServiceJobCount,
      pendingApprovals,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
      totalCollections: Number(paymentsAgg._sum.amount || 0),
      campaignsCount,
      activeCampaignsCount,
      inTransitDeliveries,
      completedDeliveries,
      complianceAlerts,
      activeFinanceApps,
      overdueEmis,
      recentBookings,
      topBranches,
    };
  }

  async getFranchiseDashboard(queryFranchiseId?: string, user?: any) {
    const scope = await resolveUserScope(
      this.prisma,
      user,
      undefined,
      queryFranchiseId,
      user?.effectiveScope?.activeRole || 'FRANCHISE_OWNER',
    );

    const franchiseIdToUse = scope.effectiveFranchiseId;

    if (!franchiseIdToUse) {
      throw new BadRequestException('Please select an authorized franchise');
    }

    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseIdToUse },
      include: {
        branches: {
          where: { status: 'ACTIVE' },
          include: {
            _count: {
              select: {
                employees: true,
                vehicles: true,
                bookings: true,
                serviceJobs: true,
              },
            },
          },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException(`Franchise '${franchiseIdToUse}' not found`);
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      branchCount,
      employeeCount,
      pendingApprovals,
      vehicleCount,
      inStockVehicles,
      reservedVehicles,
      allocatedVehicles,
      bookingsCount,
      activeServiceJobsCount,
      revenueAgg,
      paymentsAgg,
      totalLeads,
      wonLeads,
      complianceAlerts,
      campaignsCount,
      campaignBudgetAgg,
      campaignExpensesAgg,
      activeFinanceApps,
      overdueEmis,
      recentBookings,
    ] = await Promise.all([
      this.prisma.branch.count({ where: { franchiseId: franchise.id, status: 'ACTIVE' } }),
      this.prisma.employee.count({
        where: { branch: { franchiseId: franchise.id }, status: 'ACTIVE' },
      }),
      this.prisma.employeeApprovalRequest.count({
        where: { status: 'PENDING', employee: { branch: { franchiseId: franchise.id } } },
      }),
      this.prisma.vehicle.count({ where: { branch: { franchiseId: franchise.id } } }),
      this.prisma.vehicle.count({
        where: { branch: { franchiseId: franchise.id }, status: 'IN_STOCK' },
      }),
      this.prisma.vehicle.count({
        where: { branch: { franchiseId: franchise.id }, status: 'RESERVED' },
      }),
      this.prisma.vehicle.count({
        where: { branch: { franchiseId: franchise.id }, status: 'ALLOCATED' },
      }),
      this.prisma.booking.count({
        where: {
          branch: { franchiseId: franchise.id },
          status: { notIn: ['CANCELLED'] },
        },
      }),
      this.prisma.serviceJob.count({
        where: {
          branch: { franchiseId: franchise.id },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          branch: { franchiseId: franchise.id },
          status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          booking: { branch: { franchiseId: franchise.id } },
        },
        _sum: { amount: true },
      }),
      this.prisma.lead.count({ where: { franchiseId: franchise.id } }),
      this.prisma.lead.count({ where: { franchiseId: franchise.id, status: 'CONVERTED' } }),
      this.prisma.vehicleComplianceDocument.count({
        where: {
          vehicle: { branch: { franchiseId: franchise.id } },
          OR: [{ status: 'EXPIRED' }, { expiryDate: { lte: in30Days } }],
        },
      }),
      this.prisma.campaign.count({ where: { franchiseId: franchise.id } }),
      this.prisma.campaign.aggregate({
        where: { franchiseId: franchise.id },
        _sum: { budget: true },
      }),
      this.prisma.campaignExpense.aggregate({
        where: { campaign: { franchiseId: franchise.id } },
        _sum: { amount: true },
      }),
      this.prisma.financeApplication.count({
        where: {
          booking: { branch: { franchiseId: franchise.id } },
          status: { in: ['APPROVED', 'DISBURSED'] },
        },
      }),
      this.prisma.financeEmiSchedule.count({
        where: {
          financeApplication: { booking: { branch: { franchiseId: franchise.id } } },
          status: 'OVERDUE',
        },
      }),
      this.prisma.booking.findMany({
        where: { branch: { franchiseId: franchise.id } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          vehicle: { select: { vin: true, color: true } },
          branch: { select: { name: true, code: true } },
        },
      }),
    ]);

    const leadConversionRate =
      totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100 * 100) / 100 : 0;

    return {
      franchiseId: franchise.id,
      franchiseName: franchise.name,
      franchiseCode: franchise.code,
      branchCount,
      employeeCount,
      pendingApprovals,
      vehicleCount,
      inStockVehicles,
      reservedVehicles,
      allocatedVehicles,
      bookingsCount,
      activeServiceJobsCount,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
      totalCollections: Number(paymentsAgg._sum.amount || 0),
      totalLeads,
      leadConversionRate,
      complianceAlerts,
      campaignsCount,
      campaignBudget: Number(campaignBudgetAgg?._sum?.budget || 0),
      campaignExpenses: Number(campaignExpensesAgg?._sum?.amount || 0),
      activeFinanceApps,
      overdueEmis,
      branches: franchise.branches,
      recentBookings,
    };
  }

  async getBranchDashboard(queryBranchId?: string, user?: any) {
    const scope = await resolveUserScope(
      this.prisma,
      user,
      queryBranchId,
      undefined,
      user?.effectiveScope?.activeRole || 'BRANCH_MANAGER',
    );

    let branchIdToUse = scope.effectiveBranchId;

    if (!branchIdToUse) {
      if (scope.effectiveFranchiseId) {
        const firstBranch = await this.prisma.branch.findFirst({
          where: { franchiseId: scope.effectiveFranchiseId, status: 'ACTIVE' },
          select: { id: true },
        });
        branchIdToUse = firstBranch?.id || null;
      } else if (scope.assignedBranchId) {
        branchIdToUse = scope.assignedBranchId;
      }
    }

    if (!branchIdToUse) {
      throw new BadRequestException('Please select an authorized branch to view operational telemetry');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchIdToUse },
      include: {
        franchise: { select: { id: true, name: true, code: true } },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch '${branchIdToUse}' not found`);
    }

    if (!scope.isRealSuperAdmin && scope.isActingFranchiseLevel) {
      if (branch.franchiseId !== scope.assignedFranchiseId) {
        throw new ForbiddenException('Cannot access dashboard for another franchise');
      }
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      inStockVehicles,
      reservedVehicles,
      allocatedVehicles,
      deliveredVehicles,
      totalVehicles,
      confirmedBookings,
      totalBookings,
      activeServiceJobs,
      awaitingPartsJobs,
      overdueJobs,
      completedServiceJobs,
      totalEmployees,
      pendingApprovals,
      activeQuotations,
      activeLeads,
      revenueAgg,
      paymentsAgg,
      complianceAlerts,
      activeCampaignsCount,
      campaignLeadsCount,
      inTransitDeliveries,
      recentBookings,
      recentServiceJobs,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { branchId: branch.id, status: 'IN_STOCK' } }),
      this.prisma.vehicle.count({ where: { branchId: branch.id, status: 'RESERVED' } }),
      this.prisma.vehicle.count({ where: { branchId: branch.id, status: 'ALLOCATED' } }),
      this.prisma.vehicle.count({ where: { branchId: branch.id, status: 'DELIVERED' } }),
      this.prisma.vehicle.count({ where: { branchId: branch.id } }),
      this.prisma.booking.count({
        where: { branchId: branch.id, status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] } },
      }),
      this.prisma.booking.count({ where: { branchId: branch.id } }),
      this.prisma.serviceJob.count({
        where: { branchId: branch.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      this.prisma.serviceJob.count({
        where: { branchId: branch.id, status: 'WAITING_FOR_PARTS' },
      }),
      this.prisma.serviceJob.count({
        where: {
          branchId: branch.id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          estimatedCompletionTime: { lt: now },
        },
      }),
      this.prisma.serviceJob.count({
        where: { branchId: branch.id, status: 'COMPLETED' },
      }),
      this.prisma.employee.count({ where: { branchId: branch.id, status: 'ACTIVE' } }),
      this.prisma.employeeApprovalRequest.count({
        where: {
          status: 'PENDING',
          employee: { branchId: branch.id },
        },
      }),
      this.prisma.quotation.count({
        where: {
          branchId: branch.id,
          status: { in: ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'] },
        },
      }),
      this.prisma.lead.count({ where: { branchId: branch.id } }),
      this.prisma.booking.aggregate({
        where: {
          branchId: branch.id,
          status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          booking: { branchId: branch.id },
        },
        _sum: { amount: true },
      }),
      this.prisma.vehicleComplianceDocument.count({
        where: {
          vehicle: { branchId: branch.id },
          OR: [{ status: 'EXPIRED' }, { expiryDate: { lte: in30Days } }],
        },
      }),
      this.prisma.campaign.count({
        where: { branchId: branch.id, status: 'ACTIVE' },
      }),
      this.prisma.lead.count({
        where: { branchId: branch.id, campaignId: { not: null } },
      }),
      this.prisma.delivery.count({
        where: { booking: { branchId: branch.id }, status: { in: ['PENDING', 'READY'] } },
      }),
      this.prisma.booking.findMany({
        where: { branchId: branch.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { vin: true, color: true } },
        },
      }),
      this.prisma.serviceJob.findMany({
        where: { branchId: branch.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { vin: true, registrationNumber: true } },
        },
      }),
    ]);

    return {
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code,
      city: branch.city,
      franchise: branch.franchise,
      inStockVehicles,
      reservedVehicles,
      allocatedVehicles,
      deliveredVehicles,
      totalVehicles,
      confirmedBookings,
      totalBookings,
      activeServiceJobs,
      awaitingPartsJobs,
      overdueJobs,
      completedServiceJobs,
      totalEmployees,
      pendingApprovals,
      activeQuotations,
      activeLeads,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
      totalCollections: Number(paymentsAgg._sum.amount || 0),
      complianceAlerts,
      activeCampaignsCount,
      campaignLeadsCount,
      inTransitDeliveries,
      recentBookings,
      recentServiceJobs,
    };
  }

  async getSalesDashboard(user: any, requestedBranchId?: string) {
    const scope = await resolveUserScope(
      this.prisma,
      user,
      requestedBranchId,
      undefined,
      user?.effectiveScope?.activeRole || 'SALES_EMPLOYEE',
    );

    const isSalesEmployee = scope.activeRole === 'SALES_EMPLOYEE';
    const employeeId = user?.employeeId || user?.employeeProfile?.id;
    const branchId = scope.effectiveBranchId;

    const quotationWhere: any = {};
    const bookingWhere: any = {};
    const leadWhere: any = {};

    if (isSalesEmployee && employeeId) {
      quotationWhere.salespersonEmployeeId = employeeId;
      bookingWhere.salespersonEmployeeId = employeeId;
      leadWhere.assignedEmployeeId = employeeId;
    } else if (branchId) {
      quotationWhere.branchId = branchId;
      bookingWhere.branchId = branchId;
      leadWhere.branchId = branchId;
    } else if (scope.effectiveFranchiseId) {
      quotationWhere.franchiseId = scope.effectiveFranchiseId;
      bookingWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      leadWhere.franchiseId = scope.effectiveFranchiseId;
    }

    const [
      openQuotations,
      confirmedBookings,
      totalBookings,
      availableStock,
      activeLeads,
      overdueFollowUps,
      recentQuotations,
      recentBookings,
    ] = await Promise.all([
      this.prisma.quotation.count({
        where: {
          ...quotationWhere,
          status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          ...bookingWhere,
          status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] },
        },
      }),
      this.prisma.booking.count({
        where: bookingWhere,
      }),
      this.prisma.vehicle.count({
        where: {
          ...(branchId
            ? { branchId }
            : scope.effectiveFranchiseId
            ? { branch: { franchiseId: scope.effectiveFranchiseId } }
            : {}),
          status: 'IN_STOCK',
        },
      }),
      this.prisma.lead.count({
        where: leadWhere,
      }),
      this.prisma.followUp.count({
        where: {
          status: 'PENDING',
          scheduledAt: { lt: new Date() },
          lead: leadWhere,
        },
      }),
      this.prisma.quotation.findMany({
        where: quotationWhere,
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          variant: { select: { id: true, name: true, basePrice: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: bookingWhere,
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, vin: true, color: true } },
        },
      }),
    ]);

    return {
      openQuotationsCount: openQuotations,
      confirmedBookingsCount: confirmedBookings,
      totalBookingsCount: totalBookings,
      availableStockCount: availableStock,
      activeLeadsCount: activeLeads,
      overdueFollowUpsCount: overdueFollowUps,
      recentQuotations,
      recentBookings,
    };
  }

  async getServiceAdvisorDashboard(user: any, requestedBranchId?: string) {
    const scope = await resolveUserScope(
      this.prisma,
      user,
      requestedBranchId,
      undefined,
      user?.effectiveScope?.activeRole || 'SERVICE_ADVISOR',
    );

    const branchId = scope.effectiveBranchId;
    const whereBranch: any = branchId
      ? { branchId }
      : scope.effectiveFranchiseId
      ? { branch: { franchiseId: scope.effectiveFranchiseId } }
      : {};

    const [
      pendingAppointments,
      activeServiceJobs,
      completedServiceJobs,
      pendingQcJobs,
      recentAppointments,
      recentJobs,
    ] = await Promise.all([
      this.prisma.serviceAppointment.count({
        where: {
          ...whereBranch,
          status: { in: ['REQUESTED', 'CONFIRMED'] },
        },
      }),
      this.prisma.serviceJob.count({
        where: {
          ...whereBranch,
          status: {
            in: ['OPEN', 'CHECKED_IN', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_FOR_PARTS'],
          },
        },
      }),
      this.prisma.serviceJob.count({
        where: {
          ...whereBranch,
          status: 'COMPLETED',
        },
      }),
      this.prisma.serviceJob.count({
        where: {
          ...whereBranch,
          status: 'QC_INSPECTION',
        },
      }),
      this.prisma.serviceAppointment.findMany({
        where: whereBranch,
        orderBy: { preferredDate: 'asc' },
        take: 6,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, vin: true, registrationNumber: true } },
        },
      }),
      this.prisma.serviceJob.findMany({
        where: whereBranch,
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, vin: true, registrationNumber: true } },
          assignedMechanic: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
          },
        },
      }),
    ]);

    return {
      pendingAppointmentsCount: pendingAppointments,
      activeJobsCount: activeServiceJobs,
      completedJobsCount: completedServiceJobs,
      pendingQcCount: pendingQcJobs,
      recentAppointments,
      recentJobs,
    };
  }

  async getMechanicDashboard(mechanicEmployeeId: string, user?: any) {
    if (!mechanicEmployeeId) {
      throw new BadRequestException('Mechanic employee ID is required');
    }

    if (user) {
      const scope = await resolveUserScope(this.prisma, user, undefined, undefined, 'MECHANIC');
      const isMechanic = scope.activeRole === 'MECHANIC';
      const callerEmpId = user?.employeeId || user?.employeeProfile?.id;

      if (isMechanic && !scope.isRealSuperAdmin && !scope.isActingBranchLevel) {
        if (callerEmpId && callerEmpId !== mechanicEmployeeId) {
          throw new ForbiddenException('Cannot view dashboard for another mechanic');
        }
      }
    }

    const jobs = await this.prisma.serviceJob.findMany({
      where: { assignedMechanicId: mechanicEmployeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, vin: true, registrationNumber: true, color: true } },
        diagnoses: true,
        jobParts: { include: { part: true } },
      },
    });

    const activeJobs = jobs.filter((j) =>
      ['IN_PROGRESS', 'DIAGNOSIS', 'WAITING_FOR_PARTS'].includes(j.status),
    );
    const pendingJobs = jobs.filter((j) => ['OPEN', 'CHECKED_IN'].includes(j.status));
    const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');

    const partsRequestedCount = jobs.reduce((acc, job) => acc + (job.jobParts?.length || 0), 0);

    return {
      totalAssigned: jobs.length,
      activeJobsCount: activeJobs.length,
      pendingJobsCount: pendingJobs.length,
      completedJobsCount: completedJobs.length,
      partsRequestedCount,
      activeJobs,
      completedJobs,
      pendingJobs,
    };
  }

  async getCustomerDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { userId },
          ...(user?.email ? [{ email: user.email }] : []),
          ...(user?.phone ? [{ phone: user.phone }] : []),
        ],
      },
      include: {
        vehicles: {
          include: {
            variant: { include: { model: { include: { manufacturer: true } } } },
            branch: true,
            complianceDocuments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        leads: {
          include: { branch: true },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            vehicle: { include: { variant: true } },
            payments: true,
            invoices: true,
            branch: true,
            deliveries: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          include: { variant: true, branch: true },
          orderBy: { createdAt: 'desc' },
        },
        serviceAppointments: {
          include: { vehicle: true, branch: true },
          orderBy: { preferredDate: 'desc' },
        },
        serviceJobs: {
          include: { vehicle: true, branch: true, diagnoses: true, qcInspections: true },
          orderBy: { createdAt: 'desc' },
        },
        insurancePolicies: {
          include: { booking: { include: { vehicle: true } } },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: { branch: true, payments: true },
          orderBy: { createdAt: 'desc' },
        },
        conversations: {
          include: { branch: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
        preferredBranch: {
          include: { franchise: true },
        },
      },
    });

    if (!customer) {
      return {
        customer: null,
        prospectState: 'NEW_PROSPECT',
        vehicles: [],
        leads: [],
        bookings: [],
        quotations: [],
        serviceAppointments: [],
        serviceJobs: [],
        insurancePolicies: [],
        complianceDocuments: [],
        invoices: [],
        payments: [],
        conversations: [],
        summary: {
          vehiclesCount: 0,
          activeQuotationsCount: 0,
          bookingsCount: 0,
          pendingBookingsCount: 0,
          serviceDueCount: 0,
          totalSpent: 0,
        },
      };
    }

    // Determine 3 distinct prospect states strictly from real database records:
    // 1. CONFIRMED_OWNER: Has at least 1 registered vehicle OR has a booking converted to delivery / delivered
    // 2. RETURNING_PROSPECT: Has previous enquiries (leads), quotations, or pending bookings, but no owned vehicle
    // 3. NEW_PROSPECT: No prior activity
    const hasDeliveredBooking = customer.bookings.some(
      (b) =>
        b.status === 'CONVERTED_TO_DELIVERY' ||
        b.deliveries?.some((d) => d.status === 'COMPLETED'),
    );
    const hasOwnedVehicle = customer.vehicles.length > 0;

    let prospectState: 'NEW_PROSPECT' | 'RETURNING_PROSPECT' | 'CONFIRMED_OWNER' = 'NEW_PROSPECT';
    if (hasOwnedVehicle || hasDeliveredBooking) {
      prospectState = 'CONFIRMED_OWNER';
    } else if (
      customer.leads.length > 0 ||
      customer.quotations.length > 0 ||
      customer.bookings.length > 0
    ) {
      prospectState = 'RETURNING_PROSPECT';
    } else {
      prospectState = 'NEW_PROSPECT';
    }

    const activeQuotationsCount = customer.quotations.filter((q) =>
      ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'].includes(q.status),
    ).length;

    const pendingBookingsCount = customer.bookings.filter(
      (b) => b.status === 'PENDING' || b.status === 'CONFIRMED',
    ).length;

    const serviceDueCount = customer.serviceJobs.filter(
      (j) => !['COMPLETED', 'CANCELLED'].includes(j.status),
    ).length;

    const totalSpent = customer.invoices
      .filter((inv) => inv.paymentStatus === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

    // Extract compliance documents strictly across the customer's owned vehicles
    const complianceDocuments = customer.vehicles.flatMap((v) =>
      (v.complianceDocuments || []).map((doc) => ({
        ...doc,
        vehicleVin: v.vin,
        vehicleReg: v.registrationNumber,
        vehicleModel: v.variant?.name,
      })),
    );

    // Flatten payments received for their bookings & invoices
    const bookingPayments = customer.bookings.flatMap((b) =>
      (b.payments || []).map((p) => ({
        id: p.id,
        paymentNumber: p.gatewayPaymentId || p.id.slice(0, 8),
        amount: Number(p.amount),
        status: p.status,
        paymentMode: p.paymentMethod || p.gateway,
        createdAt: p.createdAt,
        referenceType: 'BOOKING',
        referenceNumber: b.bookingNumber,
        branchName: b.branch?.name,
      })),
    );

    const invoicePayments = customer.invoices.flatMap((inv) =>
      (inv.payments || []).map((p) => ({
        id: p.id,
        paymentNumber: p.gatewayPaymentId || p.id.slice(0, 8),
        amount: Number(p.amount),
        status: p.status,
        paymentMode: p.paymentMethod || p.gateway,
        createdAt: p.createdAt,
        referenceType: 'INVOICE',
        referenceNumber: inv.invoiceNumber,
        branchName: inv.branch?.name,
      })),
    );

    const payments = [...bookingPayments, ...invoicePayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      id: customer.id,
      name: customer.name,
      preferredBranchId: customer.preferredBranchId,
      preferredBranch: customer.preferredBranch,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customerType: customer.customerType,
        companyName: customer.companyName,
        preferredBranch: customer.preferredBranch,
      },
      prospectState,
      vehicles: customer.vehicles,
      leads: customer.leads,
      bookings: customer.bookings,
      quotations: customer.quotations,
      serviceAppointments: customer.serviceAppointments,
      serviceJobs: customer.serviceJobs,
      insurancePolicies: customer.insurancePolicies,
      complianceDocuments,
      invoices: customer.invoices,
      payments,
      conversations: customer.conversations,
      summary: {
        vehiclesCount: customer.vehicles.length,
        activeQuotationsCount,
        bookingsCount: customer.bookings.length,
        pendingBookingsCount,
        serviceDueCount,
        totalSpent,
      },
    };
  }
}
