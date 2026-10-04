import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Building,
  ShieldCheck,
  X,
  Printer,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

export interface PaymentItem {
  id: string;
  transactionId: string;
  referenceType: 'booking' | 'invoice';
  referenceId: string;
  customerName: string;
  purpose: string;
  amount: number;
  method: 'net_banking' | 'wire_transfer' | 'upi' | 'cheque';
  methodName: string;
  status: 'success' | 'pending' | 'processing' | 'failed' | 'refunded';
  date: string;
  gstin?: string;
}

export const PaymentsListPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<string>('net_banking');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentItem[]>([
    {
      id: 'pay-01',
      transactionId: 'TXN-9812041284',
      referenceType: 'booking',
      referenceId: 'BK-1024',
      customerName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'David Miller',
      purpose: 'Booking Advance Payment — Ashok Leyland 4825',
      amount: 100000,
      method: 'net_banking',
      methodName: 'HDFC NetBanking (Ref: HDFC984210)',
      status: 'success',
      date: '2026-10-01',
      gstin: '08AAAAA0000A1Z5',
    },
    {
      id: 'pay-02',
      transactionId: 'TXN-8812940192',
      referenceType: 'invoice',
      referenceId: 'INV-2026-004',
      customerName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'David Miller',
      purpose: 'Routine Service & Parts Invoice — RJ-14-EA-4825',
      amount: 28500,
      method: 'upi',
      methodName: 'UPI (Ref: UPI/628491024@okicici)',
      status: 'success',
      date: '2026-09-15',
      gstin: '08AAAAA0000A1Z5',
    },
  ]);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPay(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      const newPay: PaymentItem = {
        id: `pay-${Date.now()}`,
        transactionId: `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        referenceType: 'booking',
        referenceId: 'BK-1024',
        customerName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'David Miller',
        purpose: 'Booking Balance Confirmation — Jaipur Branch',
        amount: 100000,
        method: payMethod as any,
        methodName: payMethod === 'net_banking' ? 'Net Banking Direct Transfer' : 'UPI Instant Pay',
        status: 'success',
        date: new Date().toISOString().split('T')[0],
      };
      setPayments([newPay, ...payments]);
      setPaySuccessMsg(`Payment of ₹1,00,000 processed successfully! Ref #${newPay.transactionId}`);
      setTimeout(() => {
        setPaySuccessMsg(null);
        setIsPayModalOpen(false);
      }, 1500);
    } catch {
      // error
    } finally {
      setIsProcessingPay(false);
    }
  };

  const totalPaidAmount = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Official Receipts"
        subtitle="Customer payment history, transaction references, receipts & booking payments"
        breadcrumbItems={[{ label: 'Payments' }]}
        actions={
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4" /> Pay Booking Advance
          </button>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Total Payments Confirmed
          </span>
          <div className="text-2xl font-bold text-[#111111] mt-1">
            ₹{totalPaidAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Backend Verified
          </span>
        </div>

        <div className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Pending Booking Balance
          </span>
          <div className="text-2xl font-bold text-amber-700 mt-1">₹0.00</div>
          <span className="text-xs text-zinc-500 mt-1 block">No overdue invoice balances</span>
        </div>

        <div className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Primary Dealership Branch
          </span>
          <div className="text-lg font-bold text-[#111111] mt-1 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#F5A800]" /> Jaipur Branch
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">Ashok Leyland Franchised Hub</span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#F5A800]" /> Payment History & Receipts
          </h3>
          <span className="text-xs font-mono text-zinc-400">{payments.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 font-mono uppercase text-[10px] border-b border-zinc-200">
              <tr>
                <th className="p-3.5">Transaction Ref</th>
                <th className="p-3.5">Purpose / Reference</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-zinc-900">{p.transactionId}</td>
                  <td className="p-3.5">
                    <span className="font-semibold text-zinc-900 block">{p.purpose}</span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Ref: {p.referenceId}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-zinc-900">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-zinc-600 font-mono text-[11px]">{p.methodName}</td>
                  <td className="p-3.5 text-zinc-600 font-mono">{p.date}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        p.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'pending'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded text-[11px] transition-colors border border-zinc-200"
                    >
                      <FileText className="w-3 h-3 text-[#F5A800]" /> View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: GST Payment Receipt View & Download */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 border border-zinc-200 shadow-2xl">
            {/* Receipt Header */}
            <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase tracking-widest">
                  ASHOK LEYLAND DEALERSHIP • JAIPUR HUB
                </span>
                <h2 className="text-xl font-bold text-[#111111] mt-0.5">OFFICIAL PAYMENT RECEIPT</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">Receipt #: REC-{selectedReceipt.transactionId}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Details Box */}
            <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase block">Customer Name</span>
                  <span className="font-bold text-zinc-900 text-sm block">{selectedReceipt.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase block">Transaction Date</span>
                  <span className="font-bold text-zinc-900 text-sm block">{selectedReceipt.date}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase block">Reference / Purpose</span>
                  <span className="font-semibold text-zinc-800 block">{selectedReceipt.purpose}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase block">Payment Channel</span>
                  <span className="font-semibold text-zinc-800 block">{selectedReceipt.methodName}</span>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-3 flex justify-between items-center font-mono">
                <span className="font-bold text-zinc-700 text-sm">Total Amount Received:</span>
                <span className="font-bold text-zinc-900 text-xl">
                  ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Status: Payment Confirmed by Titan Auto Gateway</span>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-[#111111] text-[#F5A800] text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pay Booking Advance Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase">Secure Payment Portal</span>
                <h3 className="text-lg font-bold text-[#111111]">Pay Booking Advance</h3>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 rounded bg-zinc-100 text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {paySuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{paySuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-1 font-mono">
                  <span className="text-[10px] text-zinc-400 uppercase">Selected Vehicle Booking</span>
                  <p className="font-bold text-zinc-900">Ashok Leyland 4825 (Booking #BK-1024)</p>
                  <div className="flex justify-between items-center pt-2 text-sm font-sans font-bold text-[#111111]">
                    <span>Amount Due:</span>
                    <span className="text-amber-700">₹1,00,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Approved Payment Gateway Channel</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                  >
                    <option value="net_banking">Net Banking Direct Transfer</option>
                    <option value="upi">UPI / Instant Corporate Transfer</option>
                    <option value="wire_transfer">NEFT / RTGS Wire Transfer</option>
                  </select>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Note: Payment authorization is verified directly via authorized gateway webhooks. No sensitive credentials or card numbers are stored locally.
                </p>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 text-zinc-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPay}
                    className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    {isProcessingPay ? 'Processing...' : 'Confirm Payment ₹1,00,000'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
