import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Building, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const AccountTypeSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between p-4 lg:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center font-black text-[#F5A800] text-xl border border-zinc-800 shadow-sm">
            T
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#111111] uppercase">
              TITAN <span className="text-[#F5A800]">AUTO</span>
            </span>
            <span className="block text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
              Automotive Platform
            </span>
          </div>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          ← Back to Main Site
        </Link>
      </header>

      {/* Main Selection Area */}
      <main className="max-w-4xl mx-auto w-full my-auto py-12">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5A800] text-xs font-bold uppercase tracking-widest font-mono">
            <Sparkles className="w-3.5 h-3.5" /> ACCOUNT ACCESS SELECTION
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
            Welcome to Titan Auto
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto font-medium">
            Choose how you access the platform. How are you using Titan Auto?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: CUSTOMER */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate('/login/customer')}
            className="group cursor-pointer rounded-3xl bg-white border border-[#E5E5E5] p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-6 relative z-10">
              {/* Circular Icon Container */}
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-[#F5A800] group-hover:bg-[#F5A800] group-hover:text-[#111111] transition-all shadow-md">
                <User className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-widest font-mono">
                  CLIENT PORTAL
                </span>
                <h2 className="text-2xl font-black text-[#111111] mt-1 group-hover:text-[#F5A800] transition-colors">
                  CUSTOMER
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed mt-3">
                  For customers managing their vehicles, bookings and service.
                </p>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-[#E5E5E5] flex items-center justify-between text-xs font-bold text-[#111111] group-hover:text-[#F5A800] transition-colors">
              <span>Continue to Customer Portal</span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-[#111111] text-zinc-900 group-hover:text-[#F5A800] flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          {/* Card 2: BRANCH / ORGANIZATION */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate('/login/organization')}
            className="group cursor-pointer rounded-3xl bg-[#111111] text-white border border-zinc-800 p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:border-[#F5A800]/50 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-6 relative z-10">
              {/* Circular Icon Container */}
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-[#F5A800] group-hover:bg-[#F5A800] group-hover:text-[#111111] transition-all shadow-md">
                <Building className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-widest font-mono">
                  ENTERPRISE OPERATIONS
                </span>
                <h2 className="text-2xl font-black text-white mt-1 group-hover:text-[#F5A800] transition-colors">
                  BRANCH / ORGANIZATION
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-3">
                  For franchise, branch, sales, service and administrative users.
                </p>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-white group-hover:text-[#F5A800] transition-colors">
              <span>Continue to Operations Login</span>
              <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-[#F5A800] text-white group-hover:text-[#111111] flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full py-4 text-center text-xs text-zinc-500 font-mono">
        © {new Date().getFullYear()} Titan Automotive Operations Platform. Secure Access Control.
      </footer>
    </div>
  );
};
