import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { employeeService } from '@/services/employee.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Store, Users, Truck, Mail, Phone, MapPin, Edit2, PowerOff } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { BranchFormModal } from './BranchFormModal';

export const BranchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canManage = permissions.canManageBranches;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: branch, isLoading, refetch } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => (id ? branchService.getBranchById(id) : null),
  });

  const { data: employeesRes } = useQuery({
    queryKey: ['employees', { branchId: id }],
    queryFn: () => employeeService.getEmployees({ branchId: id }),
    enabled: !!id,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => branchService.updateBranchStatus(id!, 'INACTIVE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch', id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const b = branch as any;
  const employees = (employeesRes?.data || []) as any[];

  const handleDeactivate = () => {
    if (!id) return;
    if (confirm(`Deactivate branch "${b?.name}"? This will disable operations at this location.`)) {
      deactivateMutation.mutateAsync().catch((err: any) => {
        alert(err?.message || 'Failed to deactivate branch.');
      });
    }
  };

  return (
    <div>
      <PageHeader
        title={branch ? b.name : `Branch Location #${id}`}
        subtitle={`Parent Franchise: ${b?.franchiseName || b?.franchise?.name || '--'}`}
        breadcrumbItems={[
          { label: 'Organization', href: '/organization/branches' },
          { label: 'Branches', href: '/organization/branches' },
          { label: b?.code || id || 'Detail' },
        ]}
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Branch
              </button>
              {b?.status !== 'INACTIVE' && b?.status !== 'inactive' && (
                <button
                  onClick={handleDeactivate}
                  disabled={deactivateMutation.isPending}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <PowerOff className="w-3.5 h-3.5" /> Deactivate
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="p-8 text-center text-slate-400 text-sm">Loading branch details...</div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Store className="w-4 h-4 text-cyan-400" /> Branch Location Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Branch Code</span>
                <span className="font-mono text-cyan-400 font-semibold">{b?.code || '--'}</span>
              </div>

              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Dealership Address
                </span>
                <span className="text-slate-200 block">{b?.address || '--'}</span>
                <span className="text-slate-400 block font-mono mt-0.5">
                  {b?.city ? `${b.city}, ${b.state}${b?.pincode ? ` - ${b.pincode}` : ''}` : '--'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Phone
                </span>
                <span className="text-slate-200">{b?.phone || '--'}</span>
              </div>

              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Email
                </span>
                <span className="font-mono text-slate-200">{b?.email || '--'}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Status</span>
                <StatusBadge status={b?.status || 'active'} />
              </div>

              <div>
                <span className="text-slate-500 block">Created</span>
                <span className="font-mono text-slate-400">
                  {b?.createdAt ? new Date(b.createdAt).toLocaleDateString() : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="cockpit-card p-6 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> Staff Personnel Assigned
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 rounded">
                    {employees.length}
                  </span>
                </h3>
                {canManage && (
                  <button
                    onClick={() => navigate('/organization/employees')}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View All →
                  </button>
                )}
              </div>

              {employees.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No staff assigned to this branch yet.</p>
              ) : (
                <div className="space-y-2">
                  {employees.slice(0, 8).map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-200">
                          {emp.firstName || emp.user?.firstName} {emp.lastName || emp.user?.lastName}
                        </span>
                        <span className="ml-2 text-slate-400">{emp.designation || '--'}</span>
                      </div>
                      <StatusBadge status={emp.status?.toLowerCase() || 'active'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cockpit-card p-6 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" /> Vehicle Stock at Branch
                </h3>
                <button
                  onClick={() => navigate('/inventory/vehicles')}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  View Stock →
                </button>
              </div>
              <p className="text-xs text-slate-500 italic">
                View the full vehicle inventory list filtered by this branch for stock levels.
              </p>
            </div>
          </div>
        </div>
      )}

      {b && (
        <BranchFormModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={b}
          onSubmit={async (formData) => {
            if (id) {
              await branchService.updateBranch(id, formData);
              await refetch();
            }
          }}
        />
      )}
    </div>
  );
};
