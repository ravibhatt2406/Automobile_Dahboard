import React from 'react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { User, Plus, Calendar, AlertTriangle } from 'lucide-react';

interface VisualSalesPipelineProps {
  leads: any[];
  onSelectLead: (leadId: string) => void;
  onCreateLead: () => void;
}

const PIPELINE_STAGES: Array<{ key: string; label: string; color: string }> = [
  { key: 'NEW', label: 'New Lead', color: 'border-blue-500' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-cyan-500' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'border-indigo-500' },
  { key: 'PROPOSAL', label: 'Test Drive / Demo', color: 'border-purple-500' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-amber-500' },
  { key: 'CONVERTED', label: 'Won (Converted)', color: 'border-emerald-500' },
  { key: 'LOST', label: 'Closed Lost', color: 'border-rose-500' },
];

export const VisualSalesPipeline: React.FC<VisualSalesPipelineProps> = ({
  leads,
  onSelectLead,
  onCreateLead,
}) => {
  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < Date.now();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter(
          (l) => (l.status || '').toUpperCase() === stage.key
        );

        return (
          <div
            key={stage.key}
            className="w-72 shrink-0 bg-white rounded-xl border border-zinc-200 flex flex-col max-h-[75vh] shadow-xs"
          >
            {/* Stage Header */}
            <div className={`p-3 border-b border-zinc-100 bg-zinc-50 border-t-2 ${stage.color} flex items-center justify-between`}>
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                {stage.label}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-bold">
                {stageLeads.length}
              </span>
            </div>

            {/* Stage Cards List */}
            <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[220px]">
              {stageLeads.length > 0 ? (
                stageLeads.map((lead) => {
                  const customerName = lead.customer?.name || lead.prospectName || lead.customerName || 'Prospect';
                  const companyName = lead.customer?.companyName || lead.companyName;
                  const employeeName = lead.assignedEmployee
                    ? `${lead.assignedEmployee.firstName} ${lead.assignedEmployee.lastName}`
                    : (lead.assignedEmployeeName || 'Unassigned');
                  const overdue = isOverdue(lead.nextFollowUpDate);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-amber-500 hover:bg-white cursor-pointer transition-all space-y-2 shadow-xs group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold text-zinc-700 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                          {lead.leadNumber || `LD-${lead.id.slice(0, 6).toUpperCase()}`}
                        </span>
                        <div className="flex items-center gap-1">
                          {!lead.customerId && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                              Prospect
                            </span>
                          )}
                          <StatusBadge status={lead.priority || 'MEDIUM'} />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-amber-600 transition-colors">
                          {companyName || customerName}
                        </h4>
                        {companyName && (
                          <p className="text-[10px] text-zinc-500 truncate">{customerName}</p>
                        )}
                      </div>

                      {lead.interestedModel && (
                        <p className="text-[11px] font-medium text-zinc-700 bg-white px-2 py-1 rounded border border-zinc-200 truncate">
                          {lead.interestedModel}
                        </p>
                      )}

                      {lead.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className={`w-3 h-3 ${overdue ? 'text-rose-600' : 'text-zinc-400'}`} />
                          <span className={`font-mono ${overdue ? 'text-rose-600 font-bold' : 'text-zinc-600'}`}>
                            {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                          </span>
                          {overdue && (
                            <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[9px] flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Due
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-200/80 font-mono">
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <User className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{employeeName}</span>
                        </span>
                        {lead.expectedBudget ? (
                          <span className="font-bold text-zinc-800">
                            ₹{Number(lead.expectedBudget).toLocaleString()}
                          </span>
                        ) : (
                          <span>Enquiry</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-lg text-zinc-400">
                  <span className="text-[11px]">No opportunities in {stage.label}</span>
                </div>
              )}
            </div>

            <div className="p-2 border-t border-zinc-100 bg-zinc-50">
              <button
                onClick={onCreateLead}
                className="w-full py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1 border border-zinc-200 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" /> Add Opportunity
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
