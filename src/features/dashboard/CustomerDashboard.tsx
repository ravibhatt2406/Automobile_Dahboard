import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SkeletonKpiCard, SkeletonTable } from '@/components/feedback/LoadingState';
import {
  Truck,
  FileText,
  ShoppingBag,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  CreditCard,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService, CustomerDashboardData } from '@/services/dashboard.service';
import { ApiError } from '@/services/apiClient';

export const CustomerDashboard: React.FC = () => {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getCustomer();
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError({
            title: 'Authentication Required (401)',
            message: 'Your customer portal session has expired. Please sign in again.',
            statusCode: 401,
          });
        } else if (err.statusCode === 403) {
          setError({
            title: 'Scope Restriction (403)',
            message: 'You are only authorized to access your own fleet and booking records.',
            statusCode: 403,
          });
        } else {
          setError({
            title: `Portal Telemetry Notice (${err.statusCode})`,
            message: err.message || 'Unable to load customer fleet telemetry.',
            statusCode: err.statusCode,
          });
        }
      } else {
        setError({
          title: 'Connection Error',
          message: err?.message || 'Failed to reach customer services.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const vehicles = data?.vehicles || [];
  const quotations = data?.quotations || [];
  const bookings = data?.bookings || [];
  const policies = data?.insurancePolicies || [];
  const serviceJobs = data?.serviceJobs || [];

  // Derive counts directly from real database data
  const vehiclesCount = data?.summary?.vehiclesCount ?? vehicles.length;
  const activeQuotationsCount =
    data?.summary?.activeQuotationsCount ??
    quotations.filter((q) => q.status !== 'EXPIRED' && q.status !== 'REJECTED').length;
  const pendingBookingsCount =
    data?.summary?.pendingBookingsCount ??
    bookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED').length;
  const serviceDueCount =
    data?.summary?.serviceDueCount ??
    serviceJobs.filter((s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED').length;

  // Real compliance alerts based on actual expiry date
  const expiringPolicies = policies.filter((p: any) => {
    if (!p.expiryDate) return false;
    const diffDays = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  });

  const unpaidBookings = bookings.filter(
    (b: any) => b.status === 'PENDING' || b.status === 'CONFIRMED',
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Commercial Fleet Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.name ? `${data.name} Fleet Dashboard` : 'Customer Command Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time overview of your commercial vehicle fleet, compliance certificates, active bookings & service schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/browse-trucks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Truck className="w-4 h-4" /> Browse Available Trucks
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title={error.title}
          message={error.message}
          onRetry={loadDashboardData}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkeletonTable rows={4} />
            </div>
            <SkeletonTable rows={4} />
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Top Level Actionable KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="My Vehicles"
              value={vehiclesCount}
              icon={Truck}
              subtitle={
                vehiclesCount === 1
                  ? '1 registered commercial unit'
                  : `${vehiclesCount} registered commercial units`
              }
            />
            <KpiCard
              title="Active Quotations"
              value={activeQuotationsCount}
              icon={FileText}
              subtitle="Pending customer confirmation"
            />
            <KpiCard
              title="Pending Bookings"
              value={pendingBookingsCount}
              icon={ShoppingBag}
              subtitle="In delivery & allocation pipeline"
            />
            <KpiCard
              title="Service Due"
              value={serviceDueCount}
              icon={Wrench}
              subtitle="Active maintenance jobs"
            />
          </div>

          {/* Actionable Alerts Section derived genuinely from real database records */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#F5A800]" /> Action Required & Compliance Alerts
            </h3>

            {expiringPolicies.length === 0 && unpaidBookings.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  All fleet compliance policies, insurance certificates, and payments are up-to-date. No urgent action required.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {expiringPolicies.map((pol: any) => {
                  const daysLeft = Math.ceil(
                    (new Date(pol.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={pol.id}
                      className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3"
                    >
                      <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <span className="font-bold block text-zinc-900">
                          Insurance Renewal Reminder
                        </span>
                        <p className="text-zinc-700">
                          Policy #{pol.policyNumber} expires in <strong>{daysLeft} days</strong>.
                        </p>
                        <Link
                          to="/insurance"
                          className="inline-flex items-center text-[#111111] font-semibold hover:underline pt-1"
                        >
                          Renew Policy →
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {unpaidBookings.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-start gap-3"
                  >
                    <CreditCard className="w-5 h-5 text-[#F5A800] shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block text-[#F5A800]">Booking Payment Order</span>
                      <p className="text-zinc-300">
                        ₹{Number(b.bookingAmount || 0).toLocaleString('en-IN')} advance recorded for{' '}
                        <strong>Booking #{b.bookingNumber}</strong>.
                      </p>
                      <Link
                        to="/payments"
                        className="inline-flex items-center text-[#F5A800] font-semibold hover:underline pt-1"
                      >
                        Review Payment →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Fleet & Bookings Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fleet Overview Box */}
              <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#F5A800]" />
                    Active Commercial Fleet Vehicles
                  </h3>
                  <Link
                    to="/inventory/vehicles"
                    className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1"
                  >
                    View All ({vehiclesCount}) <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {vehicles.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-3">
                    <Truck className="w-8 h-8 text-zinc-400 mx-auto" />
                    <p className="font-semibold text-zinc-800">
                      No active vehicles registered to your account yet.
                    </p>
                    <p className="text-zinc-500">
                      When your commercial truck purchases or contracts are finalized, they will appear here.
                    </p>
                    <Link
                      to="/inventory/browse-trucks"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#F5A800] font-semibold rounded-lg text-xs"
                    >
                      Browse Commercial Trucks Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicles.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-[#F5A800] font-bold flex items-center justify-center font-mono">
                            TRK
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              {v.variant?.name || v.model || 'Commercial Vehicle'}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              VIN: {v.vin} • Reg: {v.registrationNumber || 'Registration Pending'}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 uppercase">
                          {v.status ? v.status.replace('_', ' ') : 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Bookings & Quotations */}
              <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#F5A800]" />
                    Recent Purchase Bookings
                  </h3>
                  <Link
                    to="/sales/bookings"
                    className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1"
                  >
                    View All ({bookings.length}) →
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                    No active purchase bookings recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                      >
                        <div>
                          <span className="font-mono text-[10px] font-bold text-amber-700 uppercase">
                            Booking #{b.bookingNumber}
                          </span>
                          <h4 className="font-bold text-zinc-900 text-sm">
                            {b.vehicle?.variant?.name || b.vehicleModel || 'Commercial Vehicle'}
                          </h4>
                          <p className="text-zinc-500 mt-0.5">
                            Total Amount: ₹{Number(b.totalAmount || b.bookingAmount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-100 text-amber-900 uppercase">
                            {b.status}
                          </span>
                          <Link
                            to="/payments"
                            className="px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg"
                          >
                            Payments
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Vehicle Compliance & Health Section */}
            <div className="space-y-6">
              {/* Compliance Status Card */}
              <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-4">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#F5A800]" />
                  Fleet Compliance Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-zinc-800">Insurance Policies</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900">
                      {policies.length} Registered
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-zinc-800">Policies Expiring Soon</span>
                    </div>
                    <span className="font-mono font-bold text-amber-700">
                      {expiringPolicies.length} Due
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-zinc-800">Registered Vehicles</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900">
                      {vehicles.length} Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Help */}
              <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  Quick Customer Actions
                </h4>
                <div className="space-y-2 text-xs">
                  <Link
                    to="/service/jobs"
                    className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-between font-semibold text-zinc-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#F5A800]" /> Book Service Appointment
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>

                  <Link
                    to="/billing/invoices"
                    className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-between font-semibold text-zinc-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-700" /> Download GST Invoices
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>

                  <Link
                    to="/insurance"
                    className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-between font-semibold text-zinc-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Insurance & Fleet Certificates
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
