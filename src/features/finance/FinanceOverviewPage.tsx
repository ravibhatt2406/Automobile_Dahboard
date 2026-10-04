import React, { useMemo } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { FinanceApplication } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';

export const FinanceOverviewPage: React.FC = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ['financeApplications'],
    queryFn: () => financeService.getApplications(),
  });

  const applicationsList = useMemo(() => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    const resAny = response as any;
    if (Array.isArray(resAny.data)) return resAny.data;
    if (Array.isArray(resAny.items)) return resAny.items;
    return [];
  }, [response]);

  const columns: Column<FinanceApplication>[] = [
    { header: 'App #', accessorKey: 'applicationNumber', className: 'font-mono text-xs font-semibold text-blue-400' },
    {
      header: 'Customer',
      cell: (row) =>
        row.customerName ||
        ((row as any).customer?.firstName
          ? `${(row as any).customer.firstName} ${(row as any).customer.lastName || ''}`
          : '--'),
    },
    {
      header: 'Requested Loan Amount',
      cell: (row) => (row.loanAmount != null ? `$${Number(row.loanAmount).toLocaleString()}` : '--'),
    },
    {
      header: 'Lender Partner',
      cell: (row) => row.provider || (row as any).financeProvider || '--',
    },
    {
      header: 'Tenure (Months)',
      cell: (row) => (row.tenureMonths != null ? String(row.tenureMonths) : '--'),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status || 'applied'} />,
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
        data={applicationsList}
        isLoading={isLoading}
        emptyTitle="No financial applications found"
        emptyDescription="No commercial credit or fleet leasing applications have been submitted."
      />
    </div>
  );
};
