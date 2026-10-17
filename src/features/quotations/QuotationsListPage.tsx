import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Quotation } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [
      'quotations',
      selectedBranchId,
      selectedFranchiseId,
      search,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: () =>
      salesService.getQuotations({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        search: search || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const columns: Column<Quotation>[] = [
    { header: 'Quote #', accessorKey: 'quotationNumber', className: 'font-mono text-xs font-semibold text-blue-600' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Vehicle Spec', accessorKey: 'vehicleModel' },
    {
      header: 'Line Items',
      cell: (row) => `${row.items ? row.items.length : 1} items`,
    },
    {
      header: 'Total Amount',
      cell: (row) => `₹${row.totalAmount.toLocaleString()}`,
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
    <div className="space-y-6">
      <PageHeader
        title="Fleet Quotations"
        subtitle={`Commercial truck proposals for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Sales', href: '/sales' }, { label: 'Quotations' }]}
        actions={
          <button
            onClick={() => navigate('/sales/quotations/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create New Quotation
          </button>
        }
      />

      <BranchFilterBar
        searchPlaceholder="Search quotation # or customer..."
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={[
          { label: 'All Statuses', value: 'ALL' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Accepted', value: 'ACCEPTED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Expired', value: 'EXPIRED' },
        ]}
        showDateRange={true}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        onReset={() => {
          setSearch('');
          setSelectedStatus('ALL');
          setStartDate('');
          setEndDate('');
        }}
      />

      <DataTable<Quotation>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No quotations found"
        emptyDescription="No quotation records match your active branch and filter criteria."
        emptyActionLabel="Generate Quotation"
        onEmptyAction={() => navigate('/sales/quotations/new')}
      />
    </div>
  );
};
