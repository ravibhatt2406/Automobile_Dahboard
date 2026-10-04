import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Truck, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { vehicleService } from '@/services/vehicle.service';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';

const vehicleSchema = z.object({
  vin: z.string().min(10, 'VIN/Chassis number required (min 10 chars)').max(20),
  engineNumber: z.string().min(4, 'Engine number required'),
  make: z.string().min(2, 'Make/Manufacturer required'),
  model: z.string().min(2, 'Model required'),
  manufacturingYear: z.number().min(2000).max(2030),
  vehicleType: z.string().min(2, 'Vehicle type / body config required'),
  fuelType: z.enum(['diesel', 'electric', 'hybrid', 'cng']),
  color: z.string().min(2, 'Color required'),
  sellingPrice: z.number().min(1, 'Ex-Showroom price required'),
  baseCost: z.number().min(1, 'Base cost required'),
  branchId: z.string().min(1, 'Branch assignment required'),
  variantId: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export const VehicleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: branchesRes } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });
  const branches = branchesRes?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: '',
      engineNumber: '',
      make: 'Tata Motors',
      model: 'Prima 5530.S',
      manufacturingYear: 2026,
      vehicleType: 'Tractor Trailer',
      fuelType: 'diesel',
      color: 'White',
      sellingPrice: 5100000,
      baseCost: 4500000,
      branchId: '',
      variantId: 'var-dev-01',
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    setSubmitError(null);
    try {
      await vehicleService.createVehicle({
        vin: data.vin,
        engineNumber: data.engineNumber,
        make: data.make,
        model: data.model,
        manufacturingYear: data.manufacturingYear,
        vehicleType: data.vehicleType,
        fuelType: data.fuelType,
        color: data.color,
        sellingPrice: data.sellingPrice,
        baseCost: data.baseCost,
        branchId: data.branchId || branches[0]?.id || 'BR-DEV-01',
        variantId: data.variantId || 'var-dev-01',
      });
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSubmitSuccess(true);
      reset();
      // Navigate back after short delay to show success
      setTimeout(() => navigate('/inventory/vehicles'), 1500);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add vehicle to inventory. Please try again.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Register Commercial Vehicle"
        subtitle="Add new truck/commercial vehicle asset into inventory stock database"
        breadcrumbItems={[
          { label: 'Inventory', href: '/inventory/vehicles' },
          { label: 'New Vehicle' },
        ]}
      />

      <div className="cockpit-card p-6 md:p-8 rounded-xl border border-slate-800 max-w-3xl">
        {submitSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Vehicle added to inventory successfully! Redirecting...
          </div>
        )}
        {submitError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Vehicle Identification & Specs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-mono">VIN / Chassis Number *</label>
              <input
                {...register('vin')}
                placeholder="e.g. MAT553000K110482"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500 uppercase"
              />
              {errors.vin && <p className="text-rose-400 text-[11px] mt-1">{errors.vin.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">Engine Number *</label>
              <input
                {...register('engineNumber')}
                placeholder="e.g. ENG-2026-K1104"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
              />
              {errors.engineNumber && <p className="text-rose-400 text-[11px] mt-1">{errors.engineNumber.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Make / Manufacturer *</label>
              <input
                {...register('make')}
                placeholder="Tata Motors, Ashok Leyland..."
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.make && <p className="text-rose-400 text-[11px] mt-1">{errors.make.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Model Name *</label>
              <input
                {...register('model')}
                placeholder="Prima 5530.S, 4825 Tipper..."
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.model && <p className="text-rose-400 text-[11px] mt-1">{errors.model.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Manufacturing Year *</label>
              <input
                type="number"
                {...register('manufacturingYear', { valueAsNumber: true })}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.manufacturingYear && <p className="text-rose-400 text-[11px] mt-1">{errors.manufacturingYear.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Body Configuration / Type *</label>
              <input
                {...register('vehicleType')}
                placeholder="Tractor Trailer, Tipper, Dump Truck..."
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Fuel Powertrain *</label>
              <select
                {...register('fuelType')}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              >
                <option value="diesel">Clean Diesel</option>
                <option value="electric">EV Heavy Battery</option>
                <option value="hybrid">Hybrid Powertrain</option>
                <option value="cng">Compressed Natural Gas (CNG)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Exterior Colour *</label>
              <input
                {...register('color')}
                placeholder="White, Red, Yellow..."
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">Ex-Showroom Price (₹) *</label>
              <input
                type="number"
                {...register('sellingPrice', { valueAsNumber: true })}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
              />
              {errors.sellingPrice && <p className="text-rose-400 text-[11px] mt-1">{errors.sellingPrice.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">Base Cost / Invoice Price (₹) *</label>
              <input
                type="number"
                {...register('baseCost', { valueAsNumber: true })}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
              />
              {errors.baseCost && <p className="text-rose-400 text-[11px] mt-1">{errors.baseCost.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Branch / Hub Assignment *</label>
              <select
                {...register('branchId')}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              >
                {branches.length === 0 && (
                  <option value="BR-DEV-01">Detroit Flagship Hub (Default)</option>
                )}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {errors.branchId && <p className="text-rose-400 text-[11px] mt-1">{errors.branchId.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/inventory/vehicles')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
