import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  ShoppingBag,
  FileText,
  CheckCircle2,
  TrendingUp,
  Truck,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, SalesDashboardData } from '@/services/dashboard.service';
import { ApiError } from '@/services/apiClient';

export const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getSales();
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError({
            title: 'Authentication Required (401)',
            message: 'Your session has expired. Please sign in again.',
            statusCode: 401,
          });
        } else if (err.statusCode === 403) {
          setError({
            title: 'Unauthorized Sales Access (403)',
            message: 'You lack permissions to view sales executive workload.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Sales Service Issue (${err.statusCode})`,
            message: err.message || 'Unable to retrieve sales pipeline metrics.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to connect to backend dealership services.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <ShoppingBag className="w-4 h-4 text-[#F5A800]" /> Commercial Sales Executive
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Sales Workstation</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Customer enquiries, quotations, vehicle allocations, and bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/sales/quotations')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            New Quotation
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title={error.title}
          message={error.message}
          onRetry={loadData}
        />
      )}

      {/* Loading Skeletons */}
      {loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonKpiCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable rows={4} />
            <SkeletonTable rows={4} />
          </div>
        </div>
      )}

      {/* Real Live Operational Data */}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Active Quotations"
              value={data.openQuotationsCount}
              icon={FileText}
              subtitle="Pending Client Review"
            />
            <KpiCard
              title="Confirmed Bookings"
              value={data.confirmedBookingsCount}
              icon={CheckCircle2}
              subtitle="Ready for Allocation"
            />
            <KpiCard
              title="Available Lot Inventory"
              value={data.availableStockCount}
              icon={Truck}
              subtitle="In-stock Commercial Units"
            />
            <KpiCard
              title="Customer Enquiries"
              value={data.activeLeadsCount}
              icon={Users}
              subtitle="Assigned Leads in Pipeline"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Quotations Table */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#F5A800]" />
                  Sales Quotations
                </h3>
                <button
                  onClick={() => navigate('/sales/quotations')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data.recentQuotations.length === 0 ? (
                <EmptyState
                  title="No quotations created"
                  description="Generate quotations for customers directly from inventory or truck catalogue."
                  actionLabel="View Quotations"
                  onAction={() => navigate('/sales/quotations')}
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentQuotations.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/sales/quotations/${q.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {q.quotationNumber}
                          </span>
                          <StatusBadge status={q.status} />
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5 font-medium">
                          {q.customer?.name || 'Customer'} • {q.variant?.name || 'Commercial Truck'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-900 block">
                          ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real Bookings Table */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Customer Bookings
                </h3>
                <button
                  onClick={() => navigate('/sales/bookings')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data.recentBookings.length === 0 ? (
                <EmptyState
                  title="No active bookings"
                  description="Bookings converted from approved quotations will appear here."
                  actionLabel="View Bookings"
                  onAction={() => navigate('/sales/bookings')}
                />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {data.recentBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigate(`/sales/bookings/${b.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50/50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {b.bookingNumber}
                          </span>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5 font-medium">
                          {b.customer?.name || 'Customer'}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          VIN: {b.vehicle?.vin || 'Awaiting Allocation'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-900 block">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
