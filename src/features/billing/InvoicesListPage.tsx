import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Invoice } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [
      'invoices',
      selectedBranchId,
      selectedFranchiseId,
      search,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: () =>
      billingService.getInvoices({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const columns: Column<Invoice>[] = [
    { header: 'Invoice #', accessorKey: 'invoiceNumber', className: 'font-mono text-xs font-semibold' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Billing Type', accessorKey: 'type', className: 'capitalize' },
    {
      header: 'Total Amount',
      cell: (row) => `₹${row.totalAmount.toLocaleString()}`,
    },
    {
      header: 'Balance Due',
      cell: (row) => `₹${row.balanceDue.toLocaleString()}`,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/billing/invoices/${row.id}`)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
        >
          View Invoice
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Tax Invoices"
        subtitle={`Vehicle sale, service repair, and spare parts billing for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Billing' }, { label: 'Invoices' }]}
      />

      <BranchFilterBar
        searchPlaceholder="Filter invoices..."
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={[
          { label: 'All Statuses', value: 'ALL' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Issued', value: 'ISSUED' },
          { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Cancelled', value: 'CANCELLED' },
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

      <DataTable<Invoice>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No invoices found"
        emptyDescription="No tax invoices or billing ledgers match your active branch and filter criteria."
      />
    </div>
  );
};
