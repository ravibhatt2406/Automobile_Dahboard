import { SparePart } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const sparePartsService = {
  async getSpareParts(params?: FilterParams): Promise<PaginatedResponse<SparePart>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<SparePart>>(`/spare-parts?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },
};
