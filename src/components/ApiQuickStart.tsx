import React, { useState } from 'react';
import { Copy, Check, Terminal, Code, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApiQuickStart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    curl: `export LIGHTNINGDEALS_API_KEY="ld_live_your_key_here"

curl http://localhost:3001/v1/messages \\
  -H "x-api-key: $LIGHTNINGDEALS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      { "role": "user", "content": "Hello LightningDeals!" }
    ]
  }'`,
    python: `import os
from anthropic import Anthropic

client = Anthropic(
    base_url="http://localhost:3001",
    api_key="ld_live_your_key_here"
)

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello LightningDeals!"}]
)

print(response.content[0].text)`,
    node: `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'http://localhost:3001',
  apiKey: 'ld_live_your_key_here',
});

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 100,
  messages: [{ role: 'user', content: 'Hello LightningDeals!' }],
});

console.log(message.content[0].text);`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="border-b border-border bg-card/30 py-16 sm:py-24">
      <div className="mx-auto grid max-w-page grid-cols-1 gap-8 px-5 sm:px-6 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        
        {/* Left Column: API Info */}
        <div className="min-w-0 max-w-xl">
          <p className="ui-kicker flex items-center gap-1.5 font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">
            <Terminal className="h-4 w-4 text-amber-500" />
            <span>API Quick Start</span>
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Make your first API call in a minute.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Use your LightningDeals key with standard Anthropic SDKs or HTTP requests. The API gateway automatically routes requests to supported LLMs using permanent token balances.
          </p>

          <dl className="mt-7 space-y-4 text-xs border-t border-border/60 pt-6 font-mono">
            <div>
              <dt className="font-semibold text-fg">API Gateway Base URL</dt>
              <dd className="mt-1 break-all text-xs text-amber-500 bg-bg px-3 py-1.5 rounded border border-border w-fit font-bold">
                http://localhost:3001
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Authentication Header</dt>
              <dd className="mt-1 break-all text-xs text-muted bg-bg px-3 py-1.5 rounded border border-border w-fit">
                x-api-key: ld_live_…
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/docs" className="ui-button-primary justify-center">
              Explore API Docs
            </Link>
            <Link to="/trial" className="ui-button-secondary justify-center">
              Get Free Trial Key
            </Link>
          </div>
        </div>

        {/* Right Column: Code Playground Interface */}
        <div className="min-w-0 rounded-panel border border-border bg-[#090d16] p-1 shadow-2xl flex flex-col">
          
          {/* Code Bar Header */}
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              {(['curl', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    activeTab === tab
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'Node.js'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1.5 rounded border px-3 text-xs font-semibold font-mono transition-colors border-white/20 bg-white/10 text-white hover:bg-white/15"
              aria-label="Copy request"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <pre className="landing-code min-w-0 p-5 text-left font-mono text-[12px] leading-6 text-slate-100 overflow-x-auto">
            <code>{codeSnippets[activeTab]}</code>
          </pre>

          {/* Code Footnote */}
          <div className="mt-auto border-t border-white/10 px-4 py-3 text-xs font-mono text-slate-400 bg-black/30 flex justify-between items-center">
            <span>Anthropic Messages drop-in compatibility.</span>
            <span className="text-amber-400 font-bold">200 OK</span>
          </div>
        </div>

      </div>

      {/* Claude Code Callout Footer */}
      <div className="mx-auto max-w-page px-5 pt-10 sm:px-6">
        <aside className="rounded-panel border border-amber-500/20 bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 shadow-lg">
          <div>
            <p className="text-sm font-bold text-fg">Prefer one-command automatic CLI setup?</p>
            <p className="mt-1 text-xs text-muted">
              Run <code className="font-mono text-amber-500 font-bold bg-bg px-2 py-0.5 rounded border border-border">npx lightningdeals</code> in your terminal to automatically configure Claude Code, Cursor, Windsurf, and VS Code.
            </p>
          </div>
          <Link
            to="/docs/setup/claude-code"
            className="arrow-cta mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 transition-colors hover:text-amber-400 sm:mt-0"
          >
            <span>Read CLI Setup Guide</span>
            <span className="arrow-cta__icon" aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    </section>
  );
};
