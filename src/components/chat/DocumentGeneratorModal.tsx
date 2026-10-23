import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  Layers,
  ArrowRight,
  Copy,
} from 'lucide-react';
import { userFetch } from '../../utils/api';

export interface DocumentGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  isDarkTheme?: boolean;
  onInsertToChat?: (text: string) => void;
  initialContent?: string;
}

type SupportedFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'csv' | 'md' | 'txt' | 'html';

interface FormatMeta {
  id: SupportedFormat;
  name: string;
  ext: string;
  mime: string;
  icon: React.ElementType;
  badge: string;
  color: string;
  description: string;
}

const SUPPORTED_FORMATS: FormatMeta[] = [
  {
    id: 'docx',
    name: 'Microsoft Word',
    ext: '.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: FileText,
    badge: 'OpenXML Valid',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
    description: 'Executive reports, architecture proposals, and clean typed documents with tables and headers.',
  },
  {
    id: 'xlsx',
    name: 'Microsoft Excel',
    ext: '.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: FileSpreadsheet,
    badge: 'OpenXML Sheet',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    description: 'Multi-column financial tables, token metrics, budget sheets, and tabular datasets.',
  },
  {
    id: 'pptx',
    name: 'PowerPoint Slides',
    ext: '.pptx',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    icon: Layers,
    badge: 'OpenXML Deck',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40',
    description: 'Structured presentation slides, executive briefings, and bullet-point decks.',
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    ext: '.pdf',
    mime: 'application/pdf',
    icon: FileText,
    badge: 'PDF 1.4 Vector',
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    description: 'Standard vector PDF with crisp headings, metadata headers, and pagination.',
  },
  {
    id: 'csv',
    name: 'CSV Spreadsheet',
    ext: '.csv',
    mime: 'text/csv; charset=utf-8',
    icon: Table,
    badge: 'RFC 4180 / UTF-8',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    description: 'Universal delimited values with UTF-8 BOM, compatible with all spreadsheet tools.',
  },
  {
    id: 'html',
    name: 'Web Document',
    ext: '.html',
    mime: 'text/html; charset=utf-8',
    icon: FileText,
    badge: 'HTML5 Standalone',
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40',
    description: 'Self-contained styled HTML document with typography and clean CSS tables.',
  },
  {
    id: 'md',
    name: 'Markdown Report',
    ext: '.md',
    mime: 'text/markdown; charset=utf-8',
    icon: Layers,
    badge: 'GitHub GFM',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
    description: 'Clean formatted GitHub Flavored Markdown with headers, bullet points, and code fences.',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    ext: '.txt',
    mime: 'text/plain; charset=utf-8',
    icon: FileText,
    badge: 'UTF-8 Text',
    color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    description: 'Lightweight plain text export suitable for terminals, notes, and log records.',
  },
];

const PREBUILT_TEMPLATES = [
  {
    title: 'Executive Technical Brief',
    format: 'docx' as SupportedFormat,
    content: `# Executive Technical Architecture Brief

## Overview
This document outlines the high-level system topology, performance benchmarks, and deployment strategy for LightningAPI Studio 2.0.

## Core Directives
- **Sub-100ms Streaming:** Direct SSE delivery pipeline with unbuffered token throughput.
- **Provider Redundancy:** Multi-vendor fallback with automatic model abstraction.
- **Data Isolation:** Strict multi-tenant isolation enforcing customer-scoped database queries.

## Performance Invariants
1. Zero unencrypted master secrets stored at rest.
2. Complete audit logging with input/output token attribution.
3. Bounded memory retrieval to guarantee deterministic context limits.`,
  },
  {
    title: 'Token Economics & Model Pricing',
    format: 'xlsx' as SupportedFormat,
    content: `Model Name, Upstream Route, Token Multiplier, Context Window, Output Tokens, Latency Target
Claude Sonnet 5.5, Anthropic Direct, 1.0x, 1000000, 8192, < 400ms
Claude Opus 5.5, Anthropic Direct, 2.0x, 1000000, 8192, < 750ms
Claude 3.7 Sonnet, Anthropic Extended, 1.25x, 200000, 8192, < 500ms
Claude Haiku 4.5, Anthropic Fast, 0.35x, 200000, 4096, < 250ms`,
  },
  {
    title: 'Security & Threat Audit',
    format: 'pdf' as SupportedFormat,
    content: `# Security Verification & Threat Modeling

## Scope
Verification of token authentication, secret isolation, and CORS policy enforcement across all Studio endpoints.

## Findings Summary
- All user requests validated with bearer JWT tokens.
- Automatic contextual memory enforces strict regex filtering for API keys, passwords, and PII.
- Upstream vendor credentials are never returned in client response payloads.`,
  },
];

