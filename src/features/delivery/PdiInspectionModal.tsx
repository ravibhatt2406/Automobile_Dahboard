import React, { useState } from 'react';
import { PdiInspection, PdiChecklistItem } from '@/types/domain';
import { X, CheckCircle2, ShieldAlert, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdiInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inspection: Partial<PdiInspection>) => void;
  vin?: string;
  vehicleModel?: string;
}

export const PdiInspectionModal: React.FC<PdiInspectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vin = '1FT8W3BT3RED10492',
  vehicleModel = 'Titan T-5000 Heavy Hauler',
}) => {
  const [inspectorName, setInspectorName] = useState('Alex Vance (Lead Quality Inspector)');
  const [remarks, setRemarks] = useState('Vehicle passed all PDI safety checks. Cleared for customer delivery.');
  const [checklist, setChecklist] = useState<PdiChecklistItem[]>([
    { id: '1', task: 'Brake System Pressure & ABS Telemetry Inspection', passed: true },
    { id: '2', task: 'Powertrain Engine Oil & Transmission Fluid Levels', passed: true },
    { id: '3', task: 'Electrical Wiring, Lighting & Battery State of Health', passed: true },
    { id: '4', task: 'Tyre Pressure & Axle Alignment Inspection', passed: true },
    { id: '5', task: 'Cabin Electronics, Heating & HVAC Functionality', passed: true },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
  };

  const allPassed = checklist.every((item) => item.passed);

  const handleSave = () => {
    onSubmit({
      vehicleVin: vin,
      vehicleModel,
      inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      checklist,
      status: allPassed ? 'passed' : 'failed',
      remarks,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg cockpit-card p-6 rounded-xl border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Pre-Delivery Inspection (PDI)
                </h3>
                <p className="text-[11px] font-mono text-blue-400 mt-0.5">VIN: {vin}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Quality Inspector Name</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Technical Inspection Checklist
                </span>
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      item.passed
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                    }`}
                  >
                    <span className="font-medium pr-2">{item.task}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        item.passed ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                      }`}
                    >
                      {item.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>

              {!allPassed && (
                <div className="p-3 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Warning: Vehicle delivery is blocked until all inspection checklist items pass.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Inspector Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-3.5 h-3.5" /> Save Inspection Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
