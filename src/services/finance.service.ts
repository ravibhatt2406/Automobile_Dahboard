import { apiFetch, unwrapData } from './apiClient';

export interface FinanceEmiSchedule {
  id: string;
  financeApplicationId: string;
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  paidAmount: number;
  status: 'UPCOMING' | 'DUE' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
  liveStatus?: string;
  remainingAmount?: number;
  paidAt?: string;
  paymentReference?: string;
  paymentMode?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface FinanceApplicationDetail {
  id: string;
  applicationNumber: string;
  customerId: string;
  bookingId: string;
  financeProvider: string;
  loanReference?: string;
  loanAmount: number;
  downPayment: number;
  tenureMonths: number;
  interestRate?: number;
  emiAmount?: number;
  firstEmiDate?: string;
  disbursedAt?: string;
  status: string;
  remarks?: string;
  customer?: { id: string; name: string; phone: string; email?: string };
  booking?: {
    id: string;
    bookingNumber: string;
    branchId: string;
    branch?: { id: string; name: string };
    quotation?: { variant?: { name: string } };
    vehicle?: { registrationNumber?: string; vin?: string };
  };
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

export const financeService = {
  async getApplications(params?: {
    status?: string;
    customerId?: string;
    branchId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: FinanceApplicationDetail[]; total: number }> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
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
    bookingId: string;
    financeProvider: string;
    loanReference?: string;
    loanAmount: number;
    downPayment: number;
    tenureMonths: number;
    interestRate?: number;
    emiAmount?: number;
    firstEmiDate?: string;
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
    dto: {
      firstDueDate: string;
      customEmiAmount?: number;
      tenureMonths?: number;
      interestRate?: number;
    },
  ): Promise<FinanceApplicationDetail> {
    const res = await apiFetch<any>(`/finance/applications/${applicationId}/emi-schedule`, {
      method: 'POST',
      body: JSON.stringify(dto),
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
    branchId?: string;
    limit?: number;
  }): Promise<{ items: any[]; total: number; totalOverdueAmount: number }> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            cleanParams[k] = String(v);
          }
        });
      }
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/finance/emi/overdue?${query}`);
      const raw = unwrapData<any>(res);
      return {
        items: raw?.items || [],
        total: raw?.total || 0,
        totalOverdueAmount: raw?.totalOverdueAmount || 0,
      };
    } catch {
      return { items: [], total: 0, totalOverdueAmount: 0 };
    }
  },
};
