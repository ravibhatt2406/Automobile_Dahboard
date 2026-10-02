import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { BranchPerformanceChart } from '@/components/charts/BranchPerformanceChart';
import { Fleet3DPreview } from '@/components/automotive/Fleet3DPreview';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DollarSign, Truck, Users, Package, Wrench, Activity, ShieldCheck } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E5E5] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Global Network Scope
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Super Admin Fleet Overview</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time multi-franchise operations, branch telemetry, and network performance control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
            All Franchises & Branches
          </span>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Network Revenue" value={null} icon={DollarSign} subtitle="YTD Gross Revenue" />
        <KpiCard title="Vehicles Sold" value={null} icon={Truck} subtitle="Commercial fleet deliveries" />
        <KpiCard title="Active Customers" value={null} icon={Users} subtitle="Corporate & fleet clients" />
        <KpiCard title="Inventory Stock" value={null} icon={Package} subtitle="Units in network pool" />
        <KpiCard title="Active Service Jobs" value={null} icon={Wrench} subtitle="In workshop bays" />
      </div>

      {/* Grid Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesAnalyticsChart title="Global Sales Revenue" data={[]} />
        <BranchPerformanceChart data={[]} />
      </div>

      {/* 3D Fleet & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Fleet3DPreview />
        </div>
        <div className="lg:col-span-2 cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#F5A800]" />
            Global Audit & System Logs
          </h3>
          <EmptyState
            title="No activity records available"
            description="System activity, franchise onboarding, and global audit events will appear here once backend telemetry is active."
          />
        </div>
      </div>
    </div>
  );
};

