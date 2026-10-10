import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  SlidersHorizontal,
  Send,
  Copy,
  Check,
  Terminal,
  Code2,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorksSection: React.FC = () => {
  const [activeConfigTab, setActiveConfigTab] = useState<'env' | 'cli' | 'python' | 'node'>('env');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const configSnippets = {
    env: `# .env file or system environment
ANTHROPIC_BASE_URL="https://lightningapi.pro"
ANTHROPIC_API_KEY="ld_live_your_api_key_here"`,
    cli: `# Claude Code CLI & Cursor Composer Setup
export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_API_KEY="ld_live_your_api_key_here"

# Launch agentic coding immediately
claude`,
    python: `# Python anthropic SDK
import anthropic

client = anthropic.Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

message = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Refactor router"}]
)`,
    node: `// TypeScript / Node.js @anthropic-ai/sdk
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: 'ld_live_your_api_key_here'
});

const response = await anthropic.messages.create({
  model: 'claude-opus-5.5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Audit distributed state' }]
});`
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <section id="how-it-works" className="py-20 sm:py-24 lg:py-28 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
        
        {/* Section Masthead */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#e7e5e4] text-xs font-mono font-medium text-[#6d28d9] uppercase tracking-wider shadow-xs">
            <span>DROP-IN INTEGRATION WORKFLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.12]">
            Up and running in three simple steps.
          </h2>
          <p className="text-sm sm:text-base text-[#57534e] leading-relaxed max-w-2xl mx-auto">
            Zero vendor lock-in. Zero proprietary SDKs. Keep your existing tooling intact and redirect your endpoint to LightningAPI.
          </p>
        </div>

        {/* 3 Step Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* STEP 1 */}
          <div className="rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-warm relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f3ff] border border-[#c4b5fd] flex items-center justify-center text-[#6d28d9]">
                  <Key className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#78716c] px-2.5 py-1 rounded-full bg-[#fbf9f5] border border-[#e7e5e4]">
                  STEP 01
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1c1917] tracking-tight">
                  Claim Key & Quota
                </h3>
                <p className="text-xs sm:text-sm text-[#57534e] pt-1.5 leading-relaxed">
                  Sign in or activate your complimentary 1,000,000 token trial. Your production API key is issued instantly with a dedicated rolling quota pool.
                </p>
              </div>

              {/* Step 1 Visual Card */}
              <div className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e7e5e4] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                  <span>AUTHENTICATION KEY</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#e7e5e4] flex items-center justify-between text-[#1c1917]">
                  <span className="truncate">ld_live_8f93...4a12</span>
                  <span className="text-[10px] text-[#6d28d9] font-bold uppercase ml-2 shrink-0">1M Trial Pool</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f0eee9] mt-6">
              <Link
                to="/trial"
                className="text-xs font-bold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1.5"
              >
                <span>Activate Free Trial Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-warm relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#78716c] px-2.5 py-1 rounded-full bg-[#fbf9f5] border border-[#e7e5e4]">
                  STEP 02
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1c1917] tracking-tight">
                  Set Base URL
                </h3>
                <p className="text-xs sm:text-sm text-[#57534e] pt-1.5 leading-relaxed">
                  Configure <code className="font-mono text-xs text-[#1c1917] bg-[#fbf9f5] px-1 py-0.5 rounded">https://lightningapi.pro</code> in your project environment, Cursor, Windsurf, or official Anthropic SDK.
                </p>
              </div>

              {/* Step 2 Visual Code Snippet */}
              <div className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e7e5e4] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                  <span>ENV CONFIGURATION</span>
                  <button
                    onClick={() => handleCopy('ANTHROPIC_BASE_URL="https://lightningapi.pro"', 'step2')}
                    className="text-[#6d28d9] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSnippet === 'step2' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'step2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#e7e5e4] text-[#1c1917] break-all leading-relaxed">
                  <div>ANTHROPIC_BASE_URL=</div>
                  <div className="text-[#6d28d9] font-bold">"https://lightningapi.pro"</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f0eee9] mt-6">
              <Link
                to="/docs"
                className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] inline-flex items-center gap-1.5"
              >
                <span>Read Integration Specs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-warm relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#059669]">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#78716c] px-2.5 py-1 rounded-full bg-[#fbf9f5] border border-[#e7e5e4]">
                  STEP 03
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1c1917] tracking-tight">
                  Dispatch Requests
                </h3>
                <p className="text-xs sm:text-sm text-[#57534e] pt-1.5 leading-relaxed">
                  Call <code className="font-mono text-xs text-[#1c1917] bg-[#fbf9f5] px-1 py-0.5 rounded">/v1/messages</code> with any supported model identifier. Tokens stream over SSE with 5-hour rolling refill.
                </p>
              </div>

              {/* Step 3 Visual Card */}
              <div className="p-3.5 rounded-2xl bg-[#fbf9f5] border border-[#e7e5e4] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#78716c]">
                  <span>LIVE DISPATCH</span>
                  <span className="text-emerald-600 font-semibold text-[10px]">SSE Stream</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#e7e5e4] text-[#1c1917] space-y-1">
                  <div className="text-[11px] text-[#78716c]">model: "claude-sonnet-5.5"</div>
                  <div className="text-emerald-700 font-semibold text-[11px]">✓ 200 OK · In-Memory Transit</div>
                  <div className="text-[10px] text-[#78716c]">5-hour refill: 100% available</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f0eee9] mt-6">
              <Link
                to="/models"
                className="text-xs font-bold text-[#059669] hover:text-[#047857] inline-flex items-center gap-1.5"
              >
                <span>Browse All 10 Supported Models</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Interactive Tabbed Code Implementation Container */}
        <div className="rounded-3xl border border-[#e7e5e4] bg-[#1c1917] text-[#fbf9f5] p-5 sm:p-8 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                  READY-TO-USE CODE EXAMPLES
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Drop-in configuration for your preferred runtime
                </h3>
              </div>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-1 bg-[#292524] p-1 rounded-xl text-xs font-mono">
              {(['env', 'cli', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveConfigTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeConfigTab === tab
                      ? 'bg-[#6d28d9] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab === 'env' && '.env File'}
                  {tab === 'cli' && 'CLI & Cursor'}
                  {tab === 'python' && 'Python SDK'}
                  {tab === 'node' && 'Node.js / TS'}
                </button>
              ))}
            </div>
          </div>

          {/* Active Snippet Display */}
          <div className="relative">
            <pre className="p-4 sm:p-5 rounded-2xl bg-[#141210] border border-[#292524] font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
              <code>{configSnippets[activeConfigTab]}</code>
            </pre>
            <button
              onClick={() => handleCopy(configSnippets[activeConfigTab], 'tab-snippet')}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#292524] hover:bg-[#383330] text-xs font-mono text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700"
              title="Copy snippet"
            >
              {copiedSnippet === 'tab-snippet' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
