import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Loader2,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminSecurity: React.FC = () => {
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // MFA Management State
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState<{ enrolled: boolean; enrolledAt?: string; remainingBackups?: number }>({
    enrolled: false,
  });
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpAuthUrl: string;
    backupCodes: string[];
    hashedCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable Modal State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  const loadMfaStatus = async () => {
    try {
      setMfaLoading(true);
      const res = await adminFetch('/api/admin/auth/mfa/status');
      if (res.ok) {
        const data = await res.json();
        setMfaStatus(data);
      }
    } catch (e) {
      console.error('Failed to load MFA status:', e);
    } finally {
      setMfaLoading(false);
    }
  };

  useEffect(() => {
    async function loadSecurity() {
      try {
        const res = await adminFetch('/api/admin/logs');
        if (res.ok) {
          setTrials(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSecurity();
    loadMfaStatus();
  }, []);

  const handleStartSetup = async () => {
    setSetupError(null);
    setSetupSuccess(null);
    setVerificationCode('');
    setSetupSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/auth/mfa/setup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
        setSetupModalOpen(true);
      } else {
        const data = await res.json();
        alert(data?.error?.message || 'Failed to initiate 2FA setup.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error initiating 2FA setup.');
    } finally {
      setSetupSubmitting(false);
    }
  };

  const handleActivateMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;

    if (!verificationCode || verificationCode.trim().length !== 6) {
      setSetupError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setSetupSubmitting(true);
    setSetupError(null);
    try {
      const res = await adminFetch('/api/admin/auth/mfa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          code: verificationCode.trim(),
          hashedCodes: setupData.hashedCodes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSetupSuccess('Two-factor authentication is now active!');
        setTimeout(() => {
          setSetupModalOpen(false);
          setSetupData(null);
          loadMfaStatus();
        }, 1200);
      } else {
        setSetupError(data?.error?.message || 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      setSetupError(err.message || 'Error activating 2FA.');
    } finally {
      setSetupSubmitting(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError('Admin password is required.');
      return;
    }

    setDisableSubmitting(true);
    setDisableError(null);
    try {
      const res = await adminFetch('/api/admin/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDisableModalOpen(false);
        setDisablePassword('');
        loadMfaStatus();
      } else {
        setDisableError(data?.error?.message || 'Failed to disable 2FA.');
      }
    } catch (err: any) {
      setDisableError(err.message || 'Error disabling 2FA.');
    } finally {
      setDisableSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            SECURITY & AUTHENTICATION CENTER
          </span>
          <span className="text-xs text-muted font-mono">RFC 6238 TOTP: ACTIVE</span>
        </div>
        <h1 className="text-2xl font-bold text-fg tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent" />
          <span>Security Center & Threat Detection</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Two-factor authentication (TOTP/MFA), audit trails, anti-abuse event scoring, and access logging.
        </p>
      </div>

      {/* Two-Factor Authentication Control Card */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                mfaStatus.enrolled
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}
            >
              {mfaStatus.enrolled ? <ShieldCheck className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-fg">Administrator Two-Factor Authentication (2FA)</h2>
                {mfaLoading ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/20 text-muted">Checking...</span>
                ) : mfaStatus.enrolled ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                    NOT ENROLLED
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {mfaStatus.enrolled
                  ? `Protected with time-based one-time passwords (TOTP RFC 6238). ${
                      mfaStatus.remainingBackups !== undefined ? `${mfaStatus.remainingBackups} unused recovery codes remaining.` : ''
                    }`
                  : 'Protect your administrator account by requiring a 6-digit code from Google Authenticator, 1Password, or Authy on login.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mfaStatus.enrolled ? (
              <button
                onClick={() => {
                  setDisableError(null);
                  setDisablePassword('');
                  setDisableModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={handleStartSetup}
                disabled={setupSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {setupSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>Set Up Two-Factor Authentication</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-subtle/50 border border-border space-y-1">
            <span className="text-[10px] text-muted font-mono uppercase">Protocol</span>
            <p className="font-semibold text-fg">RFC 6238 TOTP (HMAC-SHA1)</p>
          </div>
          <div className="p-3 rounded-xl bg-subtle/50 border border-border space-y-1">
            <span className="text-[10px] text-muted font-mono uppercase">Step Duration</span>
            <p className="font-semibold text-fg">30 Seconds (6 Digits)</p>
          </div>
          <div className="p-3 rounded-xl bg-subtle/50 border border-border space-y-1">
            <span className="text-[10px] text-muted font-mono uppercase">Backup Recovery</span>
            <p className="font-semibold text-fg">
              {mfaStatus.enrolled ? `${mfaStatus.remainingBackups ?? 0} Codes Available` : '8 Single-Use Codes on Setup'}
            </p>
          </div>
        </div>
      </div>

      {/* Setup 2FA Modal */}
      {setupModalOpen && setupData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-fg">Set Up Two-Factor Authentication</h3>
              </div>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="text-muted hover:text-fg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            {setupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{setupSuccess}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-fg mb-1">Step 1: Add key to your Authenticator App</p>
                <p className="text-muted mb-2">
                  Open Google Authenticator, 1Password, or Authy, and select "Add Account" → "Enter key manually".
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-subtle border border-border font-mono text-xs">
                  <span className="font-bold text-fg select-all flex-1 tracking-wider">{setupData.secret}</span>
                  <button
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                    className="p-1.5 rounded-lg border border-border hover:bg-card text-muted hover:text-fg transition-colors cursor-pointer"
                    title="Copy Secret"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-fg">Step 2: Save Emergency Recovery Codes</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodes ? 'Copied!' : 'Copy All'}</span>
                  </button>
                </div>
                <p className="text-muted mb-2">
                  Store these recovery codes securely. If you lose access to your authenticator, each code can be used once to log in.
                </p>
                <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-subtle border border-border font-mono text-[11px]">
                  {setupData.backupCodes.map((code, idx) => (
                    <span key={idx} className="p-1 bg-card rounded border border-border/50 text-center font-bold text-fg">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleActivateMfa} className="space-y-3 pt-2 border-t border-border">
                <p className="font-semibold text-fg">Step 3: Verify with 6-Digit Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3.5 py-2 text-center text-lg font-mono font-bold tracking-widest rounded-xl bg-card border border-border focus:outline-none focus:border-accent text-fg"
                  />
                  <button
                    type="submit"
                    disabled={setupSubmitting || verificationCode.length !== 6}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {setupSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate 2FA'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-fg">Disable Two-Factor Authentication</h3>
              <button
                onClick={() => setDisableModalOpen(false)}
                className="text-muted hover:text-fg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {disableError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{disableError}</span>
              </div>
            )}

            <p className="text-xs text-muted">
              To disable two-factor authentication, please enter your current administrator password to confirm your identity.
            </p>

            <form onSubmit={handleDisableMfa} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-fg">Administrator Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="password"
                    required
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-card border border-border focus:outline-none focus:border-accent text-fg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-subtle text-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableSubmitting || !disablePassword}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {disableSubmitting ? 'Verifying...' : 'Confirm & Disable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Audit Trail Table */}
      <div className="technical-panel overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading security logs...
          </div>
        ) : trials.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">No security events recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted uppercase bg-subtle/50 text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Admin / Identity Target</th>
                  <th className="py-3 px-4 font-bold">Operation Action</th>
                  <th className="py-3 px-4 font-bold">Network IP</th>
                  <th className="py-3 px-4 font-bold">Metadata Payload</th>
                  <th className="py-3 px-4 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {trials.map((t) => (
                  <tr key={t.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-fg">{t.adminUser?.email || 'System Daemon'}</td>
                    <td className="py-3 px-4 font-bold text-accent">
                      <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[11px]">
                        {t.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">{t.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-muted truncate max-w-xs">{t.metadata || '—'}</td>
                    <td className="py-3 px-4 text-right text-muted tabular-nums whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSecurity;
