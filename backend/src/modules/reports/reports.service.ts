import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async resolveScope(user?: any, branchId?: string, franchiseId?: string) {
    const roles: string[] = user?.roles || [];
    const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
    const isFranchiseLevel = roles.some((r) => ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(r));

    let effectiveBranchId = branchId && branchId !== 'ALL' ? branchId : undefined;
    let effectiveFranchiseId = franchiseId && franchiseId !== 'ALL' ? franchiseId : undefined;

    if (user && !isSuperAdmin) {
      if (isFranchiseLevel) {
        const userFranchiseId = user.assignedFranchiseId || user.franchiseId;
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
        const userBranchId = user.assignedBranchId || user.branchId || user.employeeProfile?.branchId;
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

  async getSalesReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(user, branchId, franchiseId);

    const where: any = {};
    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
    }

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
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

  async getInventoryReport(branchId?: string, user?: any, franchiseId?: string) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(user, branchId, franchiseId);

    const where: any = {};
    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
    }

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

  async getServiceReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(user, branchId, franchiseId);

    const where: any = {};
    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
    }

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

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

  async getFinanceReport(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    user?: any,
    franchiseId?: string,
  ) {
    const { effectiveBranchId, effectiveFranchiseId } = await this.resolveScope(user, branchId, franchiseId);

    const where: any = {};
    const paymentWhere: any = { status: 'SUCCESS' };

    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
      paymentWhere.booking = { branchId: effectiveBranchId };
    } else if (effectiveFranchiseId) {
      where.branch = { franchiseId: effectiveFranchiseId };
      paymentWhere.booking = { branch: { franchiseId: effectiveFranchiseId } };
    }

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
      paymentWhere.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
      paymentWhere.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
      paymentWhere.createdAt = { lte: new Date(endDate) };
    }

    const [issuedInvoices, paidInvoices, paymentsAgg] = await Promise.all([
      this.prisma.invoice.count({ where: { ...where, status: 'ISSUED' } }),
      this.prisma.invoice.count({ where: { ...where, paymentStatus: 'PAID' } }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
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
