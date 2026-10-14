import { Vehicle } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

function normalizeVehicle(v: any): Vehicle {
  const modelName = v.variant?.model?.name || v.model || 'Commercial Vehicle';
  const makeName = v.variant?.model?.manufacturer?.name || v.make || 'Ashok Leyland';
  const variantName = v.variant?.name || v.variantName || v.variant || '';
  const branchName = v.branch?.name || v.branchName || 'Jaipur';

  return {
    id: v.id,
    vin: v.vin,
    chassisNumber: v.vin,
    engineNumber: v.engineNumber,
    registrationNumber: v.registrationNumber,
    make: makeName,
    model: modelName,
    variant: variantName,
    vehicleType: v.variant?.model?.category || v.vehicleType || 'Commercial Truck',
    year: v.manufacturingYear || v.year || 2026,
    manufacturingYear: v.manufacturingYear || v.year || 2026,
    color: v.color || 'White',
    fuelType: v.variant?.fuelType || v.fuelType || 'DIESEL',
    transmission: v.variant?.transmission || v.transmission || 'Manual',
    branchId: v.branchId,
    branchName: branchName,
    branch: v.branch,
    variant_details: v.variant,
    baseCost: v.baseCost,
    purchasePrice: v.baseCost,
    sellingPrice: v.sellingPrice,
    exShowroomPrice: v.sellingPrice,
    status: v.status || 'IN_STOCK',
    images: v.images || [],
    photos: v.photos || v.images || [],
    primaryPhoto: v.images?.[0] || v.photos?.[0],
    createdAt: v.createdAt || new Date().toISOString(),
  };
}

export interface VehicleStockSummary {
  totalVehicles: number;
  inStock: number;
  reserved: number;
  allocated: number;
  service: number;
  delivered: number;
  sold: number;
  blocked: number;
  pdiPending: number;
  pdiCompleted: number;
  totalValue: number;
}

export const vehicleService = {
  async getVehicles(params?: FilterParams & { variantId?: string }): Promise<PaginatedResponse<Vehicle>> {
    const cleanParams: Record<string, string> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.branchId) cleanParams.branchId = params.branchId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.variantId && params.variantId !== 'ALL') cleanParams.variantId = params.variantId;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const response = await apiFetch<any>(`/vehicles${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(response);

    // Backend inventory returns {items, total, limit, offset}
    if (unwrapped && typeof unwrapped === 'object' && 'items' in unwrapped) {
      const items = (unwrapped.items as any[]).map(normalizeVehicle);
      return {
        data: items,
        total: unwrapped.total ?? items.length,
        page: params?.page ?? 1,
        pageSize: unwrapped.limit ?? items.length ?? 50,
        totalPages: Math.ceil((unwrapped.total ?? items.length) / (unwrapped.limit ?? 50)) || 1,
      };
    }

    if (Array.isArray(unwrapped)) {
      const items = unwrapped.map(normalizeVehicle);
      return {
        data: items,
        total: items.length,
        page: 1,
        pageSize: items.length || 50,
        totalPages: 1,
      };
    }

    const rawItems = Array.isArray(unwrapped?.data) ? unwrapped.data : [];
    const items = rawItems.map(normalizeVehicle);
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: unwrapped?.page ?? 1,
      pageSize: unwrapped?.pageSize ?? 50,
      totalPages: unwrapped?.totalPages ?? 1,
    };
  },

  async getStockSummary(branchId?: string): Promise<VehicleStockSummary> {
    const query = branchId && branchId !== 'ALL' ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const res = await apiFetch<any>(`/vehicles/stock-summary${query}`);
    return unwrapData<VehicleStockSummary>(res);
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    const res = await apiFetch<any>(`/vehicles/${id}`);
    const unwrapped = unwrapData<any>(res);
    if (!unwrapped) {
      throw new Error(`Vehicle '${id}' not found`);
    }
    return normalizeVehicle(unwrapped);
  },

  async createVehicle(data: Record<string, any>): Promise<Vehicle> {
    const res = await apiFetch<any>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeVehicle(unwrapData<any>(res));
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const res = await apiFetch<any>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normalizeVehicle(unwrapData<any>(res));
  },

  async updateVehicleStatus(id: string, status: string): Promise<Vehicle> {
    const res = await apiFetch<any>(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normalizeVehicle(unwrapData<any>(res));
  },

  async deleteVehicle(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch<any>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
    return unwrapData<{ success: boolean; message: string }>(res);
  },
};
