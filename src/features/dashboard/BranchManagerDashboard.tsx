import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Store, Target, ShoppingBag, Truck, Wrench, CheckSquare } from 'lucide-react';

export const BranchManagerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Store className="w-4 h-4 text-[#F5A800]" /> Branch Operations
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Branch Manager Dashboard</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Daily shift operations, lead conversion targets, and workshop bay status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Lead Conversion" value={null} icon={Target} subtitle="Monthly Target" />
        <KpiCard title="Confirmed Bookings" value={null} icon={ShoppingBag} subtitle="Pending Deliveries" />
        <KpiCard title="Available Fleet Stock" value={null} icon={Truck} subtitle="On Dealership Lot" />
        <KpiCard title="Service Bay Load" value={null} icon={Wrench} subtitle="Active Repair Cards" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#F5A800]" />
            Branch Manager Daily Tasks
          </h3>
          <EmptyState
            title="No pending tasks"
            description="Daily shift schedules, inventory audits, and manager approvals will be displayed here."
          />
        </div>

        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4">Branch Staff Roster</h3>
          <EmptyState
            title="No staff attendance logged"
            description="Sales reps, technicians, and advisors assigned to this branch will appear when database syncing occurs."
          />
        </div>
      </div>
    </div>
  );
};

