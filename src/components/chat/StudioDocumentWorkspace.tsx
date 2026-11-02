import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  ChevronRight,
  ListTree,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Loader2,
  RotateCcw,
  Edit3,
  AlignLeft,
  BookOpen,
} from 'lucide-react';
import { MarkdownBlock } from './MarkdownBlock';

export type DocumentExportFormat = 'docx' | 'pdf' | 'xlsx' | 'md' | 'html' | 'txt';

export interface StudioDocumentWorkspaceProps {
  content: string;
  title?: string;
  isDarkTheme?: boolean;
  onUpdateContent?: (newContent: string) => void;
  onTriggerAiAction: (actionPrompt: string) => void;
  onClose?: () => void;
  isGenerating?: boolean;
}

export const StudioDocumentWorkspace: React.FC<StudioDocumentWorkspaceProps> = ({
  content,
  title = 'Untitled Document',
  isDarkTheme = false,
  onUpdateContent,
  onTriggerAiAction,
  onClose,
  isGenerating = false,
}) => {
  const [docTitle, setDocTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<DocumentExportFormat | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Compute document statistics
  const stats = useMemo(() => {
    if (!content) return { words: 0, characters: 0, readingTimeMin: 1 };
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const characters = content.length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 220));
    return { words, characters, readingTimeMin };
  }, [content]);

  // Extract Table of Contents from headings
  const tocItems = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const items: { id: string; text: string; level: number }[] = [];
    let headingIndex = 0;

    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_`]/g, '');
        const id = `heading-${headingIndex++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        items.push({ id, text, level });
      }
    }
    return items;
  }, [content]);

  // Handle Export download via backend binary generator
  const handleExport = async (format: DocumentExportFormat) => {
    setExportingFormat(format);
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/user/studio/documents/generate?download=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: docTitle.trim() || 'Document',
          format,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      let filename = `${docTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'document'}.${format}`;
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('[DOCUMENT EXPORT ERROR]', err);
      // Fallback client-side download for text/markdown
      if (format === 'md' || format === 'txt') {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${docTitle.replace(/\s+/g, '_') || 'document'}.${format}`;
        link.click();
      } else {
        alert('Could not export document binary. Please check network connection.');
      }
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AI_REVISION_ACTIONS = [
    { id: 'continue', label: 'Continue Writing', prompt: 'Please continue writing this document from where it stopped. Ensure full detail, structured headings, and comprehensive completion.' },
    { id: 'improve', label: 'Improve Quality', prompt: 'Please refine and elevate the writing quality of this document. Enhance technical rigor, clarity, and formatting.' },
    { id: 'expand', label: 'Expand Sections', prompt: 'Please expand each section of this document with more detailed specifications, examples, tables, and implementation guidelines.' },
    { id: 'summarise', label: 'Executive Summary', prompt: 'Please generate a concise 1-page executive summary and key takeaways for this document.' },
    { id: 'formal', label: 'Formal Tone', prompt: 'Please rewrite this document in a formal enterprise architecture tone suitable for executive sign-off.' },
    { id: 'tables', label: 'Format Tables', prompt: 'Please reformat all lists, metrics, and comparisons in this document into clean, responsive Markdown tables.' },
    { id: 'explain', label: 'Explain Details', prompt: 'Please provide a technical breakdown explaining the rationale and architecture behind the decisions in this document.' },
  ];

  return (
    <div
      className={`h-full min-h-0 flex flex-col overflow-hidden transition-all duration-200 select-text ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-[#0A0E1A]' : 'relative w-full'
      } ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}
    >
      {/* Top Document Workspace Toolbar */}
      <div
        className={`px-4 py-2.5 border-b shrink-0 flex items-center justify-between gap-3 text-xs backdrop-blur-md sticky top-0 z-20 ${
          isDarkTheme ? 'bg-[#0E1526]/90 border-[#1E293B]' : 'bg-[#FAFAF9]/90 border-[#E7E5E4]'
        }`}
      >
        {/* Left: Document Title & Metadata */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setIsEditingTitle(false);
                }}
                className={`text-xs font-bold px-2 py-0.5 rounded border border-violet-500 focus:outline-none w-full max-w-sm ${
                  isDarkTheme ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                }`}
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 cursor-pointer min-w-0"
                title="Click to rename document"
              >
                <h3 className="font-bold text-xs sm:text-sm truncate hover:text-violet-600 transition-colors">
                  {docTitle}
                </h3>
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 text-violet-500 shrink-0 transition-opacity" />
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>{stats.words.toLocaleString()} words</span>
              <span>·</span>
              <span>~{stats.readingTimeMin} min read</span>
              {isGenerating && (
                <>
                  <span>·</span>
                  <span className="text-violet-500 font-bold flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Generating...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (ToC toggle, Export dropdown, Copy, Maximize, Close) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Table of Contents Toggle */}
          {tocItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsTocOpen(!isTocOpen)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isTocOpen
                  ? 'bg-violet-600/10 border-violet-500/40 text-violet-600 dark:text-violet-400'
                  : isDarkTheme
                  ? 'border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Table of Contents"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ToC ({tocItems.length})</span>
            </button>
          )}

          {/* Quick Universal Export Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={exportingFormat !== null || isGenerating}
              onClick={() => handleExport('docx')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isDarkTheme
                  ? 'bg-blue-950/30 border-blue-500/30 text-blue-400 hover:bg-blue-950/60'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
              title="Download as Microsoft Word (.docx)"
            >
              {exportingFormat === 'docx' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Word</span>
            </button>

            <button
              type="button"
              disabled={exportingFormat !== null || isGenerating}
              onClick={() => handleExport('pdf')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isDarkTheme
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:bg-rose-950/60'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
              title="Download as Vector PDF (.pdf)"
            >
              {exportingFormat === 'pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              disabled={exportingFormat !== null || isGenerating}
              onClick={() => handleExport('md')}
              className={`px-2 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                isDarkTheme
                  ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Download as GitHub Flavored Markdown (.md)"
            >
              <span className="font-mono text-[10px] font-bold">.MD</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                : isDarkTheme
                ? 'border-slate-800 text-slate-400 hover:text-slate-200'
                : 'border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Copy entire document to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Maximize / Minimize Canvas */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDarkTheme
                ? 'border-slate-800 text-slate-400 hover:text-slate-200'
                : 'border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isFullscreen ? 'Restore split view' : 'Maximize document canvas'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDarkTheme
                  ? 'border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Close Document View"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contextual AI Quick-Action Bar */}
      <div
        className={`px-4 py-2 border-b shrink-0 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none ${
          isDarkTheme ? 'bg-[#0B1020]/80 border-[#1E293B]' : 'bg-[#F5F5F4]/80 border-[#E7E5E4]'
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 flex items-center gap-1 shrink-0 mr-1 select-none">
          <Sparkles className="w-3 h-3" />
          <span>AI Actions:</span>
        </span>

        {AI_REVISION_ACTIONS.map((act) => (
          <button
            key={act.id}
            type="button"
            disabled={isGenerating}
            onClick={() => {
              setSelectedAction(act.id);
              onTriggerAiAction(act.prompt);
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0 disabled:opacity-40 ${
              isDarkTheme
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-violet-500 hover:text-violet-900 shadow-2xs'
            }`}
          >
            {act.label}
          </button>
        ))}
      </div>

      {/* Main Document Body: Optional Table of Contents Sidebar + Reader Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Collapsible Table of Contents Sidebar */}
        {isTocOpen && tocItems.length > 0 && (
          <aside
            className={`w-60 sm:w-64 border-r shrink-0 overflow-y-auto p-3 text-xs space-y-1 select-none transition-all ${
              isDarkTheme ? 'bg-[#090D1A] border-[#1E293B]' : 'bg-[#FAFAF9] border-[#E7E5E4]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Table of Contents
              </span>
              <span className="text-[10px] font-mono text-slate-400">{tocItems.length} sections</span>
            </div>

            <div className="space-y-0.5">
              {tocItems.map((item, idx) => (
                <a
                  key={idx}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    // Scroll to heading line
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`block py-1 rounded-md transition-colors truncate hover:text-violet-600 dark:hover:text-violet-400 ${
                    item.level === 1
                      ? 'font-bold text-slate-800 dark:text-slate-200 pl-1 text-[11.5px]'
                      : item.level === 2
                      ? 'font-medium text-slate-600 dark:text-slate-400 pl-3 text-[11px]'
                      : 'text-slate-500 dark:text-slate-500 pl-5 text-[10.5px]'
                  }`}
                  title={item.text}
                >
                  {item.text}
                </a>
              ))}
            </div>
          </aside>
        )}

        {/* Dedicated Document Canvas (Comfortable Reading Width, Paper Aesthetic) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 md:px-12 py-8 overscroll-contain ${
            isDarkTheme ? 'bg-[#060913]' : 'bg-[#F2EFE9]'
          }`}
        >
          {/* Document Sheet Container */}
          <div
            className={`max-w-4xl mx-auto rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border transition-all ${
              isDarkTheme
                ? 'bg-[#0B1020] border-[#1A2338] text-slate-100'
                : 'bg-white border-[#E5E0D8] text-slate-900 shadow-md'
            }`}
          >
            {/* Document Header Metadata Title */}
            <div className="pb-6 mb-6 border-b border-black/10 dark:border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 font-bold">
                <span className="px-2 py-0.5 rounded bg-violet-600/10 border border-violet-500/20">
                  Document Artifact
                </span>
                <span>•</span>
                <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {docTitle}
              </h1>
            </div>

            {/* Markdown Document Content with Full CommonMark/GFM Rendering */}
            <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-sm sm:text-base">
              {content ? (
                <MarkdownBlock content={content} />
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <FileText className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm">No document generated yet.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Type a prompt in the left chat instructions pane, or choose an AI Action above to draft an executive document.
                  </p>
                </div>
              )}
            </div>

            {/* Document Footer Sign-off */}
            {content && (
              <div className="mt-12 pt-6 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono gap-2">
                <span>LightningAPI Studio • Verified Engineering Artifact</span>
                <span>{stats.words.toLocaleString()} words • UTF-8 Valid</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
