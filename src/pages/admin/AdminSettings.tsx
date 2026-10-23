import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ShieldCheck, Key, Lock, Check, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!currentPassword || !newPassword) {
      setError('Current password and new password are both required.');
      return;
    }

    if (newPassword.length < 12) {
      setError('New administrator password must be at least 12 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to update admin password.');
      } else {
        // Seamless session update: save fresh token so owner is not logged out
        if (data.freshToken) {
          sessionStorage.setItem('ld_admin_token', data.freshToken);
        }
        setSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSaved(false), 6000);
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating admin password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-600" />
          <span>Admin Security & Account Settings</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Manage administrator credentials, session security, and emergency defense tools.
        </p>
      </div>

      {/* Emergency & Abuse Defense Shortcut Card */}
      <div className="bg-red-50/60 border border-red-200 rounded-panel p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>Emergency Controls & Anti-Abuse Maintenance</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Auto-suspend temporary email abusers, pause free trials, or toggle global API routing.
            </p>
          </div>
          <Link
            to="/deez/emergency"
            className="px-4 py-2 rounded-control bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Open Controls</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Password Management Card */}
      <div className="bg-white border border-border rounded-panel p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-fg flex items-center gap-2">
            <Key className="w-4 h-4 text-violet-600" />
            <span>Change Administrator Password</span>
          </h3>
          <p className="text-xs text-muted mt-1">
            Choose and maintain your own administrator password directly from desktop or mobile without needing PowerShell.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {saved && (
          <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold">Admin password updated successfully.</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                All other active sessions on other devices have been securely revoked. Your current session remains active.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-fg">
              Current Admin Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-fg">
                New Admin Password
              </label>
              <span className="text-[11px] text-muted">Min 12 characters</span>
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={12}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong, unique password"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-fg">
              Confirm New Admin Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={12}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password to confirm"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-control text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              <span>Password Security Policy & Session Management</span>
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
              <li>Must be at least 12 characters with a mix of letters, numbers, and symbols.</li>
              <li>Updating your password automatically revokes all other active sessions across devices.</li>
              <li>Your current browser session will seamlessly stay authorized.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full ui-button-primary justify-center text-xs py-2.5 font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Credentials...</span>
              </>
            ) : (
              <span>Update Admin Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
