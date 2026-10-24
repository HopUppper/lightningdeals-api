/**
 * src/pages/dashboard/UserWebsiteBuilder.tsx
 * ============================================================================
 * Production AI Website & Application Builder for LightningAPI Studio
 * 
 * Features:
 * - Real-time prompt-to-website generation with live progress stages
 * - Interactive sandboxed live preview with Desktop, Tablet, Mobile viewports
 * - Conversational iterative editing with automatic version history & rollback
 * - In-browser multi-file code editor with live rebuild synchronization
 * - One-click validated ZIP project export
 * - Starter template gallery (Landing Pages, Portfolios, Restaurants, Dashboards, Stores, Events)
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Download,
  Code,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCode,
  FolderPlus,
  Trash2,
  Save,
  Send,
  RotateCcw,
  Plus,
  Globe,
  Layers,
  Zap,
  ChevronRight,
  ChevronDown,
  X,
  History,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProjectFile {
  path: string;
  content: string;
  language?: string;
}

interface ProjectVersionSnapshot {
  version: number;
  summary: string;
  files: ProjectFile[];
  createdAt: string;
}

interface BuilderProject {
  id: string;
  title: string;
  brief: string;
  category: string;
  modelId: string;
  currentVersion: number;
  lastWorkingVersion: number;
  buildStatus: 'planning' | 'writing' | 'building' | 'ready' | 'error';
  buildProgressPercent: number;
  errorMessage?: string;
  files: ProjectFile[];
  versions: ProjectVersionSnapshot[];
  previewHtml: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateOption {
  id: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  model: string;
  buildTime: string;
  tokensEstimated: number;
  promptExample: string;
  fileCount: number;
}

export const UserWebsiteBuilder: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [activeProject, setActiveProject] = useState<BuilderProject | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('index.html');
  const [editorContent, setEditorContent] = useState<string>('');
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Build / Refine state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(1);
  const [buildProgress, setBuildProgress] = useState(0);
  const [currentWritingFile, setCurrentWritingFile] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [chatTurns, setChatTurns] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);

  // Modals
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // References
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Load initial data
  useEffect(() => {
    loadTemplates();
    loadProjects();
  }, []);

  // 2. Handle URL prompt query param
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    const urlTemplate = searchParams.get('template');
    if (urlPrompt && !isBuilding && projects.length === 0) {
      handleCreateProject(urlPrompt, urlTemplate || undefined);
      searchParams.delete('prompt');
      setSearchParams(searchParams);
    }
  }, [searchParams, projects.length]);

  // 3. Update editor when active file changes
  useEffect(() => {
    if (activeProject && activeProject.files) {
      const target = activeProject.files.find((f) => f.path === selectedFilePath) || activeProject.files[0];
      if (target) {
        setSelectedFilePath(target.path);
        setEditorContent(target.content);
        setHasUnsavedEdits(false);
      }
    }
  }, [selectedFilePath, activeProject?.currentVersion]);

  // Scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatTurns]);

  // API Calls
  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/user/studio/builder/templates');
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      }
    } catch {}
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/studio/builder/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
        if (data.projects.length > 0 && !activeProject) {
          loadProjectDetail(data.projects[0].id);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadProjectDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/user/studio/builder/projects/${id}`);
      const data = await res.json();
      if (data.success && data.project) {
        setActiveProject(data.project);
        setChatTurns([
          {
            role: 'assistant',
            text: `Project "${data.project.title}" loaded successfully. Ready for preview or refinements.`,
            time: 'Just now',
          },
        ]);
        setPreviewKey((k) => k + 1);
      }
    } catch {}
  };

  // Create & Build New Project
  const handleCreateProject = async (brief: string, templateId?: string) => {
    if (!brief.trim()) return;
    setIsBuilding(true);
    setBuildProgress(15);
    setBuildStep(1);

    // Simulate animated realistic progress steps
    const stepTimer1 = setTimeout(() => {
      setBuildStep(2);
      setBuildProgress(35);
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setBuildStep(3);
      setBuildProgress(65);
      setCurrentWritingFile('styles/theme.css');
    }, 1400);

    const stepTimer3 = setTimeout(() => {
      setBuildProgress(85);
      setCurrentWritingFile('index.html');
    }, 2200);

    try {
      const res = await fetch('/api/user/studio/builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, templateId }),
      });
      const data = await res.json();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (data.success && data.project) {
        setBuildStep(4);
        setBuildProgress(100);
        setActiveProject(data.project);
        setProjects((prev) => [data.project, ...prev.filter((p) => p.id !== data.project.id)]);
        setChatTurns([
          {
            role: 'user',
            text: brief,
            time: 'Just now',
          },
          {
            role: 'assistant',
            text: `Successfully built "${data.project.title}"! All core source files, responsive styling, and client logic have been synthesized into your live interactive preview.`,
            time: 'Just now',
          },
        ]);
        setPreviewKey((k) => k + 1);
        setShowGalleryModal(false);
        setPromptInput('');
      } else {
        alert(data.error || 'Build failed. Please try again.');
      }
    } catch (err: any) {
      alert(`Network error during build: ${err.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  // Conversational Refinement
  const handleRefine = async (instruction?: string) => {
    const textToSubmit = instruction || refineInput;
    if (!textToSubmit.trim() || !activeProject) return;

    const userMsg = textToSubmit.trim();
    setRefineInput('');
    setChatTurns((prev) => [...prev, { role: 'user', text: userMsg, time: 'Just now' }]);
    setIsBuilding(true);
    setBuildStep(3);
    setBuildProgress(50);
    setCurrentWritingFile('Applying updates...');

    try {
      const res = await fetch(`/api/user/studio/builder/projects/${activeProject.id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modificationPrompt: userMsg }),
      });
      const data = await res.json();

      if (data.success && data.project) {
        setActiveProject(data.project);
        setPreviewKey((k) => k + 1);
        setChatTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Updated successfully! ${data.summary || 'Refinements applied to project files.'} Rebuilt live preview at version ${data.project.currentVersion}.`,
            time: 'Just now',
          },
        ]);
      } else {
        setChatTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `⚠️ Could not apply requested changes: ${data.error || 'Unknown build error.'} Preserved your last working preview intact.`,
            time: 'Just now',
          },
        ]);
      }
    } catch (err: any) {
      setChatTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Network error during refinement: ${err.message}. Last working preview preserved.`,
          time: 'Just now',
        },
      ]);
    } finally {
      setIsBuilding(false);
      setBuildProgress(100);
    }
  };

  // In-Browser Code Editor Save & Rebuild
  const handleSaveEditorFiles = async () => {
    if (!activeProject) return;
    try {
      setIsBuilding(true);
      const updatedFiles = activeProject.files.map((f) =>
        f.path === selectedFilePath ? { ...f, content: editorContent } : f
      );

      const res = await fetch(`/api/user/studio/builder/projects/${activeProject.id}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: updatedFiles }),
      });
      const data = await res.json();

      if (data.success && data.project) {
        setActiveProject(data.project);
        setHasUnsavedEdits(false);
        setPreviewKey((k) => k + 1);
        setChatTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Saved manual changes to ${selectedFilePath}. Live preview recompiled at version ${data.project.currentVersion}.`,
            time: 'Just now',
          },
        ]);
      } else {
        alert(data.error || 'Failed to save code modifications.');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  // Rollback Version
  const handleRollback = async (targetVersion: number) => {
    if (!activeProject) return;
    try {
      setIsBuilding(true);
      const res = await fetch(`/api/user/studio/builder/projects/${activeProject.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        setActiveProject(data.project);
        setPreviewKey((k) => k + 1);
        setShowHistoryModal(false);
        setChatTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Restored project to snapshot version ${targetVersion}. Files and live preview have been cleanly rolled back.`,
            time: 'Just now',
          },
        ]);
      }
    } catch {} finally {
      setIsBuilding(false);
    }
  };

  // Download ZIP
  const handleDownloadZip = () => {
    if (!activeProject) return;
    window.location.href = `/api/user/studio/builder/projects/${activeProject.id}/download`;
  };

  // Quick Refinement Suggestions
  const quickSuggestions = [
    'Change primary color to violet',
    'Add a customer testimonials section',
    'Make the layout two columns',
    'Add a working FAQ accordion',
    'Make the button rounded with shadow',
  ];

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#faf9f6] text-[#18181b] overflow-hidden select-none">
      {/* =========================================================================
          TOP NAVBAR
         ========================================================================= */}
      <header className="h-14 border-b border-[#e9e7e2] bg-[#ffffff] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/studio"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Back to AI Chat Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="text-slate-400">Studio</span>
            <span>/</span>
            <span className="text-slate-400">Websites</span>
            <span>/</span>
            <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[320px]">
              {activeProject ? activeProject.title : 'New Project'}
            </span>
          </div>
        </div>

        {/* View Mode Toggle (Preview vs Code) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f4f2ec] p-0.5 rounded-lg border border-[#e2dfd7]">
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'code'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            {activeProject && (
              <>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1"
                  title="Version History & Rollback"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">v{activeProject.currentVersion}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5"
                  title="Download Project ZIP"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export ZIP</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Site</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE LAYOUT (Split Panel)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Chat, Iteration, Progress */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] border-r border-[#e9e7e2] bg-[#ffffff] flex flex-col shrink-0 overflow-hidden">
          {/* Active Brief Card */}
          <div className="p-4 border-b border-[#f0ede6] bg-[#fbfaf8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 font-mono">
                Build Brief
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                {activeProject?.modelId || 'Claude Sonnet 5.5'}
              </span>
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed line-clamp-2">
              "{activeProject ? activeProject.brief : 'Describe a website or choose a template to begin building...'}"
            </p>
          </div>

          {/* Active Build Progress Accordion (Inspired by ScaleMax Studio reference) */}
          {isBuilding && (
            <div className="p-4 border-b border-violet-100 bg-violet-50/50 transition-all">
              <div className="flex items-center justify-between text-xs font-bold text-violet-900 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                  <span>Building your site...</span>
                </span>
                <span className="font-mono text-violet-700">{buildProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-violet-200/60 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${buildProgress}%` }}
                />
              </div>

              {/* Steps list */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Understanding your request</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    buildStep >= 2 ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {buildStep >= 2 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                  <span>Planning layout & pages</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    buildStep >= 3 ? 'text-violet-700 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {buildStep >= 3 ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-violet-600 animate-pulse" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                  <span>Writing project files &middot; {currentWritingFile || 'index.html'}</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    buildStep >= 4 ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {buildStep >= 4 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                  <span>Starting live preview & snapshot</span>
                </div>
              </div>
            </div>
          )}

          {/* Conversational Iteration Turns */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatTurns.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Ready to build</p>
                <p className="text-[11px] mt-1">
                  Type a prompt below to refine sections, colors, or interactive features.
                </p>
              </div>
            ) : (
              chatTurns.map((turn, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-violet-600 text-white ml-6 shadow-xs font-medium'
                      : 'bg-[#f4f2ec] text-slate-800 mr-6 border border-[#e2dfd7]'
                  }`}
                >
                  <p>{turn.text}</p>
                  <span
                    className={`block text-[10px] mt-1 font-mono ${
                      turn.role === 'user' ? 'text-violet-200' : 'text-slate-400'
                    }`}
                  >
                    {turn.time}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-2 border-t border-[#f0ede6] bg-[#fbfaf8] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRefine(sug)}
                disabled={isBuilding || !activeProject}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 hover:border-violet-400 hover:text-violet-700 text-slate-600 transition-colors cursor-pointer disabled:opacity-40"
              >
                + {sug}
              </button>
            ))}
          </div>

          {/* Conversational Refinement Composer */}
          <div className="p-3 border-t border-[#e9e7e2] bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRefine();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                placeholder={
                  activeProject
                    ? 'Request a change (e.g. "change color to violet")...'
                    : 'Describe website to build...'
                }
                disabled={isBuilding}
                className="flex-1 bg-[#f7f6f2] border border-[#e2dfd7] focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isBuilding || !refineInput.trim()}
                className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Send Refinement"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Token & Quota Tracking Footer */}
          <div className="px-4 py-2 border-t border-[#f0ede6] bg-[#fbfaf8] flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Tokens: Tracked</span>
            </span>
            <span>Rolling window active</span>
          </div>
        </aside>

        {/* RIGHT PANEL: Live Interactive Preview OR Code Editor */}
        <main className="flex-1 flex flex-col bg-[#f0ede6] overflow-hidden">
          {viewMode === 'preview' ? (
            /* =========================================================================
               PREVIEW MODE: Live Interactive Sandboxed Runtime
               ========================================================================= */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Preview Sub-toolbar */}
              <div className="h-10 border-b border-[#e2dfd7] bg-[#ffffff] px-4 flex items-center justify-between text-xs">
                {/* Viewport Toggles */}
                <div className="flex items-center gap-1 bg-[#f4f2ec] p-0.5 rounded-md border border-[#e2dfd7]">
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      viewport === 'desktop' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Desktop Viewport (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      viewport === 'tablet' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Tablet Viewport (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      viewport === 'mobile' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Mobile Viewport (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Isolated Sandbox Runtime</span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Reload Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  {activeProject && (
                    <a
                      href={`/api/user/studio/builder/projects/${activeProject.id}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Viewport Frame */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#eae7df]">
                <div
                  className={`h-full flex flex-col bg-white transition-all duration-300 rounded-xl overflow-hidden border border-[#d6d2c4] shadow-lg ${
                    viewport === 'mobile'
                      ? 'w-[375px] max-w-full'
                      : viewport === 'tablet'
                      ? 'w-[768px] max-w-full'
                      : 'w-full'
                  }`}
                >
                  {activeProject && activeProject.previewHtml ? (
                    <iframe
                      ref={previewIframeRef}
                      key={previewKey}
                      title="Live Website Preview"
                      srcDoc={activeProject.previewHtml}
                      sandbox="allow-scripts allow-forms allow-modals"
                      className="w-full flex-1 border-0 bg-white"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <Globe className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="font-bold text-slate-700 text-sm">No website loaded yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        Select a template or describe what you want to build to start the preview.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowGalleryModal(true)}
                        className="mt-4 px-4 py-2 rounded-lg bg-violet-600 text-white font-bold text-xs"
                      >
                        Choose Starter Template
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               CODE MODE: Multi-File Explorer & In-Browser Code Editor
               ========================================================================= */
            <div className="flex-1 flex overflow-hidden bg-[#1e1e24] text-slate-200">
              {/* File Explorer Tree */}
              <div className="w-56 border-r border-[#2d2d38] bg-[#18181f] flex flex-col shrink-0">
                <div className="p-3 border-b border-[#2d2d38] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Files</span>
                  <span className="text-[10px] font-mono text-violet-400">
                    {activeProject?.files.length || 0}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {activeProject?.files.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => {
                        setSelectedFilePath(file.path);
                        setEditorContent(file.content);
                        setHasUnsavedEdits(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono transition-colors text-left ${
                        selectedFilePath === file.path
                          ? 'bg-violet-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-[#252530]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{file.path}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor Body */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#141419]">
                {/* Editor Bar */}
                <div className="h-10 border-b border-[#2d2d38] bg-[#1a1a22] px-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-300">
                    <span>{selectedFilePath}</span>
                    {hasUnsavedEdits && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEditorFiles}
                      disabled={isBuilding || !hasUnsavedEdits}
                      className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save & Rebuild</span>
                    </button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <textarea
                  value={editorContent}
                  onChange={(e) => {
                    setEditorContent(e.target.value);
                    setHasUnsavedEdits(true);
                  }}
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          STARTER TEMPLATE GALLERY MODAL
         ========================================================================= */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Starter Templates</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick a curated archetype or describe your custom website below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Brief input */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Describe the website or app you want:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. A bold landing page for an AI habit-tracking app with pricing and FAQ..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => handleCreateProject(promptInput)}
                  disabled={!promptInput.trim()}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs disabled:opacity-40"
                >
                  Build it &rarr;
                </button>
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-violet-400 hover:shadow-xs transition-all bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100">
                        {tmpl.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {tmpl.buildTime}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{tmpl.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {tmpl.fileCount} source files
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCreateProject(tmpl.promptExample, tmpl.id)}
                      className="px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-bold transition-all"
                    >
                      Build this &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VERSION HISTORY & ROLLBACK MODAL
         ========================================================================= */}
      {showHistoryModal && activeProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Version History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activeProject.versions?.map((v) => (
                <div
                  key={v.version}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    v.version === activeProject.currentVersion
                      ? 'border-violet-500 bg-violet-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Version {v.version}</span>
                      {v.version === activeProject.currentVersion && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-violet-600 text-white font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{v.summary}</p>
                  </div>
                  {v.version !== activeProject.currentVersion && (
                    <button
                      type="button"
                      onClick={() => handleRollback(v.version)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-violet-600 hover:text-white text-slate-700 font-bold text-[11px] transition-colors"
                    >
                      Rollback
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
