import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Employee } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { UserPlus, Edit, Eye, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { EmployeeFormModal } from './EmployeeFormModal';
import { ROLE_LABELS, UserRole } from '@/types/roles';
import { useNavigate } from 'react-router-dom';

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canManage = permissions.canManageEmployees;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  });

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const columns: Column<Employee>[] = [
    { header: 'Emp Code', accessorKey: 'employeeCode', className: 'font-mono text-xs font-semibold text-blue-400' },
    {
      header: 'Personnel Name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-100 block">{row.firstName} {row.lastName}</span>
          <span className="text-[11px] text-slate-400">{row.designation}</span>
        </div>
      ),
    },
    { header: 'Email', accessorKey: 'email', className: 'font-mono text-xs' },
    { header: 'Department', accessorKey: 'department' },
    {
      header: 'Assigned Roles',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((roleKey) => (
              <span
                key={roleKey}
                className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 text-[10px] font-mono font-medium"
              >
                {ROLE_LABELS[roleKey as UserRole] || roleKey}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">--</span>
          )}
        </div>
      ),
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
            onClick={() => navigate(`/organization/employees/${row.id}`)}
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
        title="Employee Personnel"
        subtitle="Staff, sales executives, department managers, and service technicians"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Employees' }]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/organization/approvals')}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Approval Center
            </button>

            {canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                <UserPlus className="w-4 h-4" /> Add Employee
              </button>
            )}
          </div>
        }
      />

      <DataTable<Employee>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No employees found"
        emptyDescription="No employee staff profiles are currently registered."
        emptyActionLabel={canManage ? 'Add Employee Profile' : undefined}
        onEmptyAction={canManage ? handleCreate : undefined}
      />

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingEmployee}
        onSubmit={(formData) => {
          console.log('Saved Employee Data:', formData);
          refetch();
        }}
      />
    </div>
  );
};
