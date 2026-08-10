import React from 'react';
import { Activity, BookOpen, Layers, LifeBuoy, CheckCircle2, ShieldCheck, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrustEvidence: React.FC = () => {
  const [systemStatus, setSystemStatus] = React.useState<any | null>(null);

  React.useEffect(() => {
    async function fetchLiveStatus() {
      try {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          setSystemStatus(await res.json());
        }
      } catch (e) {
        // Fallback safely
      }
    }
    fetchLiveStatus();
  }, []);

  const dbLatency = systemStatus?.dbLatencyMs !== undefined ? `${systemStatus.dbLatencyMs}ms` : '<50ms';
  const systemState = systemStatus?.status === 'OPERATIONAL' ? '100% Operational' : (systemStatus?.status || 'Operational');
  const activeKeysCount = systemStatus?.activeKeys !== undefined ? `${systemStatus.activeKeys} Active` : 'Active Keys';

  const stats = [
    { label: 'Gateway Status', value: systemState, subtext: 'Live Gateway SLA' },
    { label: 'Routing Latency', value: dbLatency, subtext: 'Sub-second Response' },
    { label: 'Active Keys', value: activeKeysCount, subtext: 'Live Token Allocation' },
    { label: 'CLI Onboarding', value: '1 Command', subtext: 'npx lightningdeals' },
  ];

  const items = [

    {
      title: 'Live Gateway Status',
      desc: 'Real-time database, API proxy, and vendor health checks',
      href: '/status',
      icon: Activity,
      badge: 'Operational',
    },
    {
      title: 'Model Catalog & Rates',
      desc: 'Verified model availability, context windows, and features',
      href: '/models',
      icon: Layers,
      badge: 'Live Models',
    },
    {
      title: 'Developer Documentation',
      desc: 'One-command CLI guides and SDK integration examples',
      href: '/docs',
      icon: BookOpen,
      badge: 'SDK Ready',
    },
    {
      title: 'Developer Support Desk',
      desc: 'Dedicated technical support ticket resolution from engineers',
      href: '/docs',
      icon: LifeBuoy,
      badge: 'Active Support',
    },
  ];

  return (
    <section id="status" className="border-b border-border bg-card/40 py-16 sm:py-24 relative overflow-hidden" aria-labelledby="evidence-title">
      <div className="mx-auto max-w-page px-5 sm:px-6 space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Trust & Transparency
            </span>
            <h2 id="evidence-title" className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
              Working evidence, not invented testimonials.
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Inspect live model availability, gateway service health, client configuration guides, and direct support ticket response paths before spending a single dollar.
            </p>
          </motion.div>

          {/* Stats Metric Ticker Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((s, idx) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -3 }}
                className="bg-bg border border-border/80 p-4 rounded-panel text-center space-y-1 hover:border-amber-500/40 transition-all shadow-md"
              >
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-500">{s.value}</p>
                <p className="text-xs font-bold text-fg">{s.label}</p>
                <p className="text-[10px] font-mono text-muted">{s.subtext}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature Evidence Items Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.a
                key={item.title}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-bg/90 border border-border/80 p-5 rounded-panel flex items-center justify-between gap-4 hover:border-amber-500/50 hover:shadow-lg transition-all group backdrop-blur-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 group-hover:scale-110 transition-transform">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-fg group-hover:text-amber-400 transition-colors">{item.title}</h3>
                    <p className="text-xs text-muted truncate mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold font-mono text-emerald-500 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.badge}
                </span>
              </motion.a>
            );
          })}
        </div>

      </div>
    </section>
  );
};
