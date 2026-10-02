import React from 'react';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Building, Store } from 'lucide-react';

export const ScopeSelector: React.FC = () => {
  const { selectedFranchiseId, selectedBranchId, setSelectedFranchiseId, setSelectedBranchId } =
    useScope();
  const { permissions, activeRole } = useAuth();

  // If customer or mechanic, scope is automatically restricted
  if (activeRole === 'CUSTOMER' || activeRole === 'MECHANIC') {
    return null;
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
            <option value="fr-01" className="bg-white text-zinc-900">
              Titan Commercial NA
            </option>
            <option value="fr-02" className="bg-white text-zinc-900">
              Titan Heavy Haul Euro
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
              <option value="br-101" className="bg-white text-zinc-900">
                Detroit Flagship Hub
              </option>
              <option value="br-102" className="bg-white text-zinc-900">
                Chicago Service Center
              </option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

