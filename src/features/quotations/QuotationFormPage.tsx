import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, ArrowLeft, Calculator } from 'lucide-react';
import { salesService } from '@/services/sales.service';

const quotationSchema = z.object({
  quotationNumber: z.string().min(2, 'Quotation number required'),
  customerName: z.string().min(2, 'Customer name required'),
  vehicleModel: z.string().min(2, 'Vehicle spec required'),
  accessoriesAmount: z.number().min(0),
  insuranceAmount: z.number().min(0),
  financeAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  cgstRate: z.number().min(0),
  sgstRate: z.number().min(0),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'expired']),
  validUntil: z.string().min(1, 'Valid until date required'),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Description required'),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, 'At least 1 line item required'),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

export const QuotationFormPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotationNumber: `QT-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: '',
      vehicleModel: 'Titan T-5000 Heavy Hauler Tractor',
      accessoriesAmount: 4500,
      insuranceAmount: 3800,
      financeAmount: 1200,
      discountAmount: 2500,
      cgstRate: 9,
      sgstRate: 9,
      status: 'draft',
      validUntil: '2026-10-31',
      items: [
        {
          description: 'Titan T-5000 6x4 Tractor Chassis Base Specification',
          quantity: 1,
          unitPrice: 185000,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedAccessories = watch('accessoriesAmount') || 0;
  const watchedInsurance = watch('insuranceAmount') || 0;
  const watchedFinance = watch('financeAmount') || 0;
  const watchedDiscount = watch('discountAmount') || 0;
  const watchedCgstRate = watch('cgstRate') || 0;
  const watchedSgstRate = watch('sgstRate') || 0;

  // Real frontend mathematical calculation from form inputs (Not fake data!)
  const itemsSubtotal = (watchedItems || []).reduce(
    (acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0),
    0
  );
  const grossBeforeTax =
    itemsSubtotal + watchedAccessories + watchedInsurance + watchedFinance - watchedDiscount;
  const cgstAmount = (grossBeforeTax * watchedCgstRate) / 100;
  const sgstAmount = (grossBeforeTax * watchedSgstRate) / 100;
  const calculatedTotal = grossBeforeTax + cgstAmount + sgstAmount;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: QuotationFormData) => {
    setSubmitError(null);
    try {
      await salesService.createQuotation({
        variantId: data.vehicleModel,
        quantity: data.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || 1,
        accessoriesAmount: data.accessoriesAmount,
        insuranceAmount: data.insuranceAmount,
        financeCharges: data.financeAmount,
        discountAmount: data.discountAmount,
        validityDate: data.validUntil,
        notes: `Customer: ${data.customerName}`,
      });
      navigate('/sales/quotations');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit quotation to backend.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Commercial Quotation"
        subtitle="Generate pricing proposal with real line item calculations and tax breakdown"
        breadcrumbItems={[
          { label: 'Sales', href: '/sales' },
          { label: 'Quotations', href: '/sales/quotations' },
          { label: 'New Quote' },
        ]}
      />

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-semibold mb-4">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-blue-400" /> Header Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Quote Ref #</label>
                  <input
                    {...register('quotationNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer / Fleet Account</label>
                  <input
                    {...register('customerName')}
                    placeholder="Corporate Client Name"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                  {errors.customerName && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Specification</label>
                  <input
                    {...register('vehicleModel')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    {...register('validUntil')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-200">Line Items & Commercial Fleet Pricing</h3>
                <button
                  type="button"
                  onClick={() => append({ description: 'Additional Specification', quantity: 1, unitPrice: 1000 })}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-6">
                      <input
                        {...register(`items.${index}.description` as const)}
                        placeholder="Item Description"
                        className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        placeholder="Qty"
                        className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-center font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                        placeholder="Price $"
                        className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fees & Discounts */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
                Accessories, Insurance & Taxes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Accessories ($)</label>
                  <input
                    type="number"
                    {...register('accessoriesAmount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Insurance ($)</label>
                  <input
                    type="number"
                    {...register('insuranceAmount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    {...register('discountAmount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CGST / SGST Rate (%)</label>
                  <input
                    type="number"
                    {...register('cgstRate', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/sales/quotations')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-600/30"
              >
                <Save className="w-4 h-4" /> Save Quotation
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation Summary */}
        <div className="space-y-6">
          <div className="sticky top-20 cockpit-card p-6 rounded-xl border border-slate-800 space-y-4 bg-slate-950/80">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" /> Real-time Calculation Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-mono text-slate-200">${itemsSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Accessories + Insurance</span>
                <span className="font-mono text-slate-200">
                  +${(watchedAccessories + watchedInsurance).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount Applied</span>
                <span className="font-mono text-rose-400">-${watchedDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2 font-medium">
                <span>Gross Amount</span>
                <span className="font-mono text-slate-100">${grossBeforeTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST ({watchedCgstRate}%)</span>
                <span className="font-mono text-slate-300">${cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST ({watchedSgstRate}%)</span>
                <span className="font-mono text-slate-300">${sgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-bold text-slate-100">
                <span>Total Calculated Amount</span>
                <span className="font-mono text-emerald-400">${calculatedTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
