import { Vehicle } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const vehicleService = {
  async getVehicles(params?: FilterParams): Promise<PaginatedResponse<Vehicle>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;

      const query = new URLSearchParams(cleanParams).toString();
      const response = await apiFetch<any>(`/vehicles${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(response);

      if (Array.isArray(unwrapped)) {
        return {
          data: unwrapped as Vehicle[],
          total: unwrapped.length,
          page: 1,
          pageSize: unwrapped.length || 10,
          totalPages: 1,
        };
      }

      return unwrapped as PaginatedResponse<Vehicle>;
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const res = await apiFetch<any>(`/vehicles/${id}`);
      return unwrapData<Vehicle>(res);
    } catch {
      return null;
    }
  },

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const res = await apiFetch<any>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Vehicle>(res);
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const res = await apiFetch<any>(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<Vehicle>(res);
  },
};
