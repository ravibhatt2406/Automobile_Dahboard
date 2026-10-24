import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Franchise } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { franchiseService } from '@/services/franchise.service';
import { Plus, Edit, Eye, Download, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { FranchiseFormModal } from './FranchiseFormModal';
import { useNavigate } from 'react-router-dom';
import { csvDataService } from '@/services/csv-data.service';
import { CsvImportModal } from '@/components/forms/CsvImportModal';

export const FranchisesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
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
      await csvDataService.exportData('franchises');
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
      className: 'font-mono text-xs font-semibold text-blue-400',
    },
    {
      header: 'Franchise Name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-100 block">{row.name}</span>
          {row.legalName && row.legalName !== row.name && (
            <span className="text-[11px] text-slate-400 block">{row.legalName}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Brand License',
      cell: (row) => (
        <span className="text-slate-300 font-medium">
          {row.brand || 'Commercial'}
        </span>
      ),
    },
    {
      header: 'Contact Email',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.contactEmail || <span className="text-slate-500 italic">Not configured</span>}
        </span>
      ),
    },
    {
      header: 'Branches',
      cell: (row) => {
        const count = Array.isArray(row.branches) ? row.branches.length : (row.totalBranches ?? 0);
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-blue-300 border border-slate-700">
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
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
            >
              {exporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-400" />
              )}
              Export CSV
            </button>
            {isSuperAdmin && (
              <button
                id="btn-import-csv"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Import CSV
              </button>
            )}
            {isSuperAdmin && (
              <button
                id="btn-create-franchise"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
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
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
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
