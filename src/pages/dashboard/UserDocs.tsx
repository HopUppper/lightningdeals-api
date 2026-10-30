import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Terminal,
  Code2,
  Cpu,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Server,
  Globe,
  ExternalLink,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserDocs: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'claude-code' | 'cursor' | 'windsurf' | 'vscode' | 'python' | 'node' | 'curl'>('claude-code');
  const [activeEcosystem, setActiveEcosystem] = useState<'claude' | 'openai' | 'local'>('claude');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const npxSnippet = `npx lightningdeals`;
  const npxWithKeySnippet = `npx lightningdeals --key ld_live_your_api_key_here`;
  const modelPickerSnippet = `npx lightningdeals model`;
  const directModelSnippet = `npx lightningdeals model claude-opus-5.5`;
  const claudeFlagSnippet = `claude --model claude-opus-5.5`;
  const listModelsSnippet = `npx lightningdeals models`;
  const bashInstallSnippet = `curl -sSL https://lightningapi.pro/setup.sh | bash`;
  const powershellInstallSnippet = `irm https://lightningapi.pro/setup.ps1 | iex`;

  const claudeCodeSnippet = `export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"

# Launch Claude Code CLI
claude`;

  const cursorAnthropicSnippet = `// In Cursor Settings -> Models -> Override Anthropic Base URL:
// URL:
https://lightningapi.pro

// API Key:
ld_live_your_api_key_here

// Model name to add:
claude-opus-5.5
claude-sonnet-5.5`;

  const cursorOpenAISnippet = `// In Cursor Settings -> Models -> OpenAI API Key:
// Base URL:
https://api.lightningapi.pro/v1

// API Key:
ld_live_your_api_key_here

// Compatible Models:
o1, o3-mini, gpt-4o, deepseek-chat, grok-2`;

  const windsurfSnippet = `// In Windsurf Settings -> Custom AI Provider:
Base URL: https://api.lightningapi.pro/v1
API Key:  ld_live_your_api_key_here
Models:   claude-sonnet-5.5, gpt-4o, deepseek-chat`;

  const vscodeContinueSnippet = `// ~/.continue/config.json
{
  "models": [
    {
      "title": "LightningAPI Claude 5.5",
      "provider": "anthropic",
      "model": "claude-sonnet-5.5",
      "apiKey": "ld_live_your_api_key_here",
      "apiBase": "https://lightningapi.pro"
    },
    {
      "title": "LightningAPI DeepSeek",
      "provider": "openai",
      "model": "deepseek-chat",
      "apiKey": "ld_live_your_api_key_here",
      "apiBase": "https://api.lightningapi.pro/v1"
    }
  ]
}`;

  const pythonAnthropicSnippet = `import anthropic

client = anthropic.Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

response = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello LightningAPI!"}]
)
print(response.content[0].text)`;

  const pythonOpenAISnippet = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.lightningapi.pro/v1",
    api_key="ld_live_your_api_key_here"
)

