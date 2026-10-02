import { Customer } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const customerService = {
  async getCustomers(params?: FilterParams): Promise<PaginatedResponse<Customer>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Customer>>(`/customers?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      return await apiFetch<Customer>(`/customers/${id}`);
    } catch {
      return null;
    }
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return await apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
