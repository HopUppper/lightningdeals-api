import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, ShieldCheck, Laptop, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface UserSessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await adminFetch('/api/user/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const res = await adminFetch(`/api/user/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Account & Session Security</h1>
        <p className="text-xs text-muted mt-1">
          Manage profile details, email verification status, and active logged-in sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Profile Info */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg border-b border-border pb-3">Profile Information</h3>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-bg border border-border rounded-control text-fg opacity-80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-bg border border-border rounded-control text-fg opacity-80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Email Verification Status</label>
            <div className="flex items-center gap-2 p-2.5 rounded-control bg-bg border border-border">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 font-mono">VERIFIED ACCOUNT</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Account Role</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                disabled
                value={user?.role?.toUpperCase() || 'USER'}
                className="w-full pl-9 pr-4 py-2 text-xs font-mono font-bold bg-bg border border-border rounded-control text-violet-600 uppercase opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Active Logged-In Sessions */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Laptop className="w-4 h-4 text-violet-600" /> Active Logged-In Sessions
            </h3>
            <button onClick={fetchSessions} className="text-muted hover:text-fg text-xs font-mono flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${loadingSessions ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {sessions.map(s => (
              <div key={s.id} className="p-3 rounded-control bg-bg border border-border flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-fg flex items-center gap-2">
                    {s.device}
                    {s.isCurrent && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        THIS DEVICE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted">{s.ipAddress}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Last active: {new Date(s.lastActiveAt).toLocaleTimeString()}
                  </div>
                </div>

                {!s.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    disabled={revokingId === s.id}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors"
                    title="Revoke Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
