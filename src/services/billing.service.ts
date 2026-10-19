import { Invoice } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const billingService = {
  async getInvoices(
    params?: FilterParams & { franchiseId?: string; startDate?: string; endDate?: string },
  ): Promise<PaginatedResponse<Invoice>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
      if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
      if (params?.pageSize) cleanParams.limit = String(params.pageSize);

      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/invoices${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(res);
      const items = Array.isArray(unwrapped)
        ? unwrapped
        : Array.isArray(unwrapped?.items)
        ? unwrapped.items
        : Array.isArray(unwrapped?.data)
        ? unwrapped.data
        : [];
      return {
        data: items,
        total: unwrapped?.total ?? items.length,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? (items.length || 50),
        totalPages: Math.ceil((unwrapped?.total ?? items.length) / (params?.pageSize || 50)) || 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const res = await apiFetch<any>(`/invoices/${id}`);
      return unwrapData<Invoice>(res);
    } catch {
      return null;
    }
  },

  async createInvoice(payload: any): Promise<Invoice> {
    const res = await apiFetch<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<Invoice>(res);
  },

  async cancelInvoice(id: string, reason: string): Promise<Invoice> {
    const res = await apiFetch<any>(`/invoices/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    return unwrapData<Invoice>(res);
  },

  async recordPayment(
    id: string,
    payload: { amount: number; paymentMethod?: string; transactionReference?: string },
  ): Promise<Invoice> {
    const res = await apiFetch<any>(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<Invoice>(res);
  },

  getPrintableInvoiceUrl(id: string): string {
    const baseUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:4001/api/v1';
    return `${baseUrl}/invoices/${id}/pdf/download`;
  },
};
