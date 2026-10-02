import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Wrench, Calendar, CheckSquare, Package, Clock } from 'lucide-react';

export const MechanicDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Wrench className="w-4 h-4 text-[#F5A800]" /> Service Workshop Bay
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Technician & Mechanic Workstation</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Active job cards, workshop bay queue, parts requisition, and service completion logs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Assigned Jobs" value={null} icon={Wrench} subtitle="Current bay load" />
        <KpiCard title="Today's Appointments" value={null} icon={Calendar} subtitle="Scheduled check-ins" />
        <KpiCard title="Parts Requested" value={null} icon={Package} subtitle="Requisitions pending" />
        <KpiCard title="Jobs Completed" value={null} icon={CheckSquare} subtitle="This week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F5A800]" />
            Active Service Repair Orders
          </h3>
          <EmptyState
            title="No service jobs assigned"
            description="Repair cards, scheduled maintenance, and diagnostic tasks assigned to you will appear here."
          />
        </div>

        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4">Workshop Spare Parts Log</h3>
          <EmptyState
            title="No parts requested"
            description="Spare parts issued or requested for active vehicle jobs will be listed here."
          />
        </div>
      </div>
    </div>
  );
};

