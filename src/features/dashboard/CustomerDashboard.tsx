import React from 'react';
import { KpiCard } from '@/components/data-display/KpiCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Truck, FileText, ShoppingBag, CreditCard, Wrench, Shield, Plus } from 'lucide-react';
import { Vehicle3DViewer } from '@/components/automotive/Vehicle3DViewer';

export const CustomerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Shield className="w-4 h-4 text-[#F5A800]" /> Client Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Commercial Fleet Portal</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Access your active vehicle portfolio, service history, bookings, and invoices.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs">
          <Plus className="w-4 h-4" /> Book Service Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="My Fleet Vehicles" value={null} icon={Truck} subtitle="Registered active units" />
        <KpiCard title="Active Quotations" value={null} icon={FileText} subtitle="Awaiting confirmation" />
        <KpiCard title="Pending Bookings" value={null} icon={ShoppingBag} subtitle="In delivery pipeline" />
        <KpiCard title="Service Records" value={null} icon={Wrench} subtitle="Maintenance history" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
          <h3 className="text-sm font-bold text-[#111111] mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#F5A800]" />
            Registered Fleet Vehicles
          </h3>
          <EmptyState
            title="You don't have any vehicles yet."
            description="When your commercial truck purchases or fleet leases are processed by the dealership, they will automatically appear in your portal."
            actionLabel="Browse Available Fleet Inventory"
            onAction={() => {}}
          />
        </div>

        <div className="space-y-6">
          <Vehicle3DViewer vehicleName="Fleet Vehicle Inspection" />
          <div className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white">
            <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#F5A800]" /> Invoices & Outstanding Balance
            </h4>
            <div className="text-2xl font-bold font-sans text-[#111111] mt-1">--</div>
            <p className="text-xs text-zinc-500 mt-1">No pending invoices due for payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

