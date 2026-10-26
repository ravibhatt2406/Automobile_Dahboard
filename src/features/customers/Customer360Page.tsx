import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AccessRestricted } from '@/components/feedback/AccessRestricted';
import { LoadingState } from '@/components/feedback/LoadingState';
import {
  User,
  Truck,
  Target,
  FileText,
  ShoppingBag,
  CreditCard,
  Wrench,
  FolderArchive,
  Activity,
  Phone,
  Mail,
  MapPin,
  Building,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'contact'
    | 'vehicles'
    | 'leads'
    | 'quotations'
    | 'bookings'
    | 'payments'
    | 'service'
    | 'documents'
    | 'activity'
  >('overview');

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => (id ? customerService.getCustomerById(id) : null),
    retry: false,
  });

  if (isLoading) {
    return <LoadingState label="Retrieving 360-degree customer ledger..." />;
  }

  if (error) {
    const errObj = error as any;
    if (errObj?.statusCode === 403 || errObj?.message?.toLowerCase().includes('scope')) {
      return (
        <AccessRestricted
          reason="Multi-tenant Scope Restriction: This customer account is not associated with your authorized branch or franchise."
        />
      );
    }
    return (
      <AccessRestricted
        reason={errObj?.message || 'Customer account could not be found or access is restricted.'}
      />
    );
  }

  if (!customer) {
    return (
      <AccessRestricted
        reason="Customer account record was not found or is not associated with your current branch."
      />
    );
  }

  const tabs: Array<{
    id: typeof activeTab;
    label: string;
    icon: React.ElementType;
  }> = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'bookings', label: 'Bookings', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'service', label: 'Service History', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FolderArchive },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div>
      <PageHeader
        title={customer ? customer.companyName : `Customer 360 View #${id}`}
        subtitle="360-degree commercial client ledger, fleet assets, and transaction history"
        breadcrumbItems={[{ label: 'Customers', href: '/customers' }, { label: 'Customer 360' }]}
      />

      {/* Signature 360 Header Banner */}
      <div className="cockpit-card p-6 rounded-xl border border-zinc-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-zinc-950 text-xl font-bold shadow-xs">
            {customer?.companyName?.[0] || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-900">{customer?.companyName || 'Corporate Account'}</h2>
              <StatusBadge status={customer?.status || 'active'} />
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
              <span>Contact: <strong className="text-zinc-800">{customer?.contactPerson || '--'}</strong></span>
              <span>•</span>
              <span className="font-mono text-zinc-600">{customer?.email || '--'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono border-t md:border-t-0 md:border-l border-zinc-200 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-zinc-500 block text-[11px] uppercase font-sans">Fleet Size</span>
            <span className="text-lg font-bold text-zinc-900">{customer?.fleetSize ?? '--'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px] uppercase font-sans">Account Type</span>
            <span className="text-zinc-800 font-semibold capitalize font-sans">{customer?.customerType || 'Corporate'}</span>
          </div>
        </div>
      </div>

      {/* 360 Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-zinc-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 space-y-3 text-xs">
              <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
                Company Registration & Tax Specs
              </h3>
              <div>
                <span className="text-zinc-500 block mb-0.5">Tax / GST Number</span>
                <span className="font-mono text-zinc-800 font-medium">{customer?.taxId || '--'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Registered Address</span>
                <span className="text-zinc-800">{customer?.address || '--'}</span>
              </div>
            </div>

            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 space-y-3 text-xs">
              <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
                Financial Ledger Summary
              </h3>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                <span className="text-zinc-600">Total Invoiced</span>
                <span className="font-mono font-bold text-zinc-900">--</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                <span className="text-zinc-600">Total Payments Received</span>
                <span className="font-mono font-bold text-emerald-600">--</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-600">Outstanding Balance</span>
                <span className="font-mono font-bold text-amber-600">--</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="cockpit-card p-6 rounded-xl border border-zinc-200 space-y-4 text-xs max-w-xl">
            <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
              Primary Contact Personnel
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-zinc-900 font-semibold">{customer?.contactPerson || '--'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span className="font-mono text-zinc-800">{customer?.email || '--'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-800">{customer?.phone || '--'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <EmptyState
            title="No vehicles in customer fleet"
            description="No truck assets are linked to this customer account."
            icon={Truck}
          />
        )}

        {activeTab === 'leads' && (
          <EmptyState
            title="No active CRM leads"
            description="No sales opportunities recorded for this account."
            icon={Target}
          />
        )}

        {activeTab === 'quotations' && (
          <EmptyState
            title="No quotations generated"
            description="No commercial pricing quotes have been issued to this customer."
            icon={FileText}
          />
        )}

        {activeTab === 'bookings' && (
          <EmptyState
            title="No vehicle bookings"
            description="No confirmed truck orders or delivery bookings exist."
            icon={ShoppingBag}
          />
        )}

        {activeTab === 'payments' && (
          <EmptyState
            title="No payment records"
            description="No financial payment transactions have been logged."
            icon={CreditCard}
          />
        )}

        {activeTab === 'service' && (
          <EmptyState
            title="No service history"
            description="No workshop service job cards recorded for this client."
            icon={Wrench}
          />
        )}

        {activeTab === 'documents' && (
          <EmptyState
            title="No uploaded documents"
            description="Tax certificates, contracts, and registration files."
            icon={FolderArchive}
          />
        )}

        {activeTab === 'activity' && (
          <EmptyState
            title="No customer activity log"
            description="Audit events and customer interaction logs."
            icon={Activity}
          />
        )}
      </motion.div>
    </div>
  );
};
