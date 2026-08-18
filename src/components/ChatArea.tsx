import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Layers, 
  BarChart2,
  Terminal,
  Activity,
  Calendar,
  Download,
  Filter,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, GA4Property } from '../types';
import { AnalyticsCharts } from './AnalyticsCharts';
import { DataTable } from './DataTable';
import { KPICards } from './KPICards';
import { MCPProtocolAccordion } from './MCPProtocolAccordion';
import { QuickPrompts } from './QuickPrompts';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentProperty: GA4Property | null;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onOpenQueryBuilder: () => void;
  onOpenAuthModal?: () => void;
  isAuthenticated?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentProperty,
  isLoading,
  onSendMessage,
  onOpenQueryBuilder,
  onOpenAuthModal,
  isAuthenticated = false
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Render formatted assistant markdown
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-slate-700 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-bold text-slate-900 text-base mt-3 mb-1.5 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="font-bold text-slate-900 text-lg mt-4 mb-2">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const clean = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-blue-600 mt-1 shrink-0 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ 
                  __html: clean.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>')
                }} />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{
              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>')
            }} />
          );
        })}
      </div>
    );
  };

  const propName = currentProperty?.displayName || 'Google Analytics 4';

  return (
    <section className="flex-1 flex flex-col bg-white relative overflow-hidden h-full">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isAuthenticated && onOpenAuthModal && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Connect your Google Analytics Account
                </div>
                <p className="text-xs text-blue-700">
                  Sign in with Google to query and explore your live GA4 properties and real-time metrics with zero sample data.
                </p>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0 cursor-pointer transition-colors"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <QuickPrompts 
              onSelectPrompt={onSendMessage} 
              propertyName={propName} 
            />
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-2 ${
                  msg.role === 'user'
                    ? 'max-w-2xl self-start'
                    : 'max-w-4xl self-end items-end w-full'
                } animate-fadeIn`}
              >
                {/* Role Header indicator */}
                <div className={`flex items-center gap-2 text-xs font-semibold tracking-wider ${
                  msg.role === 'user' ? 'text-slate-400' : 'text-slate-400 self-start'
                }`}>
                  {msg.role === 'user' ? (
                    <>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      USER
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      ASSISTANT
                      {msg.propertyContext && (
                        <span className="font-normal text-slate-400">
                          • {msg.propertyContext.name}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Message Box */}
                <div
                  className={`w-full ${
                    msg.role === 'user'
                      ? 'bg-slate-100 p-4 rounded-2xl rounded-tl-none text-sm text-slate-700 leading-relaxed shadow-xs'
                      : 'bg-white border border-slate-200 p-5 rounded-2xl rounded-tr-none shadow-sm text-sm text-slate-700'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800 font-medium">
                      {msg.content}
                    </p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}

                  {/* KPI Cards */}
                  {msg.kpis && msg.kpis.length > 0 && (
                    <KPICards kpis={msg.kpis} />
                  )}

                  {/* Visual Chart */}
                  {msg.chart && (
                    <AnalyticsCharts config={msg.chart} />
                  )}

                  {/* Data Table */}
                  {msg.tableData && msg.tableData.rows.length > 0 && (
                    <DataTable data={msg.tableData} />
                  )}

                  {/* MCP Tool Call Logs Accordion */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <MCPProtocolAccordion toolCalls={msg.toolCalls} />
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-2 max-w-4xl self-end items-end w-full animate-pulse">
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold self-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                QUERYING GA4 MCP SERVER...
              </div>
              <div className="w-full bg-white border border-slate-200 p-5 rounded-2xl rounded-tr-none shadow-xs space-y-3">
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Main Input Box */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-xs"
          >
            <textarea
              ref={textareaRef}
              id="chat-input-textarea"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask a question about your GA4 data in ${propName}...`}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-hidden text-sm px-3 text-slate-900 resize-none max-h-32 placeholder-slate-400 font-normal"
            />
            <button
              type="submit"
              id="chat-send-btn"
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Action Footer Buttons */}
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <button
              type="button"
              onClick={() => onSendMessage('Compare active users and sessions between this month vs last month')}
              className="hover:text-blue-600 transition-colors"
            >
              Compare Periods
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => onSendMessage('Show top 10 landing pages with views, users, and average session duration')}
              className="hover:text-blue-600 transition-colors"
            >
              Top Landing Pages
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={onOpenQueryBuilder}
              className="hover:text-blue-600 transition-colors"
            >
              Query Builder
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
