import React, { useState } from 'react';
import { ArrowRight, Copy, Check, Sparkles, Terminal, Code2, Zap, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialHero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'claude_cli' | 'python' | 'curl'>('cursor');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets: Record<string, { title: string; filename: string; code: string }> = {
    cursor: {
      title: 'VS Code & Cursor',
      filename: 'Settings > Models > Custom OpenAI / Anthropic',
      code: `// 1. Open Cursor Settings -> Models -> OpenAI / Anthropic
// 2. Set Base URL:
Base URL: https://lightningapi.pro

// 3. Set API Key:
API Key:  sk_live_your_key_here

// 4. Enable any supported model:
// claude-sonnet-5.5, claude-opus-5.5, gpt-4o, o3-mini, deepseek-v3`,
    },
    claude_cli: {
      title: 'Claude Code CLI',
      filename: '~/.bashrc or terminal',
      code: `# Use Claude Code CLI with up to 80% lower cost
export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_API_KEY="sk_live_your_key_here"

# Start coding instantly
claude`,
    },
    python: {
      title: 'Python SDK',
      filename: 'main.py',
      code: `from openai import OpenAI

client = OpenAI(
    base_url="https://lightningapi.pro/v1",
    api_key="sk_live_your_key_here"
)

response = client.chat.completions.create(
    model="claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Explain quantum computing in 1 sentence"}]
)
print(response.choices[0].message.content)`,
    },
    curl: {
      title: 'cURL / REST API',
      filename: 'terminal',
      code: `curl https://lightningapi.pro/v1/chat/completions \\
  -H "Authorization: Bearer sk_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "messages": [{"role": "user", "content": "Hello world!"}]
  }'`,
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab].code);
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
    <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-[#fafaf9] text-zinc-950 font-sans overflow-hidden border-b border-zinc-200">
      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 z-10">
        
        {/* Top Eyebrow Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-zinc-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200/60">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>High-Speed AI API Gateway for Developers &amp; Teams</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>All Systems Operational</span>
            </span>
            <span className="hidden sm:inline text-zinc-300">/</span>
            <span className="hidden sm:inline">74 Verified Models</span>
            <span className="hidden sm:inline text-zinc-300">/</span>
            <span className="hidden sm:inline font-bold text-zinc-950">Save up to 80%</span>
          </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Clear Value Proposition (The 5-Second Test) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-950 font-display tracking-tight leading-[1.12]">
              Every AI model.{' '}
              <br />
              <span className="text-violet-600">
                One simple API.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
              Access leading AI models through one unified platform. Choose your plan, connect your favorite developer tools, and start building in seconds.
            </p>

            {/* CTAs: Clear Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Explore Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/models"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <span>View Models</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>

              <Link
                to="/trial"
                className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition-colors cursor-pointer border border-violet-200/60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim Free 200k Trial</span>
              </Link>
            </div>

            {/* Quick Ingress Copy Pill */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs font-mono text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-zinc-500 font-semibold">BASE URL:</span>
                  <span className="text-zinc-950 font-bold truncate select-all">https://lightningapi.pro</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-violet-600 hover:bg-violet-50 transition-colors shrink-0 cursor-pointer"
                  title="Copy base URL"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
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
            <div className="rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-xl overflow-hidden font-mono text-xs">
              
              {/* Window Header */}
              <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-[11px] text-zinc-400 font-sans font-medium ml-2">
                    {codeSnippets[activeTab].filename}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
              <div className="flex border-b border-zinc-800 bg-zinc-900/60 overflow-x-auto text-[11px]">
                {(['cursor', 'claude_cli', 'python', 'curl'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-zinc-950 text-white border-b-2 border-violet-500 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
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
              <div className="px-4 py-2.5 bg-zinc-900/70 border-t border-zinc-800 text-[10px] text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Drop-in OpenAI &amp; Anthropic Parity</span>
                </span>
                <span className="text-zinc-500">Gateway: &lt;15ms · 99.9% Uptime</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* PROVIDER LOGO / BADGE STRIP                                   */}
        {/* ============================================================ */}
        <div className="pt-4">
          <p className="text-center text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
            Unified access across premier intelligence labs
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {providerLogos.map((p) => (
              <div
                key={p.name}
                className="p-3 rounded-xl bg-white border border-zinc-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:border-zinc-300 transition-colors"
              >
                <span className="text-xs font-bold text-zinc-900">{p.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3-STEP "HOW IT WORKS" ONBOARDING CARDS                       */}
        {/* ============================================================ */}
        <div className="pt-6">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-600">
              Simple 3-Step Setup
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Start building in under 30 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-sm border border-violet-200">
                  1
                </div>
                <h3 className="text-base font-bold text-zinc-950">Choose Your Plan</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Select between continuous 5-hour rolling pool refills, pay-as-you-go credit deposits with 7x purchasing value, or fixed consumable token packs.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-100 flex items-center text-xs font-semibold text-violet-600">
                <Link to="/pricing" className="inline-flex items-center gap-1 hover:underline">
                  <span>Browse plans &amp; rates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-sm border border-violet-200">
                  2
                </div>
                <h3 className="text-base font-bold text-zinc-950">Receive Your Key</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Keys are issued automatically in your dashboard within 10 seconds of checkout. Check your token allowance and live window countdown anytime.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-100 flex items-center text-xs font-semibold text-violet-600">
                <Link to="/check-key" className="inline-flex items-center gap-1 hover:underline">
                  <span>Verify existing key</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-sm border border-violet-200">
                  3
                </div>
                <h3 className="text-base font-bold text-zinc-950">Connect Your Tools</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Paste your API key and <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px]">https://lightningapi.pro</code> into Cursor, VS Code, Claude Code CLI, or Python SDKs.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-100 flex items-center text-xs font-semibold text-violet-600">
                <Link to="/docs" className="inline-flex items-center gap-1 hover:underline">
                  <span>View quickstart documentation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default EditorialHero;