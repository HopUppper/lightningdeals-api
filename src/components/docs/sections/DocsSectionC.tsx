import React from 'react';
import {
  Wrench,
  Terminal,
  Cpu,
  FileCode,
  Laptop,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { MultiOsCodeBlock } from '../MultiOsCodeBlock';
import { SetupWizard } from '../SetupWizard';

export const DocsSectionC: React.FC = () => {
  return (
    <section id="sec-connect-apps" className="space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section C
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Connect Your Application (14+ Verified Guides)
        </h2>
      </div>

      {/* C0: Interactive Setup Wizard */}
      <div id="interactive-wizard" className="scroll-mt-24 space-y-4">
        <SetupWizard />
      </div>

      {/* C1: Claude Code CLI */}
      <article
        id="guide-claude-code"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-600" />
            <span>1. Claude Code CLI</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
            Native Anthropic Protocol
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Claude Code is Anthropic&apos;s agentic command-line assistant. Configure your settings file or terminal environment to route requests through LightningAPI:
        </p>
        <div className="text-xs font-mono text-[#78716c] bg-stone-100 p-2.5 rounded-xl border border-stone-200">
          Configuration File: <strong>~/.claude/settings.json</strong> (macOS/Linux) or <strong>%USERPROFILE%\.claude\settings.json</strong> (Windows)
        </div>
        <MultiOsCodeBlock
          filename="~/.claude/settings.json"
          tabs={[
            {
              label: 'Configuration JSON',
              language: 'json',
              code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
    "ANTHROPIC_AUTH_TOKEN": "ld_live_your_api_key_here",
    "ANTHROPIC_MODEL": "claude-sonnet-5.5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5.5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5.5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-5.5"
  },
  "model": "claude-sonnet-5.5"
}`,
            },
          ]}
        />
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Verify by running <code className="font-mono font-bold">claude</code> in your terminal.</span>
        </div>
      </article>

      {/* C2: Cursor IDE */}
      <article
        id="guide-cursor"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-violet-600" />
            <span>2. Cursor IDE</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
            Anthropic &amp; OpenAI Compatible
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In Cursor, open Settings (<kbd className="px-1.5 py-0.5 rounded bg-stone-100 border text-[11px] font-mono">Ctrl+,</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border text-[11px] font-mono">Cmd+,</kbd>) → Models:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5">
          <li>Toggle on <strong>&quot;Override Anthropic Base URL&quot;</strong> and enter: <code className="font-mono font-bold text-violet-700">https://lightningapi.pro</code></li>
          <li>Enter your LightningAPI key in <strong>Anthropic API Key</strong>: <code className="font-mono font-bold text-violet-700">ld_live_...</code></li>
          <li>Add Model Name: <code className="font-mono font-bold text-violet-700">claude-sonnet-5.5</code> or <code className="font-mono font-bold text-violet-700">claude-opus-5.5</code></li>
        </ul>
        <MultiOsCodeBlock
          filename="settings.json (Cursor User Settings)"
          tabs={[
            {
              label: 'Cursor settings.json',
              language: 'json',
              code: `{
  "cursor.cpp.overrideAnthropicApiKey": "ld_live_your_api_key_here",
  "cursor.cpp.anthropicBaseUrl": "https://lightningapi.pro",
  "cursor.general.model": "claude-sonnet-5.5"
}`,
            },
          ]}
        />
      </article>

      {/* C3: Codex CLI */}
      <article
        id="guide-codex"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            <span>3. Codex CLI</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
            OpenAI Compatible (/v1)
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Codex connects via OpenAI compatibility mode. Set your environment variables:
        </p>
        <MultiOsCodeBlock
          tabs={[
            {
              label: 'macOS / Linux',
              language: 'bash',
              code: `export OPENAI_BASE_URL="https://lightningapi.pro/v1"
export OPENAI_API_KEY="ld_live_your_api_key_here"
codex "Create a React modal component"`,
            },
            {
              label: 'Windows PowerShell',
              language: 'powershell',
              code: `$env:OPENAI_BASE_URL="https://lightningapi.pro/v1"
$env:OPENAI_API_KEY="ld_live_your_api_key_here"
codex "Create a React modal component"`,
            },
          ]}
        />
      </article>

      {/* C4: Visual Studio Code */}
      <article
        id="guide-vscode"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-600" />
            <span>4. Visual Studio Code</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
            Extensions &amp; Global Proxy
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Use LightningAPI inside official VS Code with AI coding extensions such as Continue, Cline, or Roo Code:
        </p>
        <MultiOsCodeBlock
          filename="settings.json (VS Code Settings)"
          tabs={[
            {
              label: 'VS Code settings.json',
              language: 'json',
              code: `{
  "chat.defaultModel": "claude-sonnet-5.5",
  "terminal.integrated.env.windows": {
    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
    "ANTHROPIC_AUTH_TOKEN": "ld_live_your_api_key_here",
    "OPENAI_BASE_URL": "https://lightningapi.pro/v1",
    "OPENAI_API_KEY": "ld_live_your_api_key_here"
  },
  "terminal.integrated.env.osx": {
    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
    "ANTHROPIC_AUTH_TOKEN": "ld_live_your_api_key_here",
    "OPENAI_BASE_URL": "https://lightningapi.pro/v1",
    "OPENAI_API_KEY": "ld_live_your_api_key_here"
  }
}`,
            },
          ]}
        />
      </article>

      {/* C5: Windsurf IDE */}
      <article
        id="guide-windsurf"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Laptop className="w-5 h-5 text-teal-600" />
            <span>5. Windsurf IDE (Codeium Flow)</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
            Cascade AI Engine
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In Windsurf, open <strong className="text-[#1c1917]">Settings → AI Provider Settings</strong>:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5">
          <li>Select Provider: <strong>Custom OpenAI Compatible</strong></li>
          <li>API Endpoint: <code className="font-mono font-bold text-violet-700">https://lightningapi.pro/v1</code></li>
          <li>API Key: <code className="font-mono font-bold text-violet-700">ld_live_your_api_key_here</code></li>
          <li>Default Model: <code className="font-mono font-bold text-violet-700">claude-sonnet-5.5</code> or <code className="font-mono font-bold text-violet-700">gpt-4o</code></li>
        </ul>
      </article>

      {/* C6: Cline */}
      <article
        id="guide-cline"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            <span>6. Cline (Autonomous Agent Extension)</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
            Multi-Turn Agent
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In VS Code, click the Cline sidebar icon and open extension Settings:
        </p>
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            <div><span className="text-zinc-500">API Provider:</span> <strong>Anthropic</strong></div>
            <div><span className="text-zinc-500">Base URL:</span> <strong>https://lightningapi.pro</strong></div>
            <div><span className="text-zinc-500">API Key:</span> <strong>ld_live_...</strong></div>
            <div><span className="text-zinc-500">Model ID:</span> <strong>claude-sonnet-5.5</strong></div>
          </div>
        </div>
      </article>

      {/* C7: Roo Code */}
      <article
        id="guide-roo-code"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>7. Roo Code (Architect, Code &amp; Ask Modes)</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
            Autonomous Modes
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Roo Code supports custom mode presets. Configure Anthropic provider with your LightningAPI key:
        </p>
        <MultiOsCodeBlock
          title="Roo Code Configuration"
          tabs={[
            {
              label: 'Provider Settings',
              language: 'json',
              code: `{
  "provider": "anthropic",
  "baseUrl": "https://lightningapi.pro",
  "apiKey": "ld_live_your_api_key_here",
  "models": {
    "code": "claude-sonnet-5.5",
    "architect": "claude-opus-5.5",
    "ask": "claude-haiku-5.5"
  }
}`,
            },
          ]}
        />
      </article>

      {/* C8: Continue.dev */}
      <article
        id="guide-continue"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <FileCode className="w-5 h-5 text-violet-600" />
          <span>8. Continue.dev</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Add this model definition to your <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">~/.continue/config.json</code>:
        </p>
        <MultiOsCodeBlock
          filename="~/.continue/config.json"
          tabs={[
            {
              label: 'config.json',
              language: 'json',
              code: `{
  "models": [
    {
      "title": "Claude Sonnet 5.5 (LightningAPI)",
      "provider": "anthropic",
      "model": "claude-sonnet-5.5",
      "apiKey": "ld_live_your_api_key_here",
      "apiBase": "https://lightningapi.pro"
    },
    {
      "title": "GPT-4o (LightningAPI)",
      "provider": "openai",
      "model": "gpt-4o",
      "apiKey": "ld_live_your_api_key_here",
      "apiBase": "https://lightningapi.pro/v1"
    }
  ]
}`,
            },
          ]}
        />
      </article>

      {/* C9: TRAE SOLO */}
      <article
        id="guide-trae"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Laptop className="w-5 h-5 text-amber-600" />
            <span>9. TRAE SOLO</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
            ByteDance AI IDE
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In TRAE, open Settings → Model Management → Custom Model Provider:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5">
          <li>Endpoint: <code className="font-mono font-bold text-violet-700">https://lightningapi.pro/v1</code></li>
          <li>API Key: <code className="font-mono font-bold text-violet-700">ld_live_your_api_key_here</code></li>
          <li>Model Name: <code className="font-mono font-bold text-violet-700">claude-sonnet-5.5</code> or <code className="font-mono font-bold text-violet-700">gpt-4o</code></li>
        </ul>
      </article>

      {/* C10: Claude Desktop */}
      <article
        id="guide-claude-desktop"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Laptop className="w-5 h-5 text-orange-600" />
            <span>10. Claude Desktop Native App</span>
          </h3>
          <span className="text-[10px] font-bold font-mono bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
            macOS &amp; Windows Desktop
          </span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Configure Claude Desktop by editing its configuration file:
        </p>
        <div className="text-xs font-mono text-[#78716c] bg-stone-100 p-2.5 rounded-xl border border-stone-200">
          Path: <strong>~/Library/Application Support/Claude/claude_desktop_config.json</strong> (macOS) or <strong>%APPDATA%\Claude\claude_desktop_config.json</strong> (Windows)
        </div>
        <MultiOsCodeBlock
          filename="claude_desktop_config.json"
          tabs={[
            {
              label: 'claude_desktop_config.json',
              language: 'json',
              code: `{
  "globalShortcut": "CommandOrControl+Shift+Space",
  "env": {
    "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
    "ANTHROPIC_API_KEY": "ld_live_your_api_key_here"
  }
}`,
            },
          ]}
        />
      </article>

      {/* C11: Cherry Studio */}
      <article
        id="guide-cherry-studio"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Laptop className="w-5 h-5 text-rose-600" />
          <span>11. Cherry Studio (Multi-Provider Chat Client)</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In Cherry Studio Settings → Model Providers, add a custom provider:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5">
          <li>Provider Type: <strong>OpenAI Compatible</strong></li>
          <li>Base URL: <code className="font-mono font-bold text-violet-700">https://lightningapi.pro/v1</code></li>
          <li>API Key: <code className="font-mono font-bold text-violet-700">ld_live_your_api_key_here</code></li>
          <li>Click <strong>&quot;Fetch Models&quot;</strong> to automatically populate all models authorized for your key.</li>
        </ul>
      </article>

      {/* C12: n8n Automation Engine */}
      <article
        id="guide-n8n"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <span>12. n8n Workflow Automation</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          In n8n, connect LightningAPI using the OpenAI Chat Model node or Anthropic Chat Model node:
        </p>
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2 text-xs">
          <p className="font-bold text-[#1c1917]">OpenAI Chat Model Node in n8n:</p>
          <ul className="list-disc list-inside space-y-1 text-[#44403c]">
            <li>Credential: Create new OpenAI API credential</li>
            <li>API Key: <code className="font-mono">ld_live_your_api_key_here</code></li>
            <li>Base URL override (under Node Options): <code className="font-mono">https://lightningapi.pro/v1</code></li>
            <li>Model: Select or enter <code className="font-mono font-bold">gpt-4o</code> or <code className="font-mono font-bold">claude-sonnet-5.5</code></li>
          </ul>
        </div>
      </article>

      {/* C13: Python SDK */}
      <article
        id="guide-python"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-600" />
          <span>13. Python SDK Integration (Anthropic &amp; OpenAI)</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Install official SDKs and pass your LightningAPI custom base URL:
        </p>
        <MultiOsCodeBlock
          title="Python Examples (Streaming & Non-Streaming)"
          tabs={[
            {
              label: 'Anthropic Python (Streaming)',
              language: 'python',
              code: `import os
from anthropic import Anthropic

client = Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

with client.messages.stream(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a Python binary search function."}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`,
            },
            {
              label: 'OpenAI Python (Streaming)',
              language: 'python',
              code: `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://lightningapi.pro/v1",
    api_key="ld_live_your_api_key_here"
)

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a Python binary search function."}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`,
            },
          ]}
        />
      </article>

      {/* C14: Node.js & TypeScript */}
      <article
        id="guide-node"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Code2 className="w-5 h-5 text-teal-600" />
          <span>14. Node.js &amp; TypeScript Integration</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Use official Node.js SDKs with full TypeScript type safety:
        </p>
        <MultiOsCodeBlock
          title="Node.js & TypeScript Examples"
          tabs={[
            {
              label: 'Anthropic SDK (TypeScript)',
              language: 'typescript',
              code: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_your_key_here',
});

const stream = await client.messages.create({
  model: 'claude-sonnet-5.5',
  max_tokens: 1024,
  stream: true,
  messages: [{ role: 'user', content: 'Explain TypeScript generics in 2 sentences.' }],
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    process.stdout.write(chunk.delta.text);
  }
}`,
            },
            {
              label: 'OpenAI SDK (TypeScript)',
              language: 'typescript',
              code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://lightningapi.pro/v1',
  apiKey: process.env.LIGHTNING_API_KEY || 'ld_live_your_key_here',
});

const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  stream: true,
  messages: [{ role: 'user', content: 'Explain TypeScript generics in 2 sentences.' }],
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}`,
            },
          ]}
        />
      </article>
    </section>
  );
};
