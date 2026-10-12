import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export interface PaymentRecord {
  id: string;
  bookingId?: string;
  invoiceId?: string;
  gateway?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  booking?: any;
  invoice?: any;
}

export const paymentsService = {
  async getPayments(params?: { bookingId?: string; status?: string }): Promise<PaginatedResponse<PaymentRecord>> {
    const cleanParams: Record<string, string> = {};
    if (params?.bookingId) cleanParams.bookingId = params.bookingId;
    if (params?.status) cleanParams.status = params.status;
    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/payments${query ? `?${query}` : ''}`);
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
      page: 1,
      pageSize: items.length || 10,
      totalPages: 1,
    };
  },

  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    const res = await apiFetch<any>(`/payments/${id}`);
    return unwrapData<PaymentRecord>(res);
  },

  async createOrder(data: {
    bookingId: string;
    amount: number;
    gateway?: string;
    idempotencyKey?: string;
  }): Promise<PaymentRecord> {
    const res = await apiFetch<any>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<PaymentRecord>(res);
  },

  async verifyPayment(data: {
    paymentId: string;
    gatewayPaymentId: string;
    signature: string;
    paymentMethod?: string;
  }): Promise<PaymentRecord> {
    const res = await apiFetch<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<PaymentRecord>(res);
  },
};
