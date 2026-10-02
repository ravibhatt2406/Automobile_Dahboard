import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { BranchPerformanceChart } from '@/components/charts/BranchPerformanceChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Building, DollarSign, Truck, Users, Store, Wrench } from 'lucide-react';
import { useScope } from '@/app/providers/ScopeContext';

export const FranchiseOwnerDashboard: React.FC = () => {
  const { selectedFranchiseId, setSelectedFranchiseId } = useScope();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Building className="w-4 h-4 text-[#F5A800]" /> Franchise Executive Scope
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Franchise Owner Dashboard</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Executive metrics, multi-branch revenue tracking, and dealership operations.
          </p>
        </div>

        {/* Franchise Switcher */}
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700">
          <span className="text-zinc-500 font-medium">Franchise:</span>
          <select
            value={selectedFranchiseId}
            onChange={(e) => setSelectedFranchiseId(e.target.value)}
            className="bg-transparent text-zinc-900 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-white">
              All Owned Franchises
            </option>
            <option value="fr-01" className="bg-white">
              Titan Commercial NA
            </option>
            <option value="fr-02" className="bg-white">
              Titan Heavy Haul Euro
            </option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Franchise Revenue" value={null} icon={DollarSign} subtitle="Gross Franchise Sales" />
        <KpiCard title="Branch Locations" value={null} icon={Store} subtitle="Active Dealership Hubs" />
        <KpiCard title="Vehicles Delivered" value={null} icon={Truck} subtitle="Units In Service" />
        <KpiCard title="Fleet Customers" value={null} icon={Users} subtitle="Registered Accounts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesAnalyticsChart title="Franchise Revenue Analytics" data={[]} />
        <BranchPerformanceChart data={[]} />
      </div>

      <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
        <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-[#F5A800]" />
          Franchise Service Bay Utilization
        </h3>
        <EmptyState
          title="No franchise service jobs recorded"
          description="Service job allocations, technician hours, and repair orders will be displayed once workshop data is synced."
        />
      </div>
    </div>
  );
};

