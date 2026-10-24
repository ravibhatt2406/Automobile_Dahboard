import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Branch } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { Plus, Edit, Eye, PowerOff, Download, Upload, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { BranchFormModal } from './BranchFormModal';
import { useNavigate } from 'react-router-dom';
import { csvDataService } from '@/services/csv-data.service';
import { CsvImportModal } from '@/components/forms/CsvImportModal';

export const BranchesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { permissions, activeRole } = useAuth();
  const canManage = permissions.canManageBranches;
  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      await csvDataService.exportData('branches');
    } catch (err: any) {
      setActionError(err.message || 'Failed to export branch data.');
    } finally {
      setExporting(false);
    }
  };

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => branchService.updateBranchStatus(id, 'INACTIVE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: any) => {
      setActionError(err?.message || 'Failed to deactivate branch.');
    },
  });

  const handleCreate = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeactivate = (branch: Branch) => {
    if (confirm(`Deactivate branch "${branch.name}"? This will disable operations at this location.`)) {
      deactivateMutation.mutate(branch.id);
    }
  };

  const handleFormSubmit = async (formData: Partial<Branch>) => {
    try {
      setActionError(null);
      if (editingBranch?.id) {
        await branchService.updateBranch(editingBranch.id, formData);
      } else {
        await branchService.createBranch(formData);
      }
      await refetch();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save branch.');
      throw err;
    }
  };

  const columns: Column<Branch>[] = [
    { header: 'Branch Code', accessorKey: 'code', className: 'font-mono text-xs font-semibold text-cyan-400' },
    { header: 'Branch Name', accessorKey: 'name' },
    { header: 'Franchise', accessorKey: 'franchiseName' },
    { header: 'City', accessorKey: 'city' },
    { header: 'State', accessorKey: 'state' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate(`/organization/branches/${row.id}`)}
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          {canManage && (
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {canManage && row.status !== 'INACTIVE' && row.status !== 'inactive' && (
            <button
              onClick={() => handleDeactivate(row)}
              disabled={deactivateMutation.isPending}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium disabled:opacity-50"
            >
              <PowerOff className="w-3.5 h-3.5" /> Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dealership Branches"
        subtitle="Locations, service hubs, and showroom facilities"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Branches' }]}
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
            {canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" /> Add Branch Location
              </button>
            )}
          </div>
        }
      />

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <DataTable<Branch>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No branches found"
        emptyDescription="No branch dealership records exist in the database."
        emptyActionLabel={canManage ? 'Register Branch Location' : undefined}
        onEmptyAction={canManage ? handleCreate : undefined}
      />

      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingBranch}
        onSubmit={handleFormSubmit}
      />

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="branches"
        title="Import Dealership Branches (CSV)"
        onImportComplete={() => refetch()}
      />
    </div>
  );
};
