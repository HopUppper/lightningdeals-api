import React, { useState } from 'react';
import {
  Globe,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  Camera,
  ArrowRight,
  Eye,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export interface BrowserStepItem {
  stepIndex: number;
  action: 'navigate' | 'click' | 'fill' | 'select' | 'scroll' | 'screenshot' | 'inspect';
  target?: string;
  value?: string;
  isConsequential: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'requires_confirmation';
  result?: string;
  screenshotBase64?: string;
  error?: string;
  timestamp: string;
}

export interface BrowserConfirmationData {
  confirmationId: string;
  sessionId: string;
  stepIndex: number;
  action: string;
  target?: string;
  value?: string;
  url: string;
  warningSummary: string;
  createdAt: string;
}

export interface BrowserSessionData {
  sessionId: string;
  userId: string;
  conversationId: string;
  createdAt: string;
  currentUrl: string;
  pageTitle: string;
  status: 'idle' | 'running' | 'waiting_confirmation' | 'completed' | 'cancelled' | 'error';
  steps: BrowserStepItem[];
  pendingConfirmation?: BrowserConfirmationData;
  lastScreenshot?: string;
}

export interface BrowserCapabilityData {
  available: boolean;
  engine: 'remote_endpoint' | 'local_binary' | 'unavailable';
  details: string;
  executablePath?: string;
  remoteEndpoint?: string;
}

interface BrowserTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: BrowserSessionData | null;
  capability: BrowserCapabilityData | null;
  onNavigate: (url: string) => Promise<void>;
  onInspect: () => Promise<void>;
  onScreenshot: () => Promise<void>;
  onConfirmAction: (confirmationId: string, approved: boolean) => Promise<void>;
  onCancelSession: () => Promise<void>;
  isDarkTheme?: boolean;
}

export const BrowserTaskModal: React.FC<BrowserTaskModalProps> = ({
  isOpen,
  onClose,
  session,
  capability,
  onNavigate,
  onInspect,
  onScreenshot,
  onConfirmAction,
  onCancelSession,
  isDarkTheme = true,
}) => {
  const [navUrl, setNavUrl] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isOpen) return null;

  const c = {
    modalBg: isDarkTheme ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200',
    headerBg: isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200',
    cardBg: isDarkTheme ? 'bg-[#131A2B] border-slate-800' : 'bg-slate-50/80 border-slate-200',
    inputBg: isDarkTheme ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900',
    text: isDarkTheme ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDarkTheme ? 'text-slate-400' : 'text-slate-600',
    border: isDarkTheme ? 'border-slate-800' : 'border-slate-200',
  };

  const handleRunNavigate = async () => {
    if (!navUrl.trim()) return;
    setLoadingAction('navigate');
    try {
      await onNavigate(navUrl.trim());
      setNavUrl('');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className={`w-full max-w-4xl h-[90vh] max-h-[820px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${c.modalBg}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${c.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${c.text}`}>Studio Browser Workspace</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    capability?.available
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                  }`}
                >
                  {capability?.available ? capability.engine.replace('_', ' ') : 'Setup Required'}
                </span>
              </div>
              <p className={`text-xs ${c.textMuted}`}>
                Isolated session with SSRF boundary protection and consequential action gates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session && session.status === 'running' && (
              <button
                type="button"
                onClick={onCancelSession}
                className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Session</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Address Bar */}
        <div className={`px-4 py-3 border-b flex items-center gap-2 shrink-0 ${c.headerBg}`}>
          <div className="flex-1 relative flex items-center">
            <Globe className={`w-4 h-4 absolute left-3 ${c.textMuted}`} />
            <input
              type="url"
              placeholder="Enter public URL to navigate (e.g. https://docs.anthropic.com)..."
              value={navUrl}
              onChange={(e) => setNavUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunNavigate()}
              className={`w-full pl-9 pr-24 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500 ${c.inputBg}`}
            />
            <button
              type="button"
              onClick={handleRunNavigate}
              disabled={!navUrl.trim() || loadingAction === 'navigate'}
              className="absolute right-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'navigate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Go</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onInspect}
              disabled={loadingAction === 'inspect'}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDarkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
              }`}
              title="Inspect accessible DOM elements"
            >
              {loadingAction === 'inspect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-blue-500" />}
              <span className="hidden sm:inline">Inspect</span>
            </button>

            <button
              type="button"
              onClick={onScreenshot}
              disabled={loadingAction === 'screenshot'}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDarkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
              }`}
              title="Capture viewport screenshot"
            >
              {loadingAction === 'screenshot' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-purple-500" />}
              <span className="hidden sm:inline">Snap</span>
            </button>
          </div>
        </div>

        {/* Consequential Action Confirmation Banner */}
        {session?.pendingConfirmation && (
          <div className="p-4 bg-amber-500/15 border-b border-amber-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 fill-current" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Consequential Action Requires Your Explicit Authorization
              </h4>
              <p className={`text-xs ${c.textMuted}`}>
                {session.pendingConfirmation.warningSummary}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onConfirmAction(session.pendingConfirmation!.confirmationId, true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorize & Execute Action</span>
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmAction(session.pendingConfirmation!.confirmationId, false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject & Abort</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Current Page Status Card */}
          <div className={`p-4 rounded-2xl border ${c.cardBg}`}>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-black/5 dark:border-white/5">
              <span className="font-semibold text-slate-400">Active Viewport</span>
              <span className="font-mono text-[11px] text-emerald-500">
                Status: {session?.status.toUpperCase() || 'IDLE'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="truncate">
                <p className="font-bold text-sm truncate">{session?.pageTitle || 'No page loaded'}</p>
                <p className={`text-xs font-mono truncate ${c.textMuted}`}>{session?.currentUrl || 'about:blank'}</p>
              </div>
              {session?.currentUrl && session.currentUrl !== 'about:blank' && (
                <a
                  href={session.currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-violet-500/10 text-violet-500 transition-colors"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Step Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Execution Timeline ({session?.steps.length || 0} Steps)
            </h4>

            {session?.steps && session.steps.length > 0 ? (
              <div className="space-y-2">
                {session.steps.map((st) => (
                  <div
                    key={st.stepIndex}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${c.cardBg}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {st.stepIndex}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase text-[10px] tracking-wide text-slate-400">
                            {st.action}
                          </span>
                          {st.isConsequential && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[9px] font-bold">
                              CONSEQUENTIAL
                            </span>
                          )}
                        </div>
                        <p className={`font-mono text-xs ${c.text}`}>{st.result || st.target || 'Action initiated'}</p>
                        {st.error && <p className="text-rose-500 text-[11px] font-mono">{st.error}</p>}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                        st.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : st.status === 'requires_confirmation'
                          ? 'bg-amber-500/15 text-amber-500 animate-pulse'
                          : st.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {st.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 rounded-2xl border text-center space-y-2 ${c.cardBg}`}>
                <Terminal className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <p className={`text-xs ${c.textMuted}`}>No browser actions recorded yet in this session.</p>
                <p className={`text-[11px] ${c.textMuted}`}>
                  Enter a URL above to begin safe, sandboxed web navigation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3 border-t flex items-center justify-between text-[11px] shrink-0 font-mono ${c.headerBg} ${c.textMuted}`}>
          <span>Protected by LightningAPI SSRF Firewall</span>
          <span>Session: {session?.sessionId || 'idle'}</span>
        </div>
      </div>
    </div>
  );
};
