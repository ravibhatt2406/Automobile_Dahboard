import React from 'react';
import { useScope } from '@/app/providers/ScopeContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Search, Building, Store, Calendar, RotateCcw, Lock } from 'lucide-react';

export interface BranchFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  statusOptions?: { label: string; value: string }[];
  statusValue?: string;
  onStatusChange?: (val: string) => void;
  showDateRange?: boolean;
  startDate?: string;
  endDate?: string;
  onDateChange?: (start: string, end: string) => void;
  onReset?: () => void;
  extraFilters?: React.ReactNode;
  className?: string;
}

export const BranchFilterBar: React.FC<BranchFilterBarProps> = ({
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  statusOptions,
  statusValue,
  onStatusChange,
  showDateRange = false,
  startDate,
  endDate,
  onDateChange,
  onReset,
  extraFilters,
  className = '',
}) => {
  const {
    selectedFranchiseId,
    selectedBranchId,
    setSelectedFranchiseId,
    setSelectedBranchId,
    isBranchLocked,
    isFranchiseLocked,
    franchises,
    branches,
    resetScope,
    isLoadingScope,
  } = useScope();

  const { permissions, activeRole, user } = useAuth();
  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  const handleClear = () => {
    resetScope();
    if (onSearchChange) onSearchChange('');
    if (onStatusChange) onStatusChange('');
    if (onDateChange) onDateChange('', '');
    if (onReset) onReset();
  };

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 mb-6 flex flex-wrap items-center gap-3 text-xs shadow-sm ${className}`}
    >
      {/* 1. Global / Authorized Franchise Selector */}
      {isSuperAdmin && permissions.canViewAllFranchises && (
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300">
          <Building className="w-3.5 h-3.5 text-[#F5A800]" />
          <select
            value={selectedFranchiseId}
            onChange={(e) => setSelectedFranchiseId(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
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

      {/* 2. Branch Selector (Cascading or Locked) */}
      {isBranchLocked ? (
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">
            {user?.assignedBranchName || 'Assigned Branch'}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-sans ml-1">
            <Lock className="w-2.5 h-2.5" /> Locked
          </span>
        </div>
      ) : (
        permissions.canViewBranches && (
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300">
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={isLoadingScope}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-zinc-900 text-white">
                All Authorized Branches
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                  {b.name} {b.city ? `(${b.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )
      )}

      {/* 3. Search Box */}
      {onSearchChange !== undefined && (
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus-within:border-zinc-700">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-white text-xs placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      )}

      {/* 4. Status Filter */}
      {statusOptions && statusOptions.length > 0 && onStatusChange && (
        <select
          value={statusValue || ''}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* 5. Date Range Filters */}
      {showDateRange && onDateChange && (
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onDateChange(e.target.value, endDate || '')}
            className="bg-transparent text-white text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
            title="Start date"
          />
          <span className="text-zinc-600">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onDateChange(startDate || '', e.target.value)}
            className="bg-transparent text-white text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
            title="End date"
          />
        </div>
      )}

      {/* 6. Extra Filters */}
      {extraFilters}

      {/* 7. Clear / Reset Filters Button */}
      <button
        onClick={handleClear}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-xs ml-auto"
        title="Reset all filters and scope"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};
