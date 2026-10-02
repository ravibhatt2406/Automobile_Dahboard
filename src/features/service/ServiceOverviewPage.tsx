import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Wrench, Calendar, Clock, CheckCircle2 } from 'lucide-react';

export const ServiceOverviewPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Service Bay & Maintenance Operations"
        subtitle="Commercial truck repair job cards, appointment scheduling, and technician logs"
        breadcrumbItems={[{ label: 'Service' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Active Job Cards" value={null} icon={Wrench} subtitle="In workshop bays" />
        <KpiCard title="Appointments Today" value={null} icon={Calendar} subtitle="Scheduled check-ins" />
        <KpiCard title="Awaiting Spare Parts" value={null} icon={Clock} subtitle="Bay hold state" />
        <KpiCard title="Completed Jobs" value={null} icon={CheckCircle2} subtitle="This month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Workshop Bay Utilization</h3>
          <EmptyState
            title="No service job data available"
            description="Active repair orders and workshop lift statuses will display when linked to backend telemetry."
          />
        </div>

        <div className="cockpit-card p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Scheduled Appointments</h3>
          <EmptyState
            title="No upcoming appointments"
            description="Client fleet maintenance bookings will be listed here."
          />
        </div>
      </div>
    </div>
  );
};
