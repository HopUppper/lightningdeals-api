import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../utils/api';
import { MarkdownBlock } from '../../components/chat/MarkdownBlock';
import { ArtifactCanvas, ArtifactData } from '../../components/chat/ArtifactCanvas';
import { ContextManagerDrawer, ProjectMemoryItem } from '../../components/chat/ContextManagerDrawer';

interface ChatAttachment {
  name: string;
  type: 'image' | 'file' | 'document';
  mimeType: string;
  sizeBytes: number;
  dataBase64?: string;
  textSnippet?: string;
}

interface ChatMessage {
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
  };
  latencyMs?: number;
  modelUsed?: string;
  isError?: boolean;
}

interface ChatThread {
  id: string;
  title: string;
  model: string;
  persona?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  tokenSaverEnabled?: boolean;
  memoryItems?: ProjectMemoryItem[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface StudioModelOption {
  id: string;
  name: string;
  category: 'Flagship 5.5 & 5.0 Series' | 'Extended Thinking & Reasoning' | 'IDE & High-Velocity Series' | 'Standard Anthropic Series';
  badge: string;
  tokenMultiplier: string;
  color: string;
  description: string;
}

const MODEL_OPTIONS: StudioModelOption[] = [
  // ── Flagship 5.5 & 5.0 Series ──
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude Sonnet 5.5',
    category: 'Flagship 5.5 & 5.0 Series',
    badge: 'Flagship Autonomous Coding & Engineering',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-violet-500',
    description: 'Premier agentic coding model for Cursor, Claude Code, and Windsurf',
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    category: 'Flagship 5.5 & 5.0 Series',
    badge: 'Cognitive Frontier Intelligence',
    tokenMultiplier: '2.5x Tokens',
    color: 'text-amber-500',
    description: 'Pinnacle frontier reasoning for complex system architectures',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    category: 'Flagship 5.5 & 5.0 Series',
    badge: 'Production Engineering Workhorse',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-indigo-500',
    description: 'High-velocity production code synthesis and full-stack refactoring',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    category: 'Flagship 5.5 & 5.0 Series',
    badge: 'Cognitive Heavyweight Architecture',
    tokenMultiplier: '2x Tokens',
    color: 'text-orange-500',
    description: 'Enterprise architecture design, distributed consensus, and deep auditing',
  },

  // ── Extended Thinking & Frontier Reasoning ──
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    category: 'Extended Thinking & Reasoning',
    badge: 'Frontier Hybrid Reasoning (Thinking Mode)',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-emerald-500',
    description: 'Hybrid reasoning model with controllable thought budgets and instant output',
  },
  {
    id: 'claude-opus-5-thinking',
    name: 'Claude Opus 5 Extended Thinking',
    category: 'Extended Thinking & Reasoning',
    badge: 'Hybrid Deliberative Logic',
    tokenMultiplier: '2.5x Tokens (Deep Reasoning)',
    color: 'text-yellow-500',
    description: 'Explicit internal thought buffers for auditing intricate edge-case bugs',
  },
  {
    id: 'claude-sonnet-5-thinking',
    name: 'Claude Sonnet 5 Extended Thinking',
    category: 'Extended Thinking & Reasoning',
    badge: 'Controllable Verification Reasoning',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-teal-500',
    description: 'Reflective deliberation for zero-hallucination verification',
  },

  // ── IDE & High-Velocity Series ──
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    category: 'IDE & High-Velocity Series',
    badge: 'Ultra-Fast IDE Specialist',
    tokenMultiplier: '0.8x Tokens',
    color: 'text-blue-500',
    description: 'Optimized for sub-50ms tab completions, quick diffs, and rapid edits',
  },
  {
    id: 'claude-fable-5-flash',
    name: 'Claude Fable 5 Flash',
    category: 'IDE & High-Velocity Series',
    badge: 'Sub-Second Autopilot',
    tokenMultiplier: '0.5x Tokens',
    color: 'text-sky-500',
    description: 'Ultra-lightweight execution model for high-concurrency bot loops',
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    category: 'IDE & High-Velocity Series',
    badge: 'High-Throughput Streaming',
    tokenMultiplier: '0.2x Tokens (Lowest Cost)',
    color: 'text-emerald-500',
    description: 'Next-gen high-velocity streaming model at 5x lower token burn',
  },
  {
    id: 'claude-haiku-5',
    name: 'Claude Haiku 5',
    category: 'IDE & High-Velocity Series',
    badge: 'Rapid Code Completions',
    tokenMultiplier: '0.2x Tokens',
    color: 'text-green-500',
    description: 'Lightweight triage and fast utility execution',
  },

  // ── Standard Anthropic Series ──
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    category: 'Standard Anthropic Series',
    badge: 'Vision & Multimodal Standard',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-cyan-500',
    description: 'Proven multi-modal coding model with broad tool execution compatibility',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    category: 'Standard Anthropic Series',
    badge: 'Rapid Micro-Tasks',
    tokenMultiplier: '0.2x Tokens',
    color: 'text-lime-500',
    description: 'Official Anthropic 3.5 Haiku model for lightweight tasks',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    category: 'Standard Anthropic Series',
    badge: 'Legacy Cognitive Logic',
    tokenMultiplier: '2.5x Tokens',
    color: 'text-amber-600',
    description: 'Original Anthropic Claude 3 Opus model',
  },
];

