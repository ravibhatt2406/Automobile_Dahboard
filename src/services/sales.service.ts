import { Lead, Quotation, Booking } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export const salesService = {
  async getLeads(params?: FilterParams & { franchiseId?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<Lead>> {
    const cleanParams: Record<string, string> = {};
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/leads${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    const items = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray(unwrapped?.items)
      ? unwrapped.items
      : Array.isArray(unwrapped?.data)
      ? unwrapped.data
      : [];
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? (items.length || 50),
      totalPages: Math.ceil((unwrapped?.total ?? items.length) / (params?.pageSize || 50)) || 1,
    };
  },

  async getQuotations(params?: FilterParams & { franchiseId?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<Quotation>> {
    const cleanParams: Record<string, string> = {};
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/quotations${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    const items = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray(unwrapped?.items)
      ? unwrapped.items
      : Array.isArray(unwrapped?.data)
      ? unwrapped.data
      : [];
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? (items.length || 50),
      totalPages: Math.ceil((unwrapped?.total ?? items.length) / (params?.pageSize || 50)) || 1,
    };
  },

  async getBookings(params?: FilterParams & { franchiseId?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<Booking>> {
    const cleanParams: Record<string, string> = {};
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/bookings${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    const items = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray(unwrapped?.items)
      ? unwrapped.items
      : Array.isArray(unwrapped?.data)
      ? unwrapped.data
      : [];
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? (items.length || 50),
      totalPages: Math.ceil((unwrapped?.total ?? items.length) / (params?.pageSize || 50)) || 1,
    };
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const res = await apiFetch<any>(`/leads/${id}`);
    return unwrapData<Lead>(res);
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    const res = await apiFetch<any>(`/quotations/${id}`);
    return unwrapData<Quotation>(res);
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const res = await apiFetch<any>(`/bookings/${id}`);
    return unwrapData<Booking>(res);
  },

  async createLead(data: {
    customerId?: string;
    branchId: string;
    franchiseId?: string;
    interestedModel?: string;
    expectedBudget?: number;
    notes?: string;
  }): Promise<Lead> {
    const res = await apiFetch<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Lead>(res);
  },

  async createQuotation(data: {
    customerId?: string;
    branchId?: string;
    variantId: string;
    vehicleId?: string;
    quantity?: number;
    accessoriesAmount?: number;
    insuranceAmount?: number;
    registrationAmount?: number;
    financeCharges?: number;
    discountAmount?: number;
    validityDate?: string;
    notes?: string;
  }): Promise<Quotation> {
    const res = await apiFetch<any>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Quotation>(res);
  },

  async createBooking(data: {
    customerId?: string;
    quotationId: string;
    vehicleId?: string;
    branchId?: string;
    bookingAmount: number;
    notes?: string;
  }): Promise<Booking> {
    const res = await apiFetch<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Booking>(res);
  },
};
