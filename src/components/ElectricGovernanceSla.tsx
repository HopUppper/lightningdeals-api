import React from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ElectricGovernanceSla: React.FC = () => {
  const pillars = [
    {
      icon: EyeOff,
      title: 'Volatile In-Memory Streaming',
      desc: 'Requests transit directly through RAM in-stream over encrypted TLS 1.3 connections. Zero intermediate payloads or prompt tokens are written to disk storage.',
    },
    {
      icon: Server,
      title: 'Zero Prompt Archival',
      desc: 'We track aggregate token counters strictly for 5-hour quota accounting. Code files, system instructions, and completion strings are never logged or stored.',
    },
    {
      icon: FileCheck,
      title: 'Strictly No AI Training',
      desc: 'Customer inputs and completions are strictly exempt from model evaluation, fine-tuning, and machine learning training regimes.',
    },
  ];

  const boundaries = [
    {
      category: 'WHAT NEVER TOUCHES DISK',
      badge: 'Zero Retention',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      items: [
        'User prompt text & system instructions',
        'Repository file contents & AST representations',
        'Model outputs & streaming delta chunks',
        'Thinking process tokens & internal reflection buffers',
      ],
    },
    {
      category: 'WHAT WE STORE TO OPERATE',
      badge: 'Minimum Necessary',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      items: [
        'Account email & salted scrypt password hashes',
        'Cryptographic SHA-256 signatures of API keys',
        'Rolling integer token counters (timestamped)',
        'Payment transaction receipts & order IDs',
      ],
    },
  ];

  return (
    <section id="governance" className="py-16 sm:py-24 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Governance Charter Banner */}
        <div className="rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-10 lg:p-12 shadow-warm space-y-8">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-semibold text-[#047857]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SOVEREIGN DATA GOVERNANCE CHARTER</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
              Zero prompt retention. Complete intellectual property isolation.
            </h3>

            <p className="text-sm sm:text-base text-[#57534e] leading-relaxed">
              We treat your proprietary codebase, trade secrets, and research prompts as strictly confidential volatile data.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {pillars.map((pil, idx) => {
              const Icon = pil.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-[#faf8f5] border border-[#e7e5e4] space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-white border border-[#e7e5e4] w-fit text-[#6d28d9] shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1c1917]">{pil.title}</h4>
                  <p className="text-xs text-[#78716c] leading-relaxed">{pil.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Explicit Data Boundary Breakdown */}
          <div className="pt-6 border-t border-[#e7e5e4] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#78716c]">
                EXPLICIT DATA BOUNDARY SPECIFICATION
              </h4>
              <Link
                to="/privacy"
                className="text-xs font-semibold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1"
              >
                <span>Read Full 12-Section Privacy Policy</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boundaries.map((b, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#faf8f5] border border-[#e7e5e4] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold tracking-wider text-[#1c1917]">
                      {b.category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${b.badgeColor}`}>
                      {b.badge}
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#57534e]">
                    {b.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <span className="text-[#6d28d9] font-bold">↳</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
