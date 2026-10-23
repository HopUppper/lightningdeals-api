import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Paperclip,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Code,
  Image as ImageIcon,
  FileText,
  X,
  Lock,
  Zap,
  ArrowRight,
  Download,
  AlertCircle,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  Layers,
  Search,
  ExternalLink,
  Cpu,
  ShieldCheck,
  Edit2,
  Brain,
  Eye,
  Maximize2,
  Minimize2,
  Share2,
  FileCode,
  CornerDownLeft,
  Volume2,
  VolumeX,
  Globe,
  Sun,
  Moon,
  Square,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pin,
  PinOff,
  Calendar,
  Table,
  Scale,
  Bug,
  BookOpen,
  Key,
  Mic,
  ArrowDown,
  Command,
  Info,
  MoreHorizontal,
  MoreVertical,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { userFetch, getAuthHeaders } from '../../utils/api';
import { MarkdownBlock } from '../../components/chat/MarkdownBlock';
import { ArtifactCanvas, ArtifactData } from '../../components/chat/ArtifactCanvas';
import { ContextManagerDrawer, ProjectMemoryItem } from '../../components/chat/ContextManagerDrawer';
import { WorkspaceSkillsModal } from '../../components/chat/WorkspaceSkillsModal';
import { CommandPaletteModal } from '../../components/chat/CommandPaletteModal';
import { ModelSelectorModal } from '../../components/chat/ModelSelectorModal';
import { ProjectManagementModal, StudioProjectItem } from '../../components/chat/ProjectManagementModal';
import { Folder, FolderPlus, Archive, ArchiveRestore } from 'lucide-react';
import { WebResearchSources, WebSourceItem } from '../../components/chat/WebResearchSources';
import {
  BrowserTaskModal,
  BrowserSessionData,
  BrowserCapabilityData,
} from '../../components/chat/BrowserTaskModal';
import {
  ContextActivityPanel,
  StudioActivityEvent,
} from '../../components/chat/ContextActivityPanel';
import { StudioOnboardingGuide } from '../../components/chat/StudioOnboardingGuide';
import { DocumentGeneratorModal } from '../../components/chat/DocumentGeneratorModal';
import { MediaGenerationModal } from '../../components/chat/MediaGenerationModal';
import { FileSpreadsheet, HelpCircle, Compass, FolderKanban } from 'lucide-react';

export interface ChatAttachment {
  name: string;
  type: 'image' | 'file' | 'document';
  mimeType: string;
  sizeBytes?: number;
  dataBase64?: string;
  textSnippet?: string;
}

export interface ComparisonResult {
  modelA: {
    modelId: string;
    modelName: string;
    content: string;
    thinking?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    latencyMs?: number;
  };
  modelB: {
    modelId: string;
    modelName: string;
    content: string;
    thinking?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    latencyMs?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  timestamp: number;
  thinking?: string;
  comparison?: ComparisonResult;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cached_tokens?: number;
    reasoning_tokens?: number;
    first_token_ms?: number;
    usage_source?: string;
    savings_tokens?: number;
    estimated_savings_tokens?: number;
    is_savings_estimated?: boolean;
  };
  multiplier?: number;
  latencyMs?: number;
  modelUsed?: string;
  isError?: boolean;
  sources?: WebSourceItem[];
  researchMode?: 'standard' | 'web_search' | 'deep_research' | 'open_link' | 'browser_task';
  inspectedUrl?: string;
  activities?: StudioActivityEvent[];
  currentActivity?: StudioActivityEvent;
}

export interface ChatThread {
  id: string;
  title: string;
  model: string;
  pinned?: boolean;
  archived?: boolean;
  projectId?: string | null;
  project?: { id: string; name: string; color: string | null } | null;
  systemPrompt?: string;
  temperature?: number;
  thinkingEnabled?: boolean;
  tokenSaverEnabled?: boolean;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  messagesLoaded?: boolean;
  uncompressedBackup?: ChatMessage[];
}

export interface StudioModelMeta {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  tokenMultiplier: number;
  contextWindow: number;
  maxOutputTokens?: number;
  supportsThinking: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  isAvailable: boolean;
  upstreamModelId?: string;
  providerRoute?: string;
}

export const VERIFIED_MODELS: StudioModelMeta[] = [
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude Sonnet 5.5',
    category: 'Flagship Models',
    badge: 'Recommended',
    description: 'Premier agentic model for fullstack coding, multi-file synthesis, and autonomous engineering.',
    tokenMultiplier: 1.0,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-sonnet-5',
    providerRoute: 'anthropic',
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    category: 'Flagship Models',
    badge: 'Frontier Intelligence',
    description: 'Pinnacle frontier reasoning for complex system architectures, formal proofs, and cognitive depth.',
    tokenMultiplier: 2.0,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-opus-5-5',
    providerRoute: 'anthropic',
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    category: 'Reasoning & Deep Thinking',
    badge: 'Extended Thinking',
    description: 'Hybrid reasoning architecture with inspectable deliberative thought buffers for zero-hallucination analysis.',
    tokenMultiplier: 1.25,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-3-7-sonnet-20250219',
    providerRoute: 'anthropic / custom_http',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    category: 'Reasoning & Deep Thinking',
    badge: 'Deep Logic',
    description: 'Enterprise architecture design, distributed consensus, and deep formal code auditing.',
    tokenMultiplier: 1.75,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-opus-5',
    providerRoute: 'anthropic',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    category: 'High-Velocity & Coding',
    badge: 'Sub-30ms TTFT',
    description: 'Ultra-fast developer completions tuned for IDE code completion, inline refactoring, and instant responses.',
    tokenMultiplier: 0.5,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-fable-5',
    providerRoute: 'anthropic',
  },
  {
    id: 'claude-fable-5.1',
    name: 'Claude Fable 5.1',
    category: 'High-Velocity & Coding',
    badge: 'IDE Autopilot',
    description: 'Specialized model for rapid git diff generation, automated test suites, and CI/CD triage.',
    tokenMultiplier: 0.6,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-fable-5-1',
    providerRoute: 'anthropic',
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    category: 'Fast & Economical',
    badge: 'Lowest Latency',
    description: 'High-velocity streaming model with minimal token overhead for high-concurrency bot loops and summaries.',
    tokenMultiplier: 0.25,
    contextWindow: 500000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-haiku-4-5-20251001',
    providerRoute: 'anthropic',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    category: 'Standard Anthropic Series',
    badge: 'Standard',
    description: 'Anthropic standard enterprise model for production coding and technical documentation.',
    tokenMultiplier: 1.0,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-3-5-sonnet-20241022',
    providerRoute: 'anthropic / custom_http',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    category: 'Fast & Economical',
    badge: 'Fast',
    description: 'Economical high-speed completion model for lightweight tasks and quick Q&A.',
    tokenMultiplier: 0.25,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-3-5-haiku-20241022',
    providerRoute: 'anthropic / custom_http',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    category: 'Standard Anthropic Series',
    badge: 'Deep Reasoning',
    description: 'Anthropic deep reasoning model for complex nuanced analysis and multi-step domain expertise.',
    tokenMultiplier: 2.0,
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
    upstreamModelId: 'claude-3-opus-20240229',
    providerRoute: 'anthropic / custom_http',
  },
];

export const getModelDisplayName = (modelId: string): string => {
  const found = VERIFIED_MODELS.find((m) => m.id === modelId);
  if (found) return found.name;
  if (modelId.includes('3-7') || modelId.includes('3.7')) return 'Claude 3.7 Sonnet';
  if (modelId.includes('opus-5.5') || modelId.includes('opus-5-5')) return 'Claude Opus 5.5';
  if (modelId.includes('sonnet-5.5') || modelId.includes('sonnet-5-5')) return 'Claude Sonnet 5.5';
  if (modelId.includes('opus-5')) return 'Claude Opus 5';
  if (modelId.includes('sonnet-5')) return 'Claude Sonnet 5';
  if (modelId.includes('fable-5-flash')) return 'Claude Fable 5 Flash';
  if (modelId.includes('fable-5') || modelId.includes('fable')) return 'Claude Fable 5';
  if (modelId.includes('haiku-5.5')) return 'Claude Haiku 5.5';
  if (modelId.includes('haiku-5') || modelId.includes('haiku-4-5')) return 'Claude Haiku 5';
  return modelId;
};

// Phase 2.3 Starting Prompt Cards
const STARTING_WORKFLOW_CARDS = [
  {
    icon: FileText,
    title: 'Explain or summarize a document',
    prompt: 'Please analyze this technical document or text: extract the key takeaways, structural architecture, important data points, and actionable next steps.',
    category: 'Document Analysis',
  },
  {
    icon: Bug,
    title: 'Debug a piece of code',
    prompt: 'Review this code for bugs, race conditions, edge-case failures, or performance bottlenecks. Provide the root-cause diagnosis and a clean minimal fix.',
    category: 'Debugging & Fixes',
  },
  {
    icon: Scale,
    title: 'Compare two approaches',
    prompt: 'Compare two architectural approaches for solving this problem: evaluate performance, scalability, development velocity, and operational trade-offs.',
    category: 'Architecture',
  },
  {
    icon: BookOpen,
    title: 'Help draft or improve writing',
    prompt: 'Help draft and refine this technical explanation or executive summary with high clarity, concise structure, and professional tone.',
    category: 'Writing & Docs',
  },
  {
    icon: Table,
    title: 'Analyse spreadsheet or CSV data',
    prompt: 'Analyze this tabular CSV data or dataset: summarize core statistical trends, highlight anomalies, and generate key actionable insights.',
    category: 'Data & Analytics',
  },
];

const SLASH_COMMANDS = [
  { cmd: '/code', desc: 'Generate complete, production-grade implementation' },
  { cmd: '/debug', desc: 'Diagnose root cause and output minimal diff fix' },
  { cmd: '/refactor', desc: 'Optimize performance and clean code architecture' },
  { cmd: '/test', desc: 'Write comprehensive unit and integration test suite' },
  { cmd: '/explain', desc: 'Provide step-by-step technical breakdown' },
  { cmd: '/compress', desc: 'Summarize conversation history to save tokens' },
];

