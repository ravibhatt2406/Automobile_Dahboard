import React from 'react';
import { Vehicle3DViewer } from './Vehicle3DViewer';

interface VehicleShowcaseProps {
  title?: string;
  modelUrl?: string;
}

export const VehicleShowcase: React.FC<VehicleShowcaseProps> = ({
  title = 'Commercial Vehicle Inspection 3D View',
  modelUrl,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">{title}</h3>
      <Vehicle3DViewer modelUrl={modelUrl} />
    </div>
  );
};
