import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { Truck, Edit, ShieldCheck, FileCheck, Wrench, FileText, Building, ExternalLink, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const isCustomer = activeRole === 'CUSTOMER';

  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'service' | 'documents'>('overview');

  const { data: fetchedVehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => (id ? vehicleService.getVehicleById(id) : null),
  });

  // Fallback vehicle details
  const vehicle = fetchedVehicle || {
    id: id || 'veh-01',
    vin: 'MAT482500K982401',
    make: 'Ashok Leyland',
    model: '4825 10x4 Tipper',
    variant: 'BS6 250HP Tipper',
    vehicleType: 'Tipper Truck',
    year: 2026,
    color: 'Pure White',
    fuelType: 'diesel' as const,
    transmission: 'manual' as const,
    franchiseId: 'fr-ashok-leyland',
    franchiseName: 'Ashok Leyland',
    branchId: 'br-jaipur',
    branchName: 'Jaipur Branch',
    sellingPrice: 4850000,
    status: 'available' as const,
    registrationNumber: 'RJ-14-EA-4825',
    photos: ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80'],
    primaryPhoto: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
  };

  // Normalize backend vs frontend field differences
  const veh = vehicle as any;
  const displayYear = veh.manufacturingYear || veh.year || '—';
  const displayMake = veh.make || veh.variant?.model?.manufacturer?.name || '—';
  const displayModel = veh.model || veh.variant?.model?.name || '—';
  const displayBranchName = veh.branchName || veh.branch?.name || '—';
  const displayFranchiseName = veh.franchiseName || veh.branch?.franchise?.name || '—';
  const displayPrice = veh.sellingPrice || 0;
  const displayPhotos = veh.photos || veh.images || [];
  const displayPrimaryPhoto = veh.primaryPhoto || displayPhotos[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${displayYear} ${displayMake} ${displayModel}`}
        subtitle={`Reg: ${veh.registrationNumber || 'Registration Pending'} • VIN: ${veh.vin}`}
        breadcrumbItems={[
          { label: isCustomer ? 'My Vehicles' : 'Inventory', href: '/inventory/vehicles' },
          { label: vehicle.registrationNumber || vehicle.vin },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/inventory/vehicles')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vehicles
            </button>
            {!isCustomer && (
              <button
                onClick={() => navigate(`/inventory/vehicles/${id}/edit`)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit Asset
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[#E5E5E5] gap-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#F5A800] text-[#111111]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Truck className="w-4 h-4 text-[#F5A800]" /> Vehicle Overview
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'compliance'
              ? 'border-[#F5A800] text-[#111111]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Compliance (Insurance & PUC)
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'service'
              ? 'border-[#F5A800] text-[#111111]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" /> Service & Maintenance
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-[#F5A800] text-[#111111]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" /> Documents & Invoices
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Truck Imagery Display */}
            <div className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-xs">
              <div className="h-64 sm:h-80 bg-zinc-900 overflow-hidden relative">
                <img
                  src={vehicle.primaryPhoto || vehicle.photos?.[0] || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80'}
                  alt={vehicle.model}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/80 text-[#F5A800] text-xs font-mono font-bold px-3 py-1 rounded">
                  {vehicle.make}
                </div>
              </div>
            </div>

            {/* Spec Sheet */}
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Truck className="w-4 h-4 text-[#F5A800]" /> Technical Specification Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">VIN</span>
                  <span className="font-bold text-zinc-900">{vehicle.vin}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Registration</span>
                  <span className="font-bold text-zinc-900">{vehicle.registrationNumber || 'Pending'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Classification</span>
                  <span className="font-semibold text-zinc-800">{vehicle.vehicleType}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Fuel & Powertrain</span>
                  <span className="font-semibold text-zinc-800 capitalize">{vehicle.fuelType}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Transmission</span>
                  <span className="font-semibold text-zinc-800 capitalize">{vehicle.transmission}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Color</span>
                  <span className="font-semibold text-zinc-800">{vehicle.color}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Status & Pricing */}
          <div className="space-y-6">
            <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-[#111111] border-b border-zinc-100 pb-3">
                Asset Status & Location
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] block font-mono">Ex-Showroom Price</span>
                  <span className="text-2xl font-bold text-[#111111] font-mono">
                    ₹{(vehicle.sellingPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 uppercase text-[10px] block font-mono mb-1">Operational Status</span>
                  <StatusBadge status={vehicle.status} />
                </div>

                <div>
                  <span className="text-zinc-400 uppercase text-[10px] block font-mono">Fulfilling Branch</span>
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-4 h-4 text-[#F5A800]" /> {vehicle.branchName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Compliance */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
            <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Insurance Policy Status
            </h4>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Policy Number:</span>
                <span className="font-bold text-zinc-900">POL-AL-9842-2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Provider:</span>
                <span className="font-semibold text-zinc-800">ICICI Lombard General</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Expiry Date:</span>
                <span className="font-bold text-amber-700">16-Oct-2026 (Expiring Soon)</span>
              </div>
            </div>
            <Link to="/insurance" className="text-xs text-[#111111] font-semibold underline block pt-1">
              View Full Policy Details →
            </Link>
          </div>

          <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
            <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" /> PUC Certificate Status
            </h4>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Certificate #:</span>
                <span className="font-bold text-zinc-900">PUC-RJ14-2026-8819</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Authority:</span>
                <span className="font-semibold text-zinc-800">Govt of Rajasthan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Status:</span>
                <span className="font-bold text-amber-700">Valid (Expiring in 12 days)</span>
              </div>
            </div>
            <Link to="/insurance" className="text-xs text-[#111111] font-semibold underline block pt-1">
              View Certificate →
            </Link>
          </div>
        </div>
      )}

      {/* TAB 3: Service */}
      {activeTab === 'service' && (
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-4">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#F5A800]" /> Vehicle Service History & Appointments
          </h3>
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono flex justify-between items-center">
            <div>
              <span className="font-bold text-zinc-900 block">Scheduled 10,000 KM Maintenance</span>
              <span className="text-zinc-500 text-[11px]">Jaipur Central Service Workshop • Scheduled: 20-Oct-2026</span>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-semibold text-[11px]">
              Scheduled
            </span>
          </div>
        </div>
      )}

      {/* TAB 4: Documents */}
      {activeTab === 'documents' && (
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3 text-xs font-mono">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 font-sans mb-3">
            <FileText className="w-4 h-4 text-blue-600" /> Vehicle Document Vault
          </h3>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
            <span>Vehicle Sales GST Invoice #INV-2026-001</span>
            <Link to="/billing/invoices" className="text-zinc-900 font-semibold underline">View Invoice</Link>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
            <span>Insurance Policy Certificate POL-AL-9842</span>
            <Link to="/insurance" className="text-zinc-900 font-semibold underline">View Certificate</Link>
          </div>
        </div>
      )}
    </div>
  );
};
