import React, { useState, useMemo } from 'react';
import {
  X,
  Brain,
  Zap,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Cpu,
  Edit2,
  Search,
  Lock,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ProjectMemoryItem {
  id: string;
  category: string;
  fact: string;
  type?: string; // 'explicit' | 'automatic' | 'profile' | 'project' | 'continuity'
  normalizedFact?: string | null;
  confidence?: number;
  projectId?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

interface ContextManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  persona: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  thinkingEnabled: boolean;
  thinkingBudget: number;
  memoryItems: ProjectMemoryItem[];
  memoryEnabled?: boolean;
  totalContextTokens: number;
  messagesCount: number;
  isPaidCustomer: boolean;
  onToggleMemoryEnabled?: (enabled: boolean) => void;
  onAddMemory?: (category: string, fact: string) => Promise<void>;
  onEditMemory?: (id: string, category: string, fact: string) => Promise<void>;
  onRemoveMemory?: (id: string) => Promise<void>;
  onClearAllMemories?: () => Promise<void>;
  onUpdateSettings: (updates: {
    persona?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingEnabled?: boolean;
    thinkingBudget?: number;
    memoryItems?: ProjectMemoryItem[];
  }) => void;
  onCompressContext: () => Promise<void>;
  isCompressing: boolean;
  memoryScope?: 'account' | 'project' | 'session';
  onUpdateMemoryScope?: (scope: 'account' | 'project' | 'session') => void;
  isTemporarySession?: boolean;
  onToggleTemporarySession?: (temp: boolean) => void;
}

const PERSONA_PRESETS = [
  {
    id: 'fullstack',
    name: '💻 Elite Full-Stack Engineer',
    description: 'Generates clean, production-grade TypeScript/React/Node.js code with zero conversational fluff.',
    prompt:
      'You are an elite principal full-stack engineer. Provide clean, robust, production-grade code with TypeScript typings, error handling, and zero conversational fluff. Always prefer modern best practices.',
  },
  {
    id: 'debugger',
    name: '🐛 Deep Bug & Crash Detective',
    description: 'Diagnoses exact root cause and outputs surgical minimal fixes.',
    prompt:
      'You are a world-class debugging specialist. When given error logs, stack traces, or broken code, diagnose the exact root cause, explain why it failed, and provide a surgical minimal fix or unified diff.',
  },
  {
    id: 'token_saver',
    name: '⚡ Token-Saver Ultra-Lean (Diffs Only)',
    description: 'Returns only modified code or diffs. Cuts token usage by up to 75%.',
    prompt:
      'You are an ultra-concise token-saving coding engine. Return only the modified code, function, or unified git diff. Do NOT repeat unchanged code. Zero greeting, zero pleasantries.',
  },
  {
    id: 'architect',
    name: '🏗️ Cloud & Database Architect',
    description: 'Specializes in PostgreSQL schema, distributed caching, and API contracts.',
    prompt:
      'You are an enterprise system and database architect. Focus on high throughput, PostgreSQL index strategy, concurrency, distributed systems, clean data schemas, and API contract design.',
  },
  {
    id: 'custom',
    name: '⚙️ Custom Developer Persona',
    description: 'Specify your own custom prompt rules and project instructions.',
    prompt: '',
  },
];

const MEMORY_CATEGORIES = [
  'All',
  'Tech Stack',
  'Preferences',
  'Working Style',
  'About Me',
  'Projects',
];

export const ContextManagerDrawer: React.FC<ContextManagerDrawerProps> = ({
  open,
  onClose,
  persona,
  systemPrompt,
  temperature,
  maxTokens,
  thinkingEnabled,
  thinkingBudget,
  memoryItems,
  memoryEnabled = true,
  totalContextTokens,
  messagesCount,
  onToggleMemoryEnabled,
  onAddMemory,
  onEditMemory,
  onRemoveMemory,
  onClearAllMemories,
  onUpdateSettings,
  onCompressContext,
  isCompressing,
  memoryScope = 'account',
  onUpdateMemoryScope,
  isTemporarySession = false,
  onToggleTemporarySession,
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'persona' | 'parameters'>('memory');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('Tech Stack');
  const [newFact, setNewFact] = useState('');
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editFact, setEditFact] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!open) return null;

  const contextLimit = 200000;
  const contextPercent = Math.min(100, Math.round((totalContextTokens / contextLimit) * 100));

  // Compute memory statistics
  const explicitCount = memoryItems.filter((m) => m.type === 'explicit').length;
  const automaticCount = memoryItems.filter((m) => m.type !== 'explicit').length;

  // Filter memories by category and search query
  const filteredMemories = useMemo(() => {
    return memoryItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        item.fact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [memoryItems, selectedCategory, searchQuery]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    if (onAddMemory) {
      try {
        setIsSavingMemory(true);
        await onAddMemory(newCategory.trim() || 'Preferences', newFact.trim());
        setNewFact('');
        setShowManualAdd(false);
      } finally {
        setIsSavingMemory(false);
      }
    } else {
      const newItem: ProjectMemoryItem = {
        id: `mem_${Date.now()}`,
        category: newCategory.trim() || 'Preferences',
        fact: newFact.trim(),
        type: 'explicit',
      };
      onUpdateSettings({ memoryItems: [...memoryItems, newItem] });
      setNewFact('');
      setShowManualAdd(false);
    }
  };

  const handleStartEdit = (item: ProjectMemoryItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditFact(item.fact);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editFact.trim()) return;
    if (onEditMemory) {
      await onEditMemory(id, editCategory.trim() || 'Preferences', editFact.trim());
    } else {
      onUpdateSettings({
        memoryItems: memoryItems.map((m) =>
          m.id === id ? { ...m, category: editCategory.trim() || 'Preferences', fact: editFact.trim() } : m
        ),
      });
    }
    setEditingId(null);
  };

  const handleRemoveMemory = async (id: string) => {
    if (onRemoveMemory) {
      await onRemoveMemory(id);
    } else {
      onUpdateSettings({ memoryItems: memoryItems.filter((m) => m.id !== id) });
    }
  };

  const handleClearAll = async () => {
    if (onClearAllMemories) {
      await onClearAllMemories();
    } else {
      onUpdateSettings({ memoryItems: [] });
    }
    setShowClearConfirm(false);
  };

  const handleSelectPreset = (p: (typeof PERSONA_PRESETS)[0]) => {
    onUpdateSettings({
      persona: p.id,
      systemPrompt: p.prompt || systemPrompt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-[#0E1425] border-l border-[#28334B] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 px-6 bg-[#141C30] border-b border-[#28334B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Memory & Context Intelligence</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  PERSISTENT
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Cross-conversation recall, automatic preference extraction & reasoning
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-Time Context Health Gauge Card */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-[#141C30] border border-[#28334B] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Context Window</span>
            </span>
            <span className="font-bold text-slate-200">
              {totalContextTokens.toLocaleString()} / 200,000 tokens ({contextPercent}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                contextPercent > 80
                  ? 'bg-rose-500'
                  : contextPercent > 50
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-violet-500 to-cyan-400'
              }`}
              style={{ width: `${Math.max(2, contextPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {messagesCount} messages in thread
            </span>

            {/* Smart Context Compaction Action */}
            <button
              type="button"
              disabled={isCompressing || messagesCount < 2}
              onClick={onCompressContext}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                messagesCount >= 2
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Summarize older messages to save tokens on every prompt"
            >
              <Zap className={`w-3 h-3 ${isCompressing ? 'animate-spin' : 'text-amber-200'}`} />
              <span>{isCompressing ? 'Compressing...' : '⚡ Compress Context (Save Tokens)'}</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#28334B] px-6 mt-4 gap-4 text-xs font-mono shrink-0">
          {[
            { id: 'memory', label: '🧠 Long-Term Memory', count: memoryItems.length },
            { id: 'persona', label: '🎭 Persona Preset', count: null },
            { id: 'parameters', label: '⚙️ Parameters', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'memory' && (
            <div className="space-y-4">
              {/* Memory Master Switch & Status */}
              <div className="p-3.5 bg-slate-900 border border-[#28334B] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className={`w-4 h-4 ${memoryEnabled ? 'text-violet-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="font-bold text-slate-200 text-xs block">
                        Intelligent Memory System
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {memoryEnabled
                          ? 'Active: Automatically recalls preferences across conversations'
                          : 'Paused: Memories preserved safely in DB, omitted from model prompts'}
                      </span>
                    </div>
                  </div>
                  {onToggleMemoryEnabled && (
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                      <input
                        type="checkbox"
                        checked={memoryEnabled}
                        onChange={(e) => onToggleMemoryEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  )}
                </div>

                {/* Private / Temporary Session Toggle */}
                {onToggleTemporarySession && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <EyeOff className={`w-3.5 h-3.5 ${isTemporarySession ? 'text-amber-400' : 'text-slate-500'}`} />
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 block">
                          Incognito / Temporary Chat Mode
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Operate without personal recall; won't save new memories
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                      <input
                        type="checkbox"
                        checked={isTemporarySession}
                        onChange={(e) => onToggleTemporarySession(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                )}

                {/* Scope selector */}
                {onUpdateMemoryScope && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">Memory Recall Scope:</span>
                    <div className="flex gap-1">
                      {(['account', 'project', 'session'] as const).map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => onUpdateMemoryScope(sc)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold capitalize transition-colors ${
                            memoryScope === sc
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memory Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[10px]">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Total</span>
                    <span className="text-slate-100 font-bold text-xs">{memoryItems.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-violet-400 block">Explicit Rules</span>
                    <span className="text-violet-300 font-bold text-xs">{explicitCount}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-cyan-400 block">Learned Facts</span>
                    <span className="text-cyan-300 font-bold text-xs">{automaticCount}</span>
                  </div>
                </div>
              </div>

              {/* Natural Experience Guidance Callout */}
              <div className="p-3 bg-violet-950/20 border border-violet-500/20 rounded-xl space-y-1 text-slate-300">
                <p className="font-bold text-violet-300 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Natural Memory Instructions</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  You can chat naturally to manage your memory anytime:
                </p>
                <div className="space-y-1 text-[10px] font-mono text-violet-200/80 bg-slate-950/60 p-2 rounded-lg border border-violet-500/10">
                  <p>• "Remember that I prefer TypeScript and PostgreSQL"</p>
                  <p>• "Always give me concise, production-ready code"</p>
                  <p>• "Forget that I prefer Python"</p>
                  <p>• "What do you remember about me?"</p>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search memories (e.g. React, PostgreSQL, style)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-[#28334B] text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
                  {MEMORY_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-violet-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memory List Header & Clear All Action */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  What LightningAPI Remembers ({filteredMemories.length})
                </span>
                {memoryItems.length > 0 && !showClearConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All Memories
                  </button>
                )}
              </div>

              {/* Clear All Confirmation Modal */}
              {showClearConfirm && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2">
                  <p className="text-xs text-rose-200 font-semibold">
                    Are you sure you want to delete all {memoryItems.length} persistent memories?
                  </p>
                  <p className="text-[10px] text-rose-300">
                    This will permanently clear your cross-conversation preferences and cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                    >
                      Confirm Delete All
                    </button>
                  </div>
                </div>
              )}

              {/* Memory Cards */}
              <div className="space-y-2">
                {filteredMemories.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 border border-dashed border-[#28334B] rounded-xl font-mono text-[11px] space-y-1">
                    <p className="text-slate-400 font-medium">No memories found</p>
                    <p className="text-[10px] text-slate-500">
                      {searchQuery
                        ? 'Try a different search term.'
                        : 'Memories will automatically appear here as you chat, or you can add one manually.'}
                    </p>
                  </div>
                ) : (
                  filteredMemories.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-900/90 border border-[#28334B]/80 rounded-xl space-y-2 group hover:border-slate-700 transition-all"
                    >
                      {editingId === item.id ? (
                        /* Inline Edit Form */
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="p-1.5 rounded bg-slate-950 border border-[#28334B] text-slate-200 text-xs focus:outline-none focus:border-violet-500 font-mono"
                              placeholder="Category"
                            />
                            <input
                              type="text"
                              value={editFact}
                              onChange={(e) => setEditFact(e.target.value)}
                              className="col-span-2 p-1.5 rounded bg-slate-950 border border-[#28334B] text-slate-200 text-xs focus:outline-none focus:border-violet-500 font-mono"
                              placeholder="Preference statement"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px]"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Fact Item */
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                                {item.category}
                              </span>
                              {item.type === 'explicit' ? (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  EXPLICIT
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  LEARNED
                                </span>
                              )}
                              {item.projectId && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  PROJECT SCOPED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200 font-mono leading-relaxed break-words">
                              {item.fact}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit memory"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMemory(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete memory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Secondary: Manual Memory Entry Accordion */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualAdd(!showManualAdd)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-[#28334B] flex items-center justify-between text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-violet-400" />
                    <span>Add Memory Manually</span>
                  </span>
                  {showManualAdd ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {showManualAdd && (
                  <form onSubmit={handleAddMemory} className="mt-2 p-3 bg-slate-900 border border-[#28334B] rounded-xl space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="p-2 rounded-lg bg-slate-950 border border-[#28334B] text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                      >
                        <option value="Tech Stack">Tech Stack</option>
                        <option value="Preferences">Preferences</option>
                        <option value="Working Style">Working Style</option>
                        <option value="About Me">About Me</option>
                        <option value="Projects">Projects</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Fact (e.g. Always write code with TypeScript and strict typing)"
                        value={newFact}
                        onChange={(e) => setNewFact(e.target.value)}
                        className="col-span-2 p-2 rounded-lg bg-slate-950 border border-[#28334B] text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newFact.trim() || isSavingMemory}
                      className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSavingMemory ? 'Saving...' : 'Save to Memory'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'persona' && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Select Persona Preset
              </span>
              <div className="space-y-2">
                {PERSONA_PRESETS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      persona === p.id
                        ? 'bg-violet-950/30 border-violet-500/50 shadow-xs'
                        : 'bg-slate-900/60 border-[#28334B]/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{p.name}</span>
                      {persona === p.id && (
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                  System Instructions Prompt
                </label>
                <textarea
                  rows={5}
                  value={systemPrompt}
                  onChange={(e) => onUpdateSettings({ systemPrompt: e.target.value })}
                  placeholder="Enter custom developer system instructions..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-[#28334B] text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-5">
              {/* Temperature Slider */}
              <div className="space-y-2 p-3 bg-slate-900 border border-[#28334B] rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Creativity & Temperature</span>
                  </label>
                  <span className="font-mono font-bold text-violet-400 text-xs">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.0 (Precise / Coding)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.0 (Creative)</span>
                </div>
              </div>

              {/* Max Tokens Slider */}
              <div className="space-y-2 p-3 bg-slate-900 border border-[#28334B] rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200">
                    Max Output Length
                  </label>
                  <span className="font-mono font-bold text-cyan-400 text-xs">
                    {maxTokens.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>512 (Concise)</span>
                  <span>4,096 (Standard)</span>
                  <span>8,192 (Extended Code)</span>
                </div>
              </div>

              {/* Extended Thinking Budget */}
              <div className="space-y-2 p-3 bg-slate-900 border border-[#28334B] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Extended Thinking Budget</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Tokens reserved for step-by-step reasoning
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thinkingEnabled}
                      onChange={(e) => onUpdateSettings({ thinkingEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {thinkingEnabled && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Thinking Tokens</span>
                      <span className="text-amber-400 font-bold">{thinkingBudget}</span>
                    </div>
                    <input
                      type="range"
                      min="1024"
                      max="8192"
                      step="512"
                      value={thinkingBudget}
                      onChange={(e) =>
                        onUpdateSettings({ thinkingBudget: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 px-6 bg-[#141C30] border-t border-[#28334B] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            {memoryEnabled && !isTemporarySession ? '⚡ Personalisation enabled' : '🔒 Incognito mode'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
