import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { billingService } from '@/services/billing.service';
import { useAuth } from '@/app/providers/AuthContext';
import { Invoice } from '@/types/domain';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  Building,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Ban,
  Clock,
  Car,
  Wrench,
  Loader2,
  PlusCircle,
} from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeRole } = useAuth();

  const isStaff = [
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_MANAGER',
    'ACCOUNTANT',
  ].includes(activeRole);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Recording Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadInvoice = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingService.getInvoiceById(id);
      if (!data) {
        setError('Tax invoice not found or access restricted.');
      } else {
        setInvoice(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice statement.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5A800]" />
        <span className="text-sm font-semibold">Loading Tax Invoice #{id}...</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tax Invoice"
          breadcrumbItems={[
            { label: 'Billing', href: '/billing/invoices' },
            { label: 'Invoices', href: '/billing/invoices' },
            { label: 'Error' },
          ]}
        />
        <div className="p-8 bg-white rounded-2xl border border-red-200 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-zinc-900">Invoice Statement Unavailable</h3>
          <p className="text-xs text-zinc-500">{error || 'Invoice record could not be loaded.'}</p>
          <button
            onClick={() => navigate('/billing/invoices')}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold"
          >
            Return to Invoices
          </button>
        </div>
      </div>
    );
  }

  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const totalPaid = payments
    .filter((p: any) => p.status === 'SUCCESS')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const invoiceTotal = Number(invoice.totalAmount || 0);
  const balanceDue = Math.max(
    0,
    invoiceTotal - (invoice.paymentStatus === 'PAID' ? invoiceTotal : totalPaid),
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (paymentAmount > balanceDue && balanceDue > 0) {
      setPaymentError(`Payment amount cannot exceed remaining balance of ₹${balanceDue.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);
    try {
      await billingService.recordPayment(invoice.id, {
        amount: paymentAmount,
        paymentMethod,
        transactionReference: paymentRef.trim() || undefined,
      });
      setShowPaymentModal(false);
      setPaymentAmount(0);
      setPaymentRef('');
      await loadInvoice();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment verification.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !cancelReason.trim()) {
      setCancelError('Please specify the business reason for cancellation.');
      return;
    }

    setIsSubmittingCancel(true);
    setCancelError(null);
    try {
      await billingService.cancelInvoice(invoice.id, cancelReason.trim());
      setShowCancelModal(false);
      await loadInvoice();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel invoice.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <PageHeader
        title={`Tax Invoice #${invoice.invoiceNumber}`}
        subtitle={`Issued by ${invoice.branch?.name || 'Dealership Branch'} on ${new Date(
          invoice.issuedAt || invoice.createdAt,
        ).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
        breadcrumbItems={[
          { label: 'Billing', href: '/billing/invoices' },
          { label: 'Invoices', href: '/billing/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-zinc-600" /> Print
            </button>
            <a
              href={billingService.getPrintableInvoiceUrl(invoice.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-zinc-600" /> Printable Statement
            </a>

            {isStaff && invoice.status !== 'CANCELLED' && balanceDue > 0 && (
              <button
                onClick={() => {
                  setPaymentAmount(balanceDue);
                  setShowPaymentModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Record Payment
              </button>
            )}

            {isStaff && invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all"
              >
                <Ban className="w-4 h-4 text-red-600" /> Cancel
              </button>
            )}
          </div>
        }
      />

      {/* Cancelled Banner */}
      {invoice.status === 'CANCELLED' && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800">
          <Ban className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold">INVOICE CANCELLED</span>
            <p className="mt-0.5 text-red-700">
              This tax invoice was formally cancelled. Financial ledgers have marked this statement void.
            </p>
          </div>
        </div>
      )}

      {/* Main Printable Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 md:p-8 space-y-8">
        {/* Dealership & Customer Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-zinc-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-zinc-950 font-mono">
                TITAN<span className="text-[#F5A800]">AUTO</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                Official GST Invoice
              </span>
            </div>
            <div className="mt-3 text-xs text-zinc-600 space-y-0.5">
              <div className="font-bold text-zinc-900">{invoice.branch?.name || 'Dealership'}</div>
              <div>{invoice.branch?.address || 'Corporate Fleet Yard'}</div>
              <div className="font-mono text-[11px] text-zinc-500">
                Branch Code: {invoice.branch?.code || 'N/A'} • Phone: {invoice.branch?.phone || '+91 1800 200 4000'}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right space-y-2">
            <div className="flex items-center md:justify-end gap-2">
              <StatusBadge status={invoice.status} />
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                  invoice.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : invoice.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {invoice.paymentStatus || 'UNPAID'}
              </span>
            </div>

            <div className="text-xs text-zinc-500">
              <div>Invoice Date: <strong className="text-zinc-900 font-mono">{new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
              {invoice.gstin && <div>GSTIN: <strong className="text-zinc-900 font-mono">{invoice.gstin}</strong></div>}
            </div>
          </div>
        </div>

        {/* Billed Party & Linked Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50/70 p-5 rounded-xl border border-zinc-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1">
              Billed To (Customer)
            </span>
            <div className="text-sm font-bold text-zinc-900">
              {invoice.customer?.name || invoice.customerName || 'Direct Customer'}
            </div>
            {invoice.customer?.companyName && (
              <div className="text-xs font-medium text-zinc-700">{invoice.customer.companyName}</div>
            )}
            <div className="text-xs text-zinc-600 mt-1">{invoice.billingAddress || invoice.customer?.address || 'Registered Address'}</div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3 font-mono text-[11px]">
              {invoice.customer?.phone && <span>Phone: {invoice.customer.phone}</span>}
              {invoice.customer?.email && <span>Email: {invoice.customer.email}</span>}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1">
              Transaction Details
            </span>
            <div className="text-xs text-zinc-700 space-y-1">
              {invoice.booking && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Booking Reference: <strong className="font-mono text-zinc-900">#{invoice.booking.bookingNumber}</strong></span>
                </div>
              )}
              {invoice.vehicle && (
                <div className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Vehicle: <strong className="text-zinc-900">{invoice.vehicle.make} {invoice.vehicle.model}</strong> ({invoice.vehicle.vin})</span>
                </div>
              )}
              {invoice.serviceJobs && invoice.serviceJobs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Service Job: <strong className="font-mono text-zinc-900">#{invoice.serviceJobs[0].jobNumber || invoice.serviceJobs[0].jobCardNumber}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Created: {new Date(invoice.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 uppercase text-[10px] font-bold">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right">Taxable Amount</th>
                <th className="py-3 px-3 text-center">GST %</th>
                <th className="py-3 px-3 text-right">GST Amount</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-zinc-400">
                    No line items listed on this invoice statement.
                  </td>
                </tr>
              ) : (
                items.map((it: any, idx: number) => (
                  <tr key={it.id || idx} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-3 text-zinc-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900">{it.description}</td>
                    <td className="py-3 px-3 text-center font-mono">{it.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-700">
                      ₹{Number(it.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-700">
                      ₹{Number(it.taxableAmount || it.unitPrice * it.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-500">
                      {it.gstRate || 18}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-700">
                      ₹{Number(it.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">
                      ₹{Number(it.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Breakdown */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-t border-zinc-100 pt-6">
          <div className="text-xs text-zinc-500 max-w-sm space-y-1">
            <span className="font-bold text-zinc-800 block">Notes & Statutory Compliance:</span>
            <p>
              Amounts inclusive of applicable Goods and Services Tax (GST). All billing records are cryptographically verified and audit-logged in the Titan Auto ledger.
            </p>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span className="font-mono text-zinc-900 font-semibold">
                ₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span className="font-mono font-semibold">
                  -₹{Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-zinc-600">
              <span>Taxable Value:</span>
              <span className="font-mono text-zinc-900 font-semibold">
                ₹{Number(invoice.taxableAmount || invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {Number(invoice.cgstAmount) > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>CGST:</span>
                <span className="font-mono text-zinc-800">
                  ₹{Number(invoice.cgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {Number(invoice.sgstAmount) > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>SGST:</span>
                <span className="font-mono text-zinc-800">
                  ₹{Number(invoice.sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {Number(invoice.igstAmount) > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>IGST:</span>
                <span className="font-mono text-zinc-800">
                  ₹{Number(invoice.igstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t-2 border-zinc-900 pt-3 text-sm font-bold text-zinc-950">
              <span>Grand Total:</span>
              <span className="font-mono text-zinc-950">
                ₹{invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between pt-1 text-xs text-emerald-700">
              <span>Total Paid:</span>
              <span className="font-mono font-bold">
                ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div
              className={`flex justify-between pt-2 border-t border-zinc-200 text-xs font-bold ${
                balanceDue > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              <span>Balance Due:</span>
              <span className="font-mono text-sm">
                ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="border-t border-zinc-100 pt-6 space-y-3">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-600" /> Payment & Settlement Records
          </h4>

          {payments.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500">
              No payments have been settled for this invoice yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Transaction Reference</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono text-zinc-600">
                        {new Date(p.paidAt || p.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-800">
                        {p.paymentMethod || p.gateway}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">
                        {p.gatewayPaymentId || p.id}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Record Verified Payment
            </h3>
            <p className="text-xs text-zinc-500">
              Record a verified bank transfer, check settlement, or payment transaction against Invoice #{invoice.invoiceNumber}.
            </p>

            {paymentError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-sm font-bold focus:outline-hidden focus:border-[#F5A800]"
                  required
                />
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  Remaining Balance: ₹{balanceDue.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900"
                >
                  <option value="BANK_TRANSFER">Bank Wire / RTGS / NEFT</option>
                  <option value="CORPORATE_CHECK">Corporate Check</option>
                  <option value="ONLINE_GATEWAY">Online Payment Gateway</option>
                  <option value="FINANCE_DISBURSEMENT">Commercial Fleet Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982104812"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  {isSubmittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Invoice Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" /> Void & Cancel Tax Invoice
            </h3>
            <p className="text-xs text-zinc-500">
              Are you sure you want to cancel Invoice #{invoice.invoiceNumber}? This action is audit-logged and cannot be undone.
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify billing correction or order cancellation reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-hidden focus:border-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  {isSubmittingCancel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
