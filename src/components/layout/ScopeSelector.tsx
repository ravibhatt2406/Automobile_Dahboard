import React from 'react';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Building, Store, Lock, Loader2 } from 'lucide-react';

export const ScopeSelector: React.FC = () => {
  const {
    selectedFranchiseId,
    selectedBranchId,
    setSelectedFranchiseId,
    setSelectedBranchId,
    isBranchLocked,
    isFranchiseLocked,
    activeBranchName,
    activeFranchiseName,
    franchises,
    branches,
    isLoadingScope,
  } = useScope();
  const { permissions, activeRole, user } = useAuth();

  // Customer does not see internal scope selector
  if (activeRole === 'CUSTOMER') {
    return null;
  }

  const isBranchLevel =
    isBranchLocked ||
    [
      'BRANCH_OWNER',
      'BRANCH_MANAGER',
      'DEPARTMENT_MANAGER',
      'SALES_EMPLOYEE',
      'SERVICE_ADVISOR',
      'MECHANIC',
    ].includes(activeRole);

  const isFranchiseLevel =
    isFranchiseLocked || ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(activeRole);

  // Branch-scoped employee: Branch Manager, Sales Executive, Mechanic, Service Advisor, etc.
  // Hide both global franchise and branch selectors
  if (isBranchLevel) {
    return (
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs border border-zinc-800 shadow-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Building className="w-3.5 h-3.5 text-[#F5A800]" />
          <span className="font-bold text-[#F5A800] uppercase tracking-wider">
            {activeFranchiseName || user?.assignedFranchiseName || 'ASHOK LEYLAND'}
          </span>
        </div>
        <span className="text-zinc-600">|</span>
        <div className="flex items-center gap-1.5 text-zinc-200">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">
            {activeBranchName || user?.assignedBranchName || 'Assigned Branch'}
          </span>
          <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-sans">
            <Lock className="w-2.5 h-2.5" /> Scope
          </span>
        </div>
      </div>
    );
  }

  // Franchise-level managers: Hide franchise selector, show cascading branch selector
  if (isFranchiseLevel) {
    return (
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Building className="w-3.5 h-3.5 text-[#F5A800]" />
          <span className="font-bold text-[#F5A800] uppercase tracking-wider">
            {activeFranchiseName || user?.assignedFranchiseName || 'Franchise Network'}
          </span>
          <span className="inline-flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-sans">
            <Lock className="w-2.5 h-2.5" />
          </span>
        </div>

        <span className="text-zinc-700">|</span>

        <div className="flex items-center gap-1.5 text-zinc-300">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
            disabled={isLoadingScope}
          >
            <option value="ALL" className="bg-zinc-900 text-white">
              All Authorized Branches
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                {b.name}{b.city && b.city.toLowerCase() !== b.name.toLowerCase() ? ` (${b.city})` : ''}
              </option>
            ))}
          </select>
          {isLoadingScope && <Loader2 className="w-3 h-3 text-amber-400 animate-spin ml-1" />}
        </div>
      </div>
    );
  }

  // Super Admin: Full cross-franchise and cross-branch cascading selector
  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs shadow-xs">
      {permissions.canViewAllFranchises && (
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Building className="w-3.5 h-3.5 text-[#F5A800]" />
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
            }}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
          >
            <option value="ALL" className="bg-zinc-900 text-white">
              All Franchises
            </option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id} className="bg-zinc-900 text-white">
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {permissions.canViewBranches && (
        <>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              disabled={isLoadingScope}
            >
              <option value="ALL" className="bg-zinc-900 text-white">
                All Authorized Branches
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                  {b.name}{b.city && b.city.toLowerCase() !== b.name.toLowerCase() ? ` (${b.city})` : ''}
                </option>
              ))}
            </select>
            {isLoadingScope && <Loader2 className="w-3 h-3 text-amber-400 animate-spin ml-1" />}
          </div>
        </>
      )}
    </div>
  );
};
