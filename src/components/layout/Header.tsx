import React from 'react';
import { ScopeSelector } from './ScopeSelector';
import { NotificationPanel } from './NotificationPanel';
import { UserMenu } from './UserMenu';
import { Search, HelpCircle, ShieldAlert, Menu } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { ROLE_LABELS } from '@/types/roles';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { activeRole } = useAuth();

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
        <div className="hidden md:flex items-center relative ml-4">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search VIN, Customer, Invoice, Service Job..."
            className="w-64 lg:w-80 h-9 pl-9 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800] transition-all"
          />
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

