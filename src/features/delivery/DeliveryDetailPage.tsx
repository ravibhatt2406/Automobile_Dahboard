import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { PackageCheck } from 'lucide-react';

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Logistics Delivery #${id}`}
        subtitle="Dispatch status and handover documentation"
        breadcrumbItems={[
          { label: 'Delivery', href: '/delivery' },
          { label: id || 'Detail' },
        ]}
      />

      <div className="cockpit-card p-8 rounded-xl border border-slate-800 text-center py-16 space-y-3">
        <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">Delivery Shipment #{id}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No delivery dispatch telemetry record found in database.
        </p>
      </div>
    </div>
  );
};
