import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, X, ArrowRight, Sparkles } from 'lucide-react';

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl p-6 sm:p-8 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5A800] text-xs font-bold uppercase tracking-widest font-mono">
              <Sparkles className="w-3.5 h-3.5" /> TITAN AUTO ACCESS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111]">
              Welcome to Titan Auto
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Choose how you access the platform. How are you using Titan Auto?
            </p>
          </div>

          {/* Two Large Circular Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1: CUSTOMER */}
            <div
              onClick={() => {
                onClose();
                navigate('/login/customer');
              }}
              className="group cursor-pointer rounded-2xl bg-white border border-[#E5E5E5] p-6 shadow-md hover:shadow-xl hover:border-amber-500 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F5A800] group-hover:bg-[#F5A800] group-hover:text-[#111111] transition-all">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-wider font-mono">
                    CLIENT PORTAL
                  </span>
                  <h3 className="text-lg font-black text-[#111111] mt-0.5 group-hover:text-[#F5A800] transition-colors">
                    CUSTOMER
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                    For customers managing their vehicles, bookings and service.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs font-bold text-[#111111] group-hover:text-[#F5A800]">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: BRANCH / ORGANIZATION */}
            <div
              onClick={() => {
                onClose();
                navigate('/login/organization');
              }}
              className="group cursor-pointer rounded-2xl bg-[#111111] text-white border border-zinc-800 p-6 shadow-md hover:shadow-xl hover:border-[#F5A800] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#F5A800] group-hover:bg-[#F5A800] group-hover:text-[#111111] transition-all">
                  <Building className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-wider font-mono">
                    ENTERPRISE OPERATIONS
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5 group-hover:text-[#F5A800] transition-colors">
                    BRANCH / ORGANIZATION
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                    For franchise, branch, sales, service and administrative users.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-white group-hover:text-[#F5A800]">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
