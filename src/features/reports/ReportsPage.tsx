import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { BranchPerformanceChart } from '@/components/charts/BranchPerformanceChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { reportsService } from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  BarChart3,
  TrendingUp,
  Truck,
  Wrench,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } =
    useScope();
  const { activeRole, user } = useAuth();
  const isSuperAdmin = user?.accountType === 'SUPER_ADMIN' || user?.roles.includes('SUPER_ADMIN');

  const canViewSales = isSuperAdmin || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE'].includes(activeRole);
  const canViewCRM = isSuperAdmin || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE'].includes(activeRole);
  const canViewInventory = isSuperAdmin || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER'].includes(activeRole);
  const canViewService = isSuperAdmin || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC'].includes(activeRole);
  const canViewCompliance = isSuperAdmin || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR'].includes(activeRole);
  const canViewFinance = isSuperAdmin || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'ACCOUNTANT'].includes(activeRole);

  const getDefaultCategory = (): 'sales' | 'crm' | 'inventory' | 'service' | 'compliance' | 'finance' => {
    if (activeRole === 'MECHANIC' || activeRole === 'SERVICE_ADVISOR') return 'service';
    if (activeRole === 'INVENTORY_MANAGER') return 'inventory';
    if (activeRole === 'ACCOUNTANT') return 'finance';
    return 'sales';
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    'sales' | 'crm' | 'inventory' | 'service' | 'compliance' | 'finance'
  >(getDefaultCategory);
  const [isExporting, setIsExporting] = useState(false);

  const allCategories = [
    { id: 'sales' as const, label: 'Sales & Bookings', icon: TrendingUp, allowed: canViewSales },
    { id: 'crm' as const, label: 'CRM & Pipeline', icon: Users, allowed: canViewCRM },
    { id: 'inventory' as const, label: 'Inventory Stock', icon: Truck, allowed: canViewInventory },
    { id: 'service' as const, label: 'Workshop & Repairs', icon: Wrench, allowed: canViewService },
    { id: 'compliance' as const, label: 'Compliance & Expiries', icon: ShieldAlert, allowed: canViewCompliance },
    { id: 'finance' as const, label: 'Finance & Payments', icon: DollarSign, allowed: canViewFinance },
  ];

  const categories = allCategories.filter((c) => c.allowed);

  // Queries
  const {
    data: salesReport,
    isLoading: isLoadingSales,
    error: salesError,
  } = useQuery({
    queryKey: ['report-sales', selectedBranchId, selectedFranchiseId, startDate, endDate],
    queryFn: () =>
      reportsService.getSalesReport({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeCategory === 'sales' && canViewSales,
  });

  const {
    data: crmReport,
    isLoading: isLoadingCRM,
    error: crmError,
  } = useQuery({
    queryKey: ['report-crm', selectedBranchId, selectedFranchiseId, startDate, endDate],
    queryFn: () =>
      reportsService.getCRMReport({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeCategory === 'crm' && canViewCRM,
  });

  const {
    data: inventoryReport,
    isLoading: isLoadingInventory,
    error: inventoryError,
  } = useQuery({
    queryKey: ['report-inventory', selectedBranchId, selectedFranchiseId],
    queryFn: () =>
      reportsService.getInventoryReport({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      }),
    enabled: activeCategory === 'inventory' && canViewInventory,
  });

  const {
    data: serviceReport,
    isLoading: isLoadingService,
    error: serviceError,
  } = useQuery({
    queryKey: ['report-service', selectedBranchId, selectedFranchiseId, startDate, endDate],
    queryFn: () =>
      reportsService.getServiceReport({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeCategory === 'service' && canViewService,
  });

  const {
    data: complianceReport,
    isLoading: isLoadingCompliance,
    error: complianceError,
  } = useQuery({
    queryKey: ['report-compliance', selectedBranchId, selectedFranchiseId],
    queryFn: () =>
      reportsService.getComplianceReport({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      }),
    enabled: activeCategory === 'compliance' && canViewCompliance,
  });

  const {
    data: financeReport,
    isLoading: isLoadingFinance,
    error: financeError,
  } = useQuery({
    queryKey: ['report-finance', selectedBranchId, selectedFranchiseId, startDate, endDate],
    queryFn: () =>
      reportsService.getFinanceReport({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeCategory === 'finance' && canViewFinance,
  });

  const isLoading =
    (activeCategory === 'sales' && isLoadingSales) ||
    (activeCategory === 'crm' && isLoadingCRM) ||
    (activeCategory === 'inventory' && isLoadingInventory) ||
    (activeCategory === 'service' && isLoadingService) ||
    (activeCategory === 'compliance' && isLoadingCompliance) ||
    (activeCategory === 'finance' && isLoadingFinance);

  const currentError =
    (activeCategory === 'sales' && salesError) ||
    (activeCategory === 'crm' && crmError) ||
    (activeCategory === 'inventory' && inventoryError) ||
    (activeCategory === 'service' && serviceError) ||
    (activeCategory === 'compliance' && complianceError) ||
    (activeCategory === 'finance' && financeError);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await reportsService.downloadReportCsv(activeCategory, {
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Management Overview & MIS Reports"
        subtitle={`Telemetry filtered for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Reports & MIS' }]}
        actions={
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F5A800]" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Authorized CSV</span>
          </button>
        }
      />

      {/* Scope Cascading Filters */}
      <BranchFilterBar
        showDateRange={activeCategory !== 'inventory' && activeCategory !== 'compliance'}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        onReset={() => {
          setStartDate('');
          setEndDate('');
        }}
      />

      {/* Categories Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Notice */}
      {currentError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Failed to load verified operational report records. Please verify scope permissions.</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-xl space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F5A800] mx-auto" />
          <p className="text-xs font-mono text-zinc-500">Aggregating database telemetry...</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. SALES & BOOKINGS REPORT                                      */}
      {/* ============================================================== */}
      {!isLoading && !currentError && activeCategory === 'sales' && salesReport && (
        <div className="space-y-6">
          {/* Top KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Confirmed Sales Revenue</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">
                ₹{salesReport.totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">From valid booking contracts</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Total Customer Collections</span>
              <p className="text-2xl font-bold font-mono text-emerald-700">
                ₹{salesReport.totalCollectedPayments.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-800 font-mono">Verified payment receipts</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Outstanding Invoices</span>
              <p className="text-2xl font-bold font-mono text-rose-700">
                ₹{salesReport.outstandingInvoicesAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-rose-800 font-mono">Unpaid commercial balances</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Conversion Rate</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">
                {salesReport.conversionRate}%
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {salesReport.totalBookings} bookings / {salesReport.totalLeads} leads
              </p>
            </div>
          </div>

          {/* Monthly Bookings & Deliveries by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Table */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F5A800]" /> Bookings by Month
              </h3>
              {salesReport.bookingsByMonth.length === 0 ? (
                <EmptyState title="No monthly booking data" description="Bookings will appear here." />
              ) : (
                <div className="divide-y divide-zinc-100 text-xs">
                  {salesReport.bookingsByMonth.map((m) => (
                    <div key={m.month} className="py-2.5 flex justify-between items-center">
                      <span className="font-mono font-bold text-zinc-800">{m.month}</span>
                      <div className="text-right font-mono">
                        <span className="font-semibold text-zinc-900 block">{m.count} Bookings</span>
                        <span className="text-zinc-500 text-[11px]">₹{m.revenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales by Vehicle Model */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#F5A800]" /> Vehicle Sales by Model
              </h3>
              {salesReport.salesByModel.length === 0 ? (
                <EmptyState title="No vehicle model data" description="Sales will appear here." />
              ) : (
                <div className="divide-y divide-zinc-100 text-xs">
                  {salesReport.salesByModel.map((mod) => (
                    <div key={mod.model} className="py-2.5 flex justify-between items-center">
                      <span className="font-semibold text-zinc-800">{mod.model}</span>
                      <div className="text-right font-mono">
                        <span className="font-bold text-zinc-900 block">{mod.count} Units</span>
                        <span className="text-zinc-500 text-[11px]">₹{mod.revenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CRM & PIPELINE REPORT                                        */}
      {/* ============================================================== */}
      {!isLoading && !currentError && activeCategory === 'crm' && crmReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Total Pipeline Leads</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">{crmReport.totalLeads}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Total recorded in scope</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Lead-to-Quotation Conversion</span>
              <p className="text-2xl font-bold font-mono text-blue-700">{crmReport.leadToQuoteConversion}%</p>
              <p className="text-[11px] text-blue-800 font-mono">With formal quotation</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Lead-to-Booking Conversion</span>
              <p className="text-2xl font-bold font-mono text-emerald-700">{crmReport.leadToBookingConversion}%</p>
              <p className="text-[11px] text-emerald-800 font-mono">Converted to confirmed sales</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Overdue Follow-ups</span>
              <p className="text-2xl font-bold font-mono text-rose-700">{crmReport.overdueFollowUpsCount}</p>
              <p className="text-[11px] text-rose-800 font-mono">Action required by advisors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Stage */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F5A800]" /> Leads by Pipeline Stage
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {Object.entries(crmReport.leadsByStage).map(([stage, count]) => (
                  <div key={stage} className="p-2.5 rounded-lg bg-zinc-50 flex items-center justify-between border border-zinc-100">
                    <span className="font-semibold text-zinc-800">{stage}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Attribution */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F5A800]" /> Marketing Camps Attribution
              </h3>
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 font-medium">Leads Attributed to Camps:</span>
                  <span className="font-mono font-bold text-purple-900">{crmReport.campaignAttribution.attributedLeads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 font-medium">Quotations from Camp Leads:</span>
                  <span className="font-mono font-bold text-purple-900">{crmReport.campaignAttribution.attributedQuotations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 font-medium">Bookings Converted from Camps:</span>
                  <span className="font-mono font-bold text-emerald-800">{crmReport.campaignAttribution.attributedBookings}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. INVENTORY STOCK REPORT                                       */}
      {/* ============================================================== */}
      {!isLoading && !currentError && activeCategory === 'inventory' && inventoryReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">In-Stock</span>
              <p className="text-xl font-bold font-mono text-emerald-700">{inventoryReport.inStock}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Available for booking</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Reserved</span>
              <p className="text-xl font-bold font-mono text-amber-700">{inventoryReport.reserved}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Pending advance clearance</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Allocated</span>
              <p className="text-xl font-bold font-mono text-blue-700">{inventoryReport.allocated}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Chassis assigned to client</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">PDI Completed</span>
              <p className="text-xl font-bold font-mono text-indigo-700">{inventoryReport.pdiCompleted}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Inspection certified</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Physical Yard Total</span>
              <p className="text-xl font-bold font-mono text-zinc-900">{inventoryReport.totalPhysicalInventory}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Units in dealership lots</p>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#F5A800]" /> Inventory by Commercial Truck Variant
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3">Truck Model / Variant</th>
                    <th className="py-2.5 px-3 text-center">In-Stock Units</th>
                    <th className="py-2.5 px-3 text-center">Total Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {inventoryReport.inventoryByVariant.map((v) => (
                    <tr key={v.variantName} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">{v.variantName}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{v.inStock}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900">{v.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. WORKSHOP & SERVICE OPERATIONS REPORT                        */}
      {/* ============================================================== */}
      {!isLoading && !currentError && activeCategory === 'service' && serviceReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Service Revenue</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">
                ₹{serviceReport.serviceRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">From completed service orders</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Active Repair Jobs</span>
              <p className="text-2xl font-bold font-mono text-amber-700">{serviceReport.openJobs}</p>
              <p className="text-[11px] text-amber-800 font-mono">In diagnosis & bay repair</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Awaiting Spare Parts</span>
              <p className="text-2xl font-bold font-mono text-purple-700">{serviceReport.awaitingPartsJobs}</p>
              <p className="text-[11px] text-purple-800 font-mono">Requisitions pending</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Average Turnaround</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">
                {serviceReport.averageTurnaroundHours} hrs
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">From check-in to sign-off</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jobs by Status */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#F5A800]" /> Job Cards by Status
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {Object.entries(serviceReport.jobsByStatus).map(([status, count]) => (
                  <div key={status} className="p-2.5 rounded-lg bg-zinc-50 flex items-center justify-between border border-zinc-100">
                    <span className="font-semibold text-zinc-800">{status}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Branch Workload */}
            <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5A800]" /> Branch Workshop Workload
              </h3>
              <div className="divide-y divide-zinc-100 text-xs">
                {serviceReport.workloadByBranch.map((w) => (
                  <div key={w.branchName} className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-zinc-800">{w.branchName}</span>
                    <span className="font-mono font-bold text-zinc-900">{w.activeJobs} Active Repair Cards</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. COMPLIANCE & EXPIRIES REPORT                                */}
      {/* ============================================================== */}
      {!isLoading && !currentError && activeCategory === 'compliance' && complianceReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Expired Documents</span>
              <p className="text-2xl font-bold font-mono text-rose-700">{complianceReport.expiredCount}</p>
              <p className="text-[11px] text-rose-800 font-mono">Immediate renewal required</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Expiring Soon (&lt;= 30 Days)</span>
              <p className="text-2xl font-bold font-mono text-amber-700">{complianceReport.expiringSoonCount}</p>
              <p className="text-[11px] text-amber-800 font-mono">Proactive alerts sent</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Valid Documents</span>
              <p className="text-2xl font-bold font-mono text-emerald-700">{complianceReport.validCount}</p>
              <p className="text-[11px] text-emerald-800 font-mono">Fully compliant</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Total Registered</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">{complianceReport.totalDocuments}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Certificates monitored</p>
            </div>
          </div>

          {/* Urgent Documents Table */}
          <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F5A800]" /> Urgent Certificates Requiring Action
            </h3>
            {complianceReport.urgentDocuments.length === 0 ? (
              <EmptyState title="All compliance certificates valid" description="No documents are expired or expiring soon." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Document Type</th>
                      <th className="py-2.5 px-3">Certificate Number</th>
                      <th className="py-2.5 px-3">VIN / Reg</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {complianceReport.urgentDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{doc.documentType}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{doc.documentNumber}</td>
                        <td className="py-2.5 px-3 font-mono">{doc.vin || doc.registrationNumber || 'Fleet Unit'}</td>
                        <td className="py-2.5 px-3">{doc.branchName || 'Yard'}</td>
                        <td className="py-2.5 px-3 font-mono">{new Date(doc.expiryDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${doc.isExpired ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                            {doc.isExpired ? 'EXPIRED' : 'EXPIRING SOON'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. FINANCE & PAYMENTS REPORT                                   */}
      {/* ============================================================== */}
      {!isLoading && !currentError && activeCategory === 'finance' && financeReport && (
        <div className="space-y-6">
          {/* Dealership Revenue vs Collections */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Accounting Rule:</strong> Dealership Invoices and Customer Collections are strictly isolated from third-party financier EMI schedules.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Total Dealership Invoices</span>
              <p className="text-2xl font-bold font-mono text-zinc-900">
                ₹{financeReport.totalInvoiceAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {financeReport.issuedInvoicesCount} invoices issued
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Customer Collections Received</span>
              <p className="text-2xl font-bold font-mono text-emerald-700">
                ₹{financeReport.totalCollectedPayments.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-800 font-mono">Verified bank deposits</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Outstanding Dealership Balances</span>
              <p className="text-2xl font-bold font-mono text-rose-700">
                ₹{financeReport.outstandingBalances.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-rose-800 font-mono">Uncollected from clients</p>
            </div>
          </div>

          {/* Third-Party Financier EMI Section */}
          <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#F5A800]" /> Third-Party Financier EMI Schedules (Monitored)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-xs text-zinc-500">Total EMI Obligations</span>
                <p className="text-lg font-bold font-mono text-zinc-900">
                  ₹{financeReport.emiSummary.totalEmiObligations.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">Total customer installments</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs text-emerald-700">EMI Amount Collected</span>
                <p className="text-lg font-bold font-mono text-emerald-900">
                  ₹{financeReport.emiSummary.totalEmiCollected.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-800 font-mono">Paid installments</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="text-xs text-rose-700">Overdue Installments</span>
                <p className="text-lg font-bold font-mono text-rose-900">
                  {financeReport.emiSummary.overdueEmiCount} Overdue (₹{financeReport.emiSummary.overdueEmiAmount.toLocaleString('en-IN')})
                </p>
                <p className="text-[11px] text-rose-800 font-mono">Follow-up needed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
