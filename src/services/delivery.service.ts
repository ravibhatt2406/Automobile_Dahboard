import { DeliveryRecord } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const deliveryService = {
  async getDeliveries(params?: FilterParams): Promise<PaginatedResponse<DeliveryRecord>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<DeliveryRecord>>(`/delivery?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getDeliveryById(id: string): Promise<DeliveryRecord | null> {
    try {
      return await apiFetch<DeliveryRecord>(`/delivery/${id}`);
    } catch {
      return null;
    }
  },
};
