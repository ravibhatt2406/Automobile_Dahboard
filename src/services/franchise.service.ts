import { Franchise } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const franchiseService = {
  async getFranchises(params?: FilterParams): Promise<PaginatedResponse<Franchise>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;

      const query = new URLSearchParams(cleanParams).toString();
      const response = await apiFetch<any>(`/franchises${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(response);

      if (Array.isArray(unwrapped)) {
        return {
          data: unwrapped as Franchise[],
          total: unwrapped.length,
          page: 1,
          pageSize: unwrapped.length || 10,
          totalPages: 1,
        };
      }

      return unwrapped as PaginatedResponse<Franchise>;
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getFranchiseById(id: string): Promise<Franchise | null> {
    try {
      const res = await apiFetch<any>(`/franchises/${id}`);
      return unwrapData<Franchise>(res);
    } catch {
      return null;
    }
  },

  async createFranchise(data: Partial<Franchise>): Promise<Franchise> {
    const res = await apiFetch<any>('/franchises', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Franchise>(res);
  },

  async updateFranchise(id: string, data: Partial<Franchise>): Promise<Franchise> {
    const res = await apiFetch<any>(`/franchises/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<Franchise>(res);
  },
};
