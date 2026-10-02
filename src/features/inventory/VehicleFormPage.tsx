import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck, Save, ArrowLeft } from 'lucide-react';

const vehicleSchema = z.object({
  vin: z.string().min(17, 'VIN must be 17 characters long').max(17),
  make: z.string().min(2, 'Make is required'),
  model: z.string().min(2, 'Model is required'),
  year: z.number().min(2000).max(2030),
  bodyType: z.string().min(2, 'Body type required'),
  fuelType: z.enum(['diesel', 'electric', 'hybrid', 'cng']),
  price: z.number().min(1, 'Price must be greater than 0'),
  color: z.string().min(2, 'Color required'),
  franchiseId: z.string().min(1, 'Franchise scope required'),
  branchId: z.string().min(1, 'Branch assignment required'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export const VehicleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: '',
      make: 'Titan Heavy',
      model: 'TX-4500 Hauler',
      year: 2026,
      bodyType: 'Tractor Trailer',
      fuelType: 'diesel',
      price: 185000,
      color: 'Graphite Black',
      franchiseId: 'fr-01',
      branchId: 'br-101',
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    // In phase 1 frontend, log data and navigate back to inventory
    console.log('Submitted Vehicle Data:', data);
    navigate('/inventory/vehicles');
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? `Edit Vehicle Asset #${id}` : 'Register Commercial Vehicle'}
        subtitle="Add new truck asset entry into inventory stock database"
        breadcrumbItems={[
          { label: 'Inventory', href: '/inventory/vehicles' },
          { label: isEditing ? 'Edit' : 'New Vehicle' },
        ]}
      />

      <div className="cockpit-card p-6 md:p-8 rounded-xl border border-slate-800 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Vehicle Identification & Specs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-mono">VIN (Vehicle Identification Number)</label>
              <input
                {...register('vin')}
                placeholder="e.g. 1FT8W3BT3RED10492"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500 uppercase"
              />
              {errors.vin && <p className="text-rose-400 text-[11px] mt-1">{errors.vin.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Make / Manufacturer</label>
              <input
                {...register('make')}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.make && <p className="text-rose-400 text-[11px] mt-1">{errors.make.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Model Name / Designation</label>
              <input
                {...register('model')}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.model && <p className="text-rose-400 text-[11px] mt-1">{errors.model.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Model Year</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
              {errors.year && <p className="text-rose-400 text-[11px] mt-1">{errors.year.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Body Configuration Type</label>
              <input
                {...register('bodyType')}
                placeholder="Tractor Trailer, Tipper, Dump Truck..."
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Fuel Powertrain</label>
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
              <label className="block text-slate-400 mb-1">List Price (USD $)</label>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
              />
              {errors.price && <p className="text-rose-400 text-[11px] mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Exterior Finish / Color</label>
              <input
                {...register('color')}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
              />
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
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20"
            >
              <Save className="w-4 h-4" /> Save Vehicle Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
