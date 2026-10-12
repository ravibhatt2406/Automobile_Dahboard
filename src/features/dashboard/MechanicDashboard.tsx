import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Wrench, CheckSquare, Package, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, MechanicDashboardData } from '@/services/dashboard.service';
import { ApiError } from '@/services/apiClient';

export const MechanicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MechanicDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getMechanic();
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
            title: 'Unauthorized Bay Access (403)',
            message: 'Certified mechanic permissions are required to access this workstation.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Service Bay Error (${err.statusCode})`,
            message: err.message || 'Unable to retrieve assigned workshop jobs.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to connect to workshop dispatch service.',
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
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Wrench className="w-4 h-4 text-[#F5A800]" /> Service Workshop Bay
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Technician & Mechanic Workstation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Active job cards, workshop bay queue, parts requisition, and service completion logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/service/jobs')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            All Service Jobs
          </button>
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
              title="Assigned Jobs"
              value={data.totalAssigned}
              icon={Wrench}
              subtitle="Total Job Cards"
            />
            <KpiCard
              title="In Progress Repairs"
              value={data.activeJobsCount}
              icon={Clock}
              subtitle="Active in Bays"
            />
            <KpiCard
              title="Parts Requisitioned"
              value={data.partsRequestedCount}
              icon={Package}
              subtitle="Spare Parts Assigned"
            />
            <KpiCard
              title="Completed Repairs"
              value={data.completedJobsCount}
              icon={CheckSquare}
              subtitle="Service Sign-offs"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Service Repair Orders */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F5A800]" />
                  Active Service Repair Orders
                </h3>
                <span className="text-xs font-mono font-bold text-zinc-500">
                  {data.activeJobs.length} active
                </span>
              </div>

              {data.activeJobs.length === 0 ? (
                <EmptyState
                  title="No active service jobs assigned"
                  description="When service advisors assign repair orders or inspections to you, they will appear here."
                  actionLabel="View Workshop Jobs"
                  onAction={() => navigate('/service/jobs')}
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.activeJobs.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => navigate(`/service/jobs/${j.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {j.jobNumber}
                          </span>
                          <StatusBadge status={j.status} />
                        </div>
                        <p className="text-xs text-zinc-700 font-medium mt-1 truncate max-w-sm">
                          {j.complaint || 'Diagnostic inspection requested'}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {j.vehicle?.registrationNumber || j.vehicle?.vin || 'Vehicle'} • {j.customer?.name || 'Customer'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spare Parts Log */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F5A800]" />
                Workshop Spare Parts Requisitions
              </h3>

              {data.partsRequestedCount === 0 ? (
                <EmptyState
                  title="No spare parts requested"
                  description="Spare parts issued or requested for active vehicle repairs will be listed here."
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.activeJobs
                    .filter((j) => j.jobParts && j.jobParts.length > 0)
                    .flatMap((j) =>
                      (j.jobParts || []).map((jp, idx) => (
                        <div
                          key={`${j.id}-${idx}`}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-zinc-900 block">
                              {jp.part?.name || 'Replacement Component'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Part #{jp.part?.partNumber || 'OEM-PART'} • Job {j.jobNumber}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono text-[10px]">
                            Allocated
                          </span>
                        </div>
                      )),
                    )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
