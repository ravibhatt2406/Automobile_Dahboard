import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Franchise } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { franchiseService } from '@/services/franchise.service';
import { Plus, Edit, Eye } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { FranchiseFormModal } from './FranchiseFormModal';
import { useNavigate } from 'react-router-dom';

export const FranchisesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['franchises'],
    queryFn: () => franchiseService.getFranchises(),
  });

  const handleCreate = () => {
    setEditingFranchise(null);
    setIsModalOpen(true);
  };

  const handleEdit = (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setIsModalOpen(true);
  };

  const columns: Column<Franchise>[] = [
    { header: 'Code', accessorKey: 'code', className: 'font-mono text-xs font-semibold text-blue-400' },
    { header: 'Franchise Name', accessorKey: 'name' },
    { header: 'Brand License', accessorKey: 'brand' },
    { header: 'Contact Email', accessorKey: 'contactEmail', className: 'font-mono text-xs' },
    { header: 'Branches', accessorKey: 'totalBranches' },
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
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          {isSuperAdmin && (
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
        title="Commercial Franchises"
        subtitle="Manage regional automotive dealership franchises & brand licenses"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Franchises' }]}
        actions={
          isSuperAdmin ? (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Create Franchise
            </button>
          ) : undefined
        }
      />

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
        onSubmit={(formData) => {
          console.log('Saved Franchise Data:', formData);
          refetch();
        }}
      />
    </div>
  );
};
