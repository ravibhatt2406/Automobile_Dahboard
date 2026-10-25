import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { DeliveryRecord } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/services/delivery.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useScope } from '@/app/providers/ScopeContext';

export const DeliveriesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', selectedBranchId, selectedFranchiseId],
    queryFn: () =>
      deliveryService.getDeliveries({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      }),
  });

  const columns: Column<DeliveryRecord>[] = [
    { header: 'Delivery #', accessorKey: 'deliveryNumber', className: 'font-mono text-xs font-bold text-zinc-900' },
    { header: 'Customer', accessorKey: 'customerName', className: 'text-zinc-800 font-medium' },
    { header: 'Vehicle Spec', accessorKey: 'vehicleModel', className: 'text-zinc-600' },
    { header: 'VIN', accessorKey: 'vehicleVin', className: 'font-mono text-xs text-blue-600' },
    { header: 'Destination', accessorKey: 'destinationAddress', className: 'text-zinc-500' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/delivery/${row.id}`)}
          className="text-xs text-amber-600 hover:text-amber-700 font-bold underline"
        >
          Track Dispatch
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Logistics & Vehicle Delivery"
        subtitle={`Truck dispatch logistics, carrier transport, and customer handover for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'Delivery' }, { label: 'Dispatches' }]}
      />

      <DataTable<DeliveryRecord>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No delivery dispatches found"
        emptyDescription={`No active vehicle transport or delivery dispatches exist for ${activeBranchName}.`}
      />
    </div>
  );
};
