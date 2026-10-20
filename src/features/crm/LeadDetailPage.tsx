import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
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
  DollarSign,
  Truck,
  ExternalLink,
  MessageSquare,
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

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Fetch Lead Details
  const { data: lead, isLoading, error, refetch } = useQuery({
    queryKey: ['lead-detail', id],
    queryFn: () => (id ? salesService.getLeadById(id) : null),
  });

  // 2. Fetch Branch Employees for Assignment
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
      salesService.updateLeadStatus(id!, status, lostReason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
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
    mutationFn: (employeeId: string) => salesService.assignLead(id!, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setActionSuccess('Salesperson assigned successfully.');
      setActionError(null);
      setIsAssignModalOpen(false);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to assign salesperson.');
    },
  });

  // Follow-Up Mutation
  const followUpMutation = useMutation({
    mutationFn: (data: { scheduledAt: string; notes: string }) =>
      salesService.addFollowUp(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', id] });
      setActionSuccess('Follow-up activity recorded.');
      setActionError(null);
      setIsFollowUpModalOpen(false);
      setFollowUpNotes('');
      setFollowUpDate('');
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to record follow-up.');
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer?.companyName || customer?.name || `Commercial Lead #${lead.id.slice(0, 8)}`}
        subtitle={`Lead opportunity for ${l?.branch?.name || 'Dealership'} • Created on ${new Date(lead.createdAt).toLocaleDateString()}`}
        breadcrumbItems={[
          { label: 'CRM', href: '/crm/leads' },
          { label: 'Leads Pipeline', href: '/crm/leads' },
          { label: customer?.name || customer?.companyName || 'Detail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Schedule Follow-Up
            </button>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Assign Salesperson
            </button>
            <button
              onClick={() => navigate(`/quotations?create=true&customerId=${customer?.id}&leadId=${lead.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg text-xs font-bold border border-zinc-900 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Quotation
            </button>
          </div>
        }
      />

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
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Current Pipeline Stage:</span>
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
                title="Convert lead to won customer sale"
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
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Target className="w-4 h-4 text-amber-500" />
              Lead Prospect Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block">Client / Account</span>
                <span className="font-bold text-zinc-900 text-sm block">
                  {customer?.companyName || customer?.name || 'Individual Prospect'}
                </span>
                {customer?.companyName && (
                  <span className="text-zinc-600 font-medium block">Contact: {customer.name}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-zinc-700">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono">{customer?.phone || lead.phone || '—'}</span>
              </div>

              {customer?.email && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{customer.email}</span>
                </div>
              )}

              {customer?.id && (
                <Link
                  to={`/customers/${customer.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold underline pt-1"
                >
                  <span>View 360 Customer Ledger</span>
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
                <span className="font-bold text-zinc-800">{l?.interestedModel || 'Commercial Hauler'}</span>
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

        {/* Right Column: Quotations & Follow-Up Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Quotations */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Linked Quotations & Deal Proposals ({l?.quotations?.length || 0})
              </h3>
              <button
                onClick={() => navigate(`/quotations?create=true&customerId=${customer?.id}&leadId=${lead.id}`)}
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
                    className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between text-xs"
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

          {/* Follow-Up & Communication Log */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Follow-Up Activity & Communication Timeline
              </h3>
              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Log Interaction
              </button>
            </div>

            {l?.followUps && l.followUps.length > 0 ? (
              <div className="space-y-3">
                {l.followUps.map((fu: any) => {
                  const isPending = fu.status === 'PENDING';
                  return (
                    <div
                      key={fu.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        isPending
                          ? 'bg-amber-50/60 border-amber-200 text-zinc-900'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          {new Date(fu.scheduledAt).toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isPending ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {fu.status}
                        </span>
                      </div>
                      <p className="text-zinc-700">{fu.notes}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-center text-zinc-500 text-xs">
                No follow-up calls or meetings logged yet. Click "Schedule Follow-Up" to track interactions.
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Schedule Follow-Up Modal */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Schedule Follow-Up Activity
              </h3>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Interaction Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Discussed fleet specifications, customer requested revised financing quote..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!followUpDate || !followUpNotes.trim() || followUpMutation.isPending}
                onClick={() =>
                  followUpMutation.mutate({
                    scheduledAt: new Date(followUpDate).toISOString(),
                    notes: followUpNotes.trim(),
                  })
                }
                className="px-4 py-1.5 bg-[#111111] text-[#F5A800] rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {followUpMutation.isPending ? 'Saving...' : 'Record Activity'}
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
                Please specify the reason this commercial lead was lost:
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
