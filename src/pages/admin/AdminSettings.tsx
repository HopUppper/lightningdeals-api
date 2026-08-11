import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, Lock, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to update admin password.');
      } else {
        setSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating admin password.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-600" />
          <span>Admin Security Settings</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Manage initial administrator credentials (`love9002`), session parameters, and API gateway timeouts.
        </p>
      </div>

      <div className="bg-white border border-border rounded-panel p-6 sm:p-8 max-w-xl space-y-6 shadow-xs">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <h3 className="text-sm font-bold text-fg border-b border-border pb-3">Update Administrator Password</h3>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Current Admin Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="love9002"
              className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
            />
          </div>


          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs">
              {error}
            </div>
          )}

          {saved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-control text-emerald-600 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Admin password updated successfully.</span>
            </div>
          )}

          <button
            type="submit"
            className="ui-button-primary w-full justify-center text-xs py-2.5 font-bold"
          >
            Update Admin Password
          </button>
        </form>
      </div>
    </div>
  );
};
