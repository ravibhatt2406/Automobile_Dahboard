import React, { useState } from 'react';
import { SparePart } from '@/types/domain';
import { X, Package, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { sparePartsService } from '@/services/spare-parts.service';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  part?: (SparePart & Record<string, any>) | null;
  onSuccess?: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  part,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState('');
  const [movementType, setMovementType] = useState<'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'ISSUE'>('PURCHASE');
  const [quantity, setQuantity] = useState<string>('5');
  const [notes, setNotes] = useState<string>('Workshop Stock Replenishment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
    enabled: isOpen,
  });
  const branches = branchesData?.data || [];

  const adjustMutation = useMutation({
    mutationFn: (data: any) => sparePartsService.updateStock(data),
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      queryClient.invalidateQueries({ queryKey: ['branch-parts-stock'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to record stock movement');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!part) return;
    if (!branchId) {
      setErrorMessage('Please select a branch location');
      return;
    }
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage('Quantity must be a positive integer');
      return;
    }

    setErrorMessage(null);
    adjustMutation.mutate({
      partId: part.id,
      branchId,
      movementType,
      quantity: qtyNum,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#F5A800]" /> Record Stock Movement
              </h3>
              <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-mono">
                <span className="text-zinc-400 text-[10px] block uppercase font-sans">Selected SKU</span>
                <span className="font-bold text-zinc-900 text-sm block font-sans">{part?.name || 'Spare Part'}</span>
                <span className="text-blue-600 block mt-0.5">Part #: {part?.partNumber || '--'}</span>
                <span className="text-zinc-500 text-[11px] block mt-1">
                  Global Total Stock: {part?.stockQuantity ?? 0} units
                </span>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Target Branch Warehouse <span className="text-rose-500">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  >
                    <option value="PURCHASE">PURCHASE (Stock Intake)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
                    <option value="RETURN">RETURN (Return to Warehouse)</option>
                    <option value="ISSUE">ISSUE (Manual Deduction)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Audit Notes / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. OEM shipment receipt, annual physical count adjustment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111111] hover:bg-black text-[#F5A800] font-semibold transition-colors disabled:opacity-50"
                >
                  {adjustMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Record Stock Movement
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
