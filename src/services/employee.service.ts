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
  requestType?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeId?: string;
  requestedByUserId?: string;
  assignedRoleId?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string;
    user?: { id: string; email: string; phone?: string };
    branch?: { name: string; franchise?: { name: string } };
  };
  requestedByUser?: { id: string; email: string };
  approvedByUser?: { id: string; email: string };
  assignedRole?: { id: string; name: string };
  requester?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  details?: any;
}

function normalizeEmployee(e: any): Employee {
  const roles = Array.isArray(e.roles)
    ? e.roles
    : (e.roleAssignments?.map((ra: any) => ra.role?.name).filter(Boolean) || []);

  return {
    id: e.id,
    employeeCode: e.employeeCode || '',
    firstName: e.firstName || '',
    lastName: e.lastName || '',
    email: e.email || e.user?.email || '',
    phone: e.phone || e.user?.phone || '',
    roles: roles.length > 0 ? roles : ['EMPLOYEE'],
    franchiseId: e.franchiseId || e.branch?.franchiseId,
    franchiseName: e.franchiseName || e.branch?.franchise?.name || 'Ashok Leyland Commercial',
    branchId: e.branchId,
    branchName: e.branchName || e.branch?.name || 'Jaipur',
    department: e.department || e.designation || 'Operations',
    designation: e.designation || 'Operational Staff',
    status: (e.status || 'ACTIVE').toLowerCase() as any,
    joinedAt: e.hiredAt || e.createdAt || new Date().toISOString(),
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
        const mapped = unwrapped.map(normalizeEmployee);
        return {
          data: mapped,
          total: mapped.length,
          page: 1,
          pageSize: mapped.length || 10,
          totalPages: 1,
        };
      }

      const items = Array.isArray(unwrapped?.data) ? unwrapped.data.map(normalizeEmployee) : [];
      return {
        data: items,
        total: unwrapped?.total ?? items.length,
        page: unwrapped?.page ?? 1,
        pageSize: unwrapped?.pageSize ?? 10,
        totalPages: unwrapped?.totalPages ?? 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const res = await apiFetch<any>(`/employees/${id}`);
      const unwrapped = unwrapData<any>(res);
      return unwrapped ? normalizeEmployee(unwrapped) : null;
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

  async updateEmployee(id: string, payload: Partial<CreateEmployeePayload>): Promise<Employee> {
    const res = await apiFetch<any>(`/employees/${id}`, {
      method: 'PATCH',
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

  async getAllApprovals(params?: { branchId?: string; franchiseId?: string }): Promise<ApprovalRequest[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.branchId) queryParams.set('branchId', params.branchId);
      if (params?.franchiseId) queryParams.set('franchiseId', params.franchiseId);

      const res = await apiFetch<any>(`/approvals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      const unwrapped = unwrapData<any>(res);
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
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
