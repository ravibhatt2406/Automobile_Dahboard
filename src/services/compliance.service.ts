import { apiFetch, unwrapData } from './apiClient';

export type ComplianceDocType =
  | 'INSURANCE'
  | 'PUC'
  | 'FITNESS_CERTIFICATE'
  | 'ROAD_PERMIT'
  | 'REGISTRATION_RC'
  | 'ROAD_TAX'
  | 'OTHER';

export type ComplianceDocStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'REJECTED';

export interface VehicleComplianceDoc {
  id: string;
  vehicleId: string;
  documentType: ComplianceDocType;
  documentNumber: string;
  issuingAuthority?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  attachmentUrl?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
  status: ComplianceDocStatus;
  computedStatus: ComplianceDocStatus;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    vin: string;
    registrationNumber?: string | null;
    status: string;
    branch?: { id: string; name: string };
    customer?: { id: string; firstName?: string; lastName?: string; companyName?: string };
    variant?: { name: string; model?: { name: string; manufacturer?: { name: string } } };
  };
}

export interface ComplianceSummary {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  rejected: number;
  byType: Record<string, number>;
}

export interface ComplianceFilterParams {
  vehicleId?: string;
  documentType?: ComplianceDocType | string;
  status?: ComplianceDocStatus | string;
  search?: string;
  branchId?: string;
  franchiseId?: string;
  expiryBefore?: string;
  expiryAfter?: string;
  limit?: number;
  offset?: number;
}

export const complianceService = {
  async getComplianceDocuments(params?: ComplianceFilterParams): Promise<{ items: VehicleComplianceDoc[]; total: number }> {
    const cleanParams: Record<string, string> = {};
    if (params?.vehicleId) cleanParams.vehicleId = params.vehicleId;
    if (params?.documentType && params.documentType !== 'ALL') cleanParams.documentType = params.documentType;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.expiryBefore) cleanParams.expiryBefore = params.expiryBefore;
    if (params?.expiryAfter) cleanParams.expiryAfter = params.expiryAfter;
    if (params?.limit) cleanParams.limit = String(params.limit);
    if (params?.offset) cleanParams.offset = String(params.offset);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/compliance${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);

    if (unwrapped && typeof unwrapped === 'object' && 'items' in unwrapped) {
      return {
        items: unwrapped.items || [],
        total: unwrapped.total ?? (unwrapped.items || []).length,
      };
    }

    if (Array.isArray(unwrapped)) {
      return { items: unwrapped, total: unwrapped.length };
    }

    return { items: [], total: 0 };
  },

  async getSummary(branchId?: string, franchiseId?: string): Promise<ComplianceSummary> {
    const cleanParams: Record<string, string> = {};
    if (branchId && branchId !== 'ALL') cleanParams.branchId = branchId;
    if (franchiseId && franchiseId !== 'ALL') cleanParams.franchiseId = franchiseId;

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/compliance/summary${query ? `?${query}` : ''}`);
    const data = unwrapData<ComplianceSummary>(res);

    return (
      data || {
        total: 0,
        valid: 0,
        expiringSoon: 0,
        expired: 0,
        rejected: 0,
        byType: {},
      }
    );
  },

  async getComplianceDocById(id: string): Promise<VehicleComplianceDoc> {
    const res = await apiFetch<any>(`/compliance/${id}`);
    return unwrapData<VehicleComplianceDoc>(res);
  },

  async createComplianceDoc(data: {
    vehicleId: string;
    documentType: ComplianceDocType;
    documentNumber: string;
    issuingAuthority?: string;
    issueDate?: string;
    expiryDate?: string;
    attachmentUrl?: string;
    notes?: string;
  }): Promise<VehicleComplianceDoc> {
    const res = await apiFetch<any>('/compliance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<VehicleComplianceDoc>(res);
  },

  async updateComplianceDoc(
    id: string,
    data: Partial<{
      documentType: ComplianceDocType;
      documentNumber: string;
      issuingAuthority?: string;
      issueDate?: string;
      expiryDate?: string;
      attachmentUrl?: string;
      notes?: string;
      status?: ComplianceDocStatus;
    }>,
  ): Promise<VehicleComplianceDoc> {
    const res = await apiFetch<any>(`/compliance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<VehicleComplianceDoc>(res);
  },

  async deleteComplianceDoc(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch<any>(`/compliance/${id}`, {
      method: 'DELETE',
    });
    return unwrapData<{ success: boolean; message: string }>(res);
  },
};
