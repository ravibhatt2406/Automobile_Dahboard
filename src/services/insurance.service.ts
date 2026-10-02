import { InsurancePolicy } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const insuranceService = {
  async getPolicies(params?: FilterParams): Promise<PaginatedResponse<InsurancePolicy>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<InsurancePolicy>>(`/insurance?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },
};
