import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Eye,
  Code,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Edit3,
  Play,
} from 'lucide-react';

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  code: string;
  type?: 'code' | 'html' | 'svg' | 'react' | 'markdown';
}

interface ArtifactCanvasProps {
  artifact: ArtifactData | null;
  onClose: () => void;
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(artifact?.code || '');

  React.useEffect(() => {
    if (artifact?.code) {
      setEditedCode(artifact.code);
    }
  }, [artifact?.code]);

  if (!artifact) return null;

  const effectiveCode = isEditing ? editedCode : artifact.code;

  const isPreviewable =
    artifact.language === 'html' ||
    artifact.language === 'svg' ||
    artifact.language === 'xml' ||
    artifact.type === 'html' ||
    artifact.type === 'svg';

  // Automatically fall back to 'code' if not previewable
  const currentTab = isPreviewable ? activeTab : 'code';

  const handleCopy = () => {
    navigator.clipboard.writeText(effectiveCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = getExtension(artifact.language);
    const blob = new Blob([effectiveCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase() || 'artifact'}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyAndPreview = () => {
    setIsEditing(false);
    setActiveTab('preview');
    setPreviewKey((k) => k + 1);
  };

  const lines = effectiveCode.split('\n');

  // Generate safe sandboxed HTML for live preview
  const generatePreviewDoc = () => {
    if (artifact.language === 'svg' || artifact.type === 'svg') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f1422; color: #fff; font-family: sans-serif; }
    svg { max-width: 100%; height: auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); }
  </style>
</head>
<body>
  ${effectiveCode}
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 p-6 min-h-screen">
  ${effectiveCode}
</body>
</html>`;
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#0b0f19] text-slate-100 font-sans border-l border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'w-full'
      }`}
    >
      {/* Canvas Top Bar */}
      <div className="h-13 px-4 bg-[#0e1424] border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
        {/* Left: Artifact metadata */}
        <div className="flex items-center gap-2.5 min-w-0 mr-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white truncate">{artifact.title}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase shrink-0">
                {artifact.language}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPreviewable && (
            <div className="bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 flex items-center mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === 'preview'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === 'code'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Code</span>
              </button>
            </div>
          )}

          {/* Edit / View Code toggle button */}
          {currentTab === 'code' && (
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleApplyAndPreview();
                } else {
                  setIsEditing(true);
                }
              }}
              className={`p-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
              title={isEditing ? 'Save and preview changes' : 'Edit code in canvas'}
            >
              {isEditing ? <Play className="w-3 h-3 fill-current" /> : <Edit3 className="w-3 h-3" />}
              <span>{isEditing ? 'Apply & Run' : 'Edit'}</span>
            </button>
          )}

          {isPreviewable && currentTab === 'preview' && (
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Refresh Live Preview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Main Body */}
      <div className="flex-1 min-h-0 overflow-hidden relative bg-[#090d16]">
        {currentTab === 'preview' && isPreviewable ? (
          <div className="w-full h-full flex flex-col">
            <iframe
              key={previewKey}
              title="Interactive Live Canvas Preview"
              srcDoc={generatePreviewDoc()}
              sandbox="allow-scripts allow-modals"
              className="w-full flex-1 border-0 bg-slate-950"
            />
            <div className="px-3 py-1.5 bg-[#0e1424] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sandboxed Runtime</span>
              </span>
              <span>{lines.length} lines</span>
            </div>
          </div>
        ) : isEditing ? (
          /* Live Code Editor */
          <div className="w-full h-full flex flex-col bg-[#090d16]">
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              spellCheck={false}
              className="w-full flex-1 font-mono text-xs leading-relaxed p-4 bg-transparent text-slate-100 focus:outline-none resize-none select-text"
            />
            <div className="px-3 py-1.5 bg-[#0e1424] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-amber-400">Editing Mode Active</span>
              <button
                type="button"
                onClick={handleApplyAndPreview}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
              >
                Apply & Preview
              </button>
            </div>
          </div>
        ) : (
          /* High-Contrast Code Line View */
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs leading-relaxed select-text">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => {
                  const isDiffAdd = line.startsWith('+') && !line.startsWith('+++');
                  const isDiffRemove = line.startsWith('-') && !line.startsWith('---');

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isDiffAdd
                          ? 'bg-emerald-950/30 text-emerald-300'
                          : isDiffRemove
                          ? 'bg-rose-950/30 text-rose-300 line-through opacity-75'
                          : 'text-slate-300'
                      }`}
                    >
                      <td className="w-10 pr-3 text-right select-none text-slate-600 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre pl-2 font-mono">{line || '\n'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function getExtension(lang: string): string {
  const map: Record<string, string> = {
    typescript: 'tsx',
    javascript: 'jsx',
    html: 'html',
    svg: 'svg',
    python: 'py',
    sql: 'sql',
    json: 'json',
    css: 'css',
    markdown: 'md',
    rust: 'rs',
    go: 'go',
    bash: 'sh',
  };
  return map[(lang || '').toLowerCase()] || 'txt';
}
