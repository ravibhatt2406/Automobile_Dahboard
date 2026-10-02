import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface SalesAnalyticsChartProps {
  data?: { month: string; value: number }[];
  title?: string;
}

export const SalesAnalyticsChart: React.FC<SalesAnalyticsChartProps> = ({
  data = [],
  title = 'Sales Revenue Performance',
}) => {
  const hasData = data && data.length > 0;

  return (
    <div className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F5A800]" />
            {title}
          </h3>
          <p className="text-xs text-zinc-500">Monthly aggregated commercial sales volume</p>
        </div>
        <span className="text-xs font-mono px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-600">
          Real-time API
        </span>
      </div>

      <div className="w-full h-64 relative flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A800" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F5A800" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
              <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#F5A800"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#amberGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
              <BarChart3 className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-800">No sales data available</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Connect to the backend database to view real-time sales trend analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

