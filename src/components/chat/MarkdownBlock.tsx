import React, { useState, useMemo } from 'react';
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
  FolderArchive,
  Folder,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { ArtifactData } from './ArtifactCanvas';
import { WebSourceItem } from './WebResearchSources';
import {
  extractAllFilesFromMarkdown,
  extractFilenameFromCode,
  getExtensionForLanguage,
  triggerFileDownload,
  downloadAllAsZip,
  ExtractedCodeFile,
} from '../../utils/fileExport';

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
  const [zipping, setZipping] = useState(false);

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

  // Extract multi-file list from content
  const extractedFiles = useMemo(() => {
    return extractAllFilesFromMarkdown(cleanContent);
  }, [cleanContent]);

  const handleDownloadAllZip = async () => {
    if (extractedFiles.length === 0 || zipping) return;
    setZipping(true);
    try {
      await downloadAllAsZip(extractedFiles, 'project-code-export.zip');
    } catch (e) {
      console.error('Failed to create ZIP export:', e);
    } finally {
      setZipping(false);
    }
  };

  // Split content by code blocks ```lang ... ```
  const parts = cleanContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[13.5px] text-[#111827] dark:text-slate-100 font-normal">
      {/* Collapsible Thinking Process Block */}
      {extractedThinking && (
        <div className="my-2.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowThinking(!showThinking)}
            className="w-full px-3.5 py-2 bg-amber-100/50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-between font-mono text-[11px] text-amber-900 dark:text-amber-300 font-bold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Extended Reasoning Process</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400/80 text-[10px]">
              <span>{showThinking ? 'Hide' : 'Inspect thinking'}</span>
              {showThinking ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          </button>
          {showThinking && (
            <div className="p-3.5 font-mono text-[11.5px] text-amber-950 dark:text-amber-200/90 whitespace-pre-wrap leading-relaxed border-t border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-black/20 select-text max-h-80 overflow-y-auto">
              {extractedThinking}
            </div>
          )}
        </div>
      )}

      {/* Multi-File Project Deliverables Summary Bar (Rendered when 2+ files are present) */}
      {extractedFiles.length >= 2 && (
        <div className="my-3 p-3 rounded-xl bg-[#f4f4f0] dark:bg-[#141C30] border border-[#e5e7eb] dark:border-[#28334B] space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="font-bold text-xs text-[#111827] dark:text-white">
                Generated Project Files ({extractedFiles.length})
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={zipping}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {zipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing ZIP...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Download All as ZIP</span>
                </>
              )}
            </button>
          </div>

          {/* File Pills List */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {extractedFiles.map((file, fIdx) => (
              <div
                key={fIdx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-[#e5e7eb] dark:border-[#334155] text-xs font-mono"
              >
                <FileCode className="w-3 h-3 text-slate-500" />
                <span className="font-semibold text-[#111827] dark:text-slate-200">{file.filename}</span>
                <button
                  type="button"
                  onClick={() => triggerFileDownload(file.filename, file.content)}
                  className="ml-1 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                  title={`Download ${file.filename}`}
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Formatted Text & Code Blocks */}
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineBreak = part.indexOf('\n');
          const rawHeader = part.slice(3, firstLineBreak).trim();
          const code = part.slice(firstLineBreak + 1, -3);
          const lang = rawHeader.split(/[:\s]/)[0].toLowerCase() || 'text';
          const explicitName = extractFilenameFromCode(rawHeader, code);

          return (
            <CodeBlock
              key={index}
              language={lang}
              code={code}
              filename={explicitName}
              onOpenCanvas={onOpenCanvas}
            />
          );
        }

        return <TextBlock key={index} text={part} sources={sources} />;
      })}
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string | null;
  onOpenCanvas?: (artifact: ArtifactData) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  filename,
  onOpenCanvas,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const cleanLang = (language || 'text').toLowerCase();
  const ext = getExtensionForLanguage(cleanLang);
  const effectiveFilename = filename || `solution.${ext}`;

  const isPreviewable = cleanLang === 'html' || cleanLang === 'svg';
  const lines = code.split('\n');
  const isLong = lines.length > 28;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    triggerFileDownload(effectiveFilename, code);
  };

  const handleOpenCanvas = () => {
    if (onOpenCanvas) {
      onOpenCanvas({
        id: `art_${Date.now()}`,
        title: effectiveFilename,
        language: cleanLang,
        code,
        type: isPreviewable ? (cleanLang as any) : 'code',
      });
    }
  };

  const displayedLines = isLong && !expanded ? lines.slice(0, 24) : lines;

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-[#28334B] bg-[#0d131f] text-slate-200 shadow-sm">
      {/* Code Header Bar */}
      <div className="px-3.5 py-2 bg-[#161f30] border-b border-[#28334B] flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="font-mono text-[11px] font-bold text-slate-100 truncate">
            {effectiveFilename}
          </span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            ({lines.length} lines)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Open in Editor / Preview Action */}
          {onOpenCanvas && isPreviewable && (
            <button
              type="button"
              onClick={handleOpenCanvas}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-violet-600/30 text-violet-200 hover:bg-violet-600 hover:text-white border border-violet-500/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Open sandboxed visual preview (HTML/SVG)"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-300" />
              <span>{cleanLang === 'svg' ? 'Preview SVG' : 'Preview HTML'}</span>
            </button>
          )}

          {/* Single File Download Action */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 px-2.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={`Download ${effectiveFilename}`}
          >
            <Download className="w-3 h-3" />
            <span className="inline">Download</span>
          </button>

          {/* Copy Action */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 px-2.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Lines with Line Numbers */}
      <div className="p-3 font-mono text-xs overflow-x-auto leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {displayedLines.map((line, i) => {
              const isDiffAdd = line.startsWith('+') && !line.startsWith('+++');
              const isDiffRemove = line.startsWith('-') && !line.startsWith('---');

              return (
                <tr
                  key={i}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isDiffAdd
                      ? 'bg-emerald-950/40 text-emerald-300'
                      : isDiffRemove
                      ? 'bg-rose-950/40 text-rose-300 line-through opacity-75'
                      : ''
                  }`}
                >
                  <td className="w-8 pr-3 text-right select-none text-[11px] text-slate-600 font-mono">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre font-mono pl-1 text-slate-200">
                    {line || '\n'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show More / Show Less Collapser for long blocks */}
      {isLong && (
        <div className="px-3.5 py-1.5 bg-[#121927] border-t border-[#28334B] flex items-center justify-between text-[11px] text-slate-400">
          <span>{expanded ? `Showing all ${lines.length} lines` : `Showing 24 of ${lines.length} lines`}</span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
          >
            {expanded ? 'Show less' : `Show all ${lines.length} lines ↓`}
          </button>
        </div>
      )}
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
            <h5 key={pIdx} className="text-xs font-bold text-[#111827] dark:text-white uppercase tracking-wider mt-3 mb-1">
              {formatInline(trimmed.replace('#### ', ''), sources)}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={pIdx} className="text-sm font-bold text-[#111827] dark:text-white mt-4 mb-1">
              {formatInline(trimmed.replace('### ', ''), sources)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={pIdx} className="text-base font-extrabold text-[#111827] dark:text-white mt-5 mb-1.5 pb-1 border-b border-[#e5e7eb] dark:border-[#28334B]">
              {formatInline(trimmed.replace('## ', ''), sources)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={pIdx} className="text-lg font-black text-[#111827] dark:text-white mt-6 mb-2">
              {formatInline(trimmed.replace('# ', ''), sources)}
            </h2>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={pIdx}
              className="my-2 border-l-3 border-violet-500 pl-3.5 py-1 text-slate-700 dark:text-slate-300 bg-violet-50/60 dark:bg-violet-950/20 rounded-r-xl italic text-[12.5px]"
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
                if (/^[-*]\s+/.test(trimmedLine)) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-[13.5px] text-[#1f2937] dark:text-slate-200 pl-1 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                      <div>{formatInline(trimmedLine.replace(/^[-*]\s+/, ''), sources)}</div>
                    </div>
                  );
                }
                if (/^\d+\.\s+/.test(trimmedLine)) {
                  const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
                  const num = numMatch ? numMatch[1] : `${lIdx + 1}`;
                  const rest = numMatch ? numMatch[2] : trimmedLine;
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-[13.5px] text-[#1f2937] dark:text-slate-200 pl-1 leading-relaxed">
                      <span className="font-mono font-bold text-violet-600 dark:text-violet-400 text-xs shrink-0 mt-0.5 min-w-[16px]">
                        {num}.
                      </span>
                      <div>{formatInline(rest, sources)}</div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="text-[13.5px] text-[#1f2937] dark:text-slate-200 leading-relaxed">
                    {formatInline(trimmedLine, sources)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={pIdx} className="text-[13.5px] text-[#1f2937] dark:text-slate-200 leading-relaxed">
            {formatInline(trimmed, sources)}
          </p>
        );
      })}
    </>
  );
};

function formatInline(text: string, sources?: WebSourceItem[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[\^(\d+)\]|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Bold **text**
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-[#111827] dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic *text*
    else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Inline code `code`
    else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded font-mono text-[11.5px] bg-[#f4f4f0] dark:bg-[#1E293B] text-violet-700 dark:text-violet-300 border border-[#e5e7eb] dark:border-[#334155]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Web Citation [^1]
    else if (token.startsWith('[^') && token.endsWith(']')) {
      const citeNum = parseInt(match[2], 10);
      const src = sources && sources[citeNum - 1];
      parts.push(
        <a
          key={match.index}
          href={src ? src.url : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 rounded px-1 ml-0.5 hover:underline align-super"
          title={src ? `${src.title} — ${src.url}` : `Citation [${citeNum}]`}
        >
          [{citeNum}]
        </a>
      );
    }
    // Markdown link [title](url)
    else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 underline font-semibold hover:opacity-80"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
