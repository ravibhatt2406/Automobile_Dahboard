import React from 'react';
import { Lead, LeadStatus } from '@/types/domain';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { User, Plus } from 'lucide-react';

interface VisualSalesPipelineProps {
  leads: Lead[];
  onSelectLead: (leadId: string) => void;
  onCreateLead: () => void;
}

const PIPELINE_STAGES: Array<{ key: LeadStatus; label: string; color: string }> = [
  { key: 'new', label: 'New Lead', color: 'border-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'border-cyan-500' },
  { key: 'qualified', label: 'Qualified', color: 'border-indigo-500' },
  { key: 'quotation', label: 'Quotation Sent', color: 'border-purple-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-amber-500' },
  { key: 'booked', label: 'Booked / Won', color: 'border-emerald-500' },
  { key: 'lost', label: 'Closed Lost', color: 'border-rose-500' },
];

export const VisualSalesPipeline: React.FC<VisualSalesPipelineProps> = ({
  leads,
  onSelectLead,
  onCreateLead,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.status === stage.key);
        return (
          <div
            key={stage.key}
            className="w-72 shrink-0 cockpit-card rounded-xl border border-slate-800 flex flex-col max-h-[75vh]"
          >
            {/* Stage Header */}
            <div className={`p-3 border-b border-slate-800 bg-slate-900/90 border-t-2 ${stage.color} flex items-center justify-between`}>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {stage.label}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {stageLeads.length}
              </span>
            </div>

            {/* Stage Cards List */}
            <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[200px]">
              {stageLeads.length > 0 ? (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-semibold text-slate-100">{lead.customerName}</h4>
                      <StatusBadge status={lead.priority} />
                    </div>
                    {lead.companyName && (
                      <p className="text-[11px] text-slate-400 font-medium">{lead.companyName}</p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {lead.assignedEmployeeName || 'Unassigned'}
                      </span>
                      <span>{lead.estimatedUnits} Units</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800/80 rounded-lg text-slate-600">
                  <span className="text-[11px]">No leads in stage</span>
                </div>
              )}
            </div>

            <div className="p-2 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={onCreateLead}
                className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1 border border-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Opportunity
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
