import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { ChartVisualizationConfig } from '../types';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

interface AnalyticsChartsProps {
  config: ChartVisualizationConfig;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ config }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>(config.type === 'pie' ? 'bar' : config.type);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(config.dataKeys.map(d => d.key));

  if (!config.data || config.data.length === 0) {
    return null;
  }

  const toggleKey = (key: string) => {
    if (visibleKeys.includes(key)) {
      if (visibleKeys.length > 1) {
        setVisibleKeys(visibleKeys.filter(k => k !== key));
      }
    } else {
      setVisibleKeys([...visibleKeys, key]);
    }
  };

  const formatXAxis = (tickItem: any) => {
    if (typeof tickItem === 'string' && tickItem.length === 8 && !isNaN(Number(tickItem))) {
      const m = tickItem.substring(4, 6);
      const d = tickItem.substring(6, 8);
      return `${m}/${d}`;
    }
    if (typeof tickItem === 'string' && tickItem.length > 16) {
      return tickItem.substring(0, 15) + '...';
    }
    return tickItem;
  };

  const formatTooltipValue = (value: any, name: any) => {
    if (typeof value === 'number') {
      if (name.toLowerCase().includes('revenue')) {
        return [`$${value.toLocaleString()}`, name];
      }
      if (name.toLowerCase().includes('rate')) {
        return [`${(value * 100).toFixed(1)}%`, name];
      }
      return [value.toLocaleString(), name];
    }
    return [value, name];
  };

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            {config.title || 'GA4 Performance Visualizer'}
          </h4>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              chartType === 'line' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Line Trend Chart"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              chartType === 'bar' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              chartType === 'area' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Area Chart"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Selector Pills */}
      <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
        <span className="text-[11px] text-slate-500 font-medium">Active Metrics:</span>
        {config.dataKeys.map((dk, idx) => {
          const isActive = visibleKeys.includes(dk.key);
          const color = dk.color || colors[idx % colors.length];
          return (
            <button
              key={dk.key}
              onClick={() => toggleKey(dk.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-all ${
                isActive
                  ? 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: isActive ? color : '#94a3b8' }} 
              />
              {dk.label}
            </button>
          );
        })}
      </div>

      {/* Responsive Chart Stage */}
      <div className="w-full h-64 sm:h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey={config.xAxisKey} tickFormatter={formatXAxis} stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              {config.dataKeys.filter(dk => visibleKeys.includes(dk.key)).map((dk, idx) => (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label}
                  stroke={dk.color || colors[idx % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1, fill: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey={config.xAxisKey} tickFormatter={formatXAxis} stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              {config.dataKeys.filter(dk => visibleKeys.includes(dk.key)).map((dk, idx) => (
                <Bar
                  key={dk.key}
                  dataKey={dk.key}
                  name={dk.label}
                  fill={dk.color || colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <AreaChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey={config.xAxisKey} tickFormatter={formatXAxis} stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              {config.dataKeys.filter(dk => visibleKeys.includes(dk.key)).map((dk, idx) => (
                <Area
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label}
                  stroke={dk.color || colors[idx % colors.length]}
                  fill={dk.color || colors[idx % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
