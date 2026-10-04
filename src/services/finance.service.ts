import { FinanceApplication } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const financeService = {
  async getApplications(params?: FilterParams): Promise<PaginatedResponse<FinanceApplication>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const res = await apiFetch<any>(`/finance/applications?${query}`);
      const raw = unwrapData<any>(res);
      const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      const total = raw?.total ?? items.length;
      return { data: items, total, page: 1, pageSize: 10, totalPages: Math.ceil((total || 1) / 10) };
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },
};
