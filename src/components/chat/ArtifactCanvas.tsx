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
  Monitor,
  Tablet,
  Smartphone,
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
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
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

  const getExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'html': return 'html';
      case 'svg': return 'svg';
      case 'typescript': case 'ts': return 'ts';
      case 'tsx': return 'tsx';
      case 'javascript': case 'js': return 'js';
      case 'jsx': return 'jsx';
      case 'python': case 'py': return 'py';
      case 'json': return 'json';
      case 'markdown': case 'md': return 'md';
      case 'css': return 'css';
      default: return 'txt';
    }
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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 p-6 min-h-screen">
  ${effectiveCode}
</body>
</html>`;
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#0B1020] text-slate-100 font-sans border-l border-[#28334B] transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'w-full'
      }`}
    >
      {/* Canvas Top Bar */}
      <div className="h-13 px-4 bg-[#0E1425] border-b border-[#28334B] flex items-center justify-between shrink-0 select-none">
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

        {/* Center: Device Viewport Controls (Image 4 style) */}
        {isPreviewable && currentTab === 'preview' && (
          <div className="hidden sm:flex items-center gap-1 bg-[#141C30] p-0.5 rounded-lg border border-[#28334B]">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                viewportMode === 'desktop'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desktop Viewport (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('tablet')}
              className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                viewportMode === 'tablet'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tablet Viewport (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                viewportMode === 'mobile'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile Viewport (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1.5">
              {viewportMode === 'desktop' ? '100%' : viewportMode === 'tablet' ? '768px' : '375px'}
            </span>
          </div>
        )}

        {/* Tab Controls & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPreviewable && (
            <div className="bg-[#141C30] p-0.5 rounded-lg border border-[#28334B] flex items-center mr-1">
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
            className="p-1.5 px-2 rounded-lg bg-[#19233A] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#28334B] text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/60">
            <div
              className={`h-full flex flex-col transition-all duration-200 ${
                viewportMode === 'mobile'
                  ? 'w-[375px] max-w-full border-x border-[#28334B] shadow-2xl'
                  : viewportMode === 'tablet'
                  ? 'w-[768px] max-w-full border-x border-[#28334B] shadow-2xl'
                  : 'w-full'
              }`}
            >
              <iframe
                key={previewKey}
                title="Interactive Live Canvas Preview"
                srcDoc={generatePreviewDoc()}
                sandbox="allow-scripts allow-modals"
                className="w-full flex-1 border-0 bg-slate-950"
              />
              <div className="px-3 py-1.5 bg-[#0E1425] border-t border-[#28334B]/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Sandboxed Runtime</span>
                </span>
                <span>{lines.length} lines</span>
              </div>
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
            <div className="px-3 py-1.5 bg-[#0E1425] border-t border-[#28334B]/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
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
                          ? 'bg-rose-950/30 text-rose-300'
                          : ''
                      }`}
                    >
                      <td className="w-10 pr-3 py-0.5 text-right text-slate-600 select-none text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-0.5 whitespace-pre font-mono text-slate-200">
                        {line || ' '}
                      </td>
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
