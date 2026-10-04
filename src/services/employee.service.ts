import { Employee } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export interface CreateEmployeePayload {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  branchId: string;
  employeeCode: string;
  roleName: string;
  designation?: string;
}

export interface ApprovalRequest {
  id: string;
  requestType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requesterId: string;
  targetId?: string;
  details?: any;
  createdAt: string;
  requester?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export const employeeService = {
  async getEmployees(params?: FilterParams): Promise<PaginatedResponse<Employee>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set('search', params.search);
      if (params?.branchId) queryParams.set('branchId', params.branchId);
      if (params?.franchiseId) queryParams.set('franchiseId', params.franchiseId);

      const response = await apiFetch<any>(`/employees?${queryParams.toString()}`);
      const unwrapped = unwrapData<any>(response);

      if (Array.isArray(unwrapped)) {
        return {
          data: unwrapped as Employee[],
          total: unwrapped.length,
          page: 1,
          pageSize: unwrapped.length || 10,
          totalPages: 1,
        };
      }

      return unwrapped as PaginatedResponse<Employee>;
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const res = await apiFetch<any>(`/employees/${id}`);
      return unwrapData<Employee>(res);
    } catch {
      return null;
    }
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const res = await apiFetch<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<Employee>(res);
  },

  async deactivateEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch<any>(`/employees/${id}/deactivate`, {
      method: 'PATCH',
    });
    return unwrapData<{ success: boolean; message: string }>(res);
  },

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    try {
      const res = await apiFetch<any>('/approvals/pending');
      const unwrapped = unwrapData<any>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
  },

  async processApproval(id: string, action: 'APPROVED' | 'REJECTED' | 'APPROVE' | 'REJECT', comments?: string): Promise<any> {
    const act = action === 'APPROVED' || action === 'APPROVE' ? 'APPROVE' : 'REJECT';
    const res = await apiFetch<any>(`/approvals/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ action: act, rejectionReason: comments }),
    });
    return unwrapData(res);
  },
};
