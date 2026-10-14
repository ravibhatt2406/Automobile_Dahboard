import { ServiceJob, ServiceAppointment } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export function normalizeServiceJob(j: any): ServiceJob & Record<string, any> {
  const customerName = j.customer
    ? j.customer.companyName || `${j.customer.firstName || ''} ${j.customer.lastName || ''}`.trim()
    : j.customerName || 'Fleet Customer';

  const vehicleModel = j.vehicle?.variant?.model?.name
    ? `${j.vehicle?.variant?.model?.manufacturer?.name || ''} ${j.vehicle?.variant?.model?.name}`.trim()
    : j.vehicleModel || 'Commercial Vehicle';

  const mechanicName = j.assignedMechanic?.user
    ? `${j.assignedMechanic.user.firstName || ''} ${j.assignedMechanic.user.lastName || ''}`.trim()
    : j.assignedMechanic?.firstName
      ? `${j.assignedMechanic.firstName} ${j.assignedMechanic.lastName || ''}`.trim()
      : j.mechanicName || 'Unassigned';

  return {
    ...j,
    id: j.id,
    jobNumber: j.jobNumber || j.jobCardNumber,
    jobCardNumber: j.jobNumber || j.jobCardNumber || `JOB-${j.id?.slice(0, 8)}`,
    vehicleId: j.vehicleId,
    vehicleVin: j.vehicle?.vin || j.vehicleVin || '—',
    vehicleModel,
    vehicle: j.vehicle,
    customerId: j.customerId,
    customerName,
    customer: j.customer,
    branchId: j.branchId,
    branchName: j.branch?.name || j.branchName || 'Jaipur Central',
    branch: j.branch,
    mechanicId: j.assignedMechanicId || j.mechanicId,
    mechanicName,
    assignedMechanic: j.assignedMechanic,
    serviceAdvisorId: j.serviceAdvisorId,
    serviceAdvisor: j.serviceAdvisor,
    complaint: j.complaint || 'General Service & Inspection',
    diagnosis: j.diagnoses?.[0]?.findings || j.diagnosis || '',
    stage: j.stage || j.status,
    serviceType: j.serviceType || 'repair',
    status: j.status,
    estimatedCost: Number(j.estimatedCost || 0),
    actualCompletionTime: j.actualCompletionTime,
    scheduledDate: j.scheduledDate || j.createdAt || new Date().toISOString(),
    createdAt: j.createdAt || new Date().toISOString(),
    diagnoses: j.diagnoses || [],
    labourItems: j.labourItems || [],
    jobParts: j.jobParts || [],
    qcInspections: j.qcInspections || [],
    serviceInvoice: j.serviceInvoice,
  };
}

