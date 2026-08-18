import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Globe, 
  ShoppingBag, 
  Activity, 
  SlidersHorizontal,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { GA4Property } from '../types';

interface SidebarProps {
  onNewChat: () => void;
  onSelectPrompt: (promptText: string) => void;
  currentProperty: GA4Property | null;
  onOpenQueryBuilder: () => void;
  onOpenMCPModal: () => void;
  onOpenAuthModal: () => void;
  isSidebarOpen: boolean;
  onCloseSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNewChat,
  onSelectPrompt,
  currentProperty,
  onOpenQueryBuilder,
  onOpenMCPModal,
  onOpenAuthModal,
  isSidebarOpen,
  onCloseSidebar,
}) => {
  const recentExplorations = [
    {
      title: 'Traffic Source Breakdown',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      query: 'Break down sessions and conversions by Default Channel Group (Organic, Paid, Direct, Referral)'
    },
    {
      title: 'Real-time Active Pulse',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      query: 'Who is on the site right now in real-time? Show minute-by-minute active users.'
    },
    {
      title: '30-Day User Trend',
      icon: <Users className="w-4 h-4 text-indigo-600" />,
      query: 'Show daily active users, sessions, and screen pageviews for the last 30 days.'
    },
    {
      title: 'Top Countries & Revenue',
      icon: <Globe className="w-4 h-4 text-amber-600" />,
      query: 'What are our top 10 countries by active users and total revenue?'
    },
    {
      title: 'Mobile vs Desktop Conversion',
      icon: <ShoppingBag className="w-4 h-4 text-purple-600" />,
      query: 'Compare desktop, mobile, and tablet users, bounce rates, and conversion metrics.'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={onCloseSidebar} 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20 md:hidden"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-20
        w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0
        transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* New Query Button */}
        <div className="p-4 border-b border-slate-200 bg-white/70">
          <button
            id="sidebar-new-query-btn"
            onClick={() => {
              onNewChat();
              onCloseSidebar?.();
            }}
            className="w-full py-2 px-4 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            New Query
          </button>
        </div>

        {/* Explorations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 mb-2 mt-2">
            Preset Explorations
          </p>

          {recentExplorations.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectPrompt(item.query);
                onCloseSidebar?.();
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md text-sm font-medium transition-colors group"
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 mb-2">
              Power Tools
            </p>

            <button
              onClick={() => {
                onOpenQueryBuilder();
                onCloseSidebar?.();
              }}
              className="w-full text-left flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-200/70 rounded-md text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Visual Query Builder</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onOpenMCPModal();
                onCloseSidebar?.();
              }}
              className="w-full text-left flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-200/70 rounded-md text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>MCP Protocol Inspector</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onOpenAuthModal();
                onCloseSidebar?.();
              }}
              className="w-full text-left flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-200/70 rounded-md text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Connect Your Own App</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 bg-white/50 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>MCP Server v2024-11</span>
          </div>
          <span className="text-slate-400">GA4 Data API</span>
        </div>
      </aside>
    </>
  );
};
