import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tent,
  Plus,
  Search,
  Calendar,
  MapPin,
  Building,
  Target,
  DollarSign,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Campaign, campaignService } from '@/services/campaign.service';
import { CampaignFormModal } from './CampaignFormModal';

export const CampaignsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignService.getCampaigns({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setCampaigns(res.items);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCampaigns();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'UPCOMING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
            <Tent className="w-4 h-4" />
            <span>Marketing & Outreach</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Camps & Marketing Campaigns</h1>
          <p className="text-sm text-slate-400">
            Regional fleet expos, highway outreach camps, budget tracking, and real lead attribution
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Organize New Camp</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaign name, corridor, or location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => fetchCampaigns()}
            title="Refresh"
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Tent className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Marketing Campaigns Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            No regional outreach camps match your current filter criteria. Click &quot;Organize New Camp&quot; to begin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((camp) => {
            const budget = Number(camp.budget) || 0;
            const actual = camp.actualExpenses || 0;
            const variance = budget - actual;
            const spendPct = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 0;

            return (
              <div
                key={camp.id}
                onClick={() => navigate(`/marketing/campaigns/${camp.id}`)}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(camp.status)}`}>
                      {camp.status}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      {camp.branch?.name || 'Regional'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {camp.name}
                    </h3>
                    {camp.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{camp.description}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(camp.startDate).toLocaleDateString()} — {new Date(camp.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    {camp.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{camp.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Budget & Expense meter */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Expenses / Budget</span>
                      <span className="font-mono font-medium text-white">
                        ₹{actual.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          spendPct > 90 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${spendPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-blue-400 font-medium">
                    <Target className="w-3.5 h-3.5" />
                    <span>{camp.leadsCount ?? camp.leads?.length ?? 0} Leads Generated</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-white transition-colors">
                    <span>Manage Camp</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <CampaignFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCampaigns()}
      />
    </div>
  );
};
