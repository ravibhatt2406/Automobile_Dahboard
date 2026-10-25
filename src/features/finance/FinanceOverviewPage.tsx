import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Truck,
  Eye,
  ChevronDown,
  ChevronUp,
  Receipt,
  Plus,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  FinanceApplicationDetail,
  FinanceDashboardStats,
  FinanceEmiSchedule,
  financeService,
} from '@/services/finance.service';
import { RecordEmiPaymentModal } from './RecordEmiPaymentModal';
import { CreateFinanceModal } from './CreateFinanceModal';
import { FinanceDetailModal } from './FinanceDetailModal';

export const FinanceOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'loans' | 'applications' | 'overdue'>('loans');
  const [applications, setApplications] = useState<FinanceApplicationDetail[]>([]);
  const [stats, setStats] = useState<FinanceDashboardStats | null>(null);
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [totalOverdueAmount, setTotalOverdueAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Loan for Schedule Expansion in Table
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [expandedLoanDetail, setExpandedLoanDetail] = useState<FinanceApplicationDetail | null>(null);
  const [expansionLoading, setExpansionLoading] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAppIdForDetail, setSelectedAppIdForDetail] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState<FinanceEmiSchedule | null>(null);

  const fetchStats = async () => {
    try {
      const res = await financeService.getDashboardStats();
      setStats(res);
    } catch {
      // stats fallback
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await financeService.getApplications({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm ? searchTerm : undefined,
      });
      setApplications(res.items || []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    try {
      const res = await financeService.getOverdueEmis();
      setOverdueItems(res.items || []);
      setTotalOverdueAmount(res.totalOverdueAmount || 0);
    } catch {
      setOverdueItems([]);
      setTotalOverdueAmount(0);
    }
  };

  const refreshAll = () => {
    fetchStats();
    fetchApplications();
    fetchOverdue();
    if (expandedLoanId) {
      financeService.getApplication(expandedLoanId).then(setExpandedLoanDetail);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOverdue();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [searchTerm, statusFilter]);

  const handleToggleExpandLoan = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
      setExpandedLoanDetail(null);
      return;
    }
    setExpandedLoanId(loanId);
    setExpansionLoading(true);
    try {
      const detail = await financeService.getApplication(loanId);
      setExpandedLoanDetail(detail);
    } catch {
      setExpandedLoanDetail(null);
    } finally {
      setExpansionLoading(false);
    }
  };

  const handleOpenDetailModal = (appId: string) => {
    setSelectedAppIdForDetail(appId);
    setDetailModalOpen(true);
  };

  const openPaymentModal = (schedule: FinanceEmiSchedule) => {
    setSelectedScheduleForPayment(schedule);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    refreshAll();
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

  // Filtered lists
  const activeLoans = applications.filter((a) => a.status === 'DISBURSED' || a.status === 'APPROVED');
  const underwritingApps = applications.filter((a) => a.status !== 'DISBURSED');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Vehicle Finance & Third-Party EMI Management"
        subtitle="Manage commercial loan underwriting, financier repayment schedules, and auditable collections strictly isolated from dealership sales revenue."
        breadcrumbItems={[{ label: 'Finance' }, { label: 'Loans & EMI Schedules' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Finance Agreement</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards — Backend Aggregated Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications / Agreements */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Finance Records</span>
            <Building className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats ? stats.totalApplications : applications.length}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span>Pending Review: <strong className="text-amber-400 font-mono">{stats?.pendingReview || 0}</strong></span>
            <span>•</span>
            <span>Approved: <strong className="text-emerald-400 font-mono">{stats?.approved || 0}</strong></span>
          </div>
        </div>

        {/* Active Disbursed Loans */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Loan Agreements</span>
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats ? stats.activeLoans : activeLoans.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Awaiting Disbursement: <strong className="text-blue-400 font-mono">{stats?.awaitingDisbursement || 0}</strong>
          </p>
        </div>

        {/* Overdue Installments */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue Installments</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {stats ? stats.overdueInstallments : overdueItems.length}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            ₹{(stats?.totalOverdueAmount ?? totalOverdueAmount).toLocaleString('en-IN')} pending lender debits
          </p>
        </div>

        {/* Outstanding Loan Obligation Balance */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Outstanding Obligation</span>
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{stats?.outstandingBalance ? Number(stats.outstandingBalance).toLocaleString('en-IN') : '0'}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strictly isolated from dealership sales</span>
          </div>
        </div>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('loans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'loans'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Active Agreements & EMI Schedules ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'overdue'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Monitor ({stats?.overdueInstallments ?? overdueItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'applications'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Credit Underwriting ({underwritingApps.length})</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, loan ref, lender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DISBURSED">DISBURSED</option>
          </select>
        </div>
      </div>

      {/* TAB 1: Active Agreements & EMI Schedules */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Loan Ref / App #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Financier</th>
                    <th className="px-4 py-3 text-right">Principal (₹)</th>
                    <th className="px-4 py-3 text-right">Monthly EMI (₹)</th>
                    <th className="px-4 py-3">Progress / Overdue</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                        <span>Loading finance agreements...</span>
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        No finance agreements matching criteria.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const isExpanded = expandedLoanId === app.id;
                      const emiSum = app.emiSummary || {};
                      const overdueCount = emiSum.overdueCount || 0;

                      return (
                        <React.Fragment key={app.id}>
                          <tr className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-mono font-semibold text-blue-400">
                                {app.loanReference || app.applicationNumber}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Book #{app.booking?.bookingNumber || '--'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{app.customer?.name || '--'}</div>
                              <div className="text-xs text-slate-400 font-mono">{app.customer?.phone || ''}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-200">{app.financeProvider}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                              ₹{Number(app.loanAmount).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">
                              {app.emiAmount ? `₹${Number(app.emiAmount).toLocaleString('en-IN')}` : '--'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-slate-300">
                                {app.emiSchedules && app.emiSchedules.length > 0
                                  ? `${app.emiSchedules.filter((s) => s.status === 'PAID').length} / ${app.emiSchedules.length} EMIs Paid`
                                  : 'No Schedule Generated'}
                              </div>
                              {overdueCount > 0 && (
                                <div className="text-xs text-red-400 font-bold flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{overdueCount} Overdue</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={app.status} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenDetailModal(app.id)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                  title="View Full Loan Details & Underwriting"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleExpandLoan(app.id)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                    isExpanded
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  }`}
                                >
                                  <span>{isExpanded ? 'Hide' : 'Schedule'}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Full Schedule Drawer */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-4 bg-slate-950 border-t border-b border-slate-800">
                                {expansionLoading ? (
                                  <div className="py-6 text-center text-slate-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                  </div>
                                ) : !expandedLoanDetail ? (
                                  <div className="py-4 text-center text-slate-500">Failed to load schedule.</div>
                                ) : (
                                  <div className="space-y-4">
                                    {/* Loan summary banner */}
                                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
                                      <div>
                                        <span className="text-slate-500 block">Total Obligations:</span>
                                        <span className="font-mono font-bold text-white text-sm">
                                          ₹{Number(expandedLoanDetail.emiSummary?.totalEmiObligation || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Collected to Date:</span>
                                        <span className="font-mono font-bold text-emerald-400 text-sm">
                                          ₹{Number(expandedLoanDetail.emiSummary?.totalPaid || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Outstanding Balance:</span>
                                        <span className="font-mono font-bold text-amber-400 text-sm">
                                          ₹{Number(expandedLoanDetail.emiSummary?.outstandingAmount || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Overdue Debt:</span>
                                        <span className="font-mono font-bold text-red-400 text-sm">
                                          ₹{Number(expandedLoanDetail.emiSummary?.totalOverdueAmount || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Schedule Table */}
                                    <div className="border border-slate-800 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                                      <table className="w-full text-left text-xs text-slate-300">
                                        <thead className="bg-slate-900 sticky top-0 text-slate-400 border-b border-slate-800 font-semibold">
                                          <tr>
                                            <th className="px-3 py-2">#</th>
                                            <th className="px-3 py-2">Due Date</th>
                                            <th className="px-3 py-2 text-right">EMI Amount (₹)</th>
                                            <th className="px-3 py-2 text-right">Principal / Interest</th>
                                            <th className="px-3 py-2 text-right">Amount Paid (₹)</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2">Channel / Ref</th>
                                            <th className="px-3 py-2 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/80">
                                          {!expandedLoanDetail.emiSchedules || expandedLoanDetail.emiSchedules.length === 0 ? (
                                            <tr>
                                              <td colSpan={8} className="py-6 text-center text-slate-500">
                                                No EMI schedule generated yet. Click "View Details" to generate schedule.
                                              </td>
                                            </tr>
                                          ) : (
                                            expandedLoanDetail.emiSchedules.map((s) => {
                                              const statusToDisplay = s.liveStatus || s.status;
                                              const isPaid = Number(s.paidAmount) >= Number(s.emiAmount);

                                              return (
                                                <tr key={s.id} className="hover:bg-slate-900/50">
                                                  <td className="px-3 py-2 font-mono">{s.installmentNumber}</td>
                                                  <td className="px-3 py-2 text-slate-300">
                                                    {new Date(s.dueDate).toLocaleDateString()}
                                                  </td>
                                                  <td className="px-3 py-2 text-right font-mono font-semibold text-white">
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
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Overdue Collections Monitor */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                Overdue EMI installments identified from actual financier repayment schedules and calendar maturity dates.
              </span>
            </div>
            <span className="font-bold text-white font-mono text-sm">
              Total Overdue: ₹{totalOverdueAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Customer / Contact</th>
                    <th className="px-4 py-3">Financier / Loan Ref</th>
                    <th className="px-4 py-3">Installment #</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Overdue Amount (₹)</th>
                    <th className="px-4 py-3">Days Overdue</th>
                    <th className="px-4 py-3 text-right">Collection Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {overdueItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <span>All loan schedules are current! No overdue EMI records in scope.</span>
                      </td>
                    </tr>
                  ) : (
                    overdueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{item.financeApplication?.customer?.name || 'Customer'}</div>
                          <div className="text-xs font-mono text-blue-400">{item.financeApplication?.customer?.phone || '--'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200">{item.financeApplication?.financeProvider}</div>
                          <div className="text-xs font-mono text-slate-400">
                            {item.financeApplication?.loanReference || item.financeApplication?.applicationNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-300">#{item.installmentNumber}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-red-400">
                          ₹{Number(item.overdueAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            {item.daysOverdue} days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openPaymentModal(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Credit Applications */}
      {activeTab === 'applications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">App #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Lender Partner</th>
                  <th className="px-4 py-3 text-right">Loan Principal</th>
                  <th className="px-4 py-3 text-right">Down Payment</th>
                  <th className="px-4 py-3">Tenure</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {underwritingApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No active underwriting applications found.
                    </td>
                  </tr>
                ) : (
                  underwritingApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-400">{app.applicationNumber}</td>
                      <td className="px-4 py-3 font-medium text-white">{app.customer?.name || '--'}</td>
                      <td className="px-4 py-3">{app.financeProvider}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        ₹{Number(app.loanAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        ₹{Number(app.downPayment).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">{app.tenureMonths} Months</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenDetailModal(app.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Review & Underwrite
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Finance Agreement Modal */}
      <CreateFinanceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={refreshAll}
      />

      {/* Finance Detail & Underwriting Modal */}
      <FinanceDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        applicationId={selectedAppIdForDetail}
        onRefresh={refreshAll}
      />

      {/* Payment Recording Modal */}
      <RecordEmiPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        schedule={selectedScheduleForPayment}
        applicationNumber={selectedScheduleForPayment?.financeApplicationId}
        customerName="Commercial Borrower"
      />
    </div>
  );
};
