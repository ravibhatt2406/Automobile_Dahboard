import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { FileText, Printer, Send } from 'lucide-react';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Quotation #${id}`}
        subtitle="Commercial vehicle sales quotation specification"
        breadcrumbItems={[
          { label: 'Sales', href: '/sales' },
          { label: 'Quotations', href: '/sales/quotations' },
          { label: id || 'Detail' },
        ]}
        actions={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700">
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg">
              <Send className="w-3.5 h-3.5" /> Send to Customer
            </button>
          </div>
        }
      />

      <div className="cockpit-card p-8 rounded-xl border border-slate-800 space-y-6">
        <div className="flex justify-between items-start border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 uppercase">Commercial Fleet Specification</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Ref ID: {id}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">Issued Date: --</span>
            <span className="text-xs text-slate-400 block font-mono">Valid Until: --</span>
          </div>
        </div>

        <div className="text-center py-12 text-slate-400 space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Quotation detail record unavailable</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Connect to backend endpoint to fetch detailed pricing sheets and breakdown schedules.
          </p>
        </div>
      </div>
    </div>
  );
};
