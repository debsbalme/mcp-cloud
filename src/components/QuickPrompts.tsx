import React from 'react';
import { 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Globe2, 
  DollarSign, 
  ArrowRight,
  BarChart2
} from 'lucide-react';
import { TrkknLogo } from './TrkknLogo';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  propertyName: string;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, propertyName }) => {
  const promptGroups = [
    {
      icon: <Activity className="w-4 h-4 text-cyan-600" />,
      title: 'Real-time & Live Activity',
      prompts: [
        'How many active users are on the site right now in real-time?',
        'Show minute-by-minute active users for the last 30 minutes',
        'What are our top 10 most visited pages and landing pages?'
      ]
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      title: 'Acquisition & Channel Growth',
      prompts: [
        'Break down sessions and conversions by Default Channel Group',
        'Compare Google Organic Search vs Paid CPC performance',
        'Which referral sources bring the highest average engagement time?'
      ]
    },
    {
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      title: 'Conversions & Value Delivery',
      prompts: [
        'Show key events (conversions) and total revenue over the last 30 days',
        'What is our overall conversion rate and bounce rate by device?',
        'Compare mobile vs desktop conversion velocity and revenue'
      ]
    },
    {
      icon: <Globe2 className="w-4 h-4 text-indigo-600" />,
      title: 'Audience & Regional Insights',
      prompts: [
        'What are our top 10 countries by active users and revenue?',
        'Break down desktop, mobile, and tablet users with bounce rates',
        'Show city-level traffic distribution for our top country'
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8 space-y-4 flex flex-col items-center">
        {/* Main Brand Logo Header */}
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 inline-flex items-center justify-center">
          <TrkknLogo variant="full" size="lg" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span>Enterprise Intelligence</span>
          <span className="text-slate-400">•</span>
          <span className="text-cyan-300">GA4 MCP Active</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Analytics for <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{propertyName}</span>
        </h2>
        
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Ask questions in natural language. Powered by TRKKN's enterprise GA4 framework and Model Context Protocol to fetch verified dimensions, metrics, and interactive charts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promptGroups.map((group, gIdx) => (
          <div 
            key={gIdx} 
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-sm transition-all space-y-2.5 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <span className="p-1 rounded-md bg-slate-100">{group.icon}</span>
              {group.title}
            </div>

            <div className="space-y-1.5">
              {group.prompts.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onSelectPrompt(p)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/70 hover:border-blue-200 text-xs font-medium transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate mr-2 font-medium">{p}</span>
                  <span className="text-slate-400 group-hover:text-blue-600 text-[11px] shrink-0 font-bold flex items-center gap-0.5">
                    Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
