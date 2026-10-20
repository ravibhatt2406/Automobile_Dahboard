import { apiFetch, unwrapData } from './apiClient';

export interface SuperAdminDashboardData {
  franchiseCount: number;
  branchCount: number;
  employeeCount: number;
  customerCount: number;
  vehicleCount: number;
  inStockVehicleCount: number;
  reservedVehicleCount?: number;
  bookingCount: number;
  serviceJobCount: number;
  activeServiceJobCount: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalCollections?: number;
  campaignsCount?: number;
  activeCampaignsCount?: number;
  inTransitDeliveries?: number;
  completedDeliveries?: number;
  complianceAlerts?: number;
  activeFinanceApps?: number;
  overdueEmis?: number;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    customer?: { name: string; email?: string };
    vehicle?: { vin: string; color?: string };
    branch?: { name: string; code: string };
  }>;
  topBranches: Array<{
    id: string;
    name: string;
    code: string;
    franchise?: { name: string };
    _count?: {
      vehicles: number;
      employees: number;
      bookings: number;
      serviceJobs: number;
    };
  }>;
}

export interface FranchiseDashboardData {
  franchiseId: string;
  franchiseName: string;
  franchiseCode: string;
  branchCount: number;
  employeeCount: number;
  pendingApprovals: number;
  vehicleCount: number;
  inStockVehicles: number;
  reservedVehicles?: number;
  allocatedVehicles?: number;
  bookingsCount: number;
  activeServiceJobsCount: number;
  totalRevenue: number;
  totalCollections?: number;
  totalLeads?: number;
  leadConversionRate?: number;
  complianceAlerts?: number;
  campaignsCount?: number;
  campaignBudget?: number;
  campaignExpenses?: number;
  activeFinanceApps?: number;
  overdueEmis?: number;
  branches: Array<{
    id: string;
    name: string;
    code: string;
    city?: string;
    status: string;
    _count?: {
      employees: number;
      vehicles: number;
      bookings: number;
      serviceJobs: number;
    };
  }>;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    customer?: { name: string; email?: string };
    vehicle?: { vin: string; color?: string };
    branch?: { name: string; code: string };
  }>;
}

export interface BranchDashboardData {
  branchId: string;
  branchName: string;
  branchCode: string;
  city?: string;
  franchise?: { id: string; name: string; code: string };
  inStockVehicles: number;
  reservedVehicles?: number;
  allocatedVehicles?: number;
  deliveredVehicles?: number;
  totalVehicles: number;
  confirmedBookings: number;
  totalBookings: number;
  activeServiceJobs: number;
  awaitingPartsJobs?: number;
  overdueJobs?: number;
  completedServiceJobs: number;
  totalEmployees: number;
  pendingApprovals: number;
  activeQuotations: number;
  activeLeads: number;
  totalRevenue: number;
  totalCollections?: number;
  complianceAlerts?: number;
  activeCampaignsCount?: number;
  campaignLeadsCount?: number;
  inTransitDeliveries?: number;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    customer?: { name: string; phone?: string };
    vehicle?: { vin: string; color?: string };
  }>;
  recentServiceJobs: Array<{
    id: string;
    jobNumber: string;
    status: string;
    complaint: string;
    createdAt: string;
    customer?: { name: string; phone?: string };
    vehicle?: { vin: string; registrationNumber?: string };
  }>;
}

export interface SalesDashboardData {
  openQuotationsCount: number;
  confirmedBookingsCount: number;
  totalBookingsCount: number;
  availableStockCount: number;
  activeLeadsCount: number;
  overdueFollowUpsCount?: number;
  recentQuotations: Array<{
    id: string;
    quotationNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    customer?: { id: string; name: string; phone?: string };
    variant?: { id: string; name: string; basePrice: number | string };
  }>;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    customer?: { id: string; name: string; phone?: string };
    vehicle?: { id: string; vin: string; color?: string };
  }>;
}

