import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminDashboard() {
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
      this.prisma.franchise.count({ where: { status: 'ACTIVE' } }),
      this.prisma.branch.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { status: 'IN_STOCK' } }),
      this.prisma.booking.count(),
      this.prisma.serviceJob.count(),
      this.prisma.serviceJob.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      this.prisma.employeeApprovalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          vehicle: { select: { vin: true, color: true } },
          branch: { select: { name: true, code: true } },
        },
      }),
      this.prisma.branch.findMany({
        take: 5,
        where: { status: 'ACTIVE' },
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
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || user?.accountType === 'SUPER_ADMIN';

    let franchiseIdToUse = queryFranchiseId;

    if (!isSuperAdmin) {
      const userFranchiseId = user?.franchiseId || user?.assignedFranchiseId;
      if (!userFranchiseId) {
        throw new ForbiddenException('User is not assigned to any franchise');
      }
      if (queryFranchiseId && queryFranchiseId !== 'ALL' && queryFranchiseId !== userFranchiseId) {
        throw new ForbiddenException('Cannot access dashboard for another franchise');
      }
      franchiseIdToUse = userFranchiseId;
    } else {
      if (!franchiseIdToUse || franchiseIdToUse === 'ALL') {
        const firstFranchise = await this.prisma.franchise.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });
        franchiseIdToUse = firstFranchise?.id;
      }
    }

    if (!franchiseIdToUse) {
      throw new NotFoundException('No active franchise found');
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
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || user?.accountType === 'SUPER_ADMIN';
    const isFranchiseLevel = userRoles.some((r: string) =>
      ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r),
    );

    let branchIdToUse = queryBranchId;

    if (!isSuperAdmin) {
      if (isFranchiseLevel) {
        const userFranchiseId = user?.franchiseId || user?.assignedFranchiseId;
        if (!branchIdToUse) {
          const firstBranch = await this.prisma.branch.findFirst({
            where: { franchiseId: userFranchiseId, status: 'ACTIVE' },
            select: { id: true },
          });
          branchIdToUse = firstBranch?.id;
        }
      } else {
        const userBranchId = user?.branchId || user?.assignedBranchId;
        if (!userBranchId) {
          throw new ForbiddenException('User is not assigned to any branch');
        }
        if (queryBranchId && queryBranchId !== userBranchId) {
          throw new ForbiddenException('Cannot access dashboard for another branch');
        }
        branchIdToUse = userBranchId;
      }
    } else {
      if (!branchIdToUse) {
        const firstBranch = await this.prisma.branch.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });
        branchIdToUse = firstBranch?.id;
      }
    }

    if (!branchIdToUse) {
      throw new NotFoundException('No branch found');
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

    if (!isSuperAdmin && isFranchiseLevel) {
      const userFranchiseId = user?.franchiseId || user?.assignedFranchiseId;
      if (branch.franchiseId !== userFranchiseId) {
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

  async getSalesDashboard(user: any) {
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || user?.accountType === 'SUPER_ADMIN';
    const isSalesEmployee = userRoles.includes('SALES_EMPLOYEE');

    const employeeId = user?.employeeId || user?.employeeProfile?.id;
    const branchId = user?.branchId || user?.assignedBranchId;

    const quotationWhere: any = {};
    const bookingWhere: any = {};
    const leadWhere: any = {};

    if (isSalesEmployee && employeeId) {
      quotationWhere.salespersonEmployeeId = employeeId;
      bookingWhere.salespersonEmployeeId = employeeId;
      leadWhere.assignedEmployeeId = employeeId;
    } else if (branchId && !isSuperAdmin) {
      quotationWhere.branchId = branchId;
      bookingWhere.branchId = branchId;
      leadWhere.branchId = branchId;
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
          ...(branchId ? { branchId } : {}),
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

  async getServiceAdvisorDashboard(user: any) {
    const branchId = user?.branchId || user?.assignedBranchId;
    const advisorEmployeeId = user?.employeeId || user?.employeeProfile?.id;
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || user?.accountType === 'SUPER_ADMIN';

    const whereBranch: any = !isSuperAdmin && branchId ? { branchId } : {};

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

  async getMechanicDashboard(mechanicEmployeeId: string) {
    if (!mechanicEmployeeId) {
      throw new BadRequestException('Mechanic employee ID is required');
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
      },
    });

    if (customer && !customer.userId && user) {
      await this.prisma.customer
        .update({
          where: { id: customer.id },
          data: { userId: user.id },
        })
        .catch(() => {});
    }

    if (!customer) {
      return {
        id: null,
        name: user?.email?.split('@')[0] || 'Customer',
        email: user?.email,
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

    const totalSpent = (customer.invoices || [])
      .filter((i) => i.paymentStatus === 'PAID')
      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

    return {
      ...customer,
      summary: {
        vehiclesCount: customer.vehicles?.length || 0,
        activeQuotationsCount:
          customer.quotations?.filter((q) => !['EXPIRED', 'REJECTED'].includes(q.status)).length ||
          0,
        bookingsCount: customer.bookings?.length || 0,
        pendingBookingsCount:
          customer.bookings?.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status)).length ||
          0,
        serviceDueCount:
          customer.serviceJobs?.filter((s) => !['COMPLETED', 'CANCELLED'].includes(s.status))
            .length || 0,
        totalSpent,
      },
    };
  }

  // Backward compatibility alias
  async getOrganizationDashboard(franchiseId: string) {
    return this.getFranchiseDashboard(franchiseId);
  }

  // Backward compatibility alias
  async getBranchManagerDashboard(queryBranchId?: string, user?: any) {
    return this.getBranchDashboard(queryBranchId, user);
  }
}
