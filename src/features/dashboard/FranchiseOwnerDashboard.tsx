import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Building2,
  Store,
  DollarSign,
  Truck,
  Users,
  CheckCircle2,
  Wrench,
  TrendingUp,
  ShieldAlert,
  Megaphone,
  CreditCard,
} from 'lucide-react';
import { dashboardService, FranchiseDashboardData } from '@/services/dashboard.service';
import { franchiseService } from '@/services/franchise.service';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { ApiError } from '@/services/apiClient';

export const FranchiseOwnerDashboard: React.FC = () => {
  const { selectedFranchiseId, setSelectedFranchiseId } = useScope();
  const { permissions } = useAuth();
  const [data, setData] = useState<FranchiseDashboardData | null>(null);
  const [franchises, setFranchises] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadFranchises = async () => {
    try {
      const list = await franchiseService.getAll();
      setFranchises(list);
      if (!selectedFranchiseId && list.length > 0) {
        setSelectedFranchiseId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load franchises:', err);
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
            title: 'Authentication Required (401)',
            message: 'Your franchise session has expired. Please log in again.',
            statusCode: 401,
          });
        } else if (err.statusCode === 403) {
          setError({
            title: 'Cross-Tenant Violation (403)',
            message: 'You are unauthorized to view telemetry for another franchise organisation.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Executive Hub Error (${err.statusCode})`,
            message: err.message || 'Unable to retrieve franchise operational telemetry.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to reach franchise operational service.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canViewAllFranchises) {
      loadFranchises();
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selectedFranchiseId]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Building2 className="w-4 h-4 text-[#F5A800]" /> Franchise Executive Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.franchiseName ? `${data.franchiseName} Overview` : 'Franchise Network Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Franchise-wide sales, collections, inventory status, lead conversion, workshop, compliance, and campaigns.
          </p>
        </div>

        {permissions.canViewAllFranchises && franchises.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">Franchise:</span>
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono font-semibold bg-white text-zinc-900"
            >
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && <ErrorState title={error.title} message={error.message} onRetry={loadDashboard} />}

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
              title="Franchise Bookings"
              value={`₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              subtitle="Confirmed Booking Value"
            />
            <KpiCard
              title="Actual Collections"
              value={`₹${(data.totalCollections || 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              subtitle="Verified Payment Receipts"
            />
            <KpiCard
              title="Commercial Fleet Inventory"
              value={`${data.inStockVehicles} / ${data.vehicleCount}`}
              icon={Truck}
              subtitle={`In-Stock (${data.reservedVehicles || 0} Rsrv, ${data.allocatedVehicles || 0} Alloc)`}
            />
            <KpiCard
              title="Branch Locations"
              value={data.branchCount}
              icon={Store}
              subtitle={`${data.employeeCount} Total Personnel`}
            />
          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lead Conversion */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Lead Conversion</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold font-mono text-zinc-900">
                {data.leadConversionRate || 0}%
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {data.totalLeads || 0} Pipeline Leads
              </p>
            </div>

            {/* Compliance Expiry Alerts */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Compliance Attention</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xl font-bold font-mono text-rose-700">
                {data.complianceAlerts || 0}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">Expired or Due in 30 Days</p>
            </div>

            {/* Campaign Performance */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Campaign Marketing</span>
                <Megaphone className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold font-mono text-purple-700">
                {data.campaignsCount || 0} Campaigns
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Budget: ₹{Number(data.campaignBudget || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Finance / EMI Telemetry */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Financier EMI Due</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold font-mono text-zinc-900">
                {data.activeFinanceApps || 0} Active Loans
              </p>
              <p className="text-[11px] text-amber-700 font-mono">
                {data.overdueEmis || 0} Overdue Installments
              </p>
            </div>
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
            {/* Franchise Branches Hubs */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-[#F5A800]" />
                Authorized Branch Dealership Network
              </h3>
              {data.branches.length === 0 ? (
                <EmptyState
                  title="No branches found"
                  description="Active branches associated with this franchise will appear here."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.branches.map((b) => (
                    <div
                      key={b.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">{b.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                            {b.code}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {b.city || 'Central Location'} • {b._count?.vehicles || 0} Trucks in lot
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="text-[11px] font-mono text-zinc-500">
                          <span className="block font-bold text-zinc-900">
                            {b._count?.bookings || 0} Bookings
                          </span>
                          <span>{b._count?.serviceJobs || 0} Jobs</span>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#F5A800]" />
                Recent Executive Bookings
              </h3>
              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="New vehicle bookings will stream into this feed automatically."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentBookings.map((rb) => (
                    <div
                      key={rb.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {rb.bookingNumber}
                          </span>
                          <StatusBadge status={rb.status} />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {rb.customer?.name || 'Commercial Client'} • {rb.branch?.name || 'Branch'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-900 block">
                          ₹{Number(rb.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(rb.createdAt).toLocaleDateString()}
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
