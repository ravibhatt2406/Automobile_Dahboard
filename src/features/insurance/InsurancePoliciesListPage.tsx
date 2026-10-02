import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { InsurancePolicy } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { insuranceService } from '@/services/insurance.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Plus, ShieldCheck } from 'lucide-react';
import { PolicyFormModal } from './PolicyFormModal';

export const InsurancePoliciesListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['insurancePolicies'],
    queryFn: () => insuranceService.getPolicies(),
  });

  const handleCreate = () => {
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  const columns: Column<InsurancePolicy>[] = [
    { header: 'Policy #', accessorKey: 'policyNumber', className: 'font-mono text-xs font-semibold text-emerald-400' },
    { header: 'Provider', accessorKey: 'provider' },
    { header: 'Vehicle VIN', accessorKey: 'vehicleVin', className: 'font-mono text-xs text-blue-400' },
    { header: 'Coverage', accessorKey: 'type', className: 'capitalize' },
    {
      header: 'Premium',
      cell: (row) => `$${row.premiumAmount.toLocaleString()}`,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Commercial Fleet Insurance"
        subtitle="Commercial carrier liability, hull insurance, and policy coverage"
        breadcrumbItems={[{ label: 'Insurance' }]}
        actions={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Issue Insurance Policy
          </button>
        }
      />

      <DataTable<InsurancePolicy>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No insurance policies registered"
        emptyDescription="No active fleet insurance policies exist in the database."
        emptyActionLabel="Create Insurance Policy"
        onEmptyAction={handleCreate}
      />

      <PolicyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingPolicy}
        onSubmit={(formData) => {
          console.log('Saved Insurance Policy:', formData);
          refetch();
        }}
      />
    </div>
  );
};
