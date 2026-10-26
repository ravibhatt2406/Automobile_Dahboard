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
    {
      header: 'Branch Code',
      accessorKey: 'code',
      className: 'font-mono text-xs font-bold text-zinc-900',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Branch Name',
      cell: (row) => <span className="font-semibold text-zinc-900">{row.name}</span>,
    },
    {
      header: 'Franchise',
      cell: (row) => <span className="text-zinc-700 font-medium">{row.franchiseName || '--'}</span>,
    },
    {
      header: 'City',
      cell: (row) => <span className="text-zinc-700">{row.city || '--'}</span>,
    },
    {
      header: 'State',
      cell: (row) => <span className="text-zinc-700">{row.state || '--'}</span>,
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
            onClick={() => navigate(`/organization/branches/${row.id}`)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          {canManage && (
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 font-semibold transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {canManage && row.status !== 'INACTIVE' && row.status !== 'inactive' && (
            <button
              onClick={() => handleDeactivate(row)}
              disabled={deactivateMutation.isPending}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold disabled:opacity-50 transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-800 hover:text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 shadow-2xs transition-colors"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-800 hover:text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                Import CSV
              </button>
            )}
            {canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Branch Location
              </button>
            )}
          </div>
        }
      />

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-2 font-bold hover:opacity-75">×</button>
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
