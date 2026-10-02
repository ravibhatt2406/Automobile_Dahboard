import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Vehicle } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { Plus, LayoutGrid, Table, Image as ImageIcon, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const VehiclesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterMake, setFilterMake] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles(),
  });

  const vehicles = data?.data || [];
  const filteredVehicles = vehicles.filter((v) => {
    if (filterMake !== 'ALL' && v.make !== filterMake) return false;
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    return true;
  });

  const columns: Column<Vehicle>[] = [
    { header: 'VIN', accessorKey: 'vin', className: 'font-mono text-xs font-semibold text-blue-400' },
    {
      header: 'Make & Model',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-100 block">
            {row.year} {row.make} {row.model}
          </span>
          <span className="text-xs text-slate-400">{row.vehicleType}</span>
        </div>
      ),
    },
    { header: 'Fuel', accessorKey: 'fuelType', className: 'capitalize' },
    { header: 'Dealership Branch', accessorKey: 'branchName' },
    {
      header: 'Price',
      cell: (row) => `$${(row.sellingPrice || 0).toLocaleString()}`,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/inventory/vehicles/${row.id}`)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          Specs & 3D
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Inventory Stock"
        subtitle="Commercial truck stock pool, chassis inventory, and spec registry"
        breadcrumbItems={[{ label: 'Inventory' }, { label: 'Vehicles' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Showcase"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" /> Table
              </button>
            </div>

            <button
              onClick={() => navigate('/inventory/vehicles/new')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Add Commercial Vehicle
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="cockpit-card p-3 rounded-xl border border-slate-800 mb-6 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-blue-400" /> Filters:
        </span>
        <select
          value={filterMake}
          onChange={(e) => setFilterMake(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Manufacturers</option>
          <option value="Titan Commercial">Titan Commercial</option>
          <option value="Volvo Trucks">Volvo Trucks</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="available">Available Stock</option>
          <option value="reserved">Reserved</option>
          <option value="in_transit">In Transit</option>
          <option value="under_service">Under Service</option>
        </select>
      </div>

      {viewMode === 'grid' ? (
        filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => navigate(`/inventory/vehicles/${vehicle.id}`)}
                className="cockpit-card cockpit-card-hover p-4 rounded-xl border border-slate-800 cursor-pointer space-y-3 flex flex-col justify-between"
              >
                {/* Vehicle Image / No Image State */}
                <div className="w-full h-40 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                  {vehicle.primaryPhoto || (vehicle.photos && vehicle.photos[0]) ? (
                    <img
                      src={vehicle.primaryPhoto || vehicle.photos[0]}
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 text-slate-600">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                      <span className="text-[11px] font-medium text-slate-500">No vehicle image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={vehicle.status} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">
                    VIN: {vehicle.vin}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h4>
                  <p className="text-xs text-slate-400">{vehicle.vehicleType}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">{vehicle.branchName}</span>
                  <span className="font-bold text-slate-100">
                    ${(vehicle.sellingPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DataTable<Vehicle>
            columns={columns}
            data={[]}
            emptyTitle="No vehicles have been added yet."
            emptyDescription="There are no commercial truck inventory assets recorded in the database."
            emptyActionLabel="Add Vehicle Asset"
            onEmptyAction={() => navigate('/inventory/vehicles/new')}
          />
        )
      ) : (
        <DataTable<Vehicle>
          columns={columns}
          data={filteredVehicles}
          isLoading={isLoading}
          emptyTitle="No vehicles have been added yet."
          emptyDescription="There are no commercial truck inventory assets recorded in the database."
          emptyActionLabel="Add Vehicle Asset"
          onEmptyAction={() => navigate('/inventory/vehicles/new')}
        />
      )}
    </div>
  );
};
