import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Terminal,
  Code2,
  Cpu,
  Zap,
  Play,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnvironmentConfig {
  id: string;
  name: string;
  targetFile: string;
  badge: string;
  code: string;
  explanatoryNote: string;
}

export const ElectricDeveloperStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('claude');
  const [copied, setCopied] = useState<boolean>(false);
  const [pingRunning, setPingRunning] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{ status: string; latencyMs: number } | null>(null);

  const configs: Record<string, EnvironmentConfig> = {
    claude: {
      id: 'claude',
      name: 'Claude Code CLI',
      targetFile: '~/.bashrc or terminal',
      badge: 'Automated Setup',
      code: `# Option A: Automated CLI Assistant Setup\nnpx lightningdeals\n\n# Option B: Standard Shell Environment Variables\nexport ANTHROPIC_BASE_URL="https://lightningapi.pro"\nexport ANTHROPIC_API_KEY="ld_live_your_key_here"\n\n# Run Claude Code normally — all requests route seamlessly through LightningAPI\nclaude`,
      explanatoryNote: 'Automatically configures your environment in under 60 seconds with zero manual configuration.',
    },
    cursor: {
      id: 'cursor',
      name: 'Cursor & Windsurf',
      targetFile: 'Cursor Settings > Models > Anthropic API Key',
      badge: 'Drop-In Override',
      code: `// 1. Open Cursor Settings > Models\n// 2. Override the Anthropic Base URL:\nBase URL: https://lightningapi.pro/v1\n\n// 3. Paste your Lightning master key into the API Key field:\nAPI Key:  ld_live_your_key_here\n\n// All Composer agentic edits and inline completions now flow via LightningAPI.`,
      explanatoryNote: 'Requires zero changes to your existing workspace rules, system prompts, or extensions.',
    },
    python: {
      id: 'python',
      name: 'Python SDK',
      targetFile: 'main.py',
      badge: 'Official Anthropic SDK',
      code: `import os\nfrom anthropic import Anthropic\n\n# Direct drop-in initialization with official Anthropic SDK\nclient = Anthropic(\n    base_url="https://lightningapi.pro/v1",\n    api_key=os.environ.get("LIGHTNING_API_KEY", "ld_live_...")\n)\n\nmessage = client.messages.create(\n    model="claude-3-5-sonnet-20241022",\n    max_tokens=1024,\n    messages=[\n        {"role": "user", "content": "Analyze document insights with deep reasoning."}\n    ]\n)\n\nprint(message.content[0].text)`,
      explanatoryNote: 'Strictly mirrors /v1/messages specifications. Works directly with official Anthropic SDKs without modification.',
    },
    node: {
      id: 'node',
      name: 'Node.js / TypeScript',
      targetFile: 'index.ts',
      badge: 'Official TypeScript SDK',
      code: `import Anthropic from '@anthropic-ai/sdk';\n\n// Initialize official client with LightningAPI gateway base URL\nconst anthropic = new Anthropic({\n  baseURL: 'https://lightningapi.pro/v1',\n  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_...',\n});\n\nconst response = await anthropic.messages.create({\n  model: 'claude-3-5-sonnet-20241022',\n  max_tokens: 1024,\n  messages: [{ role: 'user', content: 'Generate robust unit tests.' }],\n});\n\nconsole.log(response.content[0]);`,
      explanatoryNote: 'Full TypeScript type safety and native SSE streaming delta listeners work out of the box.',
    },
  };

  const current = configs[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSimulatedPing = () => {
    setPingRunning(true);
    setPingResult(null);
    setTimeout(() => {
      setPingRunning(false);
      setPingResult({
        status: '200 OK — Ready to Route',
        latencyMs: 29 + Math.floor(Math.random() * 8),
      });
    }, 600);
  };

  return (
    <section id="integration" className="py-20 sm:py-24 lg:py-28 bg-white border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e7e5e4]">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-xs font-mono font-medium text-[#6d28d9] uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>FRICTIONLESS DEVELOPER INTEGRATION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.1]">
              Works natively where you already code.
            </h2>

            <p className="text-base text-[#57534e] leading-relaxed">
              No proprietary SDK forks, no patched wrappers, and no prompt rewrites. Repoint your Anthropic base URL to our gateway and all requests operate identically.
            </p>
          </div>

          <Link
            to="/docs"
            className="text-xs font-bold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1.5 transition-colors shrink-0 bg-[#fbf9f5] px-4 py-2.5 rounded-xl border border-[#e7e5e4] shadow-xs"
          >
            <span>Read Complete Documentation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Numbered Milestone Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-t-2 border-[#6d28d9] pt-5 space-y-2">
            <span className="text-xs font-mono font-bold text-[#6d28d9]">01 / MASTER KEY</span>
            <h4 className="text-lg font-bold text-[#1c1917]">Generate Your Master Key</h4>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
              Claim your free 1,000,000 trial pass or choose a 5-hour rolling capacity tier. Key issued immediately with zero verification friction.
            </p>
          </div>

          <div className="border-t-2 border-[#2563eb] pt-5 space-y-2">
            <span className="text-xs font-mono font-bold text-[#2563eb]">02 / REPOINT ENDPOINT</span>
            <h4 className="text-lg font-bold text-[#1c1917]">Override Base URL</h4>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
              Set <code className="bg-[#f5f2eb] px-1 py-0.5 rounded text-xs font-mono text-[#1c1917]">ANTHROPIC_BASE_URL</code> to <code className="bg-[#f5f2eb] px-1 py-0.5 rounded text-xs font-mono text-[#1c1917]">https://lightningapi.pro/v1</code>.
            </p>
          </div>

          <div className="border-t-2 border-[#059669] pt-5 space-y-2">
            <span className="text-xs font-mono font-bold text-[#059669]">03 / SHIP WITHOUT FEAR</span>
            <h4 className="text-lg font-bold text-[#1c1917]">Uninterrupted Flow</h4>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
              Build in Cursor, Windsurf, or Claude Code CLI with continuous 5-hour rolling replenishment and zero unexpected cloud invoices.
            </p>
          </div>
        </div>

        {/* The Developer Studio Code Workbench */}
        <div className="rounded-3xl border border-[#292524] bg-[#141210] overflow-hidden shadow-2xl">
          
          {/* Studio Top Rail: Switcher & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292524] px-4 sm:px-6 py-3 bg-[#1c1917] gap-3">
            
            {/* Environment Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {Object.values(configs).map((cfg) => {
                const isActive = activeTab === cfg.id;
                return (
                  <button
                    key={cfg.id}
                    onClick={() => setActiveTab(cfg.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#292524] text-white shadow-xs border border-neutral-700'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                    }`}
                  >
                    {cfg.name}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions (Copy & Test Ping) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={runSimulatedPing}
                disabled={pingRunning}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
              >
                <Play className={`w-3 h-3 text-emerald-400 ${pingRunning ? 'animate-spin' : ''}`} />
                <span>{pingRunning ? 'Testing...' : 'Test Gateway Ping'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-plum"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>

          </div>

          {/* Code Viewer Body */}
          <div className="p-5 sm:p-7 space-y-4 font-mono">
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-2 border-b border-neutral-800">
              <span>TARGET FILE: {current.targetFile}</span>
              <span className="text-[#a78bfa]">{current.badge}</span>
            </div>

            <pre className="text-xs sm:text-sm text-neutral-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {current.code}
            </pre>

            {/* Live Ping Result Banner */}
            <AnimatePresence>
              {pingResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Gateway Ping: {pingResult.status}</span>
                  </div>
                  <span className="font-bold bg-emerald-900/80 px-2 py-0.5 rounded text-[11px]">
                    Sub-{pingResult.latencyMs}ms TTFT
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2 text-xs text-neutral-400 border-t border-neutral-800">
              💡 {current.explanatoryNote}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
