import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  complianceService,
  VehicleComplianceDoc,
  ComplianceDocType,
  ComplianceDocStatus,
} from '@/services/compliance.service';
import { useAuth } from '@/app/providers/AuthContext';
import { useScope } from '@/app/providers/ScopeContext';
import {
  FileCheck,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
  Edit,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Calendar,
  X,
} from 'lucide-react';
import { ComplianceDocumentModal } from './ComplianceDocumentModal';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

interface ComplianceTabContentProps {
  vehicleId?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  PUC: 'Pollution Under Control (PUC)',
  INSURANCE: 'Commercial Insurance',
  FITNESS_CERTIFICATE: 'Fitness Certificate (Form 38)',
  ROAD_PERMIT: 'Commercial Road Permit',
  REGISTRATION_RC: 'Registration Certificate (RC)',
  ROAD_TAX: 'Road Tax Certificate',
  OTHER: 'Statutory Compliance',
};

export const ComplianceTabContent: React.FC<ComplianceTabContentProps> = ({ vehicleId }) => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const { selectedBranchId, selectedFranchiseId } = useScope();

  const isCustomer = activeRole === 'CUSTOMER';
  const canManage = ['SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SERVICE_ADVISOR', 'SALES_EMPLOYEE'].includes(
    activeRole || '',
  ) || isCustomer;

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expiryBefore, setExpiryBefore] = useState('');
  const [expiryAfter, setExpiryAfter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<VehicleComplianceDoc | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<VehicleComplianceDoc | null>(null);

  // Queries
  const {
    data: docsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'compliance-docs',
      vehicleId,
      selectedBranchId,
      selectedFranchiseId,
      selectedType,
      selectedStatus,
      search,
      expiryBefore,
      expiryAfter,
    ],
    queryFn: () =>
      complianceService.getComplianceDocuments({
        vehicleId,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        documentType: selectedType !== 'ALL' ? selectedType : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: search || undefined,
        expiryBefore: expiryBefore || undefined,
        expiryAfter: expiryAfter || undefined,
      }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['compliance-summary', selectedBranchId, selectedFranchiseId],
    queryFn: () =>
      complianceService.getSummary(
        selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      ),
    enabled: !vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => complianceService.deleteComplianceDoc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-docs'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary'] });
    },
  });

  const docs = docsData?.items || [];
  const totalCount = docsData?.total ?? docs.length;

  // Local summary calculation if scoped to vehicleId
  const validCount = vehicleId
    ? docs.filter((d) => d.computedStatus === 'VALID').length
    : summaryData?.valid ?? docs.filter((d) => d.computedStatus === 'VALID').length;

  const expiringSoonCount = vehicleId
    ? docs.filter((d) => d.computedStatus === 'EXPIRING_SOON').length
    : summaryData?.expiringSoon ?? docs.filter((d) => d.computedStatus === 'EXPIRING_SOON').length;

  const expiredCount = vehicleId
    ? docs.filter((d) => d.computedStatus === 'EXPIRED').length
    : summaryData?.expired ?? docs.filter((d) => d.computedStatus === 'EXPIRED').length;

  const formatDaysRemaining = (expiryDate?: string | null) => {
    if (!expiryDate) return null;
    const now = new Date().getTime();
    const exp = new Date(expiryDate).getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-rose-600 font-semibold">
          Expired {Math.abs(diffDays)} day{Math.abs(diffDays) === 1 ? '' : 's'} ago
        </span>
      );
    }
    if (diffDays === 0) {
      return <span className="text-amber-600 font-semibold">Expires today</span>;
    }
    if (diffDays <= 30) {
      return (
        <span className="text-amber-600 font-semibold">
          Expires in {diffDays} day{diffDays === 1 ? '' : 's'}
        </span>
      );
    }
    return <span className="text-zinc-500 font-mono">Expires in {diffDays} days</span>;
  };

  const getStatusBadge = (status: ComplianceDocStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Valid
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Expiring Soon
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-500" /> Total Monitored Records
          </span>
          <span className="text-2xl font-bold font-mono text-zinc-900 block">{totalCount}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fully Compliant
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-600 block">{validCount}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Expiring Soon (&lt;30d)
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 block">{expiringSoonCount}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Expired (Attention)
          </span>
          <span className="text-2xl font-bold font-mono text-rose-600 block">{expiredCount}</span>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Document #, Authority, VIN or RC..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:bg-white focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => {
                  setEditingDoc(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Register Compliance Doc
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges & Date Pickers */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] font-medium">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-hidden"
            >
              <option value="ALL">All Statutory Types</option>
              <option value="PUC">Pollution Under Control (PUC)</option>
              <option value="INSURANCE">Commercial Insurance</option>
              <option value="FITNESS_CERTIFICATE">Fitness Certificate</option>
              <option value="ROAD_PERMIT">Road Permit</option>
              <option value="REGISTRATION_RC">Registration Certificate (RC)</option>
              <option value="ROAD_TAX">Road Tax</option>
              <option value="OTHER">Other Compliance</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-hidden"
            >
              <option value="ALL">All Expiry Statuses</option>
              <option value="VALID">Valid</option>
              <option value="EXPIRING_SOON">Expiring Soon (&lt;30d)</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] font-medium">Expiry Before:</span>
            <input
              type="date"
              value={expiryBefore}
              onChange={(e) => setExpiryBefore(e.target.value)}
              className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-hidden"
            />
          </div>

          {(search || selectedType !== 'ALL' || selectedStatus !== 'ALL' || expiryBefore || expiryAfter) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('ALL');
                setSelectedStatus('ALL');
                setExpiryBefore('');
                setExpiryAfter('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState label="Loading compliance documents from database..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Compliance Records"
          message={(error as any)?.message || 'Database connection error'}
          onRetry={() => refetch()}
        />
      ) : docs.length === 0 ? (
        <EmptyState
          title="No Compliance Records Found"
          description="No statutory compliance documents match the selected filters or branch criteria."
          actionLabel={canManage ? '+ Register Compliance Record' : undefined}
          onAction={
            canManage
              ? () => {
                  setEditingDoc(null);
                  setIsModalOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc) => {
            const isExpiring = doc.computedStatus === 'EXPIRING_SOON';
            const isExpired = doc.computedStatus === 'EXPIRED';

            return (
              <div
                key={doc.id}
                className={`p-5 bg-white rounded-xl border transition-all shadow-xs space-y-3.5 ${
                  isExpired
                    ? 'border-rose-300 bg-rose-50/20'
                    : isExpiring
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#F5A800] uppercase tracking-wider block">
                      {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                    <h4 className="text-base font-bold font-mono text-zinc-900 mt-0.5">
                      {doc.documentNumber}
                    </h4>
                    {doc.issuingAuthority && (
                      <p className="text-xs text-zinc-500">{doc.issuingAuthority}</p>
                    )}
                  </div>
                  <div>{getStatusBadge(doc.computedStatus)}</div>
                </div>

                {/* Vehicle & Customer Context */}
                <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Vehicle VIN:</span>
                    <span className="font-semibold text-zinc-800 truncate block">
                      {doc.vehicle?.vin || '—'}
                    </span>
                    {doc.vehicle?.registrationNumber && (
                      <span className="text-[10px] text-zinc-500 block">
                        RC: {doc.vehicle.registrationNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px]">Model Asset:</span>
                    <span className="font-semibold text-zinc-800 truncate block">
                      {doc.vehicle?.variant?.name || 'Commercial Vehicle'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px]">Issue Date:</span>
                    <span className="font-medium text-zinc-700">
                      {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px]">Expiry Date:</span>
                    <span className="font-bold text-zinc-900 block">
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}
                    </span>
                    <span className="text-[10px] block font-sans">
                      {formatDaysRemaining(doc.expiryDate)}
                    </span>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-xs text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded border border-zinc-100">
                    <span className="font-semibold">Notes:</span> {doc.notes}
                  </p>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="text-[11px] text-zinc-400">
                    {doc.vehicle?.branch?.name ? `Branch: ${doc.vehicle.branch.name}` : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 rounded-md transition-colors"
                          title="Edit Document"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete compliance record ${doc.documentNumber}?`)) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedDocPreview(doc)}
                      className="px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Certificate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing */}
      <ComplianceDocumentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDoc(null);
        }}
        preselectedVehicleId={vehicleId}
        documentToEdit={editingDoc}
      />

      {/* Certificate Viewer Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F5A800]" />
                {DOC_TYPE_LABELS[selectedDocPreview.documentType] || selectedDocPreview.documentType}
              </h3>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="p-1 rounded bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono space-y-2.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Document Number:</span>
                <span className="font-bold text-zinc-900">{selectedDocPreview.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Issuing Authority:</span>
                <span className="font-semibold text-zinc-800">
                  {selectedDocPreview.issuingAuthority || 'Ministry of Road Transport & Highways'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vehicle VIN:</span>
                <span className="font-semibold text-zinc-800">{selectedDocPreview.vehicle?.vin || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Issue Date:</span>
                <span className="font-semibold text-zinc-800">
                  {selectedDocPreview.issueDate ? new Date(selectedDocPreview.issueDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Expiry Date:</span>
                <span className="font-bold text-zinc-900">
                  {selectedDocPreview.expiryDate ? new Date(selectedDocPreview.expiryDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Compliance Status:</span>
                <span>{getStatusBadge(selectedDocPreview.computedStatus)}</span>
              </div>
              {selectedDocPreview.attachmentUrl && (
                <div className="pt-2 border-t border-zinc-200">
                  <span className="text-zinc-400 block mb-1">Document Attachment:</span>
                  <a
                    href={selectedDocPreview.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Document File <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 bg-[#111111] text-[#F5A800] rounded-lg font-semibold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
