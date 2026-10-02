import React from 'react';

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => <div className={`animate-pulse bg-zinc-200/80 rounded ${className}`} style={style} />;

export const SkeletonKpiCard: React.FC = () => (
  <div className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white">
    <div className="flex justify-between items-start mb-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-24 mb-2" />
    <Skeleton className="h-3 w-36" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
    <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-zinc-50">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    <div className="p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white">
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="h-64 flex items-end justify-between gap-3 pt-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full rounded-t-md"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading records...' }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 text-zinc-500">
    <div className="w-8 h-8 border-2 border-[#F5A800] border-t-transparent rounded-full animate-spin" />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