export const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({
  open,
  onClose,
  isDarkTheme = false,
  onInsertToChat,
  initialContent = '',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<SupportedFormat>('docx');
  const [title, setTitle] = useState('Executive Architecture Proposal');
  const [content, setContent] = useState(initialContent || PREBUILT_TEMPLATES[0].content);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleApplyTemplate = (tpl: typeof PREBUILT_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setSelectedFormat(tpl.format);
    setContent(tpl.content);
    setErrorMessage(null);
  };

  const handleGenerateAndDownload = async () => {
    if (!title.trim()) {
      setErrorMessage('Please provide a document title.');
      return;
    }
    setGenerating(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    try {
      // Direct binary download from server
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/user/studio/documents/generate?download=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          format: selectedFormat,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to generate document (status: ${response.status})`);
      }

      // Convert response stream to Blob and trigger direct browser download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      let filename = `${title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'document'}.${selectedFormat}`;
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

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error('[DOCUMENT GENERATOR CLIENT ERROR]', err);
      setErrorMessage(err.message || 'Error creating document.');
    } finally {
      setGenerating(false);
    }
  };

  const handleInsertToChat = () => {
    if (onInsertToChat) {
      const promptSnippet = `Please generate an executive document formatted as follows:\n\nTitle: ${title}\nFormat: ${selectedFormat.toUpperCase()}\n\nContent:\n${content}`;
      onInsertToChat(promptSnippet);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-3xl max-h-[92vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          isDarkTheme
            ? 'bg-[#141C30] border-[#28334B] text-[#F3F5FC]'
            : 'bg-white border-[#E9E4DD] text-[#171717]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/60' : 'border-[#E9E4DD] bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">Studio Document Generator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  OpenXML & PDF
                </span>
              </div>
              <p
                className={`text-xs ${
                  isDarkTheme ? 'text-[#A5B0C7]' : 'text-[#625F5A]'
                }`}
              >
                Direct pure-engine file generation for Word, Excel, PDF, CSV, and Markdown.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isDarkTheme
                ? 'border-[#28334B] hover:bg-[#19233A] text-[#A5B0C7]'
                : 'border-[#E9E4DD] hover:bg-[#F5F2EE] text-[#625F5A]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Format Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider block opacity-75">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {SUPPORTED_FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 shadow-xs'
                        : isDarkTheme
                        ? 'border-[#28334B] bg-[#0E1425]/40 hover:border-violet-500/40'
                        : 'border-[#E9E4DD] bg-[#FAF8F5] hover:border-violet-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-1 rounded-lg border text-[10px] font-bold ${fmt.color}`}>
                        {fmt.ext}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs">{fmt.name}</p>
                      <p className={`text-[10px] line-clamp-1 opacity-70`}>{fmt.badge}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Prebuilt Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider block opacity-75">
                2. Quick Templates
              </label>
              <span className="text-[11px] opacity-60">Click to autofill document structure</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PREBUILT_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    isDarkTheme
                      ? 'border-[#28334B] bg-[#19233A] hover:border-violet-500/50 text-[#F3F5FC]'
                      : 'border-[#E9E4DD] bg-white hover:border-violet-500/50 text-[#171717]'
                  }`}
                >
                  <span className="text-violet-500 font-bold mr-1.5">[{tpl.format.toUpperCase()}]</span>
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Document Title & Content Input */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block opacity-75 mb-1.5">
                3. Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quarterly System Architecture Report"
                className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium ${
                  isDarkTheme
                    ? 'bg-[#0E1425] border-[#28334B] text-[#F3F5FC]'
                    : 'bg-[#FAF8F5] border-[#E9E4DD] text-[#171717]'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block opacity-75">
                  4. Document Content (Markdown, Tables, or CSV)
                </label>
                <span className="text-[11px] font-mono opacity-60">{content.length} characters</span>
              </div>
              <textarea
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter markdown, headings, bullet points, or comma-separated rows for spreadsheets..."
                className={`w-full p-4 rounded-2xl text-xs sm:text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed resize-y ${
                  isDarkTheme
                    ? 'bg-[#0E1425] border-[#28334B] text-[#F3F5FC]'
                    : 'bg-[#FAF8F5] border-[#E9E4DD] text-[#171717]'
                }`}
              />
            </div>
          </div>

          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Document successfully generated and downloaded to your device!</span>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/60' : 'border-[#E9E4DD] bg-[#FAF8F5]'
          }`}
        >
          {onInsertToChat ? (
            <button
              type="button"
              onClick={handleInsertToChat}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDarkTheme
                  ? 'border-[#28334B] bg-[#19233A] hover:bg-[#222e4c] text-[#F3F5FC]'
                  : 'border-[#E9E4DD] bg-white hover:bg-[#F5F2EE] text-[#171717]'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Insert to Chat Prompt</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                isDarkTheme
                  ? 'border-[#28334B] text-[#A5B0C7] hover:bg-[#19233A]'
                  : 'border-[#E9E4DD] text-[#625F5A] hover:bg-[#F5F2EE]'
              }`}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleGenerateAndDownload}
              disabled={generating}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/20 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating File...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