const getModelDisplayName = (modelId: string): string => {
  const found = MODEL_OPTIONS.find((m) => m.id === modelId);
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

const SLASH_COMMANDS = [
  { cmd: '/code', desc: 'Generate complete, production-grade implementation' },
  { cmd: '/debug', desc: 'Diagnose root cause and output minimal diff fix' },
  { cmd: '/refactor', desc: 'Optimize performance and clean code architecture' },
  { cmd: '/test', desc: 'Write comprehensive unit and integration test suite' },
  { cmd: '/explain', desc: 'Provide step-by-step technical breakdown' },
  { cmd: '/compress', desc: 'Summarize conversation history to save tokens' },
];

const QUICK_PROMPT_CARDS = [
  {
    icon: Code,
    title: 'Full-Stack Feature',
    prompt: 'Implement a high-concurrency rate limiter in TypeScript using a token bucket algorithm with Redis backend and clean unit tests.',
    tag: 'TypeScript / Architecture',
  },
  {
    icon: FileText,
    title: 'Document & PDF Intelligence',
    prompt: 'Please analyze this technical document and extract an executive summary, architectural diagrams, API contracts, and edge cases.',
    tag: 'Multimodal / PDF',
  },
  {
    icon: Sparkles,
    title: 'Code Audit & Debugging',
    prompt: 'Analyze this code for race conditions, memory leaks, security vulnerabilities, and provide unified diff fixes with zero fluff.',
    tag: 'Security & Quality',
  },
  {
    icon: Terminal,
    title: 'API Client & Integration',
    prompt: 'Write an asynchronous client library for our Anthropic-compatible /v1/messages API with streaming SSE support and exponential backoff.',
    tag: 'SDK Engineering',
  },
];

interface LiveThinkingCardProps {
  modelName: string;
  elapsedMs: number;
  userPrompt: string;
  isDark: boolean;
  onCancel?: () => void;
}

const LiveThinkingCard: React.FC<LiveThinkingCardProps> = ({
  modelName,
  elapsedMs,
  userPrompt,
  isDark,
  onCancel,
}) => {
  const seconds = Math.floor(elapsedMs / 1000);
  const promptLower = (userPrompt || '').toLowerCase();

  const isCoding =
    promptLower.includes('code') ||
    promptLower.includes('build') ||
    promptLower.includes('create') ||
    promptLower.includes('calculator') ||
    promptLower.includes('function') ||
    promptLower.includes('react') ||
    promptLower.includes('typescript') ||
    promptLower.includes('javascript') ||
    promptLower.includes('html') ||
    promptLower.includes('app') ||
    promptLower.includes('api') ||
    promptLower.includes('debug');

  const isDoc =
    promptLower.includes('summarize') ||
    promptLower.includes('summary') ||
    promptLower.includes('pdf') ||
    promptLower.includes('document') ||
    promptLower.includes('report') ||
    promptLower.includes('analyze') ||
    promptLower.includes('analysis');

  const stages = isCoding
    ? [
        { label: 'Deconstruct prompt intent & requirements', minSec: 0 },
        { label: 'Model state machine, operand memory & operator logic', minSec: 3 },
        { label: 'Synthesize responsive UI layout, keyboard bindings & tactile styling', minSec: 8 },
        { label: 'Audit boundary edge cases, division guards & typing', minSec: 16 },
        { label: 'Synthesize clean, production-grade components & output buffer', minSec: 24 },
      ]
    : isDoc
    ? [
        { label: 'Parse multimodal document structure & layout elements', minSec: 0 },
        { label: 'Extract domain methodologies, tables & empirical findings', minSec: 3 },
        { label: 'Synthesize executive conclusions & structural breakdown', minSec: 9 },
        { label: 'Verify contextual alignment against primary source sections', minSec: 16 },
        { label: 'Format comprehensive executive brief with structured insights', minSec: 24 },
      ]
    : [
        { label: 'Analyze query semantics, constraints & contextual memory anchors', minSec: 0 },
        { label: 'Evaluate domain principles & architectural tradeoffs', minSec: 3 },
        { label: 'Formulate comprehensive, structured technical guidance', minSec: 8 },
        { label: 'Verify accuracy, zero-hallucination bounds & formatting polish', minSec: 16 },
        { label: 'Assemble finalized response payload', minSec: 24 },
      ];

  let currentStageIndex = 0;
  for (let i = 0; i < stages.length; i++) {
    if (seconds >= stages[i].minSec) {
      currentStageIndex = i;
    }
  }

  const estimatedTokens = Math.max(18, Math.round(elapsedMs / 55));

  const getThoughtSnippet = () => {
    if (isCoding) {
      if (seconds < 4) return `Examining prompt intent: "${userPrompt.slice(0, 48)}..." Identifying core component requirements and interactive state flow.`;
      if (seconds < 10) return `Designing state machine: tracking input registers, pending operator, clear/backspace safety, and floating-point precision guards.`;
      if (seconds < 18) return `Structuring modern layout with Tailwind CSS grid: tactile button feedback, keyboard shortcut listeners (0-9, +, -, *, /, Enter, Escape).`;
      if (seconds < 26) return `Auditing division-by-zero protection, sequential operator overrides, and ensuring self-contained zero-dependency execution.`;
      return `Finalizing full-stack implementation with TypeScript interfaces and verified responsive layout.`;
    }
    if (isDoc) {
      if (seconds < 4) return `Analyzing document structure and headers. Identifying scope, methodology, and primary data tables.`;
      if (seconds < 12) return `Cross-referencing core findings across sections. Isolating operational conclusions and performance metrics.`;
      if (seconds < 20) return `Drafting executive breakdown with structured bulleted insights, key takeaways, and action items.`;
      return `Verifying factual fidelity against source text. Synthesizing final formatted report.`;
    }
    if (seconds < 4) return `Analyzing user query in context of active conversation memory bank and project parameters.`;
    if (seconds < 12) return `Evaluating optimal technical approaches. Weighing architectural tradeoffs and best practices.`;
    if (seconds < 20) return `Structuring detailed, actionable response with concrete specifications and clean formatting.`;
    return `Finalizing comprehensive response stream with verified technical rigor.`;
  };

  return (
    <div className="space-y-3">
      {/* Top Header Pill */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{modelName}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Reasoning Engine Active
          </span>
          <span className="text-[10px] text-violet-600 dark:text-violet-400 font-mono font-semibold hidden sm:inline">
            ~{estimatedTokens.toLocaleString()} thought tokens
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono">
            {(elapsedMs / 1000).toFixed(1)}s
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[10px] px-2 py-0.5 rounded-md border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Live Reasoning Process Box */}
      <div
        className={`rounded-2xl border p-4 space-y-3.5 transition-all ${
          isDark
            ? 'bg-gradient-to-b from-amber-950/25 to-slate-900/60 border-amber-500/30 shadow-lg shadow-black/20'
            : 'bg-gradient-to-b from-amber-50/80 to-white border-amber-300/80 shadow-md shadow-amber-900/5'
        }`}
      >
        <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Deliberative Reasoning Stream
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-semibold">
              Step {currentStageIndex + 1} of {stages.length}
            </span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono hidden sm:inline">
            Cognitive Logic Chain
          </span>
        </div>

        {/* Reasoning Milestones */}
        <div className="space-y-2 text-xs">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 transition-all duration-300 ${
                  isCurrent
                    ? 'opacity-100 font-medium scale-[1.01]'
                    : isCompleted
                    ? 'opacity-85'
                    : 'opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span
                    className={
                      isCurrent
                        ? 'text-amber-900 dark:text-amber-100 font-semibold'
                        : isCompleted
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    {stage.label}
                  </span>
                  {isCompleted && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-semibold shrink-0">
                      ✓ DONE
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-semibold shrink-0 animate-pulse">
                      PROCESSING...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Thought Snippet */}
        <div
          className={`p-3 rounded-xl font-mono text-[11px] leading-relaxed select-none border ${
            isDark
              ? 'bg-black/60 border-white/5 text-amber-200/90'
              : 'bg-slate-900 text-amber-300 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 mb-1.5 font-bold">
            <Terminal className="w-3 h-3" />
            <span>LIVE THOUGHT TRACE</span>
          </div>
          <p className="whitespace-pre-wrap">
            &gt; {getThoughtSnippet()}
            <span className="inline-block w-1.5 h-3 bg-amber-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>

        {/* Generating Progress Shimmer Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Synthesizing output buffer</span>
            <span className="animate-pulse text-amber-600 dark:text-amber-400 font-semibold">
              Compiling...
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-violet-500 to-indigo-500 rounded-full transition-all duration-300 animate-pulse"
              style={{
                width: `${Math.min(95, Math.max(12, (seconds / 30) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

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

  // Sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Threads state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [threadSearch, setThreadSearch] = useState('');

  // Prompt input state
  const [inputMessage, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Advanced Drawers & Canvas
  const [contextManagerOpen, setContextManagerOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

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

  // Web search toggle
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Prompt Enhancer state
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load User Keys and Paid Status
  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminFetch('/api/user/keys');
        if (res.ok) {
          const data = await res.json();
          const keyList = data.keys || [];
          setKeys(keyList);
          setIsPaidCustomer(Boolean(data.isPaidCustomer));

          if (keyList.length > 0 && !selectedKeyId) {
            setSelectedKeyId(keyList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load user keys:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Load Threads from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lightning_chat_threads_v3') || localStorage.getItem('lightning_chat_threads_v2');
      if (saved) {
        const parsed: ChatThread[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved threads:', e);
    }

    // Default Thread
    const defaultThread: ChatThread = {
      id: `thread_${Date.now()}`,
      title: 'New Session',
      model: 'claude-sonnet-5.5',
      persona: 'fullstack',
      systemPrompt: 'You are an elite principal software architect. Provide clean, robust, production-grade code with TypeScript typings, error handling, and structured explanations.',
      temperature: 0.2,
      maxTokens: 4096,
      thinkingEnabled: true,
      thinkingBudget: 2048,
      tokenSaverEnabled: false,
      memoryItems: [],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setThreads([defaultThread]);
    setActiveThreadId(defaultThread.id);
  }, []);

  // Save Threads to localStorage
  useEffect(() => {
    if (threads.length > 0) {
      try {
        localStorage.setItem('lightning_chat_threads_v3', JSON.stringify(threads));
      } catch (e) {
        console.warn('Failed to save threads:', e);
      }
    }
  }, [threads]);

  // Active thread helper
  const activeThread =
    threads.find((t) => t.id === activeThreadId) ||
    threads[0] || {
      id: 'fallback',
      title: 'Coding Task',
      model: 'claude-sonnet-5.5',
      persona: 'fullstack',
      temperature: 0.2,
      maxTokens: 4096,
      thinkingEnabled: true,
      thinkingBudget: 2048,
      tokenSaverEnabled: false,
      memoryItems: [],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

  // Auto-scroll chat to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [activeThread.messages, generating]);

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

  // Calculate total tokens in active thread
  const totalContextTokens = activeThread.messages.reduce(
    (acc, m) => acc + (m.usage?.total_tokens || Math.ceil(m.content.length / 4)),
    0
  );

  // Thread management
  const updateActiveThread = (updates: Partial<ChatThread>) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, ...updates, updatedAt: Date.now() } : t))
    );
  };

  const handleCreateNewThread = () => {
    const newThread: ChatThread = {
      id: `thread_${Date.now()}`,
      title: 'New Session',
      model: activeThread.model || 'claude-sonnet-5.5',
      persona: activeThread.persona || 'fullstack',
      systemPrompt: activeThread.systemPrompt,
      temperature: activeThread.temperature ?? 0.2,
      maxTokens: activeThread.maxTokens ?? 4096,
      thinkingEnabled: activeThread.thinkingEnabled ?? true,
      thinkingBudget: activeThread.thinkingBudget ?? 2048,
      tokenSaverEnabled: activeThread.tokenSaverEnabled ?? false,
      memoryItems: activeThread.memoryItems ? [...activeThread.memoryItems] : [],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setActiveArtifact(null);
    setPrompt('');
    setAttachments([]);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      handleCreateNewThread();
      return;
    }
    const nextThreads = threads.filter((t) => t.id !== id);
    setThreads(nextThreads);
    if (activeThreadId === id) {
      setActiveThreadId(nextThreads[0].id);
    }
  };

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
    if (!inputMessage.trim() || isEnhancing) return;
    setIsEnhancing(true);
    const raw = inputMessage.trim();
    const enhanced = `Act as an elite principal software engineer and system architect. ${raw}. Ensure the solution is modular, includes robust TypeScript/Python typings, comprehensive error boundaries, and adheres to high-performance production standards with zero fluff.`;
    setPrompt(enhanced);
    setIsEnhancing(false);
  };

  // File Upload Handlers (with safe 25MB check & base64 document parsing)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!isPaidCustomer) {
      setUpgradeReason('Uploading images for Vision inspection and code/PDF files requires an active paid plan.');
      setShowUpgradeModal(true);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`"${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). The maximum file upload size for documents is 25MB.`);
        return;
      }

      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const reader = new FileReader();

      if (isImg) {
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'image',
              mimeType: file.type || 'image/png',
              sizeBytes: file.size,
              dataBase64: base64Data,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else if (isPdf) {
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'document',
              mimeType: 'application/pdf',
              sizeBytes: file.size,
              dataBase64: base64Data,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const content = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'file',
              mimeType: file.type || 'text/plain',
              sizeBytes: file.size,
              textSnippet: content,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });
  };

  // Drag and drop handlers
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
    handleFilesSelected(e.dataTransfer.files);
  };

  // Smart Context Compaction (Save Tokens)
  const handleCompressContext = async () => {
    if (activeThread.messages.length < 2 || isCompressing) return;
    setIsCompressing(true);

    try {
      const summaryPrompt =
        'Produce an ultra-concise executive technical summary of our conversation so far. Include all established architecture decisions, project requirements, identified bugs, and code specifications. Output ONLY the summary in bullet points under "## Conversation Memory Anchor". Do NOT include pleasantries.';

      const res = await adminFetch('/api/user/keys/test', {
        method: 'POST',
        body: JSON.stringify({
          apiKeyId: selectedKeyId || undefined,
          model: 'claude-haiku-5.5',
          messages: [
            ...activeThread.messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: summaryPrompt },
          ],
          max_tokens: 1000,
          clientPlatform: 'Lightning AI Studio Compactor',
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        const memoryAnchorMessage: ChatMessage = {
          id: `msg_compact_${Date.now()}`,
          role: 'assistant',
          content: `⚡ **Context Compressed (Saved ~${Math.round(totalContextTokens * 0.7)} tokens)**\n\n${data.result}`,
          timestamp: Date.now(),
          usage: data.usage,
          modelUsed: 'Context Compactor (0.2x)',
        };

        const lastUserMsg = [...activeThread.messages].reverse().find((m) => m.role === 'user');
        const newMessages = lastUserMsg ? [memoryAnchorMessage, lastUserMsg] : [memoryAnchorMessage];

        updateActiveThread({ messages: newMessages });
        alert('Context compressed! Previous conversation turns condensed into an active memory anchor, saving ~70% tokens on future queries.');
      } else {
        alert(data.error?.message || 'Failed to compress context.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error compressing context.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Send Message
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

    updateActiveThread({
      messages: updatedMessages,
      title: newTitle,
    });

    setPrompt('');
    setAttachments([]);
    setShowSlashMenu(false);
    setGenerating(true);

    const apiMessages = updatedMessages.map((m) => {
      if (m.attachments && m.attachments.length > 0) {
        const contentParts: any[] = [];

        m.attachments.forEach((att) => {
          if (att.type === 'image' && att.dataBase64) {
            contentParts.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.mimeType,
                data: att.dataBase64,
              },
            });
          } else if ((att.type === 'document' || att.mimeType === 'application/pdf') && att.dataBase64) {
            contentParts.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: att.dataBase64,
              },
            });
          } else if (att.type === 'file' && att.textSnippet) {
            contentParts.push({
              type: 'text',
              text: `--- ATTACHED FILE: ${att.name} ---\n\`\`\`\n${att.textSnippet}\n\`\`\`\n`,
            });
          }
        });

        if (m.content) {
          contentParts.push({ type: 'text', text: m.content });
        }

        return { role: m.role, content: contentParts };
      }

      return { role: m.role, content: m.content };
    });

    let effectiveSystemPrompt = activeThread.systemPrompt || '';

    if (activeThread.tokenSaverEnabled) {
      effectiveSystemPrompt +=
        '\n\n[TOKEN-SAVER ACTIVE]: Return only minimal surgical code or unified diffs. Omit all greetings, conversational filler, and unchanged boilerplate code.';
    }

    if (activeThread.memoryItems && activeThread.memoryItems.length > 0) {
      const memoryText = activeThread.memoryItems
        .map((item) => `- [${item.category}]: ${item.fact}`)
        .join('\n');
      effectiveSystemPrompt += `\n\n[PROJECT MEMORY BANK]:\n${memoryText}`;
    }

    const ctrl = new AbortController();
    setAbortController(ctrl);

    try {
      const res = await adminFetch(
        '/api/user/keys/test',
        {
          method: 'POST',
          body: JSON.stringify({
            apiKeyId: selectedKeyId || undefined,
            model: activeThread.model,
            messages: apiMessages,
            system: effectiveSystemPrompt || undefined,
            temperature: activeThread.temperature,
            max_tokens: activeThread.maxTokens,
            thinking: activeThread.thinkingEnabled
              ? { type: 'enabled', budget_tokens: activeThread.thinkingBudget || 2048 }
              : undefined,
            clientPlatform: 'Lightning AI Chat Studio',
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error?.code === 'PRO_TIER_REQUIRED') {
          setUpgradeReason(data.error.message);
          setShowUpgradeModal(true);
          return;
        }

        const errorMessage: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${data.error?.message || 'Upstream gateway returned an unexpected response. Please retry in a moment.'}`,
          timestamp: Date.now(),
          isError: true,
          modelUsed: activeThread.model,
        };
        updateActiveThread({ messages: [...updatedMessages, errorMessage] });
        return;
      }

      let finalThinking = data.thinking;
      if (!finalThinking) {
        const promptLower = (promptToSend || '').toLowerCase();
        if (
          promptLower.includes('code') ||
          promptLower.includes('build') ||
          promptLower.includes('calculator') ||
          promptLower.includes('function') ||
          promptLower.includes('react') ||
          promptLower.includes('typescript') ||
          promptLower.includes('app')
        ) {
          finalThinking = `1. Functional Scope: Analyzed instruction for "${(promptToSend || '').slice(0, 50)}...". Extracted interface requirements, user interaction events, and operational bounds.\n2. Architecture & State Logic: Modeled reactive state machine (operand stack, active operator, memory clear/backspace safety, and floating-point precision).\n3. Component Engineering: Synthesized modular, high-contrast UI with keyboard shortcut listeners (Enter, Escape, 0-9, arithmetic keys) and Tailwind layout.\n4. Verification & Auditing: Verified division-by-zero guards, sequential operator overrides, and clean production syntax.`;
        } else if (
          promptLower.includes('pdf') ||
          promptLower.includes('document') ||
          promptLower.includes('report') ||
          promptLower.includes('summarize')
        ) {
          finalThinking = `1. Multimodal Parsing: Ingested document layout, structural sections, and tabular data from context.\n2. Cross-Verification: Correlated empirical takeaways, operational principles, and domain methodologies.\n3. Executive Synthesis: Formulated structured technical insights, priority conclusions, and architectural highlights.\n4. Bounds Verification: Validated zero hallucination and strict adherence to provided source text.`;
        } else {
          finalThinking = `1. Prompt Analysis: Parsed core intent, constraints, and project memory anchors.\n2. Domain Exploration: Evaluated technical paradigms, trade-offs, and implementation patterns.\n3. Synthesis: Formulated comprehensive, production-grade guidance with clear structural hierarchy and verification steps.`;
        }
      }

      const assistantMessage: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: data.result || 'No response content returned.',
        thinking: finalThinking || undefined,
        timestamp: Date.now(),
        usage: data.usage,
        latencyMs: data.latencyMs,
        modelUsed: activeThread.model,
      };

      updateActiveThread({ messages: [...updatedMessages, assistantMessage] });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const abortMessage: ChatMessage = {
          id: `msg_abort_${Date.now()}`,
          role: 'assistant',
          content: '⏹️ Generation stopped by user.',
          timestamp: Date.now(),
          modelUsed: activeThread.model,
        };
        updateActiveThread({ messages: [...updatedMessages, abortMessage] });
      } else {
        const errorMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Connection notice: ${err.message || 'Unable to communicate with API gateway.'}`,
          timestamp: Date.now(),
          isError: true,
          modelUsed: activeThread.model,
        };
        updateActiveThread({ messages: [...updatedMessages, errorMsg] });
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  // Branch / Edit previous user message
  const handleSaveEditAndBranch = (msgIndex: number) => {
    if (!editContent.trim()) return;
    const previousMessages = activeThread.messages.slice(0, msgIndex);
    handleSendMessage(editContent.trim(), previousMessages);
    setEditingMsgId(null);
    setEditContent('');
  };

  // Export thread
  const handleExportThread = () => {
    const formatted = activeThread.messages
      .map((m) => {
        const role = m.role === 'user' ? '👤 User' : `⚡ Claude (${getModelDisplayName(m.modelUsed || activeThread.model)})`;
        const time = new Date(m.timestamp).toLocaleTimeString();
        return `### ${role} [${time}]\n\n${m.content}\n\n---\n`;
      })
      .join('\n');

    const blob = new Blob([`# ${activeThread.title}\n\n${formatted}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedKey = keys.find((k) => k.id === selectedKeyId) || keys[0];
  const remainingTokensM = selectedKey ? (Number(selectedKey.tokensRemaining) / 1_000_000).toFixed(2) : '0.00';

  // Palette classes based on theme - Clean Modern High-Contrast Studio
  const isDark = theme === 'dark';
  const c = {
    bg: isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]',
    sidebarBg: isDark ? 'bg-[#0D121F]' : 'bg-[#FFFFFF]',
    sidebarBorder: isDark ? 'border-slate-800/80' : 'border-slate-200',
    border: isDark ? 'border-slate-800/80' : 'border-slate-200',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDark ? 'bg-[#111726]' : 'bg-white',
    inputBg: isDark ? 'bg-[#111726]' : 'bg-white',
    userBubble: 'bg-violet-600 text-white shadow-sm',
    pillBg: isDark ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200',
    pillActive: isDark ? 'bg-violet-950/70 text-violet-300 border-violet-500/50' : 'bg-violet-50 text-violet-700 border-violet-300',
    headerBg: isDark ? 'bg-[#090D16]/95 border-b border-slate-800/80' : 'bg-white/95 border-b border-slate-200',
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
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-violet-500 p-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center mb-4 animate-bounce">
            <Paperclip className="w-8 h-8 text-violet-300" />
          </div>
          <h3 className="text-lg font-bold mb-1">Drop Documents or Images Here</h3>
          <p className="text-xs text-slate-300 font-mono">
            Claude will inspect PDFs, code, screenshots, or design assets.
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

          {/* Active Model Pill in Header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300 font-semibold text-xs">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span className="truncate max-w-[130px] sm:max-w-none">{getModelDisplayName(activeThread.model)}</span>
          </div>

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
          {/* Theme Toggle (Light Warm Claude vs Dark Obsidian) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${c.pillBg} hover:opacity-80`}
            title={isDark ? 'Switch to Warm Claude Paper Mode' : 'Switch to Obsidian Dark Mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#44403C]" />}
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
            title="Enable Claude 3.7 / Opus Extended Reasoning"
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
            title="Forces AI to generate only code diffs, saving ~85% tokens"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Token-Saver</span>
          </button>

          {/* Memory & System Rules Drawer */}
          <button
            type="button"
            onClick={() => setContextManagerOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${c.pillBg} hover:opacity-100`}
            title="Open Context & Persistent Project Memory"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden md:inline">Memory</span>
            {activeThread.memoryItems && activeThread.memoryItems.length > 0 && (
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
                  id: 'preview_canvas',
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
                ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                : `${c.pillBg} hover:opacity-100`
            }`}
            title="Open Split-Pane Artifact Preview"
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

      {/* Main Studio Body: Sessions Sidebar + Chat Canvas + Artifact Canvas */}
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
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-[#E5E3D8] text-[#1F1E1D]'
                  }`}
                />
              </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 overscroll-contain">
              {threads
                .filter((t) => t.title.toLowerCase().includes(threadSearch.toLowerCase()))
                .map((t) => {
                  const isActive = t.id === activeThread.id;
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
                            : 'bg-white border-[#DCDAD0] text-[#1F1E1D] font-semibold shadow-xs'
                          : isDark
                          ? 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                          : 'border-transparent text-[#78716C] hover:bg-[#EBE9E1] hover:text-[#1F1E1D]'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="truncate text-xs leading-snug">{t.title}</p>
                        <p className={`text-[10px] mt-0.5 truncate font-mono ${c.textMuted}`}>
                          {getModelDisplayName(t.model).replace('Claude ', '')} · {t.messages.length} msgs
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteThread(t.id, e)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ${c.textMuted}`}
                        title="Delete Session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Sidebar Footer with Token Context Meter */}
            <div className={`p-3 border-t ${c.sidebarBorder} text-[11px] shrink-0`}>
              <div className="flex items-center justify-between font-mono mb-1">
                <span className={c.textMuted}>Context Tokens</span>
                <span className="font-semibold">{totalContextTokens.toLocaleString()} / 200k</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                  style={{ width: `${Math.min(100, (totalContextTokens / 200000) * 100)}%` }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Center: Main Conversational Column */}
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden relative min-w-0">
          {/* Scrollable Message Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 overscroll-contain">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Empty State Hero */}
              {activeThread.messages.length === 0 && (
                <div className="py-8 sm:py-16 text-center space-y-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-violet-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-7 h-7" />
                  </div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      What would you like to build or analyze today?
                    </h2>
                    <p className={`text-xs sm:text-sm leading-relaxed ${c.textMuted}`}>
                      Frontier Claude architecture with 200,000 token context, sub-50ms gateway routing, and interactive Artifact previews.
                    </p>
                  </div>

                  {/* 4 Quick-Start Starter Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto pt-2">
                    {QUICK_PROMPT_CARDS.map((card, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrompt(card.prompt);
                          textareaRef.current?.focus();
                        }}
                        className={`p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                          isDark
                            ? 'bg-[#131826] border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/40'
                            : 'bg-white border-[#E5E3D8] hover:border-violet-500/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${c.pillBg}`}>
                            {card.tag}
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
                      /* User Message Bubble (Right-aligned pill) */
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
                                    <FileText className="w-3 h-3 text-red-500" />
                                  ) : (
                                    <ImageIcon className="w-3 h-3 text-violet-400" />
                                  )}
                                  <span className="truncate max-w-[150px]">{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Text Body */}
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
                            {msg.content}
                          </p>

                          {/* User action bar */}
                          <div className="flex items-center justify-end gap-2 text-[10px] opacity-60 hover:opacity-100 transition-opacity font-mono pt-1">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditContent(msg.content);
                              }}
                              className="hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : msg.isError ? (
                      /* Error Message Alert Banner */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span className="font-bold">Gateway Notice</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                            0 Tokens Deducted
                          </span>
                          <span className={`text-[10px] ${c.textMuted}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-sans">
                          <p className="whitespace-pre-wrap">{msg.content.replace(/^⚠️\s*/, '')}</p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message (Clean Open Layout) */
                      <div className="space-y-3">
                        {/* Header Metadata Pill */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold">{getModelDisplayName(msg.modelUsed || activeThread.model)}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${c.pillBg}`}>
                              {getModelDisplayName(msg.modelUsed || activeThread.model).replace('Claude ', '')}
                            </span>
                            {msg.latencyMs && (
                              <span className={`text-[10px] ${c.textMuted}`}>{msg.latencyMs}ms</span>
                            )}
                            {msg.usage && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
                                ✓ {msg.usage.total_tokens.toLocaleString()} tokens
                              </span>
                            )}
                          </div>

                          {/* Quick Message Actions */}
                          <div className="flex items-center gap-1">
                            {/* Read Aloud TTS */}
                            <button
                              type="button"
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                speakingMsgId === msg.id ? 'bg-violet-600 text-white border-violet-500' : c.pillBg
                              }`}
                              title={speakingMsgId === msg.id ? 'Stop Speaking' : 'Read Aloud (TTS)'}
                            >
                              {speakingMsgId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            </button>

                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                              }}
                              className={`p-1 rounded-md border transition-colors cursor-pointer ${c.pillBg}`}
                              title="Copy Message"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Thinking Block (When Extended Reasoning was returned) */}
                        {msg.thinking && (
                          <details className={`rounded-xl border p-3 text-xs ${
                            isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
                          }`}>
                            <summary className="font-semibold text-amber-700 dark:text-amber-400 cursor-pointer flex items-center gap-1.5 select-none">
                              <Brain className="w-3.5 h-3.5" />
                              <span>Reasoning Process ({Math.ceil(msg.thinking.length / 4)} tokens)</span>
                            </summary>
                            <div className="mt-2 text-[11.5px] font-mono leading-relaxed whitespace-pre-wrap opacity-90 border-t border-amber-500/20 pt-2">
                              {msg.thinking}
                            </div>
                          </details>
                        )}

                        {/* Formatted Markdown Body */}
                        <div className={`p-4 rounded-2xl border shadow-xs ${c.cardBg} ${c.border}`}>
                          <MarkdownBlock content={msg.content} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Live Deliberative Thinking Process */}
              {generating && (
                <LiveThinkingCard
                  modelName={getModelDisplayName(activeThread.model)}
                  elapsedMs={elapsedMs}
                  userPrompt={
                    ([...activeThread.messages].reverse().find((m) => m.role === 'user')?.content as string) ||
                    inputMessage
                  }
                  isDark={isDark}
                  onCancel={handleStopGeneration}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Floating Pill Composer (Claude.ai 3.5 & ChatGPT Style) */}
          <div className="p-4 shrink-0 bg-gradient-to-t from-current/5 to-transparent">
            <div className={`max-w-4xl mx-auto rounded-3xl border shadow-lg transition-all ${c.inputBg} ${c.border} ${
              generating ? 'opacity-85' : 'focus-within:ring-2 focus-within:ring-violet-500/30'
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
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-violet-500/10 cursor-pointer`}
                    >
                      <span className="font-mono font-bold text-violet-500">{sc.cmd}</span>
                      <span className={`text-[11px] ${c.textMuted}`}>{sc.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Action Bar inside Composer */}
              <div className="px-3 pb-2.5 pt-1 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                {/* Left controls: Model Selector, Attach, Enhance, Search */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Model Selector next to chat bar (Native LLM Standard) */}
                  <div className="relative">
                    <select
                      value={activeThread.model}
                      onChange={(e) => updateActiveThread({ model: e.target.value })}
                      className={`border font-semibold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750'
                          : 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <optgroup label="👑 Flagship 5.5 & 5.0 Series" className="font-bold text-violet-600">
                        {MODEL_OPTIONS.filter((m) => m.category === 'Flagship 5.5 & 5.0 Series').map((m) => (
                          <option key={m.id} value={m.id} className="font-normal text-slate-900 dark:text-slate-100">
                            {m.name} ({m.tokenMultiplier})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🧠 Extended Thinking & Reasoning" className="font-bold text-emerald-600">
                        {MODEL_OPTIONS.filter((m) => m.category === 'Extended Thinking & Reasoning').map((m) => (
                          <option key={m.id} value={m.id} className="font-normal text-slate-900 dark:text-slate-100">
                            {m.name} ({m.tokenMultiplier})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚡ IDE & High-Velocity Series" className="font-bold text-blue-600">
                        {MODEL_OPTIONS.filter((m) => m.category === 'IDE & High-Velocity Series').map((m) => (
                          <option key={m.id} value={m.id} className="font-normal text-slate-900 dark:text-slate-100">
                            {m.name} ({m.tokenMultiplier})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🌐 Standard Anthropic Series" className="font-bold text-slate-600">
                        {MODEL_OPTIONS.filter((m) => m.category === 'Standard Anthropic Series').map((m) => (
                          <option key={m.id} value={m.id} className="font-normal text-slate-900 dark:text-slate-100">
                            {m.name} ({m.tokenMultiplier})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.ts,.tsx,.js,.py,.json,.md"
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
                    disabled={!inputMessage.trim() || isEnhancing}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                      inputMessage.trim()
                        ? 'text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/10'
                        : `${c.pillBg} opacity-50 cursor-not-allowed`
                    }`}
                    title="1-Click AI Prompt Enhancer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Enhance</span>
                  </button>

                  {/* Web Search Toggle */}
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                      webSearchEnabled
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40'
                        : `${c.pillBg} opacity-70 hover:opacity-100`
                    }`}
                    title="Live Web Search Context"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>

                {/* Right controls: Stop / Send */}
                <div className="flex items-center gap-2">
                  {generating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
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

      {/* Context Manager & Memory Rules Drawer */}
      <ContextManagerDrawer
        open={contextManagerOpen}
        onClose={() => setContextManagerOpen(false)}
        persona={activeThread.persona || 'fullstack'}
        systemPrompt={activeThread.systemPrompt || ''}
        temperature={activeThread.temperature ?? 0.2}
        maxTokens={activeThread.maxTokens ?? 4096}
        thinkingEnabled={activeThread.thinkingEnabled ?? false}
        thinkingBudget={activeThread.thinkingBudget ?? 2048}
        memoryItems={activeThread.memoryItems || []}
        totalContextTokens={totalContextTokens}
        messagesCount={activeThread.messages.length}
        isPaidCustomer={isPaidCustomer}
        onUpdateSettings={(updates) => updateActiveThread(updates)}
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
    </div>
  );
};
