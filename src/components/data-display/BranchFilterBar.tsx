import React from 'react';
import { Search, Calendar, RotateCcw } from 'lucide-react';

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
  const handleClear = () => {
    if (onSearchChange) onSearchChange('');
    if (onStatusChange) onStatusChange('');
    if (onDateChange) onDateChange('', '');
    if (onReset) onReset();
  };

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 mb-6 flex flex-wrap items-center gap-3 text-xs shadow-sm ${className}`}
    >
      {/* Search Box */}
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
