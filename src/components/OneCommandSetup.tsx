import React, { useState } from 'react';
import { Terminal, Copy, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export const OneCommandSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'all' | 'windows'>('all');

  const command = platform === 'windows' ? 'iwr https://lightningapi.pro/setup.ps1 | iex' : 'npx lightningdeals';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      num: '01',
      title: 'Run Setup Helper',
      desc: 'Execute our CLI utility in your local terminal. It automatically detects your installed developer tools.',
    },
    {
      num: '02',
      title: 'Authorize With Key',
      desc: 'Enter your personal key to safely configure your local environment variables without manual file editing.',
    },
    {
      num: '03',
      title: 'Begin Working',
      desc: 'Launch Claude Code or open Cursor. Requests route directly through your rolling token quota.',
    },
  ];

  return (
    <section className="py-16 lg:py-24 border-b border-[#e5e7eb] bg-white font-sans">
      <div className="max-w-page mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] tracking-wider uppercase">
            Quick Onboarding
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] tracking-tight">
            Automated configuration in 60 seconds.
          </h2>

          <p className="text-sm sm:text-base text-[#4b5563] leading-relaxed">
            No searching for hidden config folders or editing system path variables. Run our verified helper script and start building.
          </p>
        </div>

        {/* Terminal Block & OS Selector */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlatform('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                platform === 'all'
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-[#f4f4f0] text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              macOS / Linux / Universal (npx)
            </button>
            <button
              type="button"
              onClick={() => setPlatform('windows')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                platform === 'windows'
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-[#f4f4f0] text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              Windows (PowerShell)
            </button>
          </div>

          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 text-white shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" />
                <span className="font-mono text-[11px]">terminal</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCmd}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
            <div className="pt-3 font-mono text-xs sm:text-sm text-gray-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-gray-500 select-none">$</span>
              <code>{command}</code>
            </div>
          </div>
        </div>

        {/* 3 Clear Steps */}
        <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-[#e5e7eb]">
          {steps.map((s) => (
            <div key={s.num} className="space-y-2">
              <div className="text-xs font-mono font-semibold text-[#1e40af]">
                Step {s.num}
              </div>
              <h3 className="text-base font-bold text-[#111827]">
                {s.title}
              </h3>
              <p className="text-xs text-[#4b5563] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
