import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Booking } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { BookingFormModal } from './BookingFormModal';
import { useNavigate } from 'react-router-dom';

export const BookingsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => salesService.getBookings(),
  });

  const handleCreate = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const columns: Column<Booking>[] = [
    { header: 'Booking #', accessorKey: 'bookingNumber', className: 'font-mono text-xs font-semibold' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Vehicle Spec', accessorKey: 'vehicleModel' },
    {
      header: 'Deposit Amount',
      cell: (row) => `$${row.bookingAmount.toLocaleString()}`,
    },
    {
      header: 'Payment Status',
      cell: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      header: 'Order Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/sales/bookings/${row.id}`)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            View
          </button>
          <button
            onClick={() =>
              navigate(
                `/customer/chat?branchId=${(row as any).branchId || ''}&contextType=BOOKING&contextId=${row.id}&subject=Booking%20%23${row.bookingNumber}`
              )
            }
            className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold"
            title="Chat regarding this booking"
          >
            Chat
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Order Bookings"
        subtitle="Confirmed vehicle purchases, deposits, and delivery schedules"
        breadcrumbItems={[{ label: 'Sales', href: '/sales' }, { label: 'Bookings' }]}
        actions={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Create Vehicle Booking
          </button>
        }
      />

      <DataTable<Booking>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No bookings found"
        emptyDescription="No vehicle purchase bookings have been submitted."
        emptyActionLabel="Create Vehicle Booking"
        onEmptyAction={handleCreate}
      />

      <BookingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingBooking}
        onSubmit={async (formData: any) => {
          try {
            await salesService.createBooking({
              customerId: formData.customerId,
              quotationId: formData.quotationId || formData.id,
              bookingAmount: Number(formData.bookingAmount || 50000),
              notes: `Customer: ${formData.customerName || 'Direct'}`,
            });
            refetch();
          } catch (err: any) {
            console.error('Failed to create booking:', err);
          }
        }}
      />
    </div>
  );
};
