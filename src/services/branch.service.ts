import { Branch } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const branchService = {
  async getBranches(params?: FilterParams): Promise<PaginatedResponse<Branch>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;
      if (params?.franchiseId) cleanParams.franchiseId = params.franchiseId;

      const query = new URLSearchParams(cleanParams).toString();
      const response = await apiFetch<any>(`/branches${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(response);

      if (Array.isArray(unwrapped)) {
        return {
          data: unwrapped as Branch[],
          total: unwrapped.length,
          page: 1,
          pageSize: unwrapped.length || 10,
          totalPages: 1,
        };
      }

      return unwrapped as PaginatedResponse<Branch>;
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getBranchById(id: string): Promise<Branch | null> {
    try {
      const res = await apiFetch<any>(`/branches/${id}`);
      return unwrapData<Branch>(res);
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
      phone: data.phone || undefined,
      email: data.email || undefined,
    };
    const res = await apiFetch<any>('/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<Branch>(res);
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const payload = {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      phone: data.phone,
      email: data.email,
    };
    const res = await apiFetch<any>(`/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return unwrapData<Branch>(res);
  },

  async updateBranchStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Branch> {
    const res = await apiFetch<any>(`/branches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return unwrapData<Branch>(res);
  },
};
