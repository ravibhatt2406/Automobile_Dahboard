import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Wrench, Clock, Package, Play, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/services/apiClient';

export const MechanicWorkspacePage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ['mechanic-jobs'],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>('/service-jobs/mechanic/my-jobs');
        return Array.isArray(res) ? res : res?.data || res?.items || [];
      } catch {
        return [];
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return apiFetch(`/service-jobs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanic-jobs'] });
    },
  });

  const handleStageChange = (jobId: string, nextStatus: string) => {
    updateStatusMutation.mutate({ id: jobId, status: nextStatus, notes: `Status updated by technician` });
  };

  return (
    <div>
      <PageHeader
        title="Technician & Mechanic Workstation"
        subtitle="Operationally streamlined repair bay workstation for mechanics"
        breadcrumbItems={[{ label: 'Service', href: '/service/jobs' }, { label: 'Mechanic Workstation' }]}
      />

      <div className="space-y-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs text-blue-400 font-bold block">
                    Job Card #{job.jobNumber || job.jobCardNumber || job.id.slice(0, 8)} • VIN: {job.vehicle?.vin || job.vehicleVin || 'N/A'}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">
                    {job.vehicle?.variant?.model?.modelName
                      ? `${job.vehicle?.variant?.model?.brand || ''} ${job.vehicle?.variant?.model?.modelName} ${job.vehicle?.variant?.variantName || ''}`
                      : job.vehicleModel || 'Commercial Truck'}
                  </h3>
                </div>
                <StatusBadge status={job.status || job.stage} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    Customer & Complaint
                  </span>
                  <p className="text-slate-200 font-medium">{job.customer?.name || job.customer?.companyName || job.customerName || 'Fleet Client'}</p>
                  <p className="text-slate-400">{job.complaint || 'Routine service maintenance check.'}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    Technician Diagnosis Notes
                  </span>
                  <p className="text-slate-300 italic">{job.diagnosis || 'Diagnosis in progress...'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-cyan-400" /> Parts: {job.jobParts?.length || 0} Issued
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Bay Labour: {job.labourItems?.length || 0} Lines
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(job.status === 'CHECKED_IN' || job.status === 'OPEN' || job.stage === 'mechanic_assignment') && (
                    <button
                      onClick={() => handleStageChange(job.id, 'IN_PROGRESS')}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work In Progress
                    </button>
                  )}
                  {(job.status === 'IN_PROGRESS' || job.stage === 'work_in_progress') && (
                    <button
                      onClick={() => handleStageChange(job.id, 'QUALITY_CHECK')}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> Request Quality Check
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="cockpit-card p-12 rounded-xl border border-slate-800 text-center space-y-3">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No repair jobs assigned to your bay</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your technician work queue is clear. Assigned vehicle job cards will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
