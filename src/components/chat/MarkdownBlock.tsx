import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Eye,
  Brain,
} from 'lucide-react';
import { ArtifactData } from './ArtifactCanvas';
import { WebSourceItem } from './WebResearchSources';

interface MarkdownBlockProps {
  content: string;
  thinkingContent?: string | null;
  onOpenCanvas?: (artifact: ArtifactData) => void;
  sources?: WebSourceItem[];
}

export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({
  content,
  thinkingContent,
  onOpenCanvas,
  sources,
}) => {
  const [showThinking, setShowThinking] = useState(false);

  if (!content && !thinkingContent) return null;

  // Extract inline <thinking> tags if embedded in the content
  let cleanContent = content || '';
  let extractedThinking = thinkingContent || '';

  const thinkingMatch = cleanContent.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  if (thinkingMatch) {
    if (!extractedThinking) {
      extractedThinking = thinkingMatch[1].trim();
    }
    cleanContent = cleanContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  }

  // Split content by code blocks ```lang ... ```
  const parts = cleanContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[13.5px] text-[#1F1E1D] dark:text-slate-100 font-normal">
      {/* Collapsible Claude 3.7 Thinking Process Block */}
      {extractedThinking && (
        <div className="my-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowThinking(!showThinking)}
            className="w-full px-3.5 py-2 bg-amber-950/30 hover:bg-amber-900/30 flex items-center justify-between font-mono text-[11px] text-amber-300 font-bold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Thinking Process (Extended Reasoning)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400/80 text-[10px]">
              <span>{showThinking ? 'Hide' : 'Show reasoning'}</span>
              {showThinking ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          </button>
          {showThinking && (
            <div className="p-3.5 font-mono text-[11.5px] text-amber-200/90 whitespace-pre-wrap leading-relaxed border-t border-amber-500/20 bg-black/20 select-text max-h-80 overflow-y-auto">
              {extractedThinking}
            </div>
          )}
        </div>
      )}

      {/* Main Formatted Text & Code Blocks */}
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineBreak = part.indexOf('\n');
          const lang = part.slice(3, firstLineBreak).trim() || 'text';
          const code = part.slice(firstLineBreak + 1, -3);

          return (
            <CodeBlock
              key={index}
              language={lang}
              code={code}
              onOpenCanvas={onOpenCanvas}
            />
          );
        }

        return <TextBlock key={index} text={part} sources={sources} />;
      })}
    </div>
  );
};

