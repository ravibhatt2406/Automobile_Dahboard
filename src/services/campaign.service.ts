import { apiFetch, unwrapData } from './apiClient';

export interface CampaignMember {
  id: string;
  campaignId: string;
  employeeId: string;
  roleInCamp?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string;
  };
}

export interface CampaignExpense {
  id: string;
  campaignId: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  coordinatorId?: string;
  franchiseId: string;
  branchId: string;
  budget: number;
  actualExpenses: number;
  budgetVariance: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  leadsCount?: number;
  branch?: { id: string; name: string };
  coordinator?: { id: string; firstName: string; lastName: string };
  teamMembers?: CampaignMember[];
  expenses?: CampaignExpense[];
  leads?: any[];
  metrics?: {
    leadsCount: number;
    quotationsCount: number;
    bookingsCount: number;
    totalExpenses: number;
    budget: number;
  };
}

export const campaignService = {
  async getCampaigns(params?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    branchId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Campaign[]; total: number }> {
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
      const res = await apiFetch<any>(`/campaigns?${query}`);
      const raw = unwrapData<any>(res);
      const items = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      const total = raw?.total ?? items.length;
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async getCampaign(id: string): Promise<Campaign | null> {
    try {
      const res = await apiFetch<any>(`/campaigns/${id}`);
      return unwrapData<Campaign>(res);
    } catch {
      return null;
    }
  },

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    const res = await apiFetch<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Campaign>(res);
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const res = await apiFetch<any>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<Campaign>(res);
  },

  async recordExpense(
    campaignId: string,
    expense: {
      title: string;
      category?: string;
      amount: number;
      expenseDate?: string;
      receiptUrl?: string;
      notes?: string;
    },
  ): Promise<CampaignExpense> {
    const res = await apiFetch<any>(`/campaigns/${campaignId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    return unwrapData<CampaignExpense>(res);
  },

  async addMember(
    campaignId: string,
    member: { employeeId: string; roleInCamp?: string },
  ): Promise<CampaignMember> {
    const res = await apiFetch<any>(`/campaigns/${campaignId}/members`, {
      method: 'POST',
      body: JSON.stringify(member),
    });
    return unwrapData<CampaignMember>(res);
  },

  async removeMember(campaignId: string, employeeId: string): Promise<{ success: boolean }> {
    const res = await apiFetch<any>(`/campaigns/${campaignId}/members/${employeeId}`, {
      method: 'DELETE',
    });
    return unwrapData<{ success: boolean }>(res);
  },
};
