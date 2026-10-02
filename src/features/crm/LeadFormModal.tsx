import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lead, LeadStatus } from '@/types/domain';
import { X, Target, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const leadSchema = z.object({
  customerName: z.string().min(2, 'Customer name required'),
  companyName: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone number required'),
  requirement: z.string().optional(),
  estimatedUnits: z.number().min(1, 'At least 1 unit'),
  source: z.string().min(2, 'Lead source required'),
  assignedEmployeeName: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'quotation', 'negotiation', 'booked', 'lost']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  nextFollowUpDate: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => void;
  initialData?: Lead | null;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
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
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      customerName: initialData?.customerName || '',
      companyName: initialData?.companyName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      requirement: initialData?.requirement || 'Rigid Hauler Fleet Expansion',
      estimatedUnits: initialData?.estimatedUnits || 2,
      source: initialData?.source || 'Direct Enquiry',
      assignedEmployeeName: initialData?.assignedEmployeeName || 'Unassigned',
      status: (initialData?.status as LeadStatus) || 'new',
      priority: initialData?.priority || 'medium',
    },
  });

  const handleFormSubmit = (data: LeadFormData) => {
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
                <Target className="w-5 h-5 text-blue-400" />
                {isEditing ? 'Edit Lead Opportunity' : 'Create Lead Opportunity'}
              </h3>
              <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Customer / Contact Person</label>
                  <input
                    {...register('customerName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.customerName && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Company / Fleet Client</label>
                  <input
                    {...register('companyName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    {...register('email')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    {...register('phone')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Units Requested</label>
                  <input
                    type="number"
                    {...register('estimatedUnits', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Lead Source</label>
                  <input
                    {...register('source')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Pipeline Stage</label>
                  <select
                    {...register('status')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="quotation">Quotation Sent</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="booked">Booked / Won</option>
                    <option value="lost">Closed Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Sales Executive</label>
                <input
                  {...register('assignedEmployeeName')}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                />
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
                  <Save className="w-3.5 h-3.5" /> Save Lead Opportunity
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
