import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Invoice } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingService.getInvoices(),
  });

  const columns: Column<Invoice>[] = [
    { header: 'Invoice #', accessorKey: 'invoiceNumber', className: 'font-mono text-xs font-semibold' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Billing Type', accessorKey: 'type', className: 'capitalize' },
    {
      header: 'Total Amount',
      cell: (row) => `$${row.totalAmount.toLocaleString()}`,
    },
    {
      header: 'Balance Due',
      cell: (row) => `$${row.balanceDue.toLocaleString()}`,
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
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          View Invoice
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Billing & Tax Invoices"
        subtitle="Vehicle sale invoices, service repair bills, and spare parts billing"
        breadcrumbItems={[{ label: 'Billing' }, { label: 'Invoices' }]}
      />

      <DataTable<Invoice>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No invoices found"
        emptyDescription="No tax invoices or billing ledgers exist in the database."
      />
    </div>
  );
};
