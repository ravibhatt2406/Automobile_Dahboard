import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Store, Users, Truck, Mail, Phone, MapPin } from 'lucide-react';

export const BranchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => (id ? branchService.getBranchById(id) : null),
  });

  return (
    <div>
      <PageHeader
        title={branch ? branch.name : `Branch Location #${id}`}
        subtitle={`Parent Franchise: ${branch?.franchiseName || '--'}`}
        breadcrumbItems={[
          { label: 'Organization', href: '/organization/branches' },
          { label: 'Branches', href: '/organization/branches' },
          { label: branch?.code || id || 'Detail' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Store className="w-4 h-4 text-cyan-400" /> Branch Location Details
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Branch Code</span>
              <span className="font-mono text-cyan-400 font-semibold">{branch?.code || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Dealership Address</span>
              <span className="text-slate-200 block">{branch?.address || '--'}</span>
              <span className="text-slate-400 block font-mono mt-0.5">
                {branch?.city ? `${branch.city}, ${branch.state} - ${branch.pincode}` : '--'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Phone
              </span>
              <span className="text-slate-200">{branch?.phone || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Email
              </span>
              <span className="font-mono text-slate-200">{branch?.email || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Status</span>
              <StatusBadge status={branch?.status || 'active'} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-400" /> Staff Personnel Assigned
            </h3>
            <EmptyState
              title="No staff personnel assigned"
              description="Branch managers, sales reps, and service mechanics assigned to this location."
              actionLabel="Add Employee"
              onAction={() => navigate('/organization/employees')}
            />
          </div>

          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-emerald-400" /> Vehicle Stock at Branch
            </h3>
            <EmptyState
              title="No vehicles in branch stock"
              description="Inventory units currently located at this dealership lot."
              actionLabel="View All Stock"
              onAction={() => navigate('/inventory/vehicles')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
