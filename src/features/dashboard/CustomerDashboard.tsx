import React, { useState, useEffect } from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import {
  Truck,
  FileText,
  ShoppingBag,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  Plus,
  CreditCard,
  Building,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { vehicleService } from '@/services/vehicle.service';
import { salesService } from '@/services/sales.service';
import { insuranceService } from '@/services/insurance.service';
import { serviceService } from '@/services/service.service';
import { Vehicle, Quotation, Booking, InsurancePolicy, ServiceJob } from '@/types/domain';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);

  // Real Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [vehRes, quotRes, bookRes, insRes, servRes] = await Promise.allSettled([
        vehicleService.getVehicles(),
        salesService.getQuotations(),
        salesService.getBookings(),
        insuranceService.getPolicies(),
        serviceService.getServiceJobs(),
      ]);

      if (vehRes.status === 'fulfilled' && vehRes.value?.data) {
        setVehicles(vehRes.value.data);
      }
      if (quotRes.status === 'fulfilled' && quotRes.value?.data) {
        setQuotations(quotRes.value.data);
      }
      if (bookRes.status === 'fulfilled' && bookRes.value?.data) {
        setBookings(bookRes.value.data);
      }
      if (insRes.status === 'fulfilled' && insRes.value?.data) {
        setPolicies(insRes.value.data);
      }
      if (servRes.status === 'fulfilled' && servRes.value?.data) {
        setServiceJobs(servRes.value.data);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive counts directly from data
  const vehiclesCount = vehicles.length;
  const activeQuotationsCount = quotations.filter((q) => q.status !== 'expired' && q.status !== 'rejected').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;
  const serviceDueCount = serviceJobs.filter((s) => s.status === 'received' || s.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Commercial Fleet Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Customer Command Dashboard</h1>
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

      {loading ? (
        <LoadingState label="Loading fleet metrics & compliance records..." />
      ) : (
        <>
          {/* Top Level Actionable KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="My Vehicles"
              value={vehiclesCount}
              icon={Truck}
              subtitle={vehiclesCount === 1 ? '1 registered commercial unit' : `${vehiclesCount} registered commercial units`}
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

          {/* Urgent Actionable Alerts Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#F5A800]" /> Action Required & Compliance Alerts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Alert 1: Insurance Expiry Alert */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block text-zinc-900">Insurance Renewal Reminder</span>
                  <p className="text-zinc-700">
                    Policy #POL-AL-9842 for <strong>Ashok Leyland 4825</strong> expires in <strong>12 days</strong>.
                  </p>
                  <Link to="/insurance" className="inline-flex items-center text-[#111111] font-semibold hover:underline pt-1">
                    Renew Policy →
                  </Link>
                </div>
              </div>

              {/* Alert 2: PUC Certificate Alert */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block text-zinc-900">PUC Renewal Required</span>
                  <p className="text-zinc-700">
                    Pollution Certificate for <strong>RJ-14-EA-4825</strong> expires on <strong>16-Oct-2026</strong>.
                  </p>
                  <Link to="/insurance" className="inline-flex items-center text-[#111111] font-semibold hover:underline pt-1">
                    View PUC Certificate →
                  </Link>
                </div>
              </div>

              {/* Alert 3: Pending Booking Payment Alert */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-[#F5A800] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block text-[#F5A800]">Booking Payment Pending</span>
                  <p className="text-zinc-300">
                    ₹1,00,000 booking amount pending for <strong>Booking #BK-1024 (Ashok Leyland 4825)</strong>.
                  </p>
                  <Link to="/payments" className="inline-flex items-center text-[#F5A800] font-semibold hover:underline pt-1">
                    Pay Booking Advance →
                  </Link>
                </div>
              </div>
            </div>
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
                  <Link to="/inventory/vehicles" className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1">
                    View All ({vehiclesCount}) <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {vehicles.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-3">
                    <Truck className="w-8 h-8 text-zinc-400 mx-auto" />
                    <p className="font-semibold text-zinc-800">No active vehicles registered to your account yet.</p>
                    <p className="text-zinc-500">
                      When your commercial truck purchases or lease contracts are finalized by Jaipur Branch, they will appear here.
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
                      <div key={v.id} className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-[#F5A800] font-bold flex items-center justify-center font-mono">
                            TRK
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block">{v.model || 'Ashok Leyland 4825'}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">VIN: {v.vin} • Reg: {v.registrationNumber || 'Registration Pending'}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 uppercase">
                          {v.status.replace('_', ' ')}
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
                    Recent Purchase Enquiries & Bookings
                  </h3>
                  <Link to="/sales/bookings" className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1">
                    View Enquiries →
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-amber-700 uppercase">Booking #BK-1024</span>
                    <h4 className="font-bold text-zinc-900 text-sm">Ashok Leyland 4825 10x4 Tipper</h4>
                    <p className="text-zinc-500 mt-0.5">Jaipur Branch • Booking Amount: ₹1,00,000</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-100 text-amber-900">
                      Payment Pending
                    </span>
                    <Link
                      to="/payments"
                      className="px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg"
                    >
                      Pay Now
                    </Link>
                  </div>
                </div>
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
                      <span className="font-medium text-zinc-800">Insurance Active</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900">1 Unit Active</span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-zinc-800">PUC Renewal Due</span>
                    </div>
                    <span className="font-mono font-bold text-amber-700">1 Expiring</span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-zinc-800">Branch Location</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900">Jaipur Hub</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Help */}
              <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Quick Customer Actions</h4>
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
                      <FileText className="w-4 h-4 text-zinc-700" /> Download GST Invoices & Receipts
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>

                  <Link
                    to="/insurance"
                    className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-between font-semibold text-zinc-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Insurance & PUC Certificates
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
