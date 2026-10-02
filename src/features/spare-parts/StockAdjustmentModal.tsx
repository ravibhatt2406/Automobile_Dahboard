import React, { useState } from 'react';
import { SparePart, StockAdjustment } from '@/types/domain';
import { X, Package, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjustment: Partial<StockAdjustment>) => void;
  part?: SparePart | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  part,
}) => {
  const [adjustedQty, setAdjustedQty] = useState<number>(part?.stockQuantity || 10);
  const [reason, setReason] = useState<string>('Stock Audit Reconciliation');

  const handleSave = () => {
    if (!part) return;
    onSubmit({
      partId: part.id,
      partName: part.name,
      previousQuantity: part.stockQuantity,
      adjustedQuantity: adjustedQty,
      reason,
      adjustedBy: 'Alexander Vance',
      date: new Date().toISOString().split('T')[0],
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
            className="w-full max-w-md cockpit-card p-6 rounded-xl border border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Adjust Spare Part Stock
              </h3>
              <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block">Part Name & Number</span>
                <span className="font-semibold text-slate-200">{part?.name || 'Spare Part'}</span>
                <span className="font-mono text-blue-400 block mt-0.5">{part?.partNumber || '--'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Current Stock Qty</span>
                  <span className="font-mono font-bold text-slate-300 text-sm">{part?.stockQuantity ?? 0}</span>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">New Adjusted Qty</label>
                  <input
                    type="number"
                    value={adjustedQty}
                    onChange={(e) => setAdjustedQty(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Adjustment Reason / Notes</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500 mb-2"
                >
                  <option value="Stock Audit Reconciliation">Stock Audit Reconciliation</option>
                  <option value="Warehouse Shipment Receipt">Warehouse Shipment Receipt</option>
                  <option value="Damaged Part Write-off">Damaged Part Write-off</option>
                  <option value="Workshop Return">Workshop Return</option>
                </select>
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
                  <Save className="w-3.5 h-3.5" /> Save Stock Adjustment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
