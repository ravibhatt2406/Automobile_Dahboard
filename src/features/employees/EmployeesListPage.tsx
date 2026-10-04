import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Employee } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, CreateEmployeePayload } from '@/services/employee.service';
import { UserPlus, Eye, ShieldCheck, UserX } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/app/providers/AuthContext';
import { EmployeeFormModal } from './EmployeeFormModal';
import { ROLE_LABELS, UserRole } from '@/types/roles';
import { useNavigate } from 'react-router-dom';

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canManage = permissions.canManageEmployees;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeeService.createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => employeeService.deactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (payload: CreateEmployeePayload) => {
    await createMutation.mutateAsync(payload);
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this employee account?')) {
      await deactivateMutation.mutateAsync(id);
    }
  };

  // Fallback demo employee list if DB has 0 employee records
  const defaultEmployees: Employee[] = [
    {
      id: 'emp-01',
      employeeCode: 'EMP-JPR-001',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'branchmanager@titanauto.com',
      phone: '+91 98290 12345',
      roles: ['BRANCH_MANAGER', 'SALES_EMPLOYEE'],
      franchiseId: 'fr-ashok-leyland',
      franchiseName: 'Ashok Leyland',
      branchId: 'br-jaipur',
      branchName: 'Jaipur Branch',
      department: 'Branch Operations',
      designation: 'Branch Manager',
      status: 'active',
      joinedAt: '2025-01-15',
    },
    {
      id: 'emp-02',
      employeeCode: 'EMP-JPR-002',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sales@titanauto.com',
      phone: '+91 98290 54321',
      roles: ['SALES_EMPLOYEE'],
      franchiseId: 'fr-ashok-leyland',
      franchiseName: 'Ashok Leyland',
      branchId: 'br-jaipur',
      branchName: 'Jaipur Branch',
      department: 'Sales',
      designation: 'Senior Sales Executive',
      status: 'active',
      joinedAt: '2025-03-10',
    },
    {
      id: 'emp-03',
      employeeCode: 'EMP-JPR-003',
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'mechanic@titanauto.com',
      phone: '+91 98290 67890',
      roles: ['MECHANIC'],
      franchiseId: 'fr-ashok-leyland',
      franchiseName: 'Ashok Leyland',
      branchId: 'br-jaipur',
      branchName: 'Jaipur Branch',
      department: 'Service Workshop',
      designation: 'Master Commercial Mechanic',
      status: 'active',
      joinedAt: '2025-02-01',
    },
  ];

  const employeesList = (data?.data && data.data.length > 0) ? data.data : defaultEmployees;

  const columns: Column<Employee>[] = [
    { header: 'Emp Code', accessorKey: 'employeeCode', className: 'font-mono text-xs font-bold text-zinc-900' },
    {
      header: 'Personnel Name',
      cell: (row) => (
        <div>
          <span className="font-bold text-[#111111] block">{row.firstName} {row.lastName}</span>
          <span className="text-[11px] text-zinc-500">{row.designation || 'Staff'}</span>
        </div>
      ),
    },
    { header: 'Email', accessorKey: 'email', className: 'font-mono text-xs text-zinc-600' },
    { header: 'Branch', accessorKey: 'branchName' },
    {
      header: 'Assigned Roles',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((roleKey) => (
              <span
                key={roleKey}
                className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-semibold"
              >
                {ROLE_LABELS[roleKey as UserRole] || roleKey}
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-400">--</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status || 'active'} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate(`/organization/employees/${row.id}`)}
            className="inline-flex items-center gap-1 text-[#111111] hover:text-[#F5A800] font-semibold"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          {canManage && row.status !== 'inactive' && (
            <button
              onClick={() => handleDeactivate(row.id)}
              disabled={deactivateMutation.isPending}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold disabled:opacity-50"
            >
              <UserX className="w-3.5 h-3.5" /> Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Personnel Registry"
        subtitle="Branch managers, sales executives, department managers, service advisors, and mechanics"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Employees' }]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/organization/approvals')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Approval Center
            </button>

            {canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <UserPlus className="w-4 h-4" /> Add Employee
              </button>
            )}
          </div>
        }
      />

      <DataTable<Employee>
        columns={columns}
        data={employeesList}
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
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
