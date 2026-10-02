import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Booking } from '@/types/domain';
import { X, ShoppingBag, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const bookingSchema = z.object({
  bookingNumber: z.string().min(2, 'Booking number required'),
  customerName: z.string().min(2, 'Customer name required'),
  vehicleModel: z.string().min(2, 'Vehicle spec required'),
  bookingAmount: z.number().min(1, 'Booking deposit required'),
  totalPrice: z.number().min(1, 'Total price required'),
  paymentStatus: z.enum(['pending', 'partial', 'paid']),
  financeStatus: z.enum(['not_applied', 'pending', 'approved', 'disbursed']),
  insuranceStatus: z.enum(['pending', 'active', 'expired']),
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
  expectedDeliveryDate: z.string().min(1, 'Expected delivery required'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Booking>) => void;
  initialData?: Booking | null;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingNumber: initialData?.bookingNumber || `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: initialData?.customerName || '',
      vehicleModel: initialData?.vehicleModel || 'Titan T-5000 Heavy Hauler',
      bookingAmount: initialData?.bookingAmount || 25000,
      totalPrice: initialData?.totalPrice || 189000,
      paymentStatus: initialData?.paymentStatus || 'partial',
      financeStatus: initialData?.financeStatus || 'pending',
      insuranceStatus: initialData?.insuranceStatus || 'pending',
      status: initialData?.status || 'confirmed',
      expectedDeliveryDate: initialData?.expectedDeliveryDate || '2026-11-15',
    },
  });

  const handleFormSubmit = (data: BookingFormData) => {
    onSubmit({
      ...initialData,
      ...data,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    });
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
            className="w-full max-w-lg cockpit-card p-6 rounded-xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                {isEditing ? 'Edit Vehicle Order Booking' : 'Create Vehicle Booking'}
              </h3>
              <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Booking Ref #</label>
                  <input
                    {...register('bookingNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Name</label>
                  <input
                    {...register('customerName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.customerName && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.customerName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Vehicle Specification</label>
                <input
                  {...register('vehicleModel')}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Deposit Paid ($)</label>
                  <input
                    type="number"
                    {...register('bookingAmount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Total Vehicle Price ($)</label>
                  <input
                    type="number"
                    {...register('totalPrice', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Payment Status</label>
                  <select
                    {...register('paymentStatus')}
                    className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Finance</label>
                  <select
                    {...register('financeStatus')}
                    className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="not_applied">Not Applied</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disbursed">Disbursed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Insurance</label>
                  <select
                    {...register('insuranceStatus')}
                    className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Booking Order Status</label>
                  <select
                    {...register('status')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    {...register('expectedDeliveryDate')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-3.5 h-3.5" /> Save Booking
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
