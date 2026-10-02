import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ROLE_LABELS, UserRole } from '@/types/roles';
import { User, Shield, Building, Store, Mail, Phone, Calendar } from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => (id ? employeeService.getEmployeeById(id) : null),
  });

  return (
    <div>
      <PageHeader
        title={employee ? `${employee.firstName} ${employee.lastName}` : `Employee Record #${id}`}
        subtitle={`Employee Code: ${employee?.employeeCode || '--'}`}
        breadcrumbItems={[
          { label: 'Organization', href: '/organization/employees' },
          { label: 'Employees', href: '/organization/employees' },
          { label: employee?.employeeCode || id || 'Detail' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-blue-400" /> Personnel Profile
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-medium text-slate-200">{employee?.department || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Designation</span>
              <span className="text-slate-200">{employee?.designation || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Email
              </span>
              <span className="font-mono text-slate-200">{employee?.email || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Phone
              </span>
              <span className="text-slate-200">{employee?.phone || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Joined Date
              </span>
              <span className="font-mono text-slate-300">{employee?.joinedAt || '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status</span>
              <StatusBadge status={employee?.status || 'active'} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-400" /> Assigned Roles & Capabilities
            </h3>

            <div className="flex flex-wrap gap-2">
              {employee?.roles && employee.roles.length > 0 ? (
                employee.roles.map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/50 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    {ROLE_LABELS[r as UserRole] || r}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-mono">No role assignments</span>
              )}
            </div>
          </div>

          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
              <Store className="w-4 h-4 text-cyan-400" /> Assigned Branch Location
            </h3>
            <p className="text-xs text-slate-300">{employee?.branchName || '--'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
