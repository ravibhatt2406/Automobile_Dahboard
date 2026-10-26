import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { franchiseService } from '@/services/franchise.service';
import { branchService } from '@/services/branch.service';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FranchiseFormModal } from './FranchiseFormModal';
import { BranchFormModal } from '../branches/BranchFormModal';
import { useAuth } from '@/app/providers/AuthContext';
import {
  Building,
  Store,
  Users,
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit,
  Plus,
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const FranchiseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: franchise, isLoading, error, refetch } = useQuery({
    queryKey: ['franchise', id],
    queryFn: () => (id ? franchiseService.getFranchiseById(id) : null),
  });

  const handleUpdateFranchise = async (formData: any) => {
    if (!id) return;
    try {
      await franchiseService.updateFranchise(id, formData);
      queryClient.invalidateQueries({ queryKey: ['franchise', id] });
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      setFeedback({ type: 'success', message: 'Franchise entity updated successfully.' });
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update franchise.' });
      throw err;
    }
  };

  const handleCreateBranch = async (branchData: any) => {
    try {
      await branchService.createBranch({
        ...branchData,
        franchiseId: id,
      });
      queryClient.invalidateQueries({ queryKey: ['franchise', id] });
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setFeedback({ type: 'success', message: 'New dealership branch linked successfully.' });
      setIsBranchModalOpen(false);
      refetch();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to link branch location.' });
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-zinc-500 font-medium">Loading franchise entity records...</p>
      </div>
    );
  }

  if (error || !franchise) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/organization/franchises')}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Franchises
        </button>
        <EmptyState
          title="Franchise not found or inaccessible"
          description="The requested commercial franchise entity could not be located in the database or your account lacks authorization."
          actionLabel="Return to Franchises Listing"
          onAction={() => navigate('/organization/franchises')}
        />
      </div>
    );
  }

  const branches = franchise.branches || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/organization/franchises')}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Franchises
        </button>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => {
                setFeedback(null);
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold border border-zinc-300 shadow-2xs transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-zinc-600" /> Edit Franchise
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setFeedback(null);
                setIsBranchModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Branch Location
            </button>
          )}
        </div>
      </div>

      <PageHeader
        title={franchise.name}
        subtitle={`Brand License: ${franchise.brand || 'Commercial Fleet'} | Legal Entity: ${franchise.legalName || franchise.name}`}
        breadcrumbItems={[
          { label: 'Organization', href: '/organization/franchises' },
          { label: 'Franchises', href: '/organization/franchises' },
          { label: franchise.code },
        ]}
      />

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Franchise Overview Details */}
        <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" /> Franchise Overview
            </h3>
            <StatusBadge status={franchise.status} />
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-zinc-500 block mb-1 font-medium">Franchise Code</span>
              <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200 inline-block">
                {franchise.code}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <Shield className="w-3.5 h-3.5 text-amber-500" /> Brand License
              </span>
              <span className="font-semibold text-zinc-900">{franchise.brand || 'Commercial Fleet'}</span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-zinc-400" /> Corporate Legal Name
              </span>
              <span className="font-semibold text-zinc-900">
                {franchise.legalName || <span className="text-zinc-400 italic">Not configured</span>}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" /> GSTIN / Tax ID
              </span>
              <span className="font-mono text-zinc-800">
                {franchise.taxId || <span className="text-zinc-400 italic">Not configured</span>}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-200">
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Principal Owner / Partner
              </span>
              <span className="font-semibold text-zinc-900">
                {franchise.ownerName || <span className="text-zinc-400 italic">Unassigned</span>}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <Mail className="w-3.5 h-3.5 text-zinc-400" /> Contact Email
              </span>
              <span className="font-mono text-zinc-700">
                {franchise.contactEmail || <span className="text-zinc-400 italic">Not configured</span>}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5 text-zinc-400" /> Contact Phone
              </span>
              <span className="font-mono text-zinc-700">
                {franchise.contactPhone || <span className="text-zinc-400 italic">Not configured</span>}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Registered Headquarters
              </span>
              <span className="text-zinc-800 leading-relaxed">
                {franchise.address || <span className="text-zinc-400 italic">Not configured</span>}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-zinc-500 text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Registered
              </span>
              <span className="font-mono">{new Date(franchise.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dealership Branches in Franchise */}
        <div className="lg:col-span-2 space-y-4">
          <div className="cockpit-card p-6 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Dealership Branches in Franchise
                </h3>
                <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {branches.length} {branches.length === 1 ? 'Location' : 'Locations'}
                </span>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setFeedback(null);
                    setIsBranchModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Location
                </button>
              )}
            </div>

            {branches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 hover:border-zinc-300 transition-all space-y-3 flex flex-col justify-between shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {b.code}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900">{b.name}</h4>
                      <p className="text-xs text-zinc-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>
                          {[b.address, b.city, b.state].filter(Boolean).join(', ') || 'Address unlisted'}
                        </span>
                      </p>
                      {(b.phone || b.email) && (
                        <div className="text-[11px] text-zinc-600 pt-1 space-y-0.5 font-mono">
                          {b.phone && <div>Phone: {b.phone}</div>}
                          {b.email && <div>Email: {b.email}</div>}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-500 font-medium">Dealership Branch</span>
                      <button
                        onClick={() => navigate(`/organization/branches/${b.id}`)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors"
                      >
                        View Branch <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No branches associated"
                description="No dealership branches currently exist under this franchise entity in the database."
                actionLabel={isSuperAdmin ? 'Add Branch Location' : undefined}
                onAction={isSuperAdmin ? () => setIsBranchModalOpen(true) : undefined}
              />
            )}
          </div>
        </div>
      </div>


      <FranchiseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={franchise}
        onSubmit={handleUpdateFranchise}
      />

      <BranchFormModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        initialData={{ franchiseId: franchise.id, franchiseName: franchise.name } as any}
        onSubmit={handleCreateBranch}
      />
    </div>
  );
};
