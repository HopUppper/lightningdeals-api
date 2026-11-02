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
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ArtifactData } from './ArtifactCanvas';
import { WebSourceItem } from './WebResearchSources';
import {
  extractAllFilesFromMarkdown,
  extractFilenameFromCode,
  getExtensionForLanguage,
  triggerFileDownload,
  downloadAllAsZip,
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

  // Split content cleanly into text segments and code blocks (including unclosed blocks during streaming)
  const parts = useMemo(() => {
    return splitMarkdownCodeBlocks(cleanContent);
  }, [cleanContent]);

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
        if (part.startsWith('```')) {
          const hasClosing = part.length >= 6 && part.endsWith('```');
          const firstLineBreak = part.indexOf('\n');
          const rawHeader = firstLineBreak !== -1 ? part.slice(3, firstLineBreak).trim() : '';
          const code = firstLineBreak !== -1
            ? (hasClosing ? part.slice(firstLineBreak + 1, -3) : part.slice(firstLineBreak + 1))
            : '';
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

// Splits markdown content safely into code blocks and prose text blocks
function splitMarkdownCodeBlocks(content: string): string[] {
  const segments: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    const startIdx = remaining.indexOf('```');
    if (startIdx === -1) {
      segments.push(remaining);
      break;
    }

    if (startIdx > 0) {
      segments.push(remaining.slice(0, startIdx));
    }

    const endIdx = remaining.indexOf('```', startIdx + 3);
    if (endIdx === -1) {
      // Unclosed code block extending to the end (e.g. while streaming)
      segments.push(remaining.slice(startIdx));
      break;
    } else {
      segments.push(remaining.slice(startIdx, endIdx + 3));
      remaining = remaining.slice(endIdx + 3);
    }
  }

  return segments;
}

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
    <div className="my-3.5 rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-[#28334B] bg-[#0d131f] text-slate-200 shadow-xs">
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

interface TableData {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

interface ParsedBlock {
  type: 'heading' | 'table' | 'hr' | 'blockquote' | 'alert' | 'list' | 'paragraph';
  level?: number;
  content?: string;
  table?: TableData;
  alertType?: string;
  items?: { text: string; indent: number; isTask?: boolean; checked?: boolean; num?: string }[];
}

const TextBlock: React.FC<{ text: string; sources?: WebSourceItem[] }> = ({ text, sources }) => {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {blocks.map((block, idx) => {
        // 1. Heading Elements H1 - H6
        if (block.type === 'heading') {
          const content = block.content || '';
          switch (block.level) {
            case 1:
              return (
                <h1
                  key={idx}
                  className="text-xl sm:text-2xl font-black text-[#111827] dark:text-white mt-6 mb-3 tracking-tight leading-tight"
                >
                  {formatInline(content, sources)}
                </h1>
              );
            case 2:
              return (
                <h2
                  key={idx}
                  className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white mt-5 mb-2.5 pb-1.5 border-b border-[#e5e7eb] dark:border-[#28334B] leading-tight"
                >
                  {formatInline(content, sources)}
                </h2>
              );
            case 3:
              return (
                <h3
                  key={idx}
                  className="text-base font-bold text-[#111827] dark:text-white mt-4 mb-2 leading-snug"
                >
                  {formatInline(content, sources)}
                </h3>
              );
            case 4:
              return (
                <h4
                  key={idx}
                  className="text-sm font-bold text-[#111827] dark:text-white mt-3.5 mb-1.5 leading-snug"
                >
                  {formatInline(content, sources)}
                </h4>
              );
            case 5:
              return (
                <h5
                  key={idx}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mt-3 mb-1"
                >
                  {formatInline(content, sources)}
                </h5>
              );
            case 6:
            default:
              return (
                <h6
                  key={idx}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-2.5 mb-1"
                >
                  {formatInline(content, sources)}
                </h6>
              );
          }
        }

        // 2. Responsive GFM Table
        if (block.type === 'table' && block.table) {
          const { headers, alignments, rows } = block.table;
          return (
            <div
              key={idx}
              className="my-4 overflow-x-auto rounded-xl border border-[#e5e7eb] dark:border-[#28334B] bg-white dark:bg-[#0f172a] shadow-xs"
            >
              <table className="w-full border-collapse text-[13px] text-left">
                <thead className="bg-[#f8f9fa] dark:bg-[#161f30] border-b border-[#e5e7eb] dark:border-[#28334B]">
                  <tr>
                    {headers.map((h, hIdx) => {
                      const align = alignments[hIdx] || 'left';
                      const alignClass =
                        align === 'center'
                          ? 'text-center'
                          : align === 'right'
                          ? 'text-right'
                          : 'text-left';
                      return (
                        <th
                          key={hIdx}
                          className={`px-4 py-3 font-semibold text-[#111827] dark:text-white select-text ${alignClass}`}
                        >
                          {formatInline(h, sources)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0eb] dark:divide-[#1f293d]">
                  {rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="even:bg-[#fafaf8] dark:even:bg-[#131b2c] hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition-colors"
                    >
                      {headers.map((_, cIdx) => {
                        const cell = row[cIdx] !== undefined ? row[cIdx] : '';
                        const align = alignments[cIdx] || 'left';
                        const alignClass =
                          align === 'center'
                            ? 'text-center'
                            : align === 'right'
                            ? 'text-right'
                            : 'text-left';
                        return (
                          <td
                            key={cIdx}
                            className={`px-4 py-2.5 text-slate-700 dark:text-slate-200 select-text leading-relaxed ${alignClass}`}
                          >
                            {formatInline(cell, sources)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // 3. Horizontal Rule
        if (block.type === 'hr') {
          return (
            <hr
              key={idx}
              className="my-5 border-t border-[#e5e7eb] dark:border-[#28334B]"
            />
          );
        }

        // 4. Alert / Callout Block
        if (block.type === 'alert') {
          const type = block.alertType || 'NOTE';
          let borderClass = 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 text-violet-900 dark:text-violet-200';
          let icon = <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />;

          if (type === 'TIP') {
            borderClass = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200';
            icon = <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
          } else if (type === 'IMPORTANT') {
            borderClass = 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200';
            icon = <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
          } else if (type === 'WARNING') {
            borderClass = 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200';
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
          } else if (type === 'CAUTION') {
            borderClass = 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200';
            icon = <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
          }

          return (
            <div
              key={idx}
              className={`my-3.5 p-3.5 rounded-xl border-l-4 ${borderClass} space-y-1`}
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                {icon}
                <span>{type}</span>
              </div>
              <div className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap pl-6">
                {formatInline(block.content || '', sources)}
              </div>
            </div>
          );
        }

        // 5. Standard Blockquote
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              className="my-3 border-l-4 border-violet-500 pl-4 py-1.5 text-slate-700 dark:text-slate-300 bg-violet-50/50 dark:bg-violet-950/20 rounded-r-xl italic text-[13px] leading-relaxed"
            >
              {formatInline(block.content || '', sources)}
            </blockquote>
          );
        }

        // 6. Ordered or Unordered Lists
        if (block.type === 'list' && block.items) {
          return (
            <div key={idx} className="space-y-1.5 my-2.5">
              {block.items.map((item, itemIdx) => {
                const indentPadding = item.indent > 0 ? `${Math.min(item.indent * 12, 48)}px` : '0px';

                // Task list item with checkbox
                if (item.isTask) {
                  return (
                    <div
                      key={itemIdx}
                      style={{ paddingLeft: indentPadding }}
                      className="flex items-start gap-2 text-[13.5px] text-[#1f2937] dark:text-slate-200 leading-relaxed"
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className={item.checked ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                        {formatInline(item.text, sources)}
                      </div>
                    </div>
                  );
                }

                // Ordered list item with number badge
                if (item.num) {
                  return (
                    <div
                      key={itemIdx}
                      style={{ paddingLeft: indentPadding }}
                      className="flex items-start gap-2 text-[13.5px] text-[#1f2937] dark:text-slate-200 leading-relaxed"
                    >
                      <span className="font-mono font-bold text-violet-600 dark:text-violet-400 text-xs shrink-0 mt-0.5 min-w-[18px]">
                        {item.num}.
                      </span>
                      <div>{formatInline(item.text, sources)}</div>
                    </div>
                  );
                }

                // Standard unordered bullet item
                return (
                  <div
                    key={itemIdx}
                    style={{ paddingLeft: indentPadding }}
                    className="flex items-start gap-2 text-[13.5px] text-[#1f2937] dark:text-slate-200 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                    <div>{formatInline(item.text, sources)}</div>
                  </div>
                );
              })}
            </div>
          );
        }

        // 7. Standard Paragraph
        return (
          <p
            key={idx}
            className="text-[13.5px] text-[#1f2937] dark:text-slate-200 leading-relaxed select-text"
          >
            {formatInline(block.content || '', sources)}
          </p>
        );
      })}
    </div>
  );
};

// Parses markdown prose into semantic, structured blocks
function parseBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = text.split('\n');
  let i = 0;

  function isTableDelimiter(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed.includes('|')) return false;
    const parts = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|');
    return parts.length >= 1 && parts.every((p) => /^:?-+:?$/.test(p.trim()));
  }

  function parseTableAlignments(delimiterLine: string): ('left' | 'center' | 'right')[] {
    const parts = delimiterLine.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    return parts.map((p) => {
      const s = p.trim();
      const left = s.startsWith(':');
      const right = s.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      return 'left';
    });
  }

  function splitTableRow(line: string): string[] {
    const trimmed = line.trim();
    const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '');
    return inner.split('|').map((cell) => cell.trim());
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Horizontal Rule: ---, ***, or ___
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 2. Heading: # through ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 3. Table: Current line has pipes, and next line is delimiter
    if (trimmed.includes('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const headerLine = trimmed;
      const delimiterLine = lines[i + 1];
      const headers = splitTableRow(headerLine);
      const alignments = parseTableAlignments(delimiterLine);
      const rows: string[][] = [];
      i += 2;

      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }

      blocks.push({
        type: 'table',
        table: { headers, alignments, rows },
      });
      continue;
    }

    // 4. Blockquote or Alert (> ...)
    if (/^>\s*/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (
        i < lines.length &&
        (/^>\s*/.test(lines[i].trim()) || (quoteLines.length > 0 && lines[i].trim() === ''))
      ) {
        if (lines[i].trim() === '') {
          quoteLines.push('');
        } else {
          quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        }
        i++;
      }

      const firstLine = quoteLines[0] || '';
      const alertMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      if (alertMatch) {
        const alertType = alertMatch[1].toUpperCase();
        const alertContent = [
          firstLine.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, ''),
          ...quoteLines.slice(1),
        ]
          .join('\n')
          .trim();
        blocks.push({
          type: 'alert',
          alertType,
          content: alertContent,
        });
      } else {
        blocks.push({
          type: 'blockquote',
          content: quoteLines.join('\n').trim(),
        });
      }
      continue;
    }

    // 5. List items (ordered or unordered, task lists)
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const items: { text: string; indent: number; isTask?: boolean; checked?: boolean; num?: string }[] = [];
      while (i < lines.length) {
        const itemLine = lines[i];
        const match = itemLine.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (!match) break;
        const indent = match[1].length;
        const marker = match[2];
        let textContent = match[3];
        const isOrdered = /^\d+\./.test(marker);
        let isTask = false;
        let checked = false;

        const taskMatch = textContent.match(/^\[([ xX])\]\s+(.*)$/);
        if (taskMatch) {
          isTask = true;
          checked = taskMatch[1].toLowerCase() === 'x';
          textContent = taskMatch[2];
        }

        items.push({
          text: textContent,
          indent,
          isTask,
          checked,
          num: isOrdered ? marker.replace('.', '') : undefined,
        });
        i++;
      }

      blocks.push({
        type: 'list',
        items,
      });
      continue;
    }

    // 6. Regular Paragraph (accumulate until next block boundary)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i];
      const curTrimmed = cur.trim();
      if (!curTrimmed) break;
      if (/^(?:---|\*\*\*|___)\s*$/.test(curTrimmed)) break;
      if (/^#{1,6}\s+/.test(curTrimmed)) break;
      if (curTrimmed.includes('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) break;
      if (/^>\s*/.test(curTrimmed)) break;
      if (/^\s*([-*]|\d+\.)\s+/.test(cur)) break;

      paraLines.push(curTrimmed);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: paraLines.join(' '),
      });
    }
  }

  return blocks;
}

// Formats inline markdown elements (bold, italic, code, links, citations, strikethrough)
function formatInline(text: string, sources?: WebSourceItem[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*.*?\*\*\*|___.*?___|\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|~~.*?~~|`.*?`|\[\^(\d+)\]|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Bold-Italic ***text*** or ___text___
    if ((token.startsWith('***') && token.endsWith('***')) || (token.startsWith('___') && token.endsWith('___'))) {
      parts.push(
        <strong key={match.index} className="font-bold italic text-[#111827] dark:text-white">
          {token.slice(3, -3)}
        </strong>
      );
    }
    // Bold **text** or __text__
    else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      parts.push(
        <strong key={match.index} className="font-bold text-[#111827] dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Strikethrough ~~text~~
    else if (token.startsWith('~~') && token.endsWith('~~')) {
      parts.push(
        <span key={match.index} className="line-through text-slate-400 dark:text-slate-500">
          {token.slice(2, -2)}
        </span>
      );
    }
    // Italic *text* or _text_
    else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
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
