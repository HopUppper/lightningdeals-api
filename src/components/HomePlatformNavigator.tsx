import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Terminal,
  Layers,
  ArrowRight,
  Cpu,
  Gauge,
  Lock,
  Workflow,
} from 'lucide-react';

interface PlatformSection {
  title: string;
  tag: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeColor: string;
  stats: string;
  gradient: string;
}

const sections: PlatformSection[] = [
  {
    title: 'Model Intelligence Catalog',
    tag: 'EXPLORE MODELS',
    description: 'Browse frontier Claude Opus 5.5, Sonnet 5.5, and Fable 5 with verified 200k context windows and benchmark telemetry.',
    href: '/models',
    icon: Sparkles,
    badge: '10 Models Active',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    stats: '200k Tokens • Sub-50ms Routing',
    gradient: 'from-violet-500/10 to-purple-500/5',
  },
  {
    title: 'Gateway Architecture & Setup',
    tag: 'HOW IT WORKS',
    description: 'Single endpoint drop-in for Claude Code CLI, Cursor, Windsurf, Python, and Node.js with zero code refactoring.',
    href: '/how-it-works',
    icon: Workflow,
    badge: '3-Line Setup',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stats: '100% Anthropic API Drop-In',
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
  {
    title: 'Enterprise Reliability & SLA',
    tag: 'WHY LIGHTNINGAPI',
    description: 'Why elite engineering teams choose us: supplier proxy isolation, zero prompt retention, and 99.99% guaranteed uptime.',
    href: '/why-us',
    icon: ShieldCheck,
    badge: '99.99% SLA',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    stats: 'Zero Logs • Multi-Supplier Failover',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
  {
    title: 'Live Gateway Conduit Demo',
    tag: 'INTERACTIVE PROBE',
    description: 'Test real-time SSE streaming, cryptographic token signatures, and sub-50ms conduit responses in a live sandbox.',
    href: '/demo',
    icon: Terminal,
    badge: 'Live Probe',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    stats: 'SSE Streaming • Live Latency Test',
    gradient: 'from-blue-500/10 to-indigo-500/5',
  },
  {
    title: 'Capacity Plans & Token Pools',
    tag: 'CAPACITY RESERVOIRS',
    description: 'Predictable 5-hour rolling token refills from 1M to 100M tokens without per-minute throttling or unexpected overages.',
    href: '/pricing',
    icon: Zap,
    badge: '5h Rolling Window',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    stats: '1M to 100M Tokens • Auto-Refill',
    gradient: 'from-rose-500/10 to-pink-500/5',
  },
];

export const HomePlatformNavigator: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#fbf9f5] border-t border-[#ede8e1] font-sans">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ff] text-[#6d28d9] text-[11px] font-mono font-semibold uppercase tracking-wider border border-[#ddd6fe]">
            <Gauge className="w-3.5 h-3.5" />
            <span>Platform Portals</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1c1917]">
            Dedicated Architecture for Elite Engineers
          </h2>
          <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed">
            Everything designed with modular enterprise clarity. Explore dedicated sections for models, integrations, SLA benchmarks, and capacity pools.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.07 }}
              >
                <Link
                  to={section.href}
                  className="group block h-full bg-white rounded-3xl p-7 border border-[#ede8e1] hover:border-[#6d28d9]/40 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  {/* Subtle Corner Gradient Sweep */}
                  <div
                    className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl ${section.gradient} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500`}
                  />

                  <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                    {/* Header */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] text-[#1c1917] group-hover:bg-[#6d28d9] group-hover:text-white transition-colors duration-200 flex items-center justify-center shadow-xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${section.badgeColor}`}
                        >
                          {section.badge}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716c]">
                          {section.tag}
                        </span>
                        <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#6d28d9] transition-colors mt-0.5">
                          {section.title}
                        </h3>
                      </div>

                      <p className="text-xs text-[#57534e] leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Arrow */}
                    <div className="pt-4 border-t border-[#f5f2eb] flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#78716c]">
                        {section.stats}
                      </span>
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-[#6d28d9] group-hover:translate-x-1 transition-transform duration-200">
                        <span>Enter</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* 6th Card: Developer Documentation & API Spec */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.42 }}
          >
            <Link
              to="/docs"
              className="group block h-full bg-[#1c1917] text-white rounded-3xl p-7 border border-[#292524] hover:border-violet-500/50 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-xs">
                      <Terminal className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border bg-amber-400/10 text-amber-300 border-amber-400/20">
                      RFC 9110 / TLS 1.3
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a8a29e]">
                      DOCUMENTATION
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5">
                      Technical API Reference
                    </h3>
                  </div>

                  <p className="text-xs text-[#a8a29e] leading-relaxed">
                    Complete protocol specifications, error schemas, token window formulas, and verification examples for CLI tools and SDKs.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#a8a29e]">
                    cURL • Python • Node.js
                  </span>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform duration-200">
                    <span>View Docs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomePlatformNavigator;
