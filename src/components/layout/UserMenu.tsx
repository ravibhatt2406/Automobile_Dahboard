import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { UserRole, ROLE_LABELS } from '@/types/roles';
import { LogOut, Settings, Shield, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { user, activeRole, allowedSwitchRoles, setActiveRole, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    const success = setActiveRole(role);
    if (success) {
      setIsOpen(false);
      navigate('/dashboard');
    }
  };

  // Check if current user has authorized switch targets
  const canSwitchWorkspace = allowedSwitchRoles && allowedSwitchRoles.length > 1;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors"
      >
        <div className="w-7 h-7 rounded-md bg-[#111111] text-[#F5A800] flex items-center justify-center font-bold text-xs shadow-xs">
          {user?.firstName?.[0] || 'U'}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-zinc-900 leading-none">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 leading-none">
            {ROLE_LABELS[activeRole]}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 cockpit-card rounded-xl border border-[#E5E5E5] shadow-lg z-50 overflow-hidden bg-white"
            >
              <div className="p-3 bg-zinc-50 border-b border-[#E5E5E5]">
                <p className="text-xs font-semibold text-zinc-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono truncate">{user?.email}</p>
                {user?.assignedBranchName && (
                  <p className="text-[10px] text-amber-600 font-mono mt-0.5 truncate">
                    📍 {user.assignedBranchName}
                  </p>
                )}
              </div>

              {/* Workspace Switcher ONLY shown if user has authorized lower/assigned switch targets */}
              {canSwitchWorkspace && (
                <div className="p-2 border-b border-[#E5E5E5]">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 block mb-1.5 flex items-center gap-1 font-mono">
                    <Shield className="w-3 h-3 text-[#F5A800]" /> Switch Workspace
                  </span>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                    {allowedSwitchRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          activeRole === role
                            ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <span>{ROLE_LABELS[role]}</span>
                        {activeRole === role && <Check className="w-3.5 h-3.5 text-[#F5A800]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-500" />
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
