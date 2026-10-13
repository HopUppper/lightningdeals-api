import React, { useState } from 'react';
import { Copy, Check, Download, FileCode } from 'lucide-react';

interface MarkdownBlockProps {
  content: string;
}

export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({ content }) => {
  if (!content) return null;

  // Split by code blocks ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[13px] text-slate-800 font-normal">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const firstLineBreak = part.indexOf('\n');
          const lang = part.slice(3, firstLineBreak).trim() || 'text';
          const code = part.slice(firstLineBreak + 1, -3);

          return <CodeBlock key={index} language={lang} code={code} />;
        }

        return <TextBlock key={index} text={part} />;
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
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

  const lines = code.split('\n');

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-[#2d2948] bg-[#141224] text-slate-200 shadow-md">
      {/* Code Header Bar */}
      <div className="px-4 py-2 bg-[#1c1932] border-b border-[#2d2948] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-violet-300">
            {language}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">({lines.length} lines)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 px-2 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            title="Download code file"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 px-2.5 rounded-lg text-[11px] font-semibold bg-violet-600/30 text-violet-200 hover:bg-violet-600/50 hover:text-white border border-violet-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Content with Line Numbers and Diff Highlighting */}
      <div className="p-3.5 font-mono text-xs overflow-x-auto leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const isDiffAdd = line.startsWith('+') && !line.startsWith('+++');
              const isDiffRemove = line.startsWith('-') && !line.startsWith('---');

              return (
                <tr
                  key={i}
                  className={`hover:bg-white/5 transition-colors ${
                    isDiffAdd
                      ? 'bg-emerald-950/40 text-emerald-300'
                      : isDiffRemove
                      ? 'bg-rose-950/40 text-rose-300 line-through opacity-80'
                      : ''
                  }`}
                >
                  <td className="w-8 pr-3 text-right select-none text-[11px] text-slate-600 font-mono">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre font-mono pl-1">
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

const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  if (!text.trim()) return null;

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Header check
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={pIdx} className="text-sm font-bold text-slate-900 mt-4 mb-1">
              {formatInline(trimmed.replace('### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={pIdx} className="text-base font-extrabold text-slate-900 mt-5 mb-1.5 pb-1 border-b border-slate-200">
              {formatInline(trimmed.replace('## ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={pIdx} className="text-lg font-black text-slate-900 mt-6 mb-2">
              {formatInline(trimmed.replace('# ', ''))}
            </h2>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={pIdx}
              className="my-2 border-l-3 border-violet-500 pl-3.5 py-1 text-slate-700 bg-violet-50/50 rounded-r-xl italic text-[12.5px]"
            >
              {formatInline(trimmed.replace(/^>\s*/, ''))}
            </blockquote>
          );
        }

        // Bullet list check
        const lines = trimmed.split('\n');
        if (lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
          return (
            <ul key={pIdx} className="my-2 list-disc list-inside space-y-1 pl-1 text-[13px] text-slate-800">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="leading-relaxed">
                  {formatInline(l.trim().replace(/^[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list check
        if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
          return (
            <ol key={pIdx} className="my-2 list-decimal list-inside space-y-1 pl-1 text-[13px] text-slate-800">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="leading-relaxed">
                  {formatInline(l.trim().replace(/^\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // Regular paragraph with line breaks
        return (
          <p key={pIdx} className="leading-relaxed whitespace-pre-line text-slate-800">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </>
  );
};

function formatInline(text: string): React.ReactNode {
  // Replace inline code `code`
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const code = part.slice(1, -1);
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-violet-100/70 text-violet-900 font-mono text-[11.5px] border border-violet-200 font-semibold"
        >
          {code}
        </code>
      );
    }

    // Bold formatting **bold**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, bIdx) => {
      if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
        return (
          <strong key={`${i}-${bIdx}`} className="font-bold text-slate-900">
            {bp.slice(2, -2)}
          </strong>
        );
      }
      return bp;
    });
  });
}

function getExtension(lang: string): string {
  const map: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
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
  return map[lang.toLowerCase()] || 'txt';
}
