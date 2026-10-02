import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Save,
  ArrowLeft,
  Upload,
  Trash2,
  Star,
  Box,
  Layers,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

const vehicleStudioSchema = z.object({
  make: z.string().min(2, 'Manufacturer required'),
  model: z.string().min(2, 'Model required'),
  variant: z.string().optional(),
  vehicleType: z.string().min(2, 'Vehicle type required'),
  vin: z.string().min(17, 'VIN must be 17 characters').max(17),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  year: z.number().min(2000).max(2030),
  color: z.string().min(2, 'Color required'),
  fuelType: z.enum(['diesel', 'electric', 'hybrid', 'cng']),
  transmission: z.enum(['manual', 'automatic', 'automated_manual']),
  engineSpec: z.string().optional(),
  gvw: z.string().optional(),
  franchiseId: z.string().min(1, 'Franchise required'),
  branchId: z.string().min(1, 'Branch required'),
  stockLocation: z.string().optional(),
  purchasePrice: z.number().optional(),
  exShowroomPrice: z.number().optional(),
  sellingPrice: z.number().min(1, 'Selling price required'),
  gstRate: z.number().optional(),
  status: z.enum(['available', 'reserved', 'sold', 'in_transit', 'under_service']),
});

type VehicleStudioFormData = z.infer<typeof vehicleStudioSchema>;

