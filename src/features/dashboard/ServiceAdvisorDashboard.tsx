import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, ServiceAdvisorDashboardData } from '@/services/dashboard.service';
import { ApiError } from '@/services/apiClient';

export const ServiceAdvisorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ServiceAdvisorDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getServiceAdvisor();
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
            title: 'Access Restricted (403)',
            message: 'Service Advisor permissions required to access workshop intake.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Service Advisor Telemetry Error (${err.statusCode})`,
            message: err.message || 'Unable to retrieve workshop operations telemetry.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to reach service workshop API.',
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
            <ClipboardList className="w-4 h-4 text-[#F5A800]" /> Service Advisor Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Service Advisor Workstation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Vehicle intake, appointment check-ins, job card allocation, and quality inspection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/service/appointments')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            All Appointments
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
              title="Today's Appointments"
              value={data.pendingAppointmentsCount}
              icon={Calendar}
              subtitle="Scheduled Client Check-ins"
            />
            <KpiCard
              title="Active Workshop Jobs"
              value={data.activeJobsCount}
              icon={Wrench}
              subtitle="In Diagnostic & Repair Bays"
            />
            <KpiCard
              title="Pending Quality Check"
              value={data.pendingQcCount}
              icon={ShieldAlert}
              subtitle="Awaiting Inspection Sign-off"
            />
            <KpiCard
              title="Completed Repairs"
              value={data.completedJobsCount}
              icon={CheckCircle2}
              subtitle="Ready for Customer Handover"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments Queue */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5A800]" />
                  Scheduled Appointments Queue
                </h3>
                <button
                  onClick={() => navigate('/service/appointments')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data.recentAppointments.length === 0 ? (
                <EmptyState
                  title="No upcoming appointments"
                  description="Customer service appointments booked via portal or call center will appear here."
                  actionLabel="Book Appointment"
                  onAction={() => navigate('/service/appointments')}
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/service/appointments`)}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {apt.appointmentNumber}
                          </span>
                          <StatusBadge status={apt.status} />
                        </div>
                        <p className="text-xs text-zinc-700 font-medium mt-1">
                          {apt.customer?.name || 'Customer'} • {apt.requestedService || 'Scheduled Maintenance'}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {apt.vehicle?.registrationNumber || apt.vehicle?.vin || 'Vehicle'} • {new Date(apt.preferredDate).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Repair Orders */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F5A800]" />
                  Active Workshop Job Cards
                </h3>
                <button
                  onClick={() => navigate('/service/jobs')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data.recentJobs.length === 0 ? (
                <EmptyState
                  title="No active service jobs"
                  description="Active workshop jobs assigned to technicians will appear here."
                  actionLabel="Create Service Job"
                  onAction={() => navigate('/service/jobs')}
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentJobs.map((j) => (
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
                          {j.complaint || 'Service inspection'}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Tech: {j.assignedMechanic ? `${j.assignedMechanic.firstName} ${j.assignedMechanic.lastName}` : 'Unassigned'} • VIN: {j.vehicle?.vin || 'N/A'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
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
