import React, { useState, useEffect } from 'react';
import { X, CreditCard, Save, AlertCircle, Loader2, Calculator, CheckCircle2 } from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';

interface CreateFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateFinanceModal: React.FC<CreateFinanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form State
  const [customerId, setCustomerId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [financeProvider, setFinanceProvider] = useState('Tata Motors Finance');
  const [loanReference, setLoanReference] = useState('');
  const [vehiclePrice, setVehiclePrice] = useState<number>(2500000);
  const [downPayment, setDownPayment] = useState<number>(500000);
  const [loanAmount, setLoanAmount] = useState<number>(2000000);
  const [interestRate, setInterestRate] = useState<number>(9.5);
  const [interestMethod, setInterestMethod] = useState<'REDUCING_BALANCE' | 'FLAT_RATE'>('REDUCING_BALANCE');
  const [tenureMonths, setTenureMonths] = useState<number>(48);
  const [firstEmiDate, setFirstEmiDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  );
  const [documentKey, setDocumentKey] = useState('');
  const [remarks, setRemarks] = useState('');

  // Options State
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCustomerId('');
    setBookingId('');
    setVehicleId('');
    setFinanceProvider('Tata Motors Finance');
    setLoanReference(`FIN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);
    setVehiclePrice(2500000);
    setDownPayment(500000);
    setLoanAmount(2000000);
    setInterestRate(9.5);
    setInterestMethod('REDUCING_BALANCE');
    setTenureMonths(48);
    setFirstEmiDate(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    setDocumentKey('');
    setRemarks('');
    setError(null);
  };

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [custList, bookList] = await Promise.all([
        customerService.getCustomers({ pageSize: 100 }),
        salesService.getBookings({ pageSize: 100 }),
      ]);
      setCustomers(custList.data || []);
      setBookings(bookList.data || []);
    } catch {
      // Ignored
    } finally {
      setLoadingOptions(false);
    }
  };

  // Adjust loanAmount when vehiclePrice or downPayment change
  const handlePriceChange = (val: number) => {
    setVehiclePrice(val);
    if (val >= downPayment) {
      setLoanAmount(val - downPayment);
    }
  };

  const handleDownPaymentChange = (val: number) => {
    setDownPayment(val);
    if (vehiclePrice >= val) {
      setLoanAmount(vehiclePrice - val);
    }
  };

  // Live EMI Calculation
  const calculateEmi = () => {
    const P = Number(loanAmount);
    const n = Number(tenureMonths);
    const rAnnual = Number(interestRate);

    if (!P || !n || P <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayable: 0 };

    if (rAnnual === 0) {
      const emi = Math.round(P / n);
      return { emi, totalInterest: 0, totalPayable: P };
    }

    if (interestMethod === 'FLAT_RATE') {
      const totalInterest = Math.round(P * (rAnnual / 100) * (n / 12));
      const totalPayable = P + totalInterest;
      const emi = Math.round(totalPayable / n);
      return { emi, totalInterest, totalPayable };
    } else {
      // Reducing Balance
      const r = rAnnual / 12 / 100;
      const factor = Math.pow(1 + r, n);
      const emi = Math.round((P * r * factor) / (factor - 1));
      const totalPayable = emi * n;
      const totalInterest = totalPayable - P;
      return { emi, totalInterest, totalPayable };
    }
  };

  const { emi, totalInterest, totalPayable } = calculateEmi();

  // Filter bookings when customer changes
  const customerBookings = customerId
    ? bookings.filter((b) => b.customerId === customerId)
    : bookings;

  const handleBookingChange = (bId: string) => {
    setBookingId(bId);
    const selected = bookings.find((b) => b.id === bId);
    if (selected) {
      if (selected.customerId) setCustomerId(selected.customerId);
      if (selected.vehicleId) setVehicleId(selected.vehicleId);
      if (selected.pricing?.totalPrice || selected.totalAmount) {
        const p = Number(selected.pricing?.totalPrice || selected.totalAmount);
        setVehiclePrice(p);
        const dp = Math.round(p * 0.2);
        setDownPayment(dp);
        setLoanAmount(p - dp);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select an existing customer.');
      return;
    }

    if (loanAmount <= 0) {
      setError('Loan principal amount must be greater than zero.');
      return;
    }

    if (loanAmount > vehiclePrice) {
      setError('Loan principal amount cannot exceed the vehicle price.');
      return;
    }

    setSubmitting(true);
    try {
      await financeService.createApplication({
        customerId,
        bookingId: bookingId || undefined,
        vehicleId: vehicleId || undefined,
        financeProvider: financeProvider.trim(),
        loanReference: loanReference.trim() || undefined,
        vehiclePrice: Number(vehiclePrice),
        loanAmount: Number(loanAmount),
        downPayment: Number(downPayment),
        interestRate: Number(interestRate),
        interestMethod,
        tenureMonths: Number(tenureMonths),
        emiAmount: emi,
        firstEmiDate: new Date(firstEmiDate).toISOString(),
        documentKey: documentKey.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create finance application record.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Vehicle Finance Agreement</h3>
              <p className="text-xs text-slate-400">
                Record commercial loan terms, financier agreements, and repayment parameters.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dealership / Customer Scope */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Customer & Deal Association
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setBookingId('');
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()} ({c.phone || c.email || 'No Contact'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Linked Vehicle Deal Booking
                </label>
                <select
                  value={bookingId}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Booking (Optional) --</option>
                  {customerBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.bookingNumber} • {b.vehicle?.model || 'Vehicle'} • ₹{Number(b.pricing?.totalPrice || b.totalAmount || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Selecting a booking links the vehicle VIN and dealership branch automatically.
                </span>
              </div>
            </div>
          </div>

          {/* Financier & Loan References */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Lender Details & Reference
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Financier / Lender Partner <span className="text-red-400">*</span>
                </label>
                <select
                  value={financeProvider}
                  onChange={(e) => setFinanceProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Tata Motors Finance">Tata Motors Finance</option>
                  <option value="HDFC Bank Commercial Vehicle Division">HDFC Bank Commercial Vehicle Division</option>
                  <option value="ICICI Bank Fleet Finance">ICICI Bank Fleet Finance</option>
                  <option value="Cholamandalam Investment & Finance">Cholamandalam Investment & Finance</option>
                  <option value="IndusInd Bank Commercial Vehicle Finance">IndusInd Bank Commercial Vehicle Finance</option>
                  <option value="Mahindra & Mahindra Financial Services">Mahindra & Mahindra Financial Services</option>
                  <option value="Sundaram Finance Limited">Sundaram Finance Limited</option>
                  <option value="Kotak Mahindra Bank Commercial">Kotak Mahindra Bank Commercial</option>
                  <option value="Other Institutional Lender">Other Institutional Lender</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Loan Agreement / Sanction Reference #
                </label>
                <input
                  type="text"
                  value={loanReference}
                  onChange={(e) => setLoanReference(e.target.value)}
                  placeholder="e.g. TMF-SAN-2026-9812"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Breakdown & Pricing */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Loan Principal & Interest Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vehicle Price (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={vehiclePrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Down Payment (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={downPayment}
                  onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Loan Principal Amount (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Annual Interest Rate (% p.a.) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.05"
                  min="0"
                  max="40"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Interest Method <span className="text-red-400">*</span>
                </label>
                <select
                  value={interestMethod}
                  onChange={(e) => setInterestMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="REDUCING_BALANCE">Reducing Balance (Standard Bank)</option>
                  <option value="FLAT_RATE">Flat Interest Rate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tenure (Months) <span className="text-red-400">*</span>
                </label>
                <select
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                  <option value={36}>36 Months (3 Years)</option>
                  <option value={48}>48 Months (4 Years)</option>
                  <option value={60}>60 Months (5 Years)</option>
                  <option value={72}>72 Months (6 Years)</option>
                  <option value={84}>84 Months (7 Years)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                First EMI Due Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={firstEmiDate}
                onChange={(e) => setFirstEmiDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Live Calculation Card */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-blue-300 block font-medium">Estimated Monthly EMI</span>
                <span className="text-xl font-bold font-mono text-white">
                  ₹{emi.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-blue-300/80 block mt-0.5">
                  {interestMethod === 'REDUCING_BALANCE' ? 'Amortized Reducing Balance' : 'Flat Interest'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-blue-300 block font-medium">Total Interest Payable</span>
                <span className="text-lg font-semibold font-mono text-amber-400">
                  ₹{totalInterest.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Over {tenureMonths} installments</span>
              </div>
              <div>
                <span className="text-[11px] text-blue-300 block font-medium">Total Loan Repayment</span>
                <span className="text-lg font-semibold font-mono text-emerald-400">
                  ₹{totalPayable.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Excludes Down Payment</span>
              </div>
            </div>
          </div>

          {/* Supporting Documents & Remarks */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              4. Documentation & Underwriting Notes
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sanction Letter / Loan Agreement Document Reference
                </label>
                <input
                  type="text"
                  value={documentKey}
                  onChange={(e) => setDocumentKey(e.target.value)}
                  placeholder="e.g. docs/finance/sanction_tmf_9812.pdf"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Underwriting Remarks / CIBIL / Financier Terms
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add credit underwriting details, interest subvention, or special terms..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Agreement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Finance Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
