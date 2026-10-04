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
          className={`flex-1 transition-all duration-300 p-4 md:p-6 lg:p-8 min-w-0 flex flex-col justify-between ${
            collapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {children || <Outlet />}
          </div>

          <footer className="max-w-7xl mx-auto w-full pt-8 mt-12 border-t border-[#E5E5E5] text-[11px] text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span>Titan Auto Commercial Platform © 2026</span>
              <span className="mx-2">•</span>
              <span>Ashok Leyland & Tata Commercial Franchise Network</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-600">
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Titan Auto Privacy Policy: Personal customer data, VIN numbers, and financial details are protected under applicable Indian data privacy regulations. Data is strictly processed for vehicle transactions, insurance, and service fulfillment."); }} className="hover:text-zinc-900 underline">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Titan Auto Commercial Terms: Quotations, GST invoices, vehicle bookings, and warranty terms are subject to dealership agreement and vehicle manufacturer policies."); }} className="hover:text-zinc-900 underline">
                Terms of Service
              </a>
              <span>•</span>
              <span className="text-zinc-400">GSTIN Registered Dealerships</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

