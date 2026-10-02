import { Franchise } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const franchiseService = {
  async getFranchises(params?: FilterParams): Promise<PaginatedResponse<Franchise>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Franchise>>(`/franchises?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getFranchiseById(id: string): Promise<Franchise | null> {
    try {
      return await apiFetch<Franchise>(`/franchises/${id}`);
    } catch {
      return null;
    }
  },

  async createFranchise(data: Partial<Franchise>): Promise<Franchise> {
    return await apiFetch<Franchise>('/franchises', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFranchise(id: string, data: Partial<Franchise>): Promise<Franchise> {
    return await apiFetch<Franchise>(`/franchises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
