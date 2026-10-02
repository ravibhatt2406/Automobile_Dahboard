import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Building2, PieChart } from 'lucide-react';

interface BranchPerformanceChartProps {
  data?: { branch: string; sales: number }[];
}

export const BranchPerformanceChart: React.FC<BranchPerformanceChartProps> = ({ data = [] }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F5A800]" />
            Branch Performance Ranking
          </h3>
          <p className="text-xs text-zinc-500">Total units delivered per dealership location</p>
        </div>
      </div>

      <div className="w-full h-64 relative flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
              <XAxis dataKey="branch" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E5E5',
                  borderRadius: '0.5rem',
                  color: '#111111',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="sales" fill="#F5A800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
              <PieChart className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-800">No branch performance metrics</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              No dealership branch records are currently available to compute metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

