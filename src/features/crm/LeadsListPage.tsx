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
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

export const LeadsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();

  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'leads',
      selectedBranchId,
      selectedFranchiseId,
      search,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: () =>
      salesService.getLeads({
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        search: search || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
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
          <span className="font-semibold text-zinc-900 block">{row.customerName}</span>
          <span className="text-xs text-zinc-500">{row.companyName || '--'}</span>
        </div>
      ),
    },
    { header: 'Email', accessorKey: 'email', className: 'font-mono text-xs text-zinc-600' },
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
          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Commercial Lead Pipeline"
        subtitle={`Lead opportunities for ${activeFranchiseName} • ${activeBranchName}`}
        breadcrumbItems={[{ label: 'CRM' }, { label: 'Leads' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Pipeline Kanban View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" /> Table
              </button>
            </div>

            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Lead Opportunity
            </button>
          </div>
        }
      />

      <BranchFilterBar
        searchPlaceholder="Search customer, company or email..."
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={[
          { label: 'All Stages', value: 'ALL' },
          { label: 'New', value: 'NEW' },
          { label: 'Contacted', value: 'CONTACTED' },
          { label: 'Qualified', value: 'QUALIFIED' },
          { label: 'Proposal Sent', value: 'PROPOSAL_SENT' },
          { label: 'Negotiating', value: 'NEGOTIATING' },
          { label: 'Won', value: 'WON' },
          { label: 'Lost', value: 'LOST' },
        ]}
        showDateRange={true}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        onReset={() => {
          setSearch('');
          setSelectedStatus('ALL');
          setStartDate('');
          setEndDate('');
        }}
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
          emptyTitle="No leads found"
          emptyDescription="There are no active lead records matching your active branch and filter criteria."
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
