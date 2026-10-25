import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, Calendar, DollarSign, FileText } from 'lucide-react';
import { InsurancePolicy } from '@/types/domain';
import { insuranceService } from '@/services/insurance.service';

interface PolicyRenewModalProps {
  policy: InsurancePolicy | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PolicyRenewModal: React.FC<PolicyRenewModalProps> = ({
  policy,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !policy) return null;

  const currentExpiry = policy.expiryDate ? new Date(policy.expiryDate) : new Date();
  const defaultStart = new Date(currentExpiry.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  const defaultExpiry = new Date(currentExpiry.getTime() + 366 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [newStartDate, setNewStartDate] = useState(defaultStart);
  const [newExpiryDate, setNewExpiryDate] = useState(defaultExpiry);
  const [newPremium, setNewPremium] = useState<number>(policy.premium || policy.premiumAmount || 45000);
  const [newPolicyNumber, setNewPolicyNumber] = useState(`${policy.policyNumber}-R1`);
  const [insurer, setInsurer] = useState(policy.insurer || policy.provider || 'ICICI Lombard Commercial');
  const [notes, setNotes] = useState('Annual fleet insurance policy renewal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(newExpiryDate) <= new Date(newStartDate)) {
      setError('Renewal expiry date must be strictly after the start date.');
      return;
    }
    if (newPremium <= 0) {
      setError('Renewal premium must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      await insuranceService.renewPolicy(policy.id, {
        newStartDate: new Date(newStartDate).toISOString(),
        newExpiryDate: new Date(newExpiryDate).toISOString(),
        newPremium: Number(newPremium),
        newPolicyNumber: newPolicyNumber.trim() || undefined,
        insurer: insurer.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record policy renewal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-zinc-900 text-sm">
              Record Insurance Policy Renewal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-zinc-100 text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono">
          <div className="flex justify-between text-zinc-500">
            <span>Existing Policy #:</span>
            <span className="font-bold text-zinc-800">{policy.policyNumber}</span>
          </div>
          <div className="flex justify-between text-zinc-500 mt-1">
            <span>Current Term Expiry:</span>
            <span className="font-semibold text-rose-600">
              {policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString() : '--'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRenew} className="space-y-3 text-xs">
          <div>
            <label className="block text-zinc-600 mb-1 font-semibold">New Policy / Endorsement Number</label>
            <input
              type="text"
              value={newPolicyNumber}
              onChange={(e) => setNewPolicyNumber(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-zinc-300 font-mono focus:border-zinc-900 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-600 mb-1 font-semibold">Underwriting Insurer</label>
            <input
              type="text"
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">Renewal Start Date</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 font-semibold">Renewal Expiry Date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 mb-1 font-semibold">Renewal Premium (₹)</label>
            <input
              type="number"
              min={1}
              value={newPremium}
              onChange={(e) => setNewPremium(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg border border-zinc-300 font-mono focus:border-zinc-900 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-600 mb-1 font-semibold">Renewal Endorsement Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record insurer renewal terms and receipt confirmation..."
              className="w-full p-2.5 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-[#F5A800] font-bold flex items-center gap-1.5"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Recording Renewal...' : 'Confirm Renewal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
