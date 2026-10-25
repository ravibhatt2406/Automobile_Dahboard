import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Calendar,
  Truck,
  User,
  History,
  Download,
  Upload,
  RefreshCw,
  Edit2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { InsurancePolicy } from '@/types/domain';
import { insuranceService } from '@/services/insurance.service';

interface PolicyDetailModalProps {
  policyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (policy: InsurancePolicy) => void;
  onOpenRenew: (policy: InsurancePolicy) => void;
  onRefresh: () => void;
}

export const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policyId,
  isOpen,
  onClose,
  onOpenEdit,
  onOpenRenew,
  onRefresh,
}) => {
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // File upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (policyId && isOpen) {
      loadPolicy();
    }
  }, [policyId, isOpen]);

  const loadPolicy = async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      const data = await insuranceService.getPolicyById(policyId);
      setPolicy(data);
      const hist = await insuranceService.getPolicyHistory(policyId);
      setHistory(hist);
    } catch {
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyId || !fileName.trim()) return;
    setUploading(true);
    try {
      await insuranceService.attachDocument(policyId, {
        filename: fileName.trim(),
        mimeType: 'application/pdf',
      });
      setUploadOpen(false);
      setFileName('');
      loadPolicy();
      onRefresh();
    } catch {
      // Ignored
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !policyId) return null;

  const isExpiringSoon = policy?.isExpiringSoon || (
    policy?.expiryDate &&
    new Date(policy.expiryDate).getTime() - Date.now() < 30 * 24 * 3600 * 1000 &&
    new Date(policy.expiryDate).getTime() > Date.now()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#F5A800] uppercase tracking-wider">
                {policy?.insurer || policy?.provider || 'Fleet Insurer'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  policy?.status === 'ACTIVE'
                    ? isExpiringSoon
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {isExpiringSoon ? 'Expiring Soon' : policy?.status || 'Active'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mt-0.5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {policy?.policyNumber || 'Commercial Insurance Policy'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-zinc-100 text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 gap-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Policy Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <History className="w-4 h-4" /> Change Log & Renewals ({history.length})
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 font-mono text-xs">
            Loading policy record from PostgreSQL...
          </div>
        ) : !policy ? (
          <div className="py-8 text-center text-rose-500 text-xs">Policy not found or access denied.</div>
        ) : activeTab === 'details' ? (
          <div className="space-y-4 text-xs">
            {/* Core Coverage Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Annual Premium</span>
                <span className="text-base font-bold text-zinc-900 font-mono">
                  ₹{Number(policy.premium || policy.premiumAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Coverage Type</span>
                <span className="text-xs font-bold text-zinc-800">
                  {policy.policyType || policy.type || 'Comprehensive'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Term Start</span>
                <span className="text-xs font-semibold text-zinc-800 font-mono">
                  {policy.startDate ? new Date(policy.startDate).toLocaleDateString() : '--'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Term Expiry</span>
                <span className={`text-xs font-bold font-mono ${isExpiringSoon ? 'text-amber-600' : 'text-zinc-900'}`}>
                  {policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString() : '--'}
                </span>
              </div>
            </div>

            {/* Customer & Vehicle Scope */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase font-mono text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-600" /> Customer Account
                </span>
                <div className="font-bold text-zinc-900 text-sm">
                  {policy.customer?.name || policy.customerName || 'Fleet Operator'}
                </div>
                <div className="text-zinc-500 font-mono text-[11px]">{policy.customer?.phone || 'No phone recorded'}</div>
                <div className="text-zinc-500 text-[11px]">{policy.customer?.email || ''}</div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase font-mono text-zinc-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-zinc-600" /> Insured Vehicle
                </span>
                <div className="font-bold text-zinc-900 text-sm font-mono">
                  {policy.vehicle?.vin || policy.booking?.vehicle?.vin || policy.vehicleVin || 'Fleet Deal Vehicle'}
                </div>
                <div className="text-zinc-600 font-mono text-[11px]">
                  Reg: {policy.vehicle?.registrationNumber || policy.booking?.vehicle?.registrationNumber || 'In Deal Allotment'}
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Variant: {policy.vehicle?.variant?.name || policy.booking?.quotation?.variant?.name || 'Heavy Commercial Vehicle'}
                </div>
                <div className="text-zinc-500 text-[11px] flex items-center gap-1">
                  <Building className="w-3 h-3 text-zinc-400" />
                  Branch: {policy.vehicle?.branch?.name || policy.booking?.branch?.name || 'Dealership Hub'}
                </div>
              </div>
            </div>

            {/* Coverage Details & Notes */}
            <div className="space-y-2">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-bold uppercase font-mono text-zinc-400 block mb-1">
                  Coverage Details & Endorsements
                </span>
                <p className="text-zinc-700 whitespace-pre-wrap">
                  {policy.coverageDetails || 'Zero bumper-to-bumper depreciation, engine & gearbox protection, third-party liability coverage.'}
                </p>
              </div>

              {policy.notes && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="text-[10px] font-bold uppercase font-mono text-zinc-400 block mb-1">
                    Internal Dealership Notes
                  </span>
                  <p className="text-zinc-600 whitespace-pre-wrap">{policy.notes}</p>
                </div>
              )}
            </div>

            {/* Document / Certificate Attachment */}
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase font-mono text-zinc-400 block">
                  Supporting Policy Certificate
                </span>
                <span className="font-mono text-zinc-800 text-xs">
                  {policy.documentKey || 'No uploaded document attached yet'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUploadOpen(!uploadOpen)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 flex items-center gap-1 font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>
            </div>

            {uploadOpen && (
              <form onSubmit={handleAttachFile} className="p-3 bg-zinc-100 rounded-xl border border-zinc-300 space-y-2">
                <label className="block text-zinc-700 font-semibold text-[11px]">Document Name or Storage Reference</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. policy_certificate_2026.pdf"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-hidden"
                    required
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-xs font-semibold"
                  >
                    {uploading ? 'Saving...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-mono">
                No change logs recorded yet for this policy.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((log) => (
                  <div key={log.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900">{log.action}</span>
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      User: {log.actorUser?.email || log.actorUserId || 'System'}
                    </div>
                    {log.metadata && (
                      <pre className="p-2 bg-zinc-100 rounded text-[10px] text-zinc-700 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="text-[10px] text-zinc-400 font-mono">
            Recorded in PostgreSQL Insurance Ledger
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (policy) onOpenRenew(policy);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center gap-1.5 transition-colors text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Record Renewal</span>
            </button>
            <button
              onClick={() => {
                if (policy) onOpenEdit(policy);
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-800 hover:bg-zinc-50 font-bold flex items-center gap-1.5 transition-colors text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Permitted</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-900 text-[#F5A800] rounded-lg font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
