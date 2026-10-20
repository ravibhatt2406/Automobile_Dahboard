import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { resolveUserScope } from '@/common/utils/scope.util';

export interface SearchResultItem {
  id: string;
  type: 'CUSTOMER' | 'VEHICLE' | 'BOOKING' | 'QUOTATION' | 'INVOICE' | 'SERVICE_JOB';
  title: string;
  subtitle: string;
  branchName?: string;
  url: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(
    query: string,
    user: any,
    branchId?: string,
    franchiseId?: string,
  ): Promise<SearchResultItem[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const term = query.trim();
    const isCustomer = user?.accountType === 'CUSTOMER' || user?.roles?.includes('CUSTOMER');

    if (isCustomer) {
      return this.customerSearch(term, user);
    }

    // Employee / Admin search with strict tenant scoping
    const scope = await resolveUserScope(
      this.prisma,
      user,
      branchId,
      franchiseId,
      user?.effectiveScope?.activeRole || user?.roles?.[0] || 'BRANCH_MANAGER',
    );

    const branchFilter: any = {};
    const franchiseBranchFilter: any = {};
    const directFranchiseFilter: any = {};

    if (scope.effectiveBranchId) {
      branchFilter.branchId = scope.effectiveBranchId;
      franchiseBranchFilter.branchId = scope.effectiveBranchId;
      directFranchiseFilter.branchId = scope.effectiveBranchId;
    } else if (scope.effectiveFranchiseId) {
      branchFilter.branch = { franchiseId: scope.effectiveFranchiseId };
      franchiseBranchFilter.branch = { franchiseId: scope.effectiveFranchiseId };
      directFranchiseFilter.franchiseId = scope.effectiveFranchiseId;
    }

    const results: SearchResultItem[] = [];

    // 1. Search Customers (by name or phone)
    const customerWhere: any = {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ],
    };

    if (scope.effectiveBranchId) {
      customerWhere.OR.push(
        { bookings: { some: { branchId: scope.effectiveBranchId } } },
        { vehicles: { some: { branchId: scope.effectiveBranchId } } },
      );
    }

    const customers = await this.prisma.customer.findMany({
      where: customerWhere,
      take: 4,
      include: {
        preferredBranch: { select: { name: true } },
      },
    });

    for (const c of customers) {
      results.push({
        id: c.id,
        type: 'CUSTOMER',
        title: c.name,
        subtitle: `Phone: ${c.phone} ${c.companyName ? `• ${c.companyName}` : ''}`,
        branchName: c.preferredBranch?.name,
        url: `/customers/${c.id}`,
      });
    }

