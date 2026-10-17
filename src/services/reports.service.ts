import { apiFetch, unwrapData } from './apiClient';

export interface SalesReport {
  totalLeads: number;
  totalQuotations: number;
  totalBookings: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface InventoryReport {
  inStock: number;
  reserved: number;
  allocated: number;
  pdiCompleted: number;
  delivered: number;
  totalPhysicalInventory: number;
}

export interface ServiceReport {
  appointments: number;
  openJobs: number;
  completedJobs: number;
  serviceRevenue: number;
}

export interface FinanceReport {
  issuedInvoices: number;
  paidInvoices: number;
  totalCollectedPayments: number;
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
      if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/sales${query ? `?${query}` : ''}`);
      return unwrapData<SalesReport>(res) || {
        totalLeads: 0,
        totalQuotations: 0,
        totalBookings: 0,
        conversionRate: 0,
        totalRevenue: 0,
      };
    } catch {
      return { totalLeads: 0, totalQuotations: 0, totalBookings: 0, conversionRate: 0, totalRevenue: 0 };
    }
  },

  async getInventoryReport(params?: {
    branchId?: string;
    franchiseId?: string;
  }): Promise<InventoryReport> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/inventory${query ? `?${query}` : ''}`);
      return unwrapData<InventoryReport>(res) || {
        inStock: 0,
        reserved: 0,
        allocated: 0,
        pdiCompleted: 0,
        delivered: 0,
        totalPhysicalInventory: 0,
      };
    } catch {
      return { inStock: 0, reserved: 0, allocated: 0, pdiCompleted: 0, delivered: 0, totalPhysicalInventory: 0 };
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
      if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/service${query ? `?${query}` : ''}`);
      return unwrapData<ServiceReport>(res) || {
        appointments: 0,
        openJobs: 0,
        completedJobs: 0,
        serviceRevenue: 0,
      };
    } catch {
      return { appointments: 0, openJobs: 0, completedJobs: 0, serviceRevenue: 0 };
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
      if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reports/finance${query ? `?${query}` : ''}`);
      return unwrapData<FinanceReport>(res) || {
        issuedInvoices: 0,
        paidInvoices: 0,
        totalCollectedPayments: 0,
      };
    } catch {
      return { issuedInvoices: 0, paidInvoices: 0, totalCollectedPayments: 0 };
    }
  },
};
