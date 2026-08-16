import React, { useState } from 'react';
import { Copy, Check, ShieldAlert, Key, Terminal, ArrowRight, X, Sparkles } from 'lucide-react';

export interface ApiKeyRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  planName?: string;
  quotaDisplay?: string;
  windowHours?: number;
}

export const ApiKeyRevealModal: React.FC<ApiKeyRevealModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  planName = 'Claude Max',
  quotaDisplay,
  windowHours = 5,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen || !apiKey) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleCopyEnv = () => {
    const envText = `export ANTHROPIC_BASE_URL="https://lightningapi.pro"\nexport ANTHROPIC_AUTH_TOKEN="${apiKey}"`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-border rounded-panel w-full max-w-xl shadow-2xl overflow-hidden font-sans space-y-0 relative">
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>{planName} Activated</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Your API Key is Ready! 🎉</h2>
            {quotaDisplay && (
              <p className="text-xs text-violet-100 font-mono">
                Allocated Quota: {quotaDisplay} (Rolling every {windowHours}h)
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* CRITICAL SECURITY WARNING NOTICE */}
          <div className="p-4 rounded-panel bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-700">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>SHOWED ONLY ONCE — STORE IN A SAFE PLACE</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900">
              For your account protection and security, <strong>this full API key code will only be displayed once</strong>. Please copy it immediately and store it in a secure password manager or environment file. We do not store plaintext keys and cannot recover this code for you afterwards.
            </p>
          </div>

          {/* Raw API Key Display Box */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-violet-600" />
              <span>Your Secret API Key:</span>
            </label>

            <div className="flex items-center gap-2 p-3 bg-bg border-2 border-violet-500/40 rounded-control focus-within:border-violet-600 transition-all">
              <input
                type="text"
                readOnly
                value={apiKey}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent font-mono text-xs sm:text-sm font-bold text-fg tracking-wide focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyKey}
                className={`px-4 py-2 rounded-control font-bold text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-4 bg-card border border-border rounded-panel space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-fg flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                <span>Instant Auto-Configuration</span>
              </span>
              <button
                onClick={handleCopyCli}
                className="text-[11px] font-mono text-violet-600 hover:underline flex items-center gap-1"
              >
                {copiedCli ? 'Command Copied!' : 'Copy Command'}
              </button>
            </div>

            <p className="text-[11px] text-muted">
              Run our interactive CLI in your terminal to automatically connect Cursor, Claude Code, Cline, Roo Code, or Continue:
            </p>

            <div className="p-2.5 bg-slate-900 text-slate-100 rounded-control font-mono text-xs flex items-center justify-between">
              <code>npx lightningdeals</code>
              <button
                onClick={handleCopyCli}
                className="text-slate-400 hover:text-white p-1"
                title="Copy CLI command"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Confirmation Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleCopyEnv}
              className="w-full sm:w-auto text-xs font-mono text-muted hover:text-fg underline py-2 text-center"
            >
              {copiedEnv ? '✓ Env export copied!' : 'Copy Shell Export'}
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-control bg-fg text-bg hover:bg-fg/90 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>I Have Safely Copied My Key</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
