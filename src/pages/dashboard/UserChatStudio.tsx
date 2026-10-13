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
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../utils/api';
import { MarkdownBlock } from '../../components/chat/MarkdownBlock';

interface ChatAttachment {
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  sizeBytes: number;
  dataBase64?: string; // For images
  textSnippet?: string; // For code/text files
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
}

interface ChatThread {
  id: string;
  title: string;
  model: string;
  persona: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const PERSONA_PRESETS = [
  {
    id: 'fullstack',
    name: '💻 Elite Full-Stack Engineer',
    prompt: 'You are an elite principal full-stack engineer. Provide clean, robust, production-grade code with TypeScript typings, error handling, and zero conversational fluff. Always prefer modern best practices.',
  },
  {
    id: 'debugger',
    name: '🐛 Deep Crash & Bug Detective',
    prompt: 'You are a world-class debugging specialist. When given error logs, stack traces, or broken code, diagnose the exact root cause, explain why it failed, and provide a surgical minimal fix or unified diff.',
  },
  {
    id: 'token_saver',
    name: '⚡ Token-Saver Ultra-Lean (Diffs Only)',
    prompt: 'You are an ultra-concise token-saving coding engine. Return only the modified code, function, or unified git diff. Do NOT repeat unchanged code. Zero greeting, zero pleasantries.',
  },
  {
    id: 'architect',
    name: '🏗️ System & Database Architect',
    prompt: 'You are an enterprise system and database architect. Focus on high throughput, PostgreSQL index strategy, concurrency, distributed systems, clean data schemas, and API contract design.',
  },
  {
    id: 'general',
    name: '🤖 Frontier AI Assistant',
    prompt: 'You are Claude, a frontier artificial intelligence running on the Lightning Deals high-performance gateway conduit.',
  },
];

const MODEL_OPTIONS = [
  { id: 'claude-sonnet-5.5', name: '⚡ Claude Sonnet 5.5 (Flagship Coding & Vision)' },
  { id: 'claude-opus-5.5', name: '🧠 Claude Opus 5.5 (Cognitive Frontier & Architecture)' },
  { id: 'claude-fable-5', name: '✨ Claude Fable 5 (Ultra-Fast IDE Specialist)' },
  { id: 'claude-opus-5-thinking', name: '💡 Claude Opus 5 Extended Thinking (Deep Logic)' },
  { id: 'claude-haiku-5.5', name: '🚀 Claude Haiku 5.5 (High-Throughput Streaming)' },
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

  // Settings & Drawers
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

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
          if (keyList.length > 0) {
            setSelectedKeyId(keyList[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load user keys:', e);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Load Threads from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lightning_chat_threads_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved chat threads:', e);
    }

    // Default initial thread
    const initialThread: ChatThread = {
      id: `thread_${Date.now()}`,
      title: 'New Coding Session',
      model: 'claude-sonnet-5.5',
      persona: 'fullstack',
      systemPrompt: PERSONA_PRESETS[0].prompt,
      temperature: 0.3,
      maxTokens: 2500,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setThreads([initialThread]);
    setActiveThreadId(initialThread.id);
  }, []);

  // Save Threads to localStorage
  useEffect(() => {
    if (threads.length > 0) {
      try {
        localStorage.setItem('lightning_chat_threads_v1', JSON.stringify(threads));
      } catch (e) {
        console.warn('Failed to save threads to localStorage:', e);
      }
    }
  }, [threads]);

  // Elapsed Timer while generating
  useEffect(() => {
    if (!generating) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 50);
    return () => clearInterval(interval);
  }, [generating]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threads, generating]);

  // Get current active thread
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Helper to update active thread
  const updateActiveThread = (updates: Partial<ChatThread>) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread?.id ? { ...t, ...updates, updatedAt: Date.now() } : t))
    );
  };

  // Create New Thread
  const handleCreateNewThread = () => {
    if (!isPaidCustomer && threads.length >= 1) {
      setUpgradeReason('Creating multiple persistent chat sessions is a Pro member feature.');
      setShowUpgradeModal(true);
      return;
    }

    const newThread: ChatThread = {
      id: `thread_${Date.now()}`,
      title: 'New Coding Session',
      model: activeThread?.model || 'claude-sonnet-5.5',
      persona: activeThread?.persona || 'fullstack',
      systemPrompt: activeThread?.systemPrompt || PERSONA_PRESETS[0].prompt,
      temperature: activeThread?.temperature ?? 0.3,
      maxTokens: activeThread?.maxTokens || 2500,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setAttachments([]);
    setInputMessage('');
  };

  // Delete Thread
  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      // Reset the single thread
      updateActiveThread({ messages: [], title: 'New Coding Session' });
      return;
    }
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    if (activeThreadId === id) {
      setActiveThreadId(remaining[0].id);
    }
  };

  // Rename Thread
  const handleSaveTitle = (id: string) => {
    if (tempTitle.trim()) {
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: tempTitle.trim() } : t))
      );
    }
    setEditingTitleId(null);
  };

  // Handle File Input Selection
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!isPaidCustomer) {
      setUpgradeReason('Uploading images for Vision inspection and code/PDF files requires an active paid plan.');
      setShowUpgradeModal(true);
      return;
    }

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      if (isImg) {
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'image',
              mimeType: file.type,
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

  // Send Message
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputMessage;
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

    const updatedMessages = [...activeThread.messages, userMessage];
    updateActiveThread({
      messages: updatedMessages,
      title: newTitle,
    });

    setInputMessage('');
    setAttachments([]);
    setGenerating(true);

    // Build payload for gateway
    // Convert messages array into Anthropic compatible structures
    const apiMessages = updatedMessages.map((m) => {
      if (m.attachments && m.attachments.length > 0) {
        const contentParts: any[] = [];

        // Image content blocks
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
            system: activeThread.systemPrompt,
            temperature: activeThread.temperature,
            max_tokens: activeThread.maxTokens,
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
        timestamp: Date.now(),
        usage: data.usage,
        latencyMs: data.latencyMs,
        modelUsed: data.modelTested || activeThread.model,
      };

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
          content: `⚠️ **Network Connection Failed**: ${err.message || 'Please check your connection and retry.'}`,
          timestamp: Date.now(),
        };
        updateActiveThread({ messages: [...updatedMessages, errorMsg] });
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  // Export Chat
  const handleExportChat = () => {
    if (activeThread.messages.length === 0) return;

    let md = `# ${activeThread.title}\n`;
    md += `*Model: ${activeThread.model} • Exported from Lightning Deals AI Studio*\n\n---\n\n`;

    activeThread.messages.forEach((m) => {
      const sender = m.role === 'user' ? '👤 User' : '⚡ Claude Assistant';
      md += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n`;
      if (m.attachments && m.attachments.length > 0) {
        md += `*Attachments: ${m.attachments.map((a) => a.name).join(', ')}*\n\n`;
      }
      md += `${m.content}\n\n`;
      if (m.usage) {
        md += `> Tokens: In ${m.usage.input_tokens} / Out ${m.usage.output_tokens} • Latency: ${m.latencyMs}ms\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loadingInitial) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64607d] font-semibold">Loading your AI Studio environment...</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-[calc(100vh-6rem)] min-h-[640px] bg-white rounded-3xl border border-[#ede8e1] shadow-playful overflow-hidden font-sans"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-violet-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-violet-400 p-8">
          <div className="w-16 h-16 rounded-3xl bg-violet-600/50 flex items-center justify-center mb-4 animate-bounce">
            <Paperclip className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-1">Drop Files or Images Here</h3>
          <p className="text-xs text-violet-200">
            Upload code files, screenshots, UI mockups, or documents for Claude to analyze.
          </p>
        </div>
      )}

      {/* Main Studio Container: Sidebar + Chat Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Threads History */}
        <aside className="w-64 border-r border-[#ede8e1] bg-[#faf8f5] flex flex-col justify-between hidden md:flex shrink-0">
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleCreateNewThread}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#171526] hover:bg-[#25223c] text-white text-xs font-bold transition-all flex items-center justify-between shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                <span>New Session</span>
              </div>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-300">
                ⌘N
              </span>
            </button>

            {/* Thread Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#ede8e1] rounded-xl focus:outline-none focus:border-violet-500 text-slate-800"
              />
            </div>

            {/* Thread List */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#64607d] px-2 block pt-1">
                Recent Sessions
              </span>
              {threads
                .filter((t) => t.title.toLowerCase().includes(threadSearch.toLowerCase()))
                .map((t) => {
                  const isActive = t.id === activeThreadId;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setActiveThreadId(t.id)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-white text-violet-900 font-bold border border-violet-200 shadow-2xs'
                          : 'text-[#4a4763] hover:bg-white/60 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Bot className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                        {editingTitleId === t.id ? (
                          <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={() => handleSaveTitle(t.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(t.id)}
                            autoFocus
                            className="w-full bg-transparent border-b border-violet-500 outline-none text-xs text-slate-900"
                          />
                        ) : (
                          <span className="truncate">{t.title}</span>
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
                          className="p-1 rounded text-slate-400 hover:text-slate-700"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteThread(t.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Sidebar Footer: Tier Status */}
          <div className="p-3 border-t border-[#ede8e1] bg-white text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#64607d] font-medium">Studio Access</span>
              {isPaidCustomer ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>PRO UNLOCKED</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                  <span>FREE PASS</span>
                </span>
              )}
            </div>

            {!isPaidCustomer && (
              <button
                type="button"
                onClick={() => {
                  setUpgradeReason('Upgrade to an active token capacity plan to unlock unlimited sessions, Vision analysis, and file attachments.');
                  setShowUpgradeModal(true);
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Zap className="w-3 h-3 fill-current text-amber-300" />
                <span>Upgrade to Pro Studio</span>
              </button>
            )}

            <Link
              to="/dashboard/api-test"
              className="text-[11px] text-violet-700 hover:text-violet-900 font-semibold block text-center pt-1"
            >
              Switch to API Console →
            </Link>
          </div>
        </aside>

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Top Control Bar */}
          <header className="px-4 py-2.5 border-b border-[#ede8e1] bg-white flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Model Dropdown */}
              <div className="relative">
                <select
                  value={activeThread?.model}
                  onChange={(e) => updateActiveThread({ model: e.target.value })}
                  className="px-3 py-1.5 pr-8 text-xs font-bold bg-[#faf8f5] border border-[#ede8e1] rounded-xl focus:outline-none focus:border-violet-500 text-[#1e1b2e] cursor-pointer appearance-none shadow-2xs"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Persona Selector */}
              <div className="relative hidden sm:block">
                <select
                  value={activeThread?.persona}
                  onChange={(e) => {
                    const preset = PERSONA_PRESETS.find((p) => p.id === e.target.value);
                    updateActiveThread({
                      persona: e.target.value,
                      systemPrompt: preset ? preset.prompt : activeThread?.systemPrompt,
                    });
                  }}
                  className="px-3 py-1.5 pr-8 text-xs font-semibold bg-[#faf8f5] border border-[#ede8e1] rounded-xl focus:outline-none focus:border-violet-500 text-slate-700 cursor-pointer appearance-none"
                >
                  {PERSONA_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* API Key Selector */}
              <div className="relative hidden lg:block">
                <select
                  value={selectedKeyId}
                  onChange={(e) => setSelectedKeyId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-[#faf8f5] border border-[#ede8e1] rounded-xl text-slate-600 focus:outline-none"
                >
                  {keys.map((k) => (
                    <option key={k.id} value={k.id}>
                      Key: {k.name} ({k.displayKey})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Studio Settings Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className={`p-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showSettingsDrawer
                    ? 'bg-violet-100 text-violet-800 border-violet-300'
                    : 'bg-[#faf8f5] text-[#64607d] border-[#ede8e1] hover:text-slate-900'
                }`}
                title="Hyperparameter & System Prompt Controls"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {/* Export Chat */}
              <button
                type="button"
                onClick={handleExportChat}
                disabled={activeThread?.messages.length === 0}
                className="p-1.5 px-2 rounded-xl border border-[#ede8e1] bg-[#faf8f5] hover:bg-slate-100 text-[#64607d] text-xs transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                title="Export conversation as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </header>

          {/* Optional Collapsible Settings Drawer */}
          {showSettingsDrawer && (
            <div className="p-4 bg-[#faf8f5] border-b border-[#ede8e1] grid sm:grid-cols-3 gap-4 text-xs animate-in slide-in-from-top-2 duration-150">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[#1e1b2e] block">Custom System Instructions</label>
                <textarea
                  rows={2}
                  value={activeThread?.systemPrompt || ''}
                  onChange={(e) => updateActiveThread({ systemPrompt: e.target.value })}
                  placeholder="Define instructions for how Claude should think, format code, and respond..."
                  className="w-full p-2.5 bg-white border border-[#ede8e1] rounded-xl text-xs font-mono focus:outline-none focus:border-violet-500 resize-none text-slate-800"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1e1b2e]">Temperature</span>
                    <span className="font-mono text-violet-700 font-bold">{activeThread?.temperature ?? 0.3}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={activeThread?.temperature ?? 0.3}
                    onChange={(e) => updateActiveThread({ temperature: parseFloat(e.target.value) })}
                    className="w-full accent-violet-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Precise (Code)</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#1e1b2e]">Max Tokens</span>
                    <span className="font-mono text-violet-700 font-bold">{activeThread?.maxTokens || 2500}</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="4096"
                    step="100"
                    value={activeThread?.maxTokens || 2500}
                    onChange={(e) => updateActiveThread({ maxTokens: parseInt(e.target.value, 10) })}
                    className="w-full accent-violet-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeThread?.messages.length === 0 ? (
              /* Empty State Hero */
              <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-400 text-white flex items-center justify-center mx-auto shadow-playful">
                  <Sparkles className="w-7 h-7 fill-current text-amber-200" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-[#1e1b2e] tracking-tight">
                    Lightning AI Coding & Chat Studio
                  </h2>
                  <p className="text-xs text-[#64607d] max-w-md mx-auto leading-relaxed">
                    Powered by official Claude frontier models with 200k context, multimodal Vision, and sub-50ms gateway routing.
                  </p>
                </div>

                {/* Prompt Starter Cards */}
                <div className="grid sm:grid-cols-2 gap-3 text-left pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        'Diagnose this crash: Next.js TypeError: Cannot read properties of undefined (reading "map") in hydration.'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-[#faf8f5] hover:bg-violet-50/60 border border-[#ede8e1] hover:border-violet-200 transition-all text-xs space-y-1 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-[#1e1b2e]">
                      <span className="text-base">🐛</span>
                      <span>Debug Next.js Hydration Crash</span>
                    </div>
                    <p className="text-[11px] text-[#64607d] leading-normal">
                      Find the root cause and provide a surgical minimal fix with zero token bloat.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        'Write a high-performance TypeScript debounce and throttle hook with strict generic typing and cancel support.'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-[#faf8f5] hover:bg-violet-50/60 border border-[#ede8e1] hover:border-violet-200 transition-all text-xs space-y-1 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-[#1e1b2e]">
                      <span className="text-base">⚡</span>
                      <span>Strict TypeScript Custom Hook</span>
                    </div>
                    <p className="text-[11px] text-[#64607d] leading-normal">
                      Generate production-ready code with full generic types and unit tests.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        'Design a high-throughput PostgreSQL schema for a multi-tenant API key token ledger with 5-hour rolling refill windows.'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-[#faf8f5] hover:bg-violet-50/60 border border-[#ede8e1] hover:border-violet-200 transition-all text-xs space-y-1 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-[#1e1b2e]">
                      <span className="text-base">🏗️</span>
                      <span>PostgreSQL Rolling Quota Schema</span>
                    </div>
                    <p className="text-[11px] text-[#64607d] leading-normal">
                      Table structure, indexes, and concurrency-safe deduction functions.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isPaidCustomer) {
                        setUpgradeReason('Image & screenshot analysis with Vision is exclusive to active paid subscribers.');
                        setShowUpgradeModal(true);
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    className="p-3.5 rounded-2xl bg-[#faf8f5] hover:bg-violet-50/60 border border-[#ede8e1] hover:border-violet-200 transition-all text-xs space-y-1 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-[#1e1b2e]">
                      <span className="text-base">📸</span>
                      <span>Upload UI Mockup or Screenshot</span>
                    </div>
                    <p className="text-[11px] text-[#64607d] leading-normal">
                      Attach an image for Claude Vision to convert into Tailwind components.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* Message Thread List */
              activeThread?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start w-full'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-2xl bg-[#171526] text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                      <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
                    </div>
                  )}

                  <div
                    className={`space-y-2 max-w-[85%] sm:max-w-[80%] ${
                      msg.role === 'user' ? 'items-end' : 'items-start w-full'
                    }`}
                  >
                    {/* User Attached files */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-1 justify-end">
                        {msg.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="p-1.5 px-2.5 rounded-xl bg-violet-100 text-violet-900 border border-violet-200 text-xs flex items-center gap-1.5 font-medium"
                          >
                            {att.type === 'image' ? (
                              <ImageIcon className="w-3.5 h-3.5 text-violet-700" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-violet-700" />
                            )}
                            <span className="truncate max-w-[120px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      className={`p-4 rounded-3xl ${
                        msg.role === 'user'
                          ? 'bg-[#171526] text-white rounded-br-xs shadow-playful'
                          : 'bg-[#faf8f5] text-slate-800 rounded-bl-xs border border-[#ede8e1] shadow-2xs'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>
                      ) : (
                        <MarkdownBlock content={msg.content} />
                      )}
                    </div>

                    {/* Telemetry pill for assistant response */}
                    {msg.role === 'assistant' && msg.usage && (
                      <div className="flex items-center gap-2 text-[10px] text-[#64607d] pl-1 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {msg.modelUsed || 'Claude Sonnet 5.5'}
                        </span>
                        <span>
                          In: <strong>{msg.usage.input_tokens}</strong> / Out: <strong>{msg.usage.output_tokens}</strong>
                        </span>
                        {msg.latencyMs && (
                          <span className="text-emerald-700 font-bold">● {msg.latencyMs}ms</span>
                        )}
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                          className="hover:text-slate-900 ml-1 p-0.5 cursor-pointer"
                          title="Copy raw response"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-1 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Live Streaming Kinetic Visual while generating */}
            {generating && (
              <div className="flex gap-3.5 max-w-2xl mr-auto justify-start w-full animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-2xl bg-[#171526] text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                </div>
                <div className="space-y-3 w-full max-w-lg">
                  {/* Kinetic Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1e1b2e] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
                        <span>Claude Synthesizing Tokens...</span>
                      </span>
                      <span className="font-mono text-violet-700 font-bold">{(elapsedMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="h-2 w-full bg-[#f4effa] rounded-full overflow-hidden p-0.5 border border-violet-100 shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 animate-pulse"
                        style={{ width: `${Math.min(95, Math.round(15 + 80 * (1 - Math.exp(-elapsedMs / 2500))))}%` }}
                      />
                    </div>
                  </div>

                  {/* Dark holographic skeleton preview */}
                  <div className="p-3.5 rounded-2xl bg-[#171526] border border-[#2d2948] text-xs font-mono space-y-2 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="ml-1 text-slate-300">claude_stream.log</span>
                      </div>
                      <span className="text-violet-300 font-mono">{Math.round(elapsedMs)}ms</span>
                    </div>
                    <div className="space-y-2 py-1">
                      <div className="h-2.5 bg-gradient-to-r from-violet-900/60 via-violet-700/40 to-transparent rounded w-3/4 animate-pulse" />
                      <div className="h-2.5 bg-gradient-to-r from-fuchsia-900/60 via-fuchsia-700/40 to-transparent rounded w-11/12 animate-pulse" />
                      <div className="h-2.5 bg-gradient-to-r from-violet-900/60 via-violet-700/40 to-transparent rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="pt-1 flex items-center gap-1.5 text-[10.5px] text-violet-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Streaming via Anthropic /v1/messages conduit</span>
                      <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Files Preview Bar (Before Submit) */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 bg-[#faf8f5] border-t border-[#ede8e1] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-[#64607d] tracking-wider shrink-0">
                Attachments ({attachments.length}):
              </span>
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="p-1 px-2.5 rounded-xl bg-white border border-[#ede8e1] text-xs flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-violet-600" />
                  )}
                  <span className="truncate max-w-[140px] text-slate-800 font-medium">{att.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({Math.round(att.sizeBytes / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                    className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Composer Footer */}
          <div className="p-3 sm:p-4 border-t border-[#ede8e1] bg-white">
            <div className="relative rounded-2xl border border-[#ede8e1] focus-within:border-violet-500 bg-[#faf8f5] focus-within:bg-white transition-all shadow-inner p-2">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Claude to code, debug an error, or drag & drop files/images (Enter to send, Shift+Enter for newline)..."
                className="w-full p-1.5 text-xs bg-transparent outline-none resize-none text-[#1e1b2e] leading-relaxed max-h-36 placeholder:text-slate-400"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[#ede8e1]/60">
                {/* Multimodal File Attachment Button */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.gif,.ts,.tsx,.js,.jsx,.py,.json,.csv,.sql,.html,.css,.md,.txt,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPaidCustomer) {
                        setUpgradeReason('Attaching images for Vision and code/PDF files is exclusive to paid plan members.');
                        setShowUpgradeModal(true);
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    className="p-1.5 px-2.5 rounded-xl text-slate-600 hover:text-violet-700 hover:bg-violet-50 border border-transparent hover:border-violet-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Attach Code, Documents, or Images (Vision)"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Attach File / Image</span>
                    {!isPaidCustomer && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    ~{Math.max(1, Math.ceil(inputMessage.length / 4))} est. tokens
                  </span>
                </div>

                {/* Send / Stop Buttons */}
                <div className="flex items-center gap-2">
                  {generating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-xs bg-white animate-spin" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() && attachments.length === 0}
                      className="py-1.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Send</span>
                      <Send className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tier Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ede8e1] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center mx-auto shadow-playful">
              <Zap className="w-6 h-6 fill-current text-amber-300" />
            </div>

            <div className="text-center space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                PRO STUDIO FEATURE
              </span>
              <h3 className="text-lg font-black text-[#1e1b2e] tracking-tight">
                Unlock Full AI Coding & Chat Studio
              </h3>
              <p className="text-xs text-[#64607d] leading-relaxed">
                {upgradeReason || 'This advanced feature requires an active capacity plan.'}
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] text-xs">
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited multi-turn conversation threads</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multimodal Vision (UI screenshots, error photos, architecture diagrams)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full code files and PDF document understanding</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Continuous 5-hour rolling pool refills (1M to 100M token plans)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#ede8e1] hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
              <Link
                to="/plans"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 ui-button-primary py-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs"
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

export default UserChatStudio;