    // 2. Search Vehicles (by VIN, registrationNumber, engineNumber)
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        ...branchFilter,
        OR: [
          { vin: { contains: term, mode: 'insensitive' } },
          { registrationNumber: { contains: term, mode: 'insensitive' } },
          { engineNumber: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 4,
      include: {
        variant: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    for (const v of vehicles) {
      results.push({
        id: v.id,
        type: 'VEHICLE',
        title: `${v.variant?.name || 'Commercial Truck'} (${v.vin})`,
        subtitle: `Status: ${v.status} • Reg: ${v.registrationNumber || 'Pending'}`,
        branchName: v.branch?.name,
        url: `/inventory/vehicles/${v.id}`,
      });
    }

    // 3. Search Bookings (by bookingNumber)
    const bookings = await this.prisma.booking.findMany({
      where: {
        ...branchFilter,
        bookingNumber: { contains: term, mode: 'insensitive' },
      },
      take: 4,
      include: {
        customer: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    for (const b of bookings) {
      results.push({
        id: b.id,
        type: 'BOOKING',
        title: `Booking #${b.bookingNumber}`,
        subtitle: `Customer: ${b.customer?.name || 'N/A'} • Status: ${b.status}`,
        branchName: b.branch?.name,
        url: `/sales/bookings/${b.id}`,
      });
    }

    // 4. Search Quotations (by quotationNumber)
    const quotations = await this.prisma.quotation.findMany({
      where: {
        ...directFranchiseFilter,
        quotationNumber: { contains: term, mode: 'insensitive' },
      },
      take: 4,
      include: {
        customer: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    for (const q of quotations) {
      results.push({
        id: q.id,
        type: 'QUOTATION',
        title: `Quotation #${q.quotationNumber}`,
        subtitle: `Customer: ${q.customer?.name || 'N/A'} • Status: ${q.status}`,
        branchName: q.branch?.name,
        url: `/sales/quotations/${q.id}`,
      });
    }

    // 5. Search Invoices (by invoiceNumber)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...directFranchiseFilter,
        invoiceNumber: { contains: term, mode: 'insensitive' },
      },
      take: 4,
      include: {
        customer: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    for (const inv of invoices) {
      results.push({
        id: inv.id,
        type: 'INVOICE',
        title: `Invoice #${inv.invoiceNumber}`,
        subtitle: `Amount: ₹${Number(inv.totalAmount).toLocaleString('en-IN')} • Status: ${inv.paymentStatus}`,
        branchName: inv.branch?.name,
        url: `/billing/invoices/${inv.id}`,
      });
    }

    // 6. Search Service Jobs (by jobNumber)
    const serviceJobs = await this.prisma.serviceJob.findMany({
      where: {
        ...branchFilter,
        jobNumber: { contains: term, mode: 'insensitive' },
      },
      take: 4,
      include: {
        customer: { select: { name: true } },
        branch: { select: { name: true } },
        vehicle: { select: { vin: true } },
      },
    });

    for (const sj of serviceJobs) {
      results.push({
        id: sj.id,
        type: 'SERVICE_JOB',
        title: `Service Job #${sj.jobNumber}`,
        subtitle: `Complaint: ${sj.complaint.slice(0, 30)} • Status: ${sj.status}`,
        branchName: sj.branch?.name,
        url: `/service/jobs/${sj.id}`,
      });
    }

    return results;
  }

  private async customerSearch(term: string, user: any): Promise<SearchResultItem[]> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(user?.email ? [{ email: user.email }] : []),
          ...(user?.phone ? [{ phone: user.phone }] : []),
        ],
      },
    });

    if (!customer) {
      return [];
    }

    const results: SearchResultItem[] = [];

    // Search customer's vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        customerId: customer.id,
        OR: [
          { vin: { contains: term, mode: 'insensitive' } },
          { registrationNumber: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 3,
      include: { variant: { select: { name: true } }, branch: { select: { name: true } } },
    });

    for (const v of vehicles) {
      results.push({
        id: v.id,
        type: 'VEHICLE',
        title: `${v.variant?.name || 'My Vehicle'} (${v.vin})`,
        subtitle: `Reg: ${v.registrationNumber || 'Pending'} • Status: ${v.status}`,
        branchName: v.branch?.name,
        url: `/inventory/vehicles/${v.id}`,
      });
    }

    // Search customer's bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        customerId: customer.id,
        bookingNumber: { contains: term, mode: 'insensitive' },
      },
      take: 3,
      include: { branch: { select: { name: true } } },
    });

    for (const b of bookings) {
      results.push({
        id: b.id,
        type: 'BOOKING',
        title: `My Booking #${b.bookingNumber}`,
        subtitle: `Status: ${b.status} • Total: ₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`,
        branchName: b.branch?.name,
        url: `/sales/bookings`,
      });
    }

    // Search customer's quotations
    const quotations = await this.prisma.quotation.findMany({
      where: {
        customerId: customer.id,
        quotationNumber: { contains: term, mode: 'insensitive' },
      },
      take: 3,
      include: { branch: { select: { name: true } } },
    });

    for (const q of quotations) {
      results.push({
        id: q.id,
        type: 'QUOTATION',
        title: `My Quotation #${q.quotationNumber}`,
        subtitle: `Status: ${q.status} • Estimate: ₹${Number(q.totalAmount || 0).toLocaleString('en-IN')}`,
        branchName: q.branch?.name,
        url: `/sales/quotations`,
      });
    }

    // Search customer's service jobs
    const jobs = await this.prisma.serviceJob.findMany({
      where: {
        customerId: customer.id,
        jobNumber: { contains: term, mode: 'insensitive' },
      },
      take: 3,
      include: { branch: { select: { name: true } } },
    });

    for (const j of jobs) {
      results.push({
        id: j.id,
        type: 'SERVICE_JOB',
        title: `Service Job #${j.jobNumber}`,
        subtitle: `Status: ${j.status} • Complaint: ${j.complaint.slice(0, 30)}`,
        branchName: j.branch?.name,
        url: `/service/jobs`,
      });
    }

    return results;
  }
}
