import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CreditCard } from 'lucide-react';

export const PaymentsListPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Payment Transactions & Collections"
        subtitle="Wire transfers, merchant deposits, and client payment receipts"
        breadcrumbItems={[{ label: 'Payments' }]}
      />

      <div className="cockpit-card p-6 rounded-xl border border-slate-800">
        <EmptyState
          title="No payment records found"
          description="There are no payment transaction records or merchant receipts in the database."
          icon={CreditCard}
        />
      </div>
    </div>
  );
};
