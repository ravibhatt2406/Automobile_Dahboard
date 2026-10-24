import { Branch } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

function normalizeBranch(b: any): Branch {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    franchiseId: b.franchiseId,
    franchiseName: b.franchiseName || b.franchise?.name || 'Ashok Leyland Commercial',
    address: b.address || '',
    city: b.city || '',
    state: b.state || '',
    pincode: b.pincode,
    phone: b.phone,
    email: b.email,
    status: (b.status || 'ACTIVE').toUpperCase(),
    createdAt: b.createdAt || new Date().toISOString(),
  };
}

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
        const mapped = unwrapped.map(normalizeBranch);
        return {
          data: mapped,
          total: mapped.length,
          page: 1,
          pageSize: mapped.length || 10,
          totalPages: 1,
        };
      }

      const items = Array.isArray(unwrapped?.data) ? unwrapped.data.map(normalizeBranch) : [];
      return {
        data: items,
        total: unwrapped?.total ?? items.length,
        page: unwrapped?.page ?? 1,
        pageSize: unwrapped?.pageSize ?? 10,
        totalPages: unwrapped?.totalPages ?? 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getPublicActiveBranches(city?: string): Promise<Branch[]> {
    try {
      const query = city && city !== 'ALL' ? `?city=${encodeURIComponent(city)}` : '';
      const res = await apiFetch<any>(`/branches/public/active${query}`);
      const unwrapped = unwrapData<any>(res);
      if (Array.isArray(unwrapped)) {
        return unwrapped.map(normalizeBranch);
      }
      return [];
    } catch (err) {
      console.error('Failed to load active branches:', err);
      return [];
    }
  },

  async getBranchById(id: string): Promise<Branch | null> {
    try {
      const res = await apiFetch<any>(`/branches/${id}`);
      const unwrapped = unwrapData<any>(res);
      return unwrapped ? normalizeBranch(unwrapped) : null;
    } catch {
      return null;
    }
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const payload = {
      franchiseId: data.franchiseId || undefined,
      code: data.code,
      name: data.name,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
    };
    const res = await apiFetch<any>('/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeBranch(unwrapData<any>(res));
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const payload = {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
    };
    const res = await apiFetch<any>(`/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeBranch(unwrapData<any>(res));
  },

  async updateBranchStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Branch> {
    const res = await apiFetch<any>(`/branches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normalizeBranch(unwrapData<any>(res));
  },

  async deleteBranch(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch<any>(`/branches/${id}`, {
      method: 'DELETE',
    });
    return unwrapData<{ success: boolean; message: string }>(res);
  },
};