export const UserChatStudio: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [isPaidCustomer, setIsPaidCustomer] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Theme: Warm Claude Paper ('light') vs Obsidian Dark ('dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lightning_studio_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('lightning_studio_theme', next);
  };

  const isDark = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  // Sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Threads state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [threadSearch, setThreadSearch] = useState('');

  // Conversation Renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Prompt input state
  const [inputMessage, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Model & Key Picker Modals
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [keyPickerOpen, setKeyPickerOpen] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<StudioProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [archiveView, setArchiveView] = useState(false);
  const [activeTelemetryMsgId, setActiveTelemetryMsgId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [activeMenuThreadId, setActiveMenuThreadId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [headerTitleText, setHeaderTitleText] = useState('');

  // Advanced Drawers & Canvas
  const [contextManagerOpen, setContextManagerOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Persistent Memories
  const [userMemories, setUserMemories] = useState<ProjectMemoryItem[]>([]);

  // Onboarding, Document Generator & Media Studio Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('lightning_studio_onboarding_completed_v2');
  });
  const [isDocGenOpen, setIsDocGenOpen] = useState(false);
  const [isMediaGenOpen, setIsMediaGenOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState<'workspace' | 'library'>('workspace');

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // Speech TTS state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Slash command popup
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  // Editing message
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableModels, setAvailableModels] = useState<StudioModelMeta[]>(VERIFIED_MODELS);
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  // Workspace Skills Modal State
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lightning_studio_active_skills');
      return saved ? JSON.parse(saved) : ['skill_senior_architect'];
    } catch {
      return ['skill_senior_architect'];
    }
  });

  const handleToggleSkill = (skillId: string) => {
    setActiveSkillIds((prev) => {
      const next = prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId];
      localStorage.setItem('lightning_studio_active_skills', JSON.stringify(next));
      return next;
    });
  };

  const handleSetActiveSkillIds = (skillIds: string[]) => {
    setActiveSkillIds(skillIds);
    localStorage.setItem('lightning_studio_active_skills', JSON.stringify(skillIds));
  };

  // Command Palette State (⌘K / Ctrl+K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Model Comparison Mode
  const [isComparingModels, setIsComparingModels] = useState(false);
  const [secondaryModelId, setSecondaryModelId] = useState('claude-3-5-sonnet-20241022');

  // Scroll tracking & Jump to latest button
  const isNearBottomRef = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);

  const handleChatScroll = () => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom <= 140;
    setShowJumpButton(distFromBottom > 140);
  };

  // Voice speech dictation (Mic)
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  const toggleVoiceDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('[VOICE RECOGNITION ERROR]', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Attachment Menu Popover
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Web Research & Controlled Browser State
  const [researchMode, setResearchMode] = useState<
    'standard' | 'web_search' | 'deep_research' | 'open_link' | 'browser_task'
  >('standard');
  const [showResearchMenu, setShowResearchMenu] = useState(false);
  const [targetUrlToAnalyze, setTargetUrlToAnalyze] = useState<string | null>(null);

  // Browser Automation Modal & Session
  const [browserModalOpen, setBrowserModalOpen] = useState(false);
  const [browserSession, setBrowserSession] = useState<BrowserSessionData | null>(null);
  const [browserCapability, setBrowserCapability] = useState<BrowserCapabilityData | null>(null);

  // Fetch browser capability
  useEffect(() => {
    userFetch('/api/user/studio/browser/status')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.capability) {
            setBrowserCapability(data.capability);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Detect URLs in input message for auto-link suggestions
  const detectedUrlsInInput = useMemo(() => {
    if (!inputMessage) return [];
    const matches = inputMessage.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
    return Array.from(new Set(matches.map((u) => u.replace(/[.,;:!?]+$/, ''))));
  }, [inputMessage]);

  const handleOpenBrowserWorkspace = async () => {
    setBrowserModalOpen(true);
    if (!browserSession) {
      try {
        const res = await userFetch('/api/user/studio/browser/session', {
          method: 'POST',
          body: JSON.stringify({ conversationId: activeThreadId }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.session) {
            setBrowserSession(data.session);
          }
        }
      } catch (e) {
        console.warn('Failed to initialize browser session:', e);
      }
    }
  };

  const handleBrowserNavigate = async (url: string) => {
    if (!browserSession) return;
    const res = await userFetch('/api/user/studio/browser/step', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: browserSession.sessionId,
        action: 'navigate',
        target: url,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.session) {
        setBrowserSession(data.session);
      }
    }
  };

  const handleBrowserInspect = async () => {
    if (!browserSession) return;
    const res = await userFetch('/api/user/studio/browser/step', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: browserSession.sessionId,
        action: 'inspect',
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.session) {
        setBrowserSession(data.session);
      }
    }
  };

  const handleBrowserScreenshot = async () => {
    if (!browserSession) return;
    const res = await userFetch('/api/user/studio/browser/step', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: browserSession.sessionId,
        action: 'screenshot',
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.session) {
        setBrowserSession(data.session);
      }
    }
  };

  const handleBrowserConfirmAction = async (confirmationId: string, approved: boolean) => {
    if (!browserSession) return;
    const res = await userFetch('/api/user/studio/browser/confirm', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: browserSession.sessionId,
        confirmationId,
        approved,
      }),
    });
    if (res.ok) {
      setBrowserSession((prev) =>
        prev
          ? {
              ...prev,
              pendingConfirmation: undefined,
              status: approved ? 'idle' : 'cancelled',
            }
          : null
      );
    }
  };

  const handleBrowserCancelSession = async () => {
    if (!browserSession) return;
    await userFetch('/api/user/studio/browser/cancel', {
      method: 'POST',
      body: JSON.stringify({ sessionId: browserSession.sessionId }),
    }).catch(() => {});
    setBrowserSession(null);
    setBrowserModalOpen(false);
  };

  // Branch selection in model comparison
  const handleSelectComparisonBranch = (msgId: string, branch: 'modelA' | 'modelB') => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: t.messages.map((m) => {
                if (m.id === msgId && m.comparison) {
                  const chosen = m.comparison[branch];
                  return {
                    ...m,
                    content: chosen.content,
                    thinking: chosen.thinking,
                    modelUsed: chosen.modelId,
                    usage: chosen.usage,
                    latencyMs: chosen.latencyMs,
                    comparison: undefined,
                  };
                }
                return m;
              }),
            }
          : t
      )
    );
  };

  // 1. Initial Load: User Keys & Server Conversations & Authoritative Models
  useEffect(() => {
    async function loadData() {
      try {
        // Load Authoritative Model Catalog from Server
        const modelsRes = await userFetch('/api/user/studio/models');
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          if (Array.isArray(modelsData.models) && modelsData.models.length > 0) {
            setAvailableModels(modelsData.models);
          }
        }

        // Load API Keys
        const keysRes = await userFetch('/api/user/keys');
        if (keysRes.ok) {
          const keysData = await keysRes.json();
          const keyList = keysData.keys || [];
          setKeys(keyList);
          setIsPaidCustomer(Boolean(keysData.isPaidCustomer));

          const savedKeyId = localStorage.getItem('lightning_studio_key_id');
          if (savedKeyId && keyList.some((k: any) => k.id === savedKeyId)) {
            setSelectedKeyId(savedKeyId);
          } else {
            // Prefer an active key that has available tokens (> 0)
            const positiveKey = keyList.find((k: any) => BigInt(k.tokensRemaining || 0) > 0n);
            const initialKey = positiveKey || keyList[0];
            if (initialKey) {
              setSelectedKeyId(initialKey.id);
              localStorage.setItem('lightning_studio_key_id', initialKey.id);
            }
          }
        }

        // Load Projects
        try {
          const projRes = await userFetch('/api/user/studio/projects');
          if (projRes.ok) {
            const pData = await projRes.json();
            if (Array.isArray(pData.projects)) setProjects(pData.projects);
          }
        } catch {}

        // Load Server-Backed Conversations
        const convsRes = await userFetch('/api/user/studio/conversations');
        if (convsRes.ok) {
          const convsData = await convsRes.json();
          if (Array.isArray(convsData.conversations) && convsData.conversations.length > 0) {
            const serverThreads: ChatThread[] = convsData.conversations.map((c: any) => ({
              id: c.id,
              title: c.title,
              model: c.model,
              pinned: Boolean(c.pinned),
              archived: Boolean(c.archived),
              projectId: c.projectId || null,
              project: c.project || null,
              systemPrompt: c.systemPrompt || '',
              thinkingEnabled: Boolean(c.thinkingEnabled),
              tokenSaverEnabled: Boolean(c.tokenSaverEnabled),
              temperature: c.temperature ?? 0.2,
              messages: [],
              createdAt: new Date(c.createdAt).getTime(),
              updatedAt: new Date(c.updatedAt).getTime(),
              messagesLoaded: false,
            }));
            setThreads(serverThreads);
            const firstId = serverThreads[0].id;
            setActiveThreadId(firstId);
            loadConversationMessages(firstId);
            return;
          }
        }

        // Fallback to localStorage cache if server had 0 conversations
        const saved = localStorage.getItem('lightning_chat_threads_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setThreads(parsed);
            setActiveThreadId(parsed[0].id);
            return;
          }
        }

        // Default Thread
        const defaultThread: ChatThread = {
          id: `thread_${Date.now()}`,
          title: 'New Session',
          model: 'claude-sonnet-5.5',
          systemPrompt: 'You are an elite principal software architect. Provide clean, robust, production-grade code with TypeScript typings, error handling, and structured explanations.',
          temperature: 0.2,
          thinkingEnabled: true,
          tokenSaverEnabled: false,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messagesLoaded: true,
        };
        setThreads([defaultThread]);
        setActiveThreadId(defaultThread.id);
      } catch (err) {
        console.error('Failed to load initial studio data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
    loadMemories();
  }, []);

  // Load Memories from server
  const loadMemories = async () => {
    try {
      const res = await userFetch('/api/user/studio/memories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.memories)) {
          setUserMemories(data.memories);
        }
      }
    } catch {}
  };

  const handleAddMemory = async (category: string, fact: string) => {
    try {
      const res = await userFetch('/api/user/studio/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, fact }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.memory) {
          setUserMemories((prev) => [...prev, data.memory]);
        }
      }
    } catch (err) {
      console.error('Failed to save memory:', err);
    }
  };

  const handleEditMemory = async (id: string, category: string, fact: string) => {
    try {
      const res = await userFetch(`/api/user/studio/memories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, fact }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.memory) {
          setUserMemories((prev) => prev.map((m) => (m.id === id ? data.memory : m)));
        }
      }
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  };

  const handleRemoveMemory = async (id: string) => {
    try {
      await userFetch(`/api/user/studio/memories/${id}`, {
        method: 'DELETE',
      });
      setUserMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to remove memory:', err);
    }
  };

  const handleClearAllMemories = async () => {
    try {
      await userFetch('/api/user/studio/memories', {
        method: 'DELETE',
      });
      setUserMemories([]);
    } catch (err) {
      console.error('Failed to clear memories:', err);
    }
  };

  // Safe Context Compression with Rollback Recovery
  const handleCompressContext = async () => {
    if (activeThread.messages.length < 3 || isCompressing) return;
    setIsCompressing(true);

    // Save full original messages as uncompressed backup before any mutation
    const originalBackup = [...activeThread.messages];

    try {
      if (!activeThread.id.startsWith('thread_')) {
        // Call authoritative server compression endpoint
        const res = await userFetch(`/api/user/studio/conversations/${activeThread.id}/compress`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Context compression failed on server.');
        }

        const recentMessages = activeThread.messages.slice(-2);
        const compactedMessages = [data.compactedMessage, ...recentMessages];

        updateActiveThread({
          messages: compactedMessages,
          tokenSaverEnabled: true,
          uncompressedBackup: originalBackup,
        });
      } else {
        // Client-side local session compression with uncompressed backup preserved
        const olderMessages = activeThread.messages.slice(0, -2);
        const recentMessages = activeThread.messages.slice(-2);

        const summaryLines: string[] = [];
        for (const m of olderMessages) {
          if (m.role === 'user') {
            summaryLines.push(`- Goal/Instruction: "${m.content.slice(0, 160).trim()}${m.content.length > 160 ? '...' : ''}"`);
          } else if (m.role === 'assistant') {
            summaryLines.push(`- Output Summary: "${m.content.slice(0, 200).trim()}${m.content.length > 200 ? '...' : ''}"`);
          }
        }

        const summaryContent = `[COMPACTED CONTEXT SUMMARY]:\n${summaryLines.join('\n')}\n[End of historical compacted context]`;
        const summaryMsg: ChatMessage = {
          id: `msg_comp_${Date.now()}`,
          role: 'system',
          content: summaryContent,
          timestamp: Date.now(),
        };

        const compactedMessages = [summaryMsg, ...recentMessages];
        updateActiveThread({
          messages: compactedMessages,
          tokenSaverEnabled: true,
          uncompressedBackup: originalBackup,
        });
      }
    } catch (err: any) {
      alert(`Compression error: ${err.message || 'Could not compress context'}. Original conversation history is preserved intact.`);
    } finally {
      setIsCompressing(false);
    }
  };

  // Safe Context Restoration / Undo Compression
  const handleRestoreContext = async () => {
    if (!activeThread.uncompressedBackup || activeThread.uncompressedBackup.length === 0) {
      alert('No previous uncompressed message backup found to restore.');
      return;
    }

    const backup = activeThread.uncompressedBackup;
    try {
      if (!activeThread.id.startsWith('thread_')) {
        const res = await userFetch(`/api/user/studio/conversations/${activeThread.id}/restore-context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupMessages: backup }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Server restore failed.');
        }
      }

      updateActiveThread({
        messages: backup,
        tokenSaverEnabled: false,
        uncompressedBackup: undefined,
      });
    } catch (err: any) {
      alert(`Failed to restore original context: ${err.message || 'Unknown error'}`);
    }
  };

  // API Key Switching Action
  const handleSelectKey = (keyId: string) => {
    setSelectedKeyId(keyId);
    localStorage.setItem('lightning_studio_key_id', keyId);
    setKeyPickerOpen(false);
  };

  // Fetch full messages for a conversation
  const loadConversationMessages = async (convId: string) => {
    if (!convId || convId.startsWith('thread_')) return; // local-only draft
    if (generating) return; // Prevent overwriting when actively generating

    try {
      const res = await userFetch(`/api/user/studio/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.messages) {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id !== convId) return t;
              // If local thread already has more messages than server (e.g. user just sent message), preserve local!
              if (t.messages && t.messages.length > data.conversation.messages.length) {
                return { ...t, messagesLoaded: true };
              }
              return {
                ...t,
                title: data.conversation.title,
                model: data.conversation.model,
                pinned: Boolean(data.conversation.pinned),
                systemPrompt: data.conversation.systemPrompt || '',
                thinkingEnabled: Boolean(data.conversation.thinkingEnabled),
                tokenSaverEnabled: Boolean(data.conversation.tokenSaverEnabled),
                temperature: data.conversation.temperature ?? 0.2,
                messages: data.conversation.messages,
                messagesLoaded: true,
              };
            })
          );
        }
      }
    } catch (e) {
      console.warn('Failed to fetch conversation messages:', e);
    }
  };

  // Sync threads to localStorage as backup
  useEffect(() => {
    if (threads.length > 0) {
      try {
        localStorage.setItem('lightning_chat_threads_v3', JSON.stringify(threads.slice(0, 20)));
      } catch {}
    }
  }, [threads]);

  // Active thread helper
  const activeThread = useMemo(() => {
    return (
      threads.find((t) => t.id === activeThreadId) ||
      threads[0] || {
        id: 'draft',
        title: 'New Session',
        model: 'claude-sonnet-5.5',
        temperature: 0.2,
        thinkingEnabled: true,
        tokenSaverEnabled: false,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
  }, [threads, activeThreadId]);

  const activeModelMeta = useMemo(() => {
    return (
      availableModels.find((m) => m.id === activeThread.model) ||
      VERIFIED_MODELS.find((m) => m.id === activeThread.model) ||
      VERIFIED_MODELS[0]
    );
  }, [availableModels, activeThread.model]);

  // When switching conversations, load messages if not already loaded
  useEffect(() => {
    if (!generating && activeThread && !activeThread.messagesLoaded && !activeThread.id.startsWith('thread_')) {
      loadConversationMessages(activeThread.id);
    }
  }, [activeThreadId, generating]);

  // Auto-scroll chat to bottom (preserves scroll position if user scrolls up)
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth', force = false) => {
    if (chatScrollContainerRef.current && (force || isNearBottomRef.current)) {
      const { scrollHeight, clientHeight } = chatScrollContainerRef.current;
      chatScrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior });
    }
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [activeThread?.messages?.length, generating]);

  // Elapsed time tracker during generation
  useEffect(() => {
    let interval: any;
    if (generating) {
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 100);
    } else {
      setElapsedMs(0);
    }
    return () => clearInterval(interval);
  }, [generating]);

  // Thread management helpers
  const updateActiveThread = (updates: Partial<ChatThread>) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, ...updates, updatedAt: Date.now() } : t))
    );
  };

  const handleCreateNewThread = async (forProjectId?: string) => {
    const projIdToUse = forProjectId !== undefined ? forProjectId : selectedProjectId;
    const projObj = projIdToUse ? projects.find((p) => p.id === projIdToUse) : null;
    const defaultModel = activeThread.model || 'claude-sonnet-5.5';
    let newId = `thread_${Date.now()}`;

    try {
      const res = await userFetch('/api/user/studio/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Session',
          model: defaultModel,
          thinkingEnabled: activeThread.thinkingEnabled ?? true,
          tokenSaverEnabled: activeThread.tokenSaverEnabled ?? false,
          projectId: projIdToUse || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.id) {
          newId = data.conversation.id;
        }
      }
    } catch {}

    const newThread: ChatThread = {
      id: newId,
      title: 'New Session',
      model: defaultModel,
      projectId: projIdToUse || null,
      project: projObj ? { id: projObj.id, name: projObj.name, color: projObj.color || '#8b5cf6' } : null,
      systemPrompt: activeThread.systemPrompt,
      temperature: activeThread.temperature ?? 0.2,
      thinkingEnabled: activeThread.thinkingEnabled ?? true,
      tokenSaverEnabled: activeThread.tokenSaverEnabled ?? false,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messagesLoaded: true,
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setActiveArtifact(null);
    setPrompt('');
    setAttachments([]);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
  };

  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation? This will remove all messages.')) {
      return;
    }

    try {
      if (!id.startsWith('thread_')) {
        await userFetch(`/api/user/studio/conversations/${id}`, { method: 'DELETE' });
      }
    } catch {}

    const nextThreads = threads.filter((t) => t.id !== id);
    if (nextThreads.length === 0) {
      handleCreateNewThread();
    } else {
      setThreads(nextThreads);
      if (activeThreadId === id) {
        setActiveThreadId(nextThreads[0].id);
        loadConversationMessages(nextThreads[0].id);
      }
    }
  };

  const handleToggleArchive = async (id: string, currentArchived: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextArchived = !currentArchived;
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: nextArchived } : t))
    );

    if (!id.startsWith('thread_')) {
      try {
        await userFetch(`/api/user/studio/conversations/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ archived: nextArchived }),
        });
      } catch (err) {
        console.error('Failed to toggle archive:', err);
      }
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPinned = !currentPinned;
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: nextPinned } : t))
    );

    if (!id.startsWith('thread_')) {
      try {
        await userFetch(`/api/user/studio/conversations/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ pinned: nextPinned }),
        });
      } catch {}
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!renameText.trim()) {
      setRenamingId(null);
      return;
    }
    const clean = renameText.trim();
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: clean } : t))
    );
    setRenamingId(null);

    if (!id.startsWith('thread_')) {
      try {
        await userFetch(`/api/user/studio/conversations/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: clean }),
        });
      } catch {}
    }
  };

  // Group threads by date & pinned
  const groupedThreads = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 6 * 86400000;

    let filtered = threads.filter((t) =>
      t.title.toLowerCase().includes(threadSearch.toLowerCase())
    );

    // Filter by Archive mode
    filtered = filtered.filter((t) => (archiveView ? Boolean(t.archived) : !t.archived));

    // Filter by Project if selected
    if (selectedProjectId) {
      filtered = filtered.filter((t) => t.projectId === selectedProjectId);
    }

    const pinned: ChatThread[] = [];
    const today: ChatThread[] = [];
    const yesterday: ChatThread[] = [];
    const previous7Days: ChatThread[] = [];
    const older: ChatThread[] = [];

    for (const t of filtered) {
      if (t.pinned) {
        pinned.push(t);
        continue;
      }
      const time = t.updatedAt || t.createdAt || Date.now();
      if (time >= todayStart) {
        today.push(t);
      } else if (time >= yesterdayStart) {
        yesterday.push(t);
      } else if (time >= sevenDaysStart) {
        previous7Days.push(t);
      } else {
        older.push(t);
      }
    }

    return { pinned, today, yesterday, previous7Days, older };
  }, [threads, threadSearch]);

  // Text to Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean.substring(0, 1500));
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Prompt Enhancer
  const handleEnhancePrompt = () => {
    if (!inputMessage.trim()) return;
    const raw = inputMessage.trim();
    const enhanced = `Act as an elite principal software engineer and system architect. ${raw}. Ensure the solution is modular, includes robust TypeScript/Python typings, comprehensive error boundaries, and adheres to high-performance production standards with zero fluff.`;
    setPrompt(enhanced);
  };

  // File Upload Handlers (with server-side validation via /api/user/studio/upload)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!activeKey) {
      setUpgradeReason('An active API key is required to analyze files and images. Claim a free 200k trial key or activate a capacity plan.');
      setShowUpgradeModal(true);
      return;
    }

    if (activeKey.expiresAt && new Date(activeKey.expiresAt).getTime() <= Date.now()) {
      setUpgradeReason('Your API key has expired. Please upgrade your capacity plan to continue inspecting documents.');
      setShowUpgradeModal(true);
      return;
    }

    if (Number(remainingTokens) <= 0) {
      setUpgradeReason('Your API key has depleted its token balance (0 tokens remaining). Please upgrade your capacity plan or switch to an active key with tokens.');
      setShowUpgradeModal(true);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`"${file.name}" exceeds the maximum 25MB file upload limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const rawResult = reader.result as string;
        const base64Data = rawResult.split(',')[1] || '';

        try {
          const res = await userFetch('/api/user/studio/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || 'text/plain',
              base64Data,
              size: file.size,
            }),
          });
          const data = await res.json();
          if (data.success && data.attachment) {
            setAttachments((prev) => [...prev, data.attachment]);
          } else {
            alert(data.error?.message || 'Failed to process attachment.');
          }
        } catch (e: any) {
          alert('Upload failed: ' + (e.message || 'Network error'));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Stop Active Streaming Generation
  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setGenerating(false);
    }
  };

  // Export Thread to Markdown, JSON, or Plain Text
  const handleExportThread = (format: 'markdown' | 'json' | 'text' = 'markdown') => {
    if (!activeThread.messages.length) return;
    const sanitizedTitle = activeThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'thread';

    if (format === 'json') {
      const dataStr = JSON.stringify(
        {
          id: activeThread.id,
          title: activeThread.title,
          model: activeThread.model,
          messages: activeThread.messages.map((m) => ({
            role: m.role,
            content: m.content,
            thinking: m.thinking,
            usage: m.usage,
            timestamp: m.timestamp,
          })),
        },
        null,
        2
      );
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedTitle}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMenuOpen(false);
      return;
    }

    if (format === 'text') {
      let txt = `=== ${activeThread.title} ===\nModel: ${activeThread.model}\n\n`;
      for (const m of activeThread.messages) {
        txt += `[${m.role.toUpperCase()}]\n${m.content}\n\n`;
      }
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedTitle}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMenuOpen(false);
      return;
    }

    // Default: Markdown
    const md = activeThread.messages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'Assistant'}\n\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedTitle}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  // ── CORE REAL-TIME SSE STREAMING HANDLER ──
  const handleSendMessage = async (customPrompt?: string, overrideMessages?: ChatMessage[]) => {
    const promptToSend = customPrompt !== undefined ? customPrompt : inputMessage;
    if ((!promptToSend.trim() && attachments.length === 0) || generating) return;

    if (!activeKey) {
      setUpgradeReason('An active API key is required to use AI Chat Studio. Claim your free 200k trial key or activate a capacity plan.');
      setShowUpgradeModal(true);
      return;
    }

    if (activeKey.expiresAt && new Date(activeKey.expiresAt).getTime() <= Date.now()) {
      setUpgradeReason('Your API key has expired. Please upgrade your capacity plan to continue prompting in AI Chat Studio.');
      setShowUpgradeModal(true);
      return;
    }

    if (Number(remainingTokens) <= 0) {
      setUpgradeReason('Your API key has depleted its token balance (0 tokens remaining). Please upgrade your capacity plan or switch to an active key.');
      setShowUpgradeModal(true);
      return;
    }

    // Gate Opus frontier models for trial keys (Trial includes Sonnet 5.5, Sonnet 3.7, Haiku 5.5, Fable 5.1)
    const isTrialKey = activeKey?.type === 'trial' || activeKey?.plan === 'Free Trial';
    if (!isPaidCustomer && isTrialKey && activeThread.model.toLowerCase().includes('opus')) {
      setUpgradeReason('Claude Opus frontier reasoning is exclusive to paid capacity plans. Your trial key includes full access to Claude Sonnet 5.5, Sonnet 3.7, Haiku 5.5, and Fable coding models.');
      setShowUpgradeModal(true);
      return;
    }

    const userMsgId = `msg_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: promptToSend.trim(),
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    const targetThreadId = activeThread.id;
    let boundThreadId = targetThreadId;

    let newTitle = activeThread.title;
    if (activeThread.messages.length === 0 || activeThread.title === 'New Session') {
      newTitle = promptToSend.trim().slice(0, 36) || 'Coding Task';
      if (promptToSend.trim().length > 36) newTitle += '...';
    }

    const baseMessages = overrideMessages || activeThread.messages;
    const updatedMessages = [...baseMessages, userMessage];

    // Placeholder assistant message for live token streaming
    const assistantMsgId = `msg_asst_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thinking: '',
      timestamp: Date.now(),
      modelUsed: activeThread.model,
      comparison: isComparingModels
        ? {
            modelA: {
              modelId: activeThread.model,
              modelName: getModelDisplayName(activeThread.model),
              content: '',
              thinking: '',
            },
            modelB: {
              modelId: secondaryModelId,
              modelName: getModelDisplayName(secondaryModelId),
              content: '',
              thinking: '',
            },
          }
        : undefined,
    };

    setThreads((prev) => {
      const exists = prev.some((t) => t.id === targetThreadId);
      if (exists) {
        return prev.map((t) =>
          t.id === targetThreadId
            ? {
                ...t,
                title: newTitle,
                messages: [...updatedMessages, initialAssistantMsg],
                messagesLoaded: true,
                updatedAt: Date.now(),
              }
            : t
        );
      }
      return [
        {
          ...activeThread,
          id: targetThreadId,
          title: newTitle,
          messages: [...updatedMessages, initialAssistantMsg],
          messagesLoaded: true,
          updatedAt: Date.now(),
        },
        ...prev,
      ];
    });

    setPrompt('');
    setAttachments([]);
    setShowSlashMenu(false);
    setGenerating(true);
    isNearBottomRef.current = true;
    scrollToBottom('smooth', true);

    const ctrl = new AbortController();
    setAbortController(ctrl);

    const authHeaders = getAuthHeaders(false);

    try {
      const response = await fetch('/api/user/studio/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          conversationId: targetThreadId.startsWith('thread_') ? undefined : targetThreadId,
          apiKeyId: selectedKeyId || undefined,
          model: activeThread.model,
          prompt: promptToSend.trim(),
          messages: baseMessages,
          systemPrompt: activeThread.systemPrompt,
          thinkingEnabled: activeThread.thinkingEnabled,
          tokenSaverEnabled: activeThread.tokenSaverEnabled,
          memoryEnabled: memoryEnabled,
          activeSkills: activeSkillIds,
          temperature: activeThread.temperature,
          attachments: userMessage.attachments || [],
          researchMode,
          targetUrl: targetUrlToAnalyze || undefined,
        }),
        signal: ctrl.signal,
      });

      let secondaryPromise: Promise<void> | null = null;
      if (isComparingModels) {
        secondaryPromise = (async () => {
          try {
            const secResponse = await fetch('/api/user/studio/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({
                conversationId: targetThreadId.startsWith('thread_') ? undefined : targetThreadId,
                apiKeyId: selectedKeyId || undefined,
                model: secondaryModelId,
                prompt: promptToSend.trim(),
                messages: baseMessages,
                systemPrompt: activeThread.systemPrompt,
                thinkingEnabled: activeThread.thinkingEnabled,
                tokenSaverEnabled: activeThread.tokenSaverEnabled,
                memoryEnabled: memoryEnabled,
                activeSkills: activeSkillIds,
                temperature: activeThread.temperature,
                attachments: userMessage.attachments || [],
              }),
              signal: ctrl.signal,
            });

            if (secResponse.ok && secResponse.body) {
              const secReader = secResponse.body.getReader();
              const secDecoder = new TextDecoder();
              let secBuffer = '';
              let secContent = '';
              let secThinking = '';

              while (true) {
                const { done, value } = await secReader.read();
                if (done) break;
                secBuffer += secDecoder.decode(value, { stream: true });
                const parts = secBuffer.split('\n\n');
                secBuffer = parts.pop() || '';

                for (const part of parts) {
                  const lines = part.split('\n');
                  let eventType = '';
                  let eventData = '';
                  for (const l of lines) {
                    if (l.startsWith('event:')) eventType = l.slice(6).trim();
                    if (l.startsWith('data:')) eventData = l.slice(5).trim();
                  }
                  if (!eventData) continue;
                  try {
                    const parsed = JSON.parse(eventData);
                    if (eventType === 'thinking_delta') {
                      secThinking += parsed.thinking || '';
                      setThreads((prev) =>
                        prev.map((t) =>
                          t.id === boundThreadId
                            ? {
                                ...t,
                                messages: t.messages.map((m) =>
                                  m.id === assistantMsgId && m.comparison
                                    ? {
                                        ...m,
                                        comparison: {
                                          ...m.comparison,
                                          modelB: {
                                            ...m.comparison.modelB,
                                            thinking: secThinking,
                                          },
                                        },
                                      }
                                    : m
                                ),
                              }
                            : t
                        )
                      );
                    } else if (eventType === 'content_delta') {
                      secContent += parsed.text || '';
                      setThreads((prev) =>
                        prev.map((t) =>
                          t.id === boundThreadId
                            ? {
                                ...t,
                                messages: t.messages.map((m) =>
                                  m.id === assistantMsgId && m.comparison
                                    ? {
                                        ...m,
                                        comparison: {
                                          ...m.comparison,
                                          modelB: {
                                            ...m.comparison.modelB,
                                            content: secContent,
                                          },
                                        },
                                      }
                                    : m
                                ),
                              }
                            : t
                        )
                      );
                    } else if (eventType === 'done') {
                      setThreads((prev) =>
                        prev.map((t) =>
                          t.id === boundThreadId
                            ? {
                                ...t,
                                messages: t.messages.map((m) =>
                                  m.id === assistantMsgId && m.comparison
                                    ? {
                                        ...m,
                                        comparison: {
                                          ...m.comparison,
                                          modelB: {
                                            ...m.comparison.modelB,
                                            content: parsed.result || secContent,
                                            thinking: parsed.thinking || secThinking || undefined,
                                            usage: parsed.usage,
                                            latencyMs: parsed.latencyMs,
                                          },
                                        },
                                      }
                                    : m
                                ),
                              }
                            : t
                        )
                      );
                    }
                  } catch {}
                }
              }
            }
          } catch (secErr) {
            console.warn('[SECONDARY STREAM ERROR]', secErr);
          }
        })();
      }

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        if (errorJson.error?.code === 'PRO_TIER_REQUIRED') {
          setUpgradeReason(errorJson.error.message);
          setShowUpgradeModal(true);
        }
        if (errorJson.error?.code === 'QUOTA_EXHAUSTED') {
          setKeyPickerOpen(true);
        }
        throw new Error(errorJson.error?.message || `Gateway error (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let accumulatedContent = '';
      let accumulatedThinking = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const parts = streamBuffer.split('\n\n');
          streamBuffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            let eventType = '';
            let eventData = '';

            for (const l of lines) {
              if (l.startsWith('event:')) eventType = l.slice(6).trim();
              if (l.startsWith('data:')) eventData = l.slice(5).trim();
            }

            if (!eventData) continue;
            try {
              const parsed = JSON.parse(eventData);

              if (eventType === 'session') {
                if (parsed.conversationId && parsed.conversationId !== boundThreadId) {
                  const newId = parsed.conversationId;
                  const oldId = boundThreadId;
                  boundThreadId = newId;

                  setThreads((prev) =>
                    prev.map((t) =>
                      t.id === oldId
                        ? {
                            ...t,
                            id: newId,
                            title: parsed.title || t.title,
                            messagesLoaded: true,
                            updatedAt: Date.now(),
                          }
                        : t
                    )
                  );
                  setActiveThreadId(newId);
                }
              } else if (eventType === 'thinking_delta') {
                accumulatedThinking += parsed.thinking || '';
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === boundThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId
                              ? m.comparison
                                ? {
                                    ...m,
                                    comparison: {
                                      ...m.comparison,
                                      modelA: {
                                        ...m.comparison.modelA,
                                        thinking: accumulatedThinking,
                                      },
                                    },
                                  }
                                : { ...m, thinking: accumulatedThinking }
                              : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'content_delta') {
                accumulatedContent += parsed.text || '';
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === boundThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId
                              ? m.comparison
                                ? {
                                    ...m,
                                    comparison: {
                                      ...m.comparison,
                                      modelA: {
                                        ...m.comparison.modelA,
                                        content: accumulatedContent,
                                      },
                                    },
                                  }
                                : { ...m, content: accumulatedContent }
                              : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'sources') {
                const receivedSources = parsed.sources || [];
                const inspectedUrl = parsed.inspectedUrl;
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === boundThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId
                              ? {
                                  ...m,
                                  sources: receivedSources,
                                  inspectedUrl: inspectedUrl || m.inspectedUrl,
                                  researchMode: parsed.researchMode || m.researchMode,
                                }
                              : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'activity') {
                const act: StudioActivityEvent = parsed;
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === boundThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId
                              ? {
                                  ...m,
                                  currentActivity: act,
                                  activities: [
                                    ...(m.activities || []).filter((a) => a.id !== act.id),
                                    act,
                                  ],
                                }
                              : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'done') {
                if (parsed.activeKey) {
                  setKeys((prev) =>
                    prev.map((k) =>
                      k.id === parsed.activeKey.id
                        ? { ...k, tokensRemaining: parsed.activeKey.tokensRemaining }
                        : k
                    )
                  );
                }
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === boundThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId
                              ? m.comparison
                                ? {
                                    ...m,
                                    sources: parsed.sources || m.sources,
                                    activities: parsed.activities || m.activities,
                                    comparison: {
                                      ...m.comparison,
                                      modelA: {
                                        ...m.comparison.modelA,
                                        content: parsed.result || accumulatedContent,
                                        thinking: parsed.thinking || accumulatedThinking || undefined,
                                        usage: parsed.usage,
                                        latencyMs: parsed.latencyMs,
                                      },
                                    },
                                  }
                                : {
                                    ...m,
                                    content: parsed.result || accumulatedContent,
                                    thinking: parsed.thinking || accumulatedThinking || undefined,
                                    sources: parsed.sources || m.sources,
                                    activities: parsed.activities || m.activities,
                                    usage: parsed.usage,
                                    latencyMs: parsed.latencyMs,
                                    multiplier: parsed.multiplier,
                                  }
                              : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'error') {
                throw new Error(parsed.message || 'Stream processing error.');
              }
            } catch (jsonErr: any) {
              if (jsonErr.message && !jsonErr.message.includes('JSON')) {
                throw jsonErr;
              }
            }
          }
        }
        if (secondaryPromise) {
          await secondaryPromise;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === boundThreadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content ? `${m.content}\n\n[⏹️ Generation stopped by user]` : '⏹️ Generation stopped by user.' }
                      : m
                  ),
                }
              : t
          )
        );
      } else {
        const errorMsg = err.message || 'Network stream error.';
        if (errorMsg.includes('QUOTA_EXHAUSTED') || errorMsg.includes('depleted')) {
          setKeyPickerOpen(true);
        }
        setThreads((prev) =>
          prev.map((t) =>
            t.id === boundThreadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: `⚠️ ${errorMsg}`, isError: true }
                      : m
                  ),
                }
              : t
          )
        );
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (activeThread.messages.length === 0 || generating) return;
    const lastUserIdx = [...activeThread.messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualIdx = activeThread.messages.length - 1 - lastUserIdx;
    const lastUserMsg = activeThread.messages[actualIdx];
    const previousMessages = activeThread.messages.slice(0, actualIdx);
    handleSendMessage(lastUserMsg.content, previousMessages);
  };

  // Retry after error
  const handleRetry = () => {
    handleRegenerate();
  };

  // Edit and resubmit previous prompt
  const handleEditSubmit = (msgId: string) => {
    if (!editContent.trim() || generating) return;
    const msgIdx = activeThread.messages.findIndex((m) => m.id === msgId);
    if (msgIdx === -1) return;
    const previousMessages = activeThread.messages.slice(0, msgIdx);
    setEditingMsgId(null);
    handleSendMessage(editContent.trim(), previousMessages);
  };

  // Calculate remaining tokens from active key
  const activeKey = keys.find((k) => k.id === selectedKeyId) || keys[0];
  const remainingTokens = activeKey ? BigInt(activeKey.tokensRemaining || 0) : 0n;
  const isTrialKey = activeKey?.type === 'trial' || activeKey?.plan === 'Free Trial';
  const remainingTokensM = (Number(remainingTokens) / 1000000).toFixed(2);
  const remainingTokensDisplay = useMemo(() => {
    const num = Number(remainingTokens);
    if (num <= 0) return '0';
    if (num < 1000000) return `${Math.round(num / 1000)}k`;
    return `${(num / 1000000).toFixed(2)}M`;
  }, [remainingTokens]);

  // Token Intelligence metrics for active thread & draft input
  const threadTokenStats = useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    let savingsTokens = 0;

    for (const msg of activeThread.messages) {
      if (msg.usage) {
        inputTokens += msg.usage.input_tokens || 0;
        outputTokens += msg.usage.output_tokens || 0;
        savingsTokens += msg.usage.savings_tokens || msg.usage.estimated_savings_tokens || 0;
      }
    }

    const estimatedDraftTokens = Math.ceil((inputMessage.trim().length || 0) / 4);
    const totalContextTokens = inputTokens + outputTokens + estimatedDraftTokens;
    const contextLimit = activeModelMeta?.contextWindow || 200000;
    const contextPercent = Math.min(100, Number(((totalContextTokens / contextLimit) * 100).toFixed(1)));

    return {
      inputTokens,
      outputTokens,
      totalContextTokens,
      savingsTokens,
      contextLimit,
      contextPercent,
      estimatedDraftTokens,
    };
  }, [activeThread.messages, inputMessage, activeModelMeta]);

  // Style Tokens & Palettes - Studio Light Style & Obsidian Dark
  const c = {
    bg: isDark ? 'bg-[#0B1020]' : 'bg-[#FAF9F6]',
    text: isDark ? 'text-[#F3F5FC]' : 'text-[#111827]',
    textSecondary: isDark ? 'text-[#A5B0C7]' : 'text-[#374151]',
    textMuted: isDark ? 'text-[#77839E]' : 'text-[#6b7280]',
    headerBg: isDark
      ? 'bg-[#0E1425]/95 border-b border-[#28334B]'
      : 'bg-white/95 border-b border-[#E5E7EB] shadow-2xs',
    sidebarBg: isDark ? 'bg-[#0E1425]' : 'bg-[#F9FAFB]',
    sidebarBorder: isDark ? 'border-[#28334B]' : 'border-[#E5E7EB]',
    cardBg: isDark ? 'bg-[#141C30]' : 'bg-[#FFFFFF]',
    elevatedBg: isDark ? 'bg-[#19233A]' : 'bg-[#F3F4F6]',
    border: isDark ? 'border-[#28334B]' : 'border-[#E5E7EB]',
    borderSubtle: isDark ? 'border-[#28334B]/60' : 'border-[#F3F4F6]',
    inputBg: isDark ? 'bg-[#141C30]' : 'bg-[#FFFFFF]',
    pillBg: isDark
      ? 'bg-[#19233A] border-[#28334B] text-[#A5B0C7] hover:text-[#F3F5FC] hover:border-violet-500/40'
      : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#1F2937] hover:text-[#111827] hover:border-violet-400 hover:bg-[#EEF2F6]',
    userBubble: isDark
      ? 'bg-[#19233A] border border-violet-500/30 text-[#F3F5FC] shadow-sm'
      : 'bg-[#F5F3FF] border border-[#DDD6FE] text-[#111827] shadow-2xs',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full min-h-0 flex flex-col overflow-hidden font-sans ${isDark ? 'dark' : ''} ${c.bg} ${c.text}`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-violet-500 p-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center mb-4 animate-bounce">
            <Paperclip className="w-8 h-8 text-violet-300" />
          </div>
          <h3 className="text-lg font-bold mb-1">Drop Documents or Images Here</h3>
          <p className="text-xs text-slate-300 font-mono">
            Claude will inspect PDFs, code, screenshots, spreadsheets, or design assets.
          </p>
        </div>
      )}

      {/* Main Studio Midnight Aurora Header */}
      <header className={`h-14 px-3 sm:px-4 ${c.headerBg} flex items-center justify-between shrink-0 text-xs z-20 backdrop-blur-md sticky top-0 gap-2`}>
        {/* Left: Sidebar Toggle, Editable Session Title, Project Pill, Command Bar */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${c.pillBg} shrink-0`}
            title={sidebarOpen ? 'Collapse Sessions Sidebar' : 'Expand Sessions Sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-violet-400" /> : <PanelLeft className="w-4 h-4 text-violet-400" />}
          </button>

          {/* Session Title (Inline Editable) */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-[200px] sm:max-w-[280px] md:max-w-[360px]">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={headerTitleText}
                onChange={(e) => setHeaderTitleText(e.target.value)}
                onBlur={() => {
                  if (headerTitleText.trim() && headerTitleText.trim() !== activeThread.title) {
                    setRenameText(headerTitleText.trim());
                    handleSaveRename(activeThread.id);
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (headerTitleText.trim() && headerTitleText.trim() !== activeThread.title) {
                      setRenameText(headerTitleText.trim());
                      handleSaveRename(activeThread.id);
                    }
                    setIsEditingTitle(false);
                  }
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className={`text-xs font-semibold px-2 py-0.5 rounded border border-violet-500 focus:outline-none w-full ${
                  isDark ? 'bg-[#19233A] text-white' : 'bg-white text-slate-900'
                }`}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setHeaderTitleText(activeThread.title);
                  setRenameText(activeThread.title);
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-1.5 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
                title="Click to rename session"
              >
                <span className={`font-semibold text-xs sm:text-sm truncate ${c.text}`}>
                  {activeThread.title}
                </span>
                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0 text-violet-400" />
              </button>
            )}

            {/* Active Project Pill */}
            {activeThread.projectId && projects.find((p) => p.id === activeThread.projectId) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId(activeThread.projectId || null);
                  setProjectModalOpen(true);
                }}
                className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md border border-violet-500/30 bg-violet-500/10 text-violet-400 font-medium text-[11px] hover:bg-violet-500/20 transition-all shrink-0 cursor-pointer"
                title="Active Project: Click for settings"
              >
                <Folder className="w-3 h-3 text-violet-400" />
                <span className="truncate max-w-[100px]">
                  {projects.find((p) => p.id === activeThread.projectId)?.name}
                </span>
              </button>
            )}
          </div>

          {/* Quick Search Command Bar (⌘K) */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs cursor-pointer shadow-2xs ${c.pillBg}`}
            title="Search & Commands (⌘K)"
          >
            <Search className={`w-3.5 h-3.5 ${isDark ? 'text-violet-400' : 'text-violet-700'}`} />
            <span className={`text-[11px] ${c.textMuted}`}>Search...</span>
            <kbd className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${isDark ? 'bg-black/30 border-[#28334B] text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-700 font-bold'}`}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Model Selector Pill, Context Meter, API Key Pill, Tools Menu ▾, Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Model Selector Pill */}
          <button
            type="button"
            onClick={() => setModelPickerOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer shadow-2xs ${
              isDark
                ? 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300'
                : 'border-violet-200 bg-violet-100 hover:bg-violet-200 text-violet-950 font-bold'
            }`}
            title="Change AI model & inspect capabilities"
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-violet-400' : 'text-violet-700'}`} />
            <span className="truncate max-w-[120px] sm:max-w-none">{getModelDisplayName(activeThread.model)}</span>
            {activeModelMeta?.supportsThinking && (
              <span className={`hidden xl:inline text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                Thinking
              </span>
            )}
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Context Meter Gauge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono ${c.pillBg}`}
            title={`Context Window: ${threadTokenStats.totalContextTokens.toLocaleString()} of ${threadTokenStats.contextLimit.toLocaleString()} tokens (${threadTokenStats.contextPercent}%)`}
          >
            <div className="w-10 sm:w-14 h-1.5 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  threadTokenStats.contextPercent > 80
                    ? 'bg-rose-500'
                    : threadTokenStats.contextPercent > 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, threadTokenStats.contextPercent))}%` }}
              />
            </div>
            <span className={threadTokenStats.contextPercent > 80 ? 'text-rose-400 font-bold' : c.textSecondary}>
              {threadTokenStats.contextPercent}%
            </span>
          </div>

          {/* API Key Selector Pill */}
          <button
            type="button"
            onClick={() => setKeyPickerOpen(true)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              Number(remainingTokens) <= 0
                ? isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200 font-bold'
                : isDark
                ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/50'
                : 'bg-emerald-100/80 text-emerald-950 border-emerald-300 hover:bg-emerald-200/80 font-bold'
            }`}
            title="Active API key and token quota"
          >
            <Key className="w-3 h-3 opacity-80" />
            <span className="font-sans font-semibold max-w-[80px] truncate text-[11px]">
              {keys.length === 0 ? 'No Key' : activeKey?.name || activeKey?.displayKey || 'API Key'}
            </span>
            <span className="opacity-40">|</span>
            <span className="font-bold text-[11px]">
              {remainingTokensDisplay}
            </span>
          </button>

          {/* Consolidated Tools Menu ▾ */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                toolsMenuOpen ? 'bg-violet-600 text-white border-violet-500 shadow-xs' : c.pillBg
              }`}
              title="Studio Advanced Tools & Settings"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isDark ? 'text-violet-400' : 'text-violet-700'}`} />
              <span className="hidden sm:inline">Tools</span>
              {(activeThread.thinkingEnabled || activeThread.tokenSaverEnabled || activeArtifact) && (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Tools Dropdown Flyout */}
            {toolsMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setToolsMenuOpen(false)} />
                <div className={`absolute right-0 mt-2 z-40 w-80 max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl p-2.5 space-y-2.5 ${c.cardBg} ${c.border} animate-fadeIn`}>
                  {/* Category 1: Write & Create */}
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center justify-between">
                      <span>Write & Create</span>
                      <Sparkles className="w-3 h-3 opacity-60" />
                    </div>

                    {/* Document Generator */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setIsDocGenOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-semibold flex items-center gap-1.5">
                            <span>Document Generator</span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Word/Excel/PDF
                            </span>
                          </p>
                          <p className={`text-[10px] ${c.textMuted}`}>OpenXML .docx, .xlsx & vector PDF</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Open
                      </span>
                    </button>

                    {/* Media Generation Studio */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setIsMediaGenOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="font-semibold">Media Generation</p>
                          <p className={`text-[10px] ${c.textMuted}`}>Aspect ratios & vector synthesis</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        Studio
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-black/5 dark:border-white/5" />

                  {/* Category 2: Analyze */}
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>Analyze</span>
                      <Search className="w-3 h-3 opacity-60" />
                    </div>

                    {/* Web Search & Research Mode */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextMode = researchMode === 'web_search' ? 'standard' : 'web_search';
                        setResearchMode(nextMode);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className={`w-4 h-4 ${researchMode === 'web_search' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold flex items-center gap-1.5">
                            <span>Web Search</span>
                            {researchMode === 'web_search' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          </p>
                          <p className={`text-[10px] ${c.textMuted}`}>Live citations & search grounding</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        researchMode === 'web_search' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-black/10 dark:bg-white/10 text-slate-400'
                      }`}>
                        {researchMode === 'web_search' ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Document & Vision Upload */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold">Document & Vision Upload</p>
                          <p className={`text-[10px] ${c.textMuted}`}>PDF, Word, Code, or Images</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-400">
                        Upload
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-black/5 dark:border-white/5" />

                  {/* Category 3: Build */}
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      <span>Build</span>
                      <Layers className="w-3 h-3 opacity-60" />
                    </div>

                    {/* Interactive Artifact Canvas Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        if (activeArtifact) {
                          setActiveArtifact(null);
                        } else {
                          setActiveArtifact({
                            id: 'studio_canvas',
                            title: 'Interactive Studio Canvas',
                            language: 'html',
                            code: `<div style="font-family:system-ui;padding:24px;text-align:center;">\n  <h2 style="color:#7C3AED;margin-bottom:8px;">Live Sandboxed Preview</h2>\n  <p style="color:#625F5A;font-size:14px;">Any code or visual output generated by Claude is rendered live here in real time.</p>\n</div>`,
                            type: 'html',
                          });
                        }
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-semibold">Artifact Canvas</p>
                          <p className={`text-[10px] ${c.textMuted}`}>{activeArtifact ? 'Panel currently open' : 'Open sandbox viewer'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeArtifact ? 'bg-blue-500/20 text-blue-500' : 'bg-black/10 dark:bg-white/10 text-slate-400'
                      }`}>
                        {activeArtifact ? 'Open' : 'View'}
                      </span>
                    </button>

                    {/* Workspace Skills Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setIsSkillsModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="font-semibold">Agent Skills</p>
                          <p className={`text-[10px] ${c.textMuted}`}>{activeSkillIds.length} skills enabled</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        {activeSkillIds.length}
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-black/5 dark:border-white/5" />

                  {/* Category 4: Manage */}
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                      <span>Manage</span>
                      <SlidersHorizontal className="w-3 h-3 opacity-60" />
                    </div>

                    {/* Thinking Mode Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeModelMeta?.supportsThinking) {
                          alert(`Extended Thinking is not supported by ${activeModelMeta?.name || 'this model'}. Select Claude 3.7 Sonnet or Claude Sonnet 5.5 to enable Thinking.`);
                          return;
                        }
                        updateActiveThread({ thinkingEnabled: !activeThread.thinkingEnabled });
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        !activeModelMeta?.supportsThinking ? 'opacity-40 cursor-not-allowed' : 'hover:bg-violet-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Brain className={`w-4 h-4 ${activeThread.thinkingEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold flex items-center gap-1.5">
                            <span>Thinking Mode</span>
                            {activeThread.thinkingEnabled && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          </p>
                          <p className={`text-[10px] ${c.textMuted}`}>Extended deliberative reasoning</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeThread.thinkingEnabled ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'bg-black/10 dark:bg-white/10 text-slate-400'
                      }`}>
                        {activeThread.thinkingEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Token-Saver Optimization Toggle */}
                    <button
                      type="button"
                      onClick={() => updateActiveThread({ tokenSaverEnabled: !activeThread.tokenSaverEnabled })}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className={`w-4 h-4 ${activeThread.tokenSaverEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold flex items-center gap-1.5">
                            <span>Token-Saver</span>
                            {activeThread.tokenSaverEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          </p>
                          <p className={`text-[10px] ${c.textMuted}`}>Optimized diffs & concise tokens</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeThread.tokenSaverEnabled ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-black/10 dark:bg-white/10 text-slate-400'
                      }`}>
                        {activeThread.tokenSaverEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Contextual Memory Preferences */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setContextManagerOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Brain className="w-4 h-4 text-violet-500" />
                        <div>
                          <p className="font-semibold">Contextual Memory</p>
                          <p className={`text-[10px] ${c.textMuted}`}>{userMemories.length} active preferences</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        Preferences
                      </span>
                    </button>

                    {/* Guided Onboarding Walkthrough */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setIsOnboardingOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Compass className="w-4 h-4 text-indigo-500" />
                        <div>
                          <p className="font-semibold">Onboarding Tour</p>
                          <p className={`text-[10px] ${c.textMuted}`}>Replay 6-step walkthrough</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        Tour
                      </span>
                    </button>

                    {/* Conversation Export Options */}
                    {activeThread.messages.length > 0 && (
                      <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1">
                        <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Export Session
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setToolsMenuOpen(false);
                              handleExportThread('markdown');
                            }}
                            className={`py-1 rounded-lg text-center text-[10px] font-semibold border ${c.pillBg} hover:border-violet-500/50 cursor-pointer`}
                          >
                            .MD
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setToolsMenuOpen(false);
                              handleExportThread('json');
                            }}
                            className={`py-1 rounded-lg text-center text-[10px] font-semibold border ${c.pillBg} hover:border-violet-500/50 cursor-pointer`}
                          >
                            .JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setToolsMenuOpen(false);
                              handleExportThread('text');
                            }}
                            className={`py-1 rounded-lg text-center text-[10px] font-semibold border ${c.pillBg} hover:border-violet-500/50 cursor-pointer`}
                          >
                            .TXT
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Studio Guide Help Button */}
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${c.pillBg}`}
            title="Getting Started & Capability Guide (?)"
          >
            <HelpCircle className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${c.pillBg}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Studio Body: Sessions Sidebar + Chat Column + Artifact Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative w-full">
        {/* Left: Collapsible Sessions Sidebar */}
        {sidebarOpen && (
          <aside className={`w-64 sm:w-72 border-r ${c.sidebarBorder} ${c.sidebarBg} flex flex-col shrink-0 h-full overflow-hidden text-xs`}>
            {/* 1. CREATE SECTION */}
            <div className="p-3 border-b border-black/5 dark:border-white/5 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 px-1">
                <span>Create</span>
                <Sparkles className="w-3 h-3 opacity-60" />
              </div>
              <button
                type="button"
                onClick={() => handleCreateNewThread()}
                className="w-full py-2.5 px-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Chat</span>
              </button>

              {/* Quick Starters */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsDocGenOpen(true)}
                  className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer ${c.pillBg}`}
                  title="Generate Word, Excel or PDF document"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMediaGenOpen(true)}
                  className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer ${c.pillBg}`}
                  title="Open Media Studio"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">Media</span>
                </button>
              </div>
            </div>

            {/* 2. WORKSPACE & LIBRARY SECTION */}
            <div className="p-2.5 border-b border-black/5 dark:border-white/5 shrink-0 space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                  <FolderKanban className="w-3 h-3 text-violet-500" />
                  <span>Workspace</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveView(false);
                      setSidebarSection('workspace');
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                      !archiveView
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveView(true);
                      setSidebarSection('library');
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                      archiveView
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
                    }`}
                  >
                    Library ({threads.filter((t) => t.archived).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${c.textMuted}`} />
                <input
                  type="text"
                  placeholder={archiveView ? "Search archived library..." : "Search chats & projects..."}
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-[#D8D2C5] text-slate-900 placeholder:text-slate-500 shadow-2xs'
                  }`}
                />
              </div>

              {/* Projects Collapsible Tree */}
              {!archiveView && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Folder className="w-3 h-3 text-violet-400" />
                      <span>Projects</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setProjectModalOpen(true)}
                      className="hover:text-violet-500 p-0.5 rounded cursor-pointer"
                      title="Create or manage projects"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* All Chats Option */}
                  <div
                    onClick={() => setSelectedProjectId(null)}
                    className={`px-2 py-1.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      selectedProjectId === null
                        ? 'bg-violet-600/15 text-violet-700 dark:text-violet-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-400 hover:bg-[#EAE4DC] dark:hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate">All Conversations</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">
                      {threads.filter((t) => !t.archived).length}
                    </span>
                  </div>

                  {/* Project Folders */}
                  {projects.map((proj) => {
                    const isSelected = selectedProjectId === proj.id;
                    const count = threads.filter((t) => t.projectId === proj.id && !t.archived).length;
                    return (
                      <div key={proj.id} className="space-y-0.5">
                        <div
                          onClick={() => setSelectedProjectId(proj.id)}
                          className={`px-2 py-1.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-violet-600/15 text-violet-700 dark:text-violet-200 font-semibold'
                              : 'text-slate-700 dark:text-slate-400 hover:bg-[#EAE4DC] dark:hover:bg-white/5 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: proj.color || '#8b5cf6' }}
                            />
                            <span className="truncate">{proj.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-mono opacity-60">{count}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateNewThread(proj.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-violet-500"
                              title="New chat in this project"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="pl-6 pb-1">
                            <button
                              type="button"
                              onClick={() => setProjectModalOpen(true)}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 text-violet-500 dark:text-violet-300 border border-violet-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span>Project Settings</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Library Quick Generator Pill */}
              {archiveView && (
                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-violet-500" />
                    <div>
                      <p className="font-bold text-[11px] text-violet-700 dark:text-violet-300">File Deliverables</p>
                      <p className="text-[10px] opacity-75">Word, Excel, PDF & CSV</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDocGenOpen(true)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-violet-600 text-white hover:bg-violet-700 cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
              )}
            </div>

            {/* Thread List with Date Grouping */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3 overscroll-contain">
              {/* Group: Pinned */}
              {groupedThreads.pinned.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                  </p>
                  {groupedThreads.pinned.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Today */}
              {groupedThreads.today.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                    Today
                  </p>
                  {groupedThreads.today.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Yesterday */}
              {groupedThreads.yesterday.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                    Yesterday
                  </p>
                  {groupedThreads.yesterday.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Previous 7 Days */}
              {groupedThreads.previous7Days.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                    Previous 7 Days
                  </p>
                  {groupedThreads.previous7Days.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Older */}
              {groupedThreads.older.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                    Older
                  </p>
                  {groupedThreads.older.map((t) => renderThreadRow(t))}
                </div>
              )}

              {threads.length === 0 && (
                <div className="p-4 text-center text-slate-400">
                  <p>No conversations yet.</p>
                </div>
              )}
            </div>

            {/* Sidebar Footer with Token Context Meter & API Key Switcher */}
            <div className={`p-3 border-t ${c.sidebarBorder} text-[11px] shrink-0 space-y-2`}>
              <div className="flex items-center justify-between font-mono">
                <button
                  type="button"
                  onClick={() => setKeyPickerOpen(true)}
                  className="flex items-center gap-1.5 hover:text-violet-500 transition-colors cursor-pointer text-left truncate max-w-[140px]"
                  title="Switch API Key"
                >
                  <Key className="w-3 h-3 text-violet-500 shrink-0" />
                  <span className="font-sans font-semibold truncate text-[11px]">
                    {keys.length === 0 ? 'No Key' : activeKey?.name || activeKey?.displayKey || 'API Key'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setKeyPickerOpen(true)}
                  className={`font-semibold cursor-pointer px-1.5 py-0.5 rounded text-[10px] ${
                    Number(remainingTokens) <= 0
                      ? 'bg-rose-500/20 text-rose-500 font-bold'
                      : 'text-violet-500 hover:underline'
                  }`}
                  title="Switch API Key"
                >
                  {keys.length === 0 ? 'No Key' : Number(remainingTokens) <= 0 ? 'Switch Key' : `${remainingTokensM}M`}
                </button>
              </div>
              <div
                className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden cursor-pointer"
                onClick={() => setKeyPickerOpen(true)}
                title="Click to switch API key"
              >
                <div
                  className={`h-full transition-all ${
                    Number(remainingTokens) <= 0
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, (Number(remainingTokens) / 5000000) * 100))}%` }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Center: Main Conversational Column */}
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden relative min-w-0">
          {/* Scrollable Message Area */}
          <div
            ref={chatScrollContainerRef}
            onScroll={handleChatScroll}
            className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 overscroll-contain"
          >
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Phase 2.3 New Chat Landing State */}
              {activeThread.messages.length === 0 && !generating && (
                <div className="py-6 sm:py-10 text-center space-y-6">
                  {/* Inline Dismissible Onboarding Guide */}
                  {isOnboardingOpen && (
                    <StudioOnboardingGuide
                      open={isOnboardingOpen}
                      onClose={() => {
                        localStorage.setItem('lightning_studio_onboarding_completed_v2', 'true');
                        setIsOnboardingOpen(false);
                      }}
                      isDarkTheme={isDark}
                      isInline={true}
                      onSelectPrompt={(p) => {
                        setPrompt(p);
                        textareaRef.current?.focus();
                      }}
                    />
                  )}

                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                    <Sparkles className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5 max-w-xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      What are we building today?
                    </h2>
                    <p className={`text-xs sm:text-sm leading-relaxed ${c.textMuted}`}>
                      Ask a coding question, analyze documents, preview UI components live, or draft full-stack projects.
                    </p>
                  </div>

                  {/* 5 Functional Suggested Prompt Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left max-w-3xl mx-auto pt-1">
                    {STARTING_WORKFLOW_CARDS.map((card, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrompt(card.prompt);
                          textareaRef.current?.focus();
                        }}
                        className={`p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                          isDark ? 'bg-[#141C30] border-[#28334B] hover:border-violet-500/50 hover:bg-[#19233A]' : 'bg-white border-[#E5E7EB] hover:border-violet-500 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isDark
                              ? 'bg-[#19233A] border-[#28334B] text-violet-300'
                              : 'bg-violet-50 border-violet-200 text-violet-900 font-semibold'
                          }`}>
                            {card.category}
                          </span>
                          <card.icon className="w-4 h-4 text-violet-500 transition-transform group-hover:scale-110" />
                        </div>
                        <h4 className="text-xs font-bold mb-1 text-slate-900 dark:text-white">{card.title}</h4>
                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                          isDark ? 'text-[#77839E]' : 'text-slate-600 font-normal'
                        }`}>
                          {card.prompt}
                        </p>
                      </button>
                    ))}
                  </div>

                  {!isOnboardingOpen && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsOnboardingOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>View Studio guide & capabilities</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Message List */}
              {activeThread.messages.map((msg, idx) => {
                if (msg.role === 'system') {
                  return (
                    <div
                      key={msg.id || idx}
                      className="my-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 text-xs text-violet-700 dark:text-violet-300 font-mono flex items-start gap-2.5"
                    >
                      <Zap className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <div className="flex-1 whitespace-pre-wrap leading-relaxed text-[11px]">
                        {msg.content}
                      </div>
                      {activeThread.uncompressedBackup && activeThread.uncompressedBackup.length > 0 && (
                        <button
                          type="button"
                          onClick={handleRestoreContext}
                          className="px-2.5 py-1 text-[10px] font-sans font-semibold rounded-lg bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                          title="Restore original uncompressed conversation history"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo Compression</span>
                        </button>
                      )}
                    </div>
                  );
                }
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || idx} className="space-y-2">
                    {isUser ? (
                      /* User Message Bubble */
                      <div className="flex justify-end items-start gap-2.5">
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs space-y-2 ${c.userBubble}`}>
                          {/* Attachments preview */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.attachments.map((att, aIdx) => (
                                <div
                                  key={aIdx}
                                  className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 font-mono"
                                >
                                  {att.type === 'document' ? (
                                    <FileText className="w-3 h-3 text-red-300" />
                                  ) : (
                                    <ImageIcon className="w-3 h-3 text-violet-200" />
                                  )}
                                  <span className="truncate max-w-[150px]">{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Text Body / Edit Mode */}
                          {editingMsgId === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-2 bg-black/20 rounded-lg text-xs text-white focus:outline-none resize-none"
                                rows={3}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="px-2 py-1 text-[10px] rounded bg-white/20 hover:bg-white/30"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditSubmit(msg.id)}
                                  className="px-2 py-1 text-[10px] rounded bg-white text-violet-700 font-bold"
                                >
                                  Resubmit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
                              {msg.content}
                            </p>
                          )}

                          {/* User action bar */}
                          <div className="flex items-center justify-end gap-2 text-[10px] opacity-70 hover:opacity-100 transition-opacity font-mono pt-1">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditContent(msg.content);
                              }}
                              className="hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="Edit and resubmit"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs select-none">
                          U
                        </div>
                      </div>
                    ) : msg.comparison ? (
                      /* Side-by-Side Model Comparison Dual Column View */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs px-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Model Comparison Mode</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                              {msg.comparison.modelA.modelName} vs {msg.comparison.modelB.modelName}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Column A: Primary Model */}
                          <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${c.cardBg} ${c.border}`}>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-[10px]">
                                    A
                                  </div>
                                  <span className="font-bold text-xs">{msg.comparison.modelA.modelName}</span>
                                </div>
                                {msg.comparison.modelA.latencyMs ? (
                                  <span className={`text-[10px] font-mono ${c.textMuted}`}>
                                    {msg.comparison.modelA.latencyMs}ms
                                  </span>
                                ) : null}
                              </div>

                              {msg.comparison.modelA.thinking && (
                                <details className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
                                  <summary className="font-semibold text-amber-600 dark:text-amber-400 cursor-pointer select-none text-[11px]">
                                    Reasoning Process
                                  </summary>
                                  <div className="mt-1 text-[11px] font-mono whitespace-pre-wrap">
                                    {msg.comparison.modelA.thinking}
                                  </div>
                                </details>
                              )}

                              <div>
                                {msg.comparison.modelA.content ? (
                                  <MarkdownBlock content={msg.comparison.modelA.content} />
                                ) : (
                                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2 font-mono">
                                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                    <span>Generating {msg.comparison.modelA.modelName}...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                {msg.comparison.modelA.usage?.total_tokens
                                  ? `${msg.comparison.modelA.usage.total_tokens.toLocaleString()} tokens`
                                  : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectComparisonBranch(msg.id, 'modelA')}
                                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                Select this answer
                              </button>
                            </div>
                          </div>

                          {/* Column B: Secondary Model */}
                          <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${c.cardBg} ${c.border}`}>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                                    B
                                  </div>
                                  <span className="font-bold text-xs">{msg.comparison.modelB.modelName}</span>
                                </div>
                                {msg.comparison.modelB.latencyMs ? (
                                  <span className={`text-[10px] font-mono ${c.textMuted}`}>
                                    {msg.comparison.modelB.latencyMs}ms
                                  </span>
                                ) : null}
                              </div>

                              {msg.comparison.modelB.thinking && (
                                <details className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
                                  <summary className="font-semibold text-amber-600 dark:text-amber-400 cursor-pointer select-none text-[11px]">
                                    Reasoning Process
                                  </summary>
                                  <div className="mt-1 text-[11px] font-mono whitespace-pre-wrap">
                                    {msg.comparison.modelB.thinking}
                                  </div>
                                </details>
                              )}

                              <div>
                                {msg.comparison.modelB.content ? (
                                  <MarkdownBlock content={msg.comparison.modelB.content} />
                                ) : (
                                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2 font-mono">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span>Generating {msg.comparison.modelB.modelName}...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                {msg.comparison.modelB.usage?.total_tokens
                                  ? `${msg.comparison.modelB.usage.total_tokens.toLocaleString()} tokens`
                                  : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectComparisonBranch(msg.id, 'modelB')}
                                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                Select this answer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message Bubble */
                      <div className="space-y-2">
                        {/* Assistant Header */}
                        <div className="flex items-center justify-between text-xs px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs">
                              {getModelDisplayName(msg.modelUsed || activeThread.model)}
                            </span>
                            {msg.latencyMs ? (
                              <span className={`text-[10px] font-mono ${c.textMuted}`}>
                                {msg.latencyMs}ms
                              </span>
                            ) : null}
                            {msg.usage ? (
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => setActiveTelemetryMsgId(activeTelemetryMsgId === msg.id ? null : msg.id)}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                                    isDark
                                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
                                      : 'bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100 font-semibold'
                                  }`}
                                  title="View verified token telemetry"
                                >
                                  <Zap className="w-2.5 h-2.5" />
                                  <span>{msg.usage.total_tokens.toLocaleString()} tokens</span>
                                  {msg.latencyMs ? <span>• {(msg.latencyMs / 1000).toFixed(1)}s</span> : null}
                                  <span className="text-[9px] uppercase px-1 rounded bg-teal-500/20 text-teal-300">
                                    {msg.usage.usage_source === 'PROVIDER_REPORTED' ? 'Verified' : 'Tracked'}
                                  </span>
                                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${activeTelemetryMsgId === msg.id ? 'rotate-180' : ''}`} />
                                </button>

                                {activeTelemetryMsgId === msg.id && (
                                  <div className={`absolute left-0 mt-1.5 z-30 w-64 p-3 rounded-2xl shadow-2xl text-[11px] font-sans space-y-1.5 animate-fadeIn ${c.cardBg} ${c.border}`}>
                                    <div className="flex items-center justify-between pb-1 border-b border-black/10 dark:border-slate-800">
                                      <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        <Activity className="w-3 h-3 text-teal-400" />
                                        <span>Token Telemetry</span>
                                      </span>
                                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                        {msg.usage.usage_source || 'PROVIDER_REPORTED'}
                                      </span>
                                    </div>

                                    <div className={`space-y-1 font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400 font-sans">Input tokens:</span>
                                        <span>{msg.usage.input_tokens.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400 font-sans">Output tokens:</span>
                                        <span>{msg.usage.output_tokens.toLocaleString()}</span>
                                      </div>
                                      {Boolean(msg.usage.reasoning_tokens) && (
                                        <div className="flex justify-between text-amber-400">
                                          <span className="font-sans">Reasoning:</span>
                                          <span>{msg.usage.reasoning_tokens?.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {Boolean(msg.usage.cached_tokens) && (
                                        <div className="flex justify-between text-teal-400">
                                          <span className="font-sans">Cached:</span>
                                          <span>{msg.usage.cached_tokens?.toLocaleString()}</span>
                                        </div>
                                      )}
                                      <div className={`flex justify-between pt-1 border-t border-black/10 dark:border-slate-800 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        <span className="font-sans">Total:</span>
                                        <span>{msg.usage.total_tokens.toLocaleString()}</span>
                                      </div>
                                      {msg.multiplier && msg.multiplier !== 1 && (
                                        <div className="flex justify-between text-violet-400">
                                          <span className="font-sans">Multiplier:</span>
                                          <span>{msg.multiplier}x</span>
                                        </div>
                                      )}
                                      {msg.latencyMs && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 font-sans">Duration:</span>
                                          <span>{msg.latencyMs}ms</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1 text-xs">
                            {/* Read aloud TTS */}
                            <button
                              type="button"
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                speakingMsgId === msg.id ? 'bg-violet-600 text-white border-violet-500' : c.pillBg
                              }`}
                              title={speakingMsgId === msg.id ? 'Stop Speaking' : 'Read Aloud'}
                            >
                              {speakingMsgId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            </button>

                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(msg.content)}
                              className={`p-1 rounded-md border transition-colors cursor-pointer ${c.pillBg}`}
                              title="Copy Message"
                            >
                              <Copy className="w-3 h-3" />
                            </button>

                            {/* Regenerate if last assistant message */}
                            {idx === activeThread.messages.length - 1 && (
                              <button
                                type="button"
                                onClick={handleRegenerate}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${c.pillBg}`}
                                title="Regenerate Response"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Deliberative Reasoning Trace (collapsed by default) */}
                        {msg.thinking ? (
                          <details className={`rounded-xl border p-3 text-xs ${
                            isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
                          }`}>
                            <summary className="font-semibold text-amber-700 dark:text-amber-400 cursor-pointer flex items-center gap-1.5 select-none">
                              <Brain className="w-3.5 h-3.5" />
                              <span>Deliberative Reasoning Summary (~{Math.ceil(msg.thinking.length / 4).toLocaleString()} est. tokens)</span>
                            </summary>
                            <div className="mt-2 text-[11.5px] font-mono leading-relaxed whitespace-pre-wrap opacity-90 border-t border-amber-500/20 pt-2">
                              {msg.thinking}
                            </div>
                          </details>
                        ) : null}

                        {/* Context-Aware Live Activity during research / pre-generation */}
                        {(Boolean(msg.currentActivity) || Boolean(msg.activities && msg.activities.length > 0) || (generating && idx === activeThread.messages.length - 1)) && !msg.content && (
                          <div className="mb-3">
                            <ContextActivityPanel
                              activities={msg.activities}
                              currentActivity={msg.currentActivity}
                              isStreaming={generating && idx === activeThread.messages.length - 1}
                              hasContent={Boolean(msg.content)}
                              isDarkTheme={isDark}
                            />
                          </div>
                        )}

                        {/* 1. Assistant Direct Answer (PART 4.1: Streamed directly into conversation with inline citations) */}
                        <div className={`p-4 rounded-2xl border shadow-2xs mb-3 ${c.cardBg} ${c.border}`}>
                          {msg.content ? (
                            <MarkdownBlock content={msg.content} sources={msg.sources} />
                          ) : !msg.currentActivity && !(msg.activities && msg.activities.length > 0) ? (
                            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 font-mono">
                              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                              <span>
                                {msg.thinking ? 'Thinking through solution...' : 'Preparing response...'}
                              </span>
                            </div>
                          ) : null}

                          {msg.isError && (
                            <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs text-rose-500">Request failed or limit reached.</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setKeyPickerOpen(true)}
                                  className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                                  title="Switch to another active API key"
                                >
                                  <Key className="w-3 h-3" />
                                  <span>Switch Key</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRetry}
                                  className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Retry</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Grounded Web Research Sources (PART 4.2 & 4.3: Compact drawer BELOW the answer) */}
                        {(Boolean(msg.sources && msg.sources.length > 0) || Boolean(msg.inspectedUrl)) && (
                          <WebResearchSources
                            sources={msg.sources || []}
                            researchMode={msg.researchMode}
                            inspectedUrl={msg.inspectedUrl}
                            isDarkTheme={isDark}
                            defaultExpanded={false}
                          />
                        )}

                        {/* 3. Small Completed-Activity Summary (PART 4.4: Subtle timeline below answer and sources) */}
                        {(Boolean(msg.currentActivity) || Boolean(msg.activities && msg.activities.length > 0)) && Boolean(msg.content) && (
                          <div className="mt-1">
                            <ContextActivityPanel
                              activities={msg.activities}
                              currentActivity={msg.currentActivity}
                              isStreaming={generating && idx === activeThread.messages.length - 1}
                              hasContent={Boolean(msg.content)}
                              isDarkTheme={isDark}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Floating Jump to Latest Button */}
          {showJumpButton && (
            <button
              type="button"
              onClick={() => {
                isNearBottomRef.current = true;
                scrollToBottom('smooth', true);
              }}
              className="absolute bottom-28 right-8 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1f1f23] border border-gray-300 dark:border-gray-700 shadow-xl text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
            >
              <ArrowDown className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Jump to latest</span>
            </button>
          )}

          {/* Floating Pill Composer (Claude.ai 3.5 & ChatGPT Standard) */}
          <div className="p-4 shrink-0 bg-gradient-to-t from-current/5 to-transparent">
            <div className={`max-w-4xl mx-auto rounded-3xl border shadow-lg transition-all ${c.inputBg} ${c.border} ${
              generating ? 'opacity-90' : 'focus-within:ring-2 focus-within:ring-violet-500/30'
            }`}>
              {/* Attachment Preview Chips */}
              {attachments.length > 0 && (
                <div className="px-4 pt-3 flex flex-wrap gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${c.pillBg}`}
                    >
                      {att.type === 'document' ? (
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                      )}
                      <span className="truncate max-w-[160px] font-mono text-[11px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="hover:text-rose-500 cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Detected URL Suggestion Banner */}
              {detectedUrlsInInput.length > 0 && (
                <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span className="font-semibold text-violet-700 dark:text-violet-300">Detected Link:</span>
                    <span className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {detectedUrlsInInput[0]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResearchMode('open_link');
                      setTargetUrlToAnalyze(detectedUrlsInInput[0]);
                    }}
                    className={`shrink-0 ml-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer shadow-2xs ${
                      researchMode === 'open_link' && targetUrlToAnalyze === detectedUrlsInInput[0]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                    }`}
                  >
                    {researchMode === 'open_link' && targetUrlToAnalyze === detectedUrlsInInput[0]
                      ? '✓ Link Active'
                      : 'Inspect & Analyze (1-Click)'}
                  </button>
                </div>
              )}

              {/* Textarea */}
              <div className="px-4 pt-3 pb-2">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputMessage}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (e.target.value.startsWith('/')) {
                      setShowSlashMenu(true);
                    } else {
                      setShowSlashMenu(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    researchMode === 'web_search'
                      ? 'Enter research query to search real-time web & cite sources...'
                      : researchMode === 'deep_research'
                      ? 'Enter deep research topic for multi-round web investigation...'
                      : researchMode === 'open_link'
                      ? 'Paste URL to inspect and analyze page content...'
                      : 'Ask Claude to code, debug an error, or drop files/images (Enter to send, / for commands)...'
                  }
                  className={`w-full bg-transparent resize-none text-xs sm:text-sm focus:outline-none leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 ${c.text}`}
                />
              </div>

              {/* Slash Command Autocomplete Menu */}
              {showSlashMenu && (
                <div className={`mx-3 mb-2 p-1.5 rounded-xl border shadow-md space-y-1 ${c.cardBg} ${c.border}`}>
                  {SLASH_COMMANDS.map((sc) => (
                    <button
                      key={sc.cmd}
                      type="button"
                      onClick={() => {
                        setPrompt(`${sc.cmd} `);
                        setShowSlashMenu(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer"
                    >
                      <span className="font-mono font-bold text-violet-500">{sc.cmd}</span>
                      <span className={`text-[11px] ${c.textMuted}`}>{sc.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Action Bar inside Composer */}
              <div className="px-3 pb-2.5 pt-1.5 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                {/* Left controls: Attach, Web Search, Thinking toggle, Mic */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.txt,.ts,.tsx,.js,.py,.json,.md,.csv,.sql"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />

                  {/* Primary 1-Click Attach Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${c.pillBg}`}
                    title="Attach documents, code files, or images (.pdf, .docx, .ts, .py, .png, etc.)"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span className="hidden sm:inline">Attach</span>
                  </button>

                  {/* Web Search Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setResearchMode(researchMode === 'web_search' ? 'standard' : 'web_search');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      researchMode === 'web_search'
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : c.pillBg
                    }`}
                    title="Toggle Web Search for live citations & up-to-date data"
                  >
                    <Globe className={`w-3.5 h-3.5 ${researchMode === 'web_search' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">Web Search</span>
                    {researchMode === 'web_search' && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                  </button>

                  {/* Thinking Mode Toggle Pill (when model supports it) */}
                  {activeModelMeta?.supportsThinking && (
                    <button
                      type="button"
                      onClick={() => updateActiveThread({ thinkingEnabled: !activeThread.thinkingEnabled })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        activeThread.thinkingEnabled
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold'
                          : c.pillBg
                      }`}
                      title="Toggle Extended Thinking (Deep reasoning before responding)"
                    >
                      <Brain className={`w-3.5 h-3.5 ${activeThread.thinkingEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">Thinking</span>
                      {activeThread.thinkingEnabled && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </button>
                  )}

                  {/* Voice Dictation (Mic) */}
                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse'
                        : c.pillBg
                    }`}
                    title={isListening ? 'Listening... click to stop' : 'Voice Dictation (Speech-to-Text)'}
                  >
                    <Mic className={`w-3.5 h-3.5 ${isListening ? 'fill-current text-rose-500' : 'text-slate-400'}`} />
                  </button>

                  {/* Prompt Enhancer (✨) - only visible when user types */}
                  {inputMessage.trim() && (
                    <button
                      type="button"
                      onClick={handleEnhancePrompt}
                      className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 transition-all cursor-pointer animate-fadeIn"
                      title="Enhance prompt with structured instructions"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Enhance</span>
                    </button>
                  )}
                </div>

                {/* Right controls: Stop Generation or Send Button */}
                <div className="flex items-center gap-2">
                  <span className="hidden lg:inline text-[11px] text-slate-400 dark:text-slate-500 font-mono pr-1 select-none">
                    Enter ↵
                  </span>
                  {generating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-500/20 cursor-pointer animate-pulse"
                      title="Stop Generation"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop ({Math.round(elapsedMs / 1000)}s)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() && attachments.length === 0}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        inputMessage.trim() || attachments.length > 0
                          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/25'
                          : 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-black/5 dark:border-white/5'
                      }`}
                      title="Send message (Enter)"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Token Intelligence Bar */}
            <div className={`mt-2 px-2 flex items-center justify-between text-[11px] font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>~{threadTokenStats.inputTokens.toLocaleString()} in</span>
                </span>
                <span>·</span>
                <span>{threadTokenStats.outputTokens.toLocaleString()} out</span>
                <span>·</span>
                <span className={Number(remainingTokens) <= 0 ? 'text-rose-500 font-bold' : ''}>
                  {Number(remainingTokens) <= 0 ? '0 remaining' : `${remainingTokensM}M remaining`}
                </span>
                <span>·</span>
                <span>~{threadTokenStats.contextPercent}% of context ({Math.round(threadTokenStats.contextLimit / 1000)}k)</span>
                <span>·</span>
                <span className="text-violet-600 dark:text-violet-400 font-semibold">{activeModelMeta?.tokenMultiplier || 1.0}x rate</span>
                {threadTokenStats.savingsTokens > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">⚡ ~{threadTokenStats.savingsTokens.toLocaleString()} saved</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setContextManagerOpen(true)}
                className={`hover:text-violet-500 flex items-center gap-1 text-[10px] cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
                }`}
                title="View full token & quota inspector"
              >
                <span>Details</span>
                <Info className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Split-Pane Artifact Canvas */}
        {activeArtifact && (
          <div className={`w-full md:w-[480px] lg:w-[540px] xl:w-[600px] shrink-0 border-l ${c.border} flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-[#0B1020] z-10 shadow-xl`}>
            <ArtifactCanvas
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
            />
          </div>
        )}
      </div>

      {/* Model Capability Registry Modal (Image 2 style) */}
      <ModelSelectorModal
        open={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        models={availableModels}
        activeModelId={activeThread.model}
        onSelectModel={(newModelId) => {
          updateActiveThread({ model: newModelId });
        }}
        currentEstimatedTokens={threadTokenStats.inputTokens}
      />

      {/* Studio Projects & Knowledge Modal (Image 1 style) */}
      <ProjectManagementModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        projects={projects}
        activeProjectId={selectedProjectId || activeThread.projectId || null}
        onSelectProject={(projId) => {
          setSelectedProjectId(projId);
        }}
        onCreateProject={async (data) => {
          const res = await userFetch('/api/user/studio/projects', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          const resData = await res.json();
          if (resData.success && resData.project) {
            setProjects((prev) => [resData.project, ...prev]);
            setSelectedProjectId(resData.project.id);
          }
        }}
        onUpdateProject={async (id, data) => {
          const res = await userFetch(`/api/user/studio/projects/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
          });
          const resData = await res.json();
          if (resData.success && resData.project) {
            setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...resData.project } : p)));
          }
        }}
        onDeleteProject={async (id) => {
          await userFetch(`/api/user/studio/projects/${id}`, { method: 'DELETE' });
          setProjects((prev) => prev.filter((p) => p.id !== id));
          if (selectedProjectId === id) setSelectedProjectId(null);
        }}
        onStartChatInProject={(projId) => {
          setSelectedProjectId(projId);
          handleCreateNewThread();
        }}
      />

      {/* API Key Selector Modal */}
      {keyPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-lg w-full rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] ${c.cardBg} ${c.border}`}>
            {/* Header */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-violet-500" />
                  <span>Choose Active API Key</span>
                </h3>
                <p className={`text-xs ${c.textMuted}`}>Select which API key will be charged. Switch freely whenever a key quota is depleted.</p>
              </div>
              <button
                type="button"
                onClick={() => setKeyPickerOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {keys.length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <Key className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
                  <p className="text-sm font-semibold">No API Keys Found</p>
                  <p className={`text-xs ${c.textMuted}`}>You need an active API key to interact with models in the AI Chat Studio.</p>
                  <Link
                    to="/dashboard/keys"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
                  >
                    Generate an API Key →
                  </Link>
                </div>
              ) : (
                keys.map((k) => {
                  const isSelected = selectedKeyId === k.id;
                  const keyRemaining = BigInt(k.tokensRemaining || 0);
                  const isDepleted = keyRemaining <= 0n;
                  const remainingMillions = (Number(keyRemaining) / 1000000).toFixed(2);

                  return (
                    <div
                      key={k.id}
                      onClick={() => handleSelectKey(k.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-violet-500/10 border-violet-500 text-violet-700 dark:text-violet-300 shadow-2xs'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs truncate max-w-[160px]">
                            {k.name || 'API Key'}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-400 font-semibold">
                            {k.displayKey || k.keyPrefix || k.id.slice(0, 8)}
                          </span>
                          {k.plan && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-500">
                              {k.plan}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {isDepleted ? (
                            <span className="text-[11px] font-mono font-bold text-rose-500 flex items-center gap-1">
                              ● Depleted (0 tokens remaining)
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              ● {remainingMillions}M tokens remaining ({Number(keyRemaining).toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                        )}
                        {!isSelected && !isDepleted && (
                          <span className="text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                            Use this key
                          </span>
                        )}
                        {isDepleted && (
                          <span className="text-[10px] font-semibold text-rose-500/80 bg-rose-500/10 px-2 py-0.5 rounded">
                            Limit reached
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with quick navigation actions */}
            <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs">
              <Link
                to="/dashboard/keys"
                className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                <span>Manage API Keys in Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                to="/dashboard/plan"
                className="text-slate-700 dark:text-slate-400 hover:text-violet-600 font-medium flex items-center gap-1 text-[11px]"
              >
                <span>Recharge Quota</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Context Manager & Memory Rules Drawer */}
      <ContextManagerDrawer
        open={contextManagerOpen}
        onClose={() => {
          setContextManagerOpen(false);
          loadMemories();
        }}
        persona="fullstack"
        systemPrompt={activeThread.systemPrompt || ''}
        temperature={activeThread.temperature ?? 0.2}
        maxTokens={4096}
        thinkingEnabled={activeThread.thinkingEnabled ?? false}
        thinkingBudget={2048}
        memoryItems={userMemories}
        memoryEnabled={memoryEnabled}
        totalContextTokens={activeThread.messages.length * 150}
        messagesCount={activeThread.messages.length}
        isPaidCustomer={isPaidCustomer}
        onToggleMemoryEnabled={setMemoryEnabled}
        onAddMemory={handleAddMemory}
        onEditMemory={handleEditMemory}
        onRemoveMemory={handleRemoveMemory}
        onClearAllMemories={handleClearAllMemories}
        onUpdateSettings={(updates) => {
          updateActiveThread(updates);
          if (updates.memoryItems) {
            setUserMemories(updates.memoryItems);
          }
        }}
        onCompressContext={handleCompressContext}
        isCompressing={isCompressing}
      />

      {/* Upgrade Modal for Free Tier Guard */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl space-y-4 ${c.cardBg} ${c.border}`}>
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-500 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold">Pro Feature Required</h3>
              <p className={`text-xs leading-relaxed ${c.textMuted}`}>
                {upgradeReason || 'This advanced AI Studio feature is exclusively available for active capacity plan subscribers.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-xs space-y-1 text-violet-900 dark:text-violet-200">
              <p className="font-semibold">Upgrade unlocks:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                <li>Unlimited multi-turn chat threads & conversation memory</li>
                <li>Full PDF document & vision image analysis (up to 25MB)</li>
                <li>Claude 3.7 Thinking Mode & Opus Extended Reasoning</li>
                <li>Interactive live sandboxed preview canvas</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${c.pillBg}`}
              >
                Cancel
              </button>
              <Link
                to="/pricing"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
              >
                View Plans & Upgrade
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Skills Modal */}
      <WorkspaceSkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        activeSkillIds={activeSkillIds}
        onToggleSkill={handleToggleSkill}
        onSetActiveSkillIds={handleSetActiveSkillIds}
      />

      {/* Command Palette Modal (⌘K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => {
          setActiveThreadId(id);
          loadConversationMessages(id);
        }}
        onNewChat={handleCreateNewThread}
        models={availableModels}
        currentModelId={activeThread.model}
        onSelectModel={(id) => updateActiveThread({ model: id })}
        onOpenSkills={() => setIsSkillsModalOpen(true)}
        onOpenCanvas={() =>
          setActiveArtifact({
            id: 'canvas_quick',
            title: 'Interactive Studio Canvas',
            language: 'html',
            code: '',
            type: 'html',
          })
        }
        onOpenKeySwitcher={() => setKeyPickerOpen(true)}
        onToggleThinking={() =>
          updateActiveThread({ thinkingEnabled: !activeThread.thinkingEnabled })
        }
        thinkingEnabled={Boolean(activeThread.thinkingEnabled)}
        onToggleTokenSaver={() =>
          updateActiveThread({ tokenSaverEnabled: !activeThread.tokenSaverEnabled })
        }
        tokenSaverEnabled={Boolean(activeThread.tokenSaverEnabled)}
        onToggleTheme={toggleTheme}
        isDarkTheme={isDark}
      />

      {/* Browser Tasks & Interactive Automation Modal */}
      <BrowserTaskModal
        isOpen={browserModalOpen}
        onClose={() => setBrowserModalOpen(false)}
        session={browserSession}
        capability={browserCapability}
        onNavigate={handleBrowserNavigate}
        onInspect={handleBrowserInspect}
        onScreenshot={handleBrowserScreenshot}
        onConfirmAction={handleBrowserConfirmAction}
        onCancelSession={handleBrowserCancelSession}
        isDarkTheme={isDark}
      />

      {/* Studio 2.0 Guided Onboarding Walkthrough (Modal triggered via ? button when chat has messages) */}
      <StudioOnboardingGuide
        open={isOnboardingOpen && activeThread?.messages?.length > 0}
        onClose={() => {
          localStorage.setItem('lightning_studio_onboarding_completed_v2', 'true');
          setIsOnboardingOpen(false);
        }}
        isDarkTheme={isDark}
        onSelectPrompt={(p) => {
          setPrompt(p);
          textareaRef.current?.focus();
        }}
      />

      {/* Studio 2.0 Pure-Engine Document Generator Modal */}
      <DocumentGeneratorModal
        open={isDocGenOpen}
        onClose={() => setIsDocGenOpen(false)}
        isDarkTheme={isDark}
        onInsertToChat={(text) => {
          setPrompt(text);
          textareaRef.current?.focus();
        }}
      />

      {/* Studio 2.0 Media Generation Boundary Studio */}
      <MediaGenerationModal
        open={isMediaGenOpen}
        onClose={() => setIsMediaGenOpen(false)}
        isDarkTheme={isDark}
        onGenerateSvgInCanvas={(p) => {
          setPrompt(`Create a clean, scalable interactive SVG visual component representing: ${p}. Output clean code in an artifact.`);
          textareaRef.current?.focus();
        }}
      />
    </div>
  );

  // Helper renderer for each thread in the sidebar
  function renderThreadRow(t: ChatThread) {
    const isActive = t.id === activeThread.id;
    const isRenaming = renamingId === t.id;
    const isMenuOpen = activeMenuThreadId === t.id;

    return (
      <div
        key={t.id}
        onClick={() => {
          setActiveThreadId(t.id);
          setActiveMenuThreadId(null);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setSpeakingMsgId(null);
        }}
        className={`group relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
          isActive
            ? isDark
              ? 'bg-[#19233A] border-violet-500/40 text-[#F3F5FC] font-medium shadow-xs'
              : 'bg-white border-violet-400 text-slate-950 font-bold shadow-xs'
            : isDark
            ? 'border-transparent text-[#A5B0C7] hover:bg-[#141C30] hover:text-[#F3F5FC]'
            : 'border-transparent text-slate-800 hover:bg-[#EAE4DC] hover:text-slate-950 font-medium'
        }`}
      >
        <div className="flex-1 min-w-0 pr-1">
          {isRenaming ? (
            <input
              type="text"
              autoFocus
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(t.id);
                if (e.key === 'Escape') setRenamingId(null);
              }}
              onBlur={() => handleSaveRename(t.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs font-semibold bg-white dark:bg-[#0B1020] border border-violet-500 rounded px-1.5 py-0.5 focus:outline-none"
            />
          ) : (
            <p className="truncate text-xs leading-snug">{t.title}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            {t.pinned && (
              <Pin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            )}
            {t.project && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: t.project.color || '#8b5cf6' }}
                title={t.project.name}
              />
            )}
            <p className={`text-[10px] truncate font-mono ${isDark ? 'text-[#77839E]' : 'text-slate-500 font-medium'}`}>
              {getModelDisplayName(t.model).replace('Claude ', '')} · {t.messages.length} msgs
            </p>
          </div>
        </div>

        {/* Single Contextual 3-dots Menu Button */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setActiveMenuThreadId(isMenuOpen ? null : t.id)}
            className={`p-1 rounded-md transition-opacity cursor-pointer ${
              isMenuOpen ? 'opacity-100 bg-black/10 dark:bg-white/10' : 'opacity-0 group-hover:opacity-100'
            } ${c.textMuted} hover:text-slate-950 dark:hover:text-white`}
            title="Conversation Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Contextual Dropdown */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActiveMenuThreadId(null)} />
              <div className={`absolute right-0 top-full mt-1 z-40 w-44 rounded-xl border shadow-2xl p-1 space-y-0.5 text-xs ${c.cardBg} ${c.border} animate-fadeIn`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuThreadId(null);
                    setRenamingId(t.id);
                    setRenameText(t.title);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-violet-500/10 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    setActiveMenuThreadId(null);
                    handleTogglePin(t.id, Boolean(t.pinned), e);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-violet-500/10 cursor-pointer"
                >
                  {t.pinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pin to Top</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    setActiveMenuThreadId(null);
                    handleToggleArchive(t.id, Boolean(t.archived), e);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-violet-500/10 cursor-pointer"
                >
                  {t.archived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5 text-violet-400" />
                      <span>Restore Chat</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5 text-violet-400" />
                      <span>Archive Chat</span>
                    </>
                  )}
                </button>

                <div className="my-1 border-t border-black/5 dark:border-white/5" />

                <button
                  type="button"
                  onClick={(e) => {
                    setActiveMenuThreadId(null);
                    handleDeleteThread(t.id, e);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-500/10 text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Chat</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
};
