import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { SparePart } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sparePartsService } from '@/services/spare-parts.service';
import { branchService } from '@/services/branch.service';
import { Package, Plus, Sliders, Search, AlertCircle, Edit, Building, Layers, DollarSign, X, RefreshCw } from 'lucide-react';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { useAuth } from '@/app/providers/AuthContext';

export const SparePartsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const isCustomer = activeRole === 'CUSTOMER';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Modals state
  const [selectedPart, setSelectedPart] = useState<any | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isEditPartModalOpen, setIsEditPartModalOpen] = useState(false);
  const [isViewPartModalOpen, setIsViewPartModalOpen] = useState(false);

  // Form state
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('BRAKES');
  const [partManufacturer, setPartManufacturer] = useState('Titan Genuine Parts');
  const [partUnitPrice, setPartUnitPrice] = useState('');
  const [partGstRate, setPartGstRate] = useState('18');
  const [partDesc, setPartDesc] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Query parts
  const { data: partsData, isLoading, error: queryError } = useQuery({
    queryKey: ['spareParts', search, selectedCategory, selectedBranch],
    queryFn: () =>
      sparePartsService.getSpareParts({
        search: search || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        branchId: selectedBranch !== 'ALL' ? selectedBranch : undefined,
      }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });
  const branches = branchesData?.data || [];

  const partsList = partsData?.data || [];
  const totalCount = partsData?.total ?? partsList.length;
  const totalStockUnits = partsList.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const lowStockCount = partsList.filter((p) => (p.stockQuantity || 0) <= (p.reorderLevel || 5)).length;
  const totalValue = partsList.reduce((acc, p) => acc + (p.stockQuantity || 0) * (p.unitPrice || 0), 0);

  // Create Part Mutation
  const createPartMutation = useMutation({
    mutationFn: (data: any) => sparePartsService.createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      setIsAddPartModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err?.message || 'Failed to create spare part SKU');
    },
  });

  // Edit Part Mutation
  const updatePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => sparePartsService.updatePart(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      setIsEditPartModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err?.message || 'Failed to update spare part');
    },
  });

  const resetForm = () => {
    setPartNumber('');
    setPartName('');
    setPartCategory('BRAKES');
    setPartManufacturer('Titan Genuine Parts');
    setPartUnitPrice('');
    setPartGstRate('18');
    setPartDesc('');
    setModalError(null);
    setSelectedPart(null);
  };

  const openEditModal = (part: any) => {
    setSelectedPart(part);
    setPartNumber(part.partNumber);
    setPartName(part.name);
    setPartCategory(part.category || 'BRAKES');
    setPartManufacturer(part.manufacturer || part.brand || 'Titan Genuine Parts');
    setPartUnitPrice(String(part.unitPrice || ''));
    setPartGstRate(String(part.gstRate || '18'));
    setPartDesc(part.description || '');
    setModalError(null);
    setIsEditPartModalOpen(true);
  };

  const openViewModal = (part: any) => {
    setSelectedPart(part);
    setIsViewPartModalOpen(true);
  };

  const handleOpenAdjust = (part: any) => {
    setSelectedPart(part);
    setIsAdjustModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumber.trim()) {
      setModalError('Part number is required');
      return;
    }
    if (!partName.trim()) {
      setModalError('Part name is required');
      return;
    }
    const price = Number(partUnitPrice);
    if (isNaN(price) || price <= 0) {
      setModalError('Unit price must be greater than zero');
      return;
    }

    createPartMutation.mutate({
      partNumber: partNumber.trim().toUpperCase(),
      name: partName.trim(),
      category: partCategory,
      manufacturer: partManufacturer.trim(),
      unitPrice: price,
      gstRate: Number(partGstRate) || 18,
      description: partDesc.trim() || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    const price = Number(partUnitPrice);
    if (isNaN(price) || price <= 0) {
      setModalError('Unit price must be greater than zero');
      return;
    }

    updatePartMutation.mutate({
      id: selectedPart.id,
      data: {
        name: partName.trim(),
        category: partCategory,
        manufacturer: partManufacturer.trim(),
        unitPrice: price,
        gstRate: Number(partGstRate) || 18,
        description: partDesc.trim() || undefined,
      },
    });
  };

  const columns: Column<any>[] = [
    {
      header: 'Part #',
      accessorKey: 'partNumber',
      className: 'font-mono text-xs font-bold text-blue-600',
      cell: (row) => (
        <button
          onClick={() => openViewModal(row)}
          className="text-blue-600 font-mono font-bold hover:underline text-left"
        >
          {row.partNumber}
        </button>
      ),
    },
    {
      header: 'Part Name & Brand',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-zinc-900 block">{row.name}</span>
          <span className="text-[10px] text-zinc-500 block">{row.manufacturer || row.brand}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[11px] font-semibold uppercase">
          {row.category || 'General'}
        </span>
      ),
    },
    {
      header: 'Unit Price',
      cell: (row) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-zinc-900">₹{(row.unitPrice || 0).toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-zinc-400 block font-sans">GST: {row.gstRate || 18}%</span>
        </div>
      ),
    },
    {
      header: 'Branch Stock',
      accessorKey: 'stockQuantity',
      cell: (row) => {
        const qty = row.stockQuantity ?? 0;
        const isLow = qty <= (row.reorderLevel || 5);
        return (
          <div className="font-mono text-xs">
            <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-zinc-900'}`}>{qty} units</span>
            {isLow && <span className="text-[10px] text-amber-500 block font-sans">Low Stock</span>}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {!isCustomer && (
            <>
              <button
                onClick={() => handleOpenAdjust(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-xs font-semibold transition-colors"
              >
                <Sliders className="w-3 h-3 text-[#F5A800]" /> Adjust Stock
              </button>
              <button
                onClick={() => openEditModal(row)}
                className="p-1 text-zinc-400 hover:text-zinc-800 transition-colors"
                title="Edit Part"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => openViewModal(row)}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spare Parts Inventory"
        subtitle="Catalogue SKUs, warehouse bin locations, real-time stock balances, and overhaul consumption"
        breadcrumbItems={[{ label: 'Spare Parts' }]}
        actions={
          !isCustomer && (
            <button
              onClick={() => {
                resetForm();
                setIsAddPartModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Spare Part SKU
            </button>
          )
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-500" /> Total Catalogue SKUs
          </span>
          <span className="text-2xl font-bold font-mono text-zinc-900 block">{totalCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-500" /> Total Units In Stock
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-600 block">{totalStockUnits}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Reorder Level Alerts
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 block">{lowStockCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Valuation (Est. INR)
          </span>
          <span className="text-2xl font-bold font-mono text-indigo-600 block">₹{totalValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by part number, name, or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
          >
            <option value="ALL">All Categories</option>
            <option value="BRAKES">Brakes</option>
            <option value="ENGINE">Engine & Powertrain</option>
            <option value="TRANSMISSION">Transmission</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="FILTERS">Filters & Fluids</option>
            <option value="SUSPENSION">Suspension</option>
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-medium py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
          >
            <option value="ALL">All Branch Warehouses</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {queryError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Failed to load spare parts catalogue: {(queryError as any)?.message || 'Server error'}</span>
        </div>
      )}

      {/* Table */}
      <DataTable<any>
        columns={columns}
        data={partsList}
        isLoading={isLoading}
        emptyTitle="No spare parts found"
        emptyDescription="No component part numbers match the current search filters."
        emptyActionLabel={!isCustomer ? "Add Spare Part SKU" : undefined}
        onEmptyAction={() => {
          resetForm();
          setIsAddPartModalOpen(true);
        }}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        part={selectedPart}
      />

      {/* Modal: Add Part */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Add Spare Part to Catalogue</h3>
              <button onClick={() => setIsAddPartModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Part Number (SKU) *</label>
                  <input
                    type="text"
                    placeholder="e.g. PRT-BRK-1001"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg uppercase font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Category *</label>
                  <select
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  >
                    <option value="BRAKES">Brakes</option>
                    <option value="ENGINE">Engine & Powertrain</option>
                    <option value="TRANSMISSION">Transmission</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="FILTERS">Filters & Fluids</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="BODY">Body & Frame</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Part Name / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Haulage Ceramic Brake Pad Kit"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={partManufacturer}
                    onChange={(e) => setPartManufacturer(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 8500"
                    value={partUnitPrice}
                    onChange={(e) => setPartUnitPrice(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={partGstRate}
                    onChange={(e) => setPartGstRate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Description & Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Commercial truck specification, compatibility notes, and OEM standards..."
                  value={partDesc}
                  onChange={(e) => setPartDesc(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPartMutation.isPending}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createPartMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save SKU to Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Part */}
      {isEditPartModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Edit Spare Part: {partNumber}</h3>
              <button onClick={() => setIsEditPartModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Part Name *</label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Category</label>
                  <select
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  >
                    <option value="BRAKES">Brakes</option>
                    <option value="ENGINE">Engine & Powertrain</option>
                    <option value="TRANSMISSION">Transmission</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="FILTERS">Filters & Fluids</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="BODY">Body & Frame</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={partManufacturer}
                    onChange={(e) => setPartManufacturer(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    value={partUnitPrice}
                    onChange={(e) => setPartUnitPrice(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={partGstRate}
                    onChange={(e) => setPartGstRate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={partDesc}
                  onChange={(e) => setPartDesc(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditPartModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePartMutation.isPending}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updatePartMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Update Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Part Details & Branch Stocks */}
      {isViewPartModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">{selectedPart.name}</h3>
                <span className="font-mono text-xs text-blue-600 block">Part #: {selectedPart.partNumber}</span>
              </div>
              <button onClick={() => setIsViewPartModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-mono">
                <div>
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Unit Price</span>
                  <span className="font-bold text-zinc-900 text-sm">₹{(selectedPart.unitPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Total In Stock</span>
                  <span className="font-bold text-emerald-600 text-sm">{selectedPart.stockQuantity ?? 0} units</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Manufacturer</span>
                  <span className="font-semibold text-zinc-800">{selectedPart.manufacturer || selectedPart.brand}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Category</span>
                  <span className="font-semibold text-zinc-800">{selectedPart.category || 'General'}</span>
                </div>
              </div>

              {selectedPart.description && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-700">
                  <span className="text-zinc-400 text-[10px] uppercase font-mono block mb-1">Description</span>
                  {selectedPart.description}
                </div>
              )}

              <div>
                <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#F5A800]" /> Stock Balances by Branch
                </h4>
                {Array.isArray(selectedPart.stocks) && selectedPart.stocks.length > 0 ? (
                  <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden font-mono">
                    {selectedPart.stocks.map((st: any) => (
                      <div key={st.id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                        <span className="font-semibold text-zinc-800">{st.branch?.name || st.branchId}</span>
                        <span className="font-bold text-zinc-900">{st.quantityOnHand} on hand</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-400 italic">
                    No branch stock records allocated for this SKU yet. Use Adjust Stock to initialize.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                onClick={() => {
                  setIsViewPartModalOpen(false);
                  handleOpenAdjust(selectedPart);
                }}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg"
              >
                Adjust Stock for Part
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
