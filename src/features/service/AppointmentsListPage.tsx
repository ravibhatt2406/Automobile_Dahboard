import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { ServiceAppointment } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { serviceManagementService } from '@/services/service.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    {
      header: 'Actions',
      cell: (row) => (
        <Link
          to={`/customer/chat?branchId=${row.branchId}&contextType=APPOINTMENT&contextId=${row.id}&subject=Appointment%20%23${row.appointmentNumber}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
          title="Chat regarding this service appointment"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#F5A800]" />
          <span>Chat</span>
        </Link>
      ),
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
