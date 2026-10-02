import React from 'react';
import { Vehicle3DViewer } from './Vehicle3DViewer';

interface VehicleInspectionViewerProps {
  vin?: string;
  vehicleModel?: string;
  modelUrl?: string;
}

export const VehicleInspectionViewer: React.FC<VehicleInspectionViewerProps> = ({
  vin,
  vehicleModel,
  modelUrl,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
        <span>3D Technical Inspection CAD View</span>
        {vin && <span className="font-mono text-blue-400">VIN: {vin}</span>}
      </div>
      <Vehicle3DViewer modelUrl={modelUrl} vehicleName={vehicleModel} vin={vin} />
    </div>
  );
};
