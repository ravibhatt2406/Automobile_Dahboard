import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  Wrench,
  Package,
  FileText,
  User,
  Truck,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  UserCheck,
  Plus,
  RefreshCw,
  X,
  ShieldCheck,
  Receipt,
  FileCheck2,
  MessageSquare,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceManagementService } from '@/services/service.service';
import { sparePartsService } from '@/services/spare-parts.service';
import { useAuth } from '@/app/providers/AuthContext';

const ALLOWED_SERVICE_JOB_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['DIAGNOSIS', 'IN_PROGRESS', 'CANCELLED'],
  DIAGNOSIS: ['WAITING_FOR_APPROVAL', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'CANCELLED'],
  WAITING_FOR_APPROVAL: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_PARTS', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  WAITING_FOR_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  QUALITY_CHECK: ['READY_FOR_DELIVERY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  READY_FOR_DELIVERY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const ServiceJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const isCustomer = activeRole === 'CUSTOMER';
  const isMechanic = activeRole === 'MECHANIC';

  const [activeTab, setActiveTab] = useState<'overview' | 'diagnosis' | 'labour' | 'parts' | 'qc' | 'invoice'>('overview');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');

  // Modals
  const [isAssignMechanicModalOpen, setIsAssignMechanicModalOpen] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  const [isAddDiagnosisModalOpen, setIsAddDiagnosisModalOpen] = useState(false);
  const [diagFindings, setDiagFindings] = useState('');
  const [diagWork, setDiagWork] = useState('');
  const [diagSeverity, setDiagSeverity] = useState('MEDIUM');
  const [diagAdditionalCost, setDiagAdditionalCost] = useState('');
  const [diagNotes, setDiagNotes] = useState('');

  const [isAddLabourModalOpen, setIsAddLabourModalOpen] = useState(false);
  const [labourType, setLabourType] = useState('MECHANICAL');
  const [labourDesc, setLabourDesc] = useState('');
  const [labourHours, setLabourHours] = useState('1.5');
  const [labourRate, setLabourRate] = useState('1200');
  const [labourDiscount, setLabourDiscount] = useState('0');

  const [isIssuePartModalOpen, setIsIssuePartModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [issueQuantity, setIssueQuantity] = useState('1');

  const [isAddQcModalOpen, setIsAddQcModalOpen] = useState(false);
  const [qcStatus, setQcStatus] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [qcRemarks, setQcRemarks] = useState('All safety standards inspected and verified.');
  const [qcChecklist, setQcChecklist] = useState({
    brakeTest: true,
    fluidLevels: true,
    electricalSystems: true,
    roadTest: true,
  });

  // Query Service Job
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['serviceJob', id],
    queryFn: () => (id ? serviceManagementService.getServiceJobById(id) : null),
  });

  // Query Mechanics in branch
  const { data: branchEmployees = [] } = useQuery({
    queryKey: ['branch-mechanics', job?.branchId],
    queryFn: () => serviceManagementService.getEmployees({ branchId: job?.branchId }),
    enabled: isAssignMechanicModalOpen && !!job?.branchId,
  });

  const branchMechanics = branchEmployees.filter(
    (e: any) =>
      e.status === 'ACTIVE' &&
      (e.designation?.toLowerCase().includes('mechanic') ||
        e.designation?.toLowerCase().includes('technician') ||
        e.roleAssignments?.some((ra: any) => ra.role?.name === 'MECHANIC') ||
        true)
  );

  // Query Branch Stock for Spare Parts
  const { data: branchPartsStock = [] } = useQuery({
    queryKey: ['branch-parts-stock', job?.branchId],
    queryFn: () => (job?.branchId ? sparePartsService.getStockByBranch(job.branchId) : []),
    enabled: isIssuePartModalOpen && !!job?.branchId,
  });

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      serviceManagementService.updateStatus(id!, status, notes),
    onSuccess: (_, vars) => {
      setStatusMessage({ type: 'success', text: `Status updated successfully to ${vars.status}` });
      setSelectedNextStatus('');
      setStatusNotes('');
      queryClient.invalidateQueries({ queryKey: ['serviceJob', id] });
      queryClient.invalidateQueries({ queryKey: ['serviceJobs'] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update job status' });
    },
  });

  // Assign Mechanic Mutation
  const assignMechanicMutation = useMutation({
    mutationFn: (mechanicId: string) => serviceManagementService.assignMechanic(id!, mechanicId),
    onSuccess: () => {
      setIsAssignMechanicModalOpen(false);
      setSelectedMechanicId('');
      setStatusMessage({ type: 'success', text: 'Mechanic successfully assigned to job card' });
      queryClient.invalidateQueries({ queryKey: ['serviceJob', id] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to assign mechanic' });
    },
  });

  // Add Diagnosis Mutation
  const addDiagnosisMutation = useMutation({
    mutationFn: (data: any) => serviceManagementService.addDiagnosis(id!, data),
    onSuccess: () => {
      setIsAddDiagnosisModalOpen(false);
      setDiagFindings('');
      setDiagWork('');
      setDiagAdditionalCost('');
      setDiagNotes('');
      setStatusMessage({ type: 'success', text: 'Diagnostic findings recorded successfully' });
      queryClient.invalidateQueries({ queryKey: ['serviceJob', id] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to record diagnosis' });
    },
  });

  // Add Labour Mutation
  const addLabourMutation = useMutation({
    mutationFn: (data: any) => serviceManagementService.addLabour(id!, data),
    onSuccess: () => {
      setIsAddLabourModalOpen(false);
      setLabourDesc('');
      setLabourHours('1.5');
      setLabourRate('1200');
      setLabourDiscount('0');
      setStatusMessage({ type: 'success', text: 'Labour charge line recorded successfully' });
      queryClient.invalidateQueries({ queryKey: ['serviceJob', id] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to record labour line' });
    },
  });

  // Issue Part Mutation
  const issuePartMutation = useMutation({
    mutationFn: (data: any) => serviceManagementService.issuePartToJob(data),
    onSuccess: () => {
      setIsIssuePartModalOpen(false);
      setSelectedPartId('');
      setIssueQuantity('1');
      setStatusMessage({ type: 'success', text: 'Spare part issued and stock deducted from inventory' });
      queryClient.invalidateQueries({ queryKey: ['serviceJob', id] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to issue spare part' });
    },
  });

  // Add QC Inspection Mutation
  const addQcMutation = useMutation({
    mutationFn: (data: any) => serviceManagementService.addQcInspection(id!, data),
    onSuccess: () => {
      setIsAddQcModalOpen(false);
      setStatusMessage({ type: 'success', text: 'Quality Control inspection recorded successfully' });
      queryClient.invalidateQueries({ queryKey: ['serviceJob', id] });
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to record QC inspection' });
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-400">
        Loading service job card & telemetry audit records from PostgreSQL...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-500">
          {(error as any)?.message || 'Service job record not found'}
        </p>
        <button
          onClick={() => navigate('/service/jobs')}
          className="px-4 py-2 bg-zinc-900 text-zinc-200 text-xs rounded-lg hover:bg-black font-semibold"
        >
          Return to Service Workshop
        </button>
      </div>
    );
  }

  const hasPassedQc = job.qcInspections?.some((qc: any) => qc.status === 'PASSED');
  const allowedTransitions = ALLOWED_SERVICE_JOB_TRANSITIONS[job.status] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Job Card: ${job.jobNumber || job.jobCardNumber}`}
        subtitle={`Vehicle VIN: ${job.vehicleVin || job.vehicle?.vin || '—'} • Customer: ${job.customerName}`}
        breadcrumbItems={[
          { label: 'Service', href: '/service/jobs' },
          { label: 'Repair Jobs', href: '/service/jobs' },
          { label: job.jobNumber || job.jobCardNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/service/jobs')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Jobs
            </button>
            {isCustomer ? (
              <button
                onClick={() =>
                  navigate(
                    `/customer/chat?branchId=${job.branchId}&contextType=SERVICE_JOB&contextId=${job.id}&subject=Service%20Job%20%23${job.jobNumber || job.jobCardNumber}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" /> Chat with Branch
              </button>
            ) : (
              <button
                onClick={() => navigate(`/chat?contextType=SERVICE_JOB&contextId=${job.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
              >
                <MessageSquare className="w-4 h-4 text-[#F5A800]" /> Customer Chat
              </button>
            )}
            {!isCustomer && (
              <>
                <button
                  onClick={() => setIsAssignMechanicModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" /> {job.mechanicName !== 'Unassigned' ? 'Reassign Mechanic' : 'Assign Mechanic'}
                </button>
                <button
                  onClick={() => setIsAddQcModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
                >
                  <ShieldCheck className="w-4 h-4" /> Perform QC Inspection
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Global Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workflow Guidance Banner */}
      {job.status === 'READY_FOR_DELIVERY' && !job.serviceInvoice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              <strong>QC Inspection PASSED!</strong> Ready to finalize job card and automatically generate tax invoice for vehicle dispatch.
            </span>
          </div>
          {!isCustomer && (
            <button
              onClick={() => updateStatusMutation.mutate({ status: 'COMPLETED', notes: 'Vehicle inspected, certified, and delivered.' })}
              disabled={updateStatusMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
            >
              Complete & Generate Invoice
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#F5A800] text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Wrench className="w-4 h-4 text-[#F5A800]" /> Overview & Status
        </button>
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'diagnosis'
              ? 'border-[#F5A800] text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" /> Diagnostics ({job.diagnoses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('labour')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'labour'
              ? 'border-[#F5A800] text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" /> Labour Operations ({job.labourItems?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('parts')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'parts'
              ? 'border-[#F5A800] text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-600" /> Spare Parts Consumed ({job.jobParts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('qc')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'qc'
              ? 'border-[#F5A800] text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" /> Quality Control ({job.qcInspections?.length || 0})
        </button>
        {job.serviceInvoice && (
          <button
            onClick={() => setActiveTab('invoice')}
            className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'invoice'
                ? 'border-[#F5A800] text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-purple-600" /> Service Invoice
          </button>
        )}
      </div>

      {/* TAB 1: Overview & Status */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Details Card */}
            <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Wrench className="w-4 h-4 text-[#F5A800]" /> Repair Scope & Customer Complaint
              </h3>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <span className="text-zinc-400 uppercase text-[10px] block font-mono">Reported Defect / Issue</span>
                <p className="font-semibold text-zinc-900 text-sm mt-1">{job.complaint}</p>
                {job.notes && (
                  <p className="text-zinc-600 mt-2 pt-2 border-t border-zinc-200">
                    <span className="text-zinc-400 font-mono text-[10px] uppercase block">Workshop Notes:</span>
                    {job.notes}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Vehicle Asset</span>
                  <Link
                    to={`/inventory/vehicles/${job.vehicleId}`}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {job.vehicleVin || job.vehicle?.vin}
                  </Link>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Model / Variant</span>
                  <span className="font-semibold text-zinc-800">{job.vehicleModel}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Customer</span>
                  <span className="font-semibold text-zinc-800">{job.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Fulfilling Branch</span>
                  <span className="font-semibold text-zinc-800">{job.branchName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Service Advisor</span>
                  <span className="font-semibold text-zinc-800">
                    {job.serviceAdvisor?.user?.firstName
                      ? `${job.serviceAdvisor.user.firstName} ${job.serviceAdvisor.user.lastName || ''}`
                      : job.serviceAdvisor?.designation || 'Active Advisor'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Assigned Mechanic</span>
                  <span className="font-semibold text-zinc-900">
                    {job.mechanicName}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Commercial Job Accounting
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Estimated Cost</span>
                  <span className="text-lg font-bold text-zinc-900">₹{(job.estimatedCost || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Parts Total</span>
                  <span className="text-lg font-bold text-zinc-900">
                    ₹{((job.jobParts || []).reduce((acc: number, p: any) => acc + Number(p.totalAmount || 0), 0)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-zinc-400 text-[10px] block uppercase font-sans">Labour Total</span>
                  <span className="text-lg font-bold text-zinc-900">
                    ₹{((job.labourItems || []).reduce((acc: number, l: any) => acc + Number(l.totalAmount || 0), 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Status & Actions */}
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                Job Card Progression
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] block font-mono mb-1">Current Status</span>
                  <StatusBadge status={job.status} />
                </div>

                <div>
                  <span className="text-zinc-400 uppercase text-[10px] block font-mono">Quality Control</span>
                  <span className={`font-semibold flex items-center gap-1 mt-0.5 ${hasPassedQc ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {hasPassedQc ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {hasPassedQc ? 'PASSED — Certified' : 'Pending Inspection'}
                  </span>
                </div>

                {!isCustomer && (
                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <label className="text-zinc-600 text-xs font-semibold block">Update Job Status</label>
                    {allowedTransitions.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          value={selectedNextStatus}
                          onChange={(e) => setSelectedNextStatus(e.target.value)}
                          className="w-full text-xs font-mono p-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                        >
                          <option value="">-- Select Next Stage --</option>
                          {allowedTransitions.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Optional stage update remarks..."
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="w-full text-xs p-2 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                        />
                        <button
                          onClick={() => {
                            if (!selectedNextStatus) return;
                            updateStatusMutation.mutate({ status: selectedNextStatus, notes: statusNotes || undefined });
                          }}
                          disabled={!selectedNextStatus || updateStatusMutation.isPending}
                          className="w-full py-1.5 px-3 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {updateStatusMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          Update Stage Transition
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic">Job card reached final state ({job.status})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Diagnostics */}
      {activeTab === 'diagnosis' && (
        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" /> Diagnostic Findings & Technical Reports
              </h3>
              <p className="text-xs text-zinc-500">Inspection findings, fault codes, and recommended component replacements</p>
            </div>
            {!isCustomer && (
              <button
                onClick={() => setIsAddDiagnosisModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Record Diagnosis
              </button>
            )}
          </div>

          {Array.isArray(job.diagnoses) && job.diagnoses.length > 0 ? (
            <div className="space-y-3">
              {job.diagnoses.map((d: any) => (
                <div key={d.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 text-sm">{d.findings}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.severity === 'HIGH' || d.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.severity || 'MEDIUM'} Severity
                    </span>
                  </div>
                  {d.recommendedWork && (
                    <p className="text-zinc-700">
                      <strong>Recommended Work:</strong> {d.recommendedWork}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px] pt-1 border-t border-zinc-200">
                    <span>Recorded: {new Date(d.createdAt).toLocaleString()}</span>
                    {d.additionalCost > 0 && <span>Additional Estimate: ₹{Number(d.additionalCost).toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
              No diagnostic reports logged yet. Mechanic findings will appear here.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Labour Operations */}
      {activeTab === 'labour' && (
        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Labour Hours & Operations
              </h3>
              <p className="text-xs text-zinc-500">Workshop mechanic hours, diagnostic bay rate, and GST billing charges</p>
            </div>
            {!isCustomer && (
              <button
                onClick={() => setIsAddLabourModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Labour Charge
              </button>
            )}
          </div>

          {Array.isArray(job.labourItems) && job.labourItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Operation / Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Hours</th>
                    <th className="p-3 text-right">Hourly Rate</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {job.labourItems.map((lb: any) => (
                    <tr key={lb.id} className="hover:bg-zinc-50">
                      <td className="p-3 font-semibold text-zinc-900">{lb.labourType}</td>
                      <td className="p-3 font-sans text-zinc-700">{lb.description}</td>
                      <td className="p-3 text-right">{lb.hours} hrs</td>
                      <td className="p-3 text-right">₹{Number(lb.hourlyRate).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">₹{Number(lb.discount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-zinc-900">₹{Number(lb.totalAmount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
              No labour operations recorded yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Spare Parts Consumed */}
      {activeTab === 'parts' && (
        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" /> Spare Parts Issued & Consumed
              </h3>
              <p className="text-xs text-zinc-500">Parts drawn directly from branch inventory with automated stock deduction</p>
            </div>
            {!isCustomer && (
              <button
                onClick={() => setIsIssuePartModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Part to Job
              </button>
            )}
          </div>

          {Array.isArray(job.jobParts) && job.jobParts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Part #</th>
                    <th className="p-3">Description / Name</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">GST Rate</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {job.jobParts.map((jp: any) => (
                    <tr key={jp.id} className="hover:bg-zinc-50">
                      <td className="p-3 font-semibold text-blue-600">{jp.part?.partNumber || jp.partNumber}</td>
                      <td className="p-3 font-sans text-zinc-700">{jp.part?.name || jp.partName}</td>
                      <td className="p-3 text-right font-bold">{jp.quantity}</td>
                      <td className="p-3 text-right">₹{Number(jp.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">{jp.gstRate || 18}%</td>
                      <td className="p-3 text-right font-bold text-zinc-900">₹{Number(jp.totalAmount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
              No spare parts issued to this repair card yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Quality Control */}
      {activeTab === 'qc' && (
        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Quality Control & Compliance Inspections
              </h3>
              <p className="text-xs text-zinc-500">Pre-delivery checklist validation required before job completion</p>
            </div>
            {!isCustomer && (
              <button
                onClick={() => setIsAddQcModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Perform QC Inspection
              </button>
            )}
          </div>

          {Array.isArray(job.qcInspections) && job.qcInspections.length > 0 ? (
            <div className="space-y-3">
              {job.qcInspections.map((qc: any) => (
                <div key={qc.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                      {qc.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      QC Inspection #{qc.id.slice(0, 8)} — {qc.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      qc.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {qc.status}
                    </span>
                  </div>
                  {qc.remarks && <p className="text-zinc-700">{qc.remarks}</p>}
                  {qc.checklist && (
                    <div className="p-2.5 bg-white rounded border border-zinc-200 font-mono text-[11px] text-zinc-600">
                      <strong>Checklist:</strong> {JSON.stringify(qc.checklist)}
                    </div>
                  )}
                  <div className="text-zinc-400 font-mono text-[11px] pt-1 border-t border-zinc-200">
                    Inspected on {new Date(qc.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
              No Quality Control inspections conducted yet. An authorized inspector or branch manager must pass QC before completion.
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Service Invoice */}
      {activeTab === 'invoice' && job.serviceInvoice && (
        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" /> Tax Invoice #{job.serviceInvoice.invoiceNumber}
              </h3>
              <p className="text-xs text-zinc-500">Official commercial tax invoice generated upon job completion</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-xs uppercase">
              {job.serviceInvoice.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 font-mono text-xs">
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase font-sans">Taxable Amount</span>
              <span className="font-bold text-zinc-900 text-sm">₹{Number(job.serviceInvoice.taxableAmount).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase font-sans">CGST (9%)</span>
              <span className="font-bold text-zinc-900 text-sm">₹{Number(job.serviceInvoice.cgstAmount).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase font-sans">SGST (9%)</span>
              <span className="font-bold text-zinc-900 text-sm">₹{Number(job.serviceInvoice.sgstAmount).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase font-sans">Total Billed</span>
              <span className="font-bold text-emerald-600 text-lg">₹{Number(job.serviceInvoice.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Assign Mechanic */}
      {isAssignMechanicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Assign Mechanic to Job</h3>
              <button onClick={() => setIsAssignMechanicModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-700 block">
                Select Technician from Branch ({job.branchName})
              </label>
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
              >
                <option value="">-- Select Active Technician --</option>
                {branchMechanics.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.designation || 'Mechanic'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setIsAssignMechanicModalOpen(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => assignMechanicMutation.mutate(selectedMechanicId)}
                disabled={!selectedMechanicId || assignMechanicMutation.isPending}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {assignMechanicMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Diagnosis */}
      {isAddDiagnosisModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Record Diagnostic Report</h3>
              <button onClick={() => setIsAddDiagnosisModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addDiagnosisMutation.mutate({
                  findings: diagFindings.trim(),
                  recommendedWork: diagWork.trim() || undefined,
                  severity: diagSeverity,
                  additionalCost: diagAdditionalCost ? Number(diagAdditionalCost) : undefined,
                  notes: diagNotes.trim() || undefined,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Findings / Defects *</label>
                <textarea
                  rows={2}
                  value={diagFindings}
                  onChange={(e) => setDiagFindings(e.target.value)}
                  placeholder="e.g. Brake pad wear down to 2mm, hydraulic line leak..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Recommended Overhaul / Repairs</label>
                <input
                  type="text"
                  value={diagWork}
                  onChange={(e) => setDiagWork(e.target.value)}
                  placeholder="e.g. Replace brake pad set, bleed hydraulic circuit"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Severity</label>
                  <select
                    value={diagSeverity}
                    onChange={(e) => setDiagSeverity(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Additional Cost (₹)</label>
                  <input
                    type="number"
                    value={diagAdditionalCost}
                    onChange={(e) => setDiagAdditionalCost(e.target.value)}
                    placeholder="0"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddDiagnosisModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!diagFindings.trim() || addDiagnosisMutation.isPending}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addDiagnosisMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Diagnostic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Labour */}
      {isAddLabourModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Add Labour Operation Charge</h3>
              <button onClick={() => setIsAddLabourModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addLabourMutation.mutate({
                  labourType,
                  description: labourDesc.trim(),
                  hours: Number(labourHours),
                  hourlyRate: Number(labourRate),
                  discount: labourDiscount ? Number(labourDiscount) : 0,
                  taxRate: 18,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Labour Operation Type *</label>
                <select
                  value={labourType}
                  onChange={(e) => setLabourType(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                >
                  <option value="MECHANICAL">Mechanical Repair</option>
                  <option value="ELECTRICAL">Electrical & Wiring</option>
                  <option value="BRAKE_OVERHAUL">Brake Overhaul</option>
                  <option value="ENGINE_SERVICE">Engine & Transmission</option>
                  <option value="GENERAL_MAINTENANCE">General Maintenance</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Operation Description *</label>
                <input
                  type="text"
                  value={labourDesc}
                  onChange={(e) => setLabourDesc(e.target.value)}
                  placeholder="e.g. Caliper disassembly and hydraulic bleeding"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={labourHours}
                    onChange={(e) => setLabourHours(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Hourly Rate (₹) *</label>
                  <input
                    type="number"
                    value={labourRate}
                    onChange={(e) => setLabourRate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={labourDiscount}
                    onChange={(e) => setLabourDiscount(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddLabourModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!labourDesc.trim() || addLabourMutation.isPending}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addLabourMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Labour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Issue Part */}
      {isIssuePartModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Issue Spare Part from Branch Stock</h3>
              <button onClick={() => setIsIssuePartModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                issuePartMutation.mutate({
                  serviceJobId: id!,
                  partId: selectedPartId,
                  quantity: Number(issueQuantity),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Select Part from Inventory ({job.branchName}) *
                </label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                >
                  <option value="">-- Select Spare Part in Stock --</option>
                  {branchPartsStock.map((ps: any) => (
                    <option key={ps.partId} value={ps.partId}>
                      {ps.part?.partNumber} — {ps.part?.name} (Stock: {ps.quantityOnHand} available)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Quantity to Issue *</label>
                <input
                  type="number"
                  min="1"
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsIssuePartModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedPartId || issuePartMutation.isPending}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {issuePartMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Deduct & Issue Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Perform QC */}
      {isAddQcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Conduct Quality Control Inspection</h3>
              <button onClick={() => setIsAddQcModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addQcMutation.mutate({
                  checklist: qcChecklist,
                  status: qcStatus,
                  remarks: qcRemarks.trim(),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Inspection Status *</label>
                <select
                  value={qcStatus}
                  onChange={(e) => setQcStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                >
                  <option value="PASSED">PASSED — Certified for Road & Delivery</option>
                  <option value="FAILED">FAILED — Bay Rework Required</option>
                </select>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <span className="font-semibold text-zinc-700 block">Inspection Checklist Verification</span>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecklist.brakeTest}
                    onChange={(e) => setQcChecklist({ ...qcChecklist, brakeTest: e.target.checked })}
                    className="rounded text-[#F5A800] focus:ring-[#F5A800]"
                  />
                  <span>Brake and Hydraulic Circuit Certification</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecklist.fluidLevels}
                    onChange={(e) => setQcChecklist({ ...qcChecklist, fluidLevels: e.target.checked })}
                    className="rounded text-[#F5A800] focus:ring-[#F5A800]"
                  />
                  <span>Engine Oil, Coolant & Fluid Level Inspection</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecklist.electricalSystems}
                    onChange={(e) => setQcChecklist({ ...qcChecklist, electricalSystems: e.target.checked })}
                    className="rounded text-[#F5A800] focus:ring-[#F5A800]"
                  />
                  <span>Lighting, Telematics & Electrical Verification</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecklist.roadTest}
                    onChange={(e) => setQcChecklist({ ...qcChecklist, roadTest: e.target.checked })}
                    className="rounded text-[#F5A800] focus:ring-[#F5A800]"
                  />
                  <span>Operational Road Test Complete</span>
                </label>
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Inspector Remarks</label>
                <input
                  type="text"
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddQcModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addQcMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addQcMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Submit Inspection Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
