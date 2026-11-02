import React, { useState } from 'react';
import {
  Wrench,
  Terminal,
  Cpu,
  Sparkles,
  Check,
  Copy,
  ArrowRight,
  Info,
  ExternalLink,
  Laptop,
  Layers,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

interface SetupApp {
  id: string;
  name: string;
  badge: string;
  protocol: 'anthropic' | 'openai';
  defaultModel: string;
  supportedPlans: ('rolling' | 'credit' | 'token')[];
}

const APPS: SetupApp[] = [
  { id: 'claude-code', name: 'Claude Code', badge: 'CLI Assistant', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'cursor', name: 'Cursor IDE', badge: 'AI Code Editor', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'codex', name: 'Codex CLI', badge: 'OpenAI Terminal', protocol: 'openai', defaultModel: 'gpt-4o', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'vscode', name: 'VS Code (Extensions)', badge: 'IDE Integration', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'windsurf', name: 'Windsurf IDE', badge: 'AI IDE', protocol: 'openai', defaultModel: 'gpt-4o', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'cline', name: 'Cline', badge: 'Autonomous Agent', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'roo-code', name: 'Roo Code', badge: 'Multi-Mode Agent', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'continue', name: 'Continue.dev', badge: 'Open Copilot', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'trae', name: 'TRAE SOLO', badge: 'Adaptive Editor', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'claude-desktop', name: 'Claude Desktop', badge: 'Native App', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'cherry-studio', name: 'Cherry Studio', badge: 'Desktop Workspace', protocol: 'openai', defaultModel: 'gpt-4o', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'n8n', name: 'n8n Workflows', badge: 'Automation Engine', protocol: 'openai', defaultModel: 'gpt-4o', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'python', name: 'Python SDK', badge: 'Official SDK', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'node', name: 'Node.js / TypeScript', badge: 'Official SDK', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
  { id: 'curl', name: 'Direct cURL / REST', badge: 'HTTP Terminal', protocol: 'anthropic', defaultModel: 'claude-sonnet-5.5', supportedPlans: ['rolling', 'credit', 'token'] },
];

export const SetupWizard: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<string>('claude-code');
  const [selectedOs, setSelectedOs] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [selectedPlan, setSelectedPlan] = useState<'rolling' | 'credit' | 'token'>('rolling');
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-5.5');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const activeApp = APPS.find((a) => a.id === selectedApp) || APPS[0];
  const userKey = apiKeyInput.trim() || 'ld_live_your_api_key_here';

  // Base URL calculation according to protocol
  const baseUrl = activeApp.protocol === 'openai' ? 'https://lightningapi.pro/v1' : 'https://lightningapi.pro';

  // Generate exact config based on app, OS, plan, model
  const generateConfig = () => {
    switch (activeApp.id) {
      case 'claude-code': {
        const filePath =
          selectedOs === 'windows'
            ? '%USERPROFILE%\\.claude\\settings.json'
            : '~/.claude/settings.json';

        const jsonContent = JSON.stringify(
          {
            env: {
              ANTHROPIC_BASE_URL: 'https://lightningapi.pro',
              ANTHROPIC_AUTH_TOKEN: userKey,
              ANTHROPIC_MODEL: selectedModel,
              ANTHROPIC_DEFAULT_OPUS_MODEL: selectedModel.includes('opus') ? selectedModel : 'claude-opus-5.5',
              ANTHROPIC_DEFAULT_SONNET_MODEL: selectedModel.includes('sonnet') ? selectedModel : 'claude-sonnet-5.5',
              ANTHROPIC_DEFAULT_HAIKU_MODEL: 'claude-haiku-5.5',
            },
            model: selectedModel,
          },
          null,
          2
        );

        const terminalCommand =
          selectedOs === 'windows'
            ? `$env:ANTHROPIC_BASE_URL="https://lightningapi.pro"\n$env:ANTHROPIC_AUTH_TOKEN="${userKey}"\nclaude`
            : `export ANTHROPIC_BASE_URL="https://lightningapi.pro"\nexport ANTHROPIC_AUTH_TOKEN="${userKey}"\nclaude`;

        return {
          type: 'json_and_terminal',
          filePath,
          jsonContent,
          terminalCommand,
          testCommand: 'claude',
          notes: 'Claude Code will automatically authenticate with LightningAPI and load your selected model.',
        };
      }

      case 'cursor': {
        const filePath =
          selectedOs === 'windows'
            ? '%APPDATA%\\Cursor\\User\\settings.json'
            : selectedOs === 'macos'
            ? '~/Library/Application Support/Cursor/User/settings.json'
            : '~/.config/Cursor/User/settings.json';

        const jsonContent = JSON.stringify(
          {
            'cursor.cpp.overrideAnthropicApiKey': userKey,
            'cursor.cpp.anthropicBaseUrl': 'https://lightningapi.pro',
            'cursor.general.model': selectedModel,
            'claude.model': selectedModel,
          },
          null,
          2
        );

        return {
          type: 'json',
          filePath,
          jsonContent,
          testCommand: 'Open Cursor, press Ctrl+L (or Cmd+L), and prompt the model.',
          notes: 'In Cursor Settings -> Models, ensure "Override Anthropic Base URL" is enabled.',
        };
      }

      case 'codex': {
        const filePath =
          selectedOs === 'windows'
            ? '%USERPROFILE%\\.codex\\settings.json'
            : '~/.codex/settings.json';

        const jsonContent = JSON.stringify(
          {
            api_base: 'https://lightningapi.pro/v1',
            api_key: userKey,
            model: selectedModel.includes('gpt') ? selectedModel : 'gpt-4o',
          },
          null,
          2
        );

        const terminalCommand =
          selectedOs === 'windows'
            ? `$env:OPENAI_BASE_URL="https://lightningapi.pro/v1"\n$env:OPENAI_API_KEY="${userKey}"\ncodex`
            : `export OPENAI_BASE_URL="https://lightningapi.pro/v1"\nexport OPENAI_API_KEY="${userKey}"\ncodex`;

        return {
          type: 'json_and_terminal',
          filePath,
          jsonContent,
          terminalCommand,
          testCommand: 'codex "Hello from LightningAPI"',
          notes: 'Codex connects to LightningAPI through our standard OpenAI-compatible completions endpoint.',
        };
      }

      case 'cline':
      case 'roo-code': {
        const filePath =
          selectedOs === 'windows'
            ? `%USERPROFILE%\\.${activeApp.id === 'cline' ? 'cline' : 'roo'}\\settings.json`
            : `~/.${activeApp.id === 'cline' ? 'cline' : 'roo'}/settings.json`;

        const jsonContent = JSON.stringify(
          {
            apiProvider: 'anthropic',
            anthropicBaseUrl: 'https://lightningapi.pro',
            apiKey: userKey,
            apiModelId: selectedModel,
          },
          null,
          2
        );

        return {
          type: 'json',
          filePath,
          jsonContent,
          testCommand: 'Click the extension icon in VS Code, and start an autonomous task.',
          notes: 'Set the API Provider to "Anthropic" and enter your LightningAPI key.',
        };
      }

      case 'continue': {
        const filePath =
          selectedOs === 'windows'
            ? '%USERPROFILE%\\.continue\\config.json'
            : '~/.continue/config.json';

        const jsonContent = JSON.stringify(
          {
            models: [
              {
                title: `${selectedModel} (LightningAPI)`,
                provider: 'anthropic',
                model: selectedModel,
                apiKey: userKey,
                apiBase: 'https://lightningapi.pro',
              },
            ],
          },
          null,
          2
        );

        return {
          type: 'json',
          filePath,
          jsonContent,
          testCommand: 'Press Ctrl+I / Cmd+I inside any file to invoke inline generation.',
          notes: 'Add this model configuration block inside your models array in config.json.',
        };
      }

      case 'claude-desktop': {
        const filePath =
          selectedOs === 'windows'
            ? '%APPDATA%\\Claude\\claude_desktop_config.json'
            : '~/Library/Application Support/Claude/claude_desktop_config.json';

        const jsonContent = JSON.stringify(
          {
            anthropicBaseUrl: 'https://lightningapi.pro',
            apiKey: userKey,
          },
          null,
          2
        );

        return {
          type: 'json',
          filePath,
          jsonContent,
          testCommand: 'Restart Claude Desktop and send a message.',
          notes: 'Save this configuration and restart Claude Desktop.',
        };
      }

      case 'python': {
        const terminalCommand = `pip install anthropic`;
        const codeSnippet = `import os
from anthropic import Anthropic

client = Anthropic(
    base_url="https://lightningapi.pro",
    api_key="${userKey}"
)

message = client.messages.create(
    model="${selectedModel}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello LightningAPI!"}
    ]
)
print(message.content[0].text)`;

        return {
          type: 'sdk',
          filePath: 'script.py',
          jsonContent: codeSnippet,
          terminalCommand,
          testCommand: 'python script.py',
          notes: 'Uses the official Anthropic Python SDK with LightningAPI as the custom base_url.',
        };
      }

      case 'node': {
        const terminalCommand = `npm install @anthropic-ai/sdk`;
        const codeSnippet = `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: '${userKey}',
});

async function main() {
  const message = await anthropic.messages.create({
    model: '${selectedModel}',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello LightningAPI!' }],
  });
  console.log(message.content[0].text);
}

main();`;

        return {
          type: 'sdk',
          filePath: 'index.ts',
          jsonContent: codeSnippet,
          terminalCommand,
          testCommand: 'node index.js',
          notes: 'Uses the official Anthropic TypeScript SDK with LightningAPI custom baseURL.',
        };
      }

      default: {
        // cURL or default REST
        const curlSnippet = `curl -X POST "https://lightningapi.pro/v1/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${userKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${selectedModel}",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello from the terminal!"}
    ]
  }'`;

        return {
          type: 'terminal',
          filePath: 'Terminal',
          jsonContent: curlSnippet,
          testCommand: 'Execute in your terminal.',
          notes: 'Standard HTTP REST request directly via cURL.',
        };
      }
    }
  };

  const configResult = generateConfig();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#ede8e1] shadow-playful overflow-hidden font-sans">
      {/* Wizard Header */}
      <div className="p-6 bg-linear-to-r from-[#faf8f5] to-white border-b border-[#ede8e1] space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold font-mono">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Interactive Setup Assistant</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[#1e1b2e] tracking-tight">
          Configure Any Tool in Seconds
        </h3>
        <p className="text-xs sm:text-sm text-[#64607d] max-w-2xl leading-relaxed">
          Select your tool, operating system, and plan. The assistant generates the exact file paths and validated configurations tailored for your environment.
        </p>
      </div>

      {/* 1-Command Automatic Setup Callout */}
      <div className="mx-6 mt-6 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-950">Prefer 1-Command Automatic Setup?</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-200/60 text-violet-800">
                Terminal / PowerShell
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-600 mt-0.5">
              Run <code className="font-mono font-bold text-violet-900 bg-white px-1.5 py-0.5 rounded border border-violet-200">npx lightningdeals</code> to auto-configure Cursor, Claude Code, Codex, and environment variables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 text-white font-mono text-xs px-3 py-1.5 rounded-xl shrink-0 border border-zinc-800 shadow-inner">
          <span className="text-emerald-400 font-bold select-all">npx lightningdeals</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('npx lightningdeals');
              setCopiedCli(true);
              setTimeout(() => setCopiedCli(false), 2000);
            }}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer pl-1"
            title="Copy 1-command installer"
          >
            {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Step 1: Select Application */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#64607d] flex items-center justify-between">
            <span>Step 1: Choose Application or Client</span>
            <span className="text-[11px] text-violet-700 font-normal">14+ supported tools</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {APPS.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApp(app.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  selectedApp === app.id
                    ? 'border-violet-600 bg-violet-50/60 shadow-xs ring-1 ring-violet-600'
                    : 'border-[#ede8e1] bg-white hover:border-violet-200 hover:bg-[#faf8f5]'
                }`}
              >
                <span className="text-xs font-bold text-[#1e1b2e] truncate">{app.name}</span>
                <span className="text-[10px] text-[#64607d] font-mono truncate">{app.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Operating System */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#64607d]">
            Step 2: Operating System
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'windows', label: 'Windows', sub: 'PowerShell / CMD' },
              { id: 'macos', label: 'macOS', sub: 'Zsh / Terminal' },
              { id: 'linux', label: 'Linux', sub: 'Bash / Shell' },
            ].map((os) => (
              <button
                key={os.id}
                type="button"
                onClick={() => setSelectedOs(os.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedOs === os.id
                    ? 'border-violet-600 bg-violet-50/60 shadow-xs ring-1 ring-violet-600'
                    : 'border-[#ede8e1] bg-white hover:border-violet-200 hover:bg-[#faf8f5]'
                }`}
              >
                <div className="text-xs font-bold text-[#1e1b2e]">{os.label}</div>
                <div className="text-[10px] text-[#64607d] font-mono">{os.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Plan Category & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#64607d]">
              Step 3: Your Plan Category
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-[#ede8e1] bg-white text-xs font-semibold text-[#1e1b2e] focus:outline-hidden focus:border-violet-600"
            >
              <option value="rolling">Claude Max (5-Hour Rolling Window)</option>
              <option value="credit">Prepaid API Credit Wallet</option>
              <option value="token">Prepaid Consumable Token Pack</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#64607d]">
              Step 4: Target Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#ede8e1] bg-white text-xs font-semibold text-[#1e1b2e] focus:outline-hidden focus:border-violet-600 font-mono"
            >
              <option value="claude-sonnet-5.5">claude-sonnet-5.5 (Recommended for Coding)</option>
              <option value="claude-opus-5.5">claude-opus-5.5 (Deep Reasoning)</option>
              <option value="gpt-4o">gpt-4o (OpenAI Frontier)</option>
              <option value="gemini-4-argon">gemini-4-argon (Multimodal 1M Context)</option>
              <option value="claude-haiku-5.5">claude-haiku-5.5 (Fast & Lightweight)</option>
            </select>
          </div>
        </div>

        {/* Optional Live Key Input */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1e1b2e] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Personalize with Your API Key (Optional)</span>
            </label>
            <span className="text-[10px] text-[#64607d] font-mono">Keys are processed locally only</span>
          </div>
          <input
            type="text"
            placeholder="Paste your key: ld_live_..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#ede8e1] bg-white text-xs font-mono text-[#1e1b2e] placeholder:text-[#a8a29e] focus:outline-hidden focus:border-violet-600"
          />
        </div>

        {/* Generated Configuration Output */}
        <div className="space-y-3 pt-2 border-t border-[#ede8e1]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-[#1e1b2e]">
                Configuration for {activeApp.name} ({selectedOs.toUpperCase()})
              </span>
            </div>
            {configResult.filePath && (
              <span className="text-[11px] font-mono text-[#64607d] bg-stone-100 px-2 py-0.5 rounded border border-stone-200 truncate max-w-[280px]">
                {configResult.filePath}
              </span>
            )}
          </div>

          {/* Quick Terminal Fast Track (if available) */}
          {configResult.terminalCommand && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#64607d]">Option A: Fast Terminal Command</span>
              <div className="relative rounded-2xl bg-[#0c0d14] text-[#f4f4f5] p-3.5 font-mono text-xs border border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleCopy(configResult.terminalCommand!)}
                  className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                <pre className="overflow-x-auto whitespace-pre">{configResult.terminalCommand}</pre>
              </div>
            </div>
          )}

          {/* Configuration File / Code (if available) */}
          {configResult.jsonContent && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#64607d]">
                {configResult.terminalCommand ? 'Option B: Configuration File' : 'Settings Configuration'}
              </span>
              <div className="relative rounded-2xl bg-[#0c0d14] text-[#f4f4f5] p-3.5 font-mono text-xs border border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleCopy(configResult.jsonContent)}
                  className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                <pre className="overflow-x-auto whitespace-pre max-h-[300px]">{configResult.jsonContent}</pre>
              </div>
            </div>
          )}

          {/* Verification & Notes */}
          <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/70 flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-violet-950">How to Verify Connection:</p>
              <p className="text-violet-900 leading-relaxed">{configResult.testCommand}</p>
              <p className="text-[11px] text-violet-800 font-mono pt-1">{configResult.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
