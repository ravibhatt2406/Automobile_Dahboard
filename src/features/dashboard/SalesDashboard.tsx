import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ShoppingBag, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <ShoppingBag className="w-4 h-4 text-[#F5A800]" /> Commercial Sales Executive
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Sales Workstation</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Customer enquiries, quotations, vehicle allocations, and bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Active Quotations" value={null} icon={FileText} subtitle="Awaiting client approval" />
        <KpiCard title="Confirmed Bookings" value={null} icon={CheckCircle2} subtitle="Ready for allocation" />
        <KpiCard title="Completed Sales" value={null} icon={ShoppingBag} subtitle="Delivered vehicles" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F5A800]" />
            Sales Quotations
          </h3>
          <EmptyState
            title="No quotations created"
            description="Generate quotations for customers directly from inventory or truck catalogue."
            actionLabel="View Quotations"
            onAction={() => navigate('/sales/quotations')}
          />
        </div>

        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Customer Bookings
          </h3>
          <EmptyState
            title="No active bookings"
            description="Bookings converted from approved quotations will appear here."
            actionLabel="View Bookings"
            onAction={() => navigate('/sales/bookings')}
          />
        </div>
      </div>
    </div>
  );
};
