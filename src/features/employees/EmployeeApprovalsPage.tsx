import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { EmployeeApproval } from '@/types/domain';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ShieldCheck, Check, X, Clock } from 'lucide-react';
import { ROLE_LABELS, UserRole } from '@/types/roles';

export const EmployeeApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [approvalsList, setApprovalsList] = useState<EmployeeApproval[]>([]);

  const filteredApprovals = approvalsList.filter((item) => item.status === activeTab);

  const handleAction = (id: string, newStatus: 'approved' | 'rejected') => {
    setApprovalsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const columns: Column<EmployeeApproval>[] = [
    { header: 'Employee Name', accessorKey: 'employeeName', className: 'font-semibold' },
    {
      header: 'Requested Role',
      cell: (row) => (
        <span className="font-mono text-xs text-blue-400 font-medium">
          {ROLE_LABELS[row.requestedRole as UserRole] || row.requestedRole}
        </span>
      ),
    },
    { header: 'Branch Hub', accessorKey: 'branchName' },
    { header: 'Requested By', accessorKey: 'requestedBy' },
    { header: 'Date', accessorKey: 'requestedDate', className: 'font-mono text-xs' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Decision Actions',
      cell: (row) =>
        row.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction(row.id, 'approved')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 rounded text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => handleAction(row.id, 'rejected')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded text-xs font-medium transition-colors"
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
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white font-semibold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Approvals
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white font-semibold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Check className="w-3.5 h-3.5" /> Approved ({approvalsList.filter((i) => i.status === 'approved').length})
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white font-semibold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <X className="w-3.5 h-3.5" /> Rejected ({approvalsList.filter((i) => i.status === 'rejected').length})
        </button>
      </div>

      <DataTable<EmployeeApproval>
        columns={columns}
        data={filteredApprovals}
        emptyTitle={`No ${activeTab} role approval requests`}
        emptyDescription={`There are currently no employee role requests in ${activeTab} state.`}
      />
    </div>
  );
};
