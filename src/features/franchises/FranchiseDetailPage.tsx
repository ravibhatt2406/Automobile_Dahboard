import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { franchiseService } from '@/services/franchise.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Building, Store, Users, Mail, Phone, MapPin, Shield } from 'lucide-react';

export const FranchiseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: franchise, isLoading } = useQuery({
    queryKey: ['franchise', id],
    queryFn: () => (id ? franchiseService.getFranchiseById(id) : null),
  });

  return (
    <div>
      <PageHeader
        title={franchise ? franchise.name : `Franchise Entity #${id}`}
        subtitle={`Brand License: ${franchise?.brand || '--'}`}
        breadcrumbItems={[
          { label: 'Organization', href: '/organization/franchises' },
          { label: 'Franchises', href: '/organization/franchises' },
          { label: franchise?.code || id || 'Detail' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-blue-400" /> Franchise Overview
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Franchise Code</span>
              <span className="font-mono text-blue-400 font-semibold">{franchise?.code || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Principal Owner</span>
              <span className="font-medium text-slate-200">{franchise?.ownerName || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Contact Email
              </span>
              <span className="font-mono text-slate-200">{franchise?.contactEmail || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Contact Phone
              </span>
              <span className="text-slate-200">{franchise?.contactPhone || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Headquarters Address
              </span>
              <span className="text-slate-200">{franchise?.address || '--'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Status</span>
              <StatusBadge status={franchise?.status || 'active'} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-cyan-400" /> Dealership Branches in Franchise
            </h3>
            <EmptyState
              title="No branches associated"
              description="No dealership branches exist under this franchise entity in the database."
              actionLabel="Add Branch Location"
              onAction={() => navigate('/organization/branches')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
