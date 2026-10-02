import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { User, Truck, FileText, Wrench } from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => (id ? customerService.getCustomerById(id) : null),
  });

  return (
    <div>
      <PageHeader
        title={customer ? customer.companyName : `Customer Record #${id}`}
        subtitle="Commercial fleet account details and vehicle ledger"
        breadcrumbItems={[{ label: 'Customers', href: '/customers' }, { label: id || 'Detail' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-blue-400" /> Account Information
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Contact Person</span>
              <span className="font-medium text-slate-200">{customer?.contactPerson || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Email Address</span>
              <span className="font-mono text-slate-200">{customer?.email || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Phone</span>
              <span className="text-slate-200">{customer?.phone || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tax / Corporate ID</span>
              <span className="font-mono text-slate-200">{customer?.taxId || '--'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-blue-400" /> Registered Vehicles
            </h3>
            <EmptyState
              title="No registered vehicles"
              description="No fleet truck assets associated with this customer account."
            />
          </div>

          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-amber-400" /> Service Repair History
            </h3>
            <EmptyState
              title="No service history"
              description="No service job cards exist for this client."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
