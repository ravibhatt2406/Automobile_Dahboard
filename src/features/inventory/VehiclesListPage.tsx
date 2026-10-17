import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Vehicle } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { branchService } from '@/services/branch.service';
import { catalogueService } from '@/services/catalogue.service';
import { Plus, LayoutGrid, Table, Filter, Archive, Search, RefreshCw, AlertTriangle, Building, Truck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

export const VehiclesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole, permissions } = useAuth();
  const {
    selectedBranchId,
    selectedFranchiseId,
    activeBranchName,
    activeFranchiseName,
  } = useScope();

  const isCustomer = activeRole === 'CUSTOMER';
  const canManage = permissions.canManageInventory || permissions.canManageBranches;

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterVariant, setFilterVariant] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Fetch variants for filter
  const { data: variants = [] } = useQuery({
    queryKey: ['catalogVariants'],
    queryFn: () => catalogueService.getVariants(),
    enabled: !isCustomer,
  });

  // 2. Fetch real stock summary metrics from backend synchronized with scope
  const { data: stockSummary } = useQuery({
    queryKey: ['stockSummary', selectedBranchId, selectedFranchiseId],
    queryFn: () =>
      vehicleService.getStockSummary(
        selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      ),
    enabled: !isCustomer,
  });

  // 3. Fetch vehicles with real branch, franchise, and status filters
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vehicles', searchTerm, selectedBranchId, selectedFranchiseId, filterVariant, filterStatus],
    queryFn: () =>
      vehicleService.getVehicles({
        search: searchTerm.trim() || undefined,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        variantId: filterVariant !== 'ALL' ? filterVariant : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
      }),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => vehicleService.updateVehicleStatus(id, 'BLOCKED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['stockSummary'] });
    },
    onError: (err: any) => {
      setActionError(err?.message || 'Failed to archive vehicle asset.');
    },
  });

  const handleBlock = (vehicle: Vehicle) => {
    if (confirm(`Archive vehicle ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin})? It will be marked as BLOCKED.`)) {
      blockMutation.mutate(vehicle.id);
    }
  };

  const vehicles = data?.data || [];

  const columns: Column<Vehicle>[] = [
    {
      header: 'VIN / Reg',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-zinc-900 block">{row.registrationNumber || 'Reg Pending'}</span>
          <span className="font-mono text-[10px] text-zinc-400">VIN: {row.vin}</span>
        </div>
      ),
    },
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
    {
      header: 'Fuel / Type',
      cell: (row) => (
        <span className="capitalize font-mono text-xs text-zinc-700">
          {row.fuelType} • {row.color || '—'}
        </span>
      ),
    },
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
          {canManage && (
            <button
              onClick={() => navigate(`/inventory/vehicles/${row.id}/edit`)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
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
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="underline ml-2 font-semibold">Dismiss</button>
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Failed to load vehicles from PostgreSQL: {(error as any)?.message || 'Database connection error'}</span>
          </div>
          <button onClick={() => refetch()} className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors">
            Retry
          </button>
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

            {!isCustomer && canManage && (
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

      {/* Stock Summary Metrics Cards (from real backend counts) */}
      {!isCustomer && stockSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-white shadow-xs">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block font-semibold">Total Stock</span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">{stockSummary.totalVehicles}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block font-semibold">In Stock (Available)</span>
            <span className="text-xl font-bold font-mono text-emerald-800 mt-0.5 block">{stockSummary.inStock}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
            <span className="text-[10px] uppercase font-mono text-amber-700 block font-semibold">Reserved / Allocated</span>
            <span className="text-xl font-bold font-mono text-amber-800 mt-0.5 block">{stockSummary.reserved + stockSummary.allocated}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-xs">
            <span className="text-[10px] uppercase font-mono text-blue-700 block font-semibold">Under Service / PDI</span>
            <span className="text-xl font-bold font-mono text-blue-800 mt-0.5 block">{stockSummary.service + stockSummary.pdiPending}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 shadow-xs">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block font-semibold">Delivered / Sold</span>
            <span className="text-xl font-bold font-mono text-zinc-800 mt-0.5 block">{stockSummary.delivered + stockSummary.sold}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-[#F5A800]/30 bg-amber-500/5 shadow-xs">
            <span className="text-[10px] uppercase font-mono text-amber-800 block font-semibold">Available Valuation</span>
            <span className="text-base font-bold font-mono text-[#111111] mt-1 block truncate">
              ₹{(stockSummary.totalValue / 10000000).toFixed(2)} Cr
            </span>
          </div>
        </div>
      )}

      {/* Unified Cascading Branch & Filter Bar */}
      <BranchFilterBar
        searchPlaceholder="Search by VIN, Engine #, Model or Color..."
        searchValue={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        statusValue={filterStatus === 'ALL' ? '' : filterStatus}
        onStatusChange={(v) => setFilterStatus(v || 'ALL')}
        statusOptions={[
          { label: 'In Stock (Available)', value: 'IN_STOCK' },
          { label: 'Reserved', value: 'RESERVED' },
          { label: 'Allocated', value: 'ALLOCATED' },
          { label: 'PDI Pending', value: 'PDI_PENDING' },
          { label: 'PDI Completed', value: 'PDI_COMPLETED' },
          { label: 'Under Service', value: 'SERVICE' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Sold', value: 'SOLD' },
          { label: 'Archived / Blocked', value: 'BLOCKED' },
        ]}
        extraFilters={
          !isCustomer && (
            <select
              value={filterVariant}
              onChange={(e) => setFilterVariant(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Truck Variants</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                  {v.name}
                </option>
              ))}
            </select>
          )
        }
        onReset={() => {
          setSearchTerm('');
          setFilterVariant('ALL');
          setFilterStatus('ALL');
        }}
      />

      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-white rounded-xl border border-zinc-200">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#F5A800]" />
          Loading vehicle inventory records from PostgreSQL...
        </div>
      ) : viewMode === 'grid' ? (
        vehicles.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 bg-white rounded-xl border border-zinc-200">
            <Truck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="font-semibold text-zinc-700">No commercial vehicles match current search or filter criteria.</p>
            <p className="text-zinc-400 mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
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
        )
      ) : (
        <DataTable<Vehicle>
          columns={columns}
          data={vehicles}
          isLoading={isLoading}
          emptyTitle="No commercial vehicles found"
          emptyDescription="There are no vehicle assets matching your criteria."
        />
      )}
    </div>
  );
};
