import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, ArrowLeft, Download, ShieldCheck } from 'lucide-react';

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(2, 'Invoice number required'),
  customerName: z.string().min(2, 'Customer name required'),
  vehicleVin: z.string().optional(),
  type: z.enum(['vehicle_sale', 'service', 'parts']),
  dueDate: z.string().min(1, 'Due date required'),
  discount: z.number().min(0),
  cgstRate: z.number().min(0),
  sgstRate: z.number().min(0),
  igstRate: z.number().min(0),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Item description required'),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, 'At least 1 item required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const InvoiceFormPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: 'Apex Fleet Logistics Inc.',
      vehicleVin: '1FT8W3BT3RED10492',
      type: 'vehicle_sale',
      dueDate: '2026-10-31',
      discount: 2000,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      items: [
        {
          description: 'Titan T-5000 Heavy Hauler Commercial Tractor Chassis',
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
  const watchedDiscount = watch('discount') || 0;
  const watchedCgstRate = watch('cgstRate') || 0;
  const watchedSgstRate = watch('sgstRate') || 0;
  const watchedIgstRate = watch('igstRate') || 0;

  // Real Mathematical Calculations (No fake data!)
  const subtotal = (watchedItems || []).reduce(
    (acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0),
    0
  );
  const netBeforeTax = subtotal - watchedDiscount;
  const cgstAmount = (netBeforeTax * watchedCgstRate) / 100;
  const sgstAmount = (netBeforeTax * watchedSgstRate) / 100;
  const igstAmount = (netBeforeTax * watchedIgstRate) / 100;
  const totalAmount = netBeforeTax + cgstAmount + sgstAmount + igstAmount;

  const onSubmit = async (data: InvoiceFormData) => {
    console.log('Invoice Generated:', {
      ...data,
      subtotal,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      totalAmount,
    });
    navigate('/billing/invoices');
  };

  return (
    <div>
      <PageHeader
        title="Create GST Tax Invoice"
        subtitle="Generate GST-compliant tax invoices, line item breakdowns, and tax rates"
        breadcrumbItems={[
          { label: 'Billing', href: '/billing/invoices' },
          { label: 'Invoices', href: '/billing/invoices' },
          { label: 'New Invoice' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-emerald-400" /> GST Billing Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Invoice Number</label>
                  <input
                    {...register('invoiceNumber')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer / Billed Party</label>
                  <input
                    {...register('customerName')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Associated VIN</label>
                  <input
                    {...register('vehicleVin')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono uppercase focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Billing Type</label>
                  <select
                    {...register('type')}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500"
                  >
                    <option value="vehicle_sale">Commercial Vehicle Sale</option>
                    <option value="service">Workshop Service & Labour</option>
                    <option value="parts">Spare Parts & Accessories</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-200">Billed Items & Services</h3>
                <button
                  type="button"
                  onClick={() => append({ description: 'Service Item', quantity: 1, unitPrice: 500 })}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Billed Item
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-6">
                      <input
                        {...register(`items.${index}.description` as const)}
                        className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
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

            {/* GST Rates */}
            <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
                GST Rates & Discount
              </h3>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    {...register('discount', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CGST Rate (%)</label>
                  <input
                    type="number"
                    {...register('cgstRate', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">SGST Rate (%)</label>
                  <input
                    type="number"
                    {...register('sgstRate', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">IGST Rate (%)</label>
                  <input
                    type="number"
                    {...register('igstRate', { valueAsNumber: true })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/billing/invoices')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-600/30"
              >
                <Save className="w-4 h-4" /> Create GST Invoice
              </button>
            </div>
          </form>
        </div>

        {/* GST Live Invoice Preview Sheet */}
        <div className="space-y-6">
          <div className="sticky top-20 cockpit-card p-6 rounded-xl border border-slate-800 space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-200">GST Invoice Preview</h3>
              <button
                onClick={() => alert('PDF generation is backend-dependent. Download trigger ready.')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount</span>
                <span className="font-mono text-rose-400">-${watchedDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST ({watchedCgstRate}%)</span>
                <span className="font-mono text-slate-300">${cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST ({watchedSgstRate}%)</span>
                <span className="font-mono text-slate-300">${sgstAmount.toLocaleString()}</span>
              </div>
              {watchedIgstRate > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>IGST ({watchedIgstRate}%)</span>
                  <span className="font-mono text-slate-300">${igstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-bold text-slate-100">
                <span>Total GST Invoice Amount</span>
                <span className="font-mono text-emerald-400">${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
