import React, { useState } from 'react';
import { ArrowRight, Copy, Check, Sparkles, Terminal, Code2, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialHero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'claude_cli' | 'python' | 'curl'>('cursor');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://api.lightningapi.pro');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets: Record<string, { title: string; filename: string; code: string }> = {
    cursor: {
      title: 'Cursor & Windsurf',
      filename: 'Settings > Models > OpenAI / Anthropic Override',
      code: `// 1. Open Cursor Settings -> Models -> OpenAI / Anthropic
// 2. Set Base URL:
Base URL: https://api.lightningapi.pro

// 3. Set API Key:
API Key:  ld_live_your_key_here

// 4. Enable any supported model:
// claude-3-7-sonnet, claude-3-5-sonnet, o1, gpt-4o, deepseek-v3.2`,
    },
    claude_cli: {
      title: 'Claude Code CLI',
      filename: '~/.bashrc or terminal',
      code: `# Use Claude Code CLI at up to 80% lower cost
export ANTHROPIC_BASE_URL="https://api.lightningapi.pro"
export ANTHROPIC_API_KEY="ld_live_your_key_here"

# Start coding
claude`,
    },
    python: {
      title: 'Python (OpenAI SDK)',
      filename: 'main.py',
      code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.lightningapi.pro/v1",
    api_key="ld_live_your_key_here"
)

response = client.chat.completions.create(
    model="claude-3-7-sonnet",
    messages=[{"role": "user", "content": "Hello world!"}]
)
print(response.choices[0].message.content)`,
    },
    curl: {
      title: 'cURL / REST API',
      filename: 'terminal',
      code: `curl https://api.lightningapi.pro/v1/chat/completions \\
  -H "Authorization: Bearer ld_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-3-7-sonnet",
    "messages": [{"role": "user", "content": "Explain quantum computing in 1 sentence"}]
  }'`,
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab].code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      {/* Background Architectural Canvas Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#191719 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 z-10">
        
        {/* Top Eyebrow Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#E6E1E8]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEE6FF] text-[#7136E8] text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Affordable AI API Access for Developers & Teams</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#68636B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse" />
              <span>Gateway 100% Online</span>
            </span>
            <span className="hidden sm:inline text-[#E6E1E8]">/</span>
            <span className="hidden sm:inline">100+ Models Available</span>
            <span className="hidden sm:inline text-[#E6E1E8]">/</span>
            <span className="hidden sm:inline font-bold text-[#191719]">Save up to 80%</span>
          </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Clear Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold text-[#191719] font-display tracking-tight leading-[1.12]">
              All Top AI Models.{' '}
              <br className="hidden sm:inline" />
              <span className="text-[#7136E8]">
                Up to 80% Lower Cost.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#57534e] leading-relaxed max-w-xl">
              Access Claude 3.7 & 3.5 Sonnet, OpenAI o1, GPT-4o, and DeepSeek through a single API key.
              100% compatible drop-in replacement for Cursor, Windsurf, Claude Code CLI, and Python. Just paste your key and start building.
            </p>

            {/* 4 Clear Value Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-1 max-w-lg text-xs font-medium text-[#191719]">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs">
                <span className="text-base">💰</span>
                <span>Up to 80% Cost Savings</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs">
                <span className="text-base">🔌</span>
                <span>Drop-in IDE Compatibility</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs">
                <span className="text-base">🚀</span>
                <span>100+ Supported Models</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs">
                <span className="text-base">⏱️</span>
                <span>Instant 30-Sec Key Setup</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#7136E8] hover:bg-[#581c87] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>View Pricing & Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/trial"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-[#F3F0E8] text-[#191719] border border-[#E6E1E8] text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#7136E8]" />
                <span>Try 200k Free Trial</span>
              </Link>
            </div>

            {/* Quick Ingress Copy Pill */}
            <div className="pt-1 max-w-md">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs font-mono text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#087F5B] shrink-0" />
                  <span className="text-[#78716c] font-semibold">BASE URL:</span>
                  <span className="text-[#191719] font-bold truncate select-all">https://api.lightningapi.pro</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#7136E8] hover:bg-[#EEE6FF] transition-colors shrink-0 cursor-pointer"
                  title="Copy base URL"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#087F5B]" />
                      <span className="text-[#087F5B]">Copied</span>
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

          </div>

          {/* Right Column: Interactive Drop-In Setup Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#0f172a] text-white border border-slate-800 shadow-xl overflow-hidden font-mono text-xs">
              
              {/* Window Header */}
              <div className="px-4 py-3 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-[11px] text-slate-400 font-sans font-medium ml-2">
                    {codeSnippets[activeTab].filename}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Client Selector Tabs */}
              <div className="flex border-b border-slate-800 bg-[#162032] overflow-x-auto text-[11px]">
                {(['cursor', 'claude_cli', 'python', 'curl'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-[#0f172a] text-white border-b-2 border-violet-500 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {codeSnippets[tab].title}
                  </button>
                ))}
              </div>

              {/* Code Display */}
              <div className="p-4 overflow-x-auto">
                <pre className="text-emerald-300 text-[11.5px] leading-relaxed whitespace-pre font-mono">
                  <code>{codeSnippets[activeTab].code}</code>
                </pre>
              </div>

              {/* Footer Trust Bar */}
              <div className="px-4 py-2.5 bg-[#162032] border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Drop-in OpenAI & Anthropic Protocol Parity</span>
                </span>
                <span className="text-slate-500">Latency: ~25ms</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
