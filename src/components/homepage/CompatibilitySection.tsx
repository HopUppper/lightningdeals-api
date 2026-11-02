import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Terminal, Copy, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IntegrationItem {
  name: string;
  category: string;
  protocol: string;
  howToConnect: string;
  status: 'Verified';
  notes: string;
  isFeatured?: boolean;
}

const VERIFIED_INTEGRATIONS: IntegrationItem[] = [
  {
    name: 'Lightningdeals CLI (1-Command Setup)',
    category: 'Official Universal Installer',
    protocol: 'Automated Environment & IDE Configuration',
    howToConnect: 'npx lightningdeals',
    status: 'Verified',
    notes: 'Configures Claude Code, Cursor, Codex, and VS Code automatically. Creates backups and tests connectivity.',
    isFeatured: true,
  },
  {
    name: 'Anthropic Official SDKs',
    category: 'TypeScript & Python',
    protocol: 'Native baseURL override',
    howToConnect: "Set baseURL: 'https://lightningapi.pro' in Anthropic() constructor",
    status: 'Verified',
    notes: 'Full support for streaming, messages, system prompts, and tool calling.',
  },
  {
    name: 'OpenAI Official SDKs',
    category: 'Python & Node.js',
    protocol: 'base_url parameter',
    howToConnect: "OpenAI(base_url='https://lightningapi.pro/v1', api_key='ld_live_...')",
    status: 'Verified',
    notes: 'Direct compatibility for chat completions, reasoning tokens (o1, o3-mini), and tool calling.',
  },
  {
    name: 'Claude Code CLI',
    category: 'Terminal Agent',
    protocol: 'Environment variables',
    howToConnect: 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"',
    status: 'Verified',
    notes: 'Runs natively with your ld_live_ key set as ANTHROPIC_API_KEY.',
  },
  {
    name: 'Cursor & Windsurf IDEs',
    category: 'AI Code Editors',
    protocol: 'Custom Model Gateway',
    howToConnect: 'Enter https://lightningapi.pro in Editor Settings -> Custom API Key',
    status: 'Verified',
    notes: 'Enables Sonnet 5.5 and Opus 5.5 multi-file edits directly in the IDE editor.',
  },
  {
    name: 'Universal HTTP / REST Clients',
    category: 'cURL, Axios, Fetch',
    protocol: 'Standard POST & SSE',
    howToConnect: 'POST to https://lightningapi.pro/v1/messages with x-api-key header',
    status: 'Verified',
    notes: 'Compatible with any language that can make an HTTPS POST request.',
  },
];

export const CompatibilitySection: React.FC = () => {
  const [copiedCli, setCopiedCli] = useState(false);

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };
  return (
    <section className="relative py-16 sm:py-24 bg-[#fafaf9] text-zinc-950 font-sans overflow-hidden border-b border-zinc-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-700 font-semibold">
                COMPATIBILITY &amp; ECOSYSTEM
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-950 font-display tracking-tight">
              Built around your development workflow.
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Connect through the tools, editors, and standard libraries you already use. Verified against drop-in Anthropic and OpenAI specification standards.
            </p>
          </div>

          <Link
            to="/docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-xs font-semibold shadow-2xs transition-colors self-start lg:self-end"
          >
            <span>View Integration Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-600" />
          </Link>
        </div>

        {/* 1-Command Universal Configuration Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-zinc-950 text-white border border-violet-700/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-200 text-[11px] font-bold border border-violet-400/30">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>Recommended Setup · Zero Manual Configuration</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Configure Everything in 1 Single Command
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Run <code className="text-violet-300 font-mono font-bold bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-700/40">npx lightningdeals</code> in your terminal or PowerShell. It auto-detects your installed AI editors (Cursor, Claude Code, Codex, VS Code), backs up configurations, sets base URLs, and verifies your key instantly.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/90 border border-violet-500/40 p-2.5 rounded-xl shrink-0 shadow-inner">
            <div className="font-mono text-xs flex items-center gap-1.5 px-2">
              <span className="text-violet-400 select-none">$</span>
              <span className="text-emerald-400 font-bold select-all">npx lightningdeals</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCli}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Copy 1-command setup"
            >
              {copiedCli ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VERIFIED_INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className={`p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4 transition-colors ${
                item.isFeatured
                  ? 'bg-violet-50/50 border-2 border-violet-400 shadow-sm hover:border-violet-500'
                  : 'bg-white border border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold uppercase ${item.isFeatured ? 'text-violet-700' : 'text-zinc-500'}`}>
                    {item.category}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    item.isFeatured ? 'bg-violet-100 text-violet-800 border-violet-300 font-bold' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <CheckCircle2 className={`w-3 h-3 ${item.isFeatured ? 'text-violet-700' : 'text-emerald-600'}`} />
                    <span>{item.isFeatured ? '1-Command' : item.status}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-950">{item.name}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">{item.notes}</p>
              </div>

              <div className={`pt-3 border-t font-mono text-[11px] p-2.5 rounded-lg border truncate ${
                item.isFeatured ? 'bg-zinc-950 text-emerald-400 border-zinc-800 font-bold' : 'bg-zinc-50 text-zinc-600 border-zinc-200/80'
              }`}>
                <span className="text-zinc-400 select-none">$ </span>
                <span className="select-all font-medium">{item.howToConnect}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CompatibilitySection;