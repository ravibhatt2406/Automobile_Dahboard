import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminDashboard() {
    const [franchiseCount, branchCount, customerCount, vehicleCount, bookingCount, serviceJobCount, pendingApprovals] =
      await Promise.all([
        this.prisma.franchise.count({ where: { status: 'ACTIVE' } }),
        this.prisma.branch.count({ where: { status: 'ACTIVE' } }),
        this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
        this.prisma.vehicle.count(),
        this.prisma.booking.count(),
        this.prisma.serviceJob.count(),
        this.prisma.employeeApprovalRequest.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      franchiseCount,
      branchCount,
      customerCount,
      vehicleCount,
      bookingCount,
      serviceJobCount,
      pendingApprovals,
    };
  }

  async getBranchManagerDashboard(branchId: string) {
    const [inStockVehicles, confirmedBookings, activeServiceJobs, totalEmployees, pendingApprovals, activeQuotations] =
      await Promise.all([
        this.prisma.vehicle.count({ where: { branchId, status: 'IN_STOCK' } }),
        this.prisma.booking.count({ where: { branchId, status: 'CONFIRMED' } }),
        this.prisma.serviceJob.count({ where: { branchId, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
        this.prisma.employee.count({ where: { branchId, status: 'ACTIVE' } }),
        this.prisma.employeeApprovalRequest.count({
          where: {
            status: 'PENDING',
            employee: { branchId },
          },
        }),
        this.prisma.quotation.count({
          where: {
            branchId,
            status: { in: ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'] },
          },
        }),
      ]);

    return {
      branchId,
      inStockVehicles,
      confirmedBookings,
      activeServiceJobs,
      totalEmployees,
      pendingApprovals,
      activeQuotations,
    };
  }

  async getSalesDashboard(employeeId: string) {
    const [openQuotations, bookings, recentQuotations, recentBookings] = await Promise.all([
      this.prisma.quotation.count({
        where: { salespersonEmployeeId: employeeId, status: { in: ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'] } },
      }),
      this.prisma.booking.count({ where: { salespersonEmployeeId: employeeId } }),
      this.prisma.quotation.findMany({
        where: { salespersonEmployeeId: employeeId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: true, variant: true },
      }),
      this.prisma.booking.findMany({
        where: { salespersonEmployeeId: employeeId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: true, vehicle: true },
      }),
    ]);

    return {
      openQuotationsCount: openQuotations,
      bookingsCount: bookings,
      recentQuotations,
      recentBookings,
    };
  }

  async getMechanicDashboard(mechanicEmployeeId: string) {
    const jobs = await this.prisma.serviceJob.findMany({
      where: { assignedMechanicId: mechanicEmployeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        vehicle: true,
        diagnoses: true,
        jobParts: { include: { part: true } },
      },
    });

    const activeJobs = jobs.filter((j) =>
      ['CHECKED_IN', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(j.status),
    );
    const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');

    return {
      totalAssigned: jobs.length,
      activeJobsCount: activeJobs.length,
      completedJobsCount: completedJobs.length,
      activeJobs,
      completedJobs,
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
      },
    });

    if (customer && !customer.userId && user) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { userId: user.id },
      }).catch(() => {});
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
      };
    }

    return customer;
  }

  async getOrganizationDashboard(franchiseId: string) {
    const [
      branchCount,
      activeEmployees,
      pendingApprovals,
      vehicleCount,
      activeBookings,
      serviceJobs,
    ] = await Promise.all([
      this.prisma.branch.count({ where: { franchiseId, status: 'ACTIVE' } }),
      this.prisma.employee.count({
        where: { branch: { franchiseId }, status: 'ACTIVE' },
      }),
      this.prisma.employeeApprovalRequest.count({
        where: { status: 'PENDING', employee: { branch: { franchiseId } } },
      }),
      this.prisma.vehicle.count({ where: { branch: { franchiseId } } }),
      this.prisma.booking.count({
        where: {
          branch: { franchiseId },
          status: { notIn: ['CANCELLED', 'CONVERTED_TO_DELIVERY'] },
        },
      }),
      this.prisma.serviceJob.count({
        where: {
          branch: { franchiseId },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);

    const branches = await this.prisma.branch.findMany({
      where: { franchiseId },
      include: {
        _count: {
          select: { employees: true, vehicles: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      franchiseId,
      branchCount,
      activeEmployees,
      pendingApprovals,
      vehicleCount,
      activeBookings,
      serviceJobs,
      branches,
    };
  }
}
