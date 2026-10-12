import { InsurancePolicy } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const insuranceService = {
  async getPolicies(params?: FilterParams): Promise<PaginatedResponse<InsurancePolicy>> {
    const cleanParams: Record<string, string> = {};
    if (params?.status) cleanParams.status = params.status;
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
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: 1,
      pageSize: items.length || 10,
      totalPages: 1,
    };
  },

  async getPolicyById(id: string): Promise<InsurancePolicy | null> {
    const res = await apiFetch<any>(`/insurance/${id}`);
    return unwrapData<InsurancePolicy>(res);
  },

  async createPolicy(data: {
    customerId: string;
    bookingId: string;
    insurer: string;
    policyType: string;
    premium: number;
    startDate: string;
    expiryDate: string;
    documentKey?: string;
  }): Promise<InsurancePolicy> {
    const res = await apiFetch<any>('/insurance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<InsurancePolicy>(res);
  },
};
