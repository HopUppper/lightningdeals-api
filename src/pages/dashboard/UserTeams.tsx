import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  Key,
  Mail,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  DollarSign,
  UserCheck,
  Settings,
  LogOut,
  Edit2,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { userFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface TeamMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

interface TeamApiKeyItem {
  id: string;
  teamId: string;
  apiKeyId: string;
  maxMonthlySpendUsd?: number | null;
  currentMonthSpendUsd?: number;
  createdAt: string;
  apiKey: {
    id: string;
    name: string;
    displayKey: string;
    status: string;
    totalRequests?: number;
    tokensUsed?: number;
    creditBalanceUsd?: number;
  };
}

interface TeamItem {
  id: string;
  name: string;
  ownerId: string;
  userRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  members: TeamMember[];
  invites: TeamInvite[];
  apiKeys: TeamApiKeyItem[];
  teamApiKeys?: TeamApiKeyItem[];
}

interface AvailableKey {
  id: string;
  name: string;
  displayKey: string;
  creditBalanceUsd: number;
  status: string;
}

export const UserTeams: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  const [showAttachKeyModal, setShowAttachKeyModal] = useState(false);
  const [availableKeys, setAvailableKeys] = useState<AvailableKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [maxSpendLimit, setMaxSpendLimit] = useState('');
  const [attachingKey, setAttachingKey] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const loadTeams = async () => {
    try {
      const res = await userFetch('/api/user/teams');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.teams)) {
          setTeams(data.teams);
          if (data.teams.length > 0 && !activeTeamId) {
            setActiveTeamId(data.teams[0].id);
          } else if (data.teams.length > 0 && activeTeamId) {
            // Keep active team valid
            if (!data.teams.some((t: any) => t.id === activeTeamId)) {
              setActiveTeamId(data.teams[0].id);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load teams', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const isOwner = activeTeam?.ownerId === user?.id || activeTeam?.userRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || activeTeam?.userRole === 'ADMIN';

  // Helper for active team keys
  const teamKeys: TeamApiKeyItem[] = activeTeam?.apiKeys || activeTeam?.teamApiKeys || [];

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    setErrorMsg(null);

    try {
      const res = await userFetch('/api/user/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewTeamName('');
        setShowCreateModal(false);
        await loadTeams();
        if (data.team?.id) {
          setActiveTeamId(data.team.id);
        }
        showToast('Team workspace created successfully!');
      } else {
        setErrorMsg(data.error?.message || 'Failed to create team.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !inviteEmail.trim()) return;
    setInviting(true);
    setErrorMsg(null);

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const token = data.token || data.invite?.token;
        const fullUrl =
          data.inviteUrl || `${window.location.origin}/invite?token=${encodeURIComponent(token)}`;
        setCreatedInviteUrl(fullUrl);
        setInviteEmail('');
        await loadTeams();
        showToast('Invitation generated!');
      } else {
        setErrorMsg(data.error?.message || 'Failed to send invite.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!activeTeam) return;
    if (!confirm('Are you sure you want to revoke this pending invitation?')) return;

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/invites/${inviteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadTeams();
        showToast('Invitation revoked.');
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to revoke invite.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberEmail: string) => {
    if (!activeTeam) return;
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this team?`)) return;

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/members/${memberUserId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadTeams();
        showToast('Member removed from team.');
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to remove member.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleChangeRole = async (memberUserId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!activeTeam) return;

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/members/${memberUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await loadTeams();
        showToast(`Role updated to ${newRole}.`);
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to update member role.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleLeaveTeam = async () => {
    if (!activeTeam) return;
    if (!confirm(`Are you sure you want to leave ${activeTeam.name}?`)) return;

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/leave`, {
        method: 'POST',
      });
      if (res.ok) {
        setActiveTeamId(null);
        await loadTeams();
        showToast('You have left the team.');
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to leave team.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeam) return;
    if (
      !confirm(
        `CAUTION: Are you sure you want to permanently delete "${activeTeam.name}"? All shared keys, invites, and member associations will be deleted.`
      )
    )
      return;

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setActiveTeamId(null);
        await loadTeams();
        showToast('Team workspace deleted.');
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to delete team.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleOpenAttachKeyModal = async () => {
    try {
      const res = await userFetch('/api/user/teams/available-keys');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.keys)) {
          setAvailableKeys(data.keys);
          if (data.keys.length > 0) {
            setSelectedKeyId(data.keys[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setShowAttachKeyModal(true);
  };

  const handleAttachKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !selectedKeyId) return;
    setAttachingKey(true);

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeyId: selectedKeyId,
          maxMonthlySpendUsd: maxSpendLimit ? parseFloat(maxSpendLimit) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAttachKeyModal(false);
        setMaxSpendLimit('');
        await loadTeams();
        showToast('API key attached to team workspace!');
      } else {
        alert(data.error?.message || 'Failed to attach API key.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    } finally {
      setAttachingKey(false);
    }
  };

  const handleDetachKey = async (keyId: string) => {
    if (!activeTeam) return;
    if (!confirm('Are you sure you want to detach this API key from the team?')) return;

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}/keys/${keyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadTeams();
        showToast('API key detached from team.');
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to detach key.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleRenameTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !renameValue.trim()) return;
    setRenaming(true);

    try {
      const res = await userFetch(`/api/user/teams/${activeTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setShowRenameModal(false);
        await loadTeams();
        showToast('Team renamed successfully.');
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to rename team.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    } finally {
      setRenaming(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7136E8]/10 text-[#7136E8] border border-[#7136E8]/20">
              Workspace & Collaboration
            </span>
            <span className="text-xs text-[#9ca3af]">Multi-User Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] mt-1">
            Teams & API Key Collaboration
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Share quota, manage role-based member permissions, and set monthly spend caps across shared team API keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Account Isolation Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e5e7eb] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#7136E8] shrink-0 mt-0.5" />
        <div className="text-xs text-[#4b5563] leading-relaxed">
          <span className="font-semibold text-[#111827]">Independent Account Isolation:</span> Teams
          are completely additive and optional. Creating or joining a team never alters your personal
          plan, private API keys, or individual billing balance.
        </div>
      </div>

      {/* Main Teams Container */}
      {teams.length === 0 && !loading ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#e5e7eb] space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#7136E8]/10 text-[#7136E8] flex items-center justify-center mx-auto border border-[#7136E8]/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#111827]">No Teams Configured Yet</h3>
            <p className="text-xs text-[#6b7280] mt-1 max-w-md mx-auto leading-relaxed">
              Create an engineering workspace to collaborate with teammates, assign shared API keys with custom spend limits, and invite team members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Team</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Teams Sidebar Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                Your Teams ({teams.length})
              </h3>
            </div>

            <div className="space-y-1.5">
              {(teams || []).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTeamId(t.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    activeTeam?.id === t.id
                      ? 'border-[#7136E8] bg-[#7136E8]/[0.04] text-[#7136E8] ring-1 ring-[#7136E8]'
                      : 'border-[#e5e7eb] bg-white hover:bg-[#faf9f5] text-[#374151]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate text-[#111827]">{t.name}</div>
                    <div className="text-[10px] text-[#6b7280] mt-0.5 flex items-center gap-1.5">
                      <span>
                        {(t.members || []).length} member{(t.members || []).length !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[9px] uppercase font-semibold">
                        {t.userRole || (t.ownerId === user?.id ? 'OWNER' : 'MEMBER')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      activeTeam?.id === t.id ? 'text-[#7136E8] translate-x-0.5' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Active Team Workspace Panel */}
          {activeTeam && (
            <div className="lg:col-span-3 space-y-6">
              {/* Workspace Header Top Card */}
              <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#111827]">{activeTeam.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7136E8]/10 text-[#7136E8] border border-[#7136E8]/20 uppercase">
                      {activeTeam.userRole || 'ACTIVE WORKSPACE'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Created on {new Date(activeTeam.createdAt).toLocaleDateString()} • Managed by{' '}
                    {isOwner ? 'You (Owner)' : 'Team Administrator'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Invite Teammate button */}
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedInviteUrl(null);
                        setErrorMsg(null);
                        setShowInviteModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] text-white shadow-xs transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Invite Member</span>
                    </button>
                  )}

                  {/* Rename Team */}
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setRenameValue(activeTeam.name);
                        setShowRenameModal(true);
                      }}
                      className="p-2 rounded-xl border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827] hover:bg-[#faf9f5] transition-colors cursor-pointer"
                      title="Rename Workspace"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Leave Team (Non-owner) */}
                  {!isOwner && (
                    <button
                      type="button"
                      onClick={handleLeaveTeam}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Team</span>
                    </button>
                  )}

                  {/* Delete Team (Owner only) */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleDeleteTeam}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Team Workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 1: Team Members */}
              <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7136E8]" />
                    <span>Team Members ({(activeTeam.members || []).length})</span>
                  </h3>
                </div>

                <div className="divide-y divide-[#f3f4f6]">
                  {(activeTeam.members || []).map((mem) => {
                    const isSelf = mem.userId === user?.id;
                    const isMemberOwner = mem.role === 'OWNER';

                    return (
                      <div
                        key={mem.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#7136E8]/10 text-[#7136E8] font-bold text-xs flex items-center justify-center shrink-0 border border-[#7136E8]/20">
                            {(mem.user.name || mem.user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#111827] truncate flex items-center gap-1.5">
                              <span>{mem.user.email}</span>
                              {isSelf && (
                                <span className="text-[10px] font-mono font-medium text-[#6b7280]">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#9ca3af]">
                              Joined {new Date(mem.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Role selector for owner modifying non-owner members */}
                          {isOwner && !isMemberOwner ? (
                            <select
                              value={mem.role}
                              onChange={(e) =>
                                handleChangeRole(mem.userId, e.target.value as 'ADMIN' | 'MEMBER')
                              }
                              className="px-2.5 py-1 rounded-lg border border-[#e5e7eb] bg-white text-[11px] font-mono font-semibold text-[#374151] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7136E8]"
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                mem.role === 'OWNER'
                                  ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                                  : mem.role === 'ADMIN'
                                  ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
                                  : 'bg-gray-100 text-[#4b5563]'
                              }`}
                            >
                              {mem.role}
                            </span>
                          )}

                          {/* Remove button */}
                          {isOwnerOrAdmin && !isMemberOwner && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(mem.userId, mem.user.email)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove Member from Team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Pending Invitations */}
              {Array.isArray(activeTeam?.invites) && activeTeam.invites.length > 0 && (
                <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Pending Invitations ({activeTeam.invites.length})</span>
                  </h3>

                  <div className="divide-y divide-[#f3f4f6]">
                    {(activeTeam.invites || []).map((inv) => (
                      <div
                        key={inv.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#111827]">{inv.email}</div>
                          <div className="text-[10px] text-[#6b7280]">
                            Role: <span className="font-mono font-bold">{inv.role}</span> • Valid
                            until {new Date(inv.expiresAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                `${window.location.origin}/invite?token=${encodeURIComponent(
                                  inv.token
                                )}`,
                                inv.id
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e5e7eb] hover:bg-[#faf9f5] text-[11px] font-semibold text-[#374151] transition-colors cursor-pointer"
                          >
                            {copiedToken === inv.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {isOwnerOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Revoke Invitation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: Shared Team API Keys & Spend Limits */}
              <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#7136E8]" />
                      <span>Shared Team API Keys ({teamKeys.length})</span>
                    </h3>
                    <p className="text-[11px] text-[#6b7280] mt-0.5">
                      Team members can use these shared credentials for collaborative workloads with monthly spend protection.
                    </p>
                  </div>

                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenAttachKeyModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7136E8]/10 text-[#7136E8] hover:bg-[#7136E8]/15 border border-[#7136E8]/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach API Key</span>
                    </button>
                  )}
                </div>

                {teamKeys.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#faf9f5] border border-dashed border-[#e5e7eb] space-y-2">
                    <Key className="w-6 h-6 text-gray-300 mx-auto" />
                    <p className="text-xs font-semibold text-[#374151]">No Team API Keys Attached</p>
                    <p className="text-[11px] text-[#6b7280] max-w-sm mx-auto">
                      Attach one of your active personal API keys to this team workspace so team members can make authorized calls under optional spend caps.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f3f4f6]">
                    {teamKeys.map((item) => (
                      <div
                        key={item.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827]">
                              {item.apiKey?.name || 'Shared API Key'}
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-[#374151]">
                              {item.apiKey?.displayKey || 'sk_live_...'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-[#6b7280] font-mono">
                            <span>
                              Monthly Cap:{' '}
                              <strong className="text-[#111827]">
                                {item.maxMonthlySpendUsd
                                  ? `$${item.maxMonthlySpendUsd.toFixed(2)}`
                                  : 'Unlimited'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Current Spend:{' '}
                              <strong className="text-[#111827]">
                                ${(item.currentMonthSpendUsd || 0).toFixed(2)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Tokens Used:{' '}
                              {(item.apiKey?.tokensUsed || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {isOwnerOrAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDetachKey(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Detach</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#111827]">Create New Team Workspace</h3>
            <p className="text-xs text-[#6b7280]">
              Give your engineering or AI agent team workspace a descriptive name.
            </p>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Engineering / Agent Ops"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7136E8]"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTeamName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] disabled:opacity-50 text-white cursor-pointer flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE TEAM MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#111827]">Invite Team Member</h3>
            <p className="text-xs text-[#6b7280]">
              Generate a secure 7-day invitation link for {activeTeam?.name}.
            </p>

            {createdInviteUrl ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Invitation link ready! Share this link with your teammate:</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#e5e7eb] text-xs font-mono break-all text-[#374151]">
                  {createdInviteUrl}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdInviteUrl, 'modal-invite')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedToken === 'modal-invite' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Teammate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="developer@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7136E8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7136E8] cursor-pointer"
                  >
                    <option value="MEMBER">Member (Read & use team shared API keys)</option>
                    <option value="ADMIN">Admin (Manage members & attach keys)</option>
                  </select>
                </div>

                {errorMsg && (
                  <div className="text-xs text-rose-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] disabled:opacity-50 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Generate Invite Link</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ATTACH API KEY MODAL */}
      {showAttachKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#111827]">Attach API Key to Team</h3>
            <p className="text-xs text-[#6b7280]">
              Select an active API key to share with {activeTeam?.name}. You can assign a monthly USD spend cap.
            </p>

            {availableKeys.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-[#4b5563]">You do not have any available active API keys to attach.</p>
                <button
                  type="button"
                  onClick={() => setShowAttachKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#111827] text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAttachKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Select API Key
                  </label>
                  <select
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7136E8] cursor-pointer"
                  >
                    {availableKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.displayKey}) - Balance: ${k.creditBalanceUsd.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Monthly Spend Cap (USD) — Optional
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 50.00 (leave empty for unlimited)"
                    value={maxSpendLimit}
                    onChange={(e) => setMaxSpendLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7136E8]"
                  />
                  <span className="text-[10px] text-[#9ca3af] mt-1 block">
                    Once team calls reach this limit within a calendar month, requests will pause automatically.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachKeyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={attachingKey || !selectedKeyId}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] disabled:opacity-50 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {attachingKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Attach Key</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RENAME TEAM MODAL */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#111827]">Rename Workspace</h3>
            <form onSubmit={handleRenameTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  New Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7136E8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming || !renameValue.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7136E8] hover:bg-[#6029d2] disabled:opacity-50 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {renaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTeams;
