import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { KpiCard } from '@/components/data-display/KpiCard';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ShoppingBag, FileText, CheckCircle2, DollarSign } from 'lucide-react';

export const SalesOverviewPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Commercial Sales Hub"
        subtitle="Quotations, bookings, revenue tracking, and deal closings"
        breadcrumbItems={[{ label: 'Sales' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Active Quotations" value={null} icon={FileText} subtitle="Awaiting client acceptance" />
        <KpiCard title="Confirmed Bookings" value={null} icon={ShoppingBag} subtitle="Orders locked" />
        <KpiCard title="Total Vehicles Sold" value={null} icon={CheckCircle2} subtitle="YTD Deliveries" />
        <KpiCard title="Total Sales Volume" value={null} icon={DollarSign} subtitle="Gross Value" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesAnalyticsChart title="Sales Conversion Revenue" data={[]} />
        <div className="cockpit-card p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Sales Transactions</h3>
          <EmptyState
            title="No sales data available"
            description="Vehicle sales invoices and booking receipts will populate here when recorded."
          />
        </div>
      </div>
    </div>
  );
};
