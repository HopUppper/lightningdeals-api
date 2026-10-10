import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OneLineMigration: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 bg-white text-[#111827] border-b border-[#e5e7eb] font-sans">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center min-w-0">
          
          <div className="space-y-4 min-w-0 w-full">
            <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
              Drop-In Migration
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827]">
              Exactly one parameter changes.
            </h2>
            
            <p className="text-sm sm:text-base leading-relaxed text-[#4b5563] max-w-md">
              No SDK forks, no new dependencies, and no prompt rewriting. Repoint your client’s base URL to LightningAPI and every streaming call operates identically—backed by rolling token recovery.
            </p>
            
            <div className="pt-2">
              <Link to="/docs" className="ui-button-secondary text-xs px-5 py-2.5 font-medium inline-flex items-center gap-1.5">
                <span>View Migration Documentation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs min-w-0 w-full">
            {/* Standard Direct (Before) */}
            <div className="border border-[#e5e7eb] rounded-lg bg-[#fbfbfa] overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f4f4f0] px-4 py-2 text-[11px] text-[#6b7280]">
                <span>Standard Direct SDK Setup</span>
                <span>api.anthropic.com</span>
              </div>
              <div className="p-4 text-[#4b5563] leading-relaxed overflow-x-auto">
                <span className="text-gray-400">client = Anthropic(</span><br />
                <span className="text-gray-400">&nbsp;&nbsp;base_url=</span><span className="text-rose-700 font-semibold">"https://api.anthropic.com"</span>,<br />
                <span className="text-gray-400">&nbsp;&nbsp;api_key=os.environ["ANTHROPIC_API_KEY"]</span><br />
                <span className="text-gray-400">)</span>
              </div>
            </div>

            {/* LightningAPI Gateway (After) */}
            <div className="border-2 border-[#1e40af] rounded-lg bg-white overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-[#1e40af]/20 bg-[#eff6ff] px-4 py-2 text-[11px] text-[#1e40af] font-semibold">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#1e40af]" />
                  <span>LightningAPI Gateway Drop-in</span>
                </div>
                <span>lightningapi.pro/v1</span>
              </div>
              <div className="p-4 text-[#111827] leading-relaxed overflow-x-auto">
                <span className="text-gray-500">client = Anthropic(</span><br />
                <span className="text-gray-500">&nbsp;&nbsp;base_url=</span><span className="text-[#1e40af] font-bold">"https://lightningapi.pro/v1"</span>,<br />
                <span className="text-gray-500">&nbsp;&nbsp;api_key=os.environ["LIGHTNING_API_KEY"]</span><br />
                <span className="text-gray-500">)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
