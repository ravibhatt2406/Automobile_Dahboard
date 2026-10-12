import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { Fleet3DPreview } from '@/components/automotive/Fleet3DPreview';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  DollarSign,
  Truck,
  Users,
  Package,
  Wrench,
  ShieldCheck,
  Building,
  Store,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { dashboardService, SuperAdminDashboardData } from '@/services/dashboard.service';
import { ApiError } from '@/services/apiClient';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getSuperAdmin();
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError({
            title: 'Authentication Required (401)',
            message: 'Your session has expired. Please sign in again.',
            statusCode: 401,
          });
        } else if (err.statusCode === 403) {
          setError({
            title: 'Access Restricted (403)',
            message: 'Super Administrator privileges are required to view this network dashboard.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `System Service Notice (${err.statusCode})`,
            message: err.message || 'Unable to connect to live telemetry services.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to retrieve Super Admin dashboard telemetry.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E5E5] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Global Network Scope
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Super Admin Fleet Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time multi-franchise operations, branch telemetry, and network performance control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
            {data
              ? `${data.franchiseCount} Franchises • ${data.branchCount} Dealerships`
              : 'All Franchises & Branches'}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title={error.title}
          message={error.message}
          onRetry={loadData}
        />
      )}

      {/* Loading Skeletons */}
      {loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonKpiCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable rows={4} />
            <SkeletonTable rows={4} />
          </div>
        </div>
      )}

      {/* Real Live Dashboard Content */}
      {!loading && !error && data && (
        <>
          {/* Top KPI Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Total Network Revenue"
              value={`₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              subtitle="Confirmed Fleet Orders"
            />
            <KpiCard
              title="Commercial Bookings"
              value={data.bookingCount}
              icon={Truck}
              subtitle="Total network sales"
            />
            <KpiCard
              title="Active Customers"
              value={data.customerCount}
              icon={Users}
              subtitle="Corporate & fleet clients"
            />
            <KpiCard
              title="Inventory Stock"
              value={`${data.inStockVehicleCount} / ${data.vehicleCount}`}
              icon={Package}
              subtitle="In-stock / Total units"
            />
            <KpiCard
              title="Active Service Jobs"
              value={data.activeServiceJobCount}
              icon={Wrench}
              subtitle="In workshop bays"
            />
          </div>

          {/* Secondary Network Scope Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-zinc-400" /> Franchises
              </span>
              <span className="font-mono text-sm font-bold text-zinc-900">
                {data.franchiseCount} Active
              </span>
            </div>
            <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-zinc-400" /> Dealership Hubs
              </span>
              <span className="font-mono text-sm font-bold text-zinc-900">
                {data.branchCount} Branches
              </span>
            </div>
            <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" /> Dealership Staff
              </span>
              <span className="font-mono text-sm font-bold text-zinc-900">
                {data.employeeCount} Personnel
              </span>
            </div>
            <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Pending Approvals
              </span>
              <span className="font-mono text-sm font-bold text-amber-600">
                {data.pendingApprovals} Pending
              </span>
            </div>
          </div>

          {/* Real Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Dealership Hubs */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-[#F5A800]" />
                Top Dealership Branch Hubs
              </h3>
              {data.topBranches.length === 0 ? (
                <EmptyState
                  title="No branches active"
                  description="Onboard franchise branch locations to observe operational statistics."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 uppercase font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Branch / Franchise</th>
                        <th className="py-2.5 px-2 text-center">Vehicles</th>
                        <th className="py-2.5 px-2 text-center">Staff</th>
                        <th className="py-2.5 px-2 text-center">Bookings</th>
                        <th className="py-2.5 px-2 text-center">Repairs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data.topBranches.map((b) => (
                        <tr key={b.id} className="hover:bg-zinc-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-zinc-900 block">{b.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {b.code} • {b.franchise?.name || 'Network'}
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
                          <td className="py-2.5 px-2 text-center font-mono text-zinc-700">
                            {b._count?.serviceJobs || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Network Bookings */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#F5A800]" />
                Recent Fleet Deliveries & Bookings
              </h3>
              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="Network bookings and commercial fleet contracts will appear here."
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
                          {bk.customer?.name || 'Corporate Customer'} • {bk.branch?.name || 'Central'}
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

          {/* 3D Fleet Visual Preview */}
          <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
            <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-[#F5A800]" />
              Commercial Truck Visualizer
            </h3>
            <Fleet3DPreview />
          </div>
        </>
      )}
    </div>
  );
};
