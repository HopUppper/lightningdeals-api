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
    model="claude-3-5-sonnet-20241022",
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
  model: 'claude-3-5-sonnet-20241022',
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
              Create an account or start with 1,000,000 free trial tokens. Issued instantly with zero verification friction.
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
        <div className="border border-[#292524] rounded-2xl bg-[#1c1917] overflow-hidden shadow-warm min-w-0">
          
          {/* Header with Horizontal Scrolling Tab Rail for Mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292524] px-3 sm:px-4 py-2 bg-[#231f20] gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0">
              {(['cli', 'cursor', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === tab
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-[#a8a29e] hover:text-white'
                  }`}
                >
                  {configs[tab].title}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#292524]">
              <span className="text-[11px] font-mono text-[#a8a29e] truncate max-w-[180px]">
                {current.filename}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#e7e5e4] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
          <div className="p-4 sm:p-5 font-mono text-xs text-[#e7e5e4] leading-relaxed overflow-x-auto min-w-0">
            <pre className="text-[#e7e5e4] whitespace-pre">{current.code}</pre>
          </div>

          {/* Studio Footer Note */}
          <div className="px-4 sm:px-5 py-3 border-t border-[#292524] bg-[#181513] text-[11px] text-[#a8a29e] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{current.note}</span>
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
