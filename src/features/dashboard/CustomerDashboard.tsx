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
  MessageSquare,
  MapPin,
  Save,
  RotateCcw,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  Receipt,
  Download,
  Calendar,
  AlertCircle,
  Store,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService, CustomerDashboardData } from '@/services/dashboard.service';
import { ApiError } from '@/services/apiClient';
import { useAuth } from '@/app/providers/AuthContext';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; statusCode?: number } | null>(
    null,
  );

  // Active Tab for Confirmed Owners & Returning Prospects
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'quotations' | 'service' | 'invoices' | 'compliance'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getCustomer();
      if (!res?.customer && !user?.customerId) {
        navigate('/customer/onboarding', { replace: true });
        return;
      }
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
  const leads = data?.leads || [];
  const quotations = data?.quotations || [];
  const bookings = data?.bookings || [];
  const serviceJobs = data?.serviceJobs || [];
  const serviceAppointments = data?.serviceAppointments || [];
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const complianceDocs = data?.complianceDocuments || [];
  const prospectState = data?.prospectState || 'NEW_PROSPECT';

  // Real compliance alerts based on actual expiry date
  const expiringCompliance = complianceDocs.filter((doc) => {
    if (!doc.expiryDate) return false;
    const diffDays = (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
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
            <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Titan Commercial Fleet Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            {data?.customer?.name ? `${data.customer.name} Command Hub` : 'Customer Fleet Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {prospectState === 'CONFIRMED_OWNER' && 'Active fleet overview, compliance documentation, bookings, and workshop telemetry.'}
            {prospectState === 'RETURNING_PROSPECT' && 'Track your truck purchase quotations, pending bookings, and advisor communications.'}
            {prospectState === 'NEW_PROSPECT' && 'Explore commercial truck specifications, calculate payloads, and request formal quotations.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preferred Branch Read-only Badge with Settings Link */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-700">
            <Store className="w-3.5 h-3.5 text-[#F5A800]" />
            <span>
              Preferred Branch:{' '}
              <strong className="text-zinc-900">
                {data?.customer?.preferredBranch?.name || 'Not set'}
              </strong>
              {data?.customer?.preferredBranch?.city
                ? ` (${data.customer.preferredBranch.city})`
                : ''}
            </span>
            <Link
              to="/settings"
              className="ml-1 text-xs text-amber-700 hover:text-amber-900 font-semibold underline"
            >
              Change in Settings →
            </Link>
          </div>

          {/* Customer Prospect Stage Badge */}
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
              prospectState === 'CONFIRMED_OWNER'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : prospectState === 'RETURNING_PROSPECT'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            }`}
          >
            {prospectState === 'CONFIRMED_OWNER' && '🛡️ Confirmed Fleet Owner'}
            {prospectState === 'RETURNING_PROSPECT' && '📋 Active Inquiries Pipeline'}
            {prospectState === 'NEW_PROSPECT' && '✨ New Commercial Prospect'}
          </span>

          <Link
            to="/inventory/browse-trucks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Truck className="w-4 h-4" /> Browse Trucks
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && <ErrorState title={error.title} message={error.message} onRetry={loadDashboardData} />}

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

      {/* Main Content Area */}
      {!loading && !error && data && (
        <>
          {/* ============================================================== */}
          {/* CASE 1: NEW PROSPECT WITH NO PRIOR ACTIVITY                     */}
          {/* ============================================================== */}
          {prospectState === 'NEW_PROSPECT' && (
            <div className="space-y-6">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border border-zinc-700 shadow-md">
                <div className="max-w-2xl space-y-4">
                  <span className="px-3 py-1 rounded-full bg-[#F5A800]/20 text-[#F5A800] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Welcome to Titan Auto
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Power Your Heavy Transport & Haulage Operations
                  </h2>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    You currently have no active commercial vehicles, quotations, or bookings recorded. Start by browsing our heavy commercial truck catalogue, comparing tonnage capacities, and requesting an official quotation from your nearest branch.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      to="/inventory/browse-trucks"
                      className="px-5 py-2.5 bg-[#F5A800] hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs"
                    >
                      <Truck className="w-4 h-4" /> Browse Commercial Catalogue
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/customer/chat"
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-600 transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-[#F5A800]" /> Speak with Commercial Advisor
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F5A800] flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900">Commercial Heavy Trucks</h3>
                  <p className="text-xs text-zinc-500">
                    Browse tippers, haulage tractors, multi-axle cargo carriers with genuine chassis specifications and pricing.
                  </p>
                  <Link to="/inventory/browse-trucks" className="text-xs font-semibold text-amber-700 hover:underline inline-flex items-center gap-1">
                    Explore Catalogue <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900">Direct Dealer Quotations</h3>
                  <p className="text-xs text-zinc-500">
                    Receive verified GST-compliant price quotes tailored to your business fleet requirements without delays.
                  </p>
                  <Link to="/sales/quotations" className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1">
                    View Quotations <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900">Branch Network Assistance</h3>
                  <p className="text-xs text-zinc-500">
                    Connect directly with authorized branch managers in your city for immediate vehicle allocation and priority delivery.
                  </p>
                  <Link to="/customer/chat" className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1">
                    Live Branch Desk <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CASE 2 & 3: RETURNING PROSPECT OR CONFIRMED OWNER               */}
          {/* ============================================================== */}
          {prospectState !== 'NEW_PROSPECT' && (
            <div className="space-y-6">
              {/* KPI Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="My Vehicles"
                  value={vehicles.length}
                  icon={Truck}
                  subtitle={vehicles.length === 1 ? '1 registered unit' : `${vehicles.length} registered units`}
                />
                <KpiCard
                  title="Active Quotations"
                  value={quotations.length}
                  icon={FileText}
                  subtitle="Price estimates"
                />
                <KpiCard
                  title="Bookings & Orders"
                  value={bookings.length}
                  icon={ShoppingBag}
                  subtitle="In pipeline"
                />
                <KpiCard
                  title="Service Jobs"
                  value={serviceJobs.length}
                  icon={Wrench}
                  subtitle="Maintenance records"
                />
              </div>

              {/* Action Required & Compliance Alerts */}
              {(expiringCompliance.length > 0 || unpaidBookings.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#F5A800]" /> Action Required & Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {expiringCompliance.map((doc) => {
                      const daysLeft = Math.ceil(
                        (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                      );
                      const isExpired = daysLeft < 0;
                      return (
                        <div
                          key={doc.id}
                          className={`p-4 rounded-xl border flex items-start gap-3 ${
                            isExpired
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : 'bg-amber-50 border-amber-200 text-amber-900'
                          }`}
                        >
                          <AlertCircle
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              isExpired ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          />
                          <div className="text-xs space-y-1">
                            <span className="font-bold block">
                              {doc.documentType} {isExpired ? 'Expired' : 'Expiring Soon'}
                            </span>
                            <p className="text-zinc-700">
                              Vehicle: <strong>{doc.vehicleVin || 'Fleet Unit'}</strong> • Doc #{doc.documentNumber}
                            </p>
                            <p className="font-mono text-[11px]">
                              {isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : `Expires in ${daysLeft} days`}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {unpaidBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-start gap-3"
                      >
                        <CreditCard className="w-5 h-5 text-[#F5A800] shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <span className="font-bold block text-[#F5A800]">Booking #{b.bookingNumber}</span>
                          <p className="text-zinc-300">
                            Status: <strong>{b.status}</strong> • Total: ₹
                            {Number(b.totalAmount || b.bookingAmount || 0).toLocaleString('en-IN')}
                          </p>
                          <Link
                            to="/payments"
                            className="inline-flex items-center text-[#F5A800] font-semibold hover:underline pt-1"
                          >
                            Review Payments →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'overview'
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" /> Overview
                </button>
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'vehicles'
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" /> My Vehicles ({vehicles.length})
                </button>
                <button
                  onClick={() => setActiveTab('quotations')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'quotations'
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Quotations & Leads ({quotations.length + leads.length})
                </button>
                <button
                  onClick={() => setActiveTab('service')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'service'
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" /> Service & Maintenance ({serviceJobs.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'invoices'
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" /> Invoices & Receipts ({invoices.length + payments.length})
                </button>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'compliance'
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Compliance Documents ({complianceDocs.length})
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Recent Vehicles, Bookings, Quotes */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Owned Vehicles Card */}
                    <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#F5A800]" /> Registered Fleet Vehicles
                        </h3>
                        <button
                          onClick={() => setActiveTab('vehicles')}
                          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                        >
                          View All ({vehicles.length}) <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {vehicles.length === 0 ? (
                        <div className="p-6 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                          No commercial vehicles registered yet. When bookings are delivered, your vehicles will be listed here.
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
                                    {v.variant?.name || 'Commercial Vehicle'}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 font-mono">
                                    VIN: {v.vin} • Reg: {v.registrationNumber || 'Registration Pending'}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 uppercase">
                                {v.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bookings Card */}
                    <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-[#F5A800]" /> Recent Purchase Bookings
                        </h3>
                        <Link
                          to="/sales/bookings"
                          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                        >
                          View Details ({bookings.length}) →
                        </Link>
                      </div>

                      {bookings.length === 0 ? (
                        <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                          No bookings recorded yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {bookings.slice(0, 3).map((b) => (
                            <div
                              key={b.id}
                              className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-amber-700 uppercase">
                                    Booking #{b.bookingNumber}
                                  </span>
                                  {b.branch && (
                                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                                      {b.branch.name}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-zinc-900 text-sm mt-0.5">
                                  {b.vehicle?.variant?.name || 'Commercial Vehicle'}
                                </h4>
                                <p className="text-zinc-500 mt-0.5">
                                  Total: ₹{Number(b.totalAmount || b.bookingAmount || 0).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-100 text-amber-900 uppercase">
                                  {b.status}
                                </span>
                                {b.branchId && (
                                  <Link
                                    to={`/customer/chat?branchId=${b.branchId}&contextType=BOOKING&contextId=${b.id}&subject=Booking%20%23${b.bookingNumber}`}
                                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-lg flex items-center gap-1.5 border border-zinc-200"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-[#F5A800]" />
                                    <span>Chat</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Preferred Branch & Chat Desk */}
                  <div className="space-y-6">
                    {/* Preferred Branch Card */}
                    <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#F5A800]" /> Preferred Branch
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Assigned Hub
                        </span>
                      </div>

                      <div className="text-xs text-zinc-600">
                        {data?.customer?.preferredBranch ? (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{data.customer.preferredBranch.name}</span>
                            </div>
                            <p className="text-[11px] text-emerald-800 font-mono">
                              {data.customer.preferredBranch.city}, {data.customer.preferredBranch.state}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600">
                            <p className="font-semibold text-zinc-800">No Preferred Branch Selected</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              You have not selected a preferred branch yet.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">Need to change branch?</span>
                        <Link
                          to="/settings"
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                        >
                          <span>Edit in Settings</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>

                    {/* Dealership Chat Desk */}
                    <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#F5A800]" /> Dealership Live Desk
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Direct human messaging with your assigned branch sales and service advisors.
                      </p>
                      <Link
                        to="/customer/chat"
                        className="w-full py-2.5 px-3 bg-[#111111] hover:bg-black text-[#F5A800] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <MessageSquare className="w-4 h-4" /> Open Branch Chat Desk
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MY VEHICLES */}
              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#F5A800]" /> My Registered Commercial Vehicles ({vehicles.length})
                    </h3>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                      No commercial vehicles registered to your account yet. When bookings are delivered, they will appear here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicles.map((v) => (
                        <div key={v.id} className="p-5 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-3 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono text-[10px] text-amber-700 font-bold uppercase">
                                VIN: {v.vin}
                              </span>
                              <h4 className="text-base font-bold text-zinc-900 mt-0.5">
                                {v.variant?.name || 'Commercial Heavy Truck'}
                              </h4>
                              <p className="text-zinc-500 font-mono text-[11px]">
                                Reg: {v.registrationNumber || 'Registration Pending'} • Engine: {v.engineNumber || 'N/A'}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 uppercase">
                              {v.status}
                            </span>
                          </div>

                          <div className="p-3 bg-zinc-50 rounded-lg grid grid-cols-2 gap-2 text-[11px] text-zinc-600 font-mono">
                            <div>
                              <span className="text-zinc-400 block">Manufacturing Year</span>
                              <span className="font-semibold text-zinc-900">{v.manufacturingYear || 'Current'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Assigned Branch</span>
                              <span className="font-semibold text-zinc-900">{v.branch?.name || 'Main Yard'}</span>
                            </div>
                          </div>

                          {v.complianceDocuments && v.complianceDocuments.length > 0 && (
                            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500 font-medium">
                                Compliance: {v.complianceDocuments.length} certificates registered
                              </span>
                              <button
                                onClick={() => setActiveTab('compliance')}
                                className="text-amber-700 font-semibold hover:underline"
                              >
                                View Docs →
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: QUOTATIONS & LEADS */}
              {activeTab === 'quotations' && (
                <div className="space-y-6">
                  {/* Quotations Section */}
                  <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#F5A800]" /> Formal Dealer Price Quotations ({quotations.length})
                    </h3>

                    {quotations.length === 0 ? (
                      <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                        No quotations recorded. Browse trucks to request a formal quotation.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {quotations.map((q) => (
                          <div key={q.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-blue-700 font-bold uppercase">
                                  Quote #{q.quotationNumber}
                                </span>
                                {q.branch && (
                                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                    {q.branch.name}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-zinc-900 text-sm mt-0.5">
                                {q.variant?.name || 'Commercial Truck'}
                              </h4>
                              <p className="text-zinc-500 mt-0.5">
                                Estimated Total: ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-blue-100 text-blue-900 uppercase">
                                {q.status}
                              </span>
                              {q.branchId && (
                                <Link
                                  to={`/customer/chat?branchId=${q.branchId}&contextType=QUOTATION&contextId=${q.id}&subject=Quotation%20%23${q.quotationNumber}`}
                                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-lg flex items-center gap-1.5 border border-zinc-200"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#F5A800]" />
                                  <span>Chat</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leads / Enquiries Section */}
                  {leads.length > 0 && (
                    <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                      <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#F5A800]" /> Prospect Enquiries & Leads ({leads.length})
                      </h3>
                      <div className="divide-y divide-zinc-100">
                        {leads.map((l) => (
                          <div key={l.id} className="py-3 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-zinc-900 block">
                                Interested Model: {l.interestedModel || 'Heavy Commercial Vehicle'}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                Branch: {l.branch?.name || 'Main Hub'} • Date: {new Date(l.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900 uppercase">
                              {l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SERVICE & MAINTENANCE */}
              {activeTab === 'service' && (
                <div className="space-y-6">
                  <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#F5A800]" /> Service Jobs & Workshop History ({serviceJobs.length})
                    </h3>

                    {serviceJobs.length === 0 ? (
                      <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                        No workshop repair jobs recorded.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {serviceJobs.map((j) => (
                          <div key={j.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-amber-800 font-bold uppercase">
                                  Job #{j.jobNumber || j.id.slice(0, 8)}
                                </span>
                                {j.branch && (
                                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                    {j.branch.name}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-zinc-900 text-sm mt-0.5">
                                {j.complaint || 'Periodic Commercial Truck Service'}
                              </h4>
                              <p className="text-zinc-500 font-mono text-[11px] mt-0.5">
                                Vehicle: {j.vehicle?.vin || 'Fleet Unit'} • Actual Cost: ₹
                                {Number(j.actualCost || j.estimatedCost || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-zinc-200 text-zinc-800 uppercase">
                                {j.status}
                              </span>
                              {j.branchId && (
                                <Link
                                  to={`/customer/chat?branchId=${j.branchId}&contextType=SERVICE&contextId=${j.id}&subject=Job%20%23${j.jobNumber || j.id.slice(0, 8)}`}
                                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-lg flex items-center gap-1.5 border border-zinc-200"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#F5A800]" />
                                  <span>Chat</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: INVOICES & PAYMENTS */}
              {activeTab === 'invoices' && (
                <div className="space-y-6">
                  {/* Invoices List */}
                  <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#F5A800]" /> Commercial Invoices ({invoices.length})
                    </h3>

                    {invoices.length === 0 ? (
                      <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                        No invoices generated yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {invoices.map((inv) => (
                          <div key={inv.id} className="py-3 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono font-bold text-purple-700 uppercase">
                                Invoice #{inv.invoiceNumber}
                              </span>
                              <span className="block text-zinc-900 font-bold mt-0.5">
                                Total: ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                Date: {new Date(inv.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase ${
                                inv.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Receipts List */}
                  <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#F5A800]" /> Payment History & Receipts ({payments.length})
                    </h3>

                    {payments.length === 0 ? (
                      <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                        No payments recorded yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {payments.map((p) => (
                          <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono font-bold text-zinc-800">
                                Receipt #{p.paymentNumber}
                              </span>
                              <span className="block text-zinc-900 font-bold mt-0.5">
                                ₹{p.amount.toLocaleString('en-IN')} • Mode: {p.paymentMode || 'BANK_TRANSFER'}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                For: {p.referenceType} #{p.referenceNumber} • {new Date(p.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 uppercase">
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: COMPLIANCE DOCUMENTS */}
              {activeTab === 'compliance' && (
                <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Fleet Compliance Certificates & Expiries ({complianceDocs.length})
                  </h3>

                  {complianceDocs.length === 0 ? (
                    <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                      No compliance documents registered yet. Compliance certificates for owned vehicles will be listed here.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {complianceDocs.map((doc) => {
                        const daysLeft = Math.ceil(
                          (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                        );
                        const isExpired = daysLeft < 0;
                        return (
                          <div key={doc.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-zinc-900 uppercase">
                                  {doc.documentType}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                  Doc #{doc.documentNumber}
                                </span>
                              </div>
                              <span className="block text-zinc-600 font-mono text-[11px] mt-0.5">
                                Vehicle: <strong>{doc.vehicleVin || 'N/A'}</strong> {doc.vehicleReg ? `(${doc.vehicleReg})` : ''}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                Expiry Date: {new Date(doc.expiryDate).toLocaleDateString()}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-800'
                                  : daysLeft <= 30
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isExpired ? 'EXPIRED' : daysLeft <= 30 ? `EXPIRING (${daysLeft}d)` : 'VALID'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
