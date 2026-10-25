import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Lock, Activity, Server, Database, ArrowRight, ExternalLink } from 'lucide-react';
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
      'Customer keys are issued with high-entropy cryptographic randomness using ld_live_ prefixes and hashed with SHA-256 for validation.',
    technicalDetails: [
      'Keys hashed before storage in database',
      'Plaintext key presented exactly once at issuance',
      'Instant revocation & key rotation from dashboard',
    ],
  },
  {
    title: 'Atomic 5-Hour Refill Accounting',
    category: 'Quota Engine',
    summary:
      'Usage is debited atomically per token against a 5-hour rolling timestamp ledger. Once usage ages past 5 hours, capacity replenishes automatically.',
    technicalDetails: [
      'Sliding-window consumption ledger',
      'Prevents double-spend and race conditions',
      'Direct balance telemetry available via API',
    ],
  },
  {
    title: 'Strict Ingress Architecture',
    category: 'Infrastructure',
    summary:
      'All traffic enters through an encrypted gateway operating under sub-50ms latency overhead, proxying requests to upstream Anthropic inference.',
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
      .catch(() => {
        // Keep neutral fallback
      });
  }, []);

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E1E8]/70">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
                TRUST & TECHNICAL TRANSPARENCY
              </span>
            </div>

            <h2 className="section-headline text-[#191719] font-display">
              Know what sits between your code and the model.
            </h2>

            <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
              Clear technical commitments backed by verifiable engineering implementations.
              No vague marketing claims.
            </p>
          </div>

          {/* Status Badge */}
          <Link
            to="/status"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs text-xs font-mono text-[#191719] hover:bg-[#F8F6F2] transition-colors self-start lg:self-end"
          >
            <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse" />
            <span>Gateway Status: {gatewayStatus}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#68636B]" />
          </Link>
        </div>

        {/* ============================================================ */}
        {/* SIX TECHNICAL TRANSPARENCY PILLARS                           */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRANSPARENCY_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="p-6 sm:p-7 rounded-[18px] bg-white border border-[#E6E1E8] shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#7136E8]/40 transition-colors"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                  {pillar.category}
                </span>

                <h3 className="text-lg font-bold text-[#191719] font-display">
                  {pillar.title}
                </h3>

                <p className="text-xs text-[#68636B] leading-relaxed">
                  {pillar.summary}
                </p>
              </div>

              {/* Technical Specifications Checklist */}
              <div className="space-y-1.5 pt-3 border-t border-[#E6E1E8]/70 text-[11px] font-mono text-[#191719]">
                {pillar.technicalDetails.map((detail) => (
                  <div key={detail} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#7136E8] shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legal Policies Reference Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs text-xs text-[#68636B]">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="font-semibold text-[#191719]">Published Legal Policies:</span>
            <Link to="/terms" className="hover:text-[#191719] hover:underline">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-[#191719] hover:underline">Privacy & Data Handling</Link>
            <Link to="/refund" className="hover:text-[#191719] hover:underline">Refund Policy</Link>
            <Link to="/faq" className="hover:text-[#191719] hover:underline">Developer FAQ</Link>
          </div>

          <span className="font-mono text-[11px] text-[#68636B]">
            Support: support@lightningapi.pro
          </span>
        </div>

      </div>
    </section>
  );
};
