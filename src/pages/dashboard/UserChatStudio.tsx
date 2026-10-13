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
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  latencyMs?: number;
  modelUsed?: string;
  thinking?: string | null;
  savedTokensEstimate?: number;
}

interface ChatThread {
  id: string;
  title: string;
  model: string;
  persona: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  tokenSaverEnabled?: boolean;
  memoryItems?: ProjectMemoryItem[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const MODEL_OPTIONS = [
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude 3.7 Sonnet',
    badge: 'Frontier Coding & Reasoning',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-violet-400',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    badge: 'Vision & Multimodal',
    tokenMultiplier: '1x Token Baseline',
    color: 'text-cyan-400',
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude 3.5 Haiku',
    badge: 'Ultra-Fast • 5x Cheaper',
    tokenMultiplier: '0.2x Tokens (Lowest Cost)',
    color: 'text-emerald-400',
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude 3 Opus',
    badge: 'Cognitive Frontier Logic',
    tokenMultiplier: '2.5x Tokens (Deep Reasoning)',
    color: 'text-amber-400',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    badge: 'IDE Rapid Specialist',
    tokenMultiplier: '0.8x Tokens',
    color: 'text-indigo-400',
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

  // Threads state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [threadSearch, setThreadSearch] = useState('');

  // Active generation state
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Side-by-side Canvas & Drawers
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Message Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editPromptText, setEditPromptText] = useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Slash command popup
  const [showSlashMenu, setShowSlashMenu] = useState(false);

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

          // Default to first active key
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
      const saved = localStorage.getItem('lightning_chat_threads_v2') || localStorage.getItem('lightning_chat_threads_v1');
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

    // Default Thread if none exists
    const defaultThread: ChatThread = {
      id: `thread_${Date.now()}`,
      title: 'New Coding Task',
      model: 'claude-sonnet-5.5',
      persona: 'fullstack',
      systemPrompt: 'You are an elite principal full-stack engineer. Provide clean, robust, production-grade code with TypeScript typings, error handling, and zero conversational fluff.',
      temperature: 0.2,
      maxTokens: 4096,
      thinkingEnabled: false,
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
        localStorage.setItem('lightning_chat_threads_v2', JSON.stringify(threads));
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
      thinkingEnabled: false,
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
      title: 'New Coding Task',
      model: activeThread.model || 'claude-sonnet-5.5',
      persona: activeThread.persona || 'fullstack',
      systemPrompt: activeThread.systemPrompt,
      temperature: activeThread.temperature ?? 0.2,
      maxTokens: activeThread.maxTokens ?? 4096,
      thinkingEnabled: activeThread.thinkingEnabled ?? false,
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
    setInputMessage('');
    setAttachments([]);
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
        // Read text / code / document file
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
          model: 'claude-haiku-5.5', // Use fast, cheap model for summarization
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

        // Keep last user message + memory anchor to minimize token footprint
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

    // Check if free user is sending attachments
    if (attachments.length > 0 && !isPaidCustomer) {
      setUpgradeReason('Vision multimodal and document analysis are exclusive to active paid subscribers.');
      setShowUpgradeModal(true);
      return;
    }

    // Check if free user is exceeding 1 turn
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

    // Auto-update thread title on first message
    let newTitle = activeThread.title;
    if (activeThread.messages.length === 0) {
      newTitle = promptToSend.trim().slice(0, 36) || 'Coding Task';
      if (promptToSend.trim().length > 36) newTitle += '...';
    }

    const baseMessages = overrideMessages || activeThread.messages;
    const updatedMessages = [...baseMessages, userMessage];

    updateActiveThread({
      messages: updatedMessages,
      title: newTitle,
    });

    setInputMessage('');
    setAttachments([]);
    setShowSlashMenu(false);
    setGenerating(true);

    // Build payload for gateway
    const apiMessages = updatedMessages.map((m) => {
      if (m.attachments && m.attachments.length > 0) {
        const contentParts: any[] = [];

        // Image and Document content blocks
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

    // Injected System Prompt with Persistent Project Memory & Token-Saver instructions
    let effectiveSystemPrompt = activeThread.systemPrompt || '';

    // If Token-Saver is enabled, inject ultra-lean formatting rules
    if (activeThread.tokenSaverEnabled) {
      effectiveSystemPrompt +=
        '\n\n[TOKEN-SAVER ACTIVE]: Return only minimal surgical code or unified diffs. Omit all greetings, conversational filler, and unchanged boilerplate code.';
    }

    // If Project Memory Bank has items, append them
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
            clientPlatform: 'Lightning AI Studio',
          }),
          signal: ctrl.signal,
        },
        90000
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error?.code === 'PRO_TIER_REQUIRED') {
          setUpgradeReason(data.error?.message || 'Pro feature locked.');
          setShowUpgradeModal(true);
          return;
        }

        const assistantErrMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Request Error**: ${data.error?.message || 'Failed to generate response.'}`,
          timestamp: Date.now(),
        };
        updateActiveThread({ messages: [...updatedMessages, assistantErrMsg] });
        return;
      }

      const responseText =
        data.result ||
        data.content?.[0]?.text ||
        (typeof data.content === 'string' ? data.content : JSON.stringify(data.content));

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        thinking: data.thinking || null,
        timestamp: Date.now(),
        usage: data.usage,
        latencyMs: data.latencyMs,
        modelUsed: data.modelTested || activeThread.model,
      };

      // Auto-detect previewable HTML/React/SVG code and populate Artifact Canvas
      const codeMatch = responseText.match(/```(html|svg|tsx|jsx|typescript|javascript)\n([\s\S]*?)```/);
      if (codeMatch && !activeArtifact) {
        const lang = codeMatch[1];
        const code = codeMatch[2];
        if (lang === 'html' || lang === 'svg') {
          setActiveArtifact({
            id: `art_${Date.now()}`,
            title: `${lang.toUpperCase()} Component`,
            language: lang,
            code,
            type: lang as any,
          });
        }
      }

      updateActiveThread({ messages: [...updatedMessages, assistantMsg] });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const abortMsg: ChatMessage = {
          id: `msg_abort_${Date.now()}`,
          role: 'assistant',
          content: '⏹️ *Generation cancelled by user.*',
          timestamp: Date.now(),
        };
        updateActiveThread({ messages: [...updatedMessages, abortMsg] });
      } else {
        const errorMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Connection Error**: ${err.message || 'Failed to communicate with AI gateway.'}`,
          timestamp: Date.now(),
        };
        updateActiveThread({ messages: [...updatedMessages, errorMsg] });
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  // Branch / Edit message handler
  const handleStartEditMessage = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditPromptText(msg.content);
  };

  const handleSaveAndBranchMessage = (msgId: string) => {
    if (!editPromptText.trim()) return;

    // Cut messages at this point and branch
    const msgIndex = activeThread.messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    const previousHistory = activeThread.messages.slice(0, msgIndex);
    setEditingMessageId(null);
    handleSendMessage(editPromptText.trim(), previousHistory);
  };

  // Stop Generation
  const handleStopGenerating = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  // Export Chat
  const handleExportChat = (format: 'markdown' | 'json' = 'markdown') => {
    if (activeThread.messages.length === 0) return;

    let contentToExport = '';
    let filename = `${activeThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    if (format === 'json') {
      contentToExport = JSON.stringify(activeThread, null, 2);
      filename += '.json';
    } else {
      let md = `# ${activeThread.title}\n`;
      md += `*Model: ${activeThread.model} • Exported from Lightning Deals AI Studio*\n\n---\n\n`;

      activeThread.messages.forEach((m) => {
        const sender = m.role === 'user' ? '👤 User' : '⚡ Claude Assistant';
        md += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n`;
        if (m.attachments && m.attachments.length > 0) {
          md += `*Attachments: ${m.attachments.map((a) => a.name).join(', ')}*\n\n`;
        }
        if (m.thinking) {
          md += `<details><summary>Thinking Process</summary>\n\n${m.thinking}\n</details>\n\n`;
        }
        md += `${m.content}\n\n`;
        if (m.usage) {
          md += `> Tokens: In ${m.usage.input_tokens} / Out ${m.usage.output_tokens} • Latency: ${m.latencyMs}ms\n\n`;
        }
        md += `---\n\n`;
      });
      contentToExport = md;
      filename += '.md';
    }

    const blob = new Blob([contentToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loadingInitial) {
    return (
      <div className="py-28 text-center space-y-3 bg-[#090d16] rounded-2xl border border-slate-800 p-8">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading developer AI Studio environment...</p>
      </div>
    );
  }

  const selectedKey = keys.find((k) => k.id === selectedKeyId);
  const remainingTokensM = selectedKey ? (Number(BigInt(selectedKey.tokensRemaining || '0')) / 1000000).toFixed(2) : '0';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-[calc(100vh-6.5rem)] min-h-[640px] bg-[#090d16] rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden font-sans text-slate-100"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-violet-500 p-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center mb-4 animate-bounce">
            <Paperclip className="w-8 h-8 text-violet-300" />
          </div>
          <h3 className="text-lg font-bold mb-1">Drop Documents or Images Here</h3>
          <p className="text-xs text-slate-300 font-mono">
            Claude will inspect PDFs, code, screenshots, or design assets.
          </p>
        </div>
      )}

      {/* Studio Header Bar */}
      <header className="h-14 px-4 bg-[#0e1424] border-b border-slate-800 flex items-center justify-between shrink-0 text-xs font-mono">
        {/* Left: Model & Key Selector */}
        <div className="flex items-center gap-3">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <select
              value={activeThread.model}
              onChange={(e) => updateActiveThread({ model: e.target.value })}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name} ({m.tokenMultiplier})
                </option>
              ))}
            </select>
          </div>

          {/* Key Selector */}
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer max-w-[190px] truncate"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.id} className="bg-slate-900">
                  {k.name} ({k.displayKey})
                </option>
              ))}
            </select>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              {remainingTokensM}M rem
            </span>
          </div>
        </div>

        {/* Right: Controls (Thinking, Token-Saver, Memory, Canvas, Export) */}
        <div className="flex items-center gap-2">
          {/* Thinking Mode Toggle */}
          <button
            type="button"
            onClick={() => updateActiveThread({ thinkingEnabled: !activeThread.thinkingEnabled })}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeThread.thinkingEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="Enable Claude 3.7 Extended Thinking (Chain-of-Thought Reasoning)"
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Thinking</span>
          </button>

          {/* Token-Saver Diffs Toggle */}
          <button
            type="button"
            onClick={() => updateActiveThread({ tokenSaverEnabled: !activeThread.tokenSaverEnabled })}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeThread.tokenSaverEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="Token-Saver Mode: Returns minimal surgical diffs without boilerplate (saves tokens)"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Token-Saver</span>
          </button>

          {/* Context Memory Drawer Button */}
          <button
            type="button"
            onClick={() => setShowMemoryDrawer(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open Chat Memory & Project Context Rules"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden lg:inline">Memory & Rules</span>
            {activeThread.memoryItems && activeThread.memoryItems.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            )}
          </button>

          {/* Toggle Split-Pane Canvas */}
          <button
            type="button"
            onClick={() => {
              if (activeArtifact) {
                setActiveArtifact(null);
              } else {
                // Find first code block in conversation or create a default code scratchpad
                const lastCodeMsg = [...activeThread.messages].reverse().find((m) => m.content.includes('```'));
                if (lastCodeMsg) {
                  const match = lastCodeMsg.content.match(/```(\w+)?\n([\s\S]*?)```/);
                  if (match) {
                    setActiveArtifact({
                      id: `art_${Date.now()}`,
                      title: 'Code Canvas',
                      language: match[1] || 'typescript',
                      code: match[2],
                    });
                    return;
                  }
                }
                setActiveArtifact({
                  id: `art_scratch`,
                  title: 'Artifact Canvas',
                  language: 'typescript',
                  code: '// Interactive Claude Canvas\n// Any code blocks or live preview components will display here.\n',
                });
              }
            }}
            className={`p-1.5 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeArtifact
                ? 'bg-violet-600/30 text-violet-200 border-violet-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle interactive code canvas split-pane"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Canvas</span>
          </button>

          {/* Export Chat */}
          <button
            type="button"
            onClick={() => handleExportChat('markdown')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Export conversation as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Chat Stream + Split-Pane Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Session Threads */}
        <aside className="w-60 border-r border-slate-800 bg-[#0c101c] flex flex-col justify-between hidden md:flex shrink-0">
          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {/* New Session Button */}
            <button
              type="button"
              onClick={handleCreateNewThread}
              className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center justify-between shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </div>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">⌘N</span>
            </button>

            {/* Session Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-800 rounded-lg focus:outline-none focus:border-violet-500 text-slate-200 placeholder:text-slate-500"
              />
            </div>

            {/* Sessions List */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 block pt-1">
                Recent Sessions
              </span>
              {threads
                .filter((t) => t.title.toLowerCase().includes(threadSearch.toLowerCase()))
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveThreadId(t.id);
                      setActiveArtifact(null);
                    }}
                    className={`p-2 px-2.5 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      activeThread.id === t.id
                        ? 'bg-slate-800/80 text-white font-bold border border-slate-700/60 shadow-xs'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Terminal className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      {editingTitleId === t.id ? (
                        <input
                          type="text"
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => {
                            if (tempTitle.trim()) {
                              updateActiveThread({ title: tempTitle.trim() });
                            }
                            setEditingTitleId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (tempTitle.trim()) {
                                updateActiveThread({ title: tempTitle.trim() });
                              }
                              setEditingTitleId(null);
                            }
                          }}
                          autoFocus
                          className="bg-black px-1.5 py-0.5 rounded text-xs text-white border border-violet-500 w-full focus:outline-none"
                        />
                      ) : (
                        <span className="truncate text-xs">{t.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(t.id);
                          setTempTitle(t.title);
                        }}
                        className="p-1 hover:text-violet-400"
                        title="Rename session"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteThread(t.id, e)}
                        className="p-1 hover:text-rose-400"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Sidebar Footer: Context Usage Meter */}
          <div className="p-3 border-t border-slate-800 bg-[#090d16] text-[11px] font-mono space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Context Memory</span>
              <span className="text-slate-200 font-bold">{Math.round(totalContextTokens / 1000)}k / 200k</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, Math.max(3, (totalContextTokens / 200000) * 100))}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Center: Main Chat Stream */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#090d16] relative overflow-hidden">
          {/* Messages Stream View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {activeThread.messages.length === 0 ? (
              <div className="py-12 sm:py-16 text-center max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-900/30">
                  <Bot className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-extrabold text-slate-100">
                    LightningDeals AI Chat Studio
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Powered by Claude 3.7 & frontier reasoning architecture. Code, inspect PDFs,
                    generate components, and debug errors with full context memory.
                  </p>
                </div>

                {/* Quick Action Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                  {[
                    {
                      title: '⚡ Build Full-Stack REST API',
                      prompt: 'Build a production-grade TypeScript REST API with Express, Zod schema validation, and error middleware.',
                    },
                    {
                      title: '🐛 Debug Error & Generate Diff',
                      prompt: 'Here is an error log and broken function. Diagnose the exact root cause and return a surgical diff fix.',
                    },
                    {
                      title: '📄 Analyze & Extract from PDF',
                      prompt: 'Summarize the attached document, identify architectural requirements, and extract key action items.',
                    },
                    {
                      title: '🎨 Design Interactive Component',
                      prompt: 'Design a responsive, modern React Tailwind dashboard card component with interactive hover states.',
                    },
                  ].map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(card.prompt)}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 text-left transition-all group cursor-pointer"
                    >
                      <div className="font-bold text-xs text-slate-200 group-hover:text-violet-300">
                        {card.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {card.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeThread.messages.map((msg) => (
                <div key={msg.id} className="space-y-2 group">
                  {/* User Message */}
                  {msg.role === 'user' ? (
                    <div className="flex flex-col items-end">
                      {/* Attached Chips */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1 justify-end">
                          {msg.attachments.map((att, i) => (
                            <div
                              key={i}
                              className="p-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs flex items-center gap-1.5 font-medium text-slate-300"
                            >
                              {att.type === 'image' ? (
                                <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                              <span className="truncate max-w-[140px] font-mono text-[11px]">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User Bubble */}
                      <div className="max-w-[85%] bg-[#131b2e] border border-slate-700/60 text-slate-100 p-3.5 px-4 rounded-2xl rounded-br-xs shadow-md">
                        {editingMessageId === msg.id ? (
                          <div className="space-y-2 w-full min-w-[280px]">
                            <textarea
                              rows={3}
                              value={editPromptText}
                              onChange={(e) => setEditPromptText(e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-violet-500 rounded-lg text-xs text-white focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMessageId(null)}
                                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveAndBranchMessage(msg.id)}
                                className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold"
                              >
                                Save & Branch
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed select-text">
                            {msg.content}
                          </p>
                        )}
                      </div>

                      {/* User Message Action Toolbar */}
                      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-500 font-mono">
                        <button
                          type="button"
                          onClick={() => handleStartEditMessage(msg)}
                          className="hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                          title="Edit message and branch conversation"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <Bot className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Assistant Header Metadata */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="font-bold text-slate-200">Claude Assistant</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {msg.modelUsed || activeThread.model}
                          </span>
                          {msg.latencyMs && (
                            <span className="text-[10px] text-slate-500">
                              {msg.latencyMs}ms
                            </span>
                          )}
                          {msg.usage && (
                            <span className="text-[10px] text-emerald-400/90 font-bold hidden sm:inline">
                              ✓ {msg.usage.total_tokens} tokens
                            </span>
                          )}
                        </div>

                        {/* Markdown Formatted Assistant Body */}
                        <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800/90 text-slate-200 shadow-sm">
                          <MarkdownBlock
                            content={msg.content}
                            thinkingContent={msg.thinking}
                            onOpenCanvas={(art) => setActiveArtifact(art)}
                          />
                        </div>

                        {/* Assistant Action Toolbar */}
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              alert('Response copied to clipboard!');
                            }}
                            className="hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              const lastUserMsg = [...activeThread.messages].reverse().find((m) => m.role === 'user');
                              if (lastUserMsg) {
                                handleSendMessage(lastUserMsg.content);
                              }
                            }}
                            className="hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Generating Indicator Pulse */}
            {generating && (
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div className="p-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.3s]" />
                  </div>
                  <span className="text-xs text-slate-300 font-mono">
                    Generating with {activeThread.model} ({Math.round(elapsedMs / 100) / 10}s)...
                  </span>
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    className="ml-3 px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold font-mono hover:bg-rose-900"
                  >
                    Stop (Esc)
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Files Preview Bar (Before Submit) */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
                Attachments ({attachments.length}):
              </span>
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="p-1 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-1.5 shrink-0"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[140px] text-slate-200">{att.name}</span>
                  <span className="text-[10px] text-slate-500">
                    ({Math.round(att.sizeBytes / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                    className="p-0.5 rounded hover:text-rose-400 text-slate-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Slash Commands Dropdown Popup */}
          {showSlashMenu && (
            <div className="absolute bottom-24 left-6 right-6 max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-40 space-y-1 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2 block">
                Quick Action Commands
              </span>
              {SLASH_COMMANDS.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  onClick={() => {
                    setInputMessage(item.cmd + ' ');
                    setShowSlashMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-violet-400">{item.cmd}</span>
                  <span className="text-slate-400 text-[11px]">{item.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Command Center */}
          <div className="p-4 bg-[#0e1424] border-t border-slate-800 shrink-0">
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-violet-500/80 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputMessage}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputMessage(val);
                  if (val === '/') {
                    setShowSlashMenu(true);
                  } else if (!val.startsWith('/')) {
                    setShowSlashMenu(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                  if (e.key === 'Escape') {
                    if (generating) handleStopGenerating();
                    setShowSlashMenu(false);
                  }
                }}
                placeholder="Ask Claude to code, debug an error, or drop files/images (Enter to send, Shift+Enter for newline, / for commands)..."
                className="w-full p-3.5 pr-28 text-xs text-slate-100 placeholder:text-slate-500 bg-transparent resize-none focus:outline-none leading-relaxed"
              />

              {/* Input Action Buttons */}
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Attach file, code, or image (Max 25MB)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={(!inputMessage.trim() && attachments.length === 0) || generating}
                  onClick={() => handleSendMessage()}
                  className="p-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Input Bar Helper Badges */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Gateway v1.4</span>
                </span>
                {activeThread.tokenSaverEnabled && (
                  <span className="text-emerald-400 font-bold">⚡ Token-Saver Active</span>
                )}
                {activeThread.thinkingEnabled && (
                  <span className="text-amber-400 font-bold">🧠 Extended Thinking On</span>
                )}
              </div>
              <span className="text-[10px]">Shift+Enter for newline</span>
            </div>
          </div>
        </main>

        {/* Right: Interactive Claude Artifact Canvas (Split-Pane) */}
        {activeArtifact && (
          <ArtifactCanvas
            artifact={activeArtifact}
            onClose={() => setActiveArtifact(null)}
          />
        )}
      </div>

      {/* Slide-Out Chat Memory & Project Context Drawer */}
      <ContextManagerDrawer
        open={showMemoryDrawer}
        onClose={() => setShowMemoryDrawer(false)}
        persona={activeThread.persona}
        systemPrompt={activeThread.systemPrompt || ''}
        temperature={activeThread.temperature}
        maxTokens={activeThread.maxTokens}
        thinkingEnabled={Boolean(activeThread.thinkingEnabled)}
        thinkingBudget={activeThread.thinkingBudget || 2048}
        memoryItems={activeThread.memoryItems || []}
        totalContextTokens={totalContextTokens}
        messagesCount={activeThread.messages.length}
        isPaidCustomer={isPaidCustomer}
        onUpdateSettings={(updates) => updateActiveThread(updates)}
        onCompressContext={handleCompressContext}
        isCompressing={isCompressing}
      />

      {/* Pro Tier Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-[#0e1424] border border-violet-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-100">Unlock Full AI Studio Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {upgradeReason || 'Advanced multi-turn conversations, Vision analysis, and PDF inspection require an active plan or VIP override.'}
              </p>
            </div>

            <div className="p-3 bg-violet-950/30 border border-violet-500/20 rounded-xl text-left text-xs space-y-1.5 font-mono">
              <div className="flex items-center gap-2 text-violet-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unlimited multi-turn conversation memory</span>
              </div>
              <div className="flex items-center gap-2 text-violet-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multimodal vision & full PDF document inspection</span>
              </div>
              <div className="flex items-center gap-2 text-violet-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Claude Artifacts live canvas runtime</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/pricing"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
