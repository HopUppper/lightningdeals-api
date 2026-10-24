import React, { useState } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronUp, BookOpen, Clock } from 'lucide-react';

export interface WebSourceItem {
  citationIndex: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  timestamp: string;
  publishedDate?: string;
}

interface WebResearchSourcesProps {
  sources: WebSourceItem[];
  researchMode?: string;
  provider?: string;
  inspectedUrl?: string;
  isDarkTheme?: boolean;
  defaultExpanded?: boolean;
}

export const WebResearchSources: React.FC<WebResearchSourcesProps> = ({
  sources,
  researchMode,
  provider,
  inspectedUrl,
  isDarkTheme = true,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if ((!sources || sources.length === 0) && !inspectedUrl) return null;

  const modeLabel =
    researchMode === 'deep_research'
      ? 'Deep Research Report'
      : researchMode === 'open_link'
      ? 'Direct Link Analysis'
      : 'Grounded Web Research';

  // Sanitize third-party supplier branding to ensure pure customer-facing white labeling
  const displayProvider = provider
    ? provider.replace(/tavily(?:\s*search)?(?:\s*api)?/gi, 'Live Web Index').trim()
    : undefined;

  return (
    <div className="mb-3 space-y-2">
      {/* Inspected Link Pill */}
      {inspectedUrl && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold shrink-0">Analyzed Page:</span>
            <span className="truncate font-mono text-[11px] opacity-90">{inspectedUrl}</span>
          </div>
          <a
            href={inspectedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 ml-2 px-2 py-0.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold"
          >
            Visit URL
          </a>
        </div>
      )}

      {/* Sources Grid Drawer */}
      {sources && sources.length > 0 && (
        <div className={`rounded-xl border p-2.5 transition-all ${
          isDarkTheme ? 'bg-[#121829] border-violet-500/20' : 'bg-violet-50/60 border-violet-200'
        }`}>
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between cursor-pointer select-none text-xs"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-violet-500" />
              <span className="font-bold text-violet-700 dark:text-violet-300">
                {modeLabel} ({sources.length} sources)
              </span>
              {displayProvider && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30">
                  {displayProvider}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span>{isExpanded ? 'Collapse' : 'View sources'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in duration-150">
              {sources.map((src) => (
                <a
                  key={src.citationIndex}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg border flex flex-col justify-between transition-all group ${
                    isDarkTheme
                      ? 'bg-slate-900/90 border-slate-800 hover:border-violet-500/50 hover:bg-slate-850'
                      : 'bg-white border-slate-200 hover:border-violet-400 hover:shadow-xs'
                  }`}
                  title={src.snippet}
                >
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {src.citationIndex}
                    </span>
                    <p className="font-semibold text-[11px] leading-tight truncate group-hover:text-violet-500">
                      {src.title || src.domain}
                    </p>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {src.snippet}
                  </p>

                  <div className="mt-1.5 pt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[120px]">{src.domain}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-violet-500" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
