import { apiFetch, unwrapData } from './apiClient';

export type FinanceStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED';

export interface FinanceEmiSchedule {
  id: string;
  financeApplicationId: string;
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  paidAmount: number;
  paidAt?: string;
  status: 'UPCOMING' | 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  liveStatus?: string;
  paymentMode?: string;
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface FinanceApplicationDetail {
  id: string;
  applicationNumber: string;
  loanReference?: string;
  customerId: string;
  bookingId?: string;
  vehicleId?: string;
  financeProvider: string;
  vehiclePrice?: number;
  loanAmount: number;
  downPayment: number;
  tenureMonths: number;
  interestRate?: number;
  interestMethod?: string;
  emiAmount?: number;
  firstEmiDate?: string;
  approvedAt?: string;
  disbursedAmount?: number;
  isManual?: boolean;
  documentKey?: string;
  remarks?: string;
  status: FinanceStatus;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  booking?: {
    id: string;
    bookingNumber: string;
    branchId: string;
    branch?: { id: string; name: string; franchiseId?: string; franchise?: { id: string; name: string } };
    quotation?: { variant?: { name: string } };
    vehicle?: {
      id: string;
      registrationNumber?: string;
      vin?: string;
      chassisNumber?: string;
      model?: string;
      variant?: { name: string };
    };
  };
  vehicle?: {
    id: string;
    vin?: string;
    chassisNumber?: string;
    model?: string;
    registrationNumber?: string;
    variant?: { name: string };
    branch?: { id: string; name: string };
  };
  documents?: any[];
  emiSchedules?: FinanceEmiSchedule[];
  emiSummary?: {
    totalInstallments?: number;
    paidInstallments?: number;
    overdueInstallments?: number;
    overdueCount?: number;
    totalPaid?: number;
    totalEmiObligation?: number;
    outstandingAmount?: number;
    totalOverdueAmount?: number;
    nextDueDate?: string;
    nextDueAmount?: number;
  };
}

export interface FinanceDashboardStats {
  totalApplications: number;
  pendingReview: number;
  approvedLoans: number;
  approved?: number;
  awaitingDisbursement: number;
  activeAgreements: number;
  activeLoans?: number;
  upcomingInstallments: number;
  overdueInstallments: number;
  totalOverdueAmount: number;
  totalOutstandingBalance: number;
  outstandingBalance?: number;
}

export const financeService = {
  async getDashboardStats(params?: { branchId?: string; franchiseId?: string }): Promise<FinanceDashboardStats> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId) cleanParams.branchId = params.branchId;
      if (params?.franchiseId) cleanParams.franchiseId = params.franchiseId;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/finance/dashboard/stats${query ? `?${query}` : ''}`);
      const raw = unwrapData<FinanceDashboardStats>(res);
      return {
        ...raw,
        approved: raw?.approvedLoans ?? 0,
        activeLoans: raw?.activeAgreements ?? 0,
        outstandingBalance: raw?.totalOutstandingBalance ?? 0,
      };
    } catch {
      return {
        totalApplications: 0,
        pendingReview: 0,
        approvedLoans: 0,
        approved: 0,
        awaitingDisbursement: 0,
        activeAgreements: 0,
        activeLoans: 0,
        upcomingInstallments: 0,
        overdueInstallments: 0,
        totalOverdueAmount: 0,
        totalOutstandingBalance: 0,
        outstandingBalance: 0,
      };
    }
  },

  async getApplications(params?: {
    status?: string;
    customerId?: string;
    vehicleId?: string;
    branchId?: string;
    franchiseId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: FinanceApplicationDetail[]; total: number }> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
            cleanParams[k] = String(v);
          }
        });
      }
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/finance/applications?${query}`);
      const raw = unwrapData<any>(res);
      const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      const total = raw?.total ?? items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async getApplication(id: string): Promise<FinanceApplicationDetail | null> {
    try {
      const res = await apiFetch<any>(`/finance/applications/${id}`);
      return unwrapData<FinanceApplicationDetail>(res);
    } catch {
      return null;
    }
  },

  async createApplication(data: {
    customerId: string;
    bookingId?: string;
    vehicleId?: string;
    financeProvider: string;
    loanReference?: string;
    vehiclePrice?: number;
    loanAmount: number;
    downPayment: number;
    tenureMonths: number;
    interestRate?: number;
    interestMethod?: string;
    emiAmount?: number;
    firstEmiDate?: string;
    documentKey?: string;
    remarks?: string;
  }): Promise<FinanceApplicationDetail> {
    const res = await apiFetch<any>('/finance/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<FinanceApplicationDetail>(res);
  },

  async updateStatus(id: string, status: string, remarks?: string): Promise<FinanceApplicationDetail> {
    const res = await apiFetch<any>(`/finance/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    });
    return unwrapData<FinanceApplicationDetail>(res);
  },

  async generateEmiSchedule(
    applicationId: string,
    dto?: {
      firstDueDate?: string;
      firstEmiDate?: string;
      customEmiAmount?: number;
      tenureMonths?: number;
      interestRate?: number;
      interestMethod?: string;
    },
  ): Promise<FinanceApplicationDetail> {
    const payload = {
      firstDueDate: dto?.firstDueDate || dto?.firstEmiDate || new Date().toISOString(),
      customEmiAmount: dto?.customEmiAmount,
      tenureMonths: dto?.tenureMonths,
      interestRate: dto?.interestRate,
      interestMethod: dto?.interestMethod,
    };
    const res = await apiFetch<any>(`/finance/applications/${applicationId}/emi-schedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<FinanceApplicationDetail>(res);
  },

  async recordEmiPayment(
    scheduleId: string,
    payment: {
      amount: number;
      paymentMode: string;
      paymentReference: string;
      paidAt?: string;
      receiptUrl?: string;
      notes?: string;
    },
  ): Promise<FinanceEmiSchedule> {
    const res = await apiFetch<any>(`/finance/emi/${scheduleId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
    return unwrapData<FinanceEmiSchedule>(res);
  },

  async getOverdueEmis(params?: {
    daysOverdue?: number;
    branchId?: string;
    franchiseId?: string;
  }): Promise<{ items: any[]; totalOverdueAmount: number; count: number }> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.daysOverdue) cleanParams.daysOverdue = String(params.daysOverdue);
      if (params?.branchId) cleanParams.branchId = params.branchId;
      if (params?.franchiseId) cleanParams.franchiseId = params.franchiseId;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/finance/emi/overdue?${query}`);
      const raw = unwrapData<any>(res);
      return {
        items: raw?.items || [],
        totalOverdueAmount: raw?.totalOverdueAmount || 0,
        count: raw?.count || 0,
      };
    } catch {
      return { items: [], totalOverdueAmount: 0, count: 0 };
    }
  },

  async getHistory(id: string): Promise<any[]> {
    try {
      const res = await apiFetch<any>(`/finance/applications/${id}/history`);
      const unwrapped = unwrapData<any>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
  },

  async attachDocument(
    id: string,
    fileData: {
      filename?: string;
      documentName?: string;
      mimeType?: string;
      storageKey?: string;
      documentKey?: string;
      documentType?: string;
      size?: number;
    },
  ): Promise<any> {
    const payload = {
      filename: fileData.filename || fileData.documentName || 'document.pdf',
      documentName: fileData.documentName || fileData.filename,
      storageKey: fileData.storageKey || fileData.documentKey,
      documentKey: fileData.documentKey || fileData.storageKey,
      documentType: fileData.documentType,
      mimeType: fileData.mimeType,
      size: fileData.size,
    };
    const res = await apiFetch<any>(`/finance/applications/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<any>(res);
  },
};
