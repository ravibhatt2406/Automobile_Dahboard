import React, { useState, useEffect, useRef } from 'react';
import { ScopeSelector } from './ScopeSelector';
import { NotificationPanel } from './NotificationPanel';
import { UserMenu } from './UserMenu';
import {
  Search,
  HelpCircle,
  ShieldAlert,
  Menu,
  Loader2,
  X,
  User,
  Truck,
  ShoppingBag,
  FileText,
  DollarSign,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useScope } from '@/app/providers/ScopeContext';
import { ROLE_LABELS } from '@/types/roles';
import { Link, useNavigate } from 'react-router-dom';
import { searchService, SearchResultItem } from '@/services/search.service';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { activeRole } = useAuth();
  const { selectedBranchId, selectedFranchiseId } = useScope();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchService.globalSearch(
          query,
          selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
          selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        );
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedBranchId, selectedFranchiseId]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (url: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  const getResultIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'CUSTOMER':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'VEHICLE':
        return <Truck className="w-4 h-4 text-amber-500" />;
      case 'BOOKING':
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'QUOTATION':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'INVOICE':
        return <DollarSign className="w-4 h-4 text-rose-500" />;
      case 'SERVICE_JOB':
        return <Wrench className="w-4 h-4 text-indigo-500" />;
      default:
        return <Search className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <header className="h-16 cockpit-header fixed top-0 right-0 left-0 z-30 px-4 md:px-6 flex items-center justify-between border-b border-[#E5E5E5] bg-white">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#111111] flex items-center justify-center font-black text-[#F5A800] text-lg tracking-wider border border-zinc-800 shadow-sm group-hover:bg-black transition-colors">
            T
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black tracking-tight text-[#111111] uppercase">
              TITAN <span className="text-[#F5A800]">AUTO</span>
            </span>
            <span className="block text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
              Franchise Platform
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} className="hidden md:flex items-center relative ml-4">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
            placeholder="Search VIN, Customer, Invoice, Job Card..."
            className="w-64 lg:w-80 h-9 pl-9 pr-8 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800] transition-all"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin absolute right-3" />
          )}
          {!isSearching && query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-2.5 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Results Dropdown Popover */}
          {isOpen && (
            <div className="absolute top-11 left-0 w-80 lg:w-96 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2 border-b border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-500 bg-zinc-50">
                <span>Authorized Search Results</span>
                <span>{results.length} found</span>
              </div>

              {results.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F5A800]" />
                      <span>Searching database records...</span>
                    </div>
                  ) : (
                    <span>No records matching "{query}" within your permitted scope.</span>
                  )}
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                  {results.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelectResult(item.url)}
                      className="w-full text-left p-2.5 hover:bg-zinc-50 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-white border border-zinc-200 shrink-0">
                          {getResultIcon(item.type)}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                              {item.type.replace('_', ' ')}
                            </span>
                            {item.branchName && (
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1 rounded">
                                {item.branchName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center/Right Scope & Controls */}
      <div className="flex items-center gap-3">
        <ScopeSelector />

        {/* Active Scope Badge Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-[#F5A800]" />
          <span>Role: {ROLE_LABELS[activeRole]}</span>
        </div>

        <NotificationPanel />

        <button
          className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:flex"
          title="Documentation & Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <UserMenu />
      </div>
    </header>
  );
};
