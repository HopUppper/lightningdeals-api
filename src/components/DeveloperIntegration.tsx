import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DeveloperIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cli' | 'cursor' | 'python' | 'node'>('cli');
  const [copied, setCopied] = useState(false);

  const configs: Record<string, { title: string; filename: string; code: string; note: string }> = {
    cli: {
      title: 'Claude Code CLI',
      filename: '~/.bashrc or terminal',
      code: `# Option A: Automated One-Command Setup
npx lightningdeals

# Option B: Standard Shell Environment Variable
export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_API_KEY="ld_live_your_api_key_here"

# Claude Code automatically routes all commands through LightningAPI
claude`,
      note: 'Instantly configures your local environment in under 60 seconds.',
    },
    cursor: {
      title: 'Cursor & Windsurf',
      filename: 'Settings > Models > API Keys',
      code: `// 1. Open Cursor Settings > Models > Anthropic API Key
// 2. Override the Anthropic Base URL:
Base URL: https://lightningapi.pro/v1

// 3. Paste your Lightning key into the API Key field:
API Key:  ld_live_your_api_key_here

// All agentic composer and inline completions now flow via LightningAPI.`,
      note: 'Zero modifications to your workspace settings, rules, or extensions.',
    },
    python: {
      title: 'Python SDK',
      filename: 'main.py',
      code: `import os
from anthropic import Anthropic

# Direct drop-in initialization with official Anthropic SDK
client = Anthropic(
    base_url="https://lightningapi.pro/v1",
    api_key=os.environ.get("LIGHTNING_API_KEY", "ld_live_...")
)

message = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Analyze document insights with deep reasoning."}
    ]
)

print(message.content[0].text)`,
      note: 'Requires zero changes to your existing prompt structures or streaming listeners.',
    },
    node: {
      title: 'Node.js / TS',
      filename: 'index.ts',
      code: `import Anthropic from '@anthropic-ai/sdk';

// Initialize with standard Anthropic client
const anthropic = new Anthropic({
  baseURL: 'https://lightningapi.pro/v1',
  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_...',
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-5.5',
  max_tokens=1024,
  messages: [{ role: 'user', content: 'Synthesize quarterly product roadmap.' }],
});

console.log(response.content[0]);`,
      note: 'Full TypeScript type safety with standard @anthropic-ai/sdk exports.',
    },
  };

  const current = configs[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="integration" className="py-16 sm:py-20 lg:py-24 bg-[#fbf9f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            Frictionless Integration
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
            Works where you already build.
          </h2>
          <p className="text-sm sm:text-base text-[#57534e] leading-relaxed">
            No proprietary libraries, no SDK forks, and no prompt rewrites. Repoint your base URL to our gateway and all calls operate identically.
          </p>
        </div>

        {/* 3 Numbered Editorial Setup Steps (Open layout with top hairline) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
          <div className="border-t border-[#e7e5e4] pt-4 space-y-2">
            <span className="text-xs font-mono font-bold text-[#6d28d9]">01 / CLAIM KEY</span>
            <h4 className="text-base font-bold text-[#1c1917]">Generate Your Master Key</h4>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
              Create an account or start with 200,000 free trial tokens. Issued instantly with zero verification friction.
            </p>
          </div>

          <div className="border-t border-[#e7e5e4] pt-4 space-y-2">
            <span className="text-xs font-mono font-bold text-[#6d28d9]">02 / REPOINT URL</span>
            <h4 className="text-base font-bold text-[#1c1917]">Configure Base URL</h4>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
              Set <code className="font-mono bg-[#f5f2eb] px-1 py-0.5 rounded text-[#1c1917]">ANTHROPIC_BASE_URL</code> to <code className="font-mono bg-[#f5f2eb] px-1 py-0.5 rounded text-[#1c1917]">https://lightningapi.pro/v1</code>.
            </p>
          </div>

          <div className="border-t border-[#e7e5e4] pt-4 space-y-2">
            <span className="text-xs font-mono font-bold text-[#6d28d9]">03 / WORK NATIVELY</span>
            <h4 className="text-base font-bold text-[#1c1917]">Continuous Renewal</h4>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
              Code in Cursor, Claude Code, or custom pipelines with 5-hour rolling token renewal and zero rate limit anxiety.
            </p>
          </div>
        </div>

        {/* High-Contrast Code Studio Box */}
        <div className="rounded-3xl border border-neutral-800 bg-[#0c0d14] overflow-hidden shadow-2xl ring-1 ring-white/10 min-w-0">
          
          {/* Header with macOS Traffic Dots, Segmented Tabs & Copy */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/80 px-4 sm:px-6 py-3 bg-[#11131c] gap-3">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 pr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]/50 shadow-2xs" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d8a123]/50 shadow-2xs" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]/50 shadow-2xs" />
              </div>

              <div className="flex items-center gap-1 bg-[#181b28] p-1 rounded-xl border border-neutral-800/90 overflow-x-auto no-scrollbar">
                {(['cli', 'cursor', 'python', 'node'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === tab
                        ? 'bg-[#6d28d9] text-white shadow-plum font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {configs[tab].title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
              <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[180px] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {current.filename}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-xs font-mono font-semibold transition-all shadow-plum flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Config</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="p-5 sm:p-7 font-mono text-xs sm:text-[13px] text-neutral-200 leading-relaxed overflow-x-auto min-w-0 bg-[#08090f]">
            <pre className="text-neutral-200 whitespace-pre">
              {current.code.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                const isComment = trimmed.startsWith('#') || trimmed.startsWith('//');
                const isCommand = trimmed.startsWith('npx ') || trimmed.startsWith('claude') || trimmed.startsWith('export ');
                return (
                  <div
                    key={idx}
                    className={
                      isComment
                        ? 'text-neutral-500 italic select-none'
                        : isCommand
                        ? 'text-emerald-400 font-semibold'
                        : 'text-neutral-200'
                    }
                  >
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>

          {/* Studio Footer Note */}
          <div className="px-5 sm:px-6 py-3 border-t border-neutral-800/80 bg-[#10121c] text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
            <span>💡 {current.note}</span>
            <Link
              to="/docs"
              className="text-[#a78bfa] hover:text-[#c4b5fd] font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <span>View full technical documentation</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
