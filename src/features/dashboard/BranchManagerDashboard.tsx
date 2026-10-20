import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Store,
  ShoppingBag,
  Truck,
  Wrench,
  Users,
  CheckSquare,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  Megaphone,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService, BranchDashboardData } from '@/services/dashboard.service';
import { useScope } from '@/app/providers/ScopeContext';
import { ApiError } from '@/services/apiClient';

export const BranchManagerDashboard: React.FC = () => {
  const { selectedBranchId } = useScope();
  const [data, setData] = useState<BranchDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getBranch(selectedBranchId);
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
            message: 'You are restricted to your assigned branch operations.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Operational Telemetry Error (${err.statusCode})`,
            message: err.message || 'Unable to retrieve branch operational metrics.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to reach branch backend service.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Store className="w-4 h-4 text-[#F5A800]" /> Branch Operations Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.branchName ? `${data.branchName} Manager Hub` : 'Branch Manager Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Daily shift operations, sales pipeline control, workshop bay load, compliance, and marketing.
          </p>
        </div>
        {data && (
          <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700 rounded-lg">
            Hub: {data.branchCode} {data.city ? `• ${data.city}` : ''}
          </span>
        )}
      </div>

      {/* Error State */}
      {error && <ErrorState title={error.title} message={error.message} onRetry={loadData} />}

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

      {/* Real Live Operational Data */}
      {!loading && !error && data && (
        <>
          {/* Top Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Active Pipeline Leads"
              value={data.activeLeads}
              icon={Users}
              subtitle="Prospective Fleet Clients"
            />
            <KpiCard
              title="Confirmed Bookings"
              value={data.confirmedBookings}
              icon={ShoppingBag}
              subtitle="In Allocation & Delivery"
            />
            <KpiCard
              title="Available Stock"
              value={`${data.inStockVehicles} / ${data.totalVehicles}`}
              icon={Truck}
              subtitle="On Dealership Lot"
            />
            <KpiCard
              title="Workshop Bay Load"
              value={data.activeServiceJobs}
              icon={Wrench}
              subtitle={
                (data.overdueJobs || 0) > 0
                  ? `${data.overdueJobs} Overdue Jobs`
                  : 'Active Service Cards'
              }
            />
          </div>

          {/* Operational Breakdown Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Financial Collections */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Collections Received</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold font-mono text-zinc-900">
                ₹{Number(data.totalCollections || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Booking Value: ₹{Number(data.totalRevenue || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Inventory Status Breakdown */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Inventory Breakdown</span>
                <Truck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                  {data.inStockVehicles} Stock
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                  {data.reservedVehicles || 0} Rsrv
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                  {data.allocatedVehicles || 0} Alloc
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono pt-1">
                Total Branch Units: {data.totalVehicles}
              </p>
            </div>

            {/* Compliance Alerts Requiring Attention */}
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

            {/* Campaign Results */}
            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Marketing & Camps</span>
                <Megaphone className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold font-mono text-purple-700">
                {data.activeCampaignsCount || 0} Active
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {data.campaignLeadsCount || 0} Leads Attributed
              </p>
            </div>
          </div>

          {/* Secondary Operational Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Active Quotations</span>
                <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">
                  {data.activeQuotations}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Branch Staff On-Duty</span>
                <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">
                  {data.totalEmployees}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Pending Staff Approvals</span>
                <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                  {data.pendingApprovals}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Customer Live Communication Quick Access */}
          <div className="p-4 rounded-xl bg-[#111111] text-white border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-[#F5A800] flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-100">Customer Inquiries & Live Messages Desk</h4>
                <p className="text-xs text-zinc-400">
                  Respond to customer vehicle inquiries, booking questions, and assign conversations to advisors.
                </p>
              </div>
            </div>
            <Link
              to="/chat"
              className="px-4 py-2 bg-[#F5A800] hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
            >
              Open Messages Desk →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confirmed Orders / Bookings */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#F5A800]" />
                Recent Branch Bookings
              </h3>
              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="Bookings converted from approved quotations will appear here."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {b.bookingNumber}
                          </span>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {b.customer?.name || 'Customer'} • {b.vehicle?.vin || 'Unassigned VIN'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-900 block">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workshop Bay Status */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#F5A800]" />
                  Workshop Bay Status
                </h3>
                {(data.overdueJobs || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {data.overdueJobs} Overdue
                  </span>
                )}
              </div>
              {data.recentServiceJobs.length === 0 ? (
                <EmptyState
                  title="No active service jobs"
                  description="Repair orders currently in progress at workshop bays will appear here."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentServiceJobs.map((j) => (
                    <div
                      key={j.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {j.jobNumber}
                          </span>
                          <StatusBadge status={j.status} />
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5 font-medium truncate max-w-xs">
                          {j.complaint || 'Service Order'}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {j.vehicle?.registrationNumber || j.vehicle?.vin || 'Vehicle'} • {j.customer?.name || 'Client'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(j.createdAt).toLocaleDateString()}
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
