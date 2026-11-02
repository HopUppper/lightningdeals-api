import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

export interface CodeTab {
  label: string; // e.g. "Windows (PowerShell)", "macOS (Zsh)", "Linux (Bash)", "Python", "cURL"
  language: string;
  code: string;
  filename?: string;
}

interface MultiOsCodeBlockProps {
  tabs: CodeTab[];
  title?: string;
  defaultTab?: string;
  filename?: string;
}

export const MultiOsCodeBlock: React.FC<MultiOsCodeBlockProps> = ({
  tabs,
  title,
  defaultTab,
  filename: globalFilename,
}) => {
  const [activeTabIdx, setActiveTabIdx] = useState(() => {
    if (defaultTab) {
      const found = tabs.findIndex((t) => t.label.toLowerCase().includes(defaultTab.toLowerCase()));
      if (found !== -1) return found;
    }
    // Default to Windows on Windows, macOS on Apple, or first tab
    if (typeof navigator !== 'undefined') {
      if (navigator.userAgent.includes('Win')) {
        const winIdx = tabs.findIndex((t) => t.label.toLowerCase().includes('windows') || t.label.toLowerCase().includes('powershell'));
        if (winIdx !== -1) return winIdx;
      } else if (navigator.userAgent.includes('Mac')) {
        const macIdx = tabs.findIndex((t) => t.label.toLowerCase().includes('mac') || t.label.toLowerCase().includes('zsh'));
        if (macIdx !== -1) return macIdx;
      }
    }
    return 0;
  });

  const [copied, setCopied] = useState(false);

  const currentTab = tabs[activeTabIdx] || tabs[0];
  const activeFilename = currentTab.filename || globalFilename;

  const handleCopy = () => {
    if (!currentTab) return;
    navigator.clipboard.writeText(currentTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-2xl border border-neutral-800 bg-[#0c0d14] text-[#f4f4f5] shadow-xl overflow-hidden font-mono text-xs ring-1 ring-white/10">
      {/* Top Header Rail */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800/80 bg-[#11131c] px-4 py-2.5 text-[11px] text-neutral-400 gap-2">
        <div className="flex items-center gap-3">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]/50 shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d8a123]/50 shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]/50 shadow-2xs" />
          </div>

          {activeFilename ? (
            <span className="flex items-center gap-1.5 font-medium text-neutral-200 text-xs">
              <FileCode className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[320px]">{activeFilename}</span>
            </span>
          ) : title ? (
            <span className="font-semibold text-neutral-300 text-xs flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span>{title}</span>
            </span>
          ) : null}
        </div>

        {/* Tab Switcher & Copy Action */}
        <div className="flex items-center gap-2">
          {tabs.length > 1 && (
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTabIdx(idx)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-sans font-semibold transition-all cursor-pointer ${
                    activeTabIdx === idx
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-[11px] font-mono font-semibold transition-all shadow-plum flex items-center gap-1.5 cursor-pointer ml-1"
            title="Copy snippet"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-300" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="relative p-4 sm:p-5 overflow-x-auto bg-[#08090f]">
        <pre className="leading-relaxed font-mono text-xs sm:text-[13px] selection:bg-purple-900 selection:text-white">
          {currentTab.code.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            const isComment = trimmed.startsWith('#') || trimmed.startsWith('//');
            const isCommand =
              trimmed.startsWith('npx ') ||
              trimmed.startsWith('claude') ||
              trimmed.startsWith('export ') ||
              trimmed.startsWith('$env:') ||
              trimmed.startsWith('curl ') ||
              trimmed.startsWith('irm ');
            return (
              <div
                key={idx}
                className={`table-row ${
                  isComment
                    ? 'text-neutral-500 italic'
                    : isCommand
                    ? 'text-amber-300 font-bold'
                    : 'text-neutral-200'
                }`}
              >
                <span className="table-cell pr-4 text-right select-none text-neutral-700 text-[11px] w-8">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">{line || ' '}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};
