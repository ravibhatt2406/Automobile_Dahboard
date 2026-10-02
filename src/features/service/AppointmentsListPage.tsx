import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { ServiceAppointment } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { serviceManagementService } from '@/services/service.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';

export const AppointmentsListPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => serviceManagementService.getAppointments(),
  });

  const columns: Column<ServiceAppointment>[] = [
    { header: 'Appt #', accessorKey: 'appointmentNumber', className: 'font-mono text-xs' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Vehicle Spec', accessorKey: 'vehicleModel' },
    { header: 'Service Category', accessorKey: 'serviceType' },
    { header: 'Preferred Date', accessorKey: 'preferredDate' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service Appointments"
        subtitle="Scheduled fleet inspections and routine maintenance bookings"
        breadcrumbItems={[{ label: 'Service', href: '/service/jobs' }, { label: 'Appointments' }]}
      />

      <DataTable<ServiceAppointment>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No service appointments scheduled"
        emptyDescription="No client maintenance check-in appointments exist."
      />
    </div>
  );
};
