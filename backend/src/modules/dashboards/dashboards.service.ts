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

    if (scope?.effectiveBranchId) {
      branchWhere.id = scope.effectiveBranchId;
      employeeWhere.branchId = scope.effectiveBranchId;
      vehicleWhere.branchId = scope.effectiveBranchId;
      bookingWhere.branchId = scope.effectiveBranchId;
      serviceJobWhere.branchId = scope.effectiveBranchId;
      approvalWhere.employee = { branchId: scope.effectiveBranchId };
    } else if (scope?.effectiveFranchiseId) {
      franchiseWhere.id = scope.effectiveFranchiseId;
      branchWhere.franchiseId = scope.effectiveFranchiseId;
      employeeWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      vehicleWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      bookingWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      serviceJobWhere.branch = { franchiseId: scope.effectiveFranchiseId };
      approvalWhere.employee = { branch: { franchiseId: scope.effectiveFranchiseId } };
    }

    const [
      franchiseCount,
      branchCount,
      employeeCount,
      customerCount,
      vehicleCount,
      inStockVehicleCount,
      bookingCount,
      serviceJobCount,
      activeServiceJobCount,
      pendingApprovals,
      revenueAgg,
      recentBookings,
      topBranches,
    ] = await Promise.all([
      this.prisma.franchise.count({ where: franchiseWhere }),
      this.prisma.branch.count({ where: branchWhere }),
      this.prisma.employee.count({ where: employeeWhere }),
      this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.vehicle.count({ where: vehicleWhere }),
      this.prisma.vehicle.count({ where: { ...vehicleWhere, status: 'IN_STOCK' } }),
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
      bookingCount,
      serviceJobCount,
      activeServiceJobCount,
      pendingApprovals,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
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

    const [
      branchCount,
      employeeCount,
      pendingApprovals,
      vehicleCount,
      inStockVehicles,
      bookingsCount,
      activeServiceJobsCount,
      revenueAgg,
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

    return {
      franchiseId: franchise.id,
      franchiseName: franchise.name,
      franchiseCode: franchise.code,
      branchCount,
      employeeCount,
      pendingApprovals,
      vehicleCount,
      inStockVehicles,
      bookingsCount,
      activeServiceJobsCount,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
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

    const [
      inStockVehicles,
      totalVehicles,
      confirmedBookings,
      totalBookings,
      activeServiceJobs,
      completedServiceJobs,
      totalEmployees,
      pendingApprovals,
      activeQuotations,
      activeLeads,
      revenueAgg,
      recentBookings,
      recentServiceJobs,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { branchId: branch.id, status: 'IN_STOCK' } }),
      this.prisma.vehicle.count({ where: { branchId: branch.id } }),
      this.prisma.booking.count({
        where: { branchId: branch.id, status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] } },
      }),
      this.prisma.booking.count({ where: { branchId: branch.id } }),
      this.prisma.serviceJob.count({
        where: { branchId: branch.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
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
      totalVehicles,
      confirmedBookings,
      totalBookings,
      activeServiceJobs,
      completedServiceJobs,
      totalEmployees,
      pendingApprovals,
      activeQuotations,
      activeLeads,
      totalRevenue: Number(revenueAgg._sum.totalAmount || 0),
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
          ...(branchId ? { branchId } : scope.effectiveFranchiseId ? { branch: { franchiseId: scope.effectiveFranchiseId } } : {}),
          status: 'IN_STOCK',
        },
      }),
      this.prisma.lead.count({
        where: leadWhere,
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
    const pendingJobs = jobs.filter((j) =>
      ['OPEN', 'CHECKED_IN'].includes(j.status),
    );
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
    let customer = await this.prisma.customer.findFirst({
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
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            vehicle: { include: { variant: true } },
            payments: true,
            invoices: true,
            branch: true,
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
          include: { branch: true },
          orderBy: { createdAt: 'desc' },
        },
        preferredBranch: {
          include: { franchise: true },
        },
      },
    });

    if (!customer) {
      return {
        customer: null,
        vehicles: [],
        bookings: [],
        quotations: [],
        serviceAppointments: [],
        serviceJobs: [],
        insurancePolicies: [],
        invoices: [],
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

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customerType: customer.customerType,
        companyName: customer.companyName,
        preferredBranch: customer.preferredBranch,
      },
      vehicles: customer.vehicles,
      bookings: customer.bookings,
      quotations: customer.quotations,
      serviceAppointments: customer.serviceAppointments,
      serviceJobs: customer.serviceJobs,
      insurancePolicies: customer.insurancePolicies,
      invoices: customer.invoices,
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
