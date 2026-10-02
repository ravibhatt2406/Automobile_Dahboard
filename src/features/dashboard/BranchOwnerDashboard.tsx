import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Store, DollarSign, Users, Truck, Wrench } from 'lucide-react';

export const BranchOwnerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Store className="w-4 h-4 text-[#F5A800]" /> Dealership Location Scope
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Branch Owner Dashboard</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Branch revenue tracking, inventory status, and workshop throughput.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Branch Revenue" value={null} icon={DollarSign} subtitle="Assigned Dealership Hub" />
        <KpiCard title="Branch Inventory" value={null} icon={Truck} subtitle="Units On Lot" />
        <KpiCard title="Active Leads" value={null} icon={Users} subtitle="Local Pipeline" />
        <KpiCard title="Service Repairs" value={null} icon={Wrench} subtitle="In Workshop" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesAnalyticsChart title="Branch Monthly Sales" data={[]} />
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4">Branch Financial Summary</h3>
          <EmptyState
            title="No financial summary available"
            description="Branch balance statements, operational expenses, and sales margin data will load here."
          />
        </div>
      </div>
    </div>
  );
};

