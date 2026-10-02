import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { Vehicle3DViewer } from '@/components/automotive/Vehicle3DViewer';
import { Truck, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => (id ? vehicleService.getVehicleById(id) : null),
  });

  return (
    <div>
      <PageHeader
        title={vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Commercial Asset #${id}`}
        subtitle={`VIN: ${vehicle?.vin || 'Unassigned VIN'}`}
        breadcrumbItems={[
          { label: 'Inventory', href: '/inventory/vehicles' },
          { label: vehicle?.vin || id || 'Detail' },
        ]}
        actions={
          <button
            onClick={() => navigate(`/inventory/vehicles/${id}/edit`)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Specifications
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* R3F 3D Vehicle Viewer Container */}
          <Vehicle3DViewer vehicleName={vehicle?.model || 'Truck Asset'} vin={vehicle?.vin || id} />

          {/* Detailed Spec Sheet */}
          <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="w-4 h-4 text-blue-400" /> Technical Specification Sheet
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">VIN Number</span>
                <span className="font-mono text-blue-400 font-semibold">{vehicle?.vin || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Classification</span>
                <span className="text-slate-200">{vehicle?.vehicleType || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fuel Powertrain</span>
                <span className="text-slate-200 capitalize">{vehicle?.fuelType || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">GVW Rating</span>
                <span className="text-slate-200">{vehicle?.gvw || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Engine Rating</span>
                <span className="text-slate-200">{vehicle?.engineSpec || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transmission</span>
                <span className="text-slate-200 capitalize">{vehicle?.transmission || '--'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Commercial Status */}
        <div className="space-y-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
              Commercial Pricing & Status
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Selling Price</span>
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {vehicle?.sellingPrice ? `$${vehicle.sellingPrice.toLocaleString()}` : '--'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Asset Status</span>
                <StatusBadge status={vehicle?.status || 'available'} />
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Dealership Location</span>
                <span className="text-xs font-medium text-slate-300">
                  {vehicle?.branchName || '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
