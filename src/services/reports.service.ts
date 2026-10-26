import { apiFetch, unwrapData } from './apiClient';

export interface SalesOverviewReport {
  summary: {
    grossSales: number;
    netSales: number;
    discountsTotal: number;
    paymentsReceived: number;
    outstandingReceivables: number;
    vehiclesSold: number;
    confirmedBookingsCount: number;
  };
  salesTrend: Array<{
    period: string;
    grossSales: number;
    netSales: number;
    count: number;
  }>;
  branchComparison: Array<{
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
  }>;
  salesVsPayments: Array<{
    period: string;
    invoicedSales: number;
    paymentsReceived: number;
  }>;
  salesDistribution: Array<{
    branchId: string;
    branchName: string;
    branchCode: string;
    value: number;
    percentage: number;
  }>;
  scopedFranchiseId?: string | null;
  scopedBranchId?: string | null;
  totalBranchesInScope: number;
  dateRange: {
    startDate: string;
    endDate: string;
    groupBy: string;
  };
}

export interface SalesReport {
  totalLeads: number;
  totalQuotations: number;
  totalBookings: number;
  conversionRate: number;
  totalRevenue: number;
  totalCollectedPayments: number;
  outstandingInvoicesAmount: number;
  bookingsByMonth: Array<{ month: string; count: number; revenue: number }>;
  salesByBranch: Array<{ branchName: string; count: number; revenue: number }>;
  salesByModel: Array<{ model: string; count: number; revenue: number }>;
  deliveriesByStatus: Array<{ status: string; count: number }>;
}

export interface CRMReport {
  totalLeads: number;
  leadsByStage: Record<string, number>;
  leadsBySource: Array<{ source: string; count: number }>;
  leadToQuoteConversion: number;
  leadToBookingConversion: number;
  overdueFollowUpsCount: number;
  campaignAttribution: {
    attributedLeads: number;
    attributedQuotations: number;
    attributedBookings: number;
  };
}

export interface InventoryReport {
  inStock: number;
  reserved: number;
  allocated: number;
  pdiCompleted: number;
  delivered: number;
  totalPhysicalInventory: number;
  inventoryByVariant: Array<{ variantName: string; inStock: number; total: number }>;
}

export interface ServiceReport {
  appointments: number;
  openJobs: number;
  completedJobs: number;
  awaitingPartsJobs: number;
  serviceRevenue: number;
  averageTurnaroundHours: number;
  jobsByStatus: Record<string, number>;
  workloadByBranch: Array<{ branchName: string; activeJobs: number }>;
}

export interface ComplianceReport {
  expiredCount: number;
  expiringSoonCount: number;
  validCount: number;
  totalDocuments: number;
  documentsByType: Array<{
    documentType: string;
    total: number;
    expired: number;
    expiringSoon: number;
  }>;
  documentsByBranch: Array<{
    branchName: string;
    total: number;
    expired: number;
    expiringSoon: number;
  }>;
  urgentDocuments: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    vin?: string;
    registrationNumber?: string;
    branchName?: string;
    expiryDate: string;
    isExpired: boolean;
  }>;
}

export interface FinanceReport {
  issuedInvoicesCount: number;
  paidInvoicesCount: number;
  partialInvoicesCount: number;
  unpaidInvoicesCount: number;
  totalInvoiceAmount: number;
  totalCollectedPayments: number;
  outstandingBalances: number;
  byPaymentStatus: Array<{ status: string; count: number }>;
  emiSummary: {
    totalEmiObligations: number;
    totalEmiCollected: number;
    overdueEmiCount: number;
    overdueEmiAmount: number;
    upcomingEmiCount: number;
  };
}

