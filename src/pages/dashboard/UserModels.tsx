import React from 'react';
import { ModelCatalog } from '../../components/ModelCatalog';
import { Sparkles, Terminal, ShieldCheck, Zap } from 'lucide-react';

export const UserModels: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-purple-50 text-[#6d28d9] border border-purple-200">
            <Sparkles className="w-3 h-3 text-[#6d28d9]" />
            <span>Developer Console · 74 Supported Models</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
            Models &amp; Published Rates
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Query any model through your active API key. Route Anthropic models via standard Messages API and OpenAI or open-weight models via Chat Completions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] shadow-xs text-emerald-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All 74 Models Operational</span>
          </span>
        </div>
      </div>

      {/* Embedded Model Catalog */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <ModelCatalog />
      </div>
    </div>
  );
};

export default UserModels;