export interface ServiceAdvisorDashboardData {
  pendingAppointmentsCount: number;
  activeJobsCount: number;
  completedJobsCount: number;
  pendingQcCount: number;
  recentAppointments: Array<{
    id: string;
    appointmentNumber: string;
    status: string;
    preferredDate: string;
    requestedService: string;
    customer?: { id: string; name: string; phone?: string };
    vehicle?: { id: string; vin: string; registrationNumber?: string };
  }>;
  recentJobs: Array<{
    id: string;
    jobNumber: string;
    status: string;
    complaint: string;
    createdAt: string;
    customer?: { id: string; name: string; phone?: string };
    vehicle?: { id: string; vin: string; registrationNumber?: string };
    assignedMechanic?: { id: string; firstName: string; lastName: string; employeeCode: string };
  }>;
}

export interface MechanicDashboardData {
  totalAssigned: number;
  activeJobsCount: number;
  pendingJobsCount: number;
  completedJobsCount: number;
  partsRequestedCount: number;
  activeJobs: Array<{
    id: string;
    jobNumber: string;
    status: string;
    complaint: string;
    diagnosis?: string;
    estimatedCost?: number | string;
    createdAt: string;
    customer?: { id: string; name: string; phone?: string };
    vehicle?: { id: string; vin: string; registrationNumber?: string; color?: string };
    diagnoses?: Array<{ id: string; findings: string; recommendedWork: string }>;
    jobParts?: Array<{ id: string; part?: { name: string; partNumber: string } }>;
  }>;
  completedJobs: Array<any>;
  pendingJobs: Array<any>;
}

export interface CustomerDashboardData {
  id?: string | null;
  name?: string;
  preferredBranchId?: string | null;
  preferredBranch?: any;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    customerType: string;
    companyName?: string;
    preferredBranch?: {
      id: string;
      code: string;
      name: string;
      city: string;
      state?: string;
      phone?: string;
      email?: string;
      address?: string;
    } | null;
  } | null;
  prospectState: 'NEW_PROSPECT' | 'RETURNING_PROSPECT' | 'CONFIRMED_OWNER';
  vehicles: Array<any>;
  leads: Array<any>;
  bookings: Array<any>;
  quotations: Array<any>;
  serviceAppointments: Array<any>;
  serviceJobs: Array<any>;
  insurancePolicies: Array<any>;
  complianceDocuments: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    expiryDate: string;
    status: string;
    vehicleVin?: string;
    vehicleReg?: string;
    vehicleModel?: string;
  }>;
  invoices: Array<any>;
  payments: Array<{
    id: string;
    paymentNumber: string;
    amount: number;
    status: string;
    paymentMode?: string;
    createdAt: string;
    referenceType: string;
    referenceNumber: string;
    branchName?: string;
  }>;
  conversations: Array<any>;
  summary: {
    vehiclesCount: number;
    activeQuotationsCount: number;
    bookingsCount: number;
    pendingBookingsCount: number;
    serviceDueCount: number;
    totalSpent: number;
  };
}

export const dashboardService = {
  async getSuperAdmin(): Promise<SuperAdminDashboardData> {
    const res = await apiFetch<any>('/dashboards/super-admin');
    return unwrapData<SuperAdminDashboardData>(res);
  },

  async getFranchise(franchiseId?: string): Promise<FranchiseDashboardData> {
    const query = franchiseId && franchiseId !== 'ALL' ? `?franchiseId=${franchiseId}` : '';
    const res = await apiFetch<any>(`/dashboards/franchise${query}`);
    return unwrapData<FranchiseDashboardData>(res);
  },

  async getBranch(branchId?: string): Promise<BranchDashboardData> {
    const query = branchId && branchId !== 'ALL' ? `?branchId=${branchId}` : '';
    const res = await apiFetch<any>(`/dashboards/branch${query}`);
    return unwrapData<BranchDashboardData>(res);
  },

  async getSales(): Promise<SalesDashboardData> {
    const res = await apiFetch<any>('/dashboards/sales');
    return unwrapData<SalesDashboardData>(res);
  },

  async getServiceAdvisor(): Promise<ServiceAdvisorDashboardData> {
    const res = await apiFetch<any>('/dashboards/service-advisor');
    return unwrapData<ServiceAdvisorDashboardData>(res);
  },

  async getMechanic(): Promise<MechanicDashboardData> {
    const res = await apiFetch<any>('/dashboards/mechanic');
    return unwrapData<MechanicDashboardData>(res);
  },

  async getCustomer(): Promise<CustomerDashboardData> {
    const res = await apiFetch<any>('/dashboards/customer');
    return unwrapData<CustomerDashboardData>(res);
  },
};
