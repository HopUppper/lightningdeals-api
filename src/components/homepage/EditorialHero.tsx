import React, { useState } from 'react';
import { ArrowRight, Copy, Check, Sparkles, Terminal, Code2, Zap, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { OrbitIcon } from '../brand/OrbitIcon';

export const EditorialHero: React.FC = () => {
  const { user } = useAuth();
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeTab, setActiveTab] = useState<'claude_cli' | 'codex' | 'cursor' | 'python' | 'curl'>('claude_cli');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const ctaDestination = !user ? '/register' : '/dashboard';

  // Verified Workflows for Product Demonstration
  const workflows: Record<
    'claude_cli' | 'codex' | 'cursor' | 'python' | 'curl',
    {
      tabLabel: string;
      windowPath: string;
      rawCode: string;
      renderContent: () => React.ReactNode;
    }
  > = {
    claude_cli: {
      tabLabel: 'Claude Code',
      windowPath: '~/project: claude',
      rawCode: `export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_API_KEY="ld_live_your_key_here"
claude`,
      renderContent: () => (
        <div className="space-y-3 font-mono text-xs sm:text-[12.5px] leading-relaxed select-text">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="text-white font-semibold">claude</span>
          </div>

          <div className="text-zinc-500 text-[11.5px]">
            claude · model <span className="text-violet-400 font-bold">claude-sonnet-5.5</span> · provider <span className="text-zinc-300">lightningapi</span> · ~/project
          </div>

          <div className="pt-1 text-zinc-300 flex items-start gap-2">
            <span className="text-fuchsia-400 font-bold">&gt;</span>
            <span className="text-white">Refactor token accounting middleware to support 5-hour rolling refill</span>
          </div>

          <div className="space-y-1.5 pl-3 border-l border-zinc-800 text-[12px]">
            <div className="text-cyan-400 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Connecting to https://lightningapi.pro (x-api-key: ld_live_...)</span>
            </div>
            <div className="text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Streamed 1,280 tokens via SSE (latency: 14ms)</span>
            </div>
            <div className="text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Read src/middleware/token-quota.ts and 4 related files</span>
            </div>
            <div className="text-emerald-300 flex items-center gap-2 font-semibold">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Applied atomic transaction update <span className="text-emerald-400">(+52)</span> <span className="text-rose-400">(-18)</span></span>
            </div>
          </div>

          <div className="pt-2 text-zinc-400 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="text-zinc-200">claude --status</span>
          </div>
          <div className="text-zinc-400 text-[11.5px] pl-3 border-l border-violet-800/40">
            <span className="text-emerald-400 font-bold">✓</span> Plan: <span className="text-violet-300 font-semibold">Claude Max</span> (5-Hour Rolling Window active · 200k Context)
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-zinc-500">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
          </div>
        </div>
      ),
    },

    codex: {
      tabLabel: 'Codex CLI',
      windowPath: '~/backend: codex',
      rawCode: `export OPENAI_BASE_URL="https://lightningapi.pro/v1"
export OPENAI_API_KEY="ld_live_your_key_here"
codex "Create a streaming completion proxy with SSE failover"`,
      renderContent: () => (
        <div className="space-y-3 font-mono text-xs sm:text-[12.5px] leading-relaxed select-text">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="text-white font-semibold">codex &quot;Create a streaming completion proxy with SSE failover&quot;</span>
          </div>

          <div className="text-zinc-500 text-[11.5px]">
            codex · model <span className="text-violet-400 font-bold">gpt-4o</span> · provider <span className="text-zinc-300">lightningapi/v1</span> · ~/backend
          </div>

          <div className="space-y-1.5 pl-3 border-l border-zinc-800 text-[12px] pt-1">
            <div className="text-cyan-400 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>POST https://lightningapi.pro/v1/chat/completions</span>
            </div>
            <div className="text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Synthesized implementation with structured tool calling</span>
            </div>
            <div className="text-emerald-300 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Generated proxy handler with exponential backoff retries</span>
            </div>
            <div className="text-emerald-300 flex items-center gap-2 font-semibold">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Executed test suite: 18 passed, 0 failed</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-1.5 text-zinc-500">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
          </div>
        </div>
      ),
    },

    cursor: {
      tabLabel: 'Cursor IDE',
      windowPath: 'Cursor Settings > Models',
      rawCode: `// In Cursor Settings -> Models -> Override Anthropic Base URL:
Base URL: https://lightningapi.pro
API Key:  ld_live_your_api_key_here

// Compatible Models:
claude-sonnet-5.5
claude-opus-5.5
gpt-4o`,
      renderContent: () => (
        <div className="space-y-3 font-mono text-xs sm:text-[12.5px] leading-relaxed select-text">
          <div className="text-zinc-400 text-[11.5px]">
            // Cursor IDE &rarr; Settings &rarr; Models &rarr; Custom Model Provider:
          </div>

          <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500 font-semibold">Anthropic Base URL:</span>
              <span className="text-emerald-400 font-bold select-all">https://lightningapi.pro</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500 font-semibold">Auth Header:</span>
              <span className="text-violet-300 font-bold select-all">ld_live_your_key_here</span>
            </div>
          </div>

          <div className="pt-1 text-zinc-400 text-[11.5px]">
            // Models enabled for multi-file repository edits:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-violet-800/40 flex items-center justify-between">
              <span className="text-white font-bold">claude-sonnet-5.5</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <span className="text-white font-bold">claude-opus-5.5</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <span className="text-white font-bold">gpt-4o</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <span className="text-white font-bold">gemini-4-argon</span>
              <span className="text-[10px] text-emerald-400 font-semibold">1M Context</span>
            </div>
          </div>
        </div>
      ),
    },

    python: {
      tabLabel: 'Python SDK',
      windowPath: 'main.py',
      rawCode: `from openai import OpenAI

client = OpenAI(
    base_url="https://lightningapi.pro/v1",
    api_key="ld_live_your_api_key_here"
)

stream = client.chat.completions.create(
    model="claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Explain zero-knowledge proofs"}],
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
      renderContent: () => (
        <div className="font-mono text-xs sm:text-[12.5px] leading-relaxed text-zinc-300 select-text overflow-x-auto whitespace-pre">
          <span className="text-fuchsia-400">from</span> openai <span className="text-fuchsia-400">import</span> OpenAI{'\n\n'}
          client = OpenAI({'\n'}
          {'    '}base_url=<span className="text-emerald-300">&quot;https://lightningapi.pro/v1&quot;</span>,{'\n'}
          {'    '}api_key=<span className="text-violet-300">&quot;ld_live_your_api_key_here&quot;</span>{'\n'}
          ){'\n\n'}
          <span className="text-zinc-500"># Real-time streaming from Claude, OpenAI, or Gemini:</span>{'\n'}
          stream = client.chat.completions.create({'\n'}
          {'    '}model=<span className="text-emerald-300">&quot;claude-sonnet-5.5&quot;</span>,{'\n'}
          {'    '}messages=[{`{"role": "user", "content": "Explain zero-knowledge proofs"}`}],{'\n'}
          {'    '}stream=<span className="text-amber-300">True</span>{'\n'}
          ){'\n\n'}
          <span className="text-fuchsia-400">for</span> chunk <span className="text-fuchsia-400">in</span> stream:{'\n'}
          {'    '}print(chunk.choices[0].delta.content <span className="text-fuchsia-400">or</span> <span className="text-emerald-300">&quot;&quot;</span>, end=<span className="text-emerald-300">&quot;&quot;</span>)
        </div>
      ),
    },

    curl: {
      tabLabel: 'cURL & SSE',
      windowPath: 'terminal: curl',
      rawCode: `curl -N https://lightningapi.pro/v1/chat/completions \\
  -H "Authorization: Bearer ld_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`,
      renderContent: () => (
        <div className="space-y-3 font-mono text-xs sm:text-[12px] leading-relaxed select-text overflow-x-auto">
          <div className="text-zinc-300 whitespace-pre">
            <span className="text-emerald-400 font-bold">$ </span>
            curl -N https://lightningapi.pro/v1/chat/completions \{'\n'}
            {'  '}-H <span className="text-emerald-300">&quot;Authorization: Bearer ld_live_...&quot;</span> \{'\n'}
            {'  '}-H <span className="text-emerald-300">&quot;Content-Type: application/json&quot;</span> \{'\n'}
            {'  '}-d <span className="text-violet-300">&#39;&#123;&quot;model&quot;:&quot;claude-sonnet-5.5&quot;,&quot;messages&quot;:[&#123;&quot;role&quot;:&quot;user&quot;,&quot;content&quot;:&quot;Hello!&quot;&#125;],&quot;stream&quot;:true&#125;&#39;</span>
          </div>

          <div className="space-y-1 pl-3 border-l border-zinc-800 text-[11.5px] text-zinc-400">
            <div className="text-cyan-400">HTTP/2 200 OK · content-type: text/event-stream</div>
            <div className="text-emerald-300 font-semibold">data: &#123;&quot;choices&quot;:[&#123;&quot;delta&quot;:&#123;&quot;content&quot;:&quot;Hello! How can I help you build today?&quot;&#125;&#125;]&#125;</div>
            <div className="text-zinc-500">data: [DONE]</div>
          </div>
        </div>
      ),
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(workflows[activeTab].rawCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const providerLogos = [
    { name: 'Anthropic Claude', badge: 'Sonnet 5.5 & Opus 5.5' },
    { name: 'OpenAI', badge: 'o1, o3-mini & GPT-4o' },
    { name: 'Google Gemini', badge: 'Gemini 4 Argon (1M)' },
    { name: 'DeepSeek', badge: 'V3 & R1 Reasoning' },
    { name: 'Alibaba Qwen', badge: 'Qwen 2.5 Coder' },
    { name: 'xAI Grok', badge: 'Grok 2.0' },
  ];

  return (
    <section id="hero-section" className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 bg-[#070709] text-white font-sans overflow-hidden">
      {/* ============================================================ */}
      {/* ATMOSPHERIC AMBIENT ILLUMINATION & GRID TEXTURE              */}
      {/* ============================================================ */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[650px] h-[650px] bg-violet-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 z-10">
        
        {/* Top Eyebrow Badge & Cluster Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/orbit"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/70 text-violet-200 hover:text-white text-xs font-semibold border border-violet-500/40 hover:border-violet-400 transition-colors shadow-xs"
          >
            <OrbitIcon className="w-3.5 h-3.5 text-violet-300" size={14} />
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-violet-500/30 text-violet-200">
              INTRODUCING ORBIT
            </span>
            <span>All-in-One AI Workspace &rarr;</span>
          </Link>
          <Link
            to="/docs#sec-quick-setup"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/60 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300">
              CLI
            </span>
            <span>npx lightningdeals &rarr;</span>
          </Link>
        </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-300">All Clusters Operational</span>
            </span>
            <span className="hidden sm:inline text-zinc-700">/</span>
            <span className="hidden sm:inline">74 Verified Models</span>
            <span className="hidden sm:inline text-zinc-700">/</span>
            <span className="hidden sm:inline text-emerald-400 font-bold">Sub-15ms Latency</span>
          </div>
        </div>

        {/* Hero Grid: Two-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: High-Impact Typography & Action */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white font-display tracking-tight leading-[1.05]">
              Every AI model.
              <br />
              <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                One simple API.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl font-normal">
              Access Claude, OpenAI, and Gemini models through one unified API. Choose rolling windows, credit wallets, or token packs, and build without limits.
            </p>

            {/* CTAs: Clear Primary Actions */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to={user ? '/dashboard/orbit' : '/register'}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm sm:text-base font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <OrbitIcon className="w-4 h-4 text-violet-200" size={16} />
                <span>Explore Orbit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-sm sm:text-base font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <span>Explore Plans</span>
              </Link>
            </div>

            {/* 1-Command CLI Command below CTAs */}
            <div className="pt-2 max-w-md space-y-2">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 text-xs font-mono text-zinc-300 shadow-inner">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-violet-400 select-none font-bold">$</span>
                  <span className="text-emerald-400 font-bold truncate select-all">npx lightningdeals</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-sans text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  title="Copy 1-command installer"
                >
                  {copiedCli ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11.5px] text-zinc-500 font-mono">
                Auto-configures Claude Code, Cursor, Codex &amp; environment variables in PowerShell / Terminal.
              </p>
            </div>

          </div>

          {/* Right Column: Cinematic Product Demonstration Window */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-[#0b0a12]/95 border border-zinc-800/90 shadow-2xl backdrop-blur-xl overflow-hidden font-mono text-xs">
              
              {/* Window Header Chrome */}
              <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
                  <div className="flex items-center gap-1.5 ml-2 text-[11px] text-zinc-400 font-sans font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{workflows[activeTab].windowPath}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Snippet"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Workflow Tab Switcher */}
              <div className="flex border-b border-zinc-800/80 bg-zinc-950/80 overflow-x-auto text-[11.5px]">
                {(['claude_cli', 'codex', 'cursor', 'python', 'curl'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-[#0b0a12] text-white border-b-2 border-violet-500 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    }`}
                  >
                    {workflows[tab].tabLabel}
                  </button>
                ))}
              </div>

              {/* Dynamic Interactive Demonstration Body */}
              <div className="p-5 sm:p-6 min-h-[300px] sm:min-h-[330px] flex flex-col justify-between overflow-x-auto bg-[#0b0a12]">
                {workflows[activeTab].renderContent()}
              </div>

              {/* Window Footer Telemetry */}
              <div className="px-4 py-2.5 bg-zinc-950 border-t border-zinc-800/80 text-[10.5px] text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Drop-in Parity &middot; Anthropic &amp; OpenAI</span>
                </span>
                <span className="text-zinc-500 font-mono">Gateway: &lt;15ms &middot; 99.99% Uptime</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* PROVIDER LOGO / BADGE STRIP                                   */}
        {/* ============================================================ */}
        <div className="pt-8">
          <p className="text-center text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
            Unified access across premier intelligence labs
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {providerLogos.map((p) => (
              <div
                key={p.name}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 shadow-2xs flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-colors"
              >
                <span className="text-xs font-bold text-zinc-200">{p.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3-STEP "HOW IT WORKS" ONBOARDING CARDS                       */}
        {/* ============================================================ */}
        <div className="pt-6">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
              Simple 3-Step Setup
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Start building in under 30 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-violet-950 text-violet-300 flex items-center justify-center font-bold text-sm border border-violet-800/50">
                  1
                </div>
                <h3 className="text-base font-bold text-white">Choose Your Plan</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Select between continuous 5-hour rolling pool refills, pay-as-you-go credit deposits with 7x purchasing value, or fixed consumable token packs.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center text-xs font-semibold text-violet-400">
                <Link to="/pricing" className="inline-flex items-center gap-1 hover:underline">
                  <span>Browse plans &amp; rates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-violet-950 text-violet-300 flex items-center justify-center font-bold text-sm border border-violet-800/50">
                  2
                </div>
                <h3 className="text-base font-bold text-white">Receive Your Key</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Keys are issued automatically in your dashboard within 10 seconds of checkout. Check your token allowance and live window countdown anytime.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center text-xs font-semibold text-violet-400">
                <Link to="/check-key" className="inline-flex items-center gap-1 hover:underline">
                  <span>Verify existing key</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-violet-950 text-violet-300 flex items-center justify-center font-bold text-sm border border-violet-800/50">
                  3
                </div>
                <h3 className="text-base font-bold text-white">Connect Your Tools</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Run <code className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[11px] font-bold">npx lightningdeals</code> or paste your key and endpoint into Cursor, VS Code, Claude Code CLI, or Python SDKs.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center text-xs font-semibold text-violet-400">
                <Link to="/docs" className="inline-flex items-center gap-1 hover:underline">
                  <span>View quickstart documentation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* INTENTIONAL TRANSITION DIVIDER TO LIGHT SECTION BELOW       */}
      {/* ============================================================ */}
      <div className="relative mt-16 sm:mt-24 h-16 sm:h-20 bg-gradient-to-b from-transparent via-[#070709]/70 to-[#fafaf9] pointer-events-none" />
    </section>
  );
};

export default EditorialHero;
