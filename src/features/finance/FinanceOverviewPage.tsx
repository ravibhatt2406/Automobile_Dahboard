import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { FinanceApplication } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';

export const FinanceOverviewPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['financeApplications'],
    queryFn: () => financeService.getApplications(),
  });

  const columns: Column<FinanceApplication>[] = [
    { header: 'App #', accessorKey: 'applicationNumber', className: 'font-mono text-xs font-semibold text-blue-400' },
    { header: 'Customer', accessorKey: 'customerName' },
    {
      header: 'Requested Loan Amount',
      cell: (row) => `$${row.loanAmount.toLocaleString()}`,
    },
    { header: 'Lender Partner', accessorKey: 'provider' },
    { header: 'Tenure (Months)', accessorKey: 'tenureMonths' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fleet Commercial Financing"
        subtitle="Commercial truck credit applications, lender underwriting, and lease financing"
        breadcrumbItems={[{ label: 'Finance' }, { label: 'Applications' }]}
      />

      <DataTable<FinanceApplication>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No financial applications found"
        emptyDescription="No commercial credit or fleet leasing applications have been submitted."
      />
    </div>
  );
};
