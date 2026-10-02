import React from 'react';
import { Truck } from 'lucide-react';

export const Fleet3DPreview: React.FC = () => {
  return (
    <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A800]">
        <Truck className="w-6 h-6 text-[#F5A800]" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-[#111111]">Fleet Network Visualization</h4>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          3D interactive spatial fleet network mapping will render here when branch telemetry is active.
        </p>
      </div>
      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600">
        3D View Fallback Mode
      </span>
    </div>
  );
};

