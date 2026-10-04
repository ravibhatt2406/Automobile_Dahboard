import { Customer } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const customerService = {
  async getCustomers(params?: FilterParams): Promise<PaginatedResponse<Customer>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;

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

      return unwrapped as PaginatedResponse<Customer>;
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const res = await apiFetch<any>(`/customers/${id}`);
      return unwrapData<Customer>(res);
    } catch {
      return null;
    }
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const res = await apiFetch<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Customer>(res);
  },
};
