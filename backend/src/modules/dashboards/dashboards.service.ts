import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminDashboard() {
    const [franchiseCount, branchCount, customerCount, vehicleCount, bookingCount, serviceJobCount] =
      await Promise.all([
        this.prisma.franchise.count({ where: { status: 'ACTIVE' } }),
        this.prisma.branch.count({ where: { status: 'ACTIVE' } }),
        this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
        this.prisma.vehicle.count(),
        this.prisma.booking.count(),
        this.prisma.serviceJob.count(),
      ]);

    return {
      franchiseCount,
      branchCount,
      customerCount,
      vehicleCount,
      bookingCount,
      serviceJobCount,
    };
  }

  async getBranchManagerDashboard(branchId: string) {
    const [activeLeads, inStockVehicles, confirmedBookings, activeServiceJobs, totalEmployees] =
      await Promise.all([
        this.prisma.lead.count({ where: { branchId, status: { notIn: ['CONVERTED', 'LOST'] } } }),
        this.prisma.vehicle.count({ where: { branchId, status: 'IN_STOCK' } }),
        this.prisma.booking.count({ where: { branchId, status: 'CONFIRMED' } }),
        this.prisma.serviceJob.count({ where: { branchId, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
        this.prisma.employee.count({ where: { branchId, status: 'ACTIVE' } }),
      ]);

    return {
      branchId,
      activeLeads,
      inStockVehicles,
      confirmedBookings,
      activeServiceJobs,
      totalEmployees,
    };
  }

  async getSalesDashboard(employeeId: string) {
    const [assignedLeads, openQuotations, bookings] = await Promise.all([
      this.prisma.lead.findMany({
        where: { assignedEmployeeId: employeeId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.quotation.findMany({
        where: { salespersonEmployeeId: employeeId, status: 'SUBMITTED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.booking.findMany({
        where: { salespersonEmployeeId: employeeId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      assignedLeadsCount: assignedLeads.length,
      openQuotationsCount: openQuotations.length,
      bookingsCount: bookings.length,
      recentLeads: assignedLeads,
      recentQuotations: openQuotations,
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

    const activeJobs = jobs.filter((j) => ['CHECKED_IN', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(j.status));
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
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      include: {
        vehicles: { include: { variant: { include: { model: true } } } },
        bookings: { include: { vehicle: true } },
        serviceAppointments: true,
        serviceJobs: { include: { vehicle: true } },
      },
    });

    return customer || { message: 'Customer profile not associated with user' };
  }
}
