import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { BranchPerformanceChart } from '@/components/charts/BranchPerformanceChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';
import { useScope } from '@/app/providers/ScopeContext';
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
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    'sales' | 'inventory' | 'service' | 'finance'
  >('sales');

  const categories = [
    { id: 'sales' as const, label: 'Sales & Bookings', icon: TrendingUp },
    { id: 'inventory' as const, label: 'Inventory Stock', icon: Truck },
    { id: 'service' as const, label: 'Service Efficiency', icon: Wrench },
    { id: 'finance' as const, label: 'Finance & Payments', icon: DollarSign },
  ];

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
    enabled: activeCategory === 'sales',
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
    enabled: activeCategory === 'inventory',
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
    enabled: activeCategory === 'service',
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
    enabled: activeCategory === 'finance',
  });

  const isLoading =
    (activeCategory === 'sales' && isLoadingSales) ||
    (activeCategory === 'inventory' && isLoadingInventory) ||
    (activeCategory === 'service' && isLoadingService) ||
    (activeCategory === 'finance' && isLoadingFinance);

  const currentError =
    (activeCategory === 'sales' && salesError) ||
    (activeCategory === 'inventory' && inventoryError) ||
    (activeCategory === 'service' && serviceError) ||
    (activeCategory === 'finance' && financeError);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Executive Reports"
        subtitle={`Branch-level aggregation for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Reports' }]}
        actions={
          <button
            onClick={() => {
              window.print();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" /> Export Report View
          </button>
        }
      />

      {/* Scope Cascading Filters */}
      <BranchFilterBar
        showDateRange={activeCategory !== 'inventory'}
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
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {currentError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Failed to load report data: {(currentError as any)?.message || 'Server error'}</span>
        </div>
      )}

      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#F5A800]" />
          <span className="text-xs">Aggregating branch metrics from database...</span>
        </div>
      )}

      {/* SALES REPORT VIEW */}
      {!isLoading && activeCategory === 'sales' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Total Leads
              </span>
              <span className="text-2xl font-bold font-mono text-zinc-900 block">
                {salesReport.totalLeads}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" /> Quotations Issued
              </span>
              <span className="text-2xl font-bold font-mono text-amber-600 block">
                {salesReport.totalQuotations}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Confirmed Bookings
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 block">
                {salesReport.totalBookings}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Conversion Rate
              </span>
              <span className="text-2xl font-bold font-mono text-indigo-600 block">
                {salesReport.conversionRate}%
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Revenue Volume
              </span>
              <span className="text-xl font-bold font-mono text-zinc-900 block truncate">
                ₹{salesReport.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesAnalyticsChart
              title="Sales & Revenue Performance"
              data={[
                { month: 'Leads', value: salesReport.totalLeads },
                { month: 'Quotations', value: salesReport.totalQuotations },
                { month: 'Bookings', value: salesReport.totalBookings },
              ]}
            />
            <BranchPerformanceChart
              data={[{ branch: activeBranchName, sales: salesReport.totalBookings }]}
            />
          </div>
        </div>
      )}

      {/* INVENTORY REPORT VIEW */}
      {!isLoading && activeCategory === 'inventory' && inventoryReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> In Stock (Available)
              </span>
              <span className="text-2xl font-bold font-mono text-blue-600 block">
                {inventoryReport.inStock}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Reserved
              </span>
              <span className="text-2xl font-bold font-mono text-amber-600 block">
                {inventoryReport.reserved}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Allocated
              </span>
              <span className="text-2xl font-bold font-mono text-indigo-600 block">
                {inventoryReport.allocated}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> PDI Completed
              </span>
              <span className="text-2xl font-bold font-mono text-teal-600 block">
                {inventoryReport.pdiCompleted}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Delivered
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 block">
                {inventoryReport.delivered}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-zinc-700" /> Total Physical Units
              </span>
              <span className="text-2xl font-bold font-mono text-zinc-900 block">
                {inventoryReport.totalPhysicalInventory}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE REPORT VIEW */}
      {!isLoading && activeCategory === 'service' && serviceReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Appointments
              </span>
              <span className="text-2xl font-bold font-mono text-zinc-900 block">
                {serviceReport.appointments}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-500" /> Active Open Jobs
              </span>
              <span className="text-2xl font-bold font-mono text-amber-600 block">
                {serviceReport.openJobs}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Overhauls
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 block">
                {serviceReport.completedJobs}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Workshop Revenue
              </span>
              <span className="text-xl font-bold font-mono text-zinc-900 block truncate">
                ₹{serviceReport.serviceRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FINANCE REPORT VIEW */}
      {!isLoading && activeCategory === 'finance' && financeReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Invoices Issued
              </span>
              <span className="text-2xl font-bold font-mono text-zinc-900 block">
                {financeReport.issuedInvoices}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Paid Invoices
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 block">
                {financeReport.paidInvoices}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
              <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Total Collected Payments
              </span>
              <span className="text-xl font-bold font-mono text-zinc-900 block truncate">
                ₹{financeReport.totalCollectedPayments.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
