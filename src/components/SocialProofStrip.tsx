import React from 'react';
import { ShieldCheck, CheckCircle2, Zap, Terminal, Code2 } from 'lucide-react';

export const SocialProofStrip: React.FC = () => {
  return (
    <section className="border-b border-border bg-white py-8 px-5 sm:px-6">
      <div className="max-w-page mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Active Trust Counter */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-500 text-black font-bold text-xs flex items-center justify-center font-mono">
              CC
            </div>
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-zinc-900 text-white font-bold text-xs flex items-center justify-center font-mono">
              CR
            </div>
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
              WS
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-fg">Powering Active Developers Worldwide</p>
            <p className="text-[11px] text-muted font-mono">Claude Code CLI · Cursor · Windsurf · VS Code</p>
          </div>
        </div>

        {/* IDE Compatibility Badges */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-mono font-semibold text-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Drop-in Anthropic /v1 Protocol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>99.9% Production Uptime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero Prompt Data Logging</span>
          </div>
        </div>

      </div>
    </section>
  );
};
