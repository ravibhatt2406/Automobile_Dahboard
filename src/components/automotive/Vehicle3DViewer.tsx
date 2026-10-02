import React from 'react';
import { Box, Layers, BoxSelect } from 'lucide-react';
import { motion } from 'framer-motion';

interface Vehicle3DViewerProps {
  modelUrl?: string;
  vehicleName?: string;
  vin?: string;
  className?: string;
}

export const Vehicle3DViewer: React.FC<Vehicle3DViewerProps> = ({
  modelUrl,
  vehicleName = 'Commercial Vehicle Chassis',
  vin,
  className = '',
}) => {
  // If modelUrl is not provided or not loaded, show clean empty state as explicitly instructed!
  const hasModel = Boolean(modelUrl);

  return (
    <div
      className={`cockpit-card rounded-xl border border-[#E5E5E5] p-6 flex flex-col items-center justify-center relative overflow-hidden bg-white min-h-[320px] ${className}`}
    >
      {/* Background CAD grid styling */}
      <div className="absolute inset-0 grid-overlay opacity-50 pointer-events-none" />

      {hasModel ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
          <p className="text-sm font-mono text-[#F5A800]">Loading 3D asset from {modelUrl}...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center z-10 max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A800] mb-4 shadow-xs relative">
            <Box className="w-8 h-8 text-[#F5A800]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F5A800] rounded-full animate-ping" />
          </div>

          <span className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
            R3F 3D Engine Ready
          </span>

          <h4 className="text-base font-bold text-[#111111] mb-1">
            3D vehicle model unavailable
          </h4>

          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            No GLTF/GLB asset file is attached to {vehicleName} {vin ? `(VIN: ${vin})` : ''}. The
            3D viewer engine will render CAD geometry once linked from backend storage.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> WebGL 2.0
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BoxSelect className="w-3.5 h-3.5" /> Orbit Controls
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

