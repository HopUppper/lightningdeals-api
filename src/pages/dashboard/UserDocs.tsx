import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, Code2, Cpu, Zap, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserDocs: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const npxSnippet = `npx lightningdeals`;
  const npxWithKeySnippet = `npx lightningdeals --key ld_live_your_api_key_here`;

  const claudeCodeSnippet = `export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"

# Launch Claude Code CLI
claude`;

  const pythonSnippet = `import anthropic

client = anthropic.Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello LightningAPI!"}]
)
print(response.content[0].text)`;

  const nodeSnippet = `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: 'ld_live_your_api_key_here',
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello LightningAPI!' }],
});
console.log(response.content[0].text);`;

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Playful Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Setup & Integration Guide
                </h1>
                <span className="text-[11px] font-bold text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-200">
                  100% Compatible
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Automated 1-command CLI setup & drop-in Anthropic API gateway instructions for any tool.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/docs"
          className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold self-start sm:self-auto"
        >
          <span>Full Documentation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero 1-Click Automated Setup Card */}
      <div className="rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-600/10 via-pink-500/5 to-cyan-500/10 p-6 sm:p-8 shadow-playful space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Recommended: 1-Click Setup CLI</span>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            ⚡ Zero Manual Config
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-fg tracking-tight">
            Configure Your Editor in 5 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed max-w-2xl">
            Run the official <code className="bg-white px-2 py-0.5 rounded-lg border border-border text-violet-700 font-bold font-mono">npx lightningdeals</code> wizard. It inspects your machine and wires Cursor, VS Code, Windsurf, Roo Code, and Claude Code automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Interactive Wizard */}
          <div className="relative rounded-2xl bg-[#1E1B2E] text-white p-4 font-mono text-xs shadow-md">
            <p className="text-[10px] text-violet-300 uppercase font-bold tracking-wider mb-2">
              A. Interactive Wizard
            </p>
            <pre className="text-amber-300 font-bold">{npxSnippet}</pre>
            <button
              onClick={() => copyCode(npxSnippet, 'npx_wizard')}
              className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1 font-sans font-bold transition-colors cursor-pointer"
            >
              {copiedId === 'npx_wizard' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === 'npx_wizard' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Option B: Direct with Key */}
          <div className="relative rounded-2xl bg-[#1E1B2E] text-white p-4 font-mono text-xs shadow-md">
            <p className="text-[10px] text-violet-300 uppercase font-bold tracking-wider mb-2">
              B. Headless One-Liner
            </p>
            <pre className="text-amber-300 font-bold truncate pr-16">{npxWithKeySnippet}</pre>
            <button
              onClick={() => copyCode(npxWithKeySnippet, 'npx_key')}
              className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1 font-sans font-bold transition-colors cursor-pointer"
            >
              {copiedId === 'npx_key' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === 'npx_key' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Claude Code CLI Setup */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-fg">
                Claude Code CLI Direct Integration
              </h3>
              <p className="text-xs text-muted">
                Drop LightningAPI.pro into Anthropic's official terminal agent.
              </p>
            </div>
          </div>
          <button
            onClick={() => copyCode(claudeCodeSnippet, 'claude_code')}
            className="ui-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold cursor-pointer"
          >
            {copiedId === 'claude_code' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedId === 'claude_code' ? 'Copied Snippet' : 'Copy'}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 sm:p-5 font-mono text-xs overflow-x-auto leading-relaxed shadow-sm">
          <pre>{claudeCodeSnippet}</pre>
        </div>
      </div>

      {/* SDK Integration Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-playful space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-sm font-bold text-fg flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-600" />
              <span>Python (anthropic-sdk)</span>
            </h4>
            <button
              onClick={() => copyCode(pythonSnippet, 'python')}
              className="text-xs text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'python' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === 'python' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed">
            <pre>{pythonSnippet}</pre>
          </div>
        </div>

        {/* Node.js */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-playful space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-sm font-bold text-fg flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-600" />
              <span>Node.js / TypeScript (@anthropic-ai/sdk)</span>
            </h4>
            <button
              onClick={() => copyCode(nodeSnippet, 'node')}
              className="text-xs text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'node' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === 'node' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed">
            <pre>{nodeSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDocs;