const CodeBlock: React.FC<{
  language: string;
  code: string;
  onOpenCanvas?: (artifact: ArtifactData) => void;
}> = ({ language, code, onOpenCanvas }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const ext = getExtension(language);
    link.href = url;
    link.download = `solution.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenCanvas = () => {
    if (onOpenCanvas) {
      onOpenCanvas({
        id: `art_${Date.now()}`,
        title: `Snippet (${language.toUpperCase()})`,
        language,
        code,
        type:
          language === 'html' || language === 'svg'
            ? (language as any)
            : 'code',
      });
    }
  };

  const lines = code.split('\n');
  const isPreviewable = language === 'html' || language === 'svg' || language === 'tsx' || language === 'jsx';

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-[#28334B] bg-[#0B1020] text-slate-200 shadow-lg">
      {/* Code Header Bar */}
      <div className="px-3.5 py-2 bg-[#141C30] border-b border-[#28334B] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-violet-300">
            {language}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenCanvas && (
            <button
              type="button"
              onClick={handleOpenCanvas}
              className="p-1 px-2.5 rounded-lg text-[11px] font-semibold bg-violet-600/30 text-violet-200 hover:bg-violet-600 hover:text-white border border-violet-500/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Open in interactive Claude Canvas"
            >
              {isPreviewable ? <Eye className="w-3 h-3 text-cyan-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
              <span>{isPreviewable ? 'Open Canvas' : 'Inspect'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-1 px-2 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Download code file"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Content with Line Numbers and Diff Highlighting */}
      <div className="p-3.5 font-mono text-xs overflow-x-auto leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const isDiffAdd = line.startsWith('+') && !line.startsWith('+++');
              const isDiffRemove = line.startsWith('-') && !line.startsWith('---');

              return (
                <tr
                  key={i}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    isDiffAdd
                      ? 'bg-emerald-950/30 text-emerald-300'
                      : isDiffRemove
                      ? 'bg-rose-950/30 text-rose-300 line-through opacity-75'
                      : ''
                  }`}
                >
                  <td className="w-8 pr-3 text-right select-none text-[11px] text-slate-600 font-mono">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre font-mono pl-1 text-slate-300">
                    {line || '\n'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TextBlock: React.FC<{ text: string; sources?: WebSourceItem[] }> = ({ text, sources }) => {
  if (!text.trim()) return null;

  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Header checks
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={pIdx} className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-3 mb-1">
              {formatInline(trimmed.replace('#### ', ''), sources)}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={pIdx} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-1">
              {formatInline(trimmed.replace('### ', ''), sources)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={pIdx} className="text-base font-extrabold text-slate-900 dark:text-white mt-5 mb-1.5 pb-1 border-b border-slate-200 dark:border-[#28334B]">
              {formatInline(trimmed.replace('## ', ''), sources)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={pIdx} className="text-lg font-black text-slate-900 dark:text-white mt-6 mb-2">
              {formatInline(trimmed.replace('# ', ''), sources)}
            </h2>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={pIdx}
              className="my-2 border-l-3 border-violet-500 pl-3.5 py-1 text-slate-700 dark:text-slate-300 bg-violet-50 dark:bg-violet-950/20 rounded-r-xl italic text-[12.5px]"
            >
              {formatInline(trimmed.replace(/^>\s*/, ''), sources)}
            </blockquote>
          );
        }

        // Check if paragraph contains bullet or numbered lists
        const lines = trimmed.split('\n');
        const hasListItems = lines.some((l) => /^[-*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()));

        if (hasListItems) {
          return (
            <div key={pIdx} className="space-y-1.5 my-2">
              {lines.map((l, lIdx) => {
                const trimmedLine = l.trim();
                if (trimmedLine.startsWith('#### ')) {
                  return (
                    <h5 key={lIdx} className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-3 mb-1">
                      {formatInline(trimmedLine.replace('#### ', ''), sources)}
                    </h5>
                  );
                }
                if (trimmedLine.startsWith('### ')) {
                  return (
                    <h4 key={lIdx} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">
                      {formatInline(trimmedLine.replace('### ', ''), sources)}
                    </h4>
                  );
                }
                if (/^[-*]\s+/.test(trimmedLine)) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-[13.5px] text-slate-800 dark:text-slate-200 pl-1 leading-relaxed">
                      <span className="text-violet-600 dark:text-violet-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{formatInline(trimmedLine.replace(/^[-*]\s+/, ''), sources)}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s+/.test(trimmedLine)) {
                  const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-[13.5px] text-slate-800 dark:text-slate-200 pl-1 leading-relaxed">
                      <span className="text-violet-600 dark:text-violet-400 font-semibold font-mono text-xs shrink-0 mt-0.5">
                        {numMatch ? `${numMatch[1]}.` : '1.'}
                      </span>
                      <span>{formatInline(numMatch ? numMatch[2] : trimmedLine, sources)}</span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="leading-relaxed text-slate-800 dark:text-slate-200 text-[13.5px]">
                    {formatInline(trimmedLine, sources)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Regular paragraph with line breaks
        return (
          <p key={pIdx} className="leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200 text-[13.5px]">
            {formatInline(trimmed, sources)}
          </p>
        );
      })}
    </>
  );
};

function formatInline(text: string, sources?: WebSourceItem[]): React.ReactNode {
  // Matches inline code (`...`), bold (**...**), markdown links ([text](url)), and citations ([1], [2], etc.)
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[(?:[^\]]+)\]\((?:https?:\/\/[^\s)]+)\)|\[\d+\])/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono text-[11.5px] border border-slate-200 dark:border-violet-500/30 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold text
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Markdown link: [Title](https://...)
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 font-medium underline underline-offset-2 hover:text-violet-500 transition-colors inline-flex items-center gap-0.5"
        >
          <span>{linkMatch[1]}</span>
        </a>
      );
    }

    // Inline Citation Badge: [1], [2], etc. (Part 1.4)
    const citeMatch = part.match(/^\[(\d+)\]$/);
    if (citeMatch) {
      const citeNum = parseInt(citeMatch[1], 10);
      const matchedSource = sources?.find((s) => s.citationIndex === citeNum);
      if (matchedSource) {
        return (
          <a
            key={i}
            href={matchedSource.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${matchedSource.title}\nSource: ${matchedSource.domain}${matchedSource.publishedDate ? ` • ${matchedSource.publishedDate}` : ''}`}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-full text-[10px] font-bold font-mono bg-violet-500/15 hover:bg-violet-500/30 text-violet-700 dark:text-violet-300 border border-violet-500/30 hover:border-violet-500/60 transition-all select-none align-baseline cursor-pointer group shadow-2xs"
          >
            <span className="text-[9.5px]">[{citeNum}]</span>
            <span className="text-[9px] opacity-80 font-sans truncate max-w-[85px] hidden sm:inline">
              {matchedSource.domain}
            </span>
          </a>
        );
      }
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 select-none align-baseline"
        >
          [{citeNum}]
        </span>
      );
    }

    return part;
  });
}

function getExtension(lang: string): string {
  const map: Record<string, string> = {
    typescript: 'tsx',
    javascript: 'jsx',
    python: 'py',
    json: 'json',
    sql: 'sql',
    html: 'html',
    css: 'css',
    rust: 'rs',
    go: 'go',
    bash: 'sh',
    shell: 'sh',
  };
  return map[(lang || '').toLowerCase()] || 'txt';
}
