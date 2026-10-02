import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { FileText } from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Tax Invoice #${id}`}
        subtitle="Commercial billing statement and tax breakdown"
        breadcrumbItems={[
          { label: 'Billing', href: '/billing/invoices' },
          { label: 'Invoices', href: '/billing/invoices' },
          { label: id || 'Invoice' },
        ]}
      />

      <div className="cockpit-card p-8 rounded-xl border border-slate-800 text-center py-16 space-y-3">
        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">Invoice #{id}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Invoice statement data unavailable in offline frontend state.
        </p>
      </div>
    </div>
  );
};
