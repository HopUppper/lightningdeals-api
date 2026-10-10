import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, ShieldCheck, Laptop, Trash2, CheckCircle2, RefreshCw, Smartphone, Monitor } from 'lucide-react';
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
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (ua: string = '') => {
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-violet-600" />;
    }
    return <Monitor className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Playful Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <ShieldCheck className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Account & Security
                </h1>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Manage your profile details, verified email address, and active logged-in devices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Profile Info */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <User className="w-5 h-5 text-violet-600" />
              <span>Your Profile Details</span>
            </h3>
            <span className="text-xs font-mono text-muted">ID: {user?.id?.slice(0, 8) || 'ACCOUNT'}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-fg uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  disabled
                  value={user?.name || 'Account User'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-subtle/40 border border-border/80 rounded-2xl text-fg cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-subtle/40 border border-border/80 rounded-2xl text-fg cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg uppercase tracking-wider mb-1.5">
                Account Status
              </label>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-800">
                  Email Verified & Account Active
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg uppercase tracking-wider mb-1.5">
                Membership Tier
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  disabled
                  value={user?.role === 'admin' ? 'Administrator' : 'Standard Member'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-subtle/40 border border-border/80 rounded-2xl text-violet-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Logged-In Sessions */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Laptop className="w-5 h-5 text-violet-600" />
              <span>Signed-In Devices</span>
            </h3>
            <button
              onClick={fetchSessions}
              className="text-muted hover:text-fg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                {loadingSessions ? 'Loading active sessions...' : 'No other active sessions detected.'}
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    session.isCurrent
                      ? 'bg-violet-50/50 border-violet-200 shadow-2xs'
                      : 'bg-white border-border/80 hover:bg-subtle/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-subtle/80 mt-0.5">
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-fg">
                            {session.device || 'Web Browser'}
                          </span>
                          {session.isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full border border-emerald-200">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted truncate max-w-xs">
                          {session.userAgent || 'Standard Browser'}
                        </p>
                        <p className="text-[10px] text-muted">
                          Last active: {new Date(session.lastActiveAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokingId === session.id}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-xl hover:bg-rose-50 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Sign out this device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
