import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Target, FileText, CheckCircle2, TrendingUp, PhoneCall } from 'lucide-react';

export const SalesDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4">
        <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Target className="w-4 h-4 text-[#F5A800]" /> Commercial Sales Executive
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Sales Workstation & Pipeline</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Lead tracking, follow-up schedules, quotation management, and deal closings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="My Assigned Leads" value={null} icon={Target} subtitle="Active pipeline" />
        <KpiCard title="Follow-ups Due Today" value={null} icon={PhoneCall} subtitle="Action required" />
        <KpiCard title="Active Quotations" value={null} icon={FileText} subtitle="Awaiting client approval" />
        <KpiCard title="Bookings Won" value={null} icon={CheckCircle2} subtitle="This month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F5A800]" />
            My Sales Pipeline Stages
          </h3>
          <EmptyState
            title="No leads assigned to you"
            description="You do not have any active CRM lead records or sales opportunities assigned to your account."
            actionLabel="View All Leads"
            onAction={() => {}}
          />
        </div>

        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4">Pending Quotation Approvals</h3>
          <EmptyState
            title="No quotations created"
            description="Quotations generated for corporate fleet clients will be listed here."
          />
        </div>
      </div>
    </div>
  );
};

