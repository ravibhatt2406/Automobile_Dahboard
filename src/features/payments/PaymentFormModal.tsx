import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Payment } from '@/types/domain';
import { X, CreditCard, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const paymentSchema = z.object({
  transactionId: z.string().min(2, 'Transaction ID required'),
  customerName: z.string().min(2, 'Customer name required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  method: z.enum(['wire_transfer', 'credit_card', 'cheque', 'cash', 'net_banking']),
  status: z.enum(['pending', 'processing', 'success', 'failed', 'refunded']),
  date: z.string().min(1, 'Date required'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Payment>) => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      customerName: '',
      amount: 25000,
      method: 'wire_transfer',
      status: 'success',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleFormSubmit = (data: PaymentFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Record Client Payment
              </h3>
              <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1 font-mono">Transaction / Bank Ref ID</label>
                <input
                  {...register('transactionId')}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Customer Account</label>
                <input
                  {...register('customerName')}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
                {errors.customerName && (
                  <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.customerName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Payment Method</label>
                  <select
                    {...register('method')}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="wire_transfer">Wire Transfer / NEFT / RTGS</option>
                    <option value="credit_card">Credit Card / Debit Card</option>
                    <option value="cheque">Bank Cheque / DD</option>
                    <option value="net_banking">Net Banking / UPI</option>
                    <option value="cash">Cash Counter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Transaction Status</label>
                  <select
                    {...register('status')}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="success">Success</option>
                    <option value="pending">Pending Verification</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 font-semibold border border-zinc-300 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Record Transaction
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
