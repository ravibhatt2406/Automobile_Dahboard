import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Franchise } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { franchiseService } from '@/services/franchise.service';
import { Plus, Edit, Eye, Download, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { useScope } from '@/app/providers/ScopeContext';
import { FranchiseFormModal } from './FranchiseFormModal';
import { useNavigate } from 'react-router-dom';
import { csvDataService } from '@/services/csv-data.service';
import { CsvImportModal } from '@/components/forms/CsvImportModal';

export const FranchisesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const { selectedBranchId, selectedFranchiseId } = useScope();
  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['franchises'],
    queryFn: () => franchiseService.getFranchises(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Franchise>) => franchiseService.createFranchise(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      setFeedback({ type: 'success', message: `Franchise '${created.name}' (${created.code}) created successfully.` });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create franchise.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Franchise> }) =>
      franchiseService.updateFranchise(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      setFeedback({ type: 'success', message: `Franchise '${updated.name}' updated successfully.` });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update franchise.' });
    },
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      await csvDataService.exportData('franchises', {
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to export franchise data.');
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = () => {
    setEditingFranchise(null);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleEdit = (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: Partial<Franchise>) => {
    if (editingFranchise) {
      await updateMutation.mutateAsync({ id: editingFranchise.id, payload: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const columns: Column<Franchise>[] = [
    {
      header: 'Code',
      accessorKey: 'code',
      className: 'font-mono text-xs font-bold text-zinc-900',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Franchise Name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-zinc-900 block">{row.name}</span>
          {row.legalName && row.legalName !== row.name && (
            <span className="text-[11px] text-zinc-500 block font-normal">{row.legalName}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Brand License',
      cell: (row) => (
        <span className="text-zinc-800 font-medium">
          {row.brand || 'Commercial'}
        </span>
      ),
    },
    {
      header: 'Contact Email',
      cell: (row) => (
        <span className="font-mono text-xs text-zinc-700">
          {row.contactEmail || <span className="text-zinc-400 italic">Not configured</span>}
        </span>
      ),
    },
    {
      header: 'Branches',
      cell: (row) => {
        const count = Array.isArray(row.branches) ? row.branches.length : (row.totalBranches ?? 0);
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            {count} {count === 1 ? 'Location' : 'Locations'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate(`/organization/franchises/${row.id}`)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 font-semibold transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Commercial Franchises"
        subtitle="Manage regional automotive dealership franchises & brand licenses"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Franchises' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              id="btn-export-csv"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-800 hover:text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 shadow-xs transition-colors"
            >
              {exporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-600" />
              )}
              Export CSV
            </button>
            {isSuperAdmin && (
              <button
                id="btn-import-csv"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-800 hover:text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                Import CSV
              </button>
            )}
            {isSuperAdmin && (
              <button
                id="btn-create-franchise"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Franchise
              </button>
            )}
          </div>
        }
      />

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      <DataTable<Franchise>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No franchises found"
        emptyDescription="No franchise entities have been registered in the system."
        emptyActionLabel={isSuperAdmin ? 'Create First Franchise' : undefined}
        onEmptyAction={isSuperAdmin ? handleCreate : undefined}
      />

      <FranchiseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingFranchise}
        onSubmit={handleFormSubmit}
      />

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="franchises"
        title="Import Franchise Hubs (CSV)"
        onImportComplete={() => refetch()}
      />
    </div>
  );
};
