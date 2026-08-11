import React from 'react';
import { Activity, BookOpen, Layers, LifeBuoy, CheckCircle2, ShieldCheck, Zap, Server, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrustEvidence: React.FC = () => {
  const [systemStatus, setSystemStatus] = React.useState<any | null>(null);
  const [statusLoading, setStatusLoading] = React.useState(true);
  const [statusError, setStatusError] = React.useState(false);

  React.useEffect(() => {
    async function fetchLiveStatus() {
      setStatusLoading(true);
      setStatusError(false);
      try {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          setSystemStatus(await res.json());
        } else {
          setStatusError(true);
        }
      } catch (e) {
        setStatusError(true);
      } finally {
        setStatusLoading(false);
      }
    }
    fetchLiveStatus();
  }, []);

  const dbLatency = statusLoading
    ? 'Loading...'
    : statusError || systemStatus?.dbLatencyMs === undefined
    ? 'Unavailable'
    : `${systemStatus.dbLatencyMs}ms`;

  const systemState = statusLoading
    ? 'Checking...'
    : statusError || !systemStatus?.status
    ? 'Unavailable'
    : systemStatus.status === 'OPERATIONAL'
    ? 'Operational'
    : systemStatus.status === 'DEGRADED'
    ? 'Degraded'
    : 'Offline';

  const activeKeysCount = statusLoading
    ? 'Loading...'
    : statusError || systemStatus?.activeKeys === undefined
    ? 'Unavailable'
    : `${systemStatus.activeKeys} Active Keys`;

  const stats = [
    { label: 'Gateway Status', value: systemState, subtext: 'Live Service SLA' },
    { label: 'Database Latency', value: dbLatency, subtext: 'Real Query Time' },
    { label: 'Active Keys', value: activeKeysCount, subtext: 'Live System Total' },
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
        
        {/* Section Header & Ticker Cards */}
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
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

          {/* Stats Metric Ticker Grid - Fixed spacing & fitted text */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s, idx) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -3 }}
                className="bg-bg border border-border/80 p-3.5 sm:p-4 rounded-panel text-center flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-xs overflow-hidden min-w-0"
              >
                <div className="min-h-[32px] flex items-center justify-center">
                  <p className="text-sm sm:text-base font-bold font-mono text-amber-500 truncate tracking-tight w-full">{s.value}</p>
                </div>
                <div className="mt-1 border-t border-border/40 pt-1.5">
                  <p className="text-xs font-bold text-fg leading-tight truncate">{s.label}</p>
                  <p className="text-[10px] font-mono text-muted mt-0.5 truncate">{s.subtext}</p>
                </div>
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
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-control bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-fg group-hover:text-amber-500 transition-colors truncate">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed line-clamp-1 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {item.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-amber-500 transition-colors" />
                </div>
              </motion.a>
            );
          })}
        </div>

      </div>
    </section>
  );
};
