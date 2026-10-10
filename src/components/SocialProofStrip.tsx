import React from 'react';
import { Layers, RefreshCw, Shield, Terminal } from 'lucide-react';

export const SocialProofStrip: React.FC = () => {
  const guarantees = [
    {
      icon: Layers,
      title: 'Anthropic Compatible',
      metric: 'Drop-in Protocol',
      description: 'Standard /v1/messages format for Claude Code, Cursor, Windsurf, and official SDKs.',
    },
    {
      icon: RefreshCw,
      title: 'Token Replenishment',
      metric: '5-Hour Rolling',
      description: 'Predictable cyclical token recovery keeps your daily workflow productive.',
    },
    {
      icon: Shield,
      title: 'Confidentiality',
      metric: 'Zero Retention',
      description: 'Direct passthrough streaming with zero disk logs or prompt training.',
    },
    {
      icon: Terminal,
      title: 'Automated Setup',
      metric: '60s Onboarding',
      description: 'One terminal command links your API keys directly to your local environments.',
    },
  ];

  return (
    <section className="border-b border-[#e5e7eb] bg-white py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-page mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e7eb]">
          {guarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="py-6 sm:py-2 px-0 sm:px-6 first:pl-0 last:pr-0 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  <Icon className="w-3.5 h-3.5 text-[#1e40af]" />
                  <span>{item.title}</span>
                </div>
                <div className="text-xl font-bold tracking-tight text-[#111827]">
                  {item.metric}
                </div>
                <p className="text-xs text-[#4b5563] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
