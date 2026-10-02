import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { DeliveryRecord } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/services/delivery.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const DeliveriesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => deliveryService.getDeliveries(),
  });

  const columns: Column<DeliveryRecord>[] = [
    { header: 'Delivery #', accessorKey: 'deliveryNumber', className: 'font-mono text-xs' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Vehicle Spec', accessorKey: 'vehicleModel' },
    { header: 'VIN', accessorKey: 'vehicleVin', className: 'font-mono text-xs text-blue-400' },
    { header: 'Destination', accessorKey: 'destinationAddress' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/delivery/${row.id}`)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          Track Dispatch
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fleet Logistics & Vehicle Delivery"
        subtitle="Truck dispatch logistics, carrier transport, and customer handover"
        breadcrumbItems={[{ label: 'Delivery' }]}
      />

      <DataTable<DeliveryRecord>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No delivery dispatches found"
        emptyDescription="No active vehicle transport or delivery dispatches exist."
      />
    </div>
  );
};
