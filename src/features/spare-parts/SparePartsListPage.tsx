import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { SparePart } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { sparePartsService } from '@/services/spare-parts.service';
import { Package, Plus, Sliders } from 'lucide-react';
import { StockAdjustmentModal } from './StockAdjustmentModal';

export const SparePartsListPage: React.FC = () => {
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['spareParts'],
    queryFn: () => sparePartsService.getSpareParts(),
  });

  const handleOpenAdjust = (part: SparePart) => {
    setSelectedPart(part);
    setIsAdjustModalOpen(true);
  };

  const columns: Column<SparePart>[] = [
    { header: 'Part #', accessorKey: 'partNumber', className: 'font-mono text-xs font-semibold text-blue-400' },
    { header: 'Part Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Brand', accessorKey: 'brand' },
    {
      header: 'Unit Price',
      cell: (row) => `$${row.unitPrice.toLocaleString()}`,
    },
    { header: 'Stock Qty', accessorKey: 'stockQuantity', className: 'font-mono' },
    { header: 'Reorder Level', accessorKey: 'reorderLevel', className: 'font-mono text-slate-400' },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleOpenAdjust(row)}
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          <Sliders className="w-3.5 h-3.5" /> Adjust Stock
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Spare Parts Inventory"
        subtitle="OEM replacement components, service filters, engine spares, and rack locations"
        breadcrumbItems={[{ label: 'Spare Parts' }]}
        actions={
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Spare Part SKU
          </button>
        }
      />

      <DataTable<SparePart>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No spare parts found"
        emptyDescription="No component part numbers or warehouse stock records exist in the database."
        emptyActionLabel="Add Part Catalog Entry"
        onEmptyAction={() => {}}
      />

      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        part={selectedPart}
        onSubmit={(adj) => {
          console.log('Saved Stock Adjustment:', adj);
        }}
      />
    </div>
  );
};
