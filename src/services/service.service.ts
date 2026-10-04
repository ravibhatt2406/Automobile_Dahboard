import { ServiceJob, ServiceAppointment } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const serviceManagementService = {
  async getServiceJobs(params?: FilterParams): Promise<PaginatedResponse<ServiceJob>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<ServiceJob>>(`/service/jobs?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getAppointments(params?: FilterParams): Promise<PaginatedResponse<ServiceAppointment>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<ServiceAppointment>>(`/service/appointments?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getServiceJobById(id: string): Promise<ServiceJob | null> {
    try {
      return await apiFetch<ServiceJob>(`/service/jobs/${id}`);
    } catch {
      return null;
    }
  },
};

export const serviceService = serviceManagementService;

