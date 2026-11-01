import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { branchService } from '@/services/branch.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AccessRestricted } from '@/components/feedback/AccessRestricted';
import { LoadingState } from '@/components/feedback/LoadingState';
import { CustomerEditModal } from '@/components/forms/CustomerEditModal';
import { useAuth } from '@/app/providers/AuthContext';
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
  Edit3,
  Send,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => (id ? customerService.getCustomerById(id) : null),
    retry: false,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => branchService.getBranches({ pageSize: 100 } as any),
  });

  const branches = branchesData?.data || [];

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

  const handleResendInvite = async () => {
    setInviteErrorMsg(null);
    setInviteSuccessMsg(null);
    setResendingInvite(true);
    try {
      const res = await customerService.resendInvitation(customer.id);
      setInviteSuccessMsg(res?.message || 'Activation invitation with 6-digit OTP has been dispatched.');
      refetch();
    } catch (err: any) {
      setInviteErrorMsg(err?.message || 'Failed to dispatch activation invitation.');
    } finally {
      setResendingInvite(false);
    }
  };

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

  const hasLinkedUser = Boolean((customer as any).userId || (customer as any).user);
  const displayName = customer.companyName || customer.name || 'Corporate Account';
  const contactName = customer.contactPerson || customer.name || '--';

  return (
    <div>
      <PageHeader
        title={displayName}
        subtitle="360-degree commercial client ledger, fleet assets, and transaction history"
        breadcrumbItems={[{ label: 'Customers', href: '/customers' }, { label: 'Customer 360' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-600" /> Edit Profile
            </button>
            {!hasLinkedUser && (
              <button
                onClick={handleResendInvite}
                disabled={resendingInvite}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${resendingInvite ? 'animate-spin' : ''}`} />
                {resendingInvite ? 'Sending Invite...' : 'Send Activation Invite'}
              </button>
            )}
          </div>
        }
      />

      {inviteSuccessMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{inviteSuccessMsg}</span>
          </div>
          <button onClick={() => setInviteSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {inviteErrorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{inviteErrorMsg}</span>
          </div>
          <button onClick={() => setInviteErrorMsg(null)} className="text-rose-700 hover:text-rose-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Signature 360 Header Banner */}
      <div className="cockpit-card p-6 rounded-xl border border-zinc-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-zinc-950 text-xl font-bold shadow-xs">
            {displayName[0] || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-900">{displayName}</h2>
              <StatusBadge status={customer?.status || 'active'} />
              {hasLinkedUser ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Portal Login Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Pending Activation
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Contact: <strong className="text-zinc-800">{contactName}</strong></span>
              <span>•</span>
              <span className="font-mono text-zinc-600">{customer?.email || '--'}</span>
              <span>•</span>
              <span className="font-mono text-zinc-600">{customer?.phone || '--'}</span>
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
          <div className="space-y-6">
            {/* Account Lifecycle & Security Card */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-xs">
              <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" /> Portal Login & Security Status
                </span>
                <span className="text-xs font-normal text-zinc-500">Self-Serve Activation Lifecycle</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1">Account Credential Status</span>
                  {hasLinkedUser ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Active & Verified (Password Established)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-700 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>No Password Established Yet</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Preferred Dealer Branch</span>
                  <span className="text-zinc-900 font-medium">
                    {customer?.preferredBranch?.name || 'Default Assigned Branch'}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Lifecycle Action</span>
                  {!hasLinkedUser ? (
                    <button
                      onClick={handleResendInvite}
                      disabled={resendingInvite}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-amber-400 font-semibold rounded-lg text-xs transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendingInvite ? 'animate-spin' : ''}`} />
                      {resendingInvite ? 'Sending...' : 'Dispatch Activation Invite'}
                    </button>
                  ) : (
                    <span className="text-zinc-600">Customer manages password via Client Portal</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="cockpit-card p-6 rounded-xl border border-zinc-200 space-y-3 text-xs bg-white">
                <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200 pb-2 flex items-center justify-between">
                  <span>Company Registration & Tax Specs</span>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                  >
                    Edit
                  </button>
                </h3>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Tax / GST Number</span>
                  <span className="font-mono text-zinc-800 font-medium">{customer?.gstin || customer?.taxId || '--'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">PAN Card</span>
                  <span className="font-mono text-zinc-800 font-medium">{(customer as any)?.pan || '--'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Registered Address</span>
                  <span className="text-zinc-800">
                    {customer?.address ? `${customer.address}, ${customer.city || ''} ${customer.state || ''} ${customer.pincode || ''}` : '--'}
                  </span>
                </div>
              </div>

              <div className="cockpit-card p-6 rounded-xl border border-zinc-200 space-y-3 text-xs bg-white">
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
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="cockpit-card p-6 rounded-xl border border-zinc-200 space-y-4 text-xs max-w-xl bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Primary Contact Personnel</h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
              >
                Edit Details
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-zinc-900 font-semibold">{contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span className="font-mono text-zinc-800">{customer?.email || '--'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-800">{customer?.phone || '--'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-800">
                  {customer?.address ? `${customer.address}, ${customer.city || ''} ${customer.state || ''}` : '--'}
                </span>
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

      {/* Customer Profile Edit Modal */}
      {customer && (
        <CustomerEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            refetch();
          }}
          customer={customer}
          branches={branches}
        />
      )}
    </div>
  );
};
