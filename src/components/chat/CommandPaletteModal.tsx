import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  Sparkles,
  Zap,
  Sliders,
  Plus,
  Moon,
  Sun,
  Key,
  Layers,
  Brain,
  Trash2,
  X,
  ArrowRight,
  Command,
} from 'lucide-react';
import { ChatThread, StudioModelMeta } from '../../pages/dashboard/UserChatStudio';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  models: StudioModelMeta[];
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenSkills: () => void;
  onOpenCanvas: () => void;
  onOpenKeySwitcher: () => void;
  onToggleThinking: () => void;
  thinkingEnabled: boolean;
  onToggleTokenSaver: () => void;
  tokenSaverEnabled: boolean;
  onToggleTheme: () => void;
  isDarkTheme: boolean;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  models,
  currentModelId,
  onSelectModel,
  onOpenSkills,
  onOpenCanvas,
  onOpenKeySwitcher,
  onToggleThinking,
  thinkingEnabled,
  onToggleTokenSaver,
  tokenSaverEnabled,
  onToggleTheme,
  isDarkTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Standard static quick actions
  const staticActions = useMemo(
    () => [
      {
        id: 'new-chat',
        title: 'New Conversation',
        subtitle: 'Start a fresh AI session',
        category: 'Actions',
        icon: Plus,
        action: () => {
          onNewChat();
          onClose();
        },
      },
      {
        id: 'workspace-skills',
        title: 'Manage Workspace Skills',
        subtitle: 'Configure architecture, QA, security, and surgical diff directives',
        category: 'Actions',
        icon: Sparkles,
        action: () => {
          onOpenSkills();
          onClose();
        },
      },
      {
        id: 'api-key-switcher',
        title: 'Switch Active API Key',
        subtitle: 'Change which key bills this workspace or switch exhausted keys',
        category: 'Actions',
        icon: Key,
        action: () => {
          onOpenKeySwitcher();
          onClose();
        },
      },
      {
        id: 'toggle-canvas',
        title: 'Toggle Canvas Artifacts',
        subtitle: 'Open or close the dedicated side-by-side code & doc canvas',
        category: 'Actions',
        icon: Layers,
        action: () => {
          onOpenCanvas();
          onClose();
        },
      },
      {
        id: 'toggle-thinking',
        title: `Extended Thinking: ${thinkingEnabled ? 'Disable' : 'Enable'}`,
        subtitle: 'Inspect deliberative reasoning traces before final answers',
        category: 'Actions',
        icon: Brain,
        action: () => {
          onToggleThinking();
          onClose();
        },
      },
      {
        id: 'toggle-token-saver',
        title: `Token-Saver Mode: ${tokenSaverEnabled ? 'Disable' : 'Enable'}`,
        subtitle: 'Compacts context history and prompts for minimal token footprint',
        category: 'Actions',
        icon: Zap,
        action: () => {
          onToggleTokenSaver();
          onClose();
        },
      },
      {
        id: 'toggle-theme',
        title: isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: 'Toggle workspace appearance',
        category: 'Actions',
        icon: isDarkTheme ? Sun : Moon,
        action: () => {
          onToggleTheme();
          onClose();
        },
      },
    ],
    [
      onNewChat,
      onOpenSkills,
      onOpenKeySwitcher,
      onOpenCanvas,
      onToggleThinking,
      thinkingEnabled,
      onToggleTokenSaver,
      tokenSaverEnabled,
      onToggleTheme,
      isDarkTheme,
      onClose,
    ]
  );

  // Model switching actions
  const modelActions = useMemo(() => {
    return models.map((m) => ({
      id: `model-${m.id}`,
      title: `Switch Model: ${m.name}`,
      subtitle: `${m.contextWindow >= 1000000 ? '1M' : '200k'} Context · ${m.tokenMultiplier}x Quota · ${m.badge}`,
      category: 'Models',
      icon: Zap,
      action: () => {
        onSelectModel(m.id);
        onClose();
      },
      isCurrent: m.id === currentModelId,
    }));
  }, [models, currentModelId, onSelectModel, onClose]);

  // Conversation search actions
  const conversationActions = useMemo(() => {
    return threads.map((t) => {
      const lastMessage = t.messages[t.messages.length - 1]?.content || 'Empty session';
      return {
        id: `thread-${t.id}`,
        title: t.title || 'Untitled Session',
        subtitle: lastMessage.slice(0, 70),
        category: 'Conversations',
        icon: MessageSquare,
        action: () => {
          onSelectThread(t.id);
          onClose();
        },
        isActive: t.id === activeThreadId,
      };
    });
  }, [threads, activeThreadId, onSelectThread, onClose]);

  // Filtered list
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...staticActions, ...modelActions.slice(0, 4), ...conversationActions.slice(0, 6)];
    }

    const matches = (item: { title: string; subtitle: string; category: string }) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    return [
      ...staticActions.filter(matches),
      ...modelActions.filter(matches),
      ...conversationActions.filter(matches),
    ];
  }, [query, staticActions, modelActions, conversationActions]);

  // Handle arrow keys and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0E1425] border border-gray-200 dark:border-[#28334B] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-gray-900 dark:text-gray-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-[#28334B] bg-gray-50/50 dark:bg-[#141C30]">
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, model, or search conversations..."
            className="w-full bg-transparent text-sm sm:text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-700">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202024]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-white translate-x-0.5' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No matching commands or conversations found.</p>
            </div>
          )}
        </div>

        {/* Modal Footer Hotkey Guide */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-[#28334B] bg-gray-50/70 dark:bg-[#141C30] text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>Lightning Studio 3.0</span>
        </div>
      </div>
    </div>
  );
};
