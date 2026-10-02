import { Branch } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const branchService = {
  async getBranches(params?: FilterParams): Promise<PaginatedResponse<Branch>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Branch>>(`/branches?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getBranchById(id: string): Promise<Branch | null> {
    try {
      return await apiFetch<Branch>(`/branches/${id}`);
    } catch {
      return null;
    }
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const payload = {
      franchiseId: data.franchiseId || 'FR-DEV-01',
      code: data.code,
      name: data.name,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
    };
    return await apiFetch<Branch>('/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
