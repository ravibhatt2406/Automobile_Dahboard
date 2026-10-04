import { Vehicle } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const vehicleService = {
  async getVehicles(params?: FilterParams): Promise<PaginatedResponse<Vehicle>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;
      if (params?.branchId) cleanParams.branchId = params.branchId;
      if (params?.status) cleanParams.status = params.status;

      const query = new URLSearchParams(cleanParams).toString();
      const response = await apiFetch<any>(`/vehicles${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(response);

      // Backend inventory returns {items, total, limit, offset}
      if (unwrapped && typeof unwrapped === 'object' && 'items' in unwrapped) {
        const items = unwrapped.items as Vehicle[];
        return {
          data: items,
          total: unwrapped.total || items.length,
          page: 1,
          pageSize: unwrapped.limit || items.length || 10,
          totalPages: 1,
        };
      }

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

  async createVehicle(data: Record<string, any>): Promise<Vehicle> {
    const res = await apiFetch<any>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Vehicle>(res);
  },

  async updateVehicleStatus(id: string, status: string): Promise<Vehicle> {
    const res = await apiFetch<any>(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
