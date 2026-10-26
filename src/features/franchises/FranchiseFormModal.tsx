import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Franchise } from '@/types/domain';
import { X, Building, Save, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const franchiseSchema = z.object({
  name: z.string().min(2, 'Franchise name must be at least 2 characters'),
  code: z.string().min(2, 'Franchise code required (e.g. FR-NA-01)'),
  brand: z.string().optional(),
  contactEmail: z.string().email('Valid email address required').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FranchiseFormData = z.infer<typeof franchiseSchema>;

interface FranchiseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Franchise>) => Promise<void> | void;
  initialData?: Franchise | null;
}

export const FranchiseFormModal: React.FC<FranchiseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FranchiseFormData>({
    resolver: zodResolver(franchiseSchema),
    defaultValues: {
      name: '',
      code: '',
      brand: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      ownerName: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        code: initialData?.code || '',
        brand: initialData?.brand || (initialData?.name?.includes('Tata') ? 'Tata Motors' : initialData?.name?.includes('Ashok') ? 'Ashok Leyland' : ''),
        contactEmail: initialData?.contactEmail || '',
        contactPhone: initialData?.contactPhone || '',
        address: initialData?.address || '',
        ownerName: initialData?.ownerName || '',
        status: (initialData?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
      });
      setFormError(null);
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data: FranchiseFormData) => {
    setFormError(null);
    try {
      const payload: Partial<Franchise> = {
        name: data.name.trim(),
        code: isEditing && initialData ? initialData.code : data.code.trim().toUpperCase(),
        status: data.status,
      };
      if (data.brand?.trim()) payload.brand = data.brand.trim();
      if (data.contactEmail?.trim()) payload.contactEmail = data.contactEmail.trim();
      if (data.contactPhone?.trim()) payload.contactPhone = data.contactPhone.trim();
      if (data.address?.trim()) payload.address = data.address.trim();
      if (data.ownerName?.trim()) payload.ownerName = data.ownerName.trim();

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save franchise entity.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                {isEditing ? 'Edit Franchise Entity' : 'Register New Franchise'}
              </h3>
              <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Franchise Business Name <span className="text-rose-500">*</span></label>
                <input
                  {...register('name')}
                  placeholder="e.g. Titan Commercial NA"
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
                {errors.name && <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1 font-mono">
                    Franchise Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register('code')}
                    disabled={isEditing}
                    placeholder="e.g. FR-NA-01"
                    className={`w-full h-9 px-3 rounded-lg border text-zinc-900 font-mono uppercase focus:outline-none focus:border-amber-500 ${
                      isEditing ? 'bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed' : 'bg-white border-zinc-300'
                    }`}
                  />
                  {isEditing ? (
                    <p className="text-zinc-500 text-[10px] mt-1">Franchise code cannot be modified after registration.</p>
                  ) : errors.code ? (
                    <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.code.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Automotive Brand License</label>
                  <input
                    {...register('brand')}
                    placeholder="e.g. Ashok Leyland, Tata Motors"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Contact Email</label>
                  <input
                    {...register('contactEmail')}
                    placeholder="franchise@titanauto.com"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors.contactEmail && (
                    <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    {...register('contactPhone')}
                    placeholder="+91 98290 00000"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Franchise Owner / Principal</label>
                <input
                  {...register('ownerName')}
                  placeholder="Principal Owner or Partner Name"
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Registered Headquarters Address</label>
                <textarea
                  {...register('address')}
                  rows={2}
                  placeholder="HQ Street address, Industrial Area, City, State"
                  className="w-full p-2 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Franchise Operational Status</label>
                <select
                  {...register('status')}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 font-semibold border border-zinc-300 shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-xs transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isEditing ? 'Save Changes' : 'Create Franchise'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
