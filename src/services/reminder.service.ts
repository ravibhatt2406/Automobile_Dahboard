import { apiFetch, unwrapData } from './apiClient';

export interface EligibleReminderItem {
  category: 'SERVICE_DUE' | 'INSURANCE_EXPIRY' | 'COMPLIANCE_EXPIRY' | 'EMI_DUE' | 'GENERAL';
  customerId: string;
  vehicleId?: string;
  branchId: string;
  recipientName: string;
  recipientPhone: string;
  referenceType?: string;
  referenceId?: string;
  dueDate?: string;
  draftMessage: string;
  branchName?: string;
  vehicleInfo?: string;
  isPhoneValid: boolean;
  whatsappUrl?: string | null;
  alreadyInitiatedRecently?: boolean;
}

export interface CustomerReminderRecord {
  id: string;
  customerId: string;
  vehicleId?: string;
  branchId: string;
  category: string;
  recipientName: string;
  recipientPhone: string;
  referenceType: string;
  referenceId?: string;
  dueDate?: string;
  draftMessage: string;
  channel: string;
  status: 'PREPARED' | 'USER_INITIATED' | 'SENT' | 'FAILED' | 'CANCELLED';
  initiatedAt?: string;
  sentAt?: string;
  notes?: string;
  createdAt: string;
  whatsappUrl?: string;
  customer?: { id: string; name: string; phone: string };
  vehicle?: { id: string; registrationNumber?: string; vin?: string };
  branch?: { id: string; name: string };
}

export const reminderService = {
  async getEligibleReminders(params?: {
    category?: string;
    branchId?: string;
  }): Promise<EligibleReminderItem[]> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            cleanParams[k] = String(v);
          }
        });
      }
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reminders/eligible?${query}`);
      const raw = unwrapData<any>(res);
      return Array.isArray(raw) ? raw : (raw?.items || []);
    } catch {
      return [];
    }
  },

  async createReminder(payload: {
    customerId: string;
    vehicleId?: string;
    branchId?: string;
    category: string;
    recipientName: string;
    recipientPhone: string;
    referenceType?: string;
    referenceId?: string;
    dueDate?: string;
    messageTemplate?: string;
    draftMessage: string;
    notes?: string;
  }): Promise<CustomerReminderRecord> {
    const res = await apiFetch<any>('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<CustomerReminderRecord>(res);
  },

  async markInitiated(id: string): Promise<CustomerReminderRecord> {
    const res = await apiFetch<any>(`/reminders/${id}/initiate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return unwrapData<CustomerReminderRecord>(res);
  },

  async getRemindersHistory(params?: {
    category?: string;
    status?: string;
    branchId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CustomerReminderRecord[]; total: number }> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            cleanParams[k] = String(v);
          }
        });
      }
      const query = new URLSearchParams(cleanParams).toString();
      const res = await apiFetch<any>(`/reminders?${query}`);
      const raw = unwrapData<any>(res);
      const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      const total = raw?.total ?? items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },
};
