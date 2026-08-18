import React from 'react';
import { 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Globe2, 
  DollarSign, 
  ArrowRight
} from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  propertyName: string;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, propertyName }) => {
  const promptGroups = [
    {
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      title: 'Real-time & Overview',
      prompts: [
        'How many active users are on the site right now in real-time?',
        'Show daily active users and total sessions for the last 30 days',
        'What are our top 10 most visited pages and landing pages?'
      ]
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      title: 'Acquisition & Channels',
      prompts: [
        'Break down sessions and conversions by Default Channel Group',
        'Compare Google Organic Search vs Paid CPC performance',
        'Which referral sources bring the highest average engagement time?'
      ]
    },
    {
      icon: <DollarSign className="w-4 h-4 text-amber-600" />,
      title: 'Conversions & Revenue',
      prompts: [
        'Show key events (conversions) and total revenue over the last 30 days',
        'What is our overall conversion rate and bounce rate by device?',
        'Compare mobile vs desktop conversion velocity and revenue'
      ]
    },
    {
      icon: <Globe2 className="w-4 h-4 text-purple-600" />,
      title: 'Audience & Geography',
      prompts: [
        'What are our top 10 countries by active users and revenue?',
        'Break down desktop, mobile, and tablet users with bounce rates',
        'Show city-level traffic distribution for our top country'
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Ready to query GA4 via MCP Server
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          What would you like to explore in <span className="text-blue-600">{propertyName}</span>?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Ask questions in natural language. The GA4 Insight Engine converts them into precise dimensions, metrics, and interactive charts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promptGroups.map((group, gIdx) => (
          <div 
            key={gIdx} 
            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              {group.icon}
              {group.title}
            </div>

            <div className="space-y-1.5">
              {group.prompts.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onSelectPrompt(p)}
                  className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 text-xs font-medium transition-colors flex items-center justify-between group shadow-2xs"
                >
                  <span className="truncate mr-2">{p}</span>
                  <span className="text-slate-400 group-hover:text-blue-600 text-[11px] shrink-0 font-semibold">
                    Run →
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
