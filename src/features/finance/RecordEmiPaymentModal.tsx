import React, { useState } from 'react';
import { X, CreditCard, Save, AlertCircle, Loader2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { FinanceEmiSchedule, financeService } from '@/services/finance.service';

interface RecordEmiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule: FinanceEmiSchedule | null;
  applicationNumber?: string;
  customerName?: string;
}

export const RecordEmiPaymentModal: React.FC<RecordEmiPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  schedule,
  applicationNumber,
  customerName,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NACH_ECS');
  const [paymentReference, setPaymentReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (schedule) {
      const remaining = Number(schedule.emiAmount) - Number(schedule.paidAmount);
      setAmount(String(Math.max(0, remaining)));
      setPaymentReference('');
      setPaidAt(new Date().toISOString().split('T')[0]);
      setReceiptUrl('');
      setNotes('');
      setError(null);
    }
  }, [schedule, isOpen]);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('A valid payment amount is required');
      return;
    }
    if (!paymentReference.trim()) {
      setError('Bank / Financier Transaction reference number is required');
      return;
    }

    setLoading(true);
    try {
      await financeService.recordEmiPayment(schedule.id, {
        amount: numAmount,
        paymentMode,
        paymentReference: paymentReference.trim(),
        paidAt: new Date(paidAt).toISOString(),
        receiptUrl: receiptUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record EMI collection');
    } finally {
      setLoading(false);
    }
  };

  const emiAmount = Number(schedule.emiAmount);
  const paidAmount = Number(schedule.paidAmount);
  const remaining = emiAmount - paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Record Financier EMI Collection</h3>
              <p className="text-xs text-slate-400">
                Installment #{schedule.installmentNumber} • Due {new Date(schedule.dueDate).toLocaleDateString()}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Notice Banner */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
            <span className="font-semibold text-white">Important Financial Isolation:</span> This records debt repayment to the financier. It is stored as loan repayment audit and is strictly separated from Titan Auto dealership billing revenue.
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Context box */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Customer / Loan:</span>
              <span className="font-medium text-white truncate block">{customerName || 'Customer'}</span>
              <span className="text-slate-400 font-mono text-[11px]">{applicationNumber || '--'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Total EMI / Remaining:</span>
              <span className="font-mono font-bold text-white">₹{emiAmount.toLocaleString('en-IN')}</span>
              <span className="text-amber-400 block font-mono text-[11px]">
                ₹{remaining.toLocaleString('en-IN')} pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Collection Amount (₹) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Payment Channel <span className="text-red-400">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="NACH_ECS">NACH / ECS Auto-Debit</option>
                <option value="NEFT">NEFT Bank Transfer</option>
                <option value="RTGS">RTGS High-Value Transfer</option>
                <option value="CHEQUE">Banker&apos;s Cheque</option>
                <option value="UPI">Direct UPI / QR Gateway</option>
                <option value="DIRECT_DEBIT">Lender Direct Debit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Transaction / UTR Reference <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. HDFC-NACH-994821 or UTR-30918"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Clearance Date</label>
              <input
                type="date"
                required
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Bank Receipt / Advice URL</label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://cdn.titanauto.com/finance/advice-102.pdf"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Audit Notes / Comments</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Verified via bank statement and lender notification"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Verify & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
