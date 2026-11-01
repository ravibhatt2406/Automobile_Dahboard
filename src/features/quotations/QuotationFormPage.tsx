import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import { FileText, Save, ArrowLeft, Calculator, Truck, User, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { catalogueService, CatalogVariantItem } from '@/services/catalogue.service';
import { branchService } from '@/services/branch.service';
import { vehicleService } from '@/services/vehicle.service';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useQuery } from '@tanstack/react-query';

const quotationSchema = z.object({
  customerId: z.string().min(1, 'Please select an authorized customer'),
  branchId: z.string().min(1, 'Please select a branch'),
  variantId: z.string().min(1, 'Please select a truck variant'),
  vehicleId: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  accessoriesAmount: z.number().min(0, 'Accessories amount cannot be negative'),
  insuranceAmount: z.number().min(0, 'Insurance amount cannot be negative'),
  registrationAmount: z.number().min(0, 'Registration amount cannot be negative'),
  financeCharges: z.number().min(0, 'Finance charges cannot be negative'),
  discountAmount: z.number().min(0, 'Discount cannot be negative'),
  validityDate: z.string().min(1, 'Quotation validity date is required'),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

export const QuotationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, activeBranchName } = useScope();
  const { user } = useAuth();

  // Calculate default validity date (30 days from now)
  const defaultValidity = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [selectedVariant, setSelectedVariant] = useState<CatalogVariantItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Queries for real authorized data
  const { data: branchesData } = useQuery({
    queryKey: ['quotation-branches'],
    queryFn: () => branchService.getBranches({ pageSize: 100 } as any),
  });

  const branches = branchesData?.data || [];
  const defaultBranchId =
    selectedBranchId && selectedBranchId !== 'ALL'
      ? selectedBranchId
      : (user as any)?.branchId || branches[0]?.id || '';

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: '',
      branchId: defaultBranchId,
      variantId: '',
      vehicleId: '',
      quantity: 1,
      accessoriesAmount: 45000,
      insuranceAmount: 68000,
      registrationAmount: 35000,
      financeCharges: 0,
      discountAmount: 25000,
      validityDate: defaultValidity,
      notes: '',
    },
  });

  const currentBranchId = watch('branchId');
  const currentVariantId = watch('variantId');

  // Load customers scoped to branch/franchise
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['quotation-customers', currentBranchId],
    queryFn: () =>
      customerService.getCustomers({
        branchId: currentBranchId && currentBranchId !== 'ALL' ? currentBranchId : undefined,
        limit: 100,
      }),
  });
  const customers = customersData?.data || [];

  // Load commercial truck variants from catalogue
  const { data: variants = [], isLoading: loadingVariants } = useQuery({
    queryKey: ['quotation-variants'],
    queryFn: () => catalogueService.getVariants(),
  });

  // Load in-stock vehicles if variant is chosen
  const { data: vehiclesData } = useQuery({
    queryKey: ['quotation-vehicles', currentBranchId, currentVariantId],
    queryFn: () =>
      vehicleService.getVehicles({
        branchId: currentBranchId && currentBranchId !== 'ALL' ? currentBranchId : undefined,
        status: 'IN_STOCK',
      }),
    enabled: Boolean(currentBranchId),
  });
  const inStockVehicles = (vehiclesData?.data || []).filter(
    (v: any) => !currentVariantId || v.variantId === currentVariantId
  );

  // Update selected variant when variantId changes
  useEffect(() => {
    if (currentVariantId && variants.length > 0) {
      const match = variants.find((v) => v.id === currentVariantId);
      if (match) {
        setSelectedVariant(match);
      }
    }
  }, [currentVariantId, variants]);

  // Keep branch in sync if scope changes and field is empty
  useEffect(() => {
    if (defaultBranchId && !currentBranchId) {
      setValue('branchId', defaultBranchId);
    }
  }, [defaultBranchId, currentBranchId, setValue]);

  // Watched pricing values
  const watchedQuantity = watch('quantity') || 1;
  const watchedAccessories = watch('accessoriesAmount') || 0;
  const watchedInsurance = watch('insuranceAmount') || 0;
  const watchedRegistration = watch('registrationAmount') || 0;
  const watchedFinance = watch('financeCharges') || 0;
  const watchedDiscount = watch('discountAmount') || 0;

  // Real pricing mathematical calculation (Ashok Leyland commercial pricing structure)
  const unitBasePrice = Number(selectedVariant?.basePrice || 0);
  const baseVehicleTotal = unitBasePrice * watchedQuantity;
  const additionalCharges = watchedAccessories + watchedInsurance + watchedRegistration + watchedFinance;
  const netTaxableSubtotal = Math.max(0, baseVehicleTotal + additionalCharges - watchedDiscount);

  // GST rate: standard commercial 28% (14% CGST + 14% SGST)
  const gstRate = Number(selectedVariant?.gstRate ?? 28);
  const totalGstAmount = Math.round((netTaxableSubtotal * gstRate) / 100);
  const cgstAmount = Math.round(totalGstAmount / 2);
  const sgstAmount = totalGstAmount - cgstAmount;
  const finalCalculatedTotal = netTaxableSubtotal + totalGstAmount;

  const onSubmit = async (data: QuotationFormData) => {
    setSubmitError(null);
    try {
      const response = await salesService.createQuotation({
        customerId: data.customerId,
        branchId: data.branchId,
        variantId: data.variantId,
        vehicleId: data.vehicleId || undefined,
        quantity: data.quantity,
        accessoriesAmount: data.accessoriesAmount,
        insuranceAmount: data.insuranceAmount,
        registrationAmount: data.registrationAmount,
        financeCharges: data.financeCharges,
        discountAmount: data.discountAmount,
        validityDate: data.validityDate,
        notes: data.notes || undefined,
      });

      if (response && response.id) {
        navigate(`/sales/quotations/${response.id}`);
      } else {
        navigate('/sales/quotations');
      }
    } catch (err: any) {
      setSubmitError(
        err?.message ||
          'Failed to submit quotation. Please check all selected fields and ensure customer and vehicle match your branch scope.'
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Commercial Fleet Quotation"
        subtitle={`Generate formal pricing proposal for commercial vehicles • ${activeBranchName}`}
        breadcrumbItems={[
          { label: 'Sales', href: '/sales' },
          { label: 'Quotations', href: '/sales/quotations' },
          { label: 'New Quote' },
        ]}
      />

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-6 flex items-start gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Quotation Submission Error</p>
            <p className="mt-0.5 text-rose-700">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Header / Account Context */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileText className="w-4 h-4 text-amber-500" /> Authorized Account & Dealership Branch
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Branch Selection */}
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Dealership Branch <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`w-full h-10 px-3 rounded-lg bg-zinc-50 border text-zinc-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                          errors.branchId ? 'border-rose-400' : 'border-zinc-200'
                        }`}
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.branchId && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.branchId.message}</p>
                  )}
                </div>

                {/* Customer Selection */}
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Customer Account <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={loadingCustomers}
                        className={`w-full h-10 px-3 rounded-lg bg-zinc-50 border text-zinc-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                          errors.customerId ? 'border-rose-400' : 'border-zinc-200'
                        }`}
                      >
                        <option value="">
                          {loadingCustomers ? 'Loading customers...' : 'Select Authorized Customer'}
                        </option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName || c.name} — {c.phone} ({c.city || 'Rajasthan'})
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.customerId && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.customerId.message}</p>
                  )}
                </div>

                {/* Quotation Validity Date */}
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Quotation Validity Date <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="validityDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        {...field}
                        className={`w-full h-10 px-3 rounded-lg bg-zinc-50 border text-zinc-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                          errors.validityDate ? 'border-rose-400' : 'border-zinc-200'
                        }`}
                      />
                    )}
                  />
                  {errors.validityDate && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.validityDate.message}</p>
                  )}
                </div>

                {/* Optional VIN Assignment from in-stock inventory */}
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Allocate In-Stock VIN (Optional)
                  </label>
                  <Controller
                    name="vehicleId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">Factory Allocation / On-Order (No immediate VIN)</option>
                        {inStockVehicles.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            VIN: {v.vin} ({v.color || 'Standard'}) — In Stock
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection & Commercial Line Items */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" /> Commercial Truck Model & Chassis Specification
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Truck Variant <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="variantId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={loadingVariants}
                        className={`w-full h-10 px-3 rounded-lg bg-zinc-50 border text-zinc-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                          errors.variantId ? 'border-rose-400' : 'border-zinc-200'
                        }`}
                      >
                        <option value="">
                          {loadingVariants ? 'Loading vehicle catalogue...' : 'Select Truck Variant Specification'}
                        </option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.manufacturerName ? `${v.manufacturerName} ` : ''}
                            {v.name} — Base: ₹{Number(v.basePrice).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.variantId && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.variantId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Fleet Quantity <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                        className={`w-full h-10 px-3 rounded-lg bg-zinc-50 border text-zinc-900 font-mono text-center text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                          errors.quantity ? 'border-rose-400' : 'border-zinc-200'
                        }`}
                      />
                    )}
                  />
                  {errors.quantity && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.quantity.message}</p>
                  )}
                </div>
              </div>

              {selectedVariant && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-semibold text-zinc-900">
                    <span>
                      {selectedVariant.manufacturerName} {selectedVariant.name}
                    </span>
                    <span className="font-mono text-amber-700 font-bold">
                      ₹{unitBasePrice.toLocaleString()} / unit
                    </span>
                  </div>
                  <p className="text-zinc-600 text-[11px]">
                    Engine: {selectedVariant.engineDetails || 'i-Gen6 BS6'} • Fuel: {selectedVariant.fuelType || 'Diesel'} •
                    Payload: {selectedVariant.payload ? `${selectedVariant.payload} kg` : 'Heavy Haulage'}
                  </p>
                </div>
              )}
            </div>

            {/* Mandatory Commercial Addons & Taxes */}
            <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
                Commercial Add-ons, RTO Registration & Fleet Discounts
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Accessories (₹)</label>
                  <Controller
                    name="accessoriesAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Commercial Insurance (₹)</label>
                  <Controller
                    name="insuranceAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 font-medium mb-1">RTO Registration (₹)</label>
                  <Controller
                    name="registrationAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Special Discount (₹)</label>
                  <Controller
                    name="discountAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1 text-xs">Quotation Notes / Terms</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      rows={2}
                      {...field}
                      placeholder="e.g. Price includes standard 2-year warranty and driver training package."
                      className="w-full p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  )}
                />
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate('/sales/quotations')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg border border-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Creating Quotation...' : 'Generate Quotation'}
              </button>
            </div>
          </div>

          {/* Real-time Calculation Summary Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-20 cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Commercial Price Breakdown
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Base Chassis ({watchedQuantity} unit{watchedQuantity > 1 ? 's' : ''})</span>
                  <span className="font-mono font-medium text-zinc-900">
                    ₹{baseVehicleTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <span>Accessories & Body Options</span>
                  <span className="font-mono font-medium text-zinc-900">
                    +₹{watchedAccessories.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <span>Commercial Comprehensive Insurance</span>
                  <span className="font-mono font-medium text-zinc-900">
                    +₹{watchedInsurance.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <span>RTO Road Tax & Registration</span>
                  <span className="font-mono font-medium text-zinc-900">
                    +₹{watchedRegistration.toLocaleString()}
                  </span>
                </div>

                {watchedDiscount > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Fleet Discount Applied</span>
                    <span className="font-mono font-medium text-rose-600">
                      -₹{watchedDiscount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-800 border-t border-zinc-100 pt-2 font-semibold">
                  <span>Taxable Subtotal</span>
                  <span className="font-mono font-bold text-zinc-900">
                    ₹{netTaxableSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>CGST (14%)</span>
                  <span className="font-mono text-zinc-700">₹{cgstAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>SGST (14%)</span>
                  <span className="font-mono text-zinc-700">₹{sgstAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-t border-zinc-200 pt-3 text-sm font-bold text-zinc-950">
                  <span>Total Quotation Amount</span>
                  <span className="font-mono text-emerald-700 font-extrabold">
                    ₹{finalCalculatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1">
                <p>• Commercial vehicle GST applicable at {gstRate}%.</p>
                <p>• Auto-persists formal line items to PostgreSQL database.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
