import { Franchise } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export function normalizeFranchise(f: any): Franchise {
  if (!f) return f;
  const branches = Array.isArray(f.branches) ? f.branches : [];
  return {
    id: f.id,
    name: f.name || '',
    code: f.code || '',
    brand: f.brand || (f.name?.includes('Tata') ? 'Tata Motors' : f.name?.includes('Ashok') ? 'Ashok Leyland' : f.name || 'Commercial'),
    legalName: f.legalName || '',
    taxId: f.taxId || '',
    contactEmail: f.contactEmail || '',
    contactPhone: f.contactPhone || '',
    address: f.address || '',
    ownerName: f.ownerName || '',
    totalBranches: typeof f.totalBranches === 'number' ? f.totalBranches : branches.length,
    status: (f.status || 'ACTIVE').toLowerCase() === 'active' ? 'active' : 'inactive',
    branches,
    createdAt: f.createdAt || new Date().toISOString(),
    updatedAt: f.updatedAt,
  };
}

export const franchiseService = {
  async getFranchises(params?: FilterParams): Promise<PaginatedResponse<Franchise>> {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.search) cleanParams.search = params.search;

      const query = new URLSearchParams(cleanParams).toString();
      const response = await apiFetch<any>(`/franchises${query ? `?${query}` : ''}`);
      const unwrapped = unwrapData<any>(response);

      if (Array.isArray(unwrapped)) {
        const mapped = unwrapped.map(normalizeFranchise);
        return {
          data: mapped,
          total: mapped.length,
          page: 1,
          pageSize: mapped.length || 10,
          totalPages: 1,
        };
      }

      const rawItems = Array.isArray(unwrapped?.data) ? unwrapped.data : [];
      const mapped = rawItems.map(normalizeFranchise);
      return {
        data: mapped,
        total: unwrapped?.total ?? mapped.length,
        page: unwrapped?.page ?? 1,
        pageSize: unwrapped?.pageSize ?? 10,
        totalPages: unwrapped?.totalPages ?? 1,
      };
    } catch {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getAll(): Promise<Franchise[]> {
    const res = await this.getFranchises();
    return res.data || [];
  },

  async getFranchiseById(id: string): Promise<Franchise | null> {
    try {
      const res = await apiFetch<any>(`/franchises/${id}`);
      const unwrapped = unwrapData<any>(res);
      return unwrapped ? normalizeFranchise(unwrapped) : null;
    } catch {
      return null;
    }
  },

  async createFranchise(data: Partial<Franchise>): Promise<Franchise> {
    const payload: Record<string, any> = {
      name: data.name?.trim(),
      code: data.code?.trim().toUpperCase(),
    };
    if (data.legalName?.trim()) payload.legalName = data.legalName.trim();
    if (data.taxId?.trim()) payload.taxId = data.taxId.trim();
    if (data.brand?.trim()) payload.brand = data.brand.trim();
    if (data.contactEmail?.trim()) payload.contactEmail = data.contactEmail.trim();
    if (data.contactPhone?.trim()) payload.contactPhone = data.contactPhone.trim();
    if (data.address?.trim()) payload.address = data.address.trim();
    if (data.ownerName?.trim()) payload.ownerName = data.ownerName.trim();
    if (data.status) payload.status = data.status;

    const res = await apiFetch<any>('/franchises', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeFranchise(unwrapData<any>(res));
  },

  async updateFranchise(id: string, data: Partial<Franchise>): Promise<Franchise> {
    const payload: Record<string, any> = {};
    if (data.name?.trim()) payload.name = data.name.trim();
    if (data.legalName?.trim()) payload.legalName = data.legalName.trim();
    if (data.taxId?.trim()) payload.taxId = data.taxId.trim();
    if (data.brand?.trim()) payload.brand = data.brand.trim();
    if (data.contactEmail?.trim()) payload.contactEmail = data.contactEmail.trim();
    if (data.contactPhone?.trim()) payload.contactPhone = data.contactPhone.trim();
    if (data.address?.trim()) payload.address = data.address.trim();
    if (data.ownerName?.trim()) payload.ownerName = data.ownerName.trim();
    if (data.status) payload.status = data.status;

    const res = await apiFetch<any>(`/franchises/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeFranchise(unwrapData<any>(res));
  },
};
