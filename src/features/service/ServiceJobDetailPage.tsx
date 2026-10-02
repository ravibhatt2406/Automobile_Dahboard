import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { Wrench, Package, FileText } from 'lucide-react';

export const ServiceJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Service Job Card #${id}`}
        subtitle="Workshop repair card details, technician log, and parts consumption"
        breadcrumbItems={[
          { label: 'Service', href: '/service/jobs' },
          { label: 'Jobs', href: '/service/jobs' },
          { label: id || 'Detail' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wrench className="w-4 h-4 text-amber-400" /> Job Card Summary
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Job Card ID</span>
              <span className="font-mono text-slate-200">{id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bay Allocation</span>
              <span className="text-slate-200">Bay #--</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 cockpit-card p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-cyan-400" /> Spare Parts Consumed
          </h3>
          <div className="text-center py-10 text-slate-500 text-xs">
            No spare parts issued for this repair card yet.
          </div>
        </div>
      </div>
    </div>
  );
};
