import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/app/providers/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-zinc-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#F5A800] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Initializing Titan Operations Platform...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col font-sans">
      <Header onToggleSidebar={() => setMobileOpen(!mobileOpen)} />

      <div className="flex flex-1 pt-16">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <main
          className={`flex-1 transition-all duration-300 p-4 md:p-6 lg:p-8 min-w-0 ${
            collapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

