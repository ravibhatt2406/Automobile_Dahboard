import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Lead } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { Plus, LayoutGrid, Table } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { VisualSalesPipeline } from './VisualSalesPipeline';
import { LeadFormModal } from './LeadFormModal';
import { useNavigate } from 'react-router-dom';

export const LeadsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => salesService.getLeads(),
  });

  const handleCreate = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const columns: Column<Lead>[] = [
    {
      header: 'Lead / Customer',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-100 block">{row.customerName}</span>
          <span className="text-xs text-slate-400">{row.companyName || '--'}</span>
        </div>
      ),
    },
    { header: 'Email', accessorKey: 'email', className: 'font-mono text-xs' },
    { header: 'Units Req.', accessorKey: 'estimatedUnits' },
    { header: 'Assigned Salesperson', accessorKey: 'assignedEmployeeName' },
    {
      header: 'Priority',
      cell: (row) => <StatusBadge status={row.priority} />,
    },
    {
      header: 'Pipeline Stage',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/crm/leads/${row.id}`)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="CRM & Commercial Lead Pipeline"
        subtitle="Lead opportunities, fleet requirement tracking, and pipeline progression"
        breadcrumbItems={[{ label: 'CRM' }, { label: 'Leads' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Pipeline Kanban View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" /> Table
              </button>
            </div>

            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Create Lead Opportunity
            </button>
          </div>
        }
      />

      {viewMode === 'pipeline' ? (
        <VisualSalesPipeline
          leads={data?.data || []}
          onSelectLead={(id) => navigate(`/crm/leads/${id}`)}
          onCreateLead={handleCreate}
        />
      ) : (
        <DataTable<Lead>
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          emptyTitle="No leads assigned to you"
          emptyDescription="There are no active lead records in the CRM sales pipeline."
          emptyActionLabel="Create Lead Opportunity"
          onEmptyAction={handleCreate}
        />
      )}

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingLead}
        onSubmit={(formData) => {
          console.log('Saved Lead Data:', formData);
          refetch();
        }}
      />
    </div>
  );
};
