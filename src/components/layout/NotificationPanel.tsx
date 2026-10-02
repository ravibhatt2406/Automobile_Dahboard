import React, { useState } from 'react';
import { Bell, Check, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications: Array<{ id: string; title: string; text: string }> = [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5A800] animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 cockpit-card rounded-xl border border-[#E5E5E5] shadow-lg z-50 overflow-hidden bg-white"
            >
              <div className="p-3 bg-zinc-50 border-b border-[#E5E5E5] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Notifications
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">0 Unread</span>
              </div>

              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto mb-2">
                  <Inbox className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-xs font-medium text-zinc-800">No new notifications</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  You're all caught up with your operation alerts.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

