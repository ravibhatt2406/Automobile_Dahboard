import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Forbidden: React.FC<{ message?: string }> = ({
  message = "You don't have permission to view this page.",
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[#111111] mb-2">Access Denied (403)</h2>
      <p className="text-zinc-500 max-w-md text-sm mb-6 leading-relaxed">{message}</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-white text-sm font-semibold rounded-lg border border-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </button>
    </div>
  );
};

