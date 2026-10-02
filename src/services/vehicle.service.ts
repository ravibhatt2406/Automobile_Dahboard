import { Vehicle } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const vehicleService = {
  async getVehicles(params?: FilterParams): Promise<PaginatedResponse<Vehicle>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Vehicle>>(`/vehicles?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      return await apiFetch<Vehicle>(`/vehicles/${id}`);
    } catch {
      return null;
    }
  },

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    return await apiFetch<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return await apiFetch<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
