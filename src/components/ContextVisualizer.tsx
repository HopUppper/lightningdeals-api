import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const ContextVisualizer: React.FC = () => {
  const whatsappUrl = `https://wa.me/917695956938?text=${encodeURIComponent('Hi LightningDeals Team! I would like to get a free trial API key for testing.')}`;

  const controlPillars = [
    {
      num: '01',
      title: 'Per-Key 5-Hour Rolling Budgets',
      desc: 'Every key carries its allowance on a rolling five-hour window. Watch it drain in real time; it resets automatically on cycle.',
    },
    {
      num: '02',
      title: 'Isolated Rate Limits (RPM)',
      desc: 'Requests per minute and expiration dates are set per key. No single high-volume key can starve another developer.',
    },
    {
      num: '03',
      title: 'Pass-Through SSE Streaming',
      desc: 'Server-sent events are streamed token-by-token with sub-50ms latency directly to your IDE or application.',
    },
    {
      num: '04',
      title: 'Zero-Cost Prompt Caching',
      desc: 'Cache hits and prompt cache reads do not count against your 5-hour rolling window. Only fresh completions deduct.',
    },
    {
      num: '05',
      title: 'Drop-In Protocol Compatibility',
      desc: 'Full Anthropic Messages (/v1/messages) and OpenAI ChatCompletions (/v1/chat/completions) drop-in endpoints.',
    },
    {
      num: '06',
      title: 'Multi-Surface Stack Support',
      desc: 'Use one key across Claude Code CLI, Cursor, Windsurf, Continue, VS Code, Python SDK, TypeScript SDK, and cURL.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 border-b border-border bg-card/40 relative overflow-hidden">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-16 relative z-10">
        
        {/* Top Feature Banner & Aperture Visualizer */}
        <div className="grid gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Engineered for Production Scale</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg leading-tight">
              Built for whoever holds the API keys.
            </h2>

            <p className="text-sm sm:text-base text-muted leading-relaxed">
              LightningDeals delivers high-throughput infrastructure with real enforcement rules: 5-hour rolling token windows, RPM rate limits, isolated key scopes, and transparent usage ledgers.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="ui-button-primary text-xs py-3 px-6 font-bold">
                Get Trial Key on WhatsApp
              </a>
              <Link to="/docs" className="ui-button-secondary text-xs py-3 px-6 font-semibold">
                Read Infrastructure Docs
              </Link>
            </div>
          </motion.div>

          {/* Aperture 1M Context Window Visualizer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 bg-card border border-border rounded-panel text-center relative overflow-hidden shadow-2xl flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* Outer Animated Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-amber-500/20" />
              <div className="absolute inset-8 rounded-full border border-amber-500/10" />

              <div className="relative z-10 space-y-1">
                <span className="font-mono text-4xl sm:text-5xl font-extrabold text-amber-500 tracking-tight">1,000,000</span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted font-bold">Token Context Window</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border w-full flex items-center justify-between text-xs font-mono text-muted">
              <span>Primary Model: <strong className="text-fg">Claude 3.5 Sonnet</strong></span>
              <span className="text-emerald-500 font-bold">✓ Sub-50ms Latency</span>
            </div>
          </motion.div>
        </div>

        {/* 6 Control Pillars Grid */}
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-xl font-bold text-fg">Infrastructure Control & Isolation</h3>
            <p className="text-xs text-muted mt-1">Multi-tenant key management built to support teams and developers with 5-hour rolling windows.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {controlPillars.map((p, idx) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-6 bg-card border border-border rounded-panel space-y-3 hover:border-amber-500/40 transition-colors shadow-sm"
              >
                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  {p.num}
                </span>
                <h4 className="text-base font-bold text-fg pt-1">{p.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
