import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Building,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { billingService } from '@/services/billing.service';
import { customerService } from '@/services/customer.service';
import { branchService } from '@/services/branch.service';
import { useScope } from '@/app/providers/ScopeContext';
import { Customer, Branch } from '@/types/domain';

export interface InvoiceItemFormData {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

export interface InvoiceFormData {
  customerId: string;
  branchId: string;
  billingAddress: string;
  gstin?: string;
  bookingId?: string;
  vehicleId?: string;
  isInterState: boolean;
  discount: number;
  items: InvoiceItemFormData[];
}

const invoiceItemSchema: z.ZodType<InvoiceItemFormData> = z.object({
  description: z.string().min(1, 'Item description required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  gstRate: z.number().min(0).max(100),
});

const invoiceSchema: z.ZodType<InvoiceFormData> = z.object({
  customerId: z.string().min(1, 'Customer selection is required'),
  branchId: z.string().min(1, 'Branch is required'),
  billingAddress: z.string().min(3, 'Billing address is required'),
  gstin: z.string().optional(),
  bookingId: z.string().optional(),
  vehicleId: z.string().optional(),
  isInterState: z.boolean(),
  discount: z.number().min(0),
  items: z.array(invoiceItemSchema).min(1, 'At least 1 item is required'),
});

export const InvoiceFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, activeBranchName } = useScope();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      branchId: selectedBranchId !== 'ALL' ? selectedBranchId : '',
      customerId: '',
      billingAddress: '',
      gstin: '',
      isInterState: false,
      discount: 0,
      items: [
        {
          description: 'Commercial Vehicle Spare Parts & Service Labour',
          quantity: 1,
          unitPrice: 25000,
          gstRate: 18,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Load Customers and Branches on mount
  useEffect(() => {
    async function loadMetadata() {
      setIsLoadingMeta(true);
      try {
        const [custRes, branchRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          branchService.getBranches(),
        ]);
        setCustomers(custRes.data || []);
        const validBranches = branchRes.data || [];
        setBranches(validBranches);

        if (!selectedBranchId || selectedBranchId === 'ALL') {
          if (validBranches.length > 0) {
            setValue('branchId', validBranches[0].id);
          }
        } else {
          setValue('branchId', selectedBranchId);
        }
      } catch (err) {
        console.error('Failed to load customers or branches:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    }
    loadMetadata();
  }, [selectedBranchId, setValue]);

  const watchedCustomerId = watch('customerId');
  const watchedBranchId = watch('branchId');
  const watchedItems = watch('items') || [];
  const watchedDiscount = watch('discount') || 0;
  const watchedIsInterState = watch('isInterState');

  // When customer changes, autofill billing address & gstin
  useEffect(() => {
    if (watchedCustomerId) {
      const selected = customers.find((c) => c.id === watchedCustomerId);
      if (selected) {
        if (selected.address) {
          setValue('billingAddress', selected.address);
        }
        const taxVal = (selected as any).gstin || selected.taxId || '';
        if (taxVal) {
          setValue('gstin', taxVal);
        }
      }
    }
  }, [watchedCustomerId, customers, setValue]);

  // Server-parity Math Calculations
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  watchedItems.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const rate = Number(item.gstRate) || 18;
    const lineSubtotal = qty * price;
    const gstAmount = Math.round(lineSubtotal * (rate / 100) * 100) / 100;

    subtotal += lineSubtotal;
    if (watchedIsInterState) {
      totalIgst += gstAmount;
    } else {
      const half = Math.round((gstAmount / 2) * 100) / 100;
      totalCgst += half;
      totalSgst += half;
    }
  });

  const taxableAmount = Math.max(0, subtotal - (Number(watchedDiscount) || 0));
  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = taxableAmount + totalTax;

  const onSubmit = async (data: InvoiceFormData) => {
    setSubmitError(null);
    try {
      const payload = {
        customerId: data.customerId,
        branchId: data.branchId,
        billingAddress: data.billingAddress.trim(),
        gstin: data.gstin?.trim() || undefined,
        bookingId: data.bookingId?.trim() || undefined,
        vehicleId: data.vehicleId?.trim() || undefined,
        discount: Number(data.discount) || 0,
        isInterState: Boolean(data.isInterState),
        items: data.items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          gstRate: Number(it.gstRate),
        })),
      };

      const created = await billingService.createInvoice(payload);
      navigate(`/billing/invoices/${created.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to issue tax invoice. Please review required fields.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issue GST Tax Invoice"
        subtitle={`Generate verified, audit-logged GST invoices for ${activeBranchName}`}
        breadcrumbItems={[
          { label: 'Billing', href: '/billing/invoices' },
          { label: 'Invoices', href: '/billing/invoices' },
          { label: 'New Invoice' },
        ]}
      />

      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer & Branch Selection */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Building className="w-4 h-4 text-[#F5A800]" /> Entity & Responsible Branch
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Responsible Branch *
                  </label>
                  <select
                    {...register('branchId')}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-hidden focus:border-[#F5A800] transition-colors"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <span className="text-red-500 text-[11px] mt-1 block">
                      {errors.branchId.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Customer / Billed Party *
                  </label>
                  <select
                    {...register('customerId')}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-hidden focus:border-[#F5A800] transition-colors"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.contactPerson || c.companyName} {c.companyName ? `(${c.companyName})` : ''} - {c.phone}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <span className="text-red-500 text-[11px] mt-1 block">
                      {errors.customerId.message}
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Billing Address *
                  </label>
                  <input
                    {...register('billingAddress')}
                    placeholder="Complete corporate or residential billing address"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-hidden focus:border-[#F5A800] transition-colors"
                  />
                  {errors.billingAddress && (
                    <span className="text-red-500 text-[11px] mt-1 block">
                      {errors.billingAddress.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Customer GSTIN</label>
                  <input
                    {...register('gstin')}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono focus:outline-hidden focus:border-[#F5A800] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Transaction Type (Tax Mechanism)
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isInterState')}
                      className="w-4 h-4 rounded text-[#F5A800] focus:ring-[#F5A800] border-zinc-300"
                    />
                    <span className="text-xs text-zinc-700 font-medium">
                      Inter-State Supply (IGST instead of CGST+SGST)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Optional Source References */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileText className="w-4 h-4 text-zinc-600" /> Optional Transaction Link
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-600 mb-1">Booking ID / Reference</label>
                  <input
                    {...register('bookingId')}
                    placeholder="Optional UUID of associated booking"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-hidden focus:border-[#F5A800]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Vehicle ID</label>
                  <input
                    {...register('vehicleId')}
                    placeholder="Optional UUID of commercial vehicle"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-hidden focus:border-[#F5A800]"
                  />
                </div>
              </div>
            </div>

            {/* Billed Line Items */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">Line Items & Commercial Services</h3>
                <button
                  type="button"
                  onClick={() =>
                    append({ description: 'Spare Part / Labour Item', quantity: 1, unitPrice: 1500, gstRate: 18 })
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 p-3 bg-zinc-50/70 rounded-xl border border-zinc-200 items-center text-xs"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-[10px] text-zinc-500 font-semibold mb-1">
                        Description
                      </label>
                      <input
                        {...register(`items.${index}.description` as const)}
                        placeholder="Item or service details"
                        className="w-full h-9 px-3 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-hidden focus:border-[#F5A800]"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-[10px] text-zinc-500 font-semibold mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-mono text-center focus:outline-hidden focus:border-[#F5A800]"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      <label className="block text-[10px] text-zinc-500 font-semibold mb-1">
                        Unit Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-mono focus:outline-hidden focus:border-[#F5A800]"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <label className="block text-[10px] text-zinc-500 font-semibold mb-1">
                        GST %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        {...register(`items.${index}.gstRate` as const, { valueAsNumber: true })}
                        className="w-full h-9 px-1 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-mono text-center focus:outline-hidden focus:border-[#F5A800]"
                      />
                    </div>
                    <div className="col-span-1 text-right flex items-center justify-end">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors mt-4 md:mt-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount row */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-3 text-xs">
                <label className="text-zinc-600 font-semibold">Special Discount (₹):</label>
                <input
                  type="number"
                  min="0"
                  {...register('discount', { valueAsNumber: true })}
                  className="w-32 h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-right"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/billing/invoices')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingMeta}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F5A800]" /> Generating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Issue GST Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* GST Live Invoice Summary Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-20 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Tax Breakdown</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                {watchedIsInterState ? 'IGST' : 'CGST + SGST'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal (Gross)</span>
                <span className="font-mono text-zinc-900 font-semibold">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {watchedDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span className="font-mono font-semibold">
                    -₹{Number(watchedDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600 font-medium pt-1 border-t border-zinc-100">
                <span>Taxable Value</span>
                <span className="font-mono font-bold text-zinc-900">
                  ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {!watchedIsInterState ? (
                <>
                  <div className="flex justify-between text-zinc-500">
                    <span>CGST Total</span>
                    <span className="font-mono text-zinc-800 font-medium">
                      ₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>SGST Total</span>
                    <span className="font-mono text-zinc-800 font-medium">
                      ₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-zinc-500">
                  <span>IGST Total</span>
                  <span className="font-mono text-zinc-800 font-medium">
                    ₹{totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t-2 border-zinc-900 pt-3 text-sm font-bold text-zinc-900">
                <span>Total Payable</span>
                <span className="font-mono text-emerald-700">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-500 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Calculations are validated on the backend upon submission. Duplicate invoices for the same transaction are authoritatively prevented.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
