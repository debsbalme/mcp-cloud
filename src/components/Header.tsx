import React from 'react';
import { 
  BarChart3, 
  ChevronDown, 
  Terminal, 
  SlidersHorizontal, 
  ShieldCheck, 
  User as UserIcon, 
  Plus, 
  Layers,
  Menu,
  Sparkles
} from 'lucide-react';
import { GA4Property, UserProfile } from '../types';

interface HeaderProps {
  currentProperty: GA4Property | null;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenPropertyModal: () => void;
  onOpenMCPModal: () => void;
  onOpenQueryBuilder: () => void;
  onNewChat: () => void;
  isLiveLoading?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProperty,
  user,
  onOpenAuthModal,
  onOpenPropertyModal,
  onOpenMCPModal,
  onOpenQueryBuilder,
  onNewChat,
  isLiveLoading = false,
  onToggleSidebar
}) => {
  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : user?.email ? user.email.substring(0, 2).toUpperCase() : 'GA';

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0 z-30">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-xs">
            <div className="w-4 h-4 bg-white rounded-full opacity-90 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <span>GA4 Insight Engine</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                MCP Server
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Property Selector */}
        <div className="relative">
          <button
            id="header-property-selector"
            onClick={onOpenPropertyModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs sm:text-sm font-medium transition-colors text-slate-800 group"
          >
            <span className="text-slate-500 font-normal hidden sm:inline">Property:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[220px]">
              {currentProperty ? currentProperty.displayName : 'Select GA4 Property'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </button>
        </div>

        {/* Quick Tools */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={onOpenQueryBuilder}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            Query Builder
          </button>
          <button
            onClick={onOpenMCPModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            MCP Tools
          </button>
        </div>

        <div className="h-7 w-[1px] bg-slate-200 hidden sm:block"></div>

        {/* User Auth Profile */}
        <button
          id="header-auth-btn"
          onClick={onOpenAuthModal}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
              {user ? (user.name || 'Connected User') : 'Sign In'}
            </p>
            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
              {user?.email || 'Google Analytics API'}
            </p>
          </div>

          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || 'User'} 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${user?.accessToken ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-blue-100 text-blue-700 border-blue-200'} border flex items-center justify-center font-bold text-xs sm:text-sm`}>
              {user ? initials : <ShieldCheck className="w-4 h-4" />}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};