export const VehicleStudioPage: React.FC = () => {
  const navigate = useNavigate();

  // Photo Upload State (Base64 data URLs for immediate live preview!)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number>(0);
  const [threeDFile, setThreeDFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleStudioFormData>({
    resolver: zodResolver(vehicleStudioSchema),
    defaultValues: {
      make: 'Titan Commercial',
      model: 'T-5000 Heavy Hauler',
      variant: 'PRO-LONG RANGE',
      vehicleType: 'Tractor Trailer Chassis',
      vin: '',
      chassisNumber: '',
      engineNumber: '',
      registrationNumber: '',
      year: 2026,
      color: 'Graphite Black',
      fuelType: 'diesel',
      transmission: 'automated_manual',
      engineSpec: '13.0L Cummins ISX Turbo Diesel',
      gvw: '44,000 lbs',
      franchiseId: 'fr-01',
      branchId: 'br-101',
      stockLocation: 'Detroit Hub Bay 4',
      purchasePrice: 145000,
      exShowroomPrice: 175000,
      sellingPrice: 189000,
      gstRate: 18,
      status: 'available',
    },
  });

  const watchMake = watch('make');
  const watchModel = watch('model');
  const watchVin = watch('vin');
  const watchPrice = watch('sellingPrice');

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setUploadedPhotos((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    if (primaryPhotoIndex >= index && primaryPhotoIndex > 0) {
      setPrimaryPhotoIndex(primaryPhotoIndex - 1);
    }
  };

  const onSubmit = async (data: VehicleStudioFormData) => {
    console.log('Vehicle Studio Form Data:', {
      ...data,
      photos: uploadedPhotos,
      primaryPhoto: uploadedPhotos[primaryPhotoIndex] || null,
      threeDModelName: threeDFile ? threeDFile.name : null,
    });
    navigate('/inventory/vehicles');
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Studio & Inventory Onboarding"
        subtitle="Signature vehicle asset entry, specification mapping, photo studio, and 3D CAD linking"
        breadcrumbItems={[
          { label: 'Inventory', href: '/inventory/vehicles' },
          { label: 'Vehicle Studio' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input Columns */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Vehicle Identity */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Truck className="w-4 h-4 text-blue-400" /> Section 1: Vehicle Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Manufacturer</label>
                  <input
                    {...register('make')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.make && <p className="text-rose-400 text-[11px] mt-1">{errors.make.message}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Model Name</label>
                  <input
                    {...register('model')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.model && <p className="text-rose-400 text-[11px] mt-1">{errors.model.message}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Variant / Trim</label>
                  <input
                    {...register('variant')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Classification Type</label>
                  <input
                    {...register('vehicleType')}
                    placeholder="Tractor Trailer, Tipper..."
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Identification */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
                Section 2: Asset Identification Numbers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">VIN (17-Character Code)</label>
                  <input
                    {...register('vin')}
                    placeholder="e.g. 1FT8W3BT3RED10492"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                  {errors.vin && <p className="text-rose-400 text-[11px] mt-1">{errors.vin.message}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Chassis Number</label>
                  <input
                    {...register('chassisNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Engine Serial Number</label>
                  <input
                    {...register('engineNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Registration Number</label>
                  <input
                    {...register('registrationNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Technical Specs */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
                Section 3: Specifications & Powertrain
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Model Year</label>
                  <input
                    type="number"
                    {...register('year', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Exterior Finish Color</label>
                  <input
                    {...register('color')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fuel Type</label>
                  <select
                    {...register('fuelType')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="diesel">Clean Diesel</option>
                    <option value="electric">EV Heavy Battery</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Transmission</label>
                  <select
                    {...register('transmission')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="automated_manual">Automated Manual (AMT)</option>
                    <option value="manual">Manual Synchronized</option>
                    <option value="automatic">Full Automatic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Engine Output Rating</label>
                  <input
                    {...register('engineSpec')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GVW Weight Rating</label>
                  <input
                    {...register('gvw')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Location & Commercial Pricing */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
                Section 4: Location & Commercial Pricing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Franchise Scope</label>
                  <select
                    {...register('franchiseId')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="fr-01">Titan Commercial NA</option>
                    <option value="fr-02">Titan Heavy Haul Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Branch Dealership Lot</label>
                  <select
                    {...register('branchId')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="br-101">Detroit Flagship Hub</option>
                    <option value="br-102">Chicago Service Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stock Location Bay</label>
                  <input
                    {...register('stockLocation')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    {...register('purchasePrice', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    {...register('sellingPrice', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    {...register('status')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="available">Available Stock</option>
                    <option value="reserved">Reserved</option>
                    <option value="in_transit">In Transit</option>
                    <option value="under_service">Under Service</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Photo Upload Studio */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" /> Section 5: Vehicle Photo Studio
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {uploadedPhotos.length} Photos Uploaded
                </span>
              </div>

              {/* Upload Input */}
              <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-xl p-6 text-center transition-colors bg-slate-950/60 cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 pointer-events-none" />
                <p className="text-xs font-semibold text-slate-200">
                  Drag and drop vehicle photos here, or click to browse
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports JPG, PNG, WEBP. Uploaded images instantly render in live asset preview.
                </p>
              </div>

              {/* Uploaded Gallery Thumbnails */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {uploadedPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className={`relative rounded-lg overflow-hidden border ${
                        primaryPhotoIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-slate-800'
                      } bg-slate-900 group aspect-video`}
                    >
                      <img src={photo} alt={`Vehicle upload ${index}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryPhotoIndex(index)}
                          className={`p-1 rounded ${
                            primaryPhotoIndex === index
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-200 hover:bg-amber-500 hover:text-slate-950'
                          }`}
                          title="Set as Primary Image"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="p-1 rounded bg-rose-950 text-rose-300 hover:bg-rose-900"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {primaryPhotoIndex === index && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-bold text-slate-950 uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 6: Optional 3D Model Upload */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Box className="w-4 h-4 text-purple-400" /> Section 6: 3D Vehicle Model Asset (Optional)
              </h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-purple-400" />
                  <div>
                    <span className="font-semibold text-slate-200 block">GLTF / GLB 3D CAD Asset</span>
                    <span className="text-[11px] text-slate-500">
                      {threeDFile ? threeDFile.name : 'No GLB asset linked. R3F canvas will show clean CAD placeholder.'}
                    </span>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer">
                  Browse GLB
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => setThreeDFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
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
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-600/30"
              >
                <Save className="w-4 h-4" /> Save & Publish Vehicle
              </button>
            </div>
          </form>
        </div>

        {/* Live Asset Preview Side Panel */}
        <div className="space-y-6">
          <div className="sticky top-20 cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live Vehicle Preview
            </h3>

            {/* Photo Preview Display */}
            <div className="w-full h-48 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
              {uploadedPhotos.length > 0 ? (
                <img
                  src={uploadedPhotos[primaryPhotoIndex] || uploadedPhotos[0]}
                  alt="Vehicle Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 text-slate-600">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                  <p className="text-xs font-medium text-slate-400">
                    Upload vehicle photos to preview the vehicle.
                  </p>
                  <p className="text-[10px] text-slate-600">No stock images used.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">Model Spec</span>
                <span className="font-bold text-slate-100 text-sm">
                  {watchMake} {watchModel}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">VIN</span>
                <span className="font-mono text-blue-400 font-semibold">{watchVin || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">Selling Price</span>
                <span className="font-mono text-lg font-bold text-slate-100">
                  {watchPrice ? `$${watchPrice.toLocaleString()}` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
