import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Truck, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { vehicleService } from '@/services/vehicle.service';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { catalogueService } from '@/services/catalogue.service';

const vehicleSchema = z.object({
  vin: z.string().min(10, 'VIN/Chassis number required (min 10 chars)').max(30),
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

  const { data: variants = [] } = useQuery({
    queryKey: ['catalogVariants'],
    queryFn: () => catalogueService.getVariants(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: '',
      engineNumber: '',
      make: 'Ashok Leyland',
      model: 'AVTR 5525.T',
      manufacturingYear: 2026,
      vehicleType: 'Heavy Commercial Vehicle',
      fuelType: 'diesel',
      color: 'Signal White',
      sellingPrice: 3850000,
      baseCost: 3500000,
      branchId: '',
      variantId: '',
    },
  });

  // Handle variant selection to auto-fill specs
  const handleVariantChange = (variantId: string) => {
    setValue('variantId', variantId);
    const selected = variants.find((v) => v.id === variantId);
    if (selected) {
      if (selected.manufacturerName) setValue('make', selected.manufacturerName);
      if (selected.modelName) setValue('model', selected.modelName);
      if (selected.basePrice) {
        setValue('sellingPrice', selected.basePrice);
        setValue('baseCost', Math.round(selected.basePrice * 0.9));
      }
    }
  };

  const onSubmit = async (data: VehicleFormData) => {
    setSubmitError(null);
    if (!data.branchId) {
      setSubmitError('Please select a branch.');
      return;
    }
    if (!data.variantId) {
      setSubmitError('Please select a truck variant.');
      return;
    }
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
        branchId: data.branchId,
        variantId: data.variantId,
      });
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSubmitSuccess(true);
      reset();
      setTimeout(() => navigate('/inventory/vehicles'), 1500);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add vehicle to inventory. Please try again.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Register Commercial Vehicle"
        subtitle="Add new Ashok Leyland truck/commercial vehicle asset into inventory stock database"
        breadcrumbItems={[
          { label: 'Inventory', href: '/inventory/vehicles' },
          { label: 'New Vehicle' },
        ]}
      />

      <div className="max-w-3xl">
        {submitSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold">Vehicle successfully added to inventory!</p>
              <p className="text-emerald-400/80">Vehicle record persisted in PostgreSQL database. Redirecting...</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Registration Failed</p>
              <p className="text-rose-400/80">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Vehicle Identification & Specs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {variants.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Truck Model & Variant Selection</label>
                <select
                  onChange={(e) => handleVariantChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                >
                  <option value="">-- Choose Truck Model / Variant --</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.manufacturerName || 'Ashok Leyland'} - ₹{v.basePrice?.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 font-mono">VIN / Chassis Number *</label>
              <input
                {...register('vin')}
                placeholder="e.g. MB1A2B3C4D5E6F709"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500 uppercase"
              />
              {errors.vin && <p className="text-rose-400 text-[11px] mt-1">{errors.vin.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">Engine Number *</label>
              <input
                {...register('engineNumber')}
                placeholder="e.g. ENG-AL-2026-09"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
              />
              {errors.engineNumber && <p className="text-rose-400 text-[11px] mt-1">{errors.engineNumber.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Make / Manufacturer *</label>
              <input
                {...register('make')}
                placeholder="Ashok Leyland"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.make && <p className="text-rose-400 text-[11px] mt-1">{errors.make.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Model Name *</label>
              <input
                {...register('model')}
                placeholder="AVTR 5525.T, Ecomet 1215 HE..."
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
                placeholder="Heavy Commercial Vehicle, ICV, LCV..."
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Fuel Powertrain *</label>
              <select
                {...register('fuelType')}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              >
                <option value="diesel">Clean Diesel (i-Gen6)</option>
                <option value="electric">EV Heavy Battery</option>
                <option value="hybrid">Hybrid Powertrain</option>
                <option value="cng">Compressed Natural Gas (CNG)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Exterior Colour *</label>
              <input
                {...register('color')}
                placeholder="Signal White, Royal Blue, Golden Yellow..."
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
                {branches.length === 0 ? (
                  <option value="">No branch available</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))
                )}
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? 'Registering...' : 'Register Vehicle Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
