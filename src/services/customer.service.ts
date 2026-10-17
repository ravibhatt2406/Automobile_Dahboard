import { Customer } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export interface CustomerFilterParams extends FilterParams {
  search?: string;
  branchId?: string;
  franchiseId?: string;
  customerType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export const customerService = {
  async getCustomers(params?: CustomerFilterParams): Promise<PaginatedResponse<Customer>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;
      if (params?.branchId) cleanParams.branchId = params.branchId;
      if (params?.franchiseId) cleanParams.franchiseId = params.franchiseId;
      if (params?.customerType) cleanParams.customerType = params.customerType;
      if (params?.status) cleanParams.status = params.status;

      const pageSize = params?.pageSize || params?.limit || 20;
      const page = params?.page || 1;
      const offset = (page - 1) * pageSize;

      cleanParams.limit = String(pageSize);
      cleanParams.offset = String(offset);

      const query = new URLSearchParams(cleanParams).toString();
      const response = await apiFetch<any>(`/customers${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(response);

      if (Array.isArray(unwrapped)) {
        return {
          data: unwrapped as Customer[],
          total: unwrapped.length,
          page: 1,
          pageSize: unwrapped.length || 10,
          totalPages: 1,
        };
      }

      const items = unwrapped.items || unwrapped.data || [];
      const total = unwrapped.total ?? items.length;

      return {
        data: items as Customer[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
  },

  async getCustomerById(id: string): Promise<Customer> {
    const res = await apiFetch<any>(`/customers/${id}`);
    return unwrapData<Customer>(res);
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const res = await apiFetch<any>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<Customer>(res);
  },

  async updatePreferredBranch(id: string, branchId: string | null): Promise<Customer> {
    const res = await apiFetch<any>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ preferredBranchId: branchId }),
    });
    return unwrapData<Customer>(res);
  },
};
