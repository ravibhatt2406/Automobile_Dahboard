import { apiFetch } from './apiClient';

export interface ReportMetrics {
  totalRevenue: number | null;
  vehiclesSold: number | null;
  activeCustomers: number | null;
  inventoryCount: number | null;
  activeServiceJobs: number | null;
  monthlyRevenueSeries: { month: string; value: number }[];
  branchPerformanceSeries: { branch: string; sales: number }[];
}

export const reportsService = {
  async getDashboardMetrics(): Promise<ReportMetrics> {
    try {
      return await apiFetch<ReportMetrics>('/reports/dashboard-metrics');
    } catch {
      // Returns empty/null metrics when backend is not connected
      return {
        totalRevenue: null,
        vehiclesSold: null,
        activeCustomers: null,
        inventoryCount: null,
        activeServiceJobs: null,
        monthlyRevenueSeries: [],
        branchPerformanceSeries: [],
      };
    }
  },
};
