import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { FileText, Printer, ArrowLeft, Truck, User, Building, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { AccessRestricted } from '@/components/feedback/AccessRestricted';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => (id ? salesService.getQuotationById(id) : null),
    retry: false,
  });

  if (isLoading) {
    return <LoadingState label="Retrieving commercial quotation proposal..." />;
  }

  if (error || !quotation) {
    return (
      <AccessRestricted
        reason={(error as any)?.message || 'Quotation record could not be found or is outside your branch scope.'}
      />
    );
  }

  const customer = quotation.customer;
  const variant = quotation.variant;
  const branch = quotation.branch;
  const items = quotation.items || [];

  const subtotal = Number(quotation.subtotal || 0);
  const gstAmount = Number(quotation.gstAmount || 0);
  const totalAmount = Number(quotation.totalAmount || 0);
  const cgstAmount = Math.round(gstAmount / 2);
  const sgstAmount = gstAmount - cgstAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quotation #${quotation.quotationNumber || id}`}
        subtitle="Commercial vehicle fleet proposal and tax invoice specification"
        breadcrumbItems={[
          { label: 'Sales', href: '/sales' },
          { label: 'Quotations', href: '/sales/quotations' },
          { label: quotation.quotationNumber || 'Detail' },
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/sales/quotations')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-amber-400 text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Quotation
            </button>
          </div>
        }
      />

      {/* Main Proposal Card */}
      <div className="cockpit-card p-8 rounded-2xl border border-zinc-200 bg-white space-y-8 shadow-xs">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-100 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
                {quotation.quotationNumber}
              </h2>
              <StatusBadge status={quotation.status || 'DRAFT'} />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Issued on: {new Date(quotation.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right flex flex-col md:items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
              Valid Through
            </span>
            <span className="text-sm font-bold text-zinc-900 font-mono flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              {quotation.validityDate ? new Date(quotation.validityDate).toLocaleDateString() : '30 Days from issue'}
            </span>
          </div>
        </div>

        {/* 2-Column: Customer & Dealership Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Customer Context */}
          <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" /> Client / Fleet Entity
              </span>
              {customer?.id && (
                <Link
                  to={`/customers/${customer.id}`}
                  className="text-amber-700 hover:text-amber-900 font-semibold"
                >
                  View 360 Ledger →
                </Link>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {customer?.companyName || customer?.name || quotation.customerName || 'Corporate Client'}
              </p>
              {customer?.contactPerson && (
                <p className="text-zinc-600 mt-0.5">Contact: {customer.contactPerson}</p>
              )}
              <p className="text-zinc-600 font-mono mt-0.5">Phone: {customer?.phone || '--'}</p>
              {customer?.email && (
                <p className="text-zinc-600 font-mono">Email: {customer.email}</p>
              )}
              {customer?.gstin && (
                <p className="text-zinc-700 font-mono font-medium mt-1">GSTIN: {customer.gstin}</p>
              )}
            </div>
          </div>

          {/* Dealership & Sales Context */}
          <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-zinc-700" /> Dealership Branch & Sales
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {branch?.name || 'Titan Auto Authorized Dealership'}
              </p>
              <p className="text-zinc-600 mt-0.5">
                Location: {branch?.city || 'Jaipur'}, {branch?.state || 'Rajasthan'}
              </p>
              <p className="text-zinc-600 font-mono mt-0.5">
                Sales Rep: {quotation.user?.name || quotation.user?.email || 'Authorized Commercial Executive'}
              </p>
            </div>
          </div>
        </div>

        {/* Commercial Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Commercial Fleet Specifications & Bill of Materials
          </h3>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 uppercase font-mono text-[11px] border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Line Item Description</th>
                  <th className="py-3 px-4 text-center">Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                      <td className="py-3.5 px-4 font-medium text-zinc-900">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 font-semibold">
                          {item.itemType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                        ₹{Number(item.unitPrice).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                        ₹{Number(item.totalPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-zinc-900">
                      {variant?.name || 'Commercial Heavy Hauler Chassis Specification'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 font-semibold">
                        VEHICLE_BASE
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">{quotation.quantity || 1}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                      ₹{subtotal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                      ₹{subtotal.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Tax Breakdown */}
        <div className="flex flex-col md:flex-row justify-between items-start pt-4 border-t border-zinc-100 gap-6">
          <div className="max-w-md space-y-2 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-800">Commercial Notes & Terms:</p>
            <p className="leading-relaxed">
              {quotation.notes ||
                '1. Standard commercial manufacturer warranty applies. 2. Vehicle delivery subject to RTO registration clearance and chassis availability.'}
            </p>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600 py-1">
              <span>Taxable Subtotal</span>
              <span className="font-mono font-bold text-zinc-900">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 py-1">
              <span>CGST (14%)</span>
              <span className="font-mono text-zinc-700">₹{cgstAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-zinc-500 py-1">
              <span>SGST (14%)</span>
              <span className="font-mono text-zinc-700">₹{sgstAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t-2 border-zinc-900 pt-3 text-sm font-extrabold text-zinc-950">
              <span>Total Proposal Amount</span>
              <span className="font-mono text-emerald-700 font-black">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
