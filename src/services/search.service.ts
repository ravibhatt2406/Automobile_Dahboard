import { apiFetch, unwrapData } from './apiClient';

export interface SearchResultItem {
  id: string;
  type: 'CUSTOMER' | 'VEHICLE' | 'BOOKING' | 'QUOTATION' | 'INVOICE' | 'SERVICE_JOB';
  title: string;
  subtitle: string;
  branchName?: string;
  url: string;
}

export const searchService = {
  async globalSearch(
    query: string,
    branchId?: string,
    franchiseId?: string,
  ): Promise<SearchResultItem[]> {
    if (!query || query.trim().length < 2) return [];

    const params: Record<string, string> = { q: query.trim() };
    if (branchId && branchId !== 'ALL') params.branchId = branchId;
    if (franchiseId && franchiseId !== 'ALL') params.franchiseId = franchiseId;

    const queryString = new URLSearchParams(params).toString();
    const res = await apiFetch<any>(`/search/global?${queryString}`);
    return unwrapData<SearchResultItem[]>(res) || [];
  },
};
