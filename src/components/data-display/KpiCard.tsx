import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number | null | undefined;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
}) => {
  const displayValue = value === null || value === undefined || value === '' ? '--' : value;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`cockpit-card cockpit-card-hover p-5 rounded-xl border border-[#E5E5E5] bg-white relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-[#F5A800]">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#111111] font-sans">
          {displayValue}
        </span>
        {trend && displayValue !== '--' && (
          <span
            className={`text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </motion.div>
  );
};

