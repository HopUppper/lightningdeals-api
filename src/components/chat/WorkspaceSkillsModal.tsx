import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  ShieldCheck,
  Lock,
  Code,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Sliders,
  Layers,
} from 'lucide-react';
import { userFetch } from '../../utils/api';

export interface StudioSkill {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  instructions: string;
  icon?: string;
  isCustom?: boolean;
}

interface WorkspaceSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSkillIds: string[];
  onToggleSkill: (skillId: string) => void;
  onSetActiveSkillIds: (skillIds: string[]) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Cpu,
  ShieldCheck,
  Lock,
  Code,
  BookOpen,
  Sparkles,
  FileText,
};

export const WorkspaceSkillsModal: React.FC<WorkspaceSkillsModalProps> = ({
  isOpen,
  onClose,
  activeSkillIds,
  onToggleSkill,
  onSetActiveSkillIds,
}) => {
  const [prebuiltSkills, setPrebuiltSkills] = useState<StudioSkill[]>([]);
  const [customSkills, setCustomSkills] = useState<StudioSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  // Custom skill creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Engineering');
  const [newSkillBadge, setNewSkillBadge] = useState('Custom');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillInstructions, setNewSkillInstructions] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing custom skill state
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  // Load skills from backend
  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const res = await userFetch('/api/user/studio/skills');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPrebuiltSkills(data.prebuilt || []);
          setCustomSkills(data.custom || []);
        }
      }
    } catch (err) {
      console.error('[SKILLS FETCH ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen]);

  const allSkills = useMemo(() => {
    return [...prebuiltSkills, ...customSkills];
  }, [prebuiltSkills, customSkills]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    allSkills.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [allSkills]);

  const filteredSkills = useMemo(() => {
    return allSkills.filter((s) => {
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allSkills, selectedCategory, searchQuery]);

  const handleCreateOrUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillInstructions.trim()) {
      setCreateError('Name and instructions are required.');
      return;
    }

    setIsSubmitting(true);
    setCreateError('');

    try {
      const url = editingSkillId
        ? `/api/user/studio/skills/${editingSkillId}`
        : '/api/user/studio/skills';
      const method = editingSkillId ? 'PATCH' : 'POST';

      const res = await userFetch(url, {
        method,
        body: JSON.stringify({
          name: newSkillName.trim(),
          category: newSkillCategory,
          badge: newSkillBadge.trim() || 'Custom',
          description: newSkillDescription.trim(),
          instructions: newSkillInstructions.trim(),
          icon: 'Code',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save skill.');
      }

      // If newly created, automatically activate it
      if (!editingSkillId && data.skill?.id) {
        onSetActiveSkillIds([...activeSkillIds, data.skill.id]);
      }

      // Reset form
      setIsCreating(false);
      setEditingSkillId(null);
      setNewSkillName('');
      setNewSkillDescription('');
      setNewSkillInstructions('');
      fetchSkills();
    } catch (err: any) {
      setCreateError(err.message || 'Error saving skill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (skill: StudioSkill) => {
    setEditingSkillId(skill.id);
    setNewSkillName(skill.name);
    setNewSkillCategory(skill.category);
    setNewSkillBadge(skill.badge);
    setNewSkillDescription(skill.description);
    setNewSkillInstructions(skill.instructions);
    setIsCreating(true);
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom skill?')) return;
    try {
      const res = await userFetch(`/api/user/studio/skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onSetActiveSkillIds(activeSkillIds.filter((sid) => sid !== id));
        fetchSkills();
      }
    } catch (err) {
      console.error('[SKILL DELETE ERROR]', err);
    }
  };

  const handleImportMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const lines = text.split('\n');
      let title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      // Check if first line has heading
      const firstHeading = lines.find((l) => l.trim().startsWith('# '));
      if (firstHeading) {
        title = firstHeading.replace(/^#\s+/, '').trim();
      }

      setNewSkillName(title);
      setNewSkillCategory('Custom');
      setNewSkillBadge('Imported');
      setNewSkillDescription(`Imported from ${file.name}`);
      setNewSkillInstructions(text);
      setIsCreating(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#0E1425] border border-gray-200 dark:border-[#28334B] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-gray-900 dark:text-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#28334B] flex items-center justify-between shrink-0 bg-gray-50/70 dark:bg-[#141C30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Workspace Skills</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {activeSkillIds.length} Active
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Inject specialized persona directives, architectural standards, and automated instructions into every prompt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close skills dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Category Filters, and Action Buttons */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-[#28334B] bg-white dark:bg-[#0E1425] shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills by title, category, or capability..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-[#202024] border border-gray-200 dark:border-[#28334B] rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#28334B] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <UploadCloud className="w-3.5 h-3.5 text-violet-500" />
                <span>Import (.md)</span>
                <input
                  type="file"
                  accept=".md,.txt"
                  className="hidden"
                  onChange={handleImportMarkdown}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditingSkillId(null);
                  setNewSkillName('');
                  setNewSkillDescription('');
                  setNewSkillInstructions('');
                  setIsCreating(!isCreating);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Cancel' : 'New Custom Skill'}</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => {
              const count = cat === 'All' ? allSkills.length : allSkills.filter((s) => s.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-violet-700/80 text-violet-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Create Form or Skills List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Inline Create / Edit Custom Skill Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateOrUpdateSkill}
              className="p-5 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/40 dark:bg-violet-950/15 space-y-4 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-violet-200/60 dark:border-violet-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {editingSkillId ? 'Edit Custom Skill' : 'Create Custom Workspace Skill'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSkillId(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>

              {createError && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. FastAPI Backend Specialist"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141C30] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141C30] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Testing & QA">Testing & QA</option>
                    <option value="Security">Security</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Frontend & Design">Frontend & Design</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Badge / Tag
                  </label>
                  <input
                    type="text"
                    value={newSkillBadge}
                    onChange={(e) => setNewSkillBadge(e.target.value)}
                    placeholder="e.g. Python / Async"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141C30] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newSkillDescription}
                  onChange={(e) => setNewSkillDescription(e.target.value)}
                  placeholder="Brief summary shown in the workspace skill list..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141C30] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  System Directive Instructions (Prompt Injection) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newSkillInstructions}
                  onChange={(e) => setNewSkillInstructions(e.target.value)}
                  placeholder="You are an expert in... Always write clean code with... Follow these conventions: 1. ... 2. ..."
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#141C30] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSkillId(null);
                  }}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : editingSkillId ? 'Update Skill' : 'Save & Activate'}
                </button>
              </div>
            </form>
          )}

          {/* Skill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill) => {
              const isActive = activeSkillIds.includes(skill.id);
              const IconComp = (skill.icon && ICON_MAP[skill.icon]) || Sparkles;
              const isExpanded = expandedSkillId === skill.id;

              return (
                <div
                  key={skill.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                    isActive
                      ? 'border-violet-500/50 bg-violet-50/30 dark:bg-violet-950/15 shadow-sm'
                      : 'border-gray-200 dark:border-[#28334B]/80 bg-white dark:bg-[#1a1a1e] hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon, Title, Badge, and Toggle Switch */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isActive
                              ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {skill.name}
                            </h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60">
                              {skill.badge}
                            </span>
                            {skill.isCustom && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            {skill.description}
                          </p>
                        </div>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleSkill(skill.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer ${
                          isActive ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={isActive}
                        aria-label={`Toggle ${skill.name}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm flex items-center justify-center ${
                            isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {isActive && <Check className="w-3 h-3 text-violet-600" />}
                        </div>
                      </button>
                    </div>

                    {/* Expandable Prompt Instructions View */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#28334B] text-[11px] text-gray-600 dark:text-gray-300 font-mono bg-gray-50/80 dark:bg-[#141416] p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
                        {skill.instructions}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: View instructions button and custom actions */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-[#28334B]/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <button
                      type="button"
                      onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                      className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Instructions' : 'View Instructions'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {skill.isCustom && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(skill)}
                          className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1"
                          title="Edit Custom Skill"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                          title="Delete Custom Skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSkills.length === 0 && !isLoading && (
            <div className="py-12 text-center text-gray-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-500" />
              <p className="text-sm font-medium">No skills found matching your filter.</p>
              <p className="text-xs mt-1">Try a different search term or create a custom skill.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 dark:border-[#28334B] bg-gray-50/70 dark:bg-[#141C30] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">{activeSkillIds.length}</strong> of{' '}
              {allSkills.length} skills active
            </span>
            {activeSkillIds.length > 0 && (
              <button
                type="button"
                onClick={() => onSetActiveSkillIds([])}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium ml-2 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