export const serviceManagementService = {
  async getServiceJobs(
    params?: FilterParams & { status?: string; branchId?: string; customerId?: string },
  ): Promise<PaginatedResponse<ServiceJob & Record<string, any>>> {
    const cleanParams: Record<string, string> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.customerId) cleanParams.customerId = params.customerId;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/service-jobs${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);

    if (unwrapped && typeof unwrapped === 'object' && 'items' in unwrapped) {
      const items = (unwrapped.items as any[]).map(normalizeServiceJob);
      return {
        data: items,
        total: unwrapped.total ?? items.length,
        page: params?.page ?? 1,
        pageSize: unwrapped.limit ?? items.length ?? 50,
        totalPages: Math.ceil((unwrapped.total ?? items.length) / (unwrapped.limit ?? 50)) || 1,
      };
    }

    if (Array.isArray(unwrapped)) {
      const items = unwrapped.map(normalizeServiceJob);
      return {
        data: items,
        total: items.length,
        page: 1,
        pageSize: items.length || 50,
        totalPages: 1,
      };
    }

    const rawItems = Array.isArray(unwrapped?.data) ? unwrapped.data : [];
    const items = rawItems.map(normalizeServiceJob);
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: unwrapped?.page ?? 1,
      pageSize: unwrapped?.pageSize ?? 50,
      totalPages: unwrapped?.totalPages ?? 1,
    };
  },

  async getAppointments(params?: FilterParams): Promise<PaginatedResponse<ServiceAppointment>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await apiFetch<any>(`/service/appointments${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    const rawItems = Array.isArray(unwrapped) ? unwrapped : Array.isArray(unwrapped?.items) ? unwrapped.items : unwrapped?.data || [];
    return {
      data: rawItems,
      total: unwrapped?.total ?? rawItems.length,
      page: 1,
      pageSize: rawItems.length || 50,
      totalPages: 1,
    };
  },

  async getServiceJobById(id: string): Promise<ServiceJob & Record<string, any>> {
    const res = await apiFetch<any>(`/service-jobs/${id}`);
    const unwrapped = unwrapData<any>(res);
    if (!unwrapped) {
      throw new Error(`Service Job '${id}' not found`);
    }
    return normalizeServiceJob(unwrapped);
  },

  async createServiceJob(data: {
    customerId: string;
    vehicleId: string;
    branchId: string;
    serviceAdvisorId: string;
    complaint: string;
    odometer?: number;
    fuelLevel?: string;
    estimatedCost?: number;
    notes?: string;
    appointmentId?: string;
  }): Promise<ServiceJob & Record<string, any>> {
    const res = await apiFetch<any>('/service-jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeServiceJob(unwrapData<any>(res));
  },

  async assignMechanic(jobId: string, mechanicId: string): Promise<any> {
    const res = await apiFetch<any>(`/service-jobs/${jobId}/assign-mechanic`, {
      method: 'PATCH',
      body: JSON.stringify({ mechanicId }),
    });
    return unwrapData<any>(res);
  },

  async updateStatus(jobId: string, status: string, notes?: string): Promise<any> {
    const res = await apiFetch<any>(`/service-jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return unwrapData<any>(res);
  },

  async addDiagnosis(jobId: string, data: {
    findings: string;
    recommendedWork?: string;
    severity?: string;
    additionalCost?: number;
    notes?: string;
  }): Promise<any> {
    const res = await apiFetch<any>(`/service-jobs/${jobId}/diagnosis`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<any>(res);
  },

  async addLabour(jobId: string, data: {
    labourType: string;
    description: string;
    hours: number;
    hourlyRate: number;
    discount?: number;
    taxRate?: number;
  }): Promise<any> {
    const res = await apiFetch<any>(`/service-jobs/${jobId}/labour`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<any>(res);
  },

  async issuePartToJob(data: {
    serviceJobId: string;
    partId: string;
    quantity: number;
    unitPrice?: number;
  }): Promise<any> {
    const res = await apiFetch<any>('/parts/issue-to-job', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<any>(res);
  },

  async addQcInspection(jobId: string, data: {
    checklist?: Record<string, any>;
    status: 'PASSED' | 'FAILED';
    remarks?: string;
  }): Promise<any> {
    const res = await apiFetch<any>(`/service-jobs/${jobId}/qc`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<any>(res);
  },

  async respondApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', customerNotes?: string): Promise<any> {
    const res = await apiFetch<any>(`/service-approvals/${approvalId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, customerNotes }),
    });
    return unwrapData<any>(res);
  },

  async getEmployees(params?: { branchId?: string; role?: string }): Promise<any[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await apiFetch<any>(`/employees${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    return Array.isArray(unwrapped) ? unwrapped : unwrapped?.items || unwrapped?.data || [];
  },

  async getCustomers(): Promise<any[]> {
    const res = await apiFetch<any>('/customers');
    const unwrapped = unwrapData<any>(res);
    return Array.isArray(unwrapped) ? unwrapped : unwrapped?.items || unwrapped?.data || [];
  },
};

export const serviceService = serviceManagementService;
