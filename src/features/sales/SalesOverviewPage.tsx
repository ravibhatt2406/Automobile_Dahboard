import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { KpiCard } from '@/components/data-display/KpiCard';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ShoppingBag, FileText, CheckCircle2, DollarSign, Calendar, Truck, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { useScope } from '@/app/providers/ScopeContext';
import { useNavigate } from 'react-router-dom';

export const SalesOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-overview-dashboard', selectedBranchId, selectedFranchiseId],
    queryFn: () =>
      dashboardService.getSales({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      }),
  });

  const formatCurrency = (val: number = 0) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const hasRecentBookings = Boolean(data?.recentBookings && data.recentBookings.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial Sales Hub"
        subtitle={`Quotations, bookings, revenue tracking, and deal closings for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Sales' }, { label: 'Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/sales/quotations')}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-[#F5A800] rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              View Quotations
            </button>
            <button
              onClick={() => navigate('/sales/bookings')}
              className="px-3.5 py-2 bg-[#F5A800] hover:bg-[#d99500] text-zinc-900 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Manage Bookings
            </button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Failed to load sales pipeline metrics"
          message={(error as any)?.message || 'An unexpected error occurred while communicating with backend sales services.'}
          onRetry={refetch}
        />
      ) : (
        <>
          {/* KPI Metrics */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Active Quotations"
                value={data?.openQuotationsCount ?? 0}
                icon={FileText}
                subtitle="Awaiting client acceptance"
              />
              <KpiCard
                title="Confirmed Bookings"
                value={data?.confirmedBookingsCount ?? 0}
                icon={ShoppingBag}
                subtitle="Orders confirmed & locked"
              />
              <KpiCard
                title="Total Vehicles Sold"
                value={data?.deliveredVehiclesCount ?? 0}
                icon={CheckCircle2}
                subtitle="Delivered & sold assets"
              />
              <KpiCard
                title="Total Sales Volume"
                value={formatCurrency(data?.totalSalesVolume ?? 0)}
                icon={DollarSign}
                subtitle="Gross confirmed booking value"
              />
            </div>
          )}

          {/* Visual Analytics & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 flex flex-col justify-between">
              <SalesAnalyticsChart
                title="Sales Conversion Revenue"
                data={data?.monthlySales || []}
              />
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-zinc-600" /> Recent Sales Transactions
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Authorized orders and bookings in {activeBranchName}
                  </p>
                </div>
                {hasRecentBookings && (
                  <button
                    onClick={() => navigate('/sales/bookings')}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                  >
                    View All
                  </button>
                )}
              </div>

              {isLoading ? (
                <SkeletonTable rows={4} />
              ) : hasRecentBookings ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[11px] text-zinc-400 uppercase font-semibold">
                        <th className="pb-2">Booking #</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Vehicle Asset</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data?.recentBookings.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => navigate(`/sales/bookings/${b.id}`)}
                          className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 font-mono text-[11px] font-bold text-zinc-900">
                            {b.bookingNumber}
                          </td>
                          <td className="py-2.5 text-zinc-700 font-medium">
                            {b.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="py-2.5 text-zinc-500 font-mono text-[11px]">
                            {b.vehicle?.vin ? (
                              <span className="text-blue-600 font-mono">{b.vehicle.vin}</span>
                            ) : (
                              <span className="text-zinc-400 italic">Unallocated</span>
                            )}
                          </td>
                          <td className="py-2.5 font-semibold text-zinc-900">
                            ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right">
                            <StatusBadge status={b.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No sales data available"
                  description={`Vehicle sales invoices and booking receipts will populate here when recorded for ${activeBranchName}.`}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
