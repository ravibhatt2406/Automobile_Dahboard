import React from 'react';
import { FileQuestion, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A800] mb-4 shadow-xs">
        <FileQuestion className="w-8 h-8 text-[#F5A800]" />
      </div>
      <h2 className="text-2xl font-bold text-[#111111] mb-2">Page Not Found (404)</h2>
      <p className="text-zinc-500 max-w-md text-sm mb-6 leading-relaxed">
        The requested resource or page location does not exist on this automobile franchise platform.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold text-sm rounded-lg transition-colors shadow-xs"
      >
        <Home className="w-4 h-4" />
        Return to Overview
      </button>
    </div>
  );
};

