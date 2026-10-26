import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import {
  ShoppingBag,
  FileText,
  CheckCircle2,
  DollarSign,
  Calendar,
  Truck,
  Building,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { reportsService, SalesOverviewReport } from '@/services/reports.service';
import { useScope } from '@/app/providers/ScopeContext';
import { useNavigate } from 'react-router-dom';

const DONUT_COLORS = [
  '#F5A800', // Amber Primary
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#64748B', // Slate
];

export const SalesOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedBranchId,
    selectedFranchiseId,
    activeBranchName,
    activeFranchiseName,
    setSelectedBranchId,
    branches,
  } = useScope();

  // Filters
  const [dateRangePreset, setDateRangePreset] = useState<'30d' | '90d' | 'ytd' | 'all'>('ytd');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  // Compute dates based on preset with stable memoization
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRangePreset === '30d') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      return { startDate: d.toISOString(), endDate: undefined };
    }
    if (dateRangePreset === '90d') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
      return { startDate: d.toISOString(), endDate: undefined };
    }
    if (dateRangePreset === 'ytd') {
      // Indian Financial Year: Apr 1
      const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const d = new Date(currentYear, 3, 1, 0, 0, 0, 0);
      return { startDate: d.toISOString(), endDate: undefined };
    }
    // all time
    return { startDate: undefined, endDate: undefined };
  }, [dateRangePreset]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['sales-overview-report', selectedBranchId, selectedFranchiseId, dateRangePreset, groupBy],
    queryFn: () =>
      reportsService.getSalesOverview({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        startDate,
        endDate,
        groupBy,
      }),
  });

  const formatCurrency = (val: number = 0) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const summary = data?.summary || {
    grossSales: 0,
    netSales: 0,
    discountsTotal: 0,
    paymentsReceived: 0,
    outstandingReceivables: 0,
    vehiclesSold: 0,
    confirmedBookingsCount: 0,
  };

  const hasTrendData = Boolean(data?.salesTrend && data.salesTrend.length > 0);
  const hasBranchComparison = Boolean(data?.branchComparison && data.branchComparison.length > 0);
  const hasPaymentsData = Boolean(data?.salesVsPayments && data.salesVsPayments.length > 0);
  const hasDistributionData = Boolean(data?.salesDistribution && data.salesDistribution.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial Sales & Branch Analytics"
        subtitle={`Branch-wise revenue, qualifying invoiced sales, verified collections, and commercial fleet delivery performance for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Sales' }, { label: 'Overview & Analytics' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-2xs"
              title="Refresh Sales Data"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#F5A800]' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/sales/quotations')}
              className="px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-xl font-bold text-xs shadow-2xs transition-all active:scale-95"
            >
              View Quotations
            </button>
            <button
              onClick={() => navigate('/sales/bookings')}
              className="px-3.5 py-2 bg-[#F5A800] hover:bg-[#d99500] text-zinc-900 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              Manage Bookings
            </button>
          </div>
        }
      />

      {/* Scope & Analytics Filter Toolbar */}
      <div className="cockpit-card rounded-xl border border-zinc-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Scope:</span>
          </div>

          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs">
            <button
              onClick={() => setDateRangePreset('30d')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRangePreset === '30d' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRangePreset('90d')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRangePreset === '90d' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => setDateRangePreset('ytd')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRangePreset === 'ytd' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Fiscal Year (YTD)
            </button>
            <button
              onClick={() => setDateRangePreset('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRangePreset === 'all' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All Time
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs">
            <button
              onClick={() => setGroupBy('day')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                groupBy === 'day' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setGroupBy('week')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                groupBy === 'week' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGroupBy('month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                groupBy === 'month' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {selectedBranchId !== 'ALL'
              ? `Filtered to: ${activeBranchName}`
              : `Aggregate Scope: All ${data?.totalBranchesInScope ?? (branches?.length || 2)} Dealership Branches`}
          </span>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Failed to load branch sales analytics"
          message={(error as any)?.message || 'An unexpected error occurred while communicating with backend reporting services.'}
          onRetry={refetch}
        />
      ) : (
        <>
          {/* 5 Distinct Reconciled Sales KPI Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                title="Gross Sales Volume"
                value={formatCurrency(summary.grossSales)}
                icon={DollarSign}
                subtitle="Before discounts & deductions"
              />
              <KpiCard
                title="Net Invoiced Sales"
                value={formatCurrency(summary.netSales)}
                icon={ShoppingBag}
                subtitle="Qualifying sales after discount"
              />
              <KpiCard
                title="Verified Collections"
                value={formatCurrency(summary.paymentsReceived)}
                icon={CheckCircle2}
                subtitle="Cash & bank payments received"
              />
              <KpiCard
                title="Outstanding Receivables"
                value={formatCurrency(summary.outstandingReceivables)}
                icon={FileText}
                subtitle="Valid invoice balances pending"
              />
              <KpiCard
                title="Vehicles Delivered"
                value={summary.vehiclesSold}
                icon={Truck}
                subtitle={`${summary.confirmedBookingsCount} confirmed bookings`}
              />
            </div>
          )}

          {/* CHARTS ROW 1: Trend & Branch Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Sales Trend */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#F5A800]" />
                    Sales Revenue Trend
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Gross sales volume vs net revenue across {groupBy} periods
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {isLoading ? '...' : `${data?.salesTrend?.length || 0} intervals`}
                </span>
              </div>

              <div className="w-full h-72">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading trend...</div>
                ) : hasTrendData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="amberSalesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F5A800" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#F5A800" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="blueGrossGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EF" vertical={false} />
                      <XAxis dataKey="period" stroke="#71717A" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#71717A"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E5E5',
                          borderRadius: '0.75rem',
                          color: '#111111',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, name: any) => [
                          `₹${Number(val).toLocaleString('en-IN')}`,
                          name === 'netSales' ? 'Net Revenue' : 'Gross Volume',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        formatter={(value) => (value === 'netSales' ? 'Net Sales' : 'Gross Sales')}
                      />
                      <Area
                        type="monotone"
                        dataKey="grossSales"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#blueGrossGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="netSales"
                        stroke="#F5A800"
                        strokeWidth={2.5}
                        fill="url(#amberSalesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1">
                    <BarChart3 className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-700">No sales transactions in this period</p>
                    <p className="text-[11px] text-zinc-400">Try selecting a broader date range or another branch.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart B: Branch Comparison */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    Branch Performance Comparison
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Net invoiced sales volume sorted descending by branch
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {isLoading ? '...' : `${data?.branchComparison?.filter((b) => b.netSales > 0).length || 0} active branches`}
                </span>
              </div>

              <div className="w-full h-72">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading branch comparison...</div>
                ) : hasBranchComparison ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.branchComparison.filter((b) => b.netSales > 0).slice(0, 8)}
                      margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EF" vertical={false} />
                      <XAxis
                        dataKey="branchCode"
                        stroke="#71717A"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        stroke="#71717A"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E5E5',
                          borderRadius: '0.75rem',
                          color: '#111111',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, name: any, item: any) => [
                          `₹${Number(val).toLocaleString('en-IN')}`,
                          `${item.payload.branchName}`,
                        ]}
                      />
                      <Bar dataKey="netSales" fill="#F5A800" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1">
                    <Building className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-700">No branch comparisons available</p>
                    <p className="text-[11px] text-zinc-400">Qualifying sales records will reflect here automatically.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CHARTS ROW 2: Sales vs Payments & Market Share Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart C: Sales vs Payments Received (2 Cols) */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Invoiced Sales vs Verified Collections
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Strict comparison between qualifying billings and genuine cash/bank collections
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#3B82F6]" />
                    <span className="text-zinc-600">Invoiced Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#10B981]" />
                    <span className="text-zinc-600">Payments Credited</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading collection comparison...</div>
                ) : hasPaymentsData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.salesVsPayments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EF" vertical={false} />
                      <XAxis dataKey="period" stroke="#71717A" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#71717A"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E5E5',
                          borderRadius: '0.75rem',
                          color: '#111111',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`]}
                      />
                      <Bar dataKey="invoicedSales" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Invoiced Sales" />
                      <Bar dataKey="paymentsReceived" fill="#10B981" radius={[4, 4, 0, 0]} name="Payments Received" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-700">No comparative billing data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart D: Sales Distribution Donut (1 Col) */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-600" />
                    Branch Share of Sales
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Contribution percentage by dealership</p>
                </div>
              </div>

              <div className="w-full h-64 relative flex items-center justify-center">
                {isLoading ? (
                  <div className="text-xs text-zinc-400">Calculating distribution...</div>
                ) : hasDistributionData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.salesDistribution?.slice(0, 6)}
                        dataKey="value"
                        nameKey="branchName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {data?.salesDistribution?.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E5E5',
                          borderRadius: '0.75rem',
                          color: '#111111',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          fontSize: '11px',
                        }}
                        formatter={(val: any, name: any, item: any) => [
                          `₹${Number(val).toLocaleString('en-IN')} (${item.payload.percentage}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-xs text-zinc-500">Single branch scope or no distribution</p>
                  </div>
                )}
              </div>

              {hasDistributionData && (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 border-t border-zinc-100 text-[11px]">
                  {data?.salesDistribution?.slice(0, 4).map((item, idx) => (
                    <div key={item.branchId} className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      />
                      <span className="truncate text-zinc-700">{item.branchName}</span>
                      <span className="font-mono text-zinc-400 ml-auto">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Branch Performance Comparison Matrix */}
          <div className="cockpit-card rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-700" />
                  Branch-Wise Sales Performance Matrix
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Detailed reconciliation of invoiced sales, payments collected, receivables, and deliveries
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {isLoading ? '...' : `${data?.branchComparison?.length ?? (branches?.length || 2)} Dealership Branches`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200 font-mono">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Dealership Branch</th>
                    <th className="px-4 py-3 font-semibold">Franchise</th>
                    <th className="px-4 py-3 font-semibold text-center">Vehicles Sold</th>
                    <th className="px-4 py-3 font-semibold text-right">Gross Sales (₹)</th>
                    <th className="px-4 py-3 font-semibold text-right">Net Sales (₹)</th>
                    <th className="px-4 py-3 font-semibold text-right">Collections (₹)</th>
                    <th className="px-4 py-3 font-semibold text-right">Outstanding (₹)</th>
                    <th className="px-4 py-3 font-semibold text-center">Collection %</th>
                    <th className="px-4 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-sans">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                        Loading branch comparison matrix...
                      </td>
                    </tr>
                  ) : !data?.branchComparison || data.branchComparison.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                        No branch sales records found in current scope.
                      </td>
                    </tr>
                  ) : (
                    data.branchComparison.map((b) => {
                      const net = b.netSales || 0;
                      const collected = b.paymentsReceived || 0;
                      const collectionRate = net > 0 ? Math.min(100, Math.round((collected / net) * 100)) : 0;
                      const isCurrentSelected = selectedBranchId === b.branchId;

                      return (
                        <tr
                          key={b.branchId}
                          className={`hover:bg-zinc-50/80 transition-colors ${isCurrentSelected ? 'bg-amber-50/30' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-semibold block">{b.branchName}</span>
                                <span className="text-[11px] font-mono text-zinc-400">{b.branchCode}</span>
                              </div>
                              {isCurrentSelected && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                  Current
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{b.franchiseName}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-zinc-900">
                            {b.vehiclesSold}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-600">
                            ₹{b.grossSales.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900">
                            ₹{b.netSales.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                            ₹{b.paymentsReceived.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-amber-700">
                            ₹{b.outstandingReceivables.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                collectionRate >= 80
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : collectionRate > 0
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                              }`}
                            >
                              {collectionRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedBranchId(b.branchId)}
                              className="px-2.5 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto"
                            >
                              <span>Isolate</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
