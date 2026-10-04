import React, { useState, useMemo } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SkeletonTable } from '@/components/feedback/LoadingState';
import { ChevronLeft, ChevronRight, Inbox, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records available in the database for this view.',
  onEmptyAction,
  emptyActionLabel,
  page = 1,
  pageSize = 10,
  totalPages,
  onPageChange,
  searchable = true,
  searchPlaceholder = 'Search records...',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(page);

  // Ensure data is always an array
  const safeData = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).data)) return (data as any).data;
      if (Array.isArray((data as any).items)) return (data as any).items;
    }
    return [];
  }, [data]);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return safeData;
    const term = searchTerm.toLowerCase();
    return safeData.filter((row: T) =>
      row && typeof row === 'object' && Object.values(row).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [safeData, searchTerm]);

  // Sort Filter
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const comp = valA < valB ? -1 : 1;
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnKey?: keyof T) => {
    if (!columnKey) return;
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const computedTotalPages = totalPages || Math.ceil((sortedData.length || 1) / pageSize);
  const paginatedData = onPageChange
    ? sortedData
    : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <SkeletonTable rows={5} />;
  }

  return (
    <div className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-xs space-y-0">
      {/* Search Bar Header */}
      {searchable && safeData.length > 0 && (
        <div className="p-3.5 border-b border-[#E5E5E5] bg-zinc-50/70 flex items-center justify-between gap-3">
          <div className="relative flex items-center flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800]"
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Showing {sortedData.length} records
          </span>
        </div>
      )}

      {paginatedData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={Inbox}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-[#E5E5E5] font-mono">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => col.accessorKey && handleSort(col.accessorKey)}
                    className={`px-4 py-3.5 font-semibold select-none ${
                      col.accessorKey ? 'cursor-pointer hover:text-zinc-900' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.accessorKey && (
                        <span className="text-zinc-400">
                          {sortColumn === col.accessorKey ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#F5A800]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#F5A800]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] font-sans">
              {paginatedData.map((row: T, rowIdx: number) => (
                <tr key={row?.id ?? rowIdx} className="hover:bg-zinc-50/80 transition-colors">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3.5 text-zinc-900 font-medium ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey && row
                        ? String(row[col.accessorKey] ?? '--')
                        : '--'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {computedTotalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/70 border-t border-[#E5E5E5] text-xs text-zinc-500 font-mono">
          <span>
            Page <strong className="text-zinc-900">{onPageChange ? page : currentPage}</strong> of{' '}
            <strong className="text-zinc-900">{computedTotalPages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={(onPageChange ? page : currentPage) <= 1}
              onClick={() => {
                if (onPageChange) onPageChange(page - 1);
                else setCurrentPage((p) => p - 1);
              }}
              className="p-1 rounded bg-white border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 text-zinc-700 transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={(onPageChange ? page : currentPage) >= computedTotalPages}
              onClick={() => {
                if (onPageChange) onPageChange(page + 1);
                else setCurrentPage((p) => p + 1);
              }}
              className="p-1 rounded bg-white border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 text-zinc-700 transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

