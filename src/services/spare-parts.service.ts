import { SparePart } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export function normalizeSparePart(p: any): SparePart & Record<string, any> {
  const totalStock = Array.isArray(p.stocks)
    ? p.stocks.reduce((acc: number, s: any) => acc + Number(s.quantityOnHand || 0), 0)
    : Number(p.quantityOnHand || p.stockQuantity || 0);

  return {
    ...p,
    id: p.id,
    partNumber: p.partNumber,
    name: p.name,
    description: p.description || '',
    category: p.category || 'General Spares',
    brand: p.manufacturer || p.brand || 'Titan Genuine Parts',
    manufacturer: p.manufacturer || p.brand || 'Titan Genuine Parts',
    unitPrice: Number(p.unitPrice || 0),
    gstRate: Number(p.gstRate ?? 18),
    stockQuantity: totalStock,
    quantityOnHand: totalStock,
    reorderLevel: p.reorderLevel || 5,
    compatibleModels: p.compatibleModels || ['Ashok Leyland 28T', 'Ashok Leyland 35T'],
    stocks: p.stocks || [],
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

export const sparePartsService = {
  async getSpareParts(
    params?: FilterParams & { category?: string; branchId?: string },
  ): Promise<PaginatedResponse<SparePart & Record<string, any>>> {
    const cleanParams: Record<string, string> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.category && params.category !== 'ALL') cleanParams.category = params.category;
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/parts${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);

    if (unwrapped && typeof unwrapped === 'object' && 'items' in unwrapped) {
      const items = (unwrapped.items as any[]).map(normalizeSparePart);
      return {
        data: items,
        total: unwrapped.total ?? items.length,
        page: params?.page ?? 1,
        pageSize: unwrapped.limit ?? items.length ?? 50,
        totalPages: Math.ceil((unwrapped.total ?? items.length) / (unwrapped.limit ?? 50)) || 1,
      };
    }

    if (Array.isArray(unwrapped)) {
      const items = unwrapped.map(normalizeSparePart);
      return {
        data: items,
        total: items.length,
        page: 1,
        pageSize: items.length || 50,
        totalPages: 1,
      };
    }

    const rawItems = Array.isArray(unwrapped?.data) ? unwrapped.data : [];
    const items = rawItems.map(normalizeSparePart);
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: unwrapped?.page ?? 1,
      pageSize: unwrapped?.pageSize ?? 50,
      totalPages: unwrapped?.totalPages ?? 1,
    };
  },

  async getPartById(id: string): Promise<SparePart & Record<string, any>> {
    const res = await apiFetch<any>(`/parts/${id}`);
    const unwrapped = unwrapData<any>(res);
    if (!unwrapped) {
      throw new Error(`Spare Part '${id}' not found`);
    }
    return normalizeSparePart(unwrapped);
  },

  async createPart(data: {
    partNumber: string;
    name: string;
    description?: string;
    manufacturer?: string;
    category?: string;
    unitPrice: number;
    gstRate?: number;
  }): Promise<SparePart & Record<string, any>> {
    const res = await apiFetch<any>('/parts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeSparePart(unwrapData<any>(res));
  },

  async updatePart(
    id: string,
    data: {
      name?: string;
      description?: string;
      manufacturer?: string;
      category?: string;
      unitPrice?: number;
      gstRate?: number;
    },
  ): Promise<SparePart & Record<string, any>> {
    const res = await apiFetch<any>(`/parts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normalizeSparePart(unwrapData<any>(res));
  },

  async updateStock(data: {
    partId: string;
    branchId: string;
    movementType: 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'ISSUE';
    quantity: number;
    notes?: string;
  }): Promise<any> {
    const res = await apiFetch<any>('/parts/stock-movement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<any>(res);
  },

  async getStockByBranch(branchId: string): Promise<any[]> {
    const res = await apiFetch<any>(`/parts/stock/branch/${branchId}`);
    const unwrapped = unwrapData<any>(res);
    return Array.isArray(unwrapped) ? unwrapped : unwrapped?.items || unwrapped?.data || [];
  },
};
