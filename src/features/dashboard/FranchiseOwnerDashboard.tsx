import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Building,
  DollarSign,
  Truck,
  Users,
  Store,
  Wrench,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useScope } from '@/app/providers/ScopeContext';
import { franchiseService } from '@/services/franchise.service';
import { dashboardService, FranchiseDashboardData } from '@/services/dashboard.service';
import { Franchise } from '@/types/domain';
import { ApiError } from '@/services/apiClient';

export const FranchiseOwnerDashboard: React.FC = () => {
  const { selectedFranchiseId, setSelectedFranchiseId } = useScope();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [data, setData] = useState<FranchiseDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  useEffect(() => {
    loadFranchises();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selectedFranchiseId]);

  const loadFranchises = async () => {
    try {
      const res = await franchiseService.getFranchises();
      if (Array.isArray(res.data)) {
        setFranchises(res.data);
      }
    } catch {
      // Non-blocking
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getFranchise(selectedFranchiseId);
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError({
            title: 'Session Expired (401)',
            message: 'Please sign in to view franchise operations.',
            statusCode: 401,
          });
        } else if (err.statusCode === 403) {
          setError({
            title: 'Scope Restriction (403)',
            message: 'You are not authorized to access data outside your assigned franchise.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Error Loading Dashboard (${err.statusCode})`,
            message: err.message || 'Failed to fetch franchise dashboard statistics.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Unable to connect to the dealership API.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Building className="w-4 h-4 text-[#F5A800]" /> Franchise Executive Scope
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.franchiseName ? `${data.franchiseName} Dashboard` : 'Franchise Owner Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Executive metrics, multi-branch revenue tracking, and dealership operations.
          </p>
        </div>

        {/* Franchise Switcher (if multiple permitted) */}
        {franchises.length > 1 && (
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700">
            <span className="text-zinc-500 font-medium">Franchise:</span>
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              className="bg-transparent text-zinc-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white">
                All Assigned Franchises
              </option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id} className="bg-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title={error.title}
          message={error.message}
          onRetry={loadDashboard}
        />
      )}

      {/* Loading Skeletons */}
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

      {/* Real Live Dashboard Content */}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Franchise Revenue"
              value={`₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              subtitle="Confirmed Bookings"
            />
            <KpiCard
              title="Branch Locations"
              value={data.branchCount}
              icon={Store}
              subtitle="Active Dealership Hubs"
            />
            <KpiCard
              title="Commercial Fleet Inventory"
              value={`${data.inStockVehicles} / ${data.vehicleCount}`}
              icon={Truck}
              subtitle="In-stock / Total assigned"
            />
            <KpiCard
              title="Dealership Staff"
              value={data.employeeCount}
              icon={Users}
              subtitle="Active Personnel"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Active Bookings</span>
                <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">
                  {data.bookingsCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Workshop Repair Load</span>
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
                <span className="text-xs text-zinc-500 font-medium">Pending Onboarding Approvals</span>
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
            {/* Franchise Branches Hubs */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-[#F5A800]" />
                Franchise Branch Dealerships
              </h3>
              {data.branches.length === 0 ? (
                <EmptyState
                  title="No branches found"
                  description="No active branches currently linked to this franchise."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 uppercase font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Branch</th>
                        <th className="py-2.5 px-2 text-center">Vehicles</th>
                        <th className="py-2.5 px-2 text-center">Staff</th>
                        <th className="py-2.5 px-2 text-center">Bookings</th>
                        <th className="py-2.5 px-2 text-center">Repairs</th>
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
                          <td className="py-2.5 px-2 text-center font-mono">
                            {b._count?.serviceJobs || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Franchise Bookings */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#F5A800]" />
                Recent Sales & Booking Activity
              </h3>
              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="Customer bookings made across your franchise branches will display here."
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
                          {bk.customer?.name || 'Customer'} • {bk.branch?.name || 'Branch'}
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
