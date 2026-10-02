import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsurancePolicy } from '@/types/domain';
import { X, ShieldCheck, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const policySchema = z.object({
  policyNumber: z.string().min(2, 'Policy number required'),
  provider: z.string().min(2, 'Insurance provider required'),
  vehicleVin: z.string().min(17, 'VIN required (17 chars)').max(17),
  customerName: z.string().min(2, 'Customer name required'),
  type: z.enum(['comprehensive', 'third_party', 'zero_depth', 'commercial_carrier']),
  premiumAmount: z.number().min(1, 'Premium required'),
  startDate: z.string().min(1, 'Start date required'),
  expiryDate: z.string().min(1, 'Expiry date required'),
  status: z.enum(['active', 'pending_renewal', 'expired']),
});

type PolicyFormData = z.infer<typeof policySchema>;

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<InsurancePolicy>) => void;
  initialData?: InsurancePolicy | null;
}

export const PolicyFormModal: React.FC<PolicyFormModalProps> = ({
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
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policyNumber: initialData?.policyNumber || `POL-${Math.floor(1000000 + Math.random() * 9000000)}`,
      provider: initialData?.provider || 'Commercial Allianz Auto',
      vehicleVin: initialData?.vehicleVin || '',
      customerName: initialData?.customerName || '',
      type: initialData?.type || 'commercial_carrier',
      premiumAmount: initialData?.premiumAmount || 3800,
      startDate: initialData?.startDate || '2026-01-01',
      expiryDate: initialData?.expiryDate || '2027-01-01',
      status: initialData?.status || 'active',
    },
  });

  const handleFormSubmit = (data: PolicyFormData) => {
    onSubmit({
      ...initialData,
      ...data,
      customerId: initialData?.customerId || 'cust-01',
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
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                {isEditing ? 'Edit Insurance Policy' : 'Issue Fleet Insurance Policy'}
              </h3>
              <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Policy Ref #</label>
                  <input
                    {...register('policyNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Insurance Provider</label>
                  <input
                    {...register('provider')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Vehicle VIN</label>
                  <input
                    {...register('vehicleVin')}
                    placeholder="1FT8W3BT3RED..."
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                  {errors.vehicleVin && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.vehicleVin.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Account</label>
                  <input
                    {...register('customerName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Coverage Type</label>
                  <select
                    {...register('type')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="commercial_carrier">Commercial Carrier Hull & Cargo</option>
                    <option value="comprehensive">Full Comprehensive</option>
                    <option value="third_party">Third Party Liability</option>
                    <option value="zero_depth">Zero Bumper Depreciation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Annual Premium ($)</label>
                  <input
                    type="number"
                    {...register('premiumAmount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Policy Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Policy Expiry Date</label>
                  <input
                    type="date"
                    {...register('expiryDate')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Policy Status</label>
                <select
                  {...register('status')}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                >
                  <option value="active">Active Coverage</option>
                  <option value="pending_renewal">Pending Renewal</option>
                  <option value="expired">Expired</option>
                </select>
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
                  <Save className="w-3.5 h-3.5" /> Save Policy
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
