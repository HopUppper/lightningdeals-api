import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowUpRight, Search, Sparkles, Check, Clock, Coins, ShieldCheck, Zap, Terminal, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlans, PlanItem } from '../context/PlansContext';

interface FaqItem {
  id: string;
  category: 'general' | 'technical' | 'billing' | 'latency' | 'privacy';
  question: string;
  answer: string | React.ReactNode;
}

const getFaqs = (plans: PlanItem[]): FaqItem[] => [
  // =========================================================================
  // GENERAL & ARCHITECTURE
  // =========================================================================
  {
    id: 'what-is',
    category: 'general',
    question: 'What is LightningAPI.pro?',
    answer: (
      <div className="space-y-2.5">
        <p>
          LightningAPI.pro is a high-performance, developer-first AI API gateway designed to provide reliable, low-latency access to frontier AI models—including Claude Opus 5.5, Claude Sonnet 5.5, Claude Opus 5, OpenAI o1, GPT-4o, and DeepSeek.
        </p>
        <p>
          Instead of rigid per-seat SaaS subscriptions with sudden midday usage blockades, LightningAPI.pro gives developers <strong>three flexible billing options</strong>: continuous 5-hour rolling pool refills (Claude exclusive), pay-as-you-go credits with up to 7x–8.75x bonus purchasing power, and fixed non-expiring token packs.
        </p>
        <p className="text-xs text-[#78716c]">
          Drop-in compatible with Claude Code CLI, Cursor, Windsurf, VS Code (Continue/Roo Code/Cline), and the official Anthropic &amp; OpenAI SDKs.
        </p>
      </div>
    ),
  },
  {
    id: 'gateway-work',
    category: 'general',
    question: 'How does the gateway routing engine work?',
    answer: (
      <div className="space-y-2.5">
        <p>
          LightningAPI.pro operates as an intelligent, high-speed reverse proxy between your IDE/terminal and upstream model inference:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[#57534e]">
          <li><strong>Authentication:</strong> Your key (<code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">ld_live_...</code>) is validated against SHA-256 cryptographic hashes in sub-millisecond memory.</li>
          <li><strong>Quota Verification:</strong> Quotas are calculated in real time: sliding-window consumption for 5-hour rolling plans or atomic balance deduction for credit plans.</li>
          <li><strong>Zero-Log In-Flight Transit:</strong> Requests stream over encrypted TLS 1.3 through transient RAM directly to upstream frontier inference clusters.</li>
          <li><strong>Real-Time SSE Streaming:</strong> Server-sent event (SSE) chunks and prompt-caching headers pass directly through to your editor with sub-600ms base latency.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'model-identity-guarantee',
    category: 'general',
    question: 'Does the model know its authentic identity? (e.g., "What model are you?")',
    answer: (
      <div className="space-y-2.5">
        <p>
          <strong>Yes, absolutely.</strong> When you ask the model <em>"What model are you?"</em> or <em>"What is your architecture?"</em>, it responds with its genuine frontier model identity (e.g. <strong>Claude Opus 5.5</strong>, <strong>Claude Sonnet 5.5</strong>, etc.).
        </p>
        <p>
          Our gateway maintains strict model authenticity. We guarantee that zero internal proxy names, supplier infrastructure URLs, or third-party wrappers are ever leaked in prompt responses or completion bodies.
        </p>
      </div>
    ),
  },
  {
    id: 'upstream-outages',
    category: 'general',
    question: 'What happens if an upstream model cluster experiences downtime?',
    answer: (
      <div className="space-y-2.5">
        <p>
          If an upstream model infrastructure cluster encounters unexpected maintenance or transient rate-limiting:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong>Zero Token Penalty:</strong> Unsuccessful or interrupted requests are never deducted from your token quota or credit balance.</li>
          <li><strong>Multi-Supplier Failover:</strong> Our gateway maintains resilient redundant inference backbones and automatically retries healthy upstreams.</li>
          <li><strong>Transparent Status:</strong> Live system health and latency benchmarks are published 24/7 on our public <Link to="/status" className="text-[#6d28d9] underline font-medium">Status Page</Link>.</li>
        </ul>
      </div>
    ),
  },

  // =========================================================================
  // BILLING & QUOTAS (THE 3 ARCHITECTURES)
  // =========================================================================
  {
    id: 'three-billing-architectures',
    category: 'billing',
    question: 'What are the three billing architectures, and which should I choose?',
    answer: (
      <div className="space-y-3">
        <p>
          We offer three distinct architectures tailored to different development workloads:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-[#f5f2eb] border border-[#e7e5e4] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1c1917]">
              <Clock className="w-3.5 h-3.5 text-[#6d28d9]" />
              <span>5-Hour Rolling Pool</span>
            </div>
            <p className="text-[#57534e] leading-snug">
              Claude Exclusive. Continuous 5M to 100M token refills every 5 hours for 30 or 365 days. Best for full-time developers and power users.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#f5f2eb] border border-[#e7e5e4] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1c1917]">
              <Coins className="w-3.5 h-3.5 text-amber-700" />
              <span>Pay-As-You-Go Credits</span>
            </div>
            <p className="text-[#57534e] leading-snug">
              Universal. Deposit INR and receive up to 7x–8.75x in USD usage credits (e.g. ₹100 = $7.00 USD). Valid 365 days across all models.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#f5f2eb] border border-[#e7e5e4] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1c1917]">
              <Zap className="w-3.5 h-3.5 text-emerald-700" />
              <span>Prepaid Token Packs</span>
            </div>
            <p className="text-[#57534e] leading-snug">
              Fixed allocations (10M to 1B consumable tokens). No 5-hour resets; use at your own pace over 365 days.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'rolling-window-math',
    category: 'billing',
    question: 'How does the 5-hour rolling pool refill work mathematically?',
    answer: (
      <div className="space-y-2.5">
        <p>
          Unlike calendar-month quotas that leave you blocked for weeks after an intensive coding sprint, our rolling engine computes your usage dynamically over a sliding 5-hour window:
        </p>
        <div className="p-3 rounded-xl bg-[#1c1917] text-white font-mono text-xs space-y-1">
          <p className="text-emerald-400">Consumed Quota = Sum(Tokens where Timestamp &gt; Now - 5 Hours)</p>
          <p className="text-[#a8a29e]">Available Quota = Plan Capacity - Consumed Quota</p>
        </div>
        <p>
          <strong>Example:</strong> On the MAX 20X plan (20,000,000 token capacity), if you consume 8,000,000 tokens during heavy refactoring between 10:00 AM and 11:00 AM, that entire 8,000,000 token block rolls back into your available reservoir starting at 3:00 PM. Your capacity continuously replenishes every single day.
        </p>
      </div>
    ),
  },
  {
    id: 'pay-as-you-go-credits',
    category: 'billing',
    question: 'How do the Pay-As-You-Go Credits work (e.g. the ₹100 plan)?',
    answer: (
      <div className="space-y-2.5">
        <p>
          Our credit plans provide extraordinary purchasing power through bulk wholesale compute discounts:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong>₹100 Plan:</strong> Yields <strong>$7.00 USD</strong> in API usage credits (~7x value multiplier).</li>
          <li><strong>₹500 Plan:</strong> Yields <strong>$40.00 USD</strong> in API usage credits (~8x value multiplier).</li>
          <li><strong>₹1,000 Plan:</strong> Yields <strong>$85.00 USD</strong> in API usage credits (~8.5x value multiplier).</li>
        </ul>
        <p>
          Credits are universally usable across Claude, OpenAI, and DeepSeek models. Token consumption is debited atomically per request based on official retail model pricing. Balance never expires for 365 days.
        </p>
      </div>
    ),
  },
  {
    id: 'check-key-balance',
    category: 'billing',
    question: 'How can I check my remaining balance and token reservoir?',
    answer: (
      <div className="space-y-2.5">
        <p>
          You can inspect your key’s live status at any time using our dedicated <Link to="/check-key" className="text-[#6d28d9] underline font-medium">Verify Key Balance Tool</Link> or via the API:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong>Web Tool:</strong> Visit <Link to="/check-key" className="text-[#6d28d9] underline font-medium">lightningapi.pro/check-key</Link> and paste your key to view real-time available tokens, rolling reset countdown, and USD credit balance.</li>
          <li><strong>API Telemetry:</strong> Send a GET request to <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro/api/key-status?key=your_key</code> for programmatic JSON telemetry.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'pricing-table-inr',
    category: 'billing',
    question: 'Are there any hidden fees, overage bills, or recurring auto-debits?',
    answer: (
      <div className="space-y-2">
        <p>
          <strong>Zero hidden fees. Zero surprise invoices. Zero recurring auto-debits.</strong>
        </p>
        <p>
          All purchases on LightningAPI.pro are strictly prepaid in Indian Rupees (INR) via UPI (Google Pay, PhonePe, Paytm), Net Banking, or Credit/Debit Cards. When your quota or credits are exhausted, inference simply pauses until tokens roll over or you choose to top up.
        </p>
      </div>
    ),
  },

  // =========================================================================
  // LATENCY & PERFORMANCE OPTIMIZATION
  // =========================================================================
  {
    id: 'latency-breakdown',
    category: 'latency',
    question: 'What is the base latency of the gateway?',
    answer: (
      <div className="space-y-2.5">
        <p>
          Our Claude inference infrastructure runs on enterprise-grade dedicated routing clusters with a <strong>base round-trip latency of 420ms to 620ms</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong>Claude Haiku 5.5 / 4.5:</strong> ~420ms TTFB (Time to First Byte).</li>
          <li><strong>Claude Opus 5 &amp; 5.5:</strong> ~545ms TTFB.</li>
          <li><strong>Claude Sonnet 5 &amp; 5.5:</strong> ~620ms TTFB.</li>
        </ul>
        <p className="text-xs text-[#78716c]">
          Combined with native HTTP/2 keep-alives and zero disk I/O, prompt requests begin streaming tokens to your IDE almost instantaneously.
        </p>
      </div>
    ),
  },
  {
    id: 'claude-thinking-latency',
    category: 'latency',
    question: 'Why did my request take 10–12 seconds in Claude Code CLI with "xhigh" thinking?',
    answer: (
      <div className="space-y-2.5">
        <p>
          If your Claude Code CLI or IDE displays latency around 10–12s on a prompt, this is almost always due to <strong>Extended Thinking mode</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 text-[#57534e]">
          <li><strong>Extended Thinking (<code className="font-mono text-xs text-[#1c1917]">xhigh</code> / <code className="font-mono text-xs text-[#1c1917]">high</code>):</strong> In Claude Code CLI, setting thinking mode to <code className="font-mono text-xs text-[#1c1917]">xhigh</code> allocates up to 32,000 internal reasoning tokens. The model generates thousands of hidden chain-of-thought tokens before producing visible text, which naturally takes 8–10 seconds on frontier models like Claude Opus.</li>
          <li><strong>Large Codebase Prompts:</strong> Ingesting 15,000 to 35,000 input tokens (~100 KB of code files) requires significant multi-head attention computation upstream.</li>
        </ul>
        <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-[#1c1917] space-y-1">
          <p className="font-bold text-[#6d28d9]">⚡ How to get rapid sub-2s responses in Claude Code CLI:</p>
          <p>Toggle thinking mode from <code className="font-mono text-xs">xhigh</code> to normal or off via <code className="font-mono text-xs">/config</code> or <code className="font-mono text-xs">/thinking</code>, or switch model to <strong>Claude Sonnet 5.5</strong> for fast iterative terminal builds.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'prompt-caching-support',
    category: 'latency',
    question: 'Does LightningAPI support Anthropic Prompt Caching?',
    answer: (
      <div className="space-y-2.5">
        <p>
          <strong>Yes!</strong> LightningAPI.pro natively honors Anthropic’s prompt caching protocol (<code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">anthropic-beta: prompt-caching-2024-07-31</code>).
        </p>
        <p>
          When you work in Claude Code CLI, Cursor, or Windsurf across multi-file codebases, your project’s system prompts and file context are cached in upstream cluster memory. Subsequent turns in the conversation read from cache (<code className="font-mono text-xs text-[#1c1917]">cache_read_input_tokens</code>), slashing response latency from 10+ seconds down to under 2 seconds while significantly reducing token consumption.
        </p>
      </div>
    ),
  },

  // =========================================================================
  // TECHNICAL & INTEGRATIONS
  // =========================================================================
  {
    id: 'supported-endpoints',
    category: 'technical',
    question: 'Which API formats and endpoints are supported?',
    answer: (
      <div className="space-y-2.5">
        <p>
          LightningAPI.pro provides full dual-protocol compatibility:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 text-[#57534e]">
          <li><code className="font-mono text-xs text-[#1c1917]">POST /v1/messages</code> — Official <strong>Anthropic Messages API</strong> format. Full support for system prompts, multi-turn messages, tool calling, extended thinking buffers, and Server-Sent Events (SSE) streaming.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">POST /v1/chat/completions</code> — Official <strong>OpenAI Chat Completions API</strong> format with native bidirectional protocol translation.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">GET /v1/models</code> — Live machine-readable catalog of all available models.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">POST /v1/messages/count_tokens</code> — Precise client-side token estimation.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">GET /api/key-status</code> — High-speed real-time telemetry and quota inspection.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'claude-code-setup',
    category: 'technical',
    question: 'How do I set up Claude Code CLI?',
    answer: (
      <div className="space-y-2.5">
        <p>
          Setting up the official Claude Code CLI takes less than 30 seconds:
        </p>
        <div className="p-3.5 rounded-xl bg-[#1c1917] text-white font-mono text-xs space-y-1.5">
          <p className="text-[#a8a29e]"># 1. Export the LightningAPI base URL and your key</p>
          <p className="text-amber-300 font-bold">export ANTHROPIC_BASE_URL="https://lightningapi.pro"</p>
          <p className="text-amber-300 font-bold">export ANTHROPIC_API_KEY="ld_live_your_key_here"</p>
          <p className="text-[#a8a29e] pt-1"># 2. Launch Claude Code CLI</p>
          <p className="text-emerald-400 font-bold">claude</p>
        </div>
        <p className="text-xs text-[#78716c]">
          On Windows PowerShell, use: <code className="font-mono text-xs">$env:ANTHROPIC_BASE_URL="https://lightningapi.pro"</code> and <code className="font-mono text-xs">$env:ANTHROPIC_API_KEY="ld_live_your_key_here"</code>.
        </p>
      </div>
    ),
  },
  {
    id: 'cursor-windsurf-setup',
    category: 'technical',
    question: 'How do I configure Cursor, Windsurf, or VS Code?',
    answer: (
      <div className="space-y-2.5">
        <p>
          LightningAPI works seamlessly in modern AI code editors:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-1 text-[#57534e]">
          <li>
            <strong className="text-[#1c1917]">Cursor IDE (Anthropic Protocol):</strong> Navigate to <em>Cursor Settings &gt; Models &gt; Anthropic API Key</em>. Enable Custom Base URL, set it to <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro</code>, and paste your <code className="font-mono text-xs text-[#1c1917]">ld_live_...</code> key.
          </li>
          <li>
            <strong className="text-[#1c1917]">Cursor IDE (OpenAI Protocol):</strong> Navigate to <em>Cursor Settings &gt; Models &gt; OpenAI API Key</em>. Set Override Base URL to <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro/v1</code> and input your key.
          </li>
          <li>
            <strong className="text-[#1c1917]">Windsurf:</strong> Open <em>Windsurf Settings &gt; Cascade &gt; Custom API Provider</em>. Set the endpoint to <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro/v1</code> with your Bearer key.
          </li>
          <li>
            <strong className="text-[#1c1917]">VS Code (Continue / Roo Code / Cline):</strong> In your extension configuration, choose Anthropic as the provider, specify <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro</code> as base URL, and save your key.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'sdk-python-node',
    category: 'technical',
    question: 'How do I use LightningAPI in Python or Node.js?',
    answer: (
      <div className="space-y-2.5">
        <p>
          Use official standard client SDKs without installing any proprietary packages:
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#1c1917] text-white">
            <span className="text-[#a8a29e] block pb-1"># Python (Anthropic SDK)</span>
            <pre className="text-neutral-200 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">
{`import anthropic

client = anthropic.Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_key_here"
)

message = client.messages.create(
    model="claude-opus-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)`}
            </pre>
          </div>
          <div className="p-3 rounded-xl bg-[#1c1917] text-white">
            <span className="text-[#a8a29e] block pb-1"># Python (OpenAI SDK)</span>
            <pre className="text-neutral-200 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">
{`from openai import OpenAI

client = OpenAI(
    base_url="https://lightningapi.pro/v1",
    api_key="ld_live_your_key_here"
)

response = client.chat.completions.create(
    model="claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
            </pre>
          </div>
        </div>
      </div>
    ),
  },

  // =========================================================================
  // PRIVACY, SECURITY & DATA RETENTION
  // =========================================================================
  {
    id: 'privacy-storage',
    category: 'privacy',
    question: 'Do you inspect, log, store, or train on my prompt contents or code?',
    answer: (
      <div className="space-y-2.5">
        <p>
          <strong>No. We operate under a strict Institutional Zero Prompt Retention SLA:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 text-[#57534e]">
          <li><strong>Zero Disk Storage:</strong> Prompt payloads, code files, and model responses stream exclusively through transient RAM over TLS 1.3 and are garbage-collected immediately upon stream completion.</li>
          <li><strong>No Training:</strong> Customer data is never used to train, fine-tune, or evaluate machine learning models.</li>
          <li><strong>What We Record:</strong> We store only cryptographic key hashes, account emails, payment records, and numeric token counters strictly necessary for rolling window and credit balance accounting.</li>
        </ul>
        <p className="text-xs pt-1">
          Review our complete 12-section privacy breakdown in our <Link to="/privacy" className="text-[#6d28d9] underline font-medium">Privacy Policy</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'key-security',
    category: 'privacy',
    question: 'How are customer API keys secured?',
    answer: (
      <div className="space-y-2.5">
        <p>
          All API keys (<code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">ld_live_...</code>) are generated using high-entropy CSPRNG randomness and hashed using <strong>SHA-256 with salting</strong> prior to storage.
        </p>
        <p>
          Your plaintext key is displayed exactly once upon checkout or issuance. You can revoke, regenerate, or monitor usage telemetry for your keys at any time directly through your customer dashboard.
        </p>
      </div>
    ),
  },
  {
    id: 'refund-policy',
    category: 'billing',
    question: 'What is your refund policy?',
    answer: (
      <div className="space-y-2.5">
        <p>
          All packages on LightningAPI.pro represent dedicated prepaid digital compute allocations. Because compute capacity is reserved immediately upon checkout, plans with active token consumption are non-refundable.
        </p>
        <p>
          However, if you experience a verified gateway infrastructure incident or duplicate billing transaction, and submit a notice within 48 hours of purchase, our support team will promptly issue a full refund to your original payment method within 3–7 business days. Review our full terms on the <Link to="/refund" className="text-[#6d28d9] underline font-medium">Refund Policy</Link> page.
        </p>
      </div>
    ),
  },
];

export const ElectricFaqSection: React.FC = () => {
  const { plans } = usePlans();
  const faqs = useMemo(() => getFaqs(plans), [plans]);

  const [openId, setOpenId] = useState<string | null>('what-is');
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'technical' | 'billing' | 'latency' | 'privacy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="relative py-16 sm:py-24 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
            <HelpCircle className="w-3.5 h-3.5 text-[#6d28d9]" />
            <span className="text-[#6d28d9] font-bold">KNOWLEDGE ARCHIVE</span>
            <span className="text-[#d6d3d1]">·</span>
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1c1917]">
            Everything you need to know.{' '}
            <span className="font-serif italic font-normal text-[#6d28d9]">Unfiltered.</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#57534e] max-w-xl mx-auto leading-relaxed">
            Clear, transparent answers about our 3 billing plans, sub-600ms latency, Claude Code CLI setup, and zero-log retention policy.
          </p>
        </div>

        {/* Search & Category Filter Suite */}
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. rolling window, latency, credits, claude code)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#e7e5e4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/20 focus:border-[#6d28d9] shadow-xs placeholder-[#a8a29e] text-[#1c1917]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'general', label: 'Architecture & Overview' },
              { id: 'billing', label: 'Plans & 3 Billing Modes' },
              { id: 'latency', label: 'Latency & Performance' },
              { id: 'technical', label: 'SDKs & IDE Setups' },
              { id: 'privacy', label: 'Privacy & Security' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'bg-white text-[#57534e] border border-[#e7e5e4] hover:bg-[#f5f2eb]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#e7e5e4] shadow-warm divide-y divide-[#f5f2eb] overflow-hidden">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-[#78716c]">
              No questions found matching your search. Have a specific inquiry? Contact us directly at{' '}
              <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline font-medium">
                support@lightningapi.pro
              </a>
              .
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="transition-colors hover:bg-[#faf8f5]/40">
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#a8a29e] pt-0.5">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#1c1917]">
                        {faq.question}
                      </span>
                    </div>
                    <div
                      className={`p-1 rounded-lg text-[#78716c] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 bg-[#f5f2eb] text-[#1c1917]' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-5 pt-1 pl-11 text-xs sm:text-sm text-[#57534e] leading-relaxed border-t border-[#f5f2eb]/60">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support Prompt */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#1c1917] flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
              Need help configuring your API key or IDE?
            </h4>
            <p className="text-[11px] sm:text-xs text-[#57534e]">
              Read the complete setup guides in our documentation or verify your key in our balance checker.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/docs"
              className="px-3.5 py-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-plum"
            >
              <span>Explore Docs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/check-key"
              className="px-3.5 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] text-xs font-medium transition-colors"
            >
              Verify Key
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ElectricFaqSection;
