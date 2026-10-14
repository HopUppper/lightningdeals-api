/**
 * LIGHTNINGAPI.PRO — CONTEXT-AWARE ACTIVITY & THINKING PANEL
 * Replaces generic streaming loaders with polished, live, task-grounded progress.
 * Shows active operation, expandable step timeline, and consequential action authorization.
 */

import React, { useState } from 'react';
import {
  Globe,
  Search,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Sparkles,
  FileText,
  UserCheck,
  ShieldAlert,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface StudioActivityEvent {
  id: string;
  type: string;
  stage: 'active' | 'completed' | 'waiting_approval' | 'failed' | 'cancelled';
  title: string;
  detail?: string;
  targetUrl?: string;
  timestamp: string;
}

interface ContextActivityPanelProps {
  activities?: StudioActivityEvent[];
  currentActivity?: StudioActivityEvent;
  isStreaming?: boolean;
  hasContent?: boolean;
  isDarkTheme?: boolean;
  onAuthorizeAction?: (confirmationId: string) => void;
  onRejectAction?: (confirmationId: string) => void;
}

export const ContextActivityPanel: React.FC<ContextActivityPanelProps> = ({
  activities = [],
  currentActivity,
  isStreaming = false,
  hasContent = false,
  isDarkTheme = true,
  onAuthorizeAction,
  onRejectAction,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Filter and deduplicate events
  const allEvents = activities.length > 0 ? activities : currentActivity ? [currentActivity] : [];
  if (allEvents.length === 0 && !isStreaming) return null;

  // Determine the active item to highlight
  const activeEvent = currentActivity || allEvents.find((e) => e.stage === 'active' || e.stage === 'waiting_approval');
  const completedEvents = allEvents.filter((e) => e.stage === 'completed' && e.id !== activeEvent?.id);
  const isAwaitingApproval = activeEvent?.stage === 'waiting_approval';

  // Helper to pick contextual icons
  const getActivityIcon = (type: string, stage: string) => {
    if (stage === 'waiting_approval') {
      return <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />;
    }
    if (stage === 'failed') {
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
    if (stage === 'active') {
      return <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />;
    }

    switch (type) {
      case 'opening_url':
      case 'inspecting_navigation':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'searching_web':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'deep_research_round':
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case 'checking_registration':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      case 'analyzing_form':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'generating_answer':
      case 'completed':
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  // 1. Post-generation collapsed state (when response has content and generation is finished)
  if (!isStreaming && hasContent) {
    return (
      <div className="mb-2 text-xs">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            isDarkTheme
              ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
          title="Inspect verified activity audit timeline"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-medium">
            {allEvents.length} activity {allEvents.length === 1 ? 'step' : 'steps'} verified
          </span>
          {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        {isExpanded && (
          <div
            className={`mt-2 p-3 rounded-xl border font-mono space-y-2 text-xs animate-in fade-in duration-150 ${
              isDarkTheme ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-800/40 flex items-center justify-between">
              <span>Task Execution Timeline</span>
              <span>100% Verified Operations</span>
            </div>
            {allEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center justify-between gap-2">
                    <span className="truncate">{evt.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {evt.detail && <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{evt.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Active streaming state or empty-content processing state
  return (
    <div
      className={`rounded-xl border p-3 mb-3 text-xs transition-all ${
        isAwaitingApproval
          ? isDarkTheme
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-amber-50 border-amber-300'
          : isDarkTheme
          ? 'bg-slate-900/80 border-violet-500/30 shadow-xs'
          : 'bg-violet-50/50 border-violet-200 shadow-xs'
      }`}
    >
      {/* Active Stage Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-violet-500/10 shrink-0">
            {getActivityIcon(activeEvent?.type || 'understanding_request', activeEvent?.stage || 'active')}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-200 dark:text-slate-100 truncate">
              {activeEvent?.title || 'Processing task in AI Chat Studio...'}
            </h4>
            {activeEvent?.detail && (
              <p className="text-slate-400 dark:text-slate-400 text-[11px] truncate mt-0.5 font-sans">
                {activeEvent.detail}
              </p>
            )}
          </div>
        </div>

        {/* Timeline Toggle */}
        {completedEvents.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md bg-slate-800/40 hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <span>{completedEvents.length} done</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Consequential Action Approval Card */}
      {isAwaitingApproval && (
        <div
          className={`mt-3 p-3 rounded-lg border flex flex-col gap-2.5 ${
            isDarkTheme ? 'bg-amber-950/40 border-amber-500/50' : 'bg-amber-100 border-amber-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-200">Customer Authorization Required</span>
              <p className="text-amber-300/90 text-[11px] mt-0.5 font-sans">
                The requested task requires executing a consequential action (e.g. form submission, order, or state modification).
                Execution is safely paused until you confirm.
              </p>
              {activeEvent?.targetUrl && (
                <div className="mt-1.5 font-mono text-[10px] text-amber-400/80 truncate">
                  Target: {activeEvent.targetUrl}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onAuthorizeAction?.(activeEvent?.id || '')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <span>Authorize &amp; Proceed</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onRejectAction?.(activeEvent?.id || '')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer transition"
            >
              Reject &amp; Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expanded Step Timeline */}
      {isExpanded && completedEvents.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 space-y-2 font-mono text-xs">
          {completedEvents.map((evt, idx) => (
            <div key={evt.id || idx} className="flex items-start gap-2 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-300">{evt.title}</span>
                {evt.detail && <p className="text-[11px] text-slate-400 font-sans mt-0.5">{evt.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
