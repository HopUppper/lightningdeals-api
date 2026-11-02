import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Lock, Activity, Server, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TransparencyPillar {
  title: string;
  category: string;
  summary: string;
  technicalDetails: string[];
}

const TRANSPARENCY_PILLARS: TransparencyPillar[] = [
  {
    title: 'Zero Prompt Logging Policy',
    category: 'Privacy & Retention',
    summary:
      'Prompts and completion tokens are streamed directly in-flight. LightningAPI does not write prompt contents or model responses to disk, databases, or object storage.',
    technicalDetails: [
      'Pure in-memory TLS 1.3 reverse proxy',
      'Zero model inference logs persisted to disk',
      'Ephemeral request stream buffers garbage-collected immediately',
    ],
  },
  {
    title: 'Cryptographic Key Management',
    category: 'Authentication',
    summary:
      'Customer keys are issued with high-entropy cryptographic randomness using sk_live_ prefixes and hashed with SHA-256 for validation.',
    technicalDetails: [
      'Keys hashed before storage in database',
      'Plaintext key presented exactly once at issuance',
      'Instant revocation & key rotation from dashboard',
    ],
  },
  {
    title: 'Tri-Modal Quota, Credit & Token Pack Accounting',
    category: 'Accounting Engine',
    summary:
      'Supports continuous 5-hour rolling pool refills (Claude & OpenAI), universal pay-as-you-go credits with 7x bonus value, and non-expiring prepaid token packs.',
    technicalDetails: [
      'Continuous 5-hour sliding-window ledger',
      'Universal USD credit debit engine with 7x purchasing value',
      'Prepaid token pack consumable ledger with real-time telemetry at /check-key',
    ],
  },
  {
    title: 'Strict Ingress Architecture',
    category: 'Infrastructure',
    summary:
      'All traffic enters through an encrypted gateway operating under sub-15ms latency overhead, proxying requests to upstream Anthropic, OpenAI, and DeepSeek inference.',
    technicalDetails: [
      'TLS 1.3 with strict modern cipher suites',
      'Direct HTTP/2 & HTTP/1.1 keep-alive connections',
      'Streaming Server-Sent Events (SSE) passthrough',
    ],
  },
  {
    title: 'Transparent Operational Status',
    category: 'Telemetry',
    summary:
      'Gateway health and service endpoints are monitored continuously with live public status telemetry available at /status.',
    technicalDetails: [
      'Public /api/health and /api/ready probes',
      'Real-time response latency metrics',
      'Proactive incident notices and degradation alerts',
    ],
  },
  {
    title: 'Support & Engineering Escalation',
    category: 'Operations',
    summary:
      'Direct developer-to-developer support via email, support desk widget, and priority engineering channels for team plans.',
    technicalDetails: [
      'Support desk widget on all pages',
      'Direct email: support@lightningapi.pro',
      'Assistance with Cursor, Claude Code, and SDK setups',
    ],
  },
];

export const TrustAndTransparency: React.FC = () => {
  const [gatewayStatus, setGatewayStatus] = useState<'Operational' | 'Checking'>('Operational');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.status === 'healthy') {
          setGatewayStatus('Operational');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative py-16 sm:py-24 bg-white text-zinc-950 font-sans overflow-hidden border-b border-zinc-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-700 font-semibold">
                TRUST &amp; ARCHITECTURE
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-950 font-display tracking-tight">
              Enterprise-grade privacy and infrastructure.
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              We operate under strict zero-data-retention principles. Your prompts are never stored, logged, or used for AI training.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono self-start lg:self-end">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-zinc-600">Gateway Status:</span>
            <span className="font-bold text-zinc-950">{gatewayStatus}</span>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRANSPARENCY_PILLARS.map((p) => (
            <div
              key={p.title}
              className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-medium text-violet-700 uppercase">
                  {p.category}
                </span>
                <h3 className="text-base font-bold text-zinc-950">{p.title}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">{p.summary}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-zinc-200/80 text-[11px] text-zinc-500 font-mono">
                {p.technicalDetails.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-violet-600 shrink-0">✓</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TrustAndTransparency;