import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, Code2, Cpu, Zap, ShieldCheck } from 'lucide-react';

export const UserDocs: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const claudeCodeSnippet = `export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"

# Start coding with Claude Code CLI
claude`;

  const pythonSnippet = `import anthropic

client = anthropic.Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

response = client.messages.create(
    model="claude-3-7-sonnet",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello LightningDeals!"}]
)
print(response.content[0].text)`;

  const nodeSnippet = `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: 'ld_live_your_api_key_here',
});

const response = await anthropic.messages.create({
  model: 'claude-3-7-sonnet',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello LightningDeals!' }],
});
console.log(response.content[0].text);`;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-600" />
          <span>Quick Setup & Integration Guide</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Drop-in Anthropic API gateway instructions for Claude Code CLI, Cursor, Windsurf, VS Code, and SDKs.
        </p>
      </div>

      {/* Gateway Info Banner */}
      <div className="p-4 rounded-panel bg-violet-50 border border-violet-200 text-xs text-violet-700 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-600 shrink-0 fill-current" />
          <span>
            <span className="font-bold">Base URL:</span> <code className="font-mono bg-white px-2 py-0.5 rounded border border-violet-200 text-violet-900">https://lightningapi.pro</code>
          </span>
        </div>
        <span className="font-mono font-bold text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          ● SUB-45MS LATENCY
        </span>
      </div>

      {/* Setup Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Claude Code CLI */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-600" /> Claude Code CLI Setup
            </h3>
            <span className="text-[10px] font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Terminal</span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Run the environment setup variables in your terminal shell before launching `claude`:
          </p>

          <div className="relative bg-bg border border-border rounded-control p-3.5 font-mono text-xs">
            <pre className="text-fg whitespace-pre-wrap">{claudeCodeSnippet}</pre>
            <button
              onClick={() => copyCode(claudeCodeSnippet, 'claude_cli')}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-card border border-border text-muted hover:text-fg text-[11px] flex items-center gap-1 font-sans"
            >
              {copiedId === 'claude_cli' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'claude_cli' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 2. Cursor IDE */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" /> Cursor & Windsurf Integration
            </h3>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">IDE</span>
          </div>

          <ol className="space-y-2 text-xs text-muted list-decimal list-inside leading-relaxed">
            <li>Open <span className="font-bold text-fg">Cursor Settings</span> → <span className="font-bold text-fg">Models</span>.</li>
            <li>Enable <span className="font-bold text-fg">Anthropic API Key</span>.</li>
            <li>Set Base URL to: <code className="font-mono bg-bg px-1.5 py-0.5 rounded text-violet-600 font-bold">https://lightningapi.pro</code></li>
            <li>Paste your key: <code className="font-mono bg-bg px-1.5 py-0.5 rounded text-violet-600">ld_live_your_api_key_here</code></li>
            <li>Select models: <code className="font-mono text-fg font-bold">claude-3-7-sonnet</code> or <code className="font-mono text-fg font-bold">claude-3-5-haiku</code></li>
          </ol>
        </div>

        {/* 3. Python SDK */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" /> Python Anthropic SDK
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Python</span>
          </div>

          <div className="relative bg-bg border border-border rounded-control p-3.5 font-mono text-xs overflow-x-auto">
            <pre className="text-fg whitespace-pre-wrap">{pythonSnippet}</pre>
            <button
              onClick={() => copyCode(pythonSnippet, 'python')}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-card border border-border text-muted hover:text-fg text-[11px] flex items-center gap-1 font-sans"
            >
              {copiedId === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'python' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 4. Node.js / TypeScript SDK */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" /> Node.js / TypeScript SDK
            </h3>
            <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">TypeScript</span>
          </div>

          <div className="relative bg-bg border border-border rounded-control p-3.5 font-mono text-xs overflow-x-auto">
            <pre className="text-fg whitespace-pre-wrap">{nodeSnippet}</pre>
            <button
              onClick={() => copyCode(nodeSnippet, 'node')}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-card border border-border text-muted hover:text-fg text-[11px] flex items-center gap-1 font-sans"
            >
              {copiedId === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'node' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDocs;
