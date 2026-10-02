import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center text-center p-8 rounded-xl cockpit-card bg-white border border-[#E5E5E5] my-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 mb-4 shadow-xs">
        <Icon className="w-7 h-7 text-[#F5A800]" />
      </div>

      <h3 className="text-base font-bold text-[#111111] tracking-tight mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-500 max-w-md mb-5 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#111111] hover:bg-black text-[#F5A800] font-semibold text-xs transition-colors shadow-xs active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

