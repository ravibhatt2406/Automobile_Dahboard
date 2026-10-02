import { FinanceApplication } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const financeService = {
  async getApplications(params?: FilterParams): Promise<PaginatedResponse<FinanceApplication>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<FinanceApplication>>(`/finance/applications?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },
};
