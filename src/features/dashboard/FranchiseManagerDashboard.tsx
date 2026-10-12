import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Building2,
  DollarSign,
  Store,
  Users,
  ShoppingBag,
  Truck,
  Wrench,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { dashboardService, FranchiseDashboardData } from '@/services/dashboard.service';
import { useScope } from '@/app/providers/ScopeContext';
import { ApiError } from '@/services/apiClient';

export const FranchiseManagerDashboard: React.FC = () => {
  const { selectedFranchiseId } = useScope();
  const [data, setData] = useState<FranchiseDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getFranchise(selectedFranchiseId);
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError({
            title: 'Authentication Required (401)',
            message: 'Your session has expired. Please log in again.',
            statusCode: 401,
          });
        } else if (err.statusCode === 403) {
          setError({
            title: 'Unauthorized Franchise Scope (403)',
            message: 'You are restricted to your assigned regional franchise territory.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Dashboard Service Issue (${err.statusCode})`,
            message: err.message || 'Unable to retrieve regional operations telemetry.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to reach backend services.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFranchiseId]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Building2 className="w-4 h-4 text-[#F5A800]" /> Operations Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.franchiseName ? `${data.franchiseName} Operations` : 'Franchise Manager Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Branch operational overview, team performance, and sales pipeline control.
          </p>
        </div>
        {data && (
          <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700 rounded-lg">
            Franchise Code: {data.franchiseCode}
          </span>
        )}
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title={error.title}
          message={error.message}
          onRetry={loadData}
        />
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonKpiCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable rows={4} />
            <SkeletonTable rows={4} />
          </div>
        </div>
      )}

      {/* Real Live Operational Data */}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Active Branches"
              value={data.branchCount}
              icon={Store}
              subtitle="Supervised Locations"
            />
            <KpiCard
              title="Total Employees"
              value={data.employeeCount}
              icon={Users}
              subtitle="Regional Staff"
            />
            <KpiCard
              title="Monthly Sales Volume"
              value={data.bookingsCount}
              icon={ShoppingBag}
              subtitle="Delivered & Pending Orders"
            />
            <KpiCard
              title="Total Revenue"
              value={`₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              subtitle="Gross Franchise Sales"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Available Fleet Stock</span>
                <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">
                  {data.inStockVehicles} Units
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Active Bay Jobs</span>
                <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">
                  {data.activeServiceJobsCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Pending Approvals</span>
                <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                  {data.pendingApprovals}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branch Health Status */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-[#F5A800]" />
                Supervised Branch Network
              </h3>
              {data.branches.length === 0 ? (
                <EmptyState
                  title="No branches available"
                  description="Branch performance and inventory status will appear once hubs are onboarded."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 uppercase font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-2 text-center">Vehicles</th>
                        <th className="py-2.5 px-2 text-center">Staff</th>
                        <th className="py-2.5 px-2 text-center">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data.branches.map((b) => (
                        <tr key={b.id} className="hover:bg-zinc-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-zinc-900 block">{b.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {b.code} {b.city ? `• ${b.city}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-semibold">
                            {b._count?.vehicles || 0}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono">
                            {b._count?.employees || 0}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-emerald-600">
                            {b._count?.bookings || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#F5A800]" />
                Regional Sales Activity
              </h3>
              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No recent sales activity"
                  description="Customer orders generated across branches will appear here."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {bk.bookingNumber}
                          </span>
                          <StatusBadge status={bk.status} />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {bk.customer?.name || 'Client'} • {bk.branch?.name || 'Branch'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-900 block">
                          ₹{Number(bk.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(bk.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
