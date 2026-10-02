import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { BranchPerformanceChart } from '@/components/charts/BranchPerformanceChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Download, Filter, BarChart3, TrendingUp, Truck, Wrench, DollarSign, Users } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<
    'sales' | 'inventory' | 'service' | 'finance' | 'customers' | 'employees'
  >('sales');

  const categories: Array<{ id: typeof activeCategory; label: string; icon: React.ElementType }> = [
    { id: 'sales', label: 'Sales Reports', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Stock', icon: Truck },
    { id: 'service', label: 'Service Efficiency', icon: Wrench },
    { id: 'finance', label: 'Finance & Ledger', icon: DollarSign },
    { id: 'customers', label: 'Customer Accounts', icon: Users },
    { id: 'employees', label: 'Employee Productivity', icon: BarChart3 },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics & Executive Reports"
        subtitle="Network sales volume, revenue breakdown, dealership performance, and service efficiency"
        breadcrumbItems={[{ label: 'Reports' }]}
        actions={
          <button
            onClick={() => alert('PDF export trigger ready for backend data integration.')}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF / CSV
          </button>
        }
      />

      {/* Categories Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-slate-800">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Controls */}
      <div className="cockpit-card p-4 rounded-xl border border-slate-800 mb-6 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Filter className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">Executive Filters:</span>
        </div>

        <select className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none">
          <option>Date Range: Last 30 Days</option>
          <option>Date Range: Year to Date (YTD)</option>
          <option>Date Range: Last Quarter (Q3)</option>
        </select>

        <select className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none">
          <option>All Franchises</option>
          <option>Titan Commercial NA</option>
          <option>Titan Heavy Haul Euro</option>
        </select>

        <select className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none">
          <option>All Branches</option>
          <option>Detroit Flagship Hub</option>
          <option>Chicago Service Center</option>
        </select>
      </div>

      {/* Dynamic Report Content with Empty Chart States */}
      {activeCategory === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesAnalyticsChart title="Executive Sales Revenue Trend" data={[]} />
          <BranchPerformanceChart data={[]} />
        </div>
      )}

      {activeCategory !== 'sales' && (
        <div className="cockpit-card p-8 rounded-xl border border-slate-800">
          <EmptyState
            title={`No ${activeCategory} report data available`}
            description={`Analytical report metrics for ${activeCategory} will populate when live backend API data is synchronized.`}
            icon={BarChart3}
          />
        </div>
      )}
    </div>
  );
};
