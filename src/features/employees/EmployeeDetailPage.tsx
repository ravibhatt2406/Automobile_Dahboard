import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ROLE_LABELS, UserRole } from '@/types/roles';
import { User, Shield, Building2, Store, Mail, Phone, Calendar, UserX } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canManage = permissions.canManageEmployees;

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => (id ? employeeService.getEmployeeById(id) : null),
  });

  const deactivateMutation = useMutation({
    mutationFn: (empId: string) => employeeService.deactivateEmployee(empId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  // Normalize backend response - backend returns user.email & roleAssignments
  const emp = employee as any;
  const email = emp?.email || emp?.user?.email || '--';
  const phone = emp?.phone || emp?.user?.phone || '--';
  const status = emp?.status || 'active';
  const joinedAt = emp?.joinedAt || emp?.createdAt;
  const branchName = emp?.branchName || emp?.branch?.name || '--';
  const franchiseName = emp?.franchiseName || emp?.branch?.franchise?.name || '--';
  
  // Normalize roles - can be string[] or roleAssignments[].role.name
  const roles: string[] = emp?.roles && emp.roles.length > 0
    ? emp.roles
    : (emp?.roleAssignments?.map((ra: any) => ra.role?.name).filter(Boolean) || []);

  const handleDeactivate = () => {
    if (!id) return;
    if (confirm(`Deactivate ${emp?.firstName || 'this employee'}? Their account will be set to inactive.`)) {
      deactivateMutation.mutateAsync(id).then(() => {
        navigate('/organization/employees');
      }).catch((err: any) => {
        alert(err?.message || 'Failed to deactivate employee.');
      });
    }
  };

  return (
    <div>
      <PageHeader
        title={employee ? `${emp?.firstName} ${emp?.lastName}` : `Employee Record #${id}`}
        subtitle={`Employee Code: ${emp?.employeeCode || '--'}`}
        breadcrumbItems={[
          { label: 'Organization', href: '/organization/employees' },
          { label: 'Employees', href: '/organization/employees' },
          { label: emp?.employeeCode || id || 'Detail' },
        ]}
        actions={
          canManage && status !== 'INACTIVE' && status !== 'inactive' ? (
            <button
              onClick={handleDeactivate}
              disabled={deactivateMutation.isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <UserX className="w-4 h-4" /> Deactivate Account
            </button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="p-8 text-center text-slate-400 text-sm">Loading employee details...</div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-blue-400" /> Personnel Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Employee Code</span>
                <span className="font-mono text-cyan-400 font-semibold">{emp?.employeeCode || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department</span>
                <span className="font-medium text-slate-200">{emp?.department || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Designation</span>
                <span className="text-slate-200">{emp?.designation || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Email
                </span>
                <span className="font-mono text-slate-200">{email}</span>
              </div>
              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Phone
                </span>
                <span className="text-slate-200">{phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Joined / Created
                </span>
                <span className="font-mono text-slate-300">
                  {joinedAt ? new Date(joinedAt).toLocaleDateString() : '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="cockpit-card p-6 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-blue-400" /> Assigned Roles & Capabilities
              </h3>

              <div className="flex flex-wrap gap-2">
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/50 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      {ROLE_LABELS[r as UserRole] || r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 font-mono">No role assignments (Pending Approval)</span>
                )}
              </div>
            </div>

            <div className="cockpit-card p-6 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-cyan-400" /> Assigned Branch Location
              </h3>
              <div className="text-xs space-y-1">
                <p className="text-slate-200 font-medium">{branchName}</p>
                <p className="text-slate-400">Franchise: {franchiseName}</p>
                {emp?.branchId && (
                  <p className="text-slate-600 font-mono">Branch ID: {emp.branchId}</p>
                )}
              </div>
            </div>

            {/* Approval Requests History */}
            {emp?.approvalRequests && emp.approvalRequests.length > 0 && (
              <div className="cockpit-card p-6 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-amber-400" /> Approval History
                </h3>
                <div className="space-y-2">
                  {emp.approvalRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 font-mono">{req.assignedRole?.name || 'Role Request'}</span>
                      <StatusBadge status={req.status?.toLowerCase()} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
