import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck, Save, ArrowLeft, CheckCircle, AlertCircle, Upload, Star, Trash2, Loader2 } from 'lucide-react';
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
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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

  // If in edit mode, fetch existing vehicle data and populate form
  const { data: existingVehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => (id ? vehicleService.getVehicleById(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingVehicle) {
      reset({
        vin: existingVehicle.vin || '',
        engineNumber: existingVehicle.engineNumber || '',
        make: existingVehicle.make || 'Ashok Leyland',
        model: existingVehicle.model || '',
        manufacturingYear: existingVehicle.manufacturingYear || existingVehicle.year || 2026,
        vehicleType: existingVehicle.vehicleType || 'Heavy Commercial Vehicle',
        fuelType: (existingVehicle.fuelType?.toLowerCase() as any) || 'diesel',
        color: existingVehicle.color || 'Signal White',
        sellingPrice: existingVehicle.sellingPrice || 0,
        baseCost: existingVehicle.baseCost || 0,
        branchId: existingVehicle.branchId || '',
        variantId: (existingVehicle as any).variant_details?.id || (existingVehicle as any).variantId || '',
      });
      if (existingVehicle.images && Array.isArray(existingVehicle.images) && existingVehicle.images.length > 0) {
        setPhotos(existingVehicle.images);
      } else if (existingVehicle.photos && Array.isArray(existingVehicle.photos) && existingVehicle.photos.length > 0) {
        setPhotos(existingVehicle.photos);
      }
    }
  }, [existingVehicle, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoError(null);
    setUploadingPhoto(true);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
          throw new Error(`'${file.name}' has an unsupported format. Allowed formats: JPEG, PNG, WEBP.`);
        }
        if (file.size > maxSize) {
          throw new Error(`'${file.name}' exceeds the 5MB size limit.`);
        }

        const uploaded = await vehicleService.uploadPhoto(file, isEdit ? id : undefined);
        if (uploaded?.url) {
          newUrls.push(uploaded.url);
        }
      }

      setPhotos((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setPhotoError(err?.message || 'Failed to upload photo. Please verify image file and try again.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (index: number) => {
    if (index === 0) return;
    const selected = photos[index];
    const reordered = [selected, ...photos.filter((_, i) => i !== index)];
    setPhotos(reordered);
    if (isEdit && id) {
      try {
        await vehicleService.setPrimaryPhoto(id, selected);
      } catch (err: any) {
        console.error('Failed to update primary photo', err);
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const targetUrl = photos[index];
    const remaining = photos.filter((_, i) => i !== index);
    setPhotos(remaining);
    if (isEdit && id) {
      try {
        await vehicleService.deletePhoto(id, targetUrl);
      } catch (err: any) {
        console.error('Failed to delete photo on server', err);
      }
    }
  };

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
      setSubmitError('Please select a valid branch location. Silent fallbacks are prohibited.');
      return;
    }
    if (!data.variantId) {
      setSubmitError('Please select a valid truck variant from the catalogue. Silent fallbacks are prohibited.');
      return;
    }
    try {
      if (isEdit && id) {
        await vehicleService.updateVehicle(id, {
          color: data.color,
          sellingPrice: data.sellingPrice,
          baseCost: data.baseCost,
          manufacturingYear: data.manufacturingYear,
          branchId: data.branchId,
          variantId: data.variantId,
          images: photos,
        } as any);
      } else {
        await vehicleService.createVehicle({
          vin: data.vin.trim().toUpperCase(),
          engineNumber: data.engineNumber.trim(),
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
          images: photos,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (id) await queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      setSubmitSuccess(true);
      setTimeout(() => navigate('/inventory/vehicles'), 1200);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save vehicle asset. Please verify input data.');
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Vehicle Specifications' : 'Register Commercial Vehicle'}
        subtitle={
          isEdit
            ? 'Update vehicle configuration, pricing, colour and branch allocation'
            : 'Add new commercial truck asset into inventory stock database with strict unique VIN & engine validation'
        }
        breadcrumbItems={[
          { label: 'Inventory', href: '/inventory/vehicles' },
          { label: isEdit ? 'Edit Vehicle' : 'New Vehicle' },
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

            {/* Vehicle Photos Upload & Preview Field */}
            <div className="md:col-span-2 pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-200">
                    Vehicle Photos & Media
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Upload vehicle photos. The first image is the primary cover photo. Formats: JPG, PNG, WEBP (Max 5MB each).
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>

              {photoError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-[#F5A800] rounded-xl bg-slate-900/60 hover:bg-slate-900 transition-colors cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  {uploadingPhoto ? (
                    <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-[#F5A800]/20 flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#F5A800]" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-[#F5A800]">
                      {uploadingPhoto ? 'Uploading and validating photos...' : 'Click to browse or drop vehicle photos here'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WEBP up to 5MB</p>
                  </div>
                </div>
              </label>

              {/* Photos Preview Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {photos.map((url, idx) => {
                    const isPrimary = idx === 0;
                    return (
                      <div
                        key={`${url}-${idx}`}
                        className={`relative group rounded-xl overflow-hidden border ${
                          isPrimary ? 'border-[#F5A800] ring-2 ring-[#F5A800]/30' : 'border-slate-800'
                        } bg-slate-950 aspect-video flex items-center justify-center`}
                      >
                        <img
                          src={url}
                          alt={`Vehicle photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Primary badge */}
                        {isPrimary && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#F5A800] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Star className="w-3 h-3 fill-black text-black" /> Cover
                          </div>
                        )}
                        {/* Action overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              title="Set as primary cover photo"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#F5A800] text-slate-200 hover:text-black transition-colors"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Remove photo"
                            className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              <Save className="w-4 h-4" /> {isSubmitting ? (isEdit ? 'Saving...' : 'Registering...') : (isEdit ? 'Save Vehicle Updates' : 'Register Vehicle Asset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
