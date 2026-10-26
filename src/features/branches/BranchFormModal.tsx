import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Branch } from '@/types/domain';
import { X, Store, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuery } from '@tanstack/react-query';
import { franchiseService } from '@/services/franchise.service';

const branchSchema = z.object({
  franchiseId: z.string().min(1, 'Franchise selection required'),
  name: z.string().min(2, 'Branch name required'),
  code: z.string().min(2, 'Branch code required'),
  address: z.string().min(2, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  status: z.enum(['active', 'inactive']),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Branch>) => void;
  initialData?: Branch | null;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const { data: franchisesRes } = useQuery({
    queryKey: ['franchises'],
    queryFn: () => franchiseService.getFranchises(),
  });
  const franchises = franchisesRes?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema) as any,
    defaultValues: {
      franchiseId: initialData?.franchiseId || (franchises[0]?.id ?? ''),
      name: initialData?.name || '',
      code: initialData?.code || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      status: (initialData?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
    },
  });

  React.useEffect(() => {
    if (!initialData?.franchiseId && franchises.length > 0) {
      setValue('franchiseId', franchises[0].id);
    }
  }, [franchises, initialData, setValue]);

  const handleFormSubmit = (data: BranchFormData) => {
    const selectedFranchise = franchises.find((f) => f.id === data.franchiseId);
    onSubmit({
      ...initialData,
      ...data,
      franchiseName: selectedFranchise?.name || 'Ashok Leyland Commercial',
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
            className="w-full max-w-lg cockpit-card p-6 rounded-xl border border-zinc-200 bg-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                {isEditing ? 'Edit Dealership Branch' : 'Register Dealership Branch'}
              </h3>
              <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Parent Franchise</label>
                <select
                  {...register('franchiseId')}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-amber-500"
                >
                  {franchises.length === 0 ? (
                    <option value="">No franchise available</option>
                  ) : (
                    franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))
                  )}
                </select>
                {errors.franchiseId && <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.franchiseId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Branch Location Name</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Detroit Flagship Hub"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors.name && <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1 font-mono">Branch Code</label>
                  <input
                    {...register('code')}
                    placeholder="BR-DET-01"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-mono uppercase placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Street Address</label>
                <input
                  {...register('address')}
                  placeholder="Street Address"
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">City</label>
                  <input
                    {...register('city')}
                    placeholder="City"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors.city && <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">State / Province</label>
                  <input
                    {...register('state')}
                    placeholder="State"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors.state && <p className="text-rose-600 font-medium text-[11px] mt-1">{errors.state.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  <Save className="w-3.5 h-3.5" /> Save Branch
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
