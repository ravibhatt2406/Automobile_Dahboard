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
} from 'lucide-react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  FinanceApplicationDetail,
  FinanceEmiSchedule,
  financeService,
} from '@/services/finance.service';
import { RecordEmiPaymentModal } from './RecordEmiPaymentModal';

export const FinanceOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'loans' | 'overdue'>('loans');
  const [applications, setApplications] = useState<FinanceApplicationDetail[]>([]);
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [totalOverdueAmount, setTotalOverdueAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Selected Loan for Schedule Drawer / View
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<FinanceApplicationDetail | null>(null);
  const [loanDetailLoading, setLoanDetailLoading] = useState(false);

  // Payment Recording Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState<FinanceEmiSchedule | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await financeService.getApplications();
      setApplications(res.items);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    try {
      const res = await financeService.getOverdueEmis();
      setOverdueItems(res.items);
      setTotalOverdueAmount(res.totalOverdueAmount);
    } catch {
      setOverdueItems([]);
      setTotalOverdueAmount(0);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchOverdue();
  }, []);

  const handleSelectLoan = async (loanId: string) => {
    if (selectedLoanId === loanId) {
      setSelectedLoanId(null);
      setSelectedLoanDetail(null);
      return;
    }
    setSelectedLoanId(loanId);
    setLoanDetailLoading(true);
    try {
      const detail = await financeService.getApplication(loanId);
      setSelectedLoanDetail(detail);
    } catch {
      setSelectedLoanDetail(null);
    } finally {
      setLoanDetailLoading(false);
    }
  };

  const openPaymentModal = (schedule: FinanceEmiSchedule) => {
    setSelectedScheduleForPayment(schedule);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchApplications();
    fetchOverdue();
    if (selectedLoanId) {
      financeService.getApplication(selectedLoanId).then(setSelectedLoanDetail);
    }
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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Fleet Finance & Third-Party EMI Management"
        subtitle="Manage commercial loan underwriting, financier repayment schedules, and auditable collections strictly isolated from dealership sales revenue."
        breadcrumbItems={[{ label: 'Finance' }, { label: 'Loans & EMI Schedules' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Active Loans</span>
            <Building className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{applications.length}</div>
          <p className="text-xs text-slate-400 mt-1">Lender agreements & underwriting</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue Installments</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{overdueItems.length}</div>
          <p className="text-xs text-slate-400 mt-1">Requiring immediate collection follow-up</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue Amount</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{totalOverdueAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Pending lender auto-debits</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Revenue Status</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400">Strictly Isolated</div>
          <p className="text-xs text-slate-400 mt-1">Financier debts excluded from dealer sales</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'loans'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Active Loans & EMI Schedules ({applications.length})</span>
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
          <span>Overdue Collections Monitor ({overdueItems.length})</span>
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
          <span>Credit Underwriting List</span>
        </button>
      </div>

      {/* TAB 1: Active Loans & EMI Schedules */}
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
                    <th className="px-4 py-3 text-center">Repayment Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        No active commercial finance agreements registered.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const isExpanded = selectedLoanId === app.id;
                      const emiSum = app.emiSummary || {};
                      const overdueCount = emiSum.overdueCount || 0;

                      return (
                        <React.Fragment key={app.id}>
                          <tr className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-mono font-semibold text-blue-400">
                                {app.loanReference || app.applicationNumber}
                              </div>
                              <div className="text-[11px] text-slate-500">Book #{app.booking?.bookingNumber || '--'}</div>
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
                                {app.emiSchedules ? `${app.emiSchedules.filter((s) => s.status === 'PAID').length} / ${app.emiSchedules.length} EMIs Paid` : '--'}
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
                              <button
                                onClick={() => handleSelectLoan(app.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors ${
                                  isExpanded
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                              >
                                <span>{isExpanded ? 'Hide Schedule' : 'View Schedule'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Full Schedule Drawer */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-4 bg-slate-950 border-t border-b border-slate-800">
                                {loanDetailLoading ? (
                                  <div className="py-6 text-center text-slate-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                  </div>
                                ) : !selectedLoanDetail ? (
                                  <div className="py-4 text-center text-slate-500">Failed to load schedule.</div>
                                ) : (
                                  <div className="space-y-4">
                                    {/* Loan summary banner */}
                                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
                                      <div>
                                        <span className="text-slate-500 block">Total EMI Obligation:</span>
                                        <span className="font-mono font-bold text-white text-sm">
                                          ₹{Number(selectedLoanDetail.emiSummary?.totalEmiObligation || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Collected to Date:</span>
                                        <span className="font-mono font-bold text-emerald-400 text-sm">
                                          ₹{Number(selectedLoanDetail.emiSummary?.totalPaid || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Outstanding Balance:</span>
                                        <span className="font-mono font-bold text-amber-400 text-sm">
                                          ₹{Number(selectedLoanDetail.emiSummary?.outstandingAmount || 0).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Overdue Debt:</span>
                                        <span className="font-mono font-bold text-red-400 text-sm">
                                          ₹{Number(selectedLoanDetail.emiSummary?.totalOverdueAmount || 0).toLocaleString('en-IN')}
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
                                          {selectedLoanDetail.emiSchedules?.map((s) => {
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
                                          })}
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
                Overdue EMI installments identified from actual financier schedules and calendar maturity dates.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {applications.map((app) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
