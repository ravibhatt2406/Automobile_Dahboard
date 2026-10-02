import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { ShoppingBag } from 'lucide-react';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Vehicle Booking #${id}`}
        subtitle="Confirmed booking order contract and delivery track"
        breadcrumbItems={[
          { label: 'Sales', href: '/sales' },
          { label: 'Bookings', href: '/sales/bookings' },
          { label: id || 'Order' },
        ]}
      />

      <div className="cockpit-card p-8 rounded-xl border border-slate-800 text-center py-16 space-y-3">
        <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">Booking Contract #{id}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No active booking record data retrieved from backend database.
        </p>
      </div>
    </div>
  );
};
