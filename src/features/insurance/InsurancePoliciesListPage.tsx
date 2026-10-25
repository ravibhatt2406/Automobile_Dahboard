import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import {
  ShieldCheck,
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  Eye,
  Truck,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { insuranceService, InsuranceStats } from '@/services/insurance.service';
import { InsurancePolicy } from '@/types/domain';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ComplianceTabContent } from '@/features/compliance/ComplianceTabContent';
import { PolicyFormModal } from './PolicyFormModal';
import { PolicyDetailModal } from './PolicyDetailModal';
import { PolicyRenewModal } from './PolicyRenewModal';

export const InsurancePoliciesListPage: React.FC = () => {
  const { activeRole, user } = useAuth();
  const effectiveBranchId = (user as any)?.branchId;
  const effectiveFranchiseId = (user as any)?.franchiseId;
  const [activeTab, setActiveTab] = useState<'insurance' | 'puc'>('insurance');

  // Stats State
  const [stats, setStats] = useState<InsuranceStats>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    pending: 0,
  });

  // Policies List State
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewingPolicy, setRenewingPolicy] = useState<InsurancePolicy | null>(null);

  const canCreatePolicy = ['SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'SALES_EMPLOYEE', 'INSURANCE_MANAGER'].includes(activeRole);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        insuranceService.getDashboardStats({
          branchId: effectiveBranchId || undefined,
          franchiseId: effectiveFranchiseId || undefined,
        }),
        insuranceService.getPolicies({
          search: searchTerm.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          branchId: effectiveBranchId || undefined,
          franchiseId: effectiveFranchiseId || undefined,
          pageSize: 100,
        }),
      ]);
      setStats(statsRes);
      setPolicies(listRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load insurance policies from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, effectiveBranchId, effectiveFranchiseId]);

  const handleOpenDetail = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
    setDetailModalOpen(false);
    setFormModalOpen(true);
  };

  const handleOpenRenew = (policy: InsurancePolicy) => {
    setRenewingPolicy(policy);
    setDetailModalOpen(false);
    setRenewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Fleet Insurance & Risk Management"
          subtitle="Manage commercial fleet insurance policies, carrier package coverages, and auditable renewals."
          breadcrumbItems={[{ label: 'Compliance & Insurance' }, { label: 'Insurance Policies' }]}
        />

        {canCreatePolicy && (
          <button
            onClick={() => {
              setEditingPolicy(null);
              setFormModalOpen(true);
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-[#F5A800] rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Policy</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Policies</span>
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 font-mono">{stats.total}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Recorded in DB</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Policies</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.active}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Current valid terms</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{stats.expiringSoon}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Within 30 days</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Expired Policies</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{stats.expired}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Requiring renewal</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Pending Review</span>
            <RotateCw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">{stats.pending}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Underwriting verification</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-200 gap-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'insurance'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Commercial Insurance Policies ({policies.length})
        </button>

        <button
          onClick={() => setActiveTab('puc')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'puc'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-600" /> Fleet Compliance & PUC Records
        </button>
      </div>

      {activeTab === 'insurance' ? (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search policy #, insurer, customer, VIN..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-300 text-xs focus:border-zinc-900 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-zinc-300 text-xs bg-white focus:border-zinc-900 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Policies</option>
                <option value="PENDING">Pending Review</option>
                <option value="EXPIRED">Expired Policies</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                onClick={loadData}
                title="Refresh from Database"
                className="p-2 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingState label="Loading commercial insurance policies from database..." />
          ) : error ? (
            <ErrorState title="Unable to Load Policies" message={error} onRetry={loadData} />
          ) : policies.length === 0 ? (
            <EmptyState
              title="No Commercial Insurance Policies Found"
              description="No policies match your search or filter criteria in the database."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((pol) => {
                const nowMs = Date.now();
                const expMs = pol.expiryDate ? new Date(pol.expiryDate).getTime() : 0;
                const isExpiringSoon = pol.isExpiringSoon || (pol.status === 'ACTIVE' && expMs > nowMs && expMs - nowMs <= 30 * 24 * 3600 * 1000);
                const isExpired = pol.isExpired || (pol.status === 'EXPIRED') || (pol.status === 'ACTIVE' && expMs < nowMs);

                const premiumVal = Number(pol.premium || pol.premiumAmount || 0);

                return (
                  <div
                    key={pol.id}
                    className="p-5 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-2xs hover:border-zinc-300 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#F5A800] uppercase tracking-wider">
                          {pol.insurer || pol.provider || 'Commercial Fleet Insurer'}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 mt-0.5">{pol.policyNumber}</h3>
                        <p className="text-xs text-zinc-500">{pol.policyType || pol.type || 'Comprehensive Fleet Policy'}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                          pol.status === 'ACTIVE'
                            ? isExpiringSoon
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isExpired
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {isExpiringSoon ? 'Expiring Soon' : isExpired ? 'Expired' : pol.status || 'Active'}
                      </span>
                    </div>

                    <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Customer:</span>
                        <span className="font-semibold text-zinc-800 truncate block">
                          {pol.customer?.name || pol.customerName || 'Fleet Operator'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Annual Premium:</span>
                        <span className="font-bold text-zinc-900">
                          ₹{premiumVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Vehicle / Deal:</span>
                        <span className="font-semibold text-zinc-800 truncate block">
                          {pol.vehicle?.vin ? `VIN: ${pol.vehicle.vin.slice(-8)}` : pol.booking?.bookingNumber || 'Deal Allotment'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Policy Expiry:</span>
                        <span className={`font-bold ${isExpiringSoon ? 'text-amber-600' : 'text-zinc-900'}`}>
                          {pol.expiryDate ? new Date(pol.expiryDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 text-[11px] truncate max-w-[200px]">
                        Branch: {pol.vehicle?.branch?.name || pol.booking?.branch?.name || 'Dealership Hub'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenRenew(pol)}
                          className="px-2.5 py-1.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-800 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Renew</span>
                        </button>
                        <button
                          onClick={() => handleOpenDetail(pol.id)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-[#F5A800] rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <ComplianceTabContent />
      )}

      {/* Policy Form Modal (Add / Edit) */}
      <PolicyFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingPolicy(null);
        }}
        onSuccess={loadData}
        initialData={editingPolicy}
      />

      {/* Policy Detail Modal */}
      <PolicyDetailModal
        policyId={selectedPolicyId}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPolicyId(null);
        }}
        onOpenEdit={(policy) => handleOpenEdit(policy)}
        onOpenRenew={(policy) => handleOpenRenew(policy)}
        onRefresh={loadData}
      />

      {/* Policy Renew Modal */}
      <PolicyRenewModal
        policy={renewingPolicy}
        isOpen={renewModalOpen}
        onClose={() => {
          setRenewModalOpen(false);
          setRenewingPolicy(null);
        }}
        onSuccess={loadData}
      />
    </div>
  );
};
