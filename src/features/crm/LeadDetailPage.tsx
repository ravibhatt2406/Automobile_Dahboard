import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '@/services/crm.service';
import { employeeService } from '@/services/employee.service';
import {
  Target,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Plus,
  RefreshCw,
  X,
  XCircle,
  Truck,
  ExternalLink,
  MessageSquare,
  Shield,
  Briefcase,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

const STAGE_SEQUENCE = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'CONVERTED',
];

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeRole } = useAuth();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<'CALL' | 'MEETING' | 'NOTE' | 'TEST_DRIVE' | 'FOLLOW_UP'>('CALL');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityScheduledAt, setActivityScheduledAt] = useState('');

  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState('');

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertCustomerType, setConvertCustomerType] = useState<'BUSINESS' | 'INDIVIDUAL' | 'ENTERPRISE'>('BUSINESS');
  const [convertAddress, setConvertAddress] = useState('');
  const [convertCity, setConvertCity] = useState('');
  const [convertState, setConvertState] = useState('');
  const [convertGstin, setConvertGstin] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Fetch Lead Details
  const { data: lead, isLoading, error, refetch } = useQuery({
    queryKey: ['lead-detail', id],
    queryFn: () => (id ? crmService.getLeadById(id) : null),
  });

  // 2. Fetch Lead Activities
  const { data: activities = [], refetch: refetchActivities } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: () => (id ? crmService.getActivities(id) : []),
    enabled: !!id,
  });

  // 3. Fetch Branch Employees for Assignment
  const { data: branchEmployees = [] } = useQuery({
    queryKey: ['branch-employees-for-lead', (lead as any)?.branchId],
    queryFn: async () => {
      const bId = (lead as any)?.branchId;
      if (!bId) return [];
      const res = await employeeService.getEmployees({ branchId: bId });
      return res?.data || [];
    },
    enabled: isAssignModalOpen && !!(lead as any)?.branchId,
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ status, lostReason }: { status: string; lostReason?: string }) =>
      crmService.updateLeadStatus(id!, status, lostReason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      refetchActivities();
      setActionSuccess(`Lead stage successfully updated to ${updated.status}`);
      setActionError(null);
      setIsLostModalOpen(false);
      setLostReasonInput('');
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update lead stage.');
      setActionSuccess(null);
    },
  });

  // Assign Mutation
  const assignMutation = useMutation({
    mutationFn: (employeeId: string) => crmService.assignLead(id!, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      refetchActivities();
      setActionSuccess('Salesperson assigned successfully.');
      setActionError(null);
      setIsAssignModalOpen(false);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to assign salesperson.');
    },
  });

  // Add Activity Mutation
  const activityMutation = useMutation({
    mutationFn: (data: {
      activityType: 'CALL' | 'MEETING' | 'NOTE' | 'TEST_DRIVE' | 'FOLLOW_UP';
      title: string;
      description?: string;
      scheduledAt?: string;
    }) =>
      crmService.addActivity(id!, {
        activityType: data.activityType,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
      setActionSuccess('Activity recorded successfully in timeline.');
      setActionError(null);
      setIsActivityModalOpen(false);
      setActivityTitle('');
      setActivityDescription('');
      setActivityScheduledAt('');
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to record activity.');
    },
  });

  // Convert Prospect to Customer Mutation
  const convertMutation = useMutation({
    mutationFn: (data: any) => crmService.convertProspectToCustomer(id!, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      refetchActivities();
      setActionSuccess(res.message || 'Prospect successfully converted to formal Customer profile.');
      setActionError(null);
      setIsConvertModalOpen(false);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to convert prospect to customer profile.');
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#F5A800]" />
        <span className="text-xs">Loading commercial lead opportunity...</span>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2">
        <p className="font-bold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          Lead Not Found or Access Restricted
        </p>
        <p>{(error as any)?.message || 'The specified lead does not exist or belongs to another branch scope.'}</p>
        <Link to="/crm/leads" className="text-blue-600 underline font-semibold block pt-2">
          ← Return to Leads Pipeline
        </Link>
      </div>
    );
  }

  const l = lead as any;
  const customer = l?.customer;
  const currentStatus = String(lead.status || 'NEW').toUpperCase();
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStatus);
  const nextStage = currentIndex >= 0 && currentIndex < STAGE_SEQUENCE.length - 1
    ? STAGE_SEQUENCE[currentIndex + 1]
    : null;

  const isProspectOnly = !lead.customerId;
  const displayName = customer?.companyName || l?.companyName || customer?.name || l?.prospectName || l?.customerName || 'Prospect';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'MEETING':
        return <Building2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'TEST_DRIVE':
        return <Truck className="w-3.5 h-3.5 text-amber-500" />;
      case 'FOLLOW_UP':
        return <Calendar className="w-3.5 h-3.5 text-emerald-500" />;
      case 'STAGE_CHANGE':
        return <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${displayName} (${lead.leadNumber || 'LD-' + lead.id.slice(0, 8)})`}
        subtitle={`Commercial Opportunity • ${l?.branch?.name || 'Dealership Branch'} • Created ${new Date(lead.createdAt).toLocaleDateString()}`}
        breadcrumbItems={[
          { label: 'CRM', href: '/crm/leads' },
          { label: 'Leads', href: '/crm/leads' },
          { label: lead.leadNumber || 'Detail' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isProspectOnly && (
              <button
                onClick={() => setIsConvertModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Convert to Customer
              </button>
            )}

            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              Log Activity
            </button>

            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Assign Salesperson
            </button>

            <button
              onClick={() =>
                navigate(
                  `/sales/quotations/new?leadId=${lead.id}&customerId=${lead.customerId || ''}&interestedModel=${encodeURIComponent(
                    l?.interestedModel || ''
                  )}`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg text-xs font-bold border border-zinc-900 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Quotation
            </button>
          </div>
        }
      />

      {/* Prospect Alert Banner if not converted yet */}
      {isProspectOnly && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This is a <strong>Prospect Lead</strong> without a formal customer account. You can track all interactions freely, or convert it to a full Customer profile when ready for quotations & billing.
            </span>
          </div>
          <button
            onClick={() => setIsConvertModalOpen(true)}
            className="px-2.5 py-1 rounded bg-[#111111] text-[#F5A800] font-bold text-[11px] whitespace-nowrap hover:bg-black ml-3"
          >
            Convert Now
          </button>
        </div>
      )}

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stage Progression Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pipeline Stage:</span>
            <StatusBadge status={currentStatus} />
            <StatusBadge status={lead.priority || 'MEDIUM'} />
          </div>

          <div className="flex items-center gap-2">
            {nextStage && currentStatus !== 'LOST' && (
              <button
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: nextStage })}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
              >
                <span>Advance to {nextStage}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStatus !== 'CONVERTED' && currentStatus !== 'LOST' && (
              <button
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: 'CONVERTED' })}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                title="Mark as Won (requires confirmed quotation or booking)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark as Won
              </button>
            )}

            {currentStatus !== 'LOST' && currentStatus !== 'CONVERTED' && (
              <button
                onClick={() => setIsLostModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 text-zinc-600 rounded-lg text-xs font-semibold border border-zinc-200 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Mark Lost
              </button>
            )}
          </div>
        </div>

        {/* Visual Stage Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
          {STAGE_SEQUENCE.map((stageKey, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentStatus === stageKey;
            return (
              <div
                key={stageKey}
                onClick={() => {
                  if (stageKey !== currentStatus) {
                    statusMutation.mutate({ status: stageKey });
                  }
                }}
                className={`cursor-pointer p-2 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-[#111111] text-[#F5A800] border-zinc-900 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <span className="text-[10px] font-mono block">Stage 0{idx + 1}</span>
                <span className="text-xs font-bold block">{stageKey}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Overview & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Information & Prospect Card */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Lead Prospect Overview
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500">
                {lead.leadNumber || `LD-${lead.id.slice(0, 6)}`}
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Client / Account</span>
                <span className="font-bold text-zinc-900 text-sm block">
                  {displayName}
                </span>
                {(customer?.companyName || l?.companyName) && (
                  <span className="text-zinc-600 font-medium block">
                    Contact: {customer?.name || l?.prospectName || l?.customerName || '—'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-zinc-700">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono">{customer?.phone || l?.prospectPhone || lead.phone || '—'}</span>
              </div>

              {(customer?.email || l?.prospectEmail || lead.email) && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{customer?.email || l?.prospectEmail || lead.email}</span>
                </div>
              )}

              {customer?.id && (
                <Link
                  to={`/customers/${customer.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold underline pt-1"
                >
                  <span>View 360 Customer Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Dealership Branch:</span>
                <span className="font-bold text-zinc-800">{l?.branch?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Interested Model:</span>
                <span className="font-bold text-zinc-800">{l?.interestedModel || 'Commercial Vehicle'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Expected Budget:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {l?.expectedBudget ? `₹${Number(l.expectedBudget).toLocaleString()}` : 'Negotiable'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Lead Source:</span>
                <span className="font-semibold text-zinc-700">{lead.source}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Assigned Salesperson:</span>
                <span className="font-bold text-zinc-900">
                  {l?.assignedEmployee
                    ? `${l.assignedEmployee.firstName} ${l.assignedEmployee.lastName}`
                    : 'Unassigned'}
                </span>
              </div>

              {lead.nextFollowUpDate && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Next Follow-Up:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {new Date(lead.nextFollowUpDate).toLocaleString()}
                  </span>
                </div>
              )}

              {l?.lostReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 mt-2">
                  <span className="font-bold block">Lost Opportunity Reason:</span>
                  <p className="mt-0.5">{l.lostReason}</p>
                </div>
              )}
            </div>

            {lead.notes && (
              <div className="pt-3 border-t border-zinc-100">
                <span className="text-zinc-400 text-[11px] block font-semibold mb-1">Requirement Notes</span>
                <p className="text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 text-xs leading-relaxed">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Proposals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Quotations & Bookings */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Linked Quotations ({l?.quotations?.length || 0})
              </h3>
              <button
                onClick={() =>
                  navigate(
                    `/sales/quotations/new?leadId=${lead.id}&customerId=${lead.customerId || ''}&interestedModel=${encodeURIComponent(
                      l?.interestedModel || ''
                    )}`
                  )
                }
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> New Quote
              </button>
            </div>

            {l?.quotations && l.quotations.length > 0 ? (
              <div className="space-y-2">
                {l.quotations.map((q: any) => (
                  <div
                    key={q.id}
                    className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-zinc-900 block">{q.quotationNumber}</span>
                      <span className="text-zinc-500 text-[11px]">
                        Valid till: {new Date(q.validityDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-zinc-900 block">
                        ₹{Number(q.totalAmount).toLocaleString()}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-center text-zinc-500 text-xs">
                No formal quotation created yet for this prospect. Click "Generate Quotation" above to draft a commercial proposal.
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5A800]" />
                Activity & Interaction Timeline ({activities.length})
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Log Activity
              </button>
            </div>

            {activities.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-zinc-200">
                {activities.map((act: any) => (
                  <div key={act.id} className="relative flex items-start gap-3 text-xs pl-1">
                    <div className="w-6 h-6 rounded-full bg-white border border-zinc-300 flex items-center justify-center shrink-0 z-10">
                      {getActivityIcon(act.activityType)}
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-900">{act.title}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-zinc-600 leading-relaxed">{act.description}</p>
                      )}
                      {act.employee && (
                        <span className="text-[10px] text-zinc-400 font-mono block pt-0.5">
                          Logged by: {act.employee.firstName} {act.employee.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-center text-zinc-500 text-xs">
                No activity records logged yet. Click "Log Activity" to track phone calls, client meetings, notes or test drives.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Prospect to Customer Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Convert Prospect to Customer Profile
              </h3>
              <button onClick={() => setIsConvertModalOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-600">
                This will create a formal Customer account linked to this lead and branch:
              </p>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Customer Account Type</label>
                <select
                  value={convertCustomerType}
                  onChange={(e) => setConvertCustomerType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                >
                  <option value="BUSINESS">Commercial Business Fleet</option>
                  <option value="INDIVIDUAL">Individual Owner-Operator</option>
                  <option value="ENTERPRISE">Enterprise Logistics Corp</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  value={convertAddress}
                  onChange={(e) => setConvertAddress(e.target.value)}
                  placeholder="Plot 42, Transport Nagar"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={convertCity}
                    onChange={(e) => setConvertCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={convertState}
                    onChange={(e) => setConvertState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  value={convertGstin}
                  onChange={(e) => setConvertGstin(e.target.value.toUpperCase())}
                  placeholder="27ABCDE1234F1Z5"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={convertMutation.isPending}
                onClick={() =>
                  convertMutation.mutate({
                    customerType: convertCustomerType,
                    address: convertAddress.trim() || undefined,
                    city: convertCity.trim() || undefined,
                    state: convertState.trim() || undefined,
                    gstin: convertGstin.trim() || undefined,
                  })
                }
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {convertMutation.isPending ? 'Converting...' : 'Create Customer Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                Log Customer Interaction / Activity
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Activity Type *</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                >
                  <option value="CALL">Phone Call / Tele-conversation</option>
                  <option value="MEETING">In-Person Client Meeting</option>
                  <option value="TEST_DRIVE">Product Demo / Test Drive</option>
                  <option value="NOTE">Internal Dealership Note</option>
                  <option value="FOLLOW_UP">Scheduled Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Title / Summary *</label>
                <input
                  type="text"
                  required
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="e.g. Conducted test drive of Prime 5530.S"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Details & Customer Feedback</label>
                <textarea
                  rows={3}
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Client satisfied with turning radius and payload capacity. Requested final quotation by Friday..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Scheduled / Completed At</label>
                <input
                  type="datetime-local"
                  value={activityScheduledAt}
                  onChange={(e) => setActivityScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!activityTitle.trim() || activityMutation.isPending}
                onClick={() =>
                  activityMutation.mutate({
                    activityType,
                    title: activityTitle.trim(),
                    description: activityDescription.trim() || undefined,
                    scheduledAt: activityScheduledAt || undefined,
                  })
                }
                className="px-4 py-1.5 bg-[#111111] text-[#F5A800] rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {activityMutation.isPending ? 'Saving...' : 'Record Activity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Salesperson Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Assign Salesperson
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-600">
                Select an active salesperson from branch <span className="font-bold text-zinc-900">{l?.branch?.name}</span>:
              </p>

              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
              >
                <option value="">-- Choose Sales Employee --</option>
                {branchEmployees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.designation || 'Sales'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!selectedEmployeeId || assignMutation.isPending}
                onClick={() => assignMutation.mutate(selectedEmployeeId)}
                className="px-4 py-1.5 bg-[#111111] text-[#F5A800] rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Lost Modal */}
      {isLostModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                Mark Opportunity as Closed Lost
              </h3>
              <button onClick={() => setIsLostModalOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-600">
                Please specify the reason this commercial lead was lost (Mandatory):
              </p>

              <textarea
                rows={3}
                required
                value={lostReasonInput}
                onChange={(e) => setLostReasonInput(e.target.value)}
                placeholder="e.g. Competitor price undercut, project postponed, client purchased used fleet..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsLostModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!lostReasonInput.trim() || statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: 'LOST',
                    lostReason: lostReasonInput.trim(),
                  })
                }
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-rose-700"
              >
                {statusMutation.isPending ? 'Updating...' : 'Confirm Closed Lost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
