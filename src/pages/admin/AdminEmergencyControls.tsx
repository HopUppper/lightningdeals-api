import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Power, Lock, Check, UserX, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface PurgeResult {
  suspendedUsersCount: number;
  suspendedKeysCount: number;
  flaggedDomains: string[];
  repeatIps: string[];
}

export const AdminEmergencyControls: React.FC = () => {
  const [globalApiDisabled, setGlobalApiDisabled] = useState(false);
  const [trialsDisabled, setTrialsDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [togglingTrials, setTogglingTrials] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  const fetchEmergencyStatus = async () => {
    try {
      const res = await adminFetch('/api/admin/emergency/status');
      if (res.ok) {
        const data = await res.json();
        setGlobalApiDisabled(data.globalApiDisabled);
        setTrialsDisabled(data.trialsDisabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyStatus();
  }, []);

  const handleToggleGlobalApi = async () => {
    const newState = !globalApiDisabled;
    if (newState && !confirm('WARNING: Are you sure you want to GLOBALLY DISABLE the API Gateway? All customer API requests will immediately fail with HTTP 503.')) {
      return;
    }

    setToggling(true);
    try {
      const res = await adminFetch('/api/admin/emergency/toggle-global-api', {
        method: 'POST',
        body: JSON.stringify({ disabled: newState }),
      });

      if (res.ok) {
        const data = await res.json();
        setGlobalApiDisabled(data.globalApiDisabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  const handleToggleTrials = async () => {
    const newState = !trialsDisabled;
    if (newState && !confirm('Are you sure you want to PAUSE all Free Trial key generation? New customers will not be able to claim free trials until re-enabled.')) {
      return;
    }

    setTogglingTrials(true);
    try {
      const res = await adminFetch('/api/admin/emergency/toggle-trials', {
        method: 'POST',
        body: JSON.stringify({ disabled: newState }),
      });

      if (res.ok) {
        const data = await res.json();
        setTrialsDisabled(data.trialsDisabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingTrials(false);
    }
  };

  const handlePurgeTempMailTrials = async () => {
    if (!confirm('This will automatically scan the database, suspend all accounts registered with disposable/burner email domains, and revoke all free trial keys from duplicate IP addresses. Proceed?')) {
      return;
    }

    setPurging(true);
    setPurgeError(null);
    setPurgeResult(null);

    try {
      const res = await adminFetch('/api/admin/emergency/purge-tempmail-trials', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPurgeResult(data.stats);
      } else {
        setPurgeError(data.error?.message || 'Failed to complete anti-abuse scan.');
      }
    } catch (err: any) {
      setPurgeError(err.message || 'Network error executing anti-abuse scan.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 fill-current" />
          <span>Emergency Controls & Anti-Abuse Maintenance</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          High-impact security controls. Instantly pause global API routing, pause trial key issuance, or mass-suspend disposable email abusers.
        </p>
      </div>

      <div className="bg-card border border-red-500/30 rounded-panel p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="p-4 rounded-control bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Carefully verify operational requirements before invoking global killswitches.</span>
        </div>

        {/* Global API Killswitch */}
        <div className="p-6 bg-bg border border-border rounded-control flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Power className="w-4 h-4 text-red-500" />
              <span>Global API Gateway Killswitch</span>
            </h3>
            <p className="text-xs text-muted mt-1">
              Immediately stops all incoming customer API requests on `/v1/messages`. Admin portal remains online.
            </p>
          </div>

          <button
            onClick={handleToggleGlobalApi}
            disabled={loading || toggling}
            className={`px-5 py-2.5 rounded-control text-xs font-extrabold uppercase tracking-wider transition-colors shrink-0 ${
              globalApiDisabled
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {toggling ? 'Updating...' : globalApiDisabled ? 'Re-Enable Gateway' : 'PAUSE GLOBAL API'}
          </button>
        </div>

        {/* Free Trial Killswitch */}
        <div className="p-6 bg-bg border border-border rounded-control flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-base font-bold text-fg">Free Trial Claim Killswitch</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                trialsDisabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {trialsDisabled ? 'PAUSED' : 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Temporarily stops new Free 1-Day Trial claims at `/trial` and `/api/user/trial/claim`. Existing keys remain unaffected.
            </p>
          </div>

          <button
            onClick={handleToggleTrials}
            disabled={loading || togglingTrials}
            className={`px-5 py-2.5 rounded-control text-xs font-extrabold uppercase tracking-wider transition-colors shrink-0 ${
              trialsDisabled
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-amber-600 text-white hover:bg-amber-500'
            }`}
          >
            {togglingTrials ? 'Updating...' : trialsDisabled ? 'Re-Enable Free Trials' : 'PAUSE FREE TRIALS'}
          </button>
        </div>

        {/* Automated Temp-Mail & Duplicate IP Trial Purge Tool */}
        <div className="p-6 bg-bg border border-border rounded-control space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-500" />
                <span>Auto-Suspend Temp-Mail & Duplicate IP Trial Abusers</span>
              </h3>
              <p className="text-xs text-muted mt-1">
                Scans all user accounts and trial claims. Automatically identifies disposable/burner email domains (`emailvanish.com`, `duidir.com`, `jqrvlhc.com`, etc.) and duplicate IP spam, suspends the accounts, and immediately revokes active trial keys.
              </p>
            </div>

            <button
              onClick={handlePurgeTempMailTrials}
              disabled={loading || purging}
              className="px-5 py-2.5 rounded-control text-xs font-extrabold uppercase tracking-wider transition-colors shrink-0 bg-rose-600 text-white hover:bg-rose-500 flex items-center gap-2"
            >
              {purging ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning & Suspending...</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Auto-Suspend Abusers</span>
                </>
              )}
            </button>
          </div>

          {/* Purge Results Banner */}
          {purgeResult && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-control text-xs space-y-2 text-fg">
              <div className="flex items-center gap-2 font-bold text-emerald-600">
                <Check className="w-4 h-4" />
                <span>Anti-Abuse Sweep Completed Successfully</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-2.5 bg-bg rounded-control border border-border">
                  <div className="text-[10px] text-muted uppercase">Abusive Accounts Suspended</div>
                  <div className="text-lg font-bold text-rose-600">{purgeResult.suspendedUsersCount}</div>
                </div>
                <div className="p-2.5 bg-bg rounded-control border border-border">
                  <div className="text-[10px] text-muted uppercase">Trial Keys Revoked</div>
                  <div className="text-lg font-bold text-rose-600">{purgeResult.suspendedKeysCount}</div>
                </div>
                <div className="p-2.5 bg-bg rounded-control border border-border">
                  <div className="text-[10px] text-muted uppercase">Burner Domains Found</div>
                  <div className="text-lg font-bold text-fg">{purgeResult.flaggedDomains?.length || 0}</div>
                </div>
                <div className="p-2.5 bg-bg rounded-control border border-border">
                  <div className="text-[10px] text-muted uppercase">Repeat IPs Neutralized</div>
                  <div className="text-lg font-bold text-fg">{purgeResult.repeatIps?.length || 0}</div>
                </div>
              </div>
              {purgeResult.flaggedDomains?.length > 0 && (
                <div className="text-[11px] text-muted pt-1">
                  <span className="font-semibold text-fg">Flagged burner domains: </span>
                  {purgeResult.flaggedDomains.join(', ')}
                </div>
              )}
            </div>
          )}

          {purgeError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-control text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{purgeError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

