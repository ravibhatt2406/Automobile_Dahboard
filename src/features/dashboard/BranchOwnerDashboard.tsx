import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Store,
  DollarSign,
  Users,
  Truck,
  Wrench,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { dashboardService, BranchDashboardData } from '@/services/dashboard.service';
import { useScope } from '@/app/providers/ScopeContext';
import { ApiError } from '@/services/apiClient';

export const BranchOwnerDashboard: React.FC = () => {
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
            title: 'Branch Scope Violation (403)',
            message: 'You are only authorized to access metrics for your assigned branch dealership.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Branch Telemetry Error (${err.statusCode})`,
            message: err.message || 'Unable to retrieve dealership hub performance metrics.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to connect to backend dealership services.',
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
            <Store className="w-4 h-4 text-[#F5A800]" /> Dealership Location Scope
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.branchName ? `${data.branchName} Executive Hub` : 'Branch Owner Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Branch revenue tracking, inventory status, and workshop throughput.
          </p>
        </div>
        {data && (
          <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700 rounded-lg">
            Branch Code: {data.branchCode} {data.city ? `• ${data.city}` : ''}
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

      {/* Real Live Dashboard Data */}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Branch Revenue"
              value={`₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              subtitle="Confirmed Fleet Orders"
            />
            <KpiCard
              title="Branch Inventory"
              value={`${data.inStockVehicles} / ${data.totalVehicles}`}
              icon={Truck}
              subtitle="In-stock / Total Lot"
            />
            <KpiCard
              title="Active Pipeline"
              value={data.activeLeads}
              icon={Users}
              subtitle="Local Enquiries & Leads"
            />
            <KpiCard
              title="Service Repairs"
              value={data.activeServiceJobs}
              icon={Wrench}
              subtitle="In Workshop Bays"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Sales Quotations</span>
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
                <span className="text-xs text-zinc-500 font-medium">Branch Staff Personnel</span>
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
                <span className="text-xs text-zinc-500 font-medium">Completed Repairs</span>
                <p className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                  {data.completedServiceJobs}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#F5A800]" />
                Recent Branch Bookings
              </h3>
              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="Bookings created at this branch location will appear here."
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
                          {bk.customer?.name || 'Customer'} • {bk.vehicle?.vin || 'Vehicle'}
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

            {/* Recent Service Jobs */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
                <Wrench className="w-4 h-4 text-[#F5A800]" />
                Active Workshop Repair Orders
              </h3>
              {data.recentServiceJobs.length === 0 ? (
                <EmptyState
                  title="No active service jobs"
                  description="Workshop repair orders booked into service bays will be displayed here."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentServiceJobs.map((job) => (
                    <div
                      key={job.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {job.jobNumber}
                          </span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5 font-medium truncate max-w-xs">
                          {job.complaint || 'General Service Maintenance'}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {job.vehicle?.registrationNumber || job.vehicle?.vin || 'Vehicle'} • {job.customer?.name || 'Client'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(job.createdAt).toLocaleDateString()}
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
