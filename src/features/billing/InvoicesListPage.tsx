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

import { FileText, Plus } from 'lucide-react';

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
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      className: 'font-mono text-xs font-semibold text-zinc-900',
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-zinc-900 block">
            {row.customer?.name || row.customer?.companyName || row.customerName || 'Direct Customer'}
          </span>
          {row.customer?.phone && (
            <span className="text-[10px] text-zinc-400 block">{row.customer.phone}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Branch',
      cell: (row) => row.branch?.name || activeBranchName,
      className: 'text-xs text-zinc-600',
    },
    {
      header: 'Billing Type',
      cell: (row) => {
        if (row.bookingId) return 'Vehicle Sale';
        if (
          row.serviceJobs?.length ||
          row.items?.some(
            (i) =>
              i.description.includes('Service') ||
              i.description.includes('Labour') ||
              i.description.includes('Part:'),
          )
        ) {
          return 'Service Job';
        }
        return 'Parts & Commercial';
      },
      className: 'capitalize text-xs font-medium text-zinc-700',
    },
    {
      header: 'Total Amount',
      cell: (row) => `₹${Number(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      className: 'font-mono text-xs font-bold text-zinc-900',
    },
    {
      header: 'Balance Due',
      cell: (row) => {
        const paid = (row.payments || [])
          .filter((p: any) => p.status === 'SUCCESS')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const bal = Math.max(
          0,
          Number(row.totalAmount || 0) -
            (row.paymentStatus === 'PAID' ? Number(row.totalAmount || 0) : paid),
        );
        return (
          <span className={`font-mono text-xs font-bold ${bal > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={row.status} />
          {row.paymentStatus && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                row.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : row.paymentStatus === 'PARTIALLY_PAID'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              {row.paymentStatus}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/billing/invoices/${row.id}`)}
            className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-black text-[#F5A800] rounded-lg font-bold transition-all shadow-xs"
          >
            View
          </button>
          <a
            href={billingService.getPrintableInvoiceUrl(row.id)}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-zinc-500 hover:text-zinc-900 rounded hover:bg-zinc-100 transition-colors"
            title="Printable Statement"
          >
            <FileText className="w-3.5 h-3.5" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Tax Invoices"
        subtitle={`Vehicle sale, service repair, and spare parts billing for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Billing' }, { label: 'Invoices' }]}
        actions={
          <button
            onClick={() => navigate('/billing/invoices/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Issue Invoice
          </button>
        }
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
