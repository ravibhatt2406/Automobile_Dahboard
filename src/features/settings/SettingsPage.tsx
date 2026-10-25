import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useAuth } from '@/app/providers/AuthContext';
import { ROLE_LABELS } from '@/types/roles';
import { User, Shield, Lock, Bell, Sliders, Server, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'security' | 'preferences'>('profile');

  const tabs: Array<{ id: typeof activeTab; label: string; icon: React.ElementType }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  return (
    <div>
      <PageHeader
        title="Platform Settings & Preferences"
        subtitle="User profile, account security, notification alerts, and platform settings"
        breadcrumbItems={[{ label: 'Settings' }]}
      />

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 max-w-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-blue-400" /> User Profile Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                defaultValue={user?.firstName}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                defaultValue={user?.lastName}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-mono">Email Address</label>
              <input
                type="email"
                defaultValue={user?.email}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                defaultValue={user?.phone}
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6 max-w-2xl">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-cyan-400" /> Account & Identity Overview
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Active Portal Role</span>
                <span className="font-mono text-blue-400 font-semibold">{ROLE_LABELS[activeRole]}</span>
              </div>
              {activeRole === 'CUSTOMER' ? (
                <>
                  <div>
                    <span className="text-slate-500 block">Customer ID</span>
                    <span className="font-mono text-slate-300">{user?.customerId || 'Linked Online Account'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Registered Email</span>
                    <span className="font-mono text-slate-300">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Verified Phone</span>
                    <span className="font-mono text-slate-300">{user?.phone || 'Not provided'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-500 block">Assigned Franchise</span>
                    <span className="text-slate-200">{user?.assignedFranchiseName || 'Titan Commercial NA'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Assigned Branch Location</span>
                    <span className="text-slate-200">{user?.assignedBranchName || 'Detroit Flagship Hub'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {activeRole === 'CUSTOMER' && <CustomerPreferredBranchSettings />}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 max-w-2xl space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell className="w-4 h-4 text-amber-400" /> Alert & Notification Channels
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-800" />
              <span>Email notifications for vehicle booking confirmations</span>
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-800" />
              <span>SMS alerts for service job card status changes</span>
            </label>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="cockpit-card p-6 rounded-xl border border-slate-800 max-w-2xl space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-rose-400" /> Security & Password
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-6 max-w-2xl">
          <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-purple-400" /> Cockpit UI Preferences
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Cockpit Dark Theme Mode</label>
                <select className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100">
                  <option value="dark">Titan Graphite Dark Cockpit (Default)</option>
                </select>
              </div>
            </div>
          </div>

          {activeRole === 'CUSTOMER' && (
            <CustomerPreferredBranchSettings />
          )}
        </div>
      )}
    </div>
  );
};

const CustomerPreferredBranchSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [branches, setBranches] = React.useState<any[]>([]);
  const [cities, setCities] = React.useState<string[]>([]);
  const [selectedCity, setSelectedCity] = React.useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>('');
  const [currentBranch, setCurrentBranch] = React.useState<any>(null);
  const [customerId, setCustomerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [dash, bList] = await Promise.all([
          import('@/services/dashboard.service').then((m) => m.dashboardService.getCustomer()),
          import('@/services/branch.service').then((m) => m.branchService.getPublicActiveBranches()),
        ]);
        setBranches(bList);
        const uniqueCities = Array.from(new Set(bList.map((b) => b.city).filter(Boolean))).sort();
        setCities(uniqueCities);

        const cust = dash?.customer;
        const cid = cust?.id || user?.customerId;
        if (cid) setCustomerId(cid);
        const pb = cust?.preferredBranch || user?.customerProfile?.preferredBranch;
        if (pb) {
          setCurrentBranch(pb);
          setSelectedBranchId(pb.id);
          if (pb.city) setSelectedCity(pb.city);
        }
      } catch (err) {
        console.error('Failed to load customer settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setSaving(true);
    setMsg(null);
    try {
      const { customerService } = await import('@/services/customer.service');
      const updated = await customerService.updatePreferredBranch(customerId, selectedBranchId || null);
      setCurrentBranch(updated.preferredBranch || null);
      await refreshUser();
      setMsg({
        type: 'success',
        text: selectedBranchId ? 'Preferred branch saved successfully!' : 'Preferred branch preference cleared.',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || 'Failed to update preferred branch.',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredBranches = selectedCity
    ? branches.filter((b) => b.city?.toLowerCase() === selectedCity.toLowerCase())
    : branches;

  if (loading) return null;

  return (
    <div className="cockpit-card p-6 rounded-xl border border-slate-800 space-y-4 text-xs">
      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
        <Shield className="w-4 h-4 text-amber-400" /> Preferred Dealership Branch
      </h3>
      <p className="text-slate-400">
        Choose your primary dealership branch for local servicing, quotations, and priority fulfillment.
        Browse Trucks continues to display all branches by default.
      </p>

      {currentBranch ? (
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
          <span className="text-slate-400 block text-[11px]">Currently Preferred Branch:</span>
          <span className="font-semibold text-amber-400">{currentBranch.name}</span>
          <span className="text-slate-400 ml-2">({currentBranch.city})</span>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-400">
          No preferred branch currently set. (All branches active)
        </div>
      )}

      {msg && (
        <div
          className={`p-3 rounded-lg border font-semibold ${
            msg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/60 border-rose-700 text-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 mb-1">Filter by City</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedBranchId('');
              }}
              className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Preferred Branch</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
            >
              <option value="">None / Clear Preference</option>
              {filteredBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          {saving ? 'Saving...' : 'Save Branch Preference'}
        </button>
      </form>
    </div>
  );
};
