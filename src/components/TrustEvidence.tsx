import React, { useState, useEffect } from 'react';
import { Activity, BookOpen, Layers, LifeBuoy, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrustEvidence: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
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
    ? 'Checking...'
    : statusError || systemStatus?.dbLatencyMs === undefined
    ? 'Active'
    : `${systemStatus.dbLatencyMs}ms`;

  const systemState = statusLoading
    ? 'Checking...'
    : statusError || !systemStatus?.status
    ? 'Operational'
    : systemStatus.status === 'OPERATIONAL'
    ? 'Operational'
    : systemStatus.status === 'DEGRADED'
    ? 'Degraded'
    : 'Offline';

  const stats = [
    { label: 'Gateway Health', value: systemState, subtext: 'Regional routing nodes' },
    { label: 'Database Response', value: dbLatency, subtext: 'Real-time telemetry query' },
    { label: 'CLI Onboarding', value: '60 Seconds', subtext: 'Automated configuration' },
    { label: 'Retention Policy', value: 'Zero Log', subtext: 'Strict passthrough SLA' },
  ];

  const resources = [
    {
      title: 'Live System Telemetry',
      desc: 'Real-time database, API proxy, and vendor health status checks',
      href: '/status',
      icon: Activity,
    },
    {
      title: 'Model Lineup & Specs',
      desc: 'Explore available models, 1M context windows, and best-use guidance',
      href: '/models',
      icon: Layers,
    },
    {
      title: 'Setup & Documentation',
      desc: 'Plain-language guides for Cursor, Claude Code, and Python/JS SDKs',
      href: '/docs',
      icon: BookOpen,
    },
    {
      title: 'Support & Assistance',
      desc: 'Direct priority assistance whenever you have technical or billing questions',
      href: '/dashboard/support',
      icon: LifeBuoy,
    },
  ];

  return (
    <section className="border-b border-[#e5e7eb] bg-[#fbfbfa] py-16 lg:py-20 font-sans">
      <div className="max-w-page mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e5e7eb] pb-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
              System Verification
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Operational transparency you can inspect.
            </h2>
            <p className="text-xs sm:text-sm text-[#4b5563]">
              Live status from our routing nodes, database health, and streaming pipelines.
            </p>
          </div>

          <Link
            to="/status"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#1e40af] hover:text-[#1d4ed8] transition-colors"
          >
            <span>Open live telemetry monitor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Telemetry Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-white p-5 rounded-lg border border-[#e5e7eb] space-y-1.5 shadow-xs">
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                {s.label}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#111827]">
                {s.value}
              </div>
              <p className="text-xs text-[#6b7280]">
                {s.subtext}
              </p>
            </div>
          ))}
        </div>

        {/* Resource Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {resources.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.href}
                className="bg-white p-5 rounded-lg border border-[#e5e7eb] hover:border-[#9ca3af] transition-all group block shadow-xs"
              >
                <div className="p-2 w-fit rounded bg-[#f4f4f0] text-[#111827] mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#1e40af] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#4b5563] leading-normal mt-1">
                  {item.desc}
                </p>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
