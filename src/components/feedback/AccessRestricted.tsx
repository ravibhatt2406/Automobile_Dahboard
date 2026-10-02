import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

interface AccessRestrictedProps {
  reason?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ reason }) => {
  const navigate = useNavigate();
  const { activeRole } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full cockpit-card p-8 rounded-3xl border border-rose-200 bg-white text-center shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest font-mono">
            AUTHORIZATION DENIED
          </span>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            {reason || "You don't have permission to access this workspace."}
          </p>
          <p className="text-[11px] text-zinc-400 font-mono pt-1">
            Current Active Role: <span className="font-bold text-zinc-700">{activeRole}</span>
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
