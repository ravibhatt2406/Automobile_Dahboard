import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Building2, DollarSign, Store, Users, ShoppingBag } from 'lucide-react';

export const FranchiseManagerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Building2 className="w-4 h-4 text-[#F5A800]" /> Operations Management
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Franchise Manager Dashboard</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Branch operational overview, team performance, and sales pipeline control.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Branches" value={null} icon={Store} subtitle="Supervised Locations" />
        <KpiCard title="Total Employees" value={null} icon={Users} subtitle="Staff Count" />
        <KpiCard title="Monthly Sales Volume" value={null} icon={ShoppingBag} subtitle="Delivered Orders" />
        <KpiCard title="Total Revenue" value={null} icon={DollarSign} subtitle="Assigned Franchise" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesAnalyticsChart title="Franchise Sales Overview" data={[]} />
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#111111] mb-4">Branch Health Status</h3>
          <EmptyState
            title="No branch health data available"
            description="Branch performance KPIs, attendance logs, and inventory status will appear here."
          />
        </div>
      </div>
    </div>
  );
};

