import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Vehicle } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { Plus, LayoutGrid, Table, Filter, Archive } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

export const VehiclesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole, permissions } = useAuth();
  const isCustomer = activeRole === 'CUSTOMER';
  const canManage = permissions.canManageInventory || permissions.canManageBranches;

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterMake, setFilterMake] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles(),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => vehicleService.updateVehicleStatus(id, 'BLOCKED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: any) => {
      setActionError(err?.message || 'Failed to archive vehicle.');
    },
  });

  const handleBlock = (vehicle: Vehicle) => {
    if (confirm(`Archive vehicle ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})? It will be marked as BLOCKED.`)) {
      blockMutation.mutate(vehicle.id);
    }
  };

  // Default demo vehicles when backend has 0 registered vehicles for user view
  const defaultCustomerVehicles: Vehicle[] = [
    {
      id: 'veh-01',
      vin: 'MAT482500K982401',
      make: 'Ashok Leyland',
      model: '4825 10x4 Tipper',
      variant: 'BS6 Heavy Tipper',
      vehicleType: 'Tipper Truck',
      year: 2026,
      color: 'White',
      fuelType: 'diesel',
      transmission: 'manual',
      franchiseId: 'fr-ashok-leyland',
      franchiseName: 'Ashok Leyland',
      branchId: 'br-jaipur',
      branchName: 'Jaipur Branch',
      sellingPrice: 4850000,
      status: 'available',
      registrationNumber: 'RJ-14-EA-4825',
      photos: ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80'],
      primaryPhoto: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'veh-02',
      vin: 'MAT553000K110482',
      make: 'Tata Motors',
      model: 'Prima 5530.S Trailer',
      variant: 'Cummins 300HP',
      vehicleType: 'Tractor Trailer',
      year: 2026,
      color: 'Yellow',
      fuelType: 'diesel',
      transmission: 'manual',
      franchiseId: 'fr-tata',
      franchiseName: 'Tata Motors',
      branchId: 'br-jodhpur',
      branchName: 'Jodhpur Branch',
      sellingPrice: 5100000,
      status: 'available',
      registrationNumber: 'RJ-14-GA-5530',
      photos: ['https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&w=1200&q=80'],
      primaryPhoto: 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString(),
    },
  ];

  const fetchedVehicles = data?.data || [];
  const vehicles = fetchedVehicles.length > 0 ? fetchedVehicles : defaultCustomerVehicles;

  const filteredVehicles = vehicles.filter((v) => {
    if (filterMake !== 'ALL' && v.make !== filterMake) return false;
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    return true;
  });

  const columns: Column<Vehicle>[] = [
    { header: 'VIN / Reg', cell: (row) => (
      <div>
        <span className="font-mono font-bold text-zinc-900 block">{row.registrationNumber || 'Reg Pending'}</span>
        <span className="font-mono text-[10px] text-zinc-400">VIN: {row.vin}</span>
      </div>
    )},
    {
      header: 'Manufacturer & Model',
      cell: (row) => (
        <div>
          <span className="font-bold text-[#111111] block">
            {row.manufacturingYear || row.year} {row.make} {row.model}
          </span>
          <span className="text-xs text-zinc-500">{row.vehicleType}</span>
        </div>
      ),
    },
    { header: 'Fuel / Type', cell: (row) => (
      <span className="capitalize font-mono text-xs text-zinc-700">{row.fuelType} • {row.color || '—'}</span>
    )},
    { header: 'Branch Location', accessorKey: 'branchName' },
    {
      header: 'Ex-Showroom Price',
      cell: (row) => `₹${(row.sellingPrice || 0).toLocaleString('en-IN')}`,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/inventory/vehicles/${row.id}`)}
            className="text-xs font-semibold text-[#111111] hover:text-[#F5A800] underline"
          >
            View →
          </button>
          {canManage && row.status !== 'BLOCKED' && row.status !== 'SOLD' && (
            <button
              onClick={() => handleBlock(row)}
              disabled={blockMutation.isPending}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-600 font-medium disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}
      <PageHeader
        title={isCustomer ? 'My Vehicles' : 'Vehicle Inventory Stock'}
        subtitle={
          isCustomer
            ? 'Your active commercial vehicle fleet, registration details, compliance certificates, and service schedule'
            : 'Commercial truck stock pool, chassis inventory, and spec registry'
        }
        breadcrumbItems={isCustomer ? [{ label: 'My Vehicles' }] : [{ label: 'Inventory' }, { label: 'Vehicles' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Grid Showcase"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" /> Table
              </button>
            </div>

            {!isCustomer && (
              <button
                onClick={() => navigate('/inventory/vehicles/new')}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Vehicle Asset
              </button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="cockpit-card p-3 rounded-xl border border-[#E5E5E5] bg-white flex flex-wrap items-center gap-3 text-xs">
        <span className="text-zinc-500 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#F5A800]" /> Filter Inventory:
        </span>
        <select
          value={filterMake}
          onChange={(e) => setFilterMake(e.target.value)}
          className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-900 focus:outline-none"
        >
          <option value="ALL">All Manufacturers</option>
          <option value="Ashok Leyland">Ashok Leyland</option>
          <option value="Tata Motors">Tata Motors</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-900 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="available">Available Stock</option>
          <option value="reserved">Reserved</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => navigate(`/inventory/vehicles/${vehicle.id}`)}
              className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white cursor-pointer overflow-hidden flex flex-col justify-between hover:border-zinc-300 transition-all shadow-xs group"
            >
              {/* Vehicle Image Header */}
              <div className="w-full h-44 bg-zinc-900 border-b border-zinc-200 overflow-hidden relative">
                <img
                  src={vehicle.primaryPhoto || vehicle.photos?.[0] || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80'}
                  alt={vehicle.model}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/80 text-[#F5A800] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {vehicle.make}
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={vehicle.status} />
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                    Reg: {vehicle.registrationNumber || 'Registration Pending'}
                  </span>
                  <h4 className="text-base font-bold text-[#111111] group-hover:text-[#F5A800] transition-colors mt-0.5">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h4>
                  <p className="text-xs text-zinc-500">{vehicle.vehicleType}</p>
                </div>

                <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 font-mono text-[11px] grid grid-cols-2 gap-2 text-zinc-700">
                  <div>
                    <span className="text-[9px] uppercase text-zinc-400 block font-sans">VIN</span>
                    <span className="font-semibold text-zinc-900 truncate block">{vehicle.vin}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-zinc-400 block font-sans">Branch</span>
                    <span className="font-semibold text-zinc-900 truncate block">{vehicle.branchName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs font-mono">
                  <span className="text-xs text-zinc-500 font-sans">Ex-Showroom:</span>
                  <span className="font-bold text-zinc-900 text-sm">
                    ₹{(vehicle.sellingPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable<Vehicle>
          columns={columns}
          data={filteredVehicles}
          isLoading={isLoading}
          emptyTitle="No commercial vehicles found"
          emptyDescription="There are no vehicle assets matching your criteria."
        />
      )}
    </div>
  );
};
