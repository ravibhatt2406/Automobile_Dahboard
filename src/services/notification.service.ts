import { apiFetch, unwrapData } from './apiClient';

export interface AppNotification {
  id: string;
  userId?: string;
  customerId?: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  body: string;
  metadata?: {
    type?: string;
    approvalRequestId?: string;
    employeeId?: string;
    branchId?: string;
    franchiseId?: string;
    [key: string]: any;
  };
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sentAt?: string;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const res = await apiFetch<any>('/notifications');
      const unwrapped = unwrapData<any>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiFetch<any>('/notifications/unread-count');
      const unwrapped = unwrapData<{ unreadCount: number }>(res);
      return unwrapped?.unreadCount ?? 0;
    } catch {
      return 0;
    }
  },

  async markAsRead(id: string): Promise<any> {
    try {
      const res = await apiFetch<any>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
      return unwrapData(res);
    } catch {
      return null;
    }
  },
};
