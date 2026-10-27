import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { Truck, Edit, ShieldCheck, FileCheck, Wrench, FileText, Building, ExternalLink, ArrowLeft, Trash2, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { VehicleStatus } from '@/types/domain';
import { ComplianceTabContent } from '@/features/compliance/ComplianceTabContent';

const ALLOWED_STATUS_TRANSITIONS: Record<string, VehicleStatus[]> = {
  IN_STOCK: ['RESERVED', 'ALLOCATED', 'SERVICE', 'BLOCKED'] as VehicleStatus[],
  RESERVED: ['IN_STOCK', 'ALLOCATED', 'BLOCKED'] as VehicleStatus[],
  ALLOCATED: ['IN_STOCK', 'RESERVED', 'PDI_PENDING', 'PDI_COMPLETED', 'BLOCKED'] as VehicleStatus[],
  PDI_PENDING: ['PDI_COMPLETED', 'SERVICE', 'ALLOCATED', 'IN_STOCK'] as VehicleStatus[],
  PDI_COMPLETED: ['DELIVERED', 'PDI_PENDING', 'IN_STOCK'] as VehicleStatus[],
  DELIVERED: ['SOLD'] as VehicleStatus[],
  SOLD: [] as VehicleStatus[],
  SERVICE: ['IN_STOCK', 'PDI_PENDING'] as VehicleStatus[],
  BLOCKED: ['IN_STOCK'] as VehicleStatus[],
};

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const isCustomer = activeRole === 'CUSTOMER';

  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'service' | 'documents'>('overview');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedNextStatus, setSelectedNextStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => (id ? vehicleService.getVehicleById(id) : null),
  });

  const handleUpdateStatus = async () => {
    if (!id || !selectedNextStatus) return;
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    try {
      await vehicleService.updateVehicleStatus(id, selectedNextStatus);
      setStatusMessage({ type: 'success', text: `Status updated successfully to ${selectedNextStatus}` });
      setSelectedNextStatus('');
      await queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update vehicle status' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id || !vehicle) return;
    if (
      confirm(
        `Deactivate / Retire vehicle ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})?\nThis will preserve historical records while preventing new operations.`,
      )
    ) {
      try {
        await vehicleService.deleteVehicle(id);
        navigate('/inventory/vehicles');
      } catch (err: any) {
        alert(err?.message || 'Failed to deactivate vehicle.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-slate-400">
        Loading vehicle specification & audit records from PostgreSQL...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-400">Vehicle record not found</p>
        <button
          onClick={() => navigate('/inventory/vehicles')}
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg hover:bg-slate-700"
        >
          Return to Inventory
        </button>
      </div>
    );
  }

  // Normalize backend vs frontend field differences
  const veh = vehicle as any;
  const displayYear = veh.manufacturingYear || veh.year || '—';
  const displayMake = veh.make || veh.variant?.model?.manufacturer?.name || 'Ashok Leyland';
  const displayModel = veh.model || veh.variant?.model?.name || '—';
  const displayBranchName = veh.branchName || veh.branch?.name || 'Jaipur';
  const displayFranchiseName = veh.franchiseName || veh.branch?.franchise?.name || 'Ashok Leyland Commercial';
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
              <>
                <button
                  onClick={() => navigate(`/inventory/vehicles/${id}/edit`)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit Asset
                </button>
                <button
                  onClick={handleDeactivate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                >
                  <Trash2 className="w-4 h-4" /> Deactivate / Retire
                </button>
              </>
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
            {/* Vehicle Photo Gallery */}
            {(() => {
              const photos: string[] =
                vehicle.images && vehicle.images.length > 0
                  ? vehicle.images
                  : vehicle.photos && vehicle.photos.length > 0
                  ? vehicle.photos
                  : [];

              if (photos.length === 0) {
                return (
                  <div className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white p-8 text-center space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
                      <Truck className="w-7 h-7 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-800">No Vehicle Photos Uploaded</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                        There are currently no photos attached to this commercial vehicle asset.
                      </p>
                    </div>
                    {!isCustomer && (
                      <div className="pt-2">
                        <Link
                          to={`/inventory/vehicles/${vehicle.id}/edit`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5A800] hover:bg-[#E59D00] text-black text-xs font-bold rounded-lg shadow-xs transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" /> Upload Vehicle Photos
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              const safeIndex = Math.min(selectedPhotoIndex, photos.length - 1);
              const currentPhoto = photos[safeIndex] || photos[0];
              const isCover = safeIndex === 0;

              return (
                <div className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-xs space-y-0">
                  {/* Main Viewer Display */}
                  <div className="h-72 sm:h-96 bg-zinc-950 overflow-hidden relative flex items-center justify-center group">
                    <img
                      src={currentPhoto}
                      alt={`${vehicle.make} ${vehicle.model} - Photo ${safeIndex + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />

                    {/* Top Left Badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-black/85 text-[#F5A800] text-xs font-mono font-bold px-3 py-1 rounded-md backdrop-blur-xs">
                        {vehicle.make}
                      </span>
                      {isCover && (
                        <span className="bg-[#F5A800] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                          Cover Photo
                        </span>
                      )}
                    </div>

                    {/* Top Right Counter */}
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/75 text-zinc-200 text-xs font-mono font-bold px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/10">
                        {safeIndex + 1} / {photos.length}
                      </span>
                    </div>

                    {/* Desktop & Mobile Navigation Arrows */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100"
                          title="Previous photo"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100"
                          title="Next photo"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Selector Strip (Responsive Desktop & Mobile) */}
                  {photos.length > 1 && (
                    <div className="p-3 bg-zinc-50 border-t border-zinc-200 overflow-x-auto flex items-center gap-2.5 scrollbar-thin">
                      {photos.map((url, idx) => {
                        const isSelected = idx === safeIndex;
                        return (
                          <button
                            key={`${url}-${idx}`}
                            type="button"
                            onClick={() => setSelectedPhotoIndex(idx)}
                            className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#F5A800] ring-2 ring-[#F5A800]/40 scale-102 opacity-100'
                                : 'border-zinc-200 hover:border-zinc-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute bottom-1 right-1 px-1 rounded bg-[#F5A800] text-black text-[8px] font-black uppercase">
                                Cover
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={vehicle.status} />
                  </div>
                </div>

                {!isCustomer && (
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    <label className="text-zinc-500 text-[11px] font-semibold block">Update Status Transition</label>
                    {ALLOWED_STATUS_TRANSITIONS[vehicle.status]?.length ? (
                      <div className="space-y-2">
                        <select
                          value={selectedNextStatus}
                          onChange={(e) => setSelectedNextStatus(e.target.value)}
                          className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                        >
                          <option value="">-- Select Next Status --</option>
                          {ALLOWED_STATUS_TRANSITIONS[vehicle.status].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleUpdateStatus}
                          disabled={!selectedNextStatus || isUpdatingStatus}
                          className="w-full py-1.5 px-3 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingStatus ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Apply Status Change
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic">Terminal status reached ({vehicle.status})</span>
                    )}

                    {statusMessage && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          statusMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {statusMessage.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{statusMessage.text}</span>
                      </div>
                    )}
                  </div>
                )}

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
        <ComplianceTabContent vehicleId={veh.id} />
      )}

      {/* TAB 3: Service */}
      {activeTab === 'service' && (
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#F5A800]" /> Vehicle Service History & Appointments
            </h3>
            <Link
              to="/service/jobs"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Open Service Workshop <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          {Array.isArray(veh.serviceJobs) && veh.serviceJobs.length > 0 ? (
            <div className="space-y-3">
              {veh.serviceJobs.map((sj: any) => (
                <div
                  key={sj.id}
                  className="p-4 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-mono flex justify-between items-center transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/service/jobs/${sj.id}`}
                        className="font-bold text-blue-600 hover:underline text-sm"
                      >
                        {sj.jobNumber}
                      </Link>
                      <span className="text-zinc-400">•</span>
                      <span className="font-sans font-medium text-zinc-800">{sj.complaint || 'General Service / Maintenance'}</span>
                    </div>
                    <div className="text-zinc-500 text-[11px] flex items-center gap-3">
                      <span>Created: {new Date(sj.createdAt).toLocaleDateString()}</span>
                      {sj.assignedMechanic?.user && (
                        <span>
                          Mechanic: {sj.assignedMechanic.user.firstName} {sj.assignedMechanic.user.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sj.status} />
                    <Link
                      to={`/service/jobs/${sj.id}`}
                      className="px-2.5 py-1 bg-white border border-zinc-300 rounded text-[11px] font-sans font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
              No recent maintenance jobs recorded for this unit.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Documents */}
      {activeTab === 'documents' && (
        <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3 text-xs font-mono">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2 font-sans mb-3">
            <FileText className="w-4 h-4 text-blue-600" /> Vehicle Document Vault
          </h3>
          <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
            Registered vehicle documents, warranties, and purchase invoices are securely stored in the PostgreSQL database.
          </div>
        </div>
      )}
    </div>
  );
};
