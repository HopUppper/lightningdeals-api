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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch, userFetch, getAuthHeaders } from '../../utils/api';
import { MarkdownBlock } from '../../components/chat/MarkdownBlock';
import { ArtifactCanvas, ArtifactData } from '../../components/chat/ArtifactCanvas';
import { ContextManagerDrawer, ProjectMemoryItem } from '../../components/chat/ContextManagerDrawer';

export interface ChatAttachment {
  name: string;
  type: 'image' | 'file' | 'document';
  mimeType: string;
  sizeBytes?: number;
  dataBase64?: string;
  textSnippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
  timestamp: number;
  thinking?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    savings_tokens?: number;
  };
  multiplier?: number;
  latencyMs?: number;
  modelUsed?: string;
  isError?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  model: string;
  pinned?: boolean;
  systemPrompt?: string;
  temperature?: number;
  thinkingEnabled?: boolean;
  tokenSaverEnabled?: boolean;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  messagesLoaded?: boolean;
}

export interface StudioModelMeta {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  tokenMultiplier: number;
  contextWindow: number;
  supportsThinking: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  isAvailable: boolean;
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
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    category: 'Flagship Models',
    badge: 'Frontier Intelligence',
    description: 'Pinnacle frontier reasoning for complex system architectures, formal proofs, and cognitive depth.',
    tokenMultiplier: 2.0,
    contextWindow: 1000000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    category: 'Reasoning & Deep Thinking',
    badge: 'Extended Thinking',
    description: 'Hybrid reasoning architecture with inspectable deliberative thought buffers for zero-hallucination analysis.',
    tokenMultiplier: 1.25,
    contextWindow: 200000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    category: 'Reasoning & Deep Thinking',
    badge: 'Deep Logic',
    description: 'Enterprise architecture design, distributed consensus, and deep formal code auditing.',
    tokenMultiplier: 1.75,
    contextWindow: 1000000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    category: 'High-Velocity & Coding',
    badge: 'Sub-30ms TTFT',
    description: 'Ultra-fast developer completions tuned for IDE code completion, inline refactoring, and instant responses.',
    tokenMultiplier: 0.5,
    contextWindow: 500000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-fable-5.1',
    name: 'Claude Fable 5.1',
    category: 'High-Velocity & Coding',
    badge: 'IDE Autopilot',
    description: 'Specialized model for rapid git diff generation, automated test suites, and CI/CD triage.',
    tokenMultiplier: 0.6,
    contextWindow: 500000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    category: 'Fast & Economical',
    badge: 'Lowest Latency',
    description: 'High-velocity streaming model with minimal token overhead for high-concurrency bot loops and summaries.',
    tokenMultiplier: 0.25,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    category: 'Standard Anthropic Series',
    badge: 'Standard',
    description: 'Anthropic standard enterprise model for production coding and technical documentation.',
    tokenMultiplier: 1.0,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    category: 'Fast & Economical',
    badge: 'Fast',
    description: 'Economical high-speed completion model for lightweight tasks and quick Q&A.',
    tokenMultiplier: 0.25,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
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
    return (localStorage.getItem('lightning_studio_theme') as any) || 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('lightning_studio_theme', next);
  };

  const isDark = theme === 'dark';

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

  // Model Picker Modal / Drawer
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  // Advanced Drawers & Canvas
  const [contextManagerOpen, setContextManagerOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Persistent Memories
  const [userMemories, setUserMemories] = useState<ProjectMemoryItem[]>([]);

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

  // 1. Initial Load: User Keys & Server Conversations
  useEffect(() => {
    async function loadData() {
      try {
        // Load API Keys
        const keysRes = await userFetch('/api/user/keys');
        if (keysRes.ok) {
          const keysData = await keysRes.json();
          const keyList = keysData.keys || [];
          setKeys(keyList);
          setIsPaidCustomer(Boolean(keysData.isPaidCustomer));
          if (keyList.length > 0 && !selectedKeyId) {
            setSelectedKeyId(keyList[0].id);
          }
        }

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

  // Fetch full messages for a conversation
  const loadConversationMessages = async (convId: string) => {
    if (convId.startsWith('thread_')) return; // local-only draft
    try {
      const res = await userFetch(`/api/user/studio/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.messages) {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === convId
                ? {
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
                  }
                : t
            )
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

  // When switching conversations, load messages if not already loaded
  useEffect(() => {
    if (activeThread && !activeThread.messagesLoaded && !activeThread.id.startsWith('thread_')) {
      loadConversationMessages(activeThread.id);
    }
  }, [activeThreadId]);

  // Auto-scroll chat to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatScrollContainerRef.current) {
      const { scrollHeight, clientHeight } = chatScrollContainerRef.current;
      chatScrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
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

  const handleCreateNewThread = async () => {
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

    const filtered = threads.filter((t) =>
      t.title.toLowerCase().includes(threadSearch.toLowerCase())
    );

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

    if (!isPaidCustomer) {
      setUpgradeReason('Uploading images for Vision inspection and code/PDF documents requires an active paid capacity plan.');
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

  // Export Thread to Markdown
  const handleExportThread = () => {
    if (!activeThread.messages.length) return;
    const md = activeThread.messages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'Assistant'}\n\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'thread'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── CORE REAL-TIME SSE STREAMING HANDLER ──
  const handleSendMessage = async (customPrompt?: string, overrideMessages?: ChatMessage[]) => {
    const promptToSend = customPrompt !== undefined ? customPrompt : inputMessage;
    if ((!promptToSend.trim() && attachments.length === 0) || generating) return;

    if (attachments.length > 0 && !isPaidCustomer) {
      setUpgradeReason('Vision multimodal and document analysis are exclusive to active paid subscribers.');
      setShowUpgradeModal(true);
      return;
    }

    if (activeThread.messages.length >= 2 && !isPaidCustomer) {
      setUpgradeReason('Multi-turn conversation history is exclusive to paid plan subscribers.');
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
    };

    updateActiveThread({
      messages: [...updatedMessages, initialAssistantMsg],
      title: newTitle,
    });

    setPrompt('');
    setAttachments([]);
    setShowSlashMenu(false);
    setGenerating(true);

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
          conversationId: activeThread.id.startsWith('thread_') ? undefined : activeThread.id,
          model: activeThread.model,
          prompt: promptToSend.trim(),
          messages: baseMessages,
          systemPrompt: activeThread.systemPrompt,
          thinkingEnabled: activeThread.thinkingEnabled,
          tokenSaverEnabled: activeThread.tokenSaverEnabled,
          temperature: activeThread.temperature,
          attachments: userMessage.attachments || [],
        }),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        if (errorJson.error?.code === 'PRO_TIER_REQUIRED') {
          setUpgradeReason(errorJson.error.message);
          setShowUpgradeModal(true);
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
                if (parsed.conversationId && activeThread.id !== parsed.conversationId) {
                  updateActiveThread({ id: parsed.conversationId, title: parsed.title || activeThread.title });
                  setActiveThreadId(parsed.conversationId);
                }
              } else if (eventType === 'thinking_delta') {
                accumulatedThinking += parsed.thinking || '';
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === activeThread.id
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, thinking: accumulatedThinking } : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'content_delta') {
                accumulatedContent += parsed.text || '';
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === activeThread.id
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                          ),
                        }
                      : t
                  )
                );
              } else if (eventType === 'done') {
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === activeThread.id
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId
                              ? {
                                  ...m,
                                  content: parsed.result || accumulatedContent,
                                  thinking: parsed.thinking || accumulatedThinking || undefined,
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
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
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
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
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
  const remainingTokensM = (Number(remainingTokens) / 1000000).toFixed(2);

  // Style Tokens & Palettes
  const c = {
    bg: isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
    headerBg: isDark ? 'bg-[#0E1424]/90 border-b border-slate-800' : 'bg-white/95 border-b border-slate-200/90 shadow-2xs',
    sidebarBg: isDark ? 'bg-[#0E1424]' : 'bg-[#FFFFFF]',
    sidebarBorder: isDark ? 'border-slate-800' : 'border-slate-200',
    cardBg: isDark ? 'bg-[#131A2B]' : 'bg-[#FFFFFF]',
    border: isDark ? 'border-slate-800' : 'border-slate-200/90',
    inputBg: isDark ? 'bg-[#131A2B]' : 'bg-[#FFFFFF]',
    pillBg: isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700',
    userBubble: isDark ? 'bg-violet-600 text-white' : 'bg-violet-600 text-white shadow-xs',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full min-h-0 flex flex-col overflow-hidden font-sans ${c.bg} ${c.text}`}
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

      {/* Main Studio Header */}
      <header className={`h-14 px-4 ${c.headerBg} flex items-center justify-between shrink-0 text-xs z-20 backdrop-blur-md sticky top-0`}>
        {/* Left: Back to Dashboard, Sidebar Toggle, Active Model Badge, Token Balance */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900 shadow-2xs'
            }`}
            title="Return to Customer Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${c.pillBg} hover:opacity-100`}
            title={sidebarOpen ? 'Hide Sessions Sidebar' : 'Show Sessions Sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {/* Model Selector Trigger Button in Header */}
          <button
            type="button"
            onClick={() => setModelPickerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300 font-semibold text-xs hover:bg-violet-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span className="truncate max-w-[130px] sm:max-w-none">{getModelDisplayName(activeThread.model)}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Key Balance Pill */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
              isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {remainingTokensM}M tokens
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle, Thinking, Token-Saver, Memory, Canvas, Export */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${c.pillBg} hover:opacity-80`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {/* Thinking Mode Toggle Pill */}
          <button
            type="button"
            onClick={() => updateActiveThread({ thinkingEnabled: !activeThread.thinkingEnabled })}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeThread.thinkingEnabled
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                : `${c.pillBg} opacity-75 hover:opacity-100`
            }`}
            title="Enable Extended Reasoning Process"
          >
            <Brain className="w-3 h-3" />
            <span className="hidden sm:inline">Thinking</span>
            {activeThread.thinkingEnabled && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
          </button>

          {/* Token-Saver Diff Mode Pill */}
          <button
            type="button"
            onClick={() => updateActiveThread({ tokenSaverEnabled: !activeThread.tokenSaverEnabled })}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeThread.tokenSaverEnabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : `${c.pillBg} opacity-75 hover:opacity-100`
            }`}
            title="Forces AI to generate only code diffs, saving ~40% tokens"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Token-Saver</span>
            {activeThread.tokenSaverEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>

          {/* Memory Drawer */}
          <button
            type="button"
            onClick={() => setContextManagerOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${c.pillBg} hover:opacity-100`}
            title="Open Context & Persistent Project Memory"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden md:inline">Memory</span>
            {userMemories.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            )}
          </button>

          {/* Live Artifact Canvas Toggle */}
          <button
            type="button"
            onClick={() => {
              if (activeArtifact) {
                setActiveArtifact(null);
              } else {
                setActiveArtifact({
                  id: 'studio_canvas',
                  title: 'Interactive Studio Canvas',
                  language: 'html',
                  code: `<div style="font-family:system-ui;padding:24px;text-align:center;">
  <h2 style="color:#7c3aed;margin-bottom:8px;">Live Sandboxed Preview</h2>
  <p style="color:#64748b;font-size:14px;">Any code generated by Claude can be rendered live here in real time.</p>
</div>`,
                  type: 'html',
                });
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeArtifact
                ? 'bg-violet-600 text-white border-violet-500'
                : `${c.pillBg} hover:opacity-100`
            }`}
            title="Open Interactive Artifact Canvas"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Canvas</span>
          </button>

          {/* Export Thread */}
          {activeThread.messages.length > 0 && (
            <button
              type="button"
              onClick={handleExportThread}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${c.pillBg} hover:opacity-100`}
              title="Export Conversation as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body: Sessions Sidebar + Chat Column + Artifact Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative w-full">
        {/* Left: Collapsible Sessions Sidebar */}
        {sidebarOpen && (
          <aside className={`w-64 sm:w-72 border-r ${c.sidebarBorder} ${c.sidebarBg} flex flex-col shrink-0 h-full overflow-hidden text-xs`}>
            {/* New Session Button */}
            <div className="p-3 border-b border-black/5 dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={handleCreateNewThread}
                className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </button>
            </div>

            {/* Session Search */}
            <div className="p-2.5 border-b border-black/5 dark:border-white/5 shrink-0">
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${c.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
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
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Today
                  </p>
                  {groupedThreads.today.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Yesterday */}
              {groupedThreads.yesterday.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Yesterday
                  </p>
                  {groupedThreads.yesterday.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Previous 7 Days */}
              {groupedThreads.previous7Days.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Previous 7 Days
                  </p>
                  {groupedThreads.previous7Days.map((t) => renderThreadRow(t))}
                </div>
              )}

              {/* Group: Older */}
              {groupedThreads.older.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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

            {/* Sidebar Footer with Token Context Meter */}
            <div className={`p-3 border-t ${c.sidebarBorder} text-[11px] shrink-0`}>
              <div className="flex items-center justify-between font-mono mb-1">
                <span className={c.textMuted}>Remaining Tokens</span>
                <span className="font-semibold">{remainingTokensM}M</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                  style={{ width: `${Math.min(100, (Number(remainingTokens) / 5000000) * 100)}%` }}
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
            className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 overscroll-contain"
          >
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Phase 2.3 New Chat Landing State */}
              {activeThread.messages.length === 0 && (
                <div className="py-8 sm:py-14 text-center space-y-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-7 h-7" />
                  </div>

                  <div className="space-y-2 max-w-xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      What are we working on today?
                    </h2>
                    <p className={`text-xs sm:text-sm leading-relaxed ${c.textMuted}`}>
                      Ask a question, analyse a document, write code, or explore an idea with the models available through LightningAPI.
                    </p>
                  </div>

                  {/* 5 Functional Suggested Prompt Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left max-w-3xl mx-auto pt-2">
                    {STARTING_WORKFLOW_CARDS.map((card, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrompt(card.prompt);
                          textareaRef.current?.focus();
                        }}
                        className={`p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                          isDark
                            ? 'bg-[#131A2B] border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/40'
                            : 'bg-white border-slate-200/90 hover:border-violet-500/50 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.pillBg}`}>
                            {card.category}
                          </span>
                          <card.icon className="w-4 h-4 text-violet-500 transition-transform group-hover:scale-110" />
                        </div>
                        <h4 className="text-xs font-bold mb-1">{card.title}</h4>
                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${c.textMuted}`}>
                          {card.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {activeThread.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || idx} className="space-y-2">
                    {isUser ? (
                      /* User Message Bubble */
                      <div className="flex justify-end">
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
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                ✓ {msg.usage.total_tokens.toLocaleString()} tokens
                                {msg.usage.savings_tokens ? ` (${msg.usage.savings_tokens} saved)` : ''}
                              </span>
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

                        {/* Collapsible Reasoning Process Drawer */}
                        {msg.thinking ? (
                          <details className={`rounded-xl border p-3 text-xs ${
                            isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
                          }`}>
                            <summary className="font-semibold text-amber-700 dark:text-amber-400 cursor-pointer flex items-center gap-1.5 select-none">
                              <Brain className="w-3.5 h-3.5" />
                              <span>Reasoning Process ({Math.ceil(msg.thinking.length / 4)} tokens)</span>
                            </summary>
                            <div className="mt-2 text-[11.5px] font-mono leading-relaxed whitespace-pre-wrap opacity-90 border-t border-amber-500/20 pt-2">
                              {msg.thinking}
                            </div>
                          </details>
                        ) : null}

                        {/* Formatted Markdown Body */}
                        <div className={`p-4 rounded-2xl border shadow-2xs ${c.cardBg} ${c.border}`}>
                          {msg.content ? (
                            <MarkdownBlock content={msg.content} />
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 font-mono">
                              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                              <span>Streaming response from {getModelDisplayName(activeThread.model)}...</span>
                            </div>
                          )}

                          {msg.isError && (
                            <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between">
                              <span className="text-xs text-rose-500">Request failed.</span>
                              <button
                                type="button"
                                onClick={handleRetry}
                                className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          </div>

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
                  placeholder="Ask Claude to code, debug an error, or drop files/images (Enter to send, Shift+Enter for newline, / for commands)..."
                  className={`w-full bg-transparent resize-none text-xs sm:text-sm focus:outline-none leading-relaxed ${c.text}`}
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
              <div className="px-3 pb-2.5 pt-1 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                {/* Left controls: Model Selector, Attach, Enhance */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Model Switcher Button */}
                  <button
                    type="button"
                    onClick={() => setModelPickerOpen(true)}
                    className={`border font-semibold rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750'
                        : 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span>{getModelDisplayName(activeThread.model)}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.ts,.tsx,.js,.py,.json,.md,.csv,.sql"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />

                  {/* Attach Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${c.pillBg} hover:opacity-100`}
                    title="Attach PDF, code, or image (Max 25MB)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Prompt Enhancer (✨) */}
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={!inputMessage.trim()}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                      inputMessage.trim()
                        ? 'text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/10'
                        : `${c.pillBg} opacity-50 cursor-not-allowed`
                    }`}
                    title="1-Click Prompt Enhancer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Enhance</span>
                  </button>
                </div>

                {/* Right controls: Stop Generation or Send Button */}
                <div className="flex items-center gap-2">
                  {generating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer animate-pulse"
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
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        inputMessage.trim() || attachments.length > 0
                          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/25'
                          : 'bg-black/10 dark:bg-white/10 text-black/30 dark:text-white/30 cursor-not-allowed'
                      }`}
                      title="Send message (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Split-Pane Artifact Canvas */}
        {activeArtifact && (
          <div className={`w-full md:w-[480px] lg:w-[540px] xl:w-[600px] shrink-0 border-l ${c.border} flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-[#0E131F] z-10 shadow-xl`}>
            <ArtifactCanvas
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
            />
          </div>
        )}
      </div>

      {/* Model Selector Modal / Drawer */}
      {modelPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-xl w-full rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] ${c.cardBg} ${c.border}`}>
            {/* Header */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span>Choose Model</span>
                </h3>
                <p className={`text-xs ${c.textMuted}`}>Select from verified models available through LightningAPI</p>
              </div>
              <button
                type="button"
                onClick={() => setModelPickerOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-black/5 dark:border-white/5">
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3 top-2.5 ${c.textMuted}`} />
                <input
                  type="text"
                  placeholder="Filter models by name or capability..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Model List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {['Flagship Models', 'Reasoning & Deep Thinking', 'High-Velocity & Coding', 'Fast & Economical', 'Standard Anthropic Series'].map((cat) => {
                const catModels = VERIFIED_MODELS.filter(
                  (m) =>
                    m.category === cat &&
                    (m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                     m.description.toLowerCase().includes(modelSearch.toLowerCase()))
                );

                if (catModels.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                      {cat} ({catModels.length})
                    </p>
                    <div className="space-y-1.5">
                      {catModels.map((m) => {
                        const isSelected = activeThread.model === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              updateActiveThread({ model: m.id });
                              setModelPickerOpen(false);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-violet-500/10 border-violet-500 text-violet-700 dark:text-violet-300 shadow-2xs'
                                : isDark
                                ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs">{m.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-violet-500/20 text-violet-500">
                                  {m.tokenMultiplier}x Tokens
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-500/15 text-slate-400">
                                  {(m.contextWindow / 1000).toFixed(0)}k Context
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed ${c.textMuted}`}>
                                {m.description}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0 mt-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
        totalContextTokens={activeThread.messages.length * 150}
        messagesCount={activeThread.messages.length}
        isPaidCustomer={isPaidCustomer}
        onAddMemory={handleAddMemory}
        onRemoveMemory={handleRemoveMemory}
        onUpdateSettings={(updates) => {
          updateActiveThread(updates);
          if (updates.memoryItems) {
            setUserMemories(updates.memoryItems);
          }
        }}
        onCompressContext={async () => {
          setIsCompressing(true);
          updateActiveThread({ tokenSaverEnabled: true });
          setIsCompressing(false);
        }}
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
    </div>
  );

  // Helper renderer for each thread in the sidebar
  function renderThreadRow(t: ChatThread) {
    const isActive = t.id === activeThread.id;
    const isRenaming = renamingId === t.id;

    return (
      <div
        key={t.id}
        onClick={() => {
          setActiveThreadId(t.id);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setSpeakingMsgId(null);
        }}
        className={`group relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
          isActive
            ? isDark
              ? 'bg-slate-800/80 border-slate-700 text-white font-medium shadow-2xs'
              : 'bg-white border-slate-300 text-slate-900 font-semibold shadow-xs'
            : isDark
            ? 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
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
              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-violet-500 rounded px-1.5 py-0.5 focus:outline-none"
            />
          ) : (
            <p className="truncate text-xs leading-snug">{t.title}</p>
          )}
          <p className={`text-[10px] mt-0.5 truncate font-mono ${c.textMuted}`}>
            {getModelDisplayName(t.model).replace('Claude ', '')} · {t.messages.length} msgs
          </p>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Pin */}
          <button
            type="button"
            onClick={(e) => handleTogglePin(t.id, Boolean(t.pinned), e)}
            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${t.pinned ? 'text-amber-500 opacity-100' : c.textMuted}`}
            title={t.pinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3 h-3" />
          </button>

          {/* Rename */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRenamingId(t.id);
              setRenameText(t.title);
            }}
            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${c.textMuted}`}
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => handleDeleteThread(t.id, e)}
            className="p-1 rounded hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400"
            title="Delete Session"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
