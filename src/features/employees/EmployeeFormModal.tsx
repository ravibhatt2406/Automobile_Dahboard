import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee } from '@/types/domain';
import { UserRole, ROLE_LABELS } from '@/types/roles';
import { X, UserPlus, Save, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';

const employeeSchema = z.object({
  employeeCode: z.string().min(2, 'Employee code required'),
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  department: z.string().optional(),
  designation: z.string().optional(),
  branchId: z.string().min(1, 'Branch assignment required'),
  status: z.enum(['active', 'inactive', 'on_leave', 'pending_approval']).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  initialData?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const { data: branchesRes } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });
  const branches = branchesRes?.data || [];

  const availableRoles: UserRole[] = [
    'BRANCH_MANAGER',
    'DEPARTMENT_MANAGER',
    'SALES_EMPLOYEE',
    'MECHANIC',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
  ];

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    (initialData?.roles?.[0] as UserRole) || 'BRANCH_MANAGER'
  );

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeCode: initialData?.employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      password: '',
      department: initialData?.department || 'Operations',
      designation: initialData?.designation || 'Staff',
      branchId: initialData?.branchId || '',
      status: initialData?.status || 'active',
    },
  });

  const handleFormSubmit = async (data: EmployeeFormData) => {
    setFormError(null);
    if (!data.branchId) {
      setFormError('Please select a branch.');
      return;
    }
    try {
      await onSubmit({
        email: data.email,
        phone: data.phone || undefined,
        password: data.password || 'Password123!',
        firstName: data.firstName,
        lastName: data.lastName,
        branchId: data.branchId,
        employeeCode: data.employeeCode,
        roleName: selectedRole,
        designation: data.designation,
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save employee.');
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
            className="w-full max-w-lg cockpit-card p-6 rounded-xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                {isEditing ? 'Edit Personnel Record' : 'Register New Employee'}
              </h3>
              <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Employee Code</label>
                  <input
                    {...register('employeeCode')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                  {errors.employeeCode && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.employeeCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Branch Hub</label>
                  <select
                    {...register('branchId')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.branchId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Name</label>
                  <input
                    {...register('firstName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.firstName && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Last Name</label>
                  <input
                    {...register('lastName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.lastName && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    {...register('email')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.email && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    {...register('phone')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-slate-400 mb-1">Initial Password</label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Leave blank for default (Password123!)"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.password && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.password.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    {...register('department')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Designation</label>
                  <input
                    {...register('designation')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Role Assignment */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" /> Primary Assigned Role
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {availableRoles.map((roleKey) => {
                    const isSelected = selectedRole === roleKey;
                    return (
                      <button
                        type="button"
                        key={roleKey}
                        onClick={() => setSelectedRole(roleKey)}
                        className={`px-2.5 py-1.5 rounded text-left text-[11px] flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{ROLE_LABELS[roleKey]}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </button>
                    );
                  })}
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
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {isSubmitting ? 'Saving...' : 'Save Personnel Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
