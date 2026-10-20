import React, { useState } from 'react';
import { X, FileCheck2, Loader2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceService, ComplianceDocType, VehicleComplianceDoc } from '@/services/compliance.service';
import { vehicleService } from '@/services/vehicle.service';

interface ComplianceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicleId?: string;
  documentToEdit?: VehicleComplianceDoc | null;
  onSuccess?: () => void;
}

const DOCUMENT_TYPES: { label: string; value: ComplianceDocType }[] = [
  { label: 'Pollution Under Control (PUC)', value: 'PUC' },
  { label: 'Commercial Fleet Insurance', value: 'INSURANCE' },
  { label: 'Fitness Certificate (Form 38)', value: 'FITNESS_CERTIFICATE' },
  { label: 'Commercial Road / Transport Permit', value: 'ROAD_PERMIT' },
  { label: 'Vehicle Registration Certificate (RC)', value: 'REGISTRATION_RC' },
  { label: 'Commercial Road Tax Certificate', value: 'ROAD_TAX' },
  { label: 'Other Statutory Compliance', value: 'OTHER' },
];

export const ComplianceDocumentModal: React.FC<ComplianceDocumentModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicleId,
  documentToEdit,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [vehicleId, setVehicleId] = useState(
    documentToEdit?.vehicleId || preselectedVehicleId || '',
  );
  const [documentType, setDocumentType] = useState<ComplianceDocType>(
    documentToEdit?.documentType || 'PUC',
  );
  const [documentNumber, setDocumentNumber] = useState(
    documentToEdit?.documentNumber || '',
  );
  const [issuingAuthority, setIssuingAuthority] = useState(
    documentToEdit?.issuingAuthority || '',
  );
  const [issueDate, setIssueDate] = useState(
    documentToEdit?.issueDate ? documentToEdit.issueDate.split('T')[0] : '',
  );
  const [expiryDate, setExpiryDate] = useState(
    documentToEdit?.expiryDate ? documentToEdit.expiryDate.split('T')[0] : '',
  );
  const [attachmentUrl, setAttachmentUrl] = useState(
    documentToEdit?.attachmentUrl || documentToEdit?.fileUrl || '',
  );
  const [notes, setNotes] = useState(documentToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load vehicles if not preselected
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles-for-compliance'],
    queryFn: () => vehicleService.getVehicles({ pageSize: 100 }),
    enabled: isOpen && !preselectedVehicleId,
  });

  const vehicles = vehiclesData?.data || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId) throw new Error('Please select a commercial vehicle asset');
      if (!documentNumber.trim()) throw new Error('Document / certificate reference number is required');

      if (documentToEdit?.id) {
        return complianceService.updateComplianceDoc(documentToEdit.id, {
          documentType,
          documentNumber: documentNumber.trim(),
          issuingAuthority: issuingAuthority.trim() || undefined,
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || undefined,
          attachmentUrl: attachmentUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }

      return complianceService.createComplianceDoc({
        vehicleId,
        documentType,
        documentNumber: documentNumber.trim(),
        issuingAuthority: issuingAuthority.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-docs'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || 'Failed to save compliance document');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-zinc-200 shadow-2xl my-8">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg text-[#F5A800]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">
                {documentToEdit ? 'Edit Compliance Document' : 'Register Vehicle Compliance Document'}
              </h3>
              <p className="text-xs text-zinc-500">
                Statutory certifications, PUC, fitness, permit & insurance tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            saveMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          {/* Vehicle Select (if not preselected) */}
          {!preselectedVehicleId && (
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Vehicle Asset (VIN / Reg Number) *
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono focus:border-zinc-900 focus:outline-hidden"
              >
                <option value="">Select vehicle asset...</option>
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.vin} {v.registrationNumber ? `(${v.registrationNumber})` : ''} — {v.variant?.name || 'Commercial Truck'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Compliance Document Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as ComplianceDocType)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-hidden font-medium"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Certificate / Document Number *
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. PUC-DL-2026-98124"
                required
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono focus:border-zinc-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Issuing Authority / Testing Agency
            </label>
            <input
              type="text"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="e.g. Delhi RTO / Transport Department / Authorized Testing Station"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono focus:border-zinc-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono focus:border-zinc-900 focus:outline-hidden"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Status automatically calculates: Valid, Expiring Soon (&lt;30 days), or Expired
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Document Attachment URL / File Path
            </label>
            <input
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="e.g. /uploads/compliance/puc_2026.pdf or secure URL"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono focus:border-zinc-900 focus:outline-hidden text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Annual commercial emission audit, test parameters normal"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-semibold shadow-xs transition-colors"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : documentToEdit ? (
                'Save Changes'
              ) : (
                'Save Compliance Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