export const reportsService = {
  async getSalesReport(params?: {
    branchId?: string;
    franchiseId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SalesReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL')
        cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/sales${query ? `?${query}` : ''}`);
      return (
        unwrapData<SalesReport>(res) || {
          totalLeads: 0,
          totalQuotations: 0,
          totalBookings: 0,
          conversionRate: 0,
          totalRevenue: 0,
          totalCollectedPayments: 0,
          outstandingInvoicesAmount: 0,
          bookingsByMonth: [],
          salesByBranch: [],
          salesByModel: [],
          deliveriesByStatus: [],
        }
      );
    } catch {
      return {
        totalLeads: 0,
        totalQuotations: 0,
        totalBookings: 0,
        conversionRate: 0,
        totalRevenue: 0,
        totalCollectedPayments: 0,
        outstandingInvoicesAmount: 0,
        bookingsByMonth: [],
        salesByBranch: [],
        salesByModel: [],
        deliveriesByStatus: [],
      };
    }
  },

  async getCRMReport(params?: {
    branchId?: string;
    franchiseId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CRMReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL')
        cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/crm${query ? `?${query}` : ''}`);
      return (
        unwrapData<CRMReport>(res) || {
          totalLeads: 0,
          leadsByStage: {},
          leadsBySource: [],
          leadToQuoteConversion: 0,
          leadToBookingConversion: 0,
          overdueFollowUpsCount: 0,
          campaignAttribution: {
            attributedLeads: 0,
            attributedQuotations: 0,
            attributedBookings: 0,
          },
        }
      );
    } catch {
      return {
        totalLeads: 0,
        leadsByStage: {},
        leadsBySource: [],
        leadToQuoteConversion: 0,
        leadToBookingConversion: 0,
        overdueFollowUpsCount: 0,
        campaignAttribution: {
          attributedLeads: 0,
          attributedQuotations: 0,
          attributedBookings: 0,
        },
      };
    }
  },

  async getInventoryReport(params?: {
    branchId?: string;
    franchiseId?: string;
  }): Promise<InventoryReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL')
        cleanParams.franchiseId = params.franchiseId;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/inventory${query ? `?${query}` : ''}`);
      return (
        unwrapData<InventoryReport>(res) || {
          inStock: 0,
          reserved: 0,
          allocated: 0,
          pdiCompleted: 0,
          delivered: 0,
          totalPhysicalInventory: 0,
          inventoryByVariant: [],
        }
      );
    } catch {
      return {
        inStock: 0,
        reserved: 0,
        allocated: 0,
        pdiCompleted: 0,
        delivered: 0,
        totalPhysicalInventory: 0,
        inventoryByVariant: [],
      };
    }
  },

  async getServiceReport(params?: {
    branchId?: string;
    franchiseId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ServiceReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL')
        cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/service${query ? `?${query}` : ''}`);
      return (
        unwrapData<ServiceReport>(res) || {
          appointments: 0,
          openJobs: 0,
          completedJobs: 0,
          awaitingPartsJobs: 0,
          serviceRevenue: 0,
          averageTurnaroundHours: 0,
          jobsByStatus: {},
          workloadByBranch: [],
        }
      );
    } catch {
      return {
        appointments: 0,
        openJobs: 0,
        completedJobs: 0,
        awaitingPartsJobs: 0,
        serviceRevenue: 0,
        averageTurnaroundHours: 0,
        jobsByStatus: {},
        workloadByBranch: [],
      };
    }
  },

  async getComplianceReport(params?: {
    branchId?: string;
    franchiseId?: string;
  }): Promise<ComplianceReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL')
        cleanParams.franchiseId = params.franchiseId;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/compliance${query ? `?${query}` : ''}`);
      return (
        unwrapData<ComplianceReport>(res) || {
          expiredCount: 0,
          expiringSoonCount: 0,
          validCount: 0,
          totalDocuments: 0,
          documentsByType: [],
          documentsByBranch: [],
          urgentDocuments: [],
        }
      );
    } catch {
      return {
        expiredCount: 0,
        expiringSoonCount: 0,
        validCount: 0,
        totalDocuments: 0,
        documentsByType: [],
        documentsByBranch: [],
        urgentDocuments: [],
      };
    }
  },

  async getFinanceReport(params?: {
    branchId?: string;
    franchiseId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FinanceReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL')
        cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/finance${query ? `?${query}` : ''}`);
      return (
        unwrapData<FinanceReport>(res) || {
          issuedInvoicesCount: 0,
          paidInvoicesCount: 0,
          partialInvoicesCount: 0,
          unpaidInvoicesCount: 0,
          totalInvoiceAmount: 0,
          totalCollectedPayments: 0,
          outstandingBalances: 0,
          byPaymentStatus: [],
          emiSummary: {
            totalEmiObligations: 0,
            totalEmiCollected: 0,
            overdueEmiCount: 0,
            overdueEmiAmount: 0,
            upcomingEmiCount: 0,
          },
        }
      );
    } catch {
      return {
        issuedInvoicesCount: 0,
        paidInvoicesCount: 0,
        partialInvoicesCount: 0,
        unpaidInvoicesCount: 0,
        totalInvoiceAmount: 0,
        totalCollectedPayments: 0,
        outstandingBalances: 0,
        byPaymentStatus: [],
        emiSummary: {
          totalEmiObligations: 0,
          totalEmiCollected: 0,
          overdueEmiCount: 0,
          overdueEmiAmount: 0,
          upcomingEmiCount: 0,
        },
      };
    }
  },

  async downloadReportCsv(
    category: 'sales' | 'crm' | 'inventory' | 'service' | 'compliance' | 'finance',
    params?: {
      branchId?: string;
      franchiseId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<void> {
    const cleanParams: Record<string, string> = { category };
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL')
      cleanParams.franchiseId = params.franchiseId;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    const query = new URLSearchParams(cleanParams).toString();

    const token = localStorage.getItem('titan_access_token');
    const response = await fetch(`/api/v1/reports/export?${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export authorized report CSV');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async getSalesOverview(params?: {
    branchId?: string;
    franchiseId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<SalesOverviewReport> {
    const cleanParams: Record<string, string> = {};
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    if (params?.groupBy) cleanParams.groupBy = params.groupBy;
    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/reports/sales-overview${query ? `?${query}` : ''}`);
    return unwrapData<SalesOverviewReport>(res);
  },
};
