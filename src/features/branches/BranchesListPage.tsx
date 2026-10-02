import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Branch } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { Plus, Edit, Eye } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { BranchFormModal } from './BranchFormModal';
import { useNavigate } from 'react-router-dom';

export const BranchesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canManage = permissions.canManageBranches;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });

  const handleCreate = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const columns: Column<Branch>[] = [
    { header: 'Branch Code', accessorKey: 'code', className: 'font-mono text-xs font-semibold text-cyan-400' },
    { header: 'Branch Name', accessorKey: 'name' },
    { header: 'Franchise', accessorKey: 'franchiseName' },
    { header: 'City', accessorKey: 'city' },
    { header: 'Phone', accessorKey: 'phone' },
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dealership Branches"
        subtitle="Locations, service hubs, and showroom facilities"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Branches' }]}
        actions={
          canManage ? (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Add Branch Location
            </button>
          ) : undefined
        }
      />

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
        onSubmit={async (formData) => {
          try {
            await branchService.createBranch(formData);
            await refetch();
          } catch (err) {
            console.error('Error saving branch:', err);
          }
        }}
      />
    </div>
  );
};
