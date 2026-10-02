import React from 'react';

export type StatusVariant =
  | 'active'
  | 'available'
  | 'completed'
  | 'delivered'
  | 'won'
  | 'paid'
  | 'approved'
  | 'pending'
  | 'in_progress'
  | 'contacted'
  | 'scheduled'
  | 'reserved'
  | 'under_service'
  | 'waiting_parts'
  | 'inactive'
  | 'rejected'
  | 'cancelled'
  | 'lost'
  | 'overdue';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant, label, className = '' }) => {
  const key = (variant || status.toLowerCase()) as StatusVariant;

  let colorClasses = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  switch (key) {
    case 'active':
    case 'available':
    case 'completed':
    case 'delivered':
    case 'won':
    case 'paid':
    case 'approved':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      break;
    case 'pending':
    case 'in_progress':
    case 'contacted':
    case 'scheduled':
    case 'reserved':
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
      break;
    case 'under_service':
    case 'waiting_parts':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'inactive':
    case 'rejected':
    case 'cancelled':
    case 'lost':
    case 'overdue':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
      break;
  }

  const displayText = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize tracking-wide ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {displayText}
    </span>
  );
};

