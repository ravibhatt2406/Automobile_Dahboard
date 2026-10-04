import React from 'react';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Building, Store, Lock } from 'lucide-react';

export const ScopeSelector: React.FC = () => {
  const {
    selectedFranchiseId,
    selectedBranchId,
    setSelectedFranchiseId,
    setSelectedBranchId,
    isBranchLocked,
    activeBranchName,
    activeFranchiseName,
  } = useScope();
  const { permissions, activeRole, user } = useAuth();

  // Customer does not see organization scope selector
  if (activeRole === 'CUSTOMER') {
    return null;
  }

  // Branch-scoped employee: Branch Manager, Sales Executive, Mechanic, Service Advisor, etc.
  if (isBranchLocked) {
    return (
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs border border-zinc-800 shadow-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Building className="w-3.5 h-3.5 text-[#F5A800]" />
          <span className="font-bold text-[#F5A800] uppercase tracking-wider">
            {user?.assignedFranchiseName || activeFranchiseName || 'ASHOK LEYLAND'}
          </span>
        </div>
        <span className="text-zinc-600">|</span>
        <div className="flex items-center gap-1.5 text-zinc-200">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">
            {user?.assignedBranchName || activeBranchName || 'Jaipur Branch'}
          </span>
          <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-sans">
            <Lock className="w-2.5 h-2.5" /> Assigned
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
      {permissions.canViewAllFranchises && (
        <div className="flex items-center gap-1.5 text-zinc-700">
          <Building className="w-3.5 h-3.5 text-[#F5A800]" />
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
              setSelectedBranchId('ALL');
            }}
            className="bg-transparent text-xs text-zinc-900 focus:outline-none cursor-pointer font-medium"
          >
            <option value="ALL" className="bg-white text-zinc-900">
              All Franchises
            </option>
            <option value="fr-ashok-leyland" className="bg-white text-zinc-900">
              Ashok Leyland Franchises
            </option>
          </select>
        </div>
      )}

      {permissions.canViewBranches && (
        <>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5 text-zinc-700">
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs text-zinc-900 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-white text-zinc-900">
                All Branches
              </option>
              <option value="br-jaipur" className="bg-white text-zinc-900">
                Jaipur Branch
              </option>
              <option value="br-jodhpur" className="bg-white text-zinc-900">
                Jodhpur Branch
              </option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};


