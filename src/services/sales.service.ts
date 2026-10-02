import { Lead, Quotation, Booking } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch } from './apiClient';

export const salesService = {
  async getLeads(params?: FilterParams): Promise<PaginatedResponse<Lead>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Lead>>(`/sales/leads?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getQuotations(params?: FilterParams): Promise<PaginatedResponse<Quotation>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Quotation>>(`/sales/quotations?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getBookings(params?: FilterParams): Promise<PaginatedResponse<Booking>> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return await apiFetch<PaginatedResponse<Booking>>(`/sales/bookings?${query}`);
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getLeadById(id: string): Promise<Lead | null> {
    try {
      return await apiFetch<Lead>(`/sales/leads/${id}`);
    } catch {
      return null;
    }
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    try {
      return await apiFetch<Quotation>(`/sales/quotations/${id}`);
    } catch {
      return null;
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      return await apiFetch<Booking>(`/sales/bookings/${id}`);
    } catch {
      return null;
    }
  },
};
