import { InsurancePolicy } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export interface InsuranceStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  pending: number;
}

export interface InsuranceFilterParams extends FilterParams {
  customerId?: string;
  vehicleId?: string;
  status?: string;
  search?: string;
  branchId?: string;
  franchiseId?: string;
}

export const insuranceService = {
  async getDashboardStats(params?: { branchId?: string; franchiseId?: string }): Promise<InsuranceStats> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
      if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/insurance/stats${query ? `?${query}` : ''}`);
      return unwrapData<InsuranceStats>(res) || { total: 0, active: 0, expiringSoon: 0, expired: 0, pending: 0 };
    } catch {
      return { total: 0, active: 0, expiringSoon: 0, expired: 0, pending: 0 };
    }
  },

  async getPolicies(params?: InsuranceFilterParams): Promise<PaginatedResponse<InsurancePolicy>> {
    const cleanParams: Record<string, string> = {};
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.customerId) cleanParams.customerId = params.customerId;
    if (params?.vehicleId) cleanParams.vehicleId = params.vehicleId;
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;

    const pageSize = params?.pageSize || 20;
    const page = params?.page || 1;
    cleanParams.limit = String(pageSize);
    cleanParams.offset = String((page - 1) * pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/insurance${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    const items = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray(unwrapped?.items)
      ? unwrapped.items
      : Array.isArray(unwrapped?.data)
      ? unwrapped.data
      : [];
    const total = unwrapped?.total ?? items.length;

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getPolicyById(id: string): Promise<InsurancePolicy | null> {
    try {
      const res = await apiFetch<any>(`/insurance/${id}`);
      return unwrapData<InsurancePolicy>(res);
    } catch {
      return null;
    }
  },

  async createPolicy(data: {
    customerId: string;
    bookingId?: string;
    vehicleId?: string;
    insurer: string;
    policyType: string;
    premium: number;
    startDate: string;
    expiryDate: string;
    policyNumber?: string;
    documentKey?: string;
    coverageDetails?: string;
    notes?: string;
    status?: string;
  }): Promise<InsurancePolicy> {
    const res = await apiFetch<any>('/insurance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<InsurancePolicy>(res);
  },

  async updatePolicy(id: string, data: Partial<InsurancePolicy>): Promise<InsurancePolicy> {
    const res = await apiFetch<any>(`/insurance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<InsurancePolicy>(res);
  },

  async renewPolicy(
    id: string,
    data: {
      newStartDate: string;
      newExpiryDate: string;
      newPremium: number;
      newPolicyNumber?: string;
      insurer?: string;
      policyType?: string;
      documentKey?: string;
      notes?: string;
    },
  ): Promise<InsurancePolicy> {
    const res = await apiFetch<any>(`/insurance/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<InsurancePolicy>(res);
  },

  async updateStatus(id: string, status: string): Promise<InsurancePolicy> {
    const res = await apiFetch<any>(`/insurance/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return unwrapData<InsurancePolicy>(res);
  },

  async getPolicyHistory(id: string): Promise<any[]> {
    try {
      const res = await apiFetch<any>(`/insurance/${id}/history`);
      const unwrapped = unwrapData<any>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
  },

  async attachDocument(id: string, fileData: { filename: string; mimeType?: string; storageKey?: string; size?: number }): Promise<any> {
    const res = await apiFetch<any>(`/insurance/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
    return unwrapData<any>(res);
  },
};
