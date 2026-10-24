import React from 'react';
import {
  Sparkles,
  Bot,
  Paperclip,
  Download,
  Eye,
  CheckCircle2,
  Terminal,
  HelpCircle,
  ExternalLink,
  X,
  Code,
  ShieldCheck,
} from 'lucide-react';

export interface StudioOnboardingGuideProps {
  open?: boolean;
  onClose: () => void;
  isDarkTheme?: boolean;
  isInline?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

export const StudioOnboardingGuide: React.FC<StudioOnboardingGuideProps> = ({
  open = true,
  onClose,
  isDarkTheme = false,
  isInline = false,
  onSelectPrompt,
}) => {
  if (!open) return null;

  const samplePrompts = [
    {
      title: 'Responsive UI Component',
      prompt: 'Build a modern responsive pricing card component in HTML and Tailwind CSS with monthly and annual billing toggles.',
      badge: 'HTML / Preview',
    },
    {
      title: 'Full-Stack API Client',
      prompt: 'Write a TypeScript client library for an Anthropic-compatible chat completion API with streaming SSE support and exponential backoff retry.',
      badge: 'TypeScript / Code',
    },
    {
      title: 'Algorithm & Analysis',
      prompt: 'Explain the difference between a rolling token window and a fixed daily quota, and write a Python script demonstrating rolling window calculation.',
      badge: 'Python / Logic',
    },
  ];

  const content = (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-violet-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#111827] dark:text-white">
              Getting Started with AI Chat Studio
            </h3>
            <p className="text-[11px] text-[#6b7280] dark:text-slate-400">
              High-speed frontier intelligence with instant code downloads and sandboxed previews
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 5-Step Workflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#151D2F] border border-[#e5e7eb] dark:border-[#28334B] space-y-1">
          <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-[11px]">
            1
          </div>
          <p className="font-semibold text-[11.5px] text-[#111827] dark:text-slate-100">Choose Model</p>
          <p className="text-[10.5px] text-[#6b7280] dark:text-slate-400 leading-normal">
            Switch between Claude Sonnet 5.5, Claude Opus 5.5, or Claude Opus 5 anytime.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#151D2F] border border-[#e5e7eb] dark:border-[#28334B] space-y-1">
          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
            2
          </div>
          <p className="font-semibold text-[11.5px] text-[#111827] dark:text-slate-100">Type Prompt</p>
          <p className="text-[10.5px] text-[#6b7280] dark:text-slate-400 leading-normal">
            Ask for code, multi-file projects, bug fixes, or architecture design.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#151D2F] border border-[#e5e7eb] dark:border-[#28334B] space-y-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px]">
            3
          </div>
          <p className="font-semibold text-[11.5px] text-[#111827] dark:text-slate-100">Attach Files</p>
          <p className="text-[10.5px] text-[#6b7280] dark:text-slate-400 leading-normal">
            Upload screenshots, PDFs, documents, or code for multimodal inspection.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#151D2F] border border-[#e5e7eb] dark:border-[#28334B] space-y-1">
          <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[11px]">
            4
          </div>
          <p className="font-semibold text-[11.5px] text-[#111827] dark:text-slate-100">Download Code</p>
          <p className="text-[10.5px] text-[#6b7280] dark:text-slate-400 leading-normal">
            Download individual files or grab all files as a single safe ZIP archive.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#151D2F] border border-[#e5e7eb] dark:border-[#28334B] space-y-1">
          <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-[11px]">
            5
          </div>
          <p className="font-semibold text-[11.5px] text-[#111827] dark:text-slate-100">Sandboxed Preview</p>
          <p className="text-[10.5px] text-[#6b7280] dark:text-slate-400 leading-normal">
            Preview HTML & SVG in an isolated sandbox with zero access to credentials.
          </p>
        </div>
      </div>

      {/* Honest Feature Boundaries Notice */}
      <div className="p-3 rounded-xl bg-[#f4f4f0] dark:bg-[#141C30] border border-[#e5e7eb] dark:border-[#28334B] text-[11px] text-[#4b5563] dark:text-slate-300 space-y-1">
        <p className="font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span>Capability & Feature Boundaries</span>
        </p>
        <p className="leading-relaxed">
          • <strong>Inside Chat Studio:</strong> Real-time streaming, web research with citations, live HTML/SVG sandboxed preview, and multi-file ZIP downloads.
        </p>
        <p className="leading-relaxed">
          • <strong>In Your Terminal / IDE:</strong> To run local shell commands, execute Python/Node scripts, or edit git repositories on disk, use our CLI integration (<code>npx lightningdeals</code>) with Claude Code CLI, Cursor, or Windsurf.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-semibold text-[#6b7280] dark:text-slate-400 uppercase tracking-wider">
          Try a sample prompt to start:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (onSelectPrompt) onSelectPrompt(item.prompt);
                onClose();
              }}
              className="text-left p-2.5 rounded-xl bg-white dark:bg-[#151D2F] border border-[#e5e7eb] dark:border-[#28334B] hover:border-violet-500 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[11.5px] text-[#111827] dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                  {item.title}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {item.badge}
                </span>
              </div>
              <p className="text-[10.5px] text-[#6b7280] dark:text-slate-400 line-clamp-2">
                {item.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Dismiss */}
      <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb] dark:border-[#28334B]">
        <span className="text-[10px] text-[#9ca3af]">
          You can reopen this guide anytime by clicking <strong>?</strong> in the top header.
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1f2937] text-white font-semibold text-xs cursor-pointer transition-colors"
        >
          Got it, let's start
        </button>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="w-full max-w-4xl mx-auto my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e5e7eb] dark:border-[#28334B] shadow-xs animate-fadeIn">
        {content}
      </div>
    );
  }

  // Slide-over / Modal for Help trigger
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-[#e5e7eb] dark:border-[#28334B] rounded-2xl shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
