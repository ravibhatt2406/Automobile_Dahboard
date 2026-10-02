import { Employee } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const employeeService = {
  async getEmployees(params?: FilterParams): Promise<PaginatedResponse<Employee>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Employee>>(`/employees?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      return await apiFetch<Employee>(`/employees/${id}`);
    } catch {
      return null;
    }
  },
};
