import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  KeyRound,
  Zap,
  Sparkles,
  Layers,
  Terminal,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { MultiOsCodeBlock } from '../MultiOsCodeBlock';

export const DocsSectionA: React.FC = () => {
  return (
    <section id="sec-getting-started" className="space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section A
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Getting Started with LightningAPI
        </h2>
      </div>

      {/* A1: Overview */}
      <article
        id="overview"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-600" />
          <span>1. Introduction &amp; System Overview</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI is a modern, unified AI API gateway providing high-speed, enterprise-grade access to frontier intelligence models—including Anthropic Claude, OpenAI, and Google Gemini—through a single, highly available endpoint.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
            <div className="text-xs font-bold text-[#1c1917]">Unified Endpoints</div>
            <p className="text-[11.5px] text-[#78716c]">
              One key connects Claude Code, Cursor, Codex, Windsurf, and custom scripts.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
            <div className="text-xs font-bold text-[#1c1917]">Sub-15ms Routing</div>
            <p className="text-[11.5px] text-[#78716c]">
              Edge-optimized reverse proxy with automatic health failovers.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
            <div className="text-xs font-bold text-[#1c1917]">Fair Accounting</div>
            <p className="text-[11.5px] text-[#78716c]">
              Zero tokens or credits billed for failed or interrupted requests.
            </p>
          </div>
        </div>
      </article>

      {/* A2: What is an API key */}
      <article
        id="what-is-api-key"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-violet-600" />
          <span>2. What is an API Key?</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          An API key is a unique, secret authentication token that your coding assistant (like Cursor, Claude Code, or VS Code) uses to verify your account with LightningAPI on every prompt.
        </p>
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2 text-xs">
          <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Key Anatomy at LightningAPI</span>
          </div>
          <p className="text-[#64607d] leading-relaxed">
            Every active LightningAPI key begins with the prefix{' '}
            <code className="font-mono font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
              ld_live_
            </code>{' '}
            (or{' '}
            <code className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              ld_trial_
            </code>{' '}
            for free trials). Treat your key like a credit card: never share it in public repositories or client-side browser code.
          </p>
        </div>
      </article>

      {/* A3: How it works */}
      <article
        id="how-it-works"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-600" />
          <span>3. How LightningAPI Works</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          When your tool sends a prompt, it connects to LightningAPI&apos;s gateway. The gateway verifies your key&apos;s quota, translates the protocol if necessary, routes to the healthiest cluster, streams tokens back in real-time, and settles usage in an immutable ledger.
        </p>
        <div className="p-4 rounded-2xl bg-[#0c0d14] text-[#f4f4f5] font-mono text-xs border border-neutral-800 space-y-2">
          <div className="text-neutral-400 text-[11px] uppercase tracking-wider font-bold">
            Request Pipeline
          </div>
          <div className="text-violet-400">Your Client (Cursor / Claude Code)</div>
          <div className="text-neutral-500 pl-4">↳ HTTPS POST with ld_live_...</div>
          <div className="text-emerald-400 pl-8">↳ LightningAPI Gateway (Authentication &amp; Rate Limiting)</div>
          <div className="text-neutral-500 pl-12">↳ Intelligent Model Cluster Routing</div>
          <div className="text-amber-300 pl-16">↳ Server-Sent Events (SSE) Stream Completion</div>
        </div>
      </article>

      {/* A4: Getting your key */}
      <article
        id="getting-your-key"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <span>4. How to Get Your API Key</span>
        </h3>
        <ol className="space-y-3 text-sm text-[#44403c] list-decimal list-inside leading-relaxed">
          <li>
            <strong>Create an Account:</strong> Register at{' '}
            <Link to="/register" className="text-violet-700 underline font-semibold">
              lightningapi.pro/register
            </Link>.
          </li>
          <li>
            <strong>Choose a Plan:</strong> Select a 5-Hour Rolling Window plan, Credit Wallet top-up, or Token Pack.
          </li>
          <li>
            <strong>Copy Your Key:</strong> Go to{' '}
            <Link to="/dashboard/keys" className="text-violet-700 underline font-semibold">
              Dashboard → API Keys
            </Link>{' '}
            and copy your active key.
          </li>
        </ol>
      </article>

      {/* A5: Plan types */}
      <article
        id="plan-types-overview"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-600" />
          <span>5. Understanding Your Plan Architecture</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI supports three distinct billing structures so you only pay for what you actually use:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-1.5">
            <div className="font-bold text-purple-900 text-sm">5-Hour Rolling Window</div>
            <p className="text-purple-800 leading-relaxed">
              Designed for heavy coding. Your token allowance automatically regenerates continuously over every 5-hour rolling cycle.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1.5">
            <div className="font-bold text-emerald-900 text-sm">Prepaid Credit Wallet</div>
            <p className="text-emerald-800 leading-relaxed">
              Deposit credits (e.g. $15, $35, $75). Credits never expire for 365 days and work across all supported models.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
            <div className="font-bold text-amber-900 text-sm">Consumable Token Packs</div>
            <p className="text-amber-800 leading-relaxed">
              Buy high-volume token blocks (10M, 50M, 100M). Ideal for continuous agent runs and automated scripts.
            </p>
          </div>
        </div>
      </article>

      {/* A6: First request */}
      <article
        id="first-request"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-violet-600" />
          <span>6. Your First Successful Request</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Copy and paste this command into your terminal to test your key immediately:
        </p>
        <MultiOsCodeBlock
          title="First API Request (Native cURL)"
          tabs={[
            {
              label: 'macOS / Linux (cURL)',
              language: 'bash',
              code: `curl -X POST "https://lightningapi.pro/v1/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Explain binary search in two sentences."}
    ]
  }'`,
            },
            {
              label: 'Windows (PowerShell)',
              language: 'powershell',
              code: `$headers = @{
  "Content-Type" = "application/json"
  "x-api-key" = "ld_live_your_api_key_here"
  "anthropic-version" = "2023-06-01"
}
$body = @{
  model = "claude-sonnet-5.5"
  max_tokens = 1024
  messages = @(
    @{ role = "user"; content = "Explain binary search in two sentences." }
  )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://lightningapi.pro/v1/messages" -Method Post -Headers $headers -Body $body`,
            },
          ]}
        />
      </article>

      {/* A7: Check key status */}
      <article
        id="check-key-status"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-violet-600" />
          <span>7. Checking Your Key Status &amp; Live Consumption</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          You can inspect your remaining tokens, active rolling quota, and recent request activity at any time using our dedicated verification tool:
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            to="/check-key"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>Open Verify Key Tool</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-xs text-[#78716c] font-mono">lightningapi.pro/check-key</span>
        </div>
      </article>
    </section>
  );
};
