import { Invoice } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const billingService = {
  async getInvoices(params?: FilterParams): Promise<PaginatedResponse<Invoice>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Invoice>>(`/billing/invoices?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      return await apiFetch<Invoice>(`/billing/invoices/${id}`);
    } catch {
      return null;
    }
  },
};
