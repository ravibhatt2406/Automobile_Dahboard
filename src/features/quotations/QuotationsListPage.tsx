import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Quotation } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => salesService.getQuotations(),
  });

  const columns: Column<Quotation>[] = [
    { header: 'Quote #', accessorKey: 'quotationNumber', className: 'font-mono text-xs font-semibold text-blue-400' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Vehicle Spec', accessorKey: 'vehicleModel' },
    {
      header: 'Line Items',
      cell: (row) => `${row.items ? row.items.length : 1} items`,
    },
    {
      header: 'Total Amount',
      cell: (row) => `$${row.totalAmount.toLocaleString()}`,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/sales/quotations/${row.id}`)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            View
          </button>
          <button
            onClick={() =>
              navigate(
                `/customer/chat?branchId=${(row as any).branchId || ''}&contextType=QUOTATION&contextId=${row.id}&subject=Quotation%20%23${row.quotationNumber}`
              )
            }
            className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold"
            title="Chat regarding this quotation"
          >
            Chat
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fleet Quotations"
        subtitle="Commercial truck proposals, pricing estimations, and tax breakdowns"
        breadcrumbItems={[{ label: 'Sales', href: '/sales' }, { label: 'Quotations' }]}
        actions={
          <button
            onClick={() => navigate('/sales/quotations/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Create New Quotation
          </button>
        }
      />

      <DataTable<Quotation>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No report data available"
        emptyDescription="No quotation records exist in the database."
        emptyActionLabel="Generate Quotation"
        onEmptyAction={() => navigate('/sales/quotations/new')}
      />
    </div>
  );
};
