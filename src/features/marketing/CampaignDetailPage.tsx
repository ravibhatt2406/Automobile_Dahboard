import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Tent,
  Calendar,
  MapPin,
  Building,
  User,
  Users,
  DollarSign,
  Plus,
  Receipt,
  Target,
  FileText,
  Truck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react';
import { Campaign, campaignService } from '@/services/campaign.service';
import { employeeService } from '@/services/employee.service';
import { CampaignFormModal } from './CampaignFormModal';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'expenses' | 'team' | 'leads'>('expenses');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Record Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('LOGISTICS');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Assign Member State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [roleInCamp, setRoleInCamp] = useState('Product Specialist');
  const [memberSaving, setMemberSaving] = useState(false);

  const fetchCampaign = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await campaignService.getCampaign(id);
      if (!data) {
        setError('Campaign not found or access denied by branch permissions.');
      } else {
        setCampaign(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    employeeService.getEmployees().then((res) => {
      const list = Array.isArray(res) ? res : (res as any)?.items || [];
      setEmployees(list);
      if (list.length > 0) setSelectedEmployeeId(list[0].id);
    }).catch(() => {});
  }, [id]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !expenseTitle || !expenseAmount) return;
    setExpenseSaving(true);
    try {
      await campaignService.recordExpense(id, {
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        expenseDate: new Date(expenseDate).toISOString(),
        notes: expenseNotes.trim() || undefined,
      });
      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      fetchCampaign();
    } catch (err: any) {
      alert(err?.message || 'Failed to record expense');
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedEmployeeId) return;
    setMemberSaving(true);
    try {
      await campaignService.addMember(id, {
        employeeId: selectedEmployeeId,
        roleInCamp: roleInCamp.trim(),
      });
      setIsMemberModalOpen(false);
      fetchCampaign();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign team member');
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!id || !confirm('Remove this member from the campaign team?')) return;
    try {
      await campaignService.removeMember(id, employeeId);
      fetchCampaign();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl inline-block border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Campaign Access Error</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => navigate('/marketing/campaigns')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  const budget = Number(campaign.budget) || 0;
  const actualExpenses = campaign.actualExpenses || 0;
  const variance = budget - actualExpenses;
  const spendPct = budget > 0 ? Math.min(100, Math.round((actualExpenses / budget) * 100)) : 0;

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
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/marketing/campaigns')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Edit Campaign
          </button>
        </div>
      </div>

      {/* Campaign Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(campaign.status)}`}>
                {campaign.status}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                {campaign.branch?.name || 'Commercial Hub'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-sm text-slate-300 max-w-3xl">{campaign.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {new Date(campaign.startDate).toLocaleDateString()} — {new Date(campaign.endDate).toLocaleDateString()}
              </span>
              {campaign.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {campaign.location}
                </span>
              )}
              {campaign.coordinator && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  Coordinator: {campaign.coordinator.firstName} {campaign.coordinator.lastName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Leads Generated</span>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{campaign.metrics?.leadsCount ?? campaign.leads?.length ?? 0}</div>
          <p className="text-xs text-slate-400 mt-1">Directly attributed from camp outreach</p>
        </div>

        {/* Quotations & Bookings */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Quotations / Bookings</span>
            <Truck className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {campaign.metrics?.quotationsCount ?? 0} <span className="text-sm font-normal text-slate-400">/</span> {campaign.metrics?.bookingsCount ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Downstream pipeline conversion</p>
        </div>

        {/* Budget Allocated */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Allocated Budget</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">₹{budget.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">Authorized regional branch allowance</p>
        </div>

        {/* Actual Expenses & Variance */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Actual Expenses</span>
            <Receipt className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">₹{actualExpenses.toLocaleString('en-IN')}</div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className={variance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {variance >= 0 ? `₹${variance.toLocaleString('en-IN')} remaining` : `₹${Math.abs(variance).toLocaleString('en-IN')} over budget`}
            </span>
            <span className="text-slate-500">{spendPct}% spent</span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'expenses'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Recorded Expenses ({campaign.expenses?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'team'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Assigned Team ({campaign.teamMembers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'leads'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Camp Leads ({campaign.leads?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: Expenses Breakdown */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recorded Operational Expenses</h3>
              <p className="text-xs text-slate-400">
                Log receipts, canopy setup, refreshments, and marketing collateral costs
              </p>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Expense Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(!campaign.expenses || campaign.expenses.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No expenses recorded yet. Click &quot;Record Expense&quot; to log actual costs.
                      </td>
                    </tr>
                  ) : (
                    campaign.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{exp.title}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(exp.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{exp.notes || '--'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Assigned Team */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Assigned Camp Field Team</h3>
              <p className="text-xs text-slate-400">
                Staff, technical consultants, and sales executives active on-ground
              </p>
            </div>
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaign.coordinator && (
              <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-xl relative overflow-hidden">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  COORDINATOR
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {campaign.coordinator.firstName[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {campaign.coordinator.firstName} {campaign.coordinator.lastName}
                    </h4>
                    <p className="text-xs text-slate-400">Overall Event Coordinator</p>
                  </div>
                </div>
              </div>
            )}

            {campaign.teamMembers?.map((m) => (
              <div key={m.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                      {m.employee?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {m.employee?.firstName} {m.employee?.lastName}
                      </h4>
                      <p className="text-xs text-blue-400">{m.roleInCamp || 'Team Member'}</p>
                      <p className="text-[11px] text-slate-500">{m.employee?.employeeCode}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.employeeId)}
                    title="Remove from team"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Leads Generated */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Leads Generated from Camp</h3>
            <p className="text-xs text-slate-400">
              Commercial vehicle enquiries registered during outreach activity
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Prospect / Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Interested Model</th>
                    <th className="px-4 py-3 text-right">Budget (₹)</th>
                    <th className="px-4 py-3">Assigned Sales Executive</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(!campaign.leads || campaign.leads.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No leads registered from this camp yet.
                      </td>
                    </tr>
                  ) : (
                    campaign.leads.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{l.customer?.name || l.prospectName || 'Fleet Prospect'}</div>
                          {l.customer?.companyName && (
                            <div className="text-xs text-slate-400">{l.customer.companyName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{l.customer?.phone || '--'}</td>
                        <td className="px-4 py-3 text-blue-400 font-medium">{l.interestedModel || 'General Heavy Vehicle'}</td>
                        <td className="px-4 py-3 text-right font-mono text-white">
                          {l.expectedBudget ? `₹${Number(l.expectedBudget).toLocaleString('en-IN')}` : '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {l.assignedEmployee ? `${l.assignedEmployee.firstName} ${l.assignedEmployee.lastName}` : 'Unassigned'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <span>Record Campaign Expense</span>
            </h3>

            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Stage Fabrication, Audio PA System, Fuel"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOGISTICS">Logistics & Venue</option>
                    <option value="MARKETING">Branding & Banners</option>
                    <option value="REFRESHMENTS">Refreshments</option>
                    <option value="PETTY_CASH">Petty Cash</option>
                    <option value="STAFF_ALLOWANCE">Staff Allowance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Voucher / Receipt Notes</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Voucher #V-102, paid via branch petty cash"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseSaving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {expenseSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Assign Staff to Camp</span>
            </h3>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Employee *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role in Camp</label>
                <input
                  type="text"
                  value={roleInCamp}
                  onChange={(e) => setRoleInCamp(e.target.value)}
                  placeholder="e.g. Lead Technical Evaluator, Fleet Demonstrator"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {memberSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Assign Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      <CampaignFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        campaign={campaign}
        onSuccess={() => fetchCampaign()}
      />
    </div>
  );
};
