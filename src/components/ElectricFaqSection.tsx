import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  id: string;
  category: 'general' | 'technical' | 'billing' | 'privacy';
  question: string;
  answer: string | React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    id: 'what-is',
    category: 'general',
    question: 'What is LightningAPI.pro?',
    answer: (
      <div className="space-y-2">
        <p>
          LightningAPI.pro is a high-performance, developer-first AI API gateway designed to provide reliable, low-latency access to premier frontier models—including Claude 3.5 Sonnet, Claude Opus 5, Claude Haiku 4.5, and Claude 3.7 Sonnet.
        </p>
        <p>
          Instead of unpredictable monthly subscription tiers with arbitrary mid-day usage caps, LightningAPI.pro pairs the official Anthropic Messages API specification with a continuous 5-hour rolling token replenishment engine, giving developers sustained coding velocity across Claude Code CLI, Cursor, Windsurf, and custom software.
        </p>
      </div>
    ),
  },
  {
    id: 'gateway-work',
    category: 'technical',
    question: 'How does the gateway work?',
    answer: (
      <div className="space-y-2">
        <p>
          LightningAPI.pro acts as an intelligent, high-speed reverse proxy between your developer environment and upstream model providers. When your application makes an HTTPS request to <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro/v1/messages</code>:
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1 text-[#57534e]">
          <li>The gateway validates your Bearer key or <code className="font-mono text-xs text-[#1c1917]">x-api-key</code> in sub-millisecond memory cache.</li>
          <li>It calculates your token consumption over the immediate 5-hour window (<code className="font-mono text-xs text-[#1c1917]">[t - 5h, t]</code>) to verify quota headroom.</li>
          <li>It proxies the request over TLS 1.3 via transient volatile RAM, streaming server-sent events (SSE) token-by-token directly to your editor without persisting prompt or code bodies to disk.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'supported-models',
    category: 'technical',
    question: 'Which models are supported?',
    answer: (
      <div className="space-y-2">
        <p>
          The gateway natively supports the full suite of state-of-the-art Anthropic Claude models:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong className="text-[#1c1917]">Claude 3.5 Sonnet</strong> (<code className="font-mono text-xs text-[#1c1917]">claude-3-5-sonnet-20241022</code>) · 1M token context · Ideal for agentic refactoring.</li>
          <li><strong className="text-[#1c1917]">Claude 3.7 Sonnet</strong> (<code className="font-mono text-xs text-[#1c1917]">claude-3-7-sonnet-20250219</code>) · Extended hybrid reasoning with controllable thinking budgets.</li>
          <li><strong className="text-[#1c1917]">Claude Opus 5</strong> (<code className="font-mono text-xs text-[#1c1917]">claude-opus-5</code> / <code className="font-mono text-xs text-[#1c1917]">claude-3-opus-20240229</code>) · Exhaustive architecture and formal logic.</li>
          <li><strong className="text-[#1c1917]">Claude Haiku 4.5</strong> (<code className="font-mono text-xs text-[#1c1917]">claude-3-5-haiku-20241022</code>) · High throughput, sub-20ms TTFT for CI/CD runners.</li>
        </ul>
        <p className="pt-1 text-xs">
          Convenient aliases such as <code className="font-mono text-xs text-[#1c1917]">opus</code>, <code className="font-mono text-xs text-[#1c1917]">sonnet</code>, <code className="font-mono text-xs text-[#1c1917]">haiku</code>, and Claude Code <code className="font-mono text-xs text-[#1c1917]">[1m]</code> suffix tags are automatically normalized by the router. Review the live catalog on our <Link to="/models" className="text-[#6d28d9] underline font-medium">Models Page</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'get-api-key',
    category: 'general',
    question: 'How do I get an API key?',
    answer: (
      <div className="space-y-2">
        <p>
          You can obtain an active API key in two ways:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong className="text-[#1c1917]">Free 1M Trial:</strong> Visit our <Link to="/trial" className="text-[#6d28d9] underline font-medium">Trial Page</Link> to receive an instant 1,000,000 token key (<code className="font-mono text-xs text-[#1c1917]">ld_trial_...</code>) in under 15 seconds without a credit card.</li>
          <li><strong className="text-[#1c1917]">Capacity Plans:</strong> Choose a capacity plan on our <a href="#pricing" className="text-[#6d28d9] underline font-medium">Pricing Section</a> (5x, 20x, 40x, or 100x). Keys (<code className="font-mono text-xs text-[#1c1917]">ld_live_...</code>) are provisioned immediately upon successful UPI or card checkout.</li>
        </ul>
        <p className="pt-1 text-xs">
          You can inspect your key’s status, active token reservoir, and rolling expiration countdown at any time using our <Link to="/check-key" className="text-[#6d28d9] underline font-medium">Check Key Tool</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'supported-endpoints',
    category: 'technical',
    question: 'Which API formats and endpoints are supported?',
    answer: (
      <div className="space-y-2">
        <p>
          LightningAPI.pro is strictly an <strong className="text-[#1c1917]">Anthropic Messages API</strong> compatible gateway. We implement:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><code className="font-mono text-xs text-[#1c1917]">POST /v1/messages</code> — Standard conversational inference, multi-turn dialogue, tool use, and streaming.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">GET /v1/models</code> — Live machine-readable model catalog.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">POST /v1/messages/count_tokens</code> — Accurate client-side token counting.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">POST /tools/web_search</code> &amp; <code className="font-mono text-xs text-[#1c1917]">POST /tools/understand_image</code> — Native gateway tool handlers.</li>
          <li><code className="font-mono text-xs text-[#1c1917]">GET /api/key-status</code> &amp; <code className="font-mono text-xs text-[#1c1917]">GET /api/system/status</code> — Real-time telemetry and quota inspection.</li>
        </ul>
        <p className="pt-1 text-xs text-[#78716c]">
          *Note: The gateway does not mount legacy OpenAI completions (<code className="font-mono text-xs">/v1/chat/completions</code>). In client tools like Cursor, select Anthropic protocol.
        </p>
      </div>
    ),
  },
  {
    id: 'sdk-config',
    category: 'technical',
    question: 'How do I configure an SDK or compatible client?',
    answer: (
      <div className="space-y-2">
        <p>
          Configuration takes under 60 seconds across all major developer environments:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong className="text-[#1c1917]">Claude Code CLI:</strong> Run <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">export ANTHROPIC_BASE_URL="https://lightningapi.pro"</code> and set <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">ANTHROPIC_API_KEY="ld_live_your_key"</code>.</li>
          <li><strong className="text-[#1c1917]">Cursor / Windsurf:</strong> Under AI Model settings, choose Anthropic, enter Override Base URL as <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">https://lightningapi.pro</code>, and supply your key.</li>
          <li><strong className="text-[#1c1917]">Python SDK:</strong> Initialize <code className="font-mono text-xs text-[#1c1917]">Anthropic(base_url="https://lightningapi.pro", api_key="ld_live_...")</code>. Note: SDKs automatically append <code className="font-mono text-xs text-[#1c1917]">/v1/messages</code>.</li>
          <li><strong className="text-[#1c1917]">Automated Setup:</strong> Run <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">curl -fsSL https://lightningapi.pro/setup.sh | bash</code> on macOS/Linux or <code className="px-1.5 py-0.5 rounded bg-[#f5f2eb] font-mono text-xs text-[#1c1917]">irm https://lightningapi.pro/setup.ps1 | iex</code> on Windows PowerShell.</li>
        </ul>
        <p className="pt-1 text-xs">
          Explore complete code samples in our <Link to="/docs" className="text-[#6d28d9] underline font-medium">Developer Documentation</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'usage-calculation',
    category: 'billing',
    question: 'How are usage limits calculated?',
    answer: (
      <div className="space-y-2">
        <p>
          LightningAPI.pro calculates quota using a <strong className="text-[#1c1917]">continuous 5-hour rolling mathematical window</strong> rather than a rigid calendar-month cliff:
        </p>
        <p className="text-xs font-mono bg-[#f5f2eb] p-2.5 rounded-xl border border-[#e7e5e4] text-[#1c1917]">
          Current Usage = Sum of all tokens consumed between (Now - 5 Hours) and Now
        </p>
        <p>
          Every prompt and completion token has a millisecond timestamp. Exactly 5 hours after a token is burned, it expires out of the sum and returns to your available reservoir. If you burn 2,000,000 tokens during intense debugging between 10:00 AM and 11:00 AM, that entire 2,000,000 token block rolls back into your quota starting at 3:00 PM.
        </p>
      </div>
    ),
  },
  {
    id: 'pricing-structure',
    category: 'billing',
    question: 'How does pricing work?',
    answer: (
      <div className="space-y-2">
        <p>
          Pricing is strictly prepaid with straightforward flat rates in Indian Rupees (INR):
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong className="text-[#1c1917]">Claude Max 5x:</strong> ₹299 / month · 5M tokens per 5-hour rolling window.</li>
          <li><strong className="text-[#1c1917]">Claude Max 20x:</strong> ₹899 / month · 20M tokens per 5-hour rolling window.</li>
          <li><strong className="text-[#1c1917]">Claude Max 40x:</strong> ₹1,699 / month · 40M tokens per 5-hour rolling window.</li>
          <li><strong className="text-[#1c1917]">Claude Max 100x:</strong> ₹3,999 / month · 100M tokens per 5-hour rolling window.</li>
        </ul>
        <p className="pt-1">
          There are zero surprise overage fees, zero hidden seat licensing charges, and no automated recurring card deductions without your explicit instruction.
        </p>
      </div>
    ),
  },
  {
    id: 'upstream-outages',
    category: 'general',
    question: 'What happens if a model or upstream provider becomes unavailable?',
    answer: (
      <div className="space-y-2">
        <p>
          Because LightningAPI.pro routes inference to foundational AI providers, upstream provider maintenance or infrastructure incidents can occasionally affect inference completion.
        </p>
        <p>
          When an upstream provider returns an error, the gateway surfaces a structured HTTP 502/503 response detailing the upstream code without penalizing your token balance (uncompleted requests do not count toward your rolling token limit). We monitor upstream health 24/7 on our public <Link to="/status" className="text-[#6d28d9] underline font-medium">Status Page</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'privacy-storage',
    category: 'privacy',
    question: 'What information is stored?',
    answer: (
      <div className="space-y-2">
        <p>
          We operate a strict, verified <strong className="text-[#1c1917]">Zero Prompt Logging</strong> policy:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong className="text-[#1c1917]">What we NEVER store:</strong> Prompt texts, conversation histories, source code snippets, and output completions. These stream strictly through volatile server RAM and are immediately discarded. Neither we nor our infrastructure train models on your data.</li>
          <li><strong className="text-[#1c1917]">What we DO store:</strong> Your account email, cryptographically hashed API key tokens, payment invoice references, and aggregate mathematical token counters required to enforce rolling window quotas.</li>
        </ul>
        <p className="pt-1 text-xs">
          Read our comprehensive 12-section data breakdown in our <Link to="/privacy" className="text-[#6d28d9] underline font-medium">Privacy Policy</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'support-contact',
    category: 'general',
    question: 'How do I get help?',
    answer: (
      <div className="space-y-2">
        <p>
          Our developer support team is available through multiple official channels:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#57534e]">
          <li><strong className="text-[#1c1917]">Email Support:</strong> Send technical queries or billing requests directly to <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline font-medium">support@lightningapi.pro</a>.</li>
          <li><strong className="text-[#1c1917]">Customer Dashboard:</strong> Authenticated users can file priority support tickets directly from the user dashboard.</li>
          <li><strong className="text-[#1c1917]">Interactive Widget:</strong> Click the Support bubble in the bottom-right corner of any page.</li>
        </ul>
        <p className="pt-1 text-xs text-[#78716c]">
          *Security Note: Never include your full secret API key in support messages. Provide only the key prefix (e.g., <code className="font-mono text-xs">ld_live_a1b2...</code>) and exact error timestamp.
        </p>
      </div>
    ),
  },
  {
    id: 'refund-policy',
    category: 'billing',
    question: 'How do I cancel or request a refund, where applicable?',
    answer: (
      <div className="space-y-2">
        <p>
          All packages on LightningAPI.pro are prepaid digital compute allocations. Because compute capacity is immediately reserved upon checkout, plans with active token consumption are non-refundable.
        </p>
        <p>
          However, if you experience a verified gateway infrastructure outage or duplicate billing transaction, and submit a notice within 48 hours of purchase, our support team will review and process a full refund to your original payment method within 3–7 business days. Review full terms on our <Link to="/refund" className="text-[#6d28d9] underline font-medium">Refund Policy</Link>.
        </p>
      </div>
    ),
  },
];

export const ElectricFaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('what-is');
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'technical' | 'billing' | 'privacy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFaqs = FAQS.filter((faq) => {
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
            Verified answers to common architecture, billing, quota mathematics, and integration questions.
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
              placeholder="Search questions (e.g. rolling window, refund, cursor)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#e7e5e4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/20 focus:border-[#6d28d9] shadow-xs placeholder-[#a8a29e] text-[#1c1917]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'general', label: 'Architecture & Overview' },
              { id: 'technical', label: 'SDKs & Endpoints' },
              { id: 'billing', label: 'Quotas & Pricing' },
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
              No questions found matching your search. Have a specific inquiry? Contact us at{' '}
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
              Still have questions about your architecture?
            </h4>
            <p className="text-[11px] sm:text-xs text-[#57534e]">
              Read the complete technical specification in our developer documentation.
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
            <a
              href="mailto:support@lightningapi.pro"
              className="px-3.5 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] text-xs font-medium transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
