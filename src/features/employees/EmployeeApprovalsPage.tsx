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

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: approvalsList = [], isLoading } = useQuery({
    queryKey: ['allApprovals'],
    queryFn: () => employeeService.getAllApprovals(),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action, comments }: { id: string; action: 'APPROVED' | 'REJECTED'; comments?: string }) =>
      employeeService.processApproval(id, action, comments),
    onSuccess: (_, variables) => {
      setActionError(null);
      setActionSuccess(`Employee request successfully ${variables.action === 'APPROVED' ? 'approved' : 'rejected'}.`);
      queryClient.invalidateQueries({ queryKey: ['allApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      setActionSuccess(null);
      setActionError(err?.message || 'Failed to process approval request. Ensure you have the required managerial role.');
    },
  });

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    processMutation.mutate({ id, action: newStatus });
  };

  const filteredApprovals = approvalsList.filter((item) => {
    if (activeTab === 'PENDING') return item.status === 'PENDING';
    if (activeTab === 'APPROVED') return item.status === 'APPROVED';
    return item.status === 'REJECTED';
  });

  const columns: Column<ApprovalRequest>[] = [
    {
      header: 'Employee Personnel',
      cell: (row) => {
        const emp = row.employee;
        const name = emp
          ? `${emp.firstName} ${emp.lastName}`
          : row.requester
          ? `${row.requester.firstName || ''} ${row.requester.lastName || ''}`.trim()
          : 'N/A';
        const email = emp?.user?.email || row.requester?.email || 'N/A';
        const code = emp?.employeeCode;
        return (
          <div>
            <span className="font-semibold text-zinc-900 block">{name}</span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {code ? `${code} • ` : ''}
              {email}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Branch Location',
      cell: (row) => (
        <span className="text-xs text-zinc-800 font-medium">
          {row.employee?.branch?.name || 'Jaipur Branch'}
        </span>
      ),
    },
    {
      header: 'Assigned Role',
      cell: (row) => {
        const role = row.assignedRole?.name || row.details?.roleName || 'EMPLOYEE';
        return (
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-semibold">
            {ROLE_LABELS[role as UserRole] || role}
          </span>
        );
      },
    },
    {
      header: 'Submitted Date',
      cell: (row) => (
        <span className="font-mono text-xs text-zinc-600">
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
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Approve
            </button>
            <button
              onClick={() => handleAction(row.id, 'REJECTED')}
              disabled={processMutation.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" /> Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-500 font-mono font-medium">
            {row.status === 'APPROVED' ? 'Approved' : 'Rejected'}
          </span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Role Approval Center"
        subtitle="Review, approve, or reject requested employee onboarding requests and role assignments"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Approvals' }]}
      />

      {actionError && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

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
