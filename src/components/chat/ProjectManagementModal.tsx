import React, { useState } from 'react';
import {
  X,
  Folder,
  Plus,
  Trash2,
  Edit2,
  Check,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  HardDrive,
  Upload,
} from 'lucide-react';

export interface StudioProjectItem {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  color?: string | null;
  conversationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectManagementModalProps {
  open: boolean;
  onClose: () => void;
  projects: StudioProjectItem[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (data: { name: string; description?: string; instructions?: string; color?: string }) => Promise<void>;
  onUpdateProject: (id: string, data: { name?: string; description?: string; instructions?: string; color?: string }) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onStartChatInProject: (projectId: string) => void;
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  open,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onStartChatInProject,
}) => {
  const [selectedProjId, setSelectedProjId] = useState<string | null>(
    activeProjectId || (projects[0]?.id || null)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editingInstructionsText, setEditingInstructionsText] = useState('');

  // Form states for creating new project
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const currentProject = projects.find((p) => p.id === selectedProjId) || projects[0];

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewName('');
    setNewDesc('');
    setNewInstructions('');
    setNewColor('#8b5cf6');
  };

  const handleSaveCreate = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateProject({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        instructions: newInstructions.trim() || undefined,
        color: newColor,
      });
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveInstructions = async () => {
    if (!currentProject) return;
    setIsSubmitting(true);
    try {
      await onUpdateProject(currentProject.id, {
        instructions: editingInstructionsText.trim(),
      });
      setIsEditingInstructions(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-[#0e1320] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0c101b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Studio Projects & Knowledge</h2>
              <p className="text-[11px] text-slate-400">Organize chat sessions and persistent project instructions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: Split View (Projects list left, Project details right) */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Column: Project Selector & Create Button */}
          <div className="w-full sm:w-1/3 border-r border-slate-800 flex flex-col min-h-0 bg-[#0a0d16]">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Projects ({projects.length})
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {projects.map((proj) => {
                const isSelected = !isCreating && currentProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedProjId(proj.id);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-violet-600/15 border-violet-500/50 text-white shadow-xs'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#8b5cf6' }}
                      />
                      <span className="text-xs font-semibold truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {proj.conversationsCount || 0}
                    </span>
                  </div>
                );
              })}

              {projects.length === 0 && !isCreating && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No projects created yet. Click "+ New" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Project View (Matching Reference Image 1) */}
          <div className="w-full sm:w-2/3 p-5 overflow-y-auto bg-[#0e1320] flex flex-col justify-between">
            {isCreating ? (
              /* Create Project Form */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-400" />
                  <span>Create New Project</span>
                </h3>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Competitive Analysis, App V2, API Redesign"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Conduct in-depth benchmark and feature analysis"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Custom Project Instructions (System Directive)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Focus on architectural modularity, SOLID principles, and clean diffs. Provide sources for claims."
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Color Tag
                  </label>
                  <div className="flex items-center gap-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          newColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0e1320]' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {newColor === c && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCreate}
                    disabled={!newName.trim() || isSubmitting}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Create Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : currentProject ? (
              /* Project Details View (Matching Image 1) */
              <div className="space-y-5">
                {/* Project Header (Image 1 style) */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: currentProject.color || '#8b5cf6' }}
                      />
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {currentProject.name}
                      </h3>
                    </div>
                    {currentProject.description && (
                      <p className="text-xs text-slate-400">
                        {currentProject.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete project "${currentProject.name}"? Sessions will not be deleted.`)) {
                          onDeleteProject(currentProject.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Instructions Section (Image 1 style) */}
                <div className="p-4 rounded-xl bg-[#0b0e17] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Project Instructions</span>
                    </span>
                    {!isEditingInstructions ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInstructionsText(currentProject.instructions || '');
                          setIsEditingInstructions(true);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Instructions"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>

                  {isEditingInstructions ? (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={editingInstructionsText}
                        onChange={(e) => setEditingInstructionsText(e.target.value)}
                        placeholder="Project-level guidelines injected into all chats in this project..."
                        className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-700 text-white font-mono resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveInstructions}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save Instructions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingInstructions(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {currentProject.instructions || 'No project-specific instructions defined yet.'}
                    </p>
                  )}
                </div>

                {/* Project Files & Capacity Meter (Image 1 style) */}
                <div className="p-4 rounded-xl bg-[#0b0e17] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                      <span>Project Files & Documents</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Capacity: 10MB</span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '12%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Project attachments are securely accessible across all project sessions.
                  </p>
                </div>

                {/* Action: Start Chat in Project */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onStartChatInProject(currentProject.id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Start New Chat in "{currentProject.name}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Select or create a project to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
