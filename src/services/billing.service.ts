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
};
