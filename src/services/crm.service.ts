import { Lead, LeadActivity } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export interface LeadFilterParams extends FilterParams {
  view?: 'ALL' | 'MY_LEADS' | 'FOLLOW_UPS_DUE' | 'QUALIFIED' | 'WON' | 'LOST' | string;
  franchiseId?: string;
  source?: string;
  assignedEmployeeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateLeadDto {
  customerId?: string;
  branchId: string;
  franchiseId?: string;
  prospectName?: string;
  prospectPhone?: string;
  prospectEmail?: string;
  companyName?: string;
  assignedEmployeeId?: string;
  source?: string;
  interestedModel?: string;
  expectedBudget?: number;
  priority?: string;
  notes?: string;
  expectedPurchaseDate?: string;
  nextFollowUpDate?: string;
}

export interface CreateLeadActivityDto {
  activityType: 'CALL' | 'MEETING' | 'NOTE' | 'TEST_DRIVE' | 'FOLLOW_UP' | 'STAGE_CHANGE';
  title: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  metadata?: any;
}

export interface ConvertCustomerDto {
  customerType?: 'INDIVIDUAL' | 'BUSINESS' | 'ENTERPRISE';
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
}

export const crmService = {
  async getLeads(params?: LeadFilterParams): Promise<PaginatedResponse<Lead>> {
    const cleanParams: Record<string, string> = {};
    if (params?.view && params.view !== 'ALL') cleanParams.view = params.view;
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.source && params.source !== 'ALL') cleanParams.source = params.source;
    if (params?.assignedEmployeeId) cleanParams.assignedEmployeeId = params.assignedEmployeeId;
    if (params?.search) cleanParams.search = params.search;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    if (params?.page) cleanParams.offset = String((params.page - 1) * (params.pageSize || 50));
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

  async getLeadById(id: string): Promise<Lead | null> {
    const res = await apiFetch<any>(`/leads/${id}`);
    return unwrapData<Lead>(res);
  },

  async createLead(data: CreateLeadDto): Promise<Lead> {
    const res = await apiFetch<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Lead>(res);
  },

  async updateLead(id: string, data: Partial<Lead> & { nextFollowUpDate?: string; lostReason?: string }): Promise<Lead> {
    const res = await apiFetch<any>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<Lead>(res);
  },

  async updateLeadStatus(id: string, status: string, lostReason?: string): Promise<Lead> {
    const res = await apiFetch<any>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, lostReason }),
    });
    return unwrapData<Lead>(res);
  },

  async assignLead(id: string, employeeId: string): Promise<Lead> {
    const res = await apiFetch<any>(`/leads/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ employeeId }),
    });
    return unwrapData<Lead>(res);
  },

  async addFollowUp(id: string, data: { scheduledAt: string; notes: string }): Promise<any> {
    const res = await apiFetch<any>(`/leads/${id}/follow-up`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<any>(res);
  },

  async getActivities(leadId: string): Promise<LeadActivity[]> {
    const res = await apiFetch<any>(`/leads/${leadId}/activities`);
    const unwrapped = unwrapData<any>(res);
    return Array.isArray(unwrapped) ? unwrapped : [];
  },

  async addActivity(leadId: string, data: CreateLeadActivityDto): Promise<LeadActivity> {
    const res = await apiFetch<any>(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<LeadActivity>(res);
  },

  async convertProspectToCustomer(leadId: string, data?: ConvertCustomerDto): Promise<{ message: string; customer: any; lead: Lead }> {
    const res = await apiFetch<any>(`/leads/${leadId}/convert-customer`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return unwrapData<any>(res);
  },
};
