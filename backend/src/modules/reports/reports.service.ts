import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(branchId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [totalLeads, totalQuotations, totalBookings, revenueAgg] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.quotation.count({ where }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.aggregate({
        where: { ...where, status: { in: ['CONFIRMED', 'CONVERTED_TO_DELIVERY'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalLeads,
      totalQuotations,
      totalBookings,
      conversionRate: totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100 * 100) / 100 : 0,
      totalRevenue: revenueAgg._sum.totalAmount || 0,
    };
  }

  async getInventoryReport(branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const [inStock, reserved, allocated, pdiCompleted, delivered] = await Promise.all([
      this.prisma.vehicle.count({ where: { ...where, status: 'IN_STOCK' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'RESERVED' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'ALLOCATED' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'PDI_COMPLETED' } }),
      this.prisma.vehicle.count({ where: { ...where, status: 'DELIVERED' } }),
    ]);

    return {
      inStock,
      reserved,
      allocated,
      pdiCompleted,
      delivered,
      totalPhysicalInventory: inStock + reserved + allocated + pdiCompleted,
    };
  }

  async getServiceReport(branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const [appointments, openJobs, completedJobs, revenueAgg] = await Promise.all([
      this.prisma.serviceAppointment.count({ where }),
      this.prisma.serviceJob.count({ where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      this.prisma.serviceJob.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.serviceJob.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { actualCost: true },
      }),
    ]);

    return {
      appointments,
      openJobs,
      completedJobs,
      serviceRevenue: revenueAgg._sum.actualCost || 0,
    };
  }

  async getFinanceReport(branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const [issuedInvoices, paidInvoices, paymentsAgg] = await Promise.all([
      this.prisma.invoice.count({ where: { ...where, status: 'ISSUED' } }),
      this.prisma.invoice.count({ where: { ...where, paymentStatus: 'PAID' } }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    return {
      issuedInvoices,
      paidInvoices,
      totalCollectedPayments: paymentsAgg._sum.amount || 0,
    };
  }
}