# Works for both OpenAI frontier & open-weight local models:
response = client.chat.completions.create(
    model="gpt-4o",  # or "deepseek-chat", "grok-2", "qwen-2.5-coder-32b"
    messages=[{"role": "user", "content": "Hello LightningAPI!"}]
)
print(response.choices[0].message.content)`;

  const nodeAnthropicSnippet = `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: 'ld_live_your_api_key_here',
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-5.5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello LightningAPI!' }],
});
console.log(response.content[0].text);`;

  const nodeOpenAISnippet = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.lightningapi.pro/v1',
  apiKey: 'ld_live_your_api_key_here',
});

const completion = await openai.chat.completions.create({
  model: 'deepseek-chat', // or 'gpt-4o', 'o3-mini', 'grok-2'
  messages: [{ role: 'user', content: 'Hello LightningAPI!' }],
});
console.log(completion.choices[0].message.content);`;

  const curlAnthropicSnippet = `curl -X POST https://lightningapi.pro/v1/messages \\
  -H "content-type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello LightningAPI!"}]
  }'`;

  const curlOpenAISnippet = `curl -X POST https://api.lightningapi.pro/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ld_live_your_api_key_here" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Explain quantum computing in 2 sentences"}]
  }'`;

  const keyStatusCurl = `curl -X GET https://lightningapi.pro/api/key-status \\
  -H "x-api-key: ld_live_your_api_key_here"`;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Developer Documentation &amp; Setup Guide
                </h1>
                <span className="text-[11px] font-bold text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-200">
                  v2.0 Tri-Ecosystem
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Drop-in compatible with Anthropic Claude, OpenAI Frontier, and Local &amp; Open-Weights models.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/docs"
          className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold self-start sm:self-auto"
        >
          <span>Public Full API Docs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tri-Ecosystem Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Claude */}
        <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/70 to-purple-50/30 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full border border-violet-200">
              Anthropic Ecosystem
            </span>
            <span className="text-[11px] font-bold text-violet-900 bg-white px-2 py-0.5 rounded border border-violet-200">
              Native Protocol
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-fg">Claude Models</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Claude Opus 5.5, Sonnet 5.5, Extended Thinking, and Haiku 5.5. Full 200k context window and tool use.
            </p>
          </div>
          <div className="pt-2 border-t border-violet-200/60 flex items-center justify-between text-xs font-bold text-violet-800">
            <span>Plans: Rolling, Credits &amp; Tokens</span>
            <span className="font-mono text-[11px]">/v1/messages</span>
          </div>
        </div>

        {/* OpenAI */}
        <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-sky-50/30 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
              OpenAI Frontier
            </span>
            <span className="text-[11px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
              ChatCompletions
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-fg">OpenAI Ecosystem</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              o1, o3-mini, GPT-4o, and GPT-4.5. Fast multi-turn completions, structured outputs, and reasoning tokens.
            </p>
          </div>
          <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs font-bold text-blue-800">
            <span>Plans: 7x Credits &amp; Token Packs</span>
            <span className="font-mono text-[11px]">/v1/chat/completions</span>
          </div>
        </div>

        {/* Local & Open Models */}
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-teal-50/30 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              Local &amp; Open-Weights
            </span>
            <span className="text-[11px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Cost-Optimized
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-fg">Open-Weights &amp; Coding</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              DeepSeek v3.2 &amp; v4, Grok-2, Qwen 2.5 / 3.7, and GLM-4. Uncensored, fast, high-concurrency inference.
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Plans: 7x Credits &amp; Token Packs</span>
            <span className="font-mono text-[11px]">/v1/chat/completions</span>
          </div>
        </div>
      </div>

      {/* Hero 1-Click Automated Setup Card */}
      <div className="rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-600/10 via-pink-500/5 to-cyan-500/10 p-6 sm:p-8 shadow-playful space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Recommended: Automated 1-Click Setup</span>
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
            Run the official <code className="bg-white px-2 py-0.5 rounded-lg border border-border text-violet-700 font-bold font-mono">npx lightningdeals</code> wizard. It inspects your machine and auto-wires Cursor, VS Code, Windsurf, Roo Code, Continue, and Claude Code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Interactive Wizard */}
          <div className="relative rounded-2xl bg-[#1E1B2E] text-white p-4 font-mono text-xs shadow-md">
            <p className="text-[10px] text-violet-300 uppercase font-bold tracking-wider mb-2">
              A. Interactive Wizard (Cross-Platform)
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
              B. Headless One-Liner (With API Key)
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

        {/* Quick Shell Installers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl bg-white/80 border border-violet-200/80 p-3 flex items-center justify-between">
            <div className="truncate mr-3">
              <span className="text-[10px] uppercase font-bold text-violet-700 block">Linux / macOS Quick Install</span>
              <code className="text-xs font-mono text-fg font-bold truncate block">{bashInstallSnippet}</code>
            </div>
            <button
              onClick={() => copyCode(bashInstallSnippet, 'bash_install')}
              className="px-2.5 py-1 text-xs rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold cursor-pointer shrink-0"
            >
              {copiedId === 'bash_install' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="rounded-xl bg-white/80 border border-violet-200/80 p-3 flex items-center justify-between">
            <div className="truncate mr-3">
              <span className="text-[10px] uppercase font-bold text-violet-700 block">Windows PowerShell Quick Install</span>
              <code className="text-xs font-mono text-fg font-bold truncate block">{powershellInstallSnippet}</code>
            </div>
            <button
              onClick={() => copyCode(powershellInstallSnippet, 'ps_install')}
              className="px-2.5 py-1 text-xs rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold cursor-pointer shrink-0"
            >
              {copiedId === 'ps_install' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Model Switching Control Card */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-fg">
                  Switch AI Models Anytime (Tri-Ecosystem Support)
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Instant
                </span>
              </div>
              <p className="text-xs text-muted">
                Your key has full access to Claude Opus 5.5, Sonnet 5.5, o1, o3-mini, GPT-4o, and DeepSeek. Switch models anytime without re-authenticating.
              </p>
            </div>
          </div>

          <button
            onClick={() => copyCode(modelPickerSnippet, 'model_picker')}
            className="ui-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold cursor-pointer"
          >
            {copiedId === 'model_picker' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedId === 'model_picker' ? 'Copied' : 'Copy Model CLI'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#1E1B2E] text-white p-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-violet-300 uppercase font-bold tracking-wider mb-2">
                1. Interactive Selector
              </p>
              <pre className="text-emerald-300 font-bold">{modelPickerSnippet}</pre>
              <p className="text-[11px] text-slate-400 mt-2 font-sans font-normal leading-relaxed">
                Opens full model menu. Updates your IDE configs in 1 keystroke.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1E1B2E] text-white p-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-violet-300 uppercase font-bold tracking-wider mb-2">
                2. Direct Switch One-Liner
              </p>
              <pre className="text-amber-300 font-bold truncate">{directModelSnippet}</pre>
              <p className="text-[11px] text-slate-400 mt-2 font-sans font-normal leading-relaxed">
                Switch straight to Opus 5.5, Sonnet 5.5, GPT-4o, or DeepSeek.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1E1B2E] text-white p-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-violet-300 uppercase font-bold tracking-wider mb-2">
                3. Session Target Flag
              </p>
              <pre className="text-cyan-300 font-bold">{claudeFlagSnippet}</pre>
              <p className="text-[11px] text-slate-400 mt-2 font-sans font-normal leading-relaxed">
                Launch Claude Code directly into your target model for this session.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-violet-900 font-medium">
            💡 <strong>Model Catalog &amp; Quota Check:</strong> Run <code className="font-mono font-bold text-violet-800 bg-white px-1.5 py-0.5 rounded border border-violet-200">npx lightningdeals models</code> to view available models and quota balances live.
          </span>
          <Link to="/models" className="font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1">
            <span>View Catalog Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Editor & Client Setup Tabs */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-fg">Manual Editor &amp; Agent Configuration</h3>
            <p className="text-xs text-muted">
              Choose your platform to copy environment variables or configuration blocks.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('claude-code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'claude-code'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              Claude Code
            </button>
            <button
              onClick={() => setActiveTab('cursor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cursor'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              Cursor
            </button>
            <button
              onClick={() => setActiveTab('windsurf')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'windsurf'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              Windsurf
            </button>
            <button
              onClick={() => setActiveTab('vscode')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vscode'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              VS Code / Continue
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'python'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              Python SDK
            </button>
            <button
              onClick={() => setActiveTab('node')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'node'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              TypeScript / Node
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'curl'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-fg'
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'claude-code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg">Terminal Environment Setup</span>
              <button
                onClick={() => copyCode(claudeCodeSnippet, 'tab_claude')}
                className="ui-button-secondary text-xs py-1 px-3 flex items-center gap-1 font-bold cursor-pointer"
              >
                {copiedId === 'tab_claude' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'tab_claude' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-sm">
              <pre>{claudeCodeSnippet}</pre>
            </div>
            <p className="text-xs text-muted">
              Anthropic CLI will automatically communicate with LightningAPI. All responses stream with low latency.
            </p>
          </div>
        )}

        {activeTab === 'cursor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-800 uppercase">Method 1: Anthropic Override (Claude)</span>
                <button
                  onClick={() => copyCode(cursorAnthropicSnippet, 'tab_cursor_ant')}
                  className="text-xs text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_cursor_ant' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_cursor_ant' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{cursorAnthropicSnippet}</pre>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase">Method 2: OpenAI Compatible (OpenAI &amp; Local)</span>
                <button
                  onClick={() => copyCode(cursorOpenAISnippet, 'tab_cursor_oai')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_cursor_oai' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_cursor_oai' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{cursorOpenAISnippet}</pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'windsurf' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg">Windsurf Cascade Custom AI Configuration</span>
              <button
                onClick={() => copyCode(windsurfSnippet, 'tab_windsurf')}
                className="ui-button-secondary text-xs py-1 px-3 flex items-center gap-1 font-bold cursor-pointer"
              >
                {copiedId === 'tab_windsurf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'tab_windsurf' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-sm">
              <pre>{windsurfSnippet}</pre>
            </div>
          </div>
        )}

        {activeTab === 'vscode' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg">Continue / Roo Code / Cline configuration JSON</span>
              <button
                onClick={() => copyCode(vscodeContinueSnippet, 'tab_continue')}
                className="ui-button-secondary text-xs py-1 px-3 flex items-center gap-1 font-bold cursor-pointer"
              >
                {copiedId === 'tab_continue' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'tab_continue' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-sm">
              <pre>{vscodeContinueSnippet}</pre>
            </div>
          </div>
        )}

        {activeTab === 'python' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-800 uppercase">Anthropic SDK (Claude)</span>
                <button
                  onClick={() => copyCode(pythonAnthropicSnippet, 'tab_py_ant')}
                  className="text-xs text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_py_ant' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_py_ant' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{pythonAnthropicSnippet}</pre>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase">OpenAI SDK (OpenAI &amp; Local)</span>
                <button
                  onClick={() => copyCode(pythonOpenAISnippet, 'tab_py_oai')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_py_oai' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_py_oai' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{pythonOpenAISnippet}</pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'node' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-800 uppercase">@anthropic-ai/sdk</span>
                <button
                  onClick={() => copyCode(nodeAnthropicSnippet, 'tab_node_ant')}
                  className="text-xs text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_node_ant' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_node_ant' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{nodeAnthropicSnippet}</pre>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase">openai package</span>
                <button
                  onClick={() => copyCode(nodeOpenAISnippet, 'tab_node_oai')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_node_oai' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_node_oai' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{nodeOpenAISnippet}</pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'curl' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-800 uppercase">cURL Anthropic (/v1/messages)</span>
                <button
                  onClick={() => copyCode(curlAnthropicSnippet, 'tab_curl_ant')}
                  className="text-xs text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_curl_ant' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_curl_ant' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{curlAnthropicSnippet}</pre>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase">cURL OpenAI (/v1/chat/completions)</span>
                <button
                  onClick={() => copyCode(curlOpenAISnippet, 'tab_curl_oai')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'tab_curl_oai' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'tab_curl_oai' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="rounded-xl bg-[#1E1B2E] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                <pre>{curlOpenAISnippet}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Status Verification Card */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-fg">
                Check Key Balance &amp; Status Programmatically
              </h3>
              <p className="text-xs text-muted">
                Inspect your live rolling window allowance, credit balance, or remaining tokens in real time.
              </p>
            </div>
          </div>

          <button
            onClick={() => copyCode(keyStatusCurl, 'key_status_curl')}
            className="ui-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold cursor-pointer"
          >
            {copiedId === 'key_status_curl' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedId === 'key_status_curl' ? 'Copied' : 'Copy cURL Check'}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-[#1E1B2E] text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-sm">
          <pre>{keyStatusCurl}</pre>
        </div>
      </div>
    </div>
  );
};

export default UserDocs;
