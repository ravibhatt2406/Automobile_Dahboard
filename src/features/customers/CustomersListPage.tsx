import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Customer } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { UserPlus } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const CustomersListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });

  const columns: Column<Customer>[] = [
    {
      header: 'Company / Customer',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-100 block">{row.companyName}</span>
          <span className="text-xs text-slate-400">{row.contactPerson}</span>
        </div>
      ),
    },
    { header: 'Email', accessorKey: 'email', className: 'font-mono text-xs' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Fleet Size', accessorKey: 'fleetSize' },
    { header: 'Customer Type', accessorKey: 'customerType', className: 'capitalize' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/customers/${row.id}`)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          View Account
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Commercial Fleet Clients"
        subtitle="Corporate accounts, logistics operators, and retail customers"
        breadcrumbItems={[{ label: 'Customers' }]}
        actions={
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
            <UserPlus className="w-4 h-4" /> Add Customer Account
          </button>
        }
      />

      <DataTable<Customer>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No customers found"
        emptyDescription="No customer accounts exist in the database."
        emptyActionLabel="Create Customer Account"
        onEmptyAction={() => {}}
      />
    </div>
  );
};
