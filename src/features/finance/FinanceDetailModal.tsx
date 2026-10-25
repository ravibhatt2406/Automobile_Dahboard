import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Truck,
  ArrowRight,
  ShieldCheck,
  Plus,
  Loader2,
  Receipt,
  User,
  History,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  FinanceApplicationDetail,
  FinanceEmiSchedule,
  financeService,
} from '@/services/finance.service';
import { RecordEmiPaymentModal } from './RecordEmiPaymentModal';

interface FinanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string | null;
  onRefresh: () => void;
}

export const FinanceDetailModal: React.FC<FinanceDetailModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  onRefresh,
}) => {
  const [application, setApplication] = useState<FinanceApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'documents' | 'history'>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status transition state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Payment Recording Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<FinanceEmiSchedule | null>(null);

  // Document attachment
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docKey, setDocKey] = useState('');
  const [docType, setDocType] = useState('LOAN_AGREEMENT');

  // History state
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && applicationId) {
      loadApplication();
    } else {
      setApplication(null);
      setActionError(null);
    }
  }, [isOpen, applicationId]);

  const loadApplication = async () => {
    if (!applicationId) return;
    setLoading(true);
    setActionError(null);
    try {
      const data = await financeService.getApplication(applicationId);
      setApplication(data);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to fetch finance application');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!applicationId) return;
    setHistoryLoading(true);
    try {
      const data = await financeService.getHistory(applicationId);
      setHistoryItems(data);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (tab: 'overview' | 'schedule' | 'documents' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      loadHistory();
    }
  };

  const handleOpenStatusModal = (status: string) => {
    setTargetStatus(status);
    setStatusRemarks('');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!applicationId || !targetStatus) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await financeService.updateStatus(applicationId, targetStatus, statusRemarks);
      setShowStatusModal(false);
      await loadApplication();
      onRefresh();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update loan status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!applicationId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await financeService.generateEmiSchedule(applicationId, {
        interestMethod: application?.interestMethod || 'REDUCING_BALANCE',
        firstEmiDate: application?.firstEmiDate || undefined,
      });
      await loadApplication();
      setActiveTab('schedule');
      onRefresh();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to generate EMI schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !docName.trim() || !docKey.trim()) return;
    setActionLoading(true);
    try {
      await financeService.attachDocument(applicationId, {
        documentName: docName.trim(),
        documentKey: docKey.trim(),
        documentType: docType,
      });
      setShowDocModal(false);
      setDocName('');
      setDocKey('');
      await loadApplication();
      if (activeTab === 'history') loadHistory();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to attach document.');
    } finally {
      setActionLoading(false);
    }
  };

  const openPaymentModal = (schedule: FinanceEmiSchedule) => {
    setSelectedSchedule(schedule);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    await loadApplication();
    onRefresh();
  };

  const getEmiStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'OVERDUE':
        return 'bg-red-500/10 text-red-400 border-red-500/20 font-bold';
      case 'PARTIALLY_PAID':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DUE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'UPCOMING':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {application?.loanReference || application?.applicationNumber || 'Finance Agreement'}
                </h3>
                {application && <StatusBadge status={application.status} />}
                {application?.isManual && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Manual Dealership Entry
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {application?.financeProvider} • Application #{application?.applicationNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => handleTabChange('overview')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Overview & Underwriting</span>
          </button>
          <button
            onClick={() => handleTabChange('schedule')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Repayment Schedule ({application?.emiSchedules?.length || 0})</span>
          </button>
          <button
            onClick={() => handleTabChange('documents')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>Documents ({application?.documents?.length || (application?.documentKey ? 1 : 0)})</span>
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              <span>Loading commercial loan details...</span>
            </div>
          ) : !application ? (
            <div className="py-12 text-center text-slate-500">
              Finance application record not found or inaccessible.
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status Transition Control Bar */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Underwriting Stage:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={application.status} />
                        <span className="text-xs text-slate-400">
                          {application.status === 'DRAFT' && '— Record drafted, ready for submission to lender'}
                          {application.status === 'SUBMITTED' && '— Forwarded to financier credit team'}
                          {application.status === 'UNDER_REVIEW' && '— Credit appraisal & field verification underway'}
                          {application.status === 'APPROVED' && '— Sanction letter issued by financier'}
                          {application.status === 'REJECTED' && '— Declined by financier underwriting'}
                          {application.status === 'DISBURSED' && '— Loan funds disbursed to dealership'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {application.status === 'DRAFT' && (
                        <button
                          onClick={() => handleOpenStatusModal('SUBMITTED')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Submit to Lender</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {application.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleOpenStatusModal('UNDER_REVIEW')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Mark Under Review</span>
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {application.status === 'UNDER_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleOpenStatusModal('APPROVED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Approve Loan</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal('REJECTED')}
                            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Reject</span>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {application.status === 'APPROVED' && (
                        <button
                          onClick={() => handleOpenStatusModal('DISBURSED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Record Disbursement</span>
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Generate schedule button if approved/disbursed and no schedules */}
                      {(application.status === 'APPROVED' || application.status === 'DISBURSED') &&
                        (!application.emiSchedules || application.emiSchedules.length === 0) && (
                          <button
                            onClick={handleGenerateSchedule}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                            <span>Generate EMI Schedule</span>
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-[11px] text-slate-400 block">Vehicle Asset Price</span>
                      <span className="text-base font-bold text-white font-mono">
                        ₹{Number(application.vehiclePrice || (Number(application.loanAmount) + Number(application.downPayment))).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-[11px] text-slate-400 block">Down Payment</span>
                      <span className="text-base font-bold text-slate-300 font-mono">
                        ₹{Number(application.downPayment).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-[11px] text-slate-400 block">Loan Principal</span>
                      <span className="text-base font-bold text-blue-400 font-mono">
                        ₹{Number(application.loanAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-[11px] text-slate-400 block">Scheduled Monthly EMI</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {application.emiAmount ? `₹${Number(application.emiAmount).toLocaleString('en-IN')}` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Customer, Vehicle & Deal Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>Borrower / Customer Profile</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-bold text-white text-base">
                          {application.customer?.name || `${application.customer?.firstName || ''} ${application.customer?.lastName || ''}`.trim() || 'Customer'}
                        </div>
                        <div className="text-slate-400 text-xs mt-1 space-y-0.5">
                          <div>Phone: {application.customer?.phone || '--'}</div>
                          <div>Email: {application.customer?.email || '--'}</div>
                          <div>Address: {application.customer?.address || application.customer?.city || '--'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle & Deal Info */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>Commercial Vehicle & Deal</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-bold text-white text-base">
                          {application.vehicle?.model || application.booking?.vehicle?.model || 'Commercial Vehicle'}
                        </div>
                        <div className="text-slate-400 text-xs mt-1 space-y-0.5 font-mono">
                          <div>VIN: {application.vehicle?.vin || application.booking?.vehicle?.vin || '--'}</div>
                          <div>Chassis: {application.vehicle?.chassisNumber || application.booking?.vehicle?.chassisNumber || '--'}</div>
                          <div>Deal Booking: #{application.booking?.bookingNumber || '--'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lender Terms Details */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Building className="w-4 h-4 text-purple-400" />
                      <span>Financier Sanction & Terms</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Lender Name:</span>
                        <span className="font-medium text-white">{application.financeProvider}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sanction Reference:</span>
                        <span className="font-mono text-white">{application.loanReference || '--'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Interest Rate:</span>
                        <span className="font-mono text-white">{application.interestRate ? `${application.interestRate}% p.a.` : '--'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Interest Method:</span>
                        <span className="font-medium text-blue-300">
                          {application.interestMethod === 'FLAT_RATE' ? 'Flat Interest Rate' : 'Reducing Balance'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tenure:</span>
                        <span className="font-medium text-white">{application.tenureMonths} Months</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">First EMI Date:</span>
                        <span className="font-mono text-white">
                          {application.firstEmiDate ? new Date(application.firstEmiDate).toLocaleDateString() : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Approved At:</span>
                        <span className="font-mono text-emerald-400">
                          {application.approvedAt ? new Date(application.approvedAt).toLocaleDateString() : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Disbursed Amount:</span>
                        <span className="font-mono text-emerald-400">
                          {application.disbursedAmount ? `₹${Number(application.disbursedAmount).toLocaleString('en-IN')}` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {application.remarks && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                      <span className="text-slate-500 block mb-1">Underwriter Remarks:</span>
                      <p className="text-slate-300">{application.remarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REPAYMENT SCHEDULE */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Installment repayment schedules calculated strictly per lender terms.
                    </div>
                    {(!application.emiSchedules || application.emiSchedules.length === 0) && (
                      <button
                        onClick={handleGenerateSchedule}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                        <span>Generate EMI Schedule</span>
                      </button>
                    )}
                  </div>

                  {/* Summary Bar */}
                  {application.emiSummary && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Obligations:</span>
                        <span className="font-mono font-bold text-white text-sm">
                          ₹{Number(application.emiSummary.totalEmiObligation || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Paid to Financier:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          ₹{Number(application.emiSummary.totalPaid || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Balance Pending:</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          ₹{Number(application.emiSummary.outstandingAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Overdue Amount:</span>
                        <span className="font-mono font-bold text-red-400 text-sm">
                          ₹{Number(application.emiSummary.totalOverdueAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Schedule Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 sticky top-0 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                          <tr>
                            <th className="px-3 py-2.5">#</th>
                            <th className="px-3 py-2.5">Due Date</th>
                            <th className="px-3 py-2.5 text-right">EMI (₹)</th>
                            <th className="px-3 py-2.5 text-right">Principal / Interest</th>
                            <th className="px-3 py-2.5 text-right">Paid (₹)</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Txn Ref</th>
                            <th className="px-3 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {!application.emiSchedules || application.emiSchedules.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-500">
                                No EMI schedule generated yet. Click "Generate EMI Schedule" once loan terms are finalized.
                              </td>
                            </tr>
                          ) : (
                            application.emiSchedules.map((s) => {
                              const statusToDisplay = s.liveStatus || s.status;
                              const isPaid = Number(s.paidAmount) >= Number(s.emiAmount);

                              return (
                                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="px-3 py-2 font-mono font-bold">{s.installmentNumber}</td>
                                  <td className="px-3 py-2 font-mono text-slate-200">
                                    {new Date(s.dueDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-white">
                                    ₹{Number(s.emiAmount).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-400">
                                    ₹{Number(s.principalComponent).toLocaleString('en-IN')} / ₹{Number(s.interestComponent).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400">
                                    ₹{Number(s.paidAmount).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getEmiStatusBadge(statusToDisplay)}`}>
                                      {statusToDisplay}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-slate-400 font-mono">
                                    {s.paymentReference ? `${s.paymentMode || 'BANK'}: ${s.paymentReference}` : '--'}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {!isPaid && (
                                      <button
                                        onClick={() => openPaymentModal(s)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-[11px] transition-colors"
                                      >
                                        Record Payment
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Lender sanction letters, borrower KYC, and NACH direct-debit mandates.
                    </span>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Document</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {application.documentKey && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="text-sm font-semibold text-white">Primary Loan Sanction Document</div>
                            <div className="text-xs text-slate-400 font-mono">{application.documentKey}</div>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium">Recorded at creation</span>
                      </div>
                    )}

                    {application.documents?.map((doc: any) => (
                      <div key={doc.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="text-sm font-semibold text-white">{doc.documentName}</div>
                            <div className="text-xs text-slate-400 font-mono">{doc.documentKey}</div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}

                    {!application.documentKey && (!application.documents || application.documents.length === 0) && (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        No documents attached to this loan record yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="py-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                      <span>Loading audit entries...</span>
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No audit history entries recorded for this loan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historyItems.map((h: any) => (
                        <div key={h.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{h.action}</span>
                            <span className="text-slate-500 font-mono">{new Date(h.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-slate-400">
                            By: {h.actorName || 'Authorized Dealership Staff'} ({h.actorRole || 'SYSTEM'})
                          </div>
                          {h.details && (
                            <pre className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300 overflow-x-auto mt-1">
                              {typeof h.details === 'string' ? h.details : JSON.stringify(h.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs text-slate-500">
            Tenant Isolated • Titan Auto Multi-Branch Commercial Lending
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Underwriting Status Transition Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-base font-bold text-white">
              Confirm Stage Change: {targetStatus}
            </h4>
            <p className="text-xs text-slate-400">
              Provide authorization remarks or reference notes for this loan transition.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Remarks / Sanction Reference
              </label>
              <textarea
                rows={3}
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="e.g. Sanction letter received from TMF credit committee..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmStatusChange}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Transition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Attachment Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleAttachDocument} className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-base font-bold text-white">Attach Loan Document</h4>
            <p className="text-xs text-slate-400">
              Store a verified document reference into this finance agreement audit record.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. NACH Mandate Signed Copy"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document Key / Storage URI <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={docKey}
                onChange={(e) => setDocKey(e.target.value)}
                placeholder="docs/finance/mandate_signed_9812.pdf"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="LOAN_AGREEMENT">Loan Agreement</option>
                <option value="SANCTION_LETTER">Sanction Letter</option>
                <option value="NACH_MANDATE">NACH / Auto-Debit Mandate</option>
                <option value="BORROWER_KYC">Borrower KYC</option>
                <option value="DISBURSEMENT_MEMO">Disbursement Advice</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Attach</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Recording Modal */}
      <RecordEmiPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        schedule={selectedSchedule}
        applicationNumber={application?.loanReference || application?.applicationNumber}
        customerName={application?.customer?.name}
      />
    </div>
  );
};
