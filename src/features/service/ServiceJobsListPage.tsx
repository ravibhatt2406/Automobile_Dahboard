import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { ServiceJob } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { serviceManagementService } from '@/services/service.service';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const ServiceJobsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['serviceJobs'],
    queryFn: () => serviceManagementService.getServiceJobs(),
  });

  const columns: Column<ServiceJob>[] = [
    { header: 'Job Card #', accessorKey: 'jobCardNumber', className: 'font-mono text-xs font-semibold' },
    { header: 'Vehicle VIN', accessorKey: 'vehicleVin', className: 'font-mono text-xs text-blue-400' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Service Type', accessorKey: 'serviceType', className: 'capitalize' },
    { header: 'Assigned Mechanic', accessorKey: 'mechanicName' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/service/jobs/${row.id}`)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          Worksheet
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service Repair Jobs"
        subtitle="Workshop job cards, diagnostics, overhaul records, and maintenance logs"
        breadcrumbItems={[{ label: 'Service' }, { label: 'Jobs' }]}
        actions={
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Open New Job Card
          </button>
        }
      />

      <DataTable<ServiceJob>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No service jobs available"
        emptyDescription="No active workshop repair job cards exist in the database."
        emptyActionLabel="Open Repair Card"
        onEmptyAction={() => {}}
      />
    </div>
  );
};
