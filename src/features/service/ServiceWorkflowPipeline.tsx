import React from 'react';
import { ServiceWorkflowStage } from '@/types/domain';
import { Calendar, FileText, Search, UserCheck, Wrench, ShieldCheck, CreditCard, CheckCircle2, ChevronRight } from 'lucide-react';

interface ServiceWorkflowPipelineProps {
  currentStage?: ServiceWorkflowStage;
}

const STAGES: Array<{ key: ServiceWorkflowStage; label: string; icon: React.ElementType }> = [
  { key: 'appointment', label: 'Appointment', icon: Calendar },
  { key: 'job_card', label: 'Job Card', icon: FileText },
  { key: 'diagnosis', label: 'Diagnosis', icon: Search },
  { key: 'mechanic_assignment', label: 'Mechanic', icon: UserCheck },
  { key: 'work_in_progress', label: 'Work In Progress', icon: Wrench },
  { key: 'quality_check', label: 'Quality Check', icon: ShieldCheck },
  { key: 'invoice', label: 'Invoice', icon: CreditCard },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export const ServiceWorkflowPipeline: React.FC<ServiceWorkflowPipelineProps> = ({
  currentStage = 'appointment',
}) => {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="cockpit-card p-4 rounded-xl border border-slate-800 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-[700px]">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={stage.key}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold ring-2 ring-blue-500/40'
                    : isPassed
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : isPassed ? 'text-blue-400' : 'text-slate-600'}`} />
                <span>{stage.label}</span>
              </div>

              {idx < STAGES.length - 1 && (
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isPassed ? 'text-blue-500' : 'text-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
