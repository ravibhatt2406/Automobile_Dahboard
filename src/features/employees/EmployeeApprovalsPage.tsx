import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Check, X, Clock } from 'lucide-react';
import { ROLE_LABELS, UserRole } from '@/types/roles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, ApprovalRequest } from '@/services/employee.service';

export const EmployeeApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const { data: approvalsList = [], isLoading } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: () => employeeService.getPendingApprovals(),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action, comments }: { id: string; action: 'APPROVED' | 'REJECTED'; comments?: string }) =>
      employeeService.processApproval(id, action, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    processMutation.mutate({ id, action: newStatus });
  };

  const filteredApprovals = approvalsList.filter((item) => {
    if (activeTab === 'PENDING') return item.status === 'PENDING';
    if (activeTab === 'APPROVED') return item.status === 'APPROVED';
    return item.status === 'REJECTED';
  });

  const columns: Column<ApprovalRequest>[] = [
    {
      header: 'Requester Name',
      cell: (row) => (
        <span className="font-semibold text-slate-100">
          {row.requester?.firstName} {row.requester?.lastName} ({row.requester?.email || 'N/A'})
        </span>
      ),
    },
    {
      header: 'Request Type',
      cell: (row) => (
        <span className="font-mono text-xs text-blue-400 font-medium">
          {row.requestType}
        </span>
      ),
    },
    {
      header: 'Target Role / Details',
      cell: (row) => (
        <span className="text-xs text-slate-300">
          {row.details?.roleName
            ? ROLE_LABELS[row.details.roleName as UserRole] || row.details.roleName
            : JSON.stringify(row.details || {})}
        </span>
      ),
    },
    {
      header: 'Date Created',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status.toLowerCase() as any} />,
    },
    {
      header: 'Decision Actions',
      cell: (row) =>
        row.status === 'PENDING' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction(row.id, 'APPROVED')}
              disabled={processMutation.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => handleAction(row.id, 'REJECTED')}
              disabled={processMutation.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-mono">Decision Finalized</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Role Approval Center"
        subtitle="Review, approve, or reject requested employee role escalations and branch assignments"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Approvals' }]}
      />

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'PENDING'
              ? 'bg-blue-600 text-white font-semibold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Approvals ({approvalsList.filter((i) => i.status === 'PENDING').length})
        </button>

        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'APPROVED'
              ? 'bg-emerald-600 text-white font-semibold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Check className="w-3.5 h-3.5" /> Approved ({approvalsList.filter((i) => i.status === 'APPROVED').length})
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'REJECTED'
              ? 'bg-rose-600 text-white font-semibold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <X className="w-3.5 h-3.5" /> Rejected ({approvalsList.filter((i) => i.status === 'REJECTED').length})
        </button>
      </div>

      <DataTable<ApprovalRequest>
        columns={columns}
        data={filteredApprovals}
        isLoading={isLoading}
        emptyTitle={`No ${activeTab.toLowerCase()} role approval requests`}
        emptyDescription={`There are currently no employee role requests in ${activeTab.toLowerCase()} state.`}
      />
    </div>
  );
};
