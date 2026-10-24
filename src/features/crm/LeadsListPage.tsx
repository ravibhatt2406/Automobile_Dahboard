import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Lead } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { crmService } from '@/services/crm.service';
import {
  Plus,
  LayoutGrid,
  Table,
  Target,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Phone,
  Mail,
} from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { VisualSalesPipeline } from './VisualSalesPipeline';
import { LeadFormModal } from './LeadFormModal';
import { useNavigate } from 'react-router-dom';
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

type CrmView = 'ALL' | 'MY_LEADS' | 'FOLLOW_UPS_DUE' | 'QUALIFIED' | 'WON' | 'LOST';

export const LeadsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, selectedFranchiseId, activeBranchName, activeFranchiseName } = useScope();

  const [activeTab, setActiveTab] = useState<CrmView>('ALL');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'crm-leads',
      activeTab,
      selectedBranchId,
      selectedFranchiseId,
      search,
      selectedStatus,
      selectedSource,
      startDate,
      endDate,
    ],
    queryFn: () =>
      crmService.getLeads({
        view: activeTab,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        search: search || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        source: selectedSource !== 'ALL' ? selectedSource : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const leads = data?.data || [];

  const handleCreate = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < Date.now();
  };

  const tabs: Array<{ id: CrmView; label: string; icon: any }> = [
    { id: 'ALL', label: 'All Leads', icon: Target },
    { id: 'MY_LEADS', label: 'My Leads', icon: UserCheck },
    { id: 'FOLLOW_UPS_DUE', label: 'Follow-ups Due', icon: Clock },
    { id: 'QUALIFIED', label: 'Qualified Leads', icon: CheckCircle2 },
    { id: 'WON', label: 'Won', icon: CheckCircle2 },
    { id: 'LOST', label: 'Lost', icon: XCircle },
  ];

  const columns: Column<Lead>[] = [
    {
      header: 'Reference / Lead',
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-zinc-900">
              {row.leadNumber || `LD-${row.id.slice(0, 8).toUpperCase()}`}
            </span>
            {!row.customerId && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Prospect
              </span>
            )}
          </div>
          <span className="font-semibold text-zinc-900 block text-xs mt-0.5">
            {row.customer?.companyName || row.companyName || row.customer?.name || row.prospectName || row.customerName || 'Prospect'}
          </span>
          <span className="text-[11px] text-zinc-500 block truncate max-w-[160px]">
            Contact: {row.customer?.name || row.prospectName || row.customerName || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-zinc-800 font-mono">
            <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>{row.customer?.phone || row.prospectPhone || row.phone || '—'}</span>
          </div>
          {(row.customer?.email || row.prospectEmail || row.email) && (
            <div className="flex items-center gap-1 text-zinc-500 text-[11px]">
              <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[140px]">
                {row.customer?.email || row.prospectEmail || row.email}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Model & Budget',
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-zinc-900 block truncate max-w-[180px]">
            {row.interestedModel || 'Commercial Vehicle'}
          </span>
          <span className="font-mono text-xs font-bold text-zinc-800 block">
            {row.expectedBudget ? `₹${Number(row.expectedBudget).toLocaleString()}` : 'Negotiable'}
          </span>
        </div>
      ),
    },
    {
      header: 'Source & Branch',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-medium text-zinc-800 block">{row.source || 'DIRECT_WALKIN'}</span>
          <span className="text-[11px] text-zinc-500 block">{row.branch?.name || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Salesperson',
      cell: (row) => {
        const emp = row.assignedEmployee;
        const name = emp ? `${emp.firstName} ${emp.lastName}` : (row.assignedEmployeeName || 'Unassigned');
        return (
          <span className={`text-xs ${emp ? 'font-medium text-zinc-800' : 'italic text-zinc-400'}`}>
            {name}
          </span>
        );
      },
    },
    {
      header: 'Follow-up Date',
      cell: (row) => {
        if (!row.nextFollowUpDate) {
          return <span className="text-xs text-zinc-400 italic">None scheduled</span>;
        }
        const overdue = isOverdue(row.nextFollowUpDate);
        return (
          <div className="space-y-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                overdue
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-zinc-100 text-zinc-800'
              }`}
            >
              {overdue && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
              {new Date(row.nextFollowUpDate).toLocaleDateString()}
            </span>
            {overdue && (
              <span className="block text-[10px] font-bold text-rose-600">Overdue</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Stage',
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          <div>
            <StatusBadge status={row.priority || 'MEDIUM'} />
          </div>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/crm/leads/${row.id}`)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold transition-colors shadow-xs"
        >
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Commercial Leads"
        subtitle={`Dealership opportunities for ${activeFranchiseName} • ${activeBranchName}`}
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
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Lead Opportunity
            </button>
          </div>
        }
      />

      {/* CRM Views Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#F5A800] text-black">
                  {leads.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <BranchFilterBar
        searchPlaceholder="Search reference, name, phone, email or model..."
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={[
          { label: 'All Stages', value: 'ALL' },
          { label: 'New', value: 'NEW' },
          { label: 'Contacted', value: 'CONTACTED' },
          { label: 'Qualified', value: 'QUALIFIED' },
          { label: 'Test Drive / Demo', value: 'PROPOSAL' },
          { label: 'Negotiation', value: 'NEGOTIATION' },
          { label: 'Won (Converted)', value: 'CONVERTED' },
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
          setSelectedSource('ALL');
          setStartDate('');
          setEndDate('');
        }}
      />

      {viewMode === 'pipeline' ? (
        <VisualSalesPipeline
          leads={leads}
          onSelectLead={(id) => navigate(`/crm/leads/${id}`)}
          onCreateLead={handleCreate}
        />
      ) : (
        <DataTable<Lead>
          columns={columns}
          data={leads}
          isLoading={isLoading}
          emptyTitle="No commercial leads found"
          emptyDescription={`There are no leads matching "${activeTab.replace('_', ' ')}" in the current filter scope.`}
          emptyActionLabel="Create Lead Opportunity"
          onEmptyAction={handleCreate}
        />
      )}

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingLead}
        onSuccess={() => refetch()}
        activeBranchId={selectedBranchId}
      />
    </div>
  );
};
