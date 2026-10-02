import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Target, PhoneCall, MessageSquare } from 'lucide-react';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Commercial Lead #${id}`}
        subtitle="Lead evaluation, follow-up history, and opportunity progression"
        breadcrumbItems={[{ label: 'CRM', href: '/crm/leads' }, { label: id || 'Lead' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Target className="w-4 h-4 text-blue-400" /> Lead Overview
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Lead ID</span>
              <span className="font-mono text-slate-200">{id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status</span>
              <span className="text-slate-200">Pending Contact</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 cockpit-card p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-cyan-400" /> Communication Log
          </h3>
          <EmptyState
            title="No interaction logs found"
            description="Call notes, email threads, and quotation revisions for this lead will appear here."
          />
        </div>
      </div>
    </div>
  );
};
