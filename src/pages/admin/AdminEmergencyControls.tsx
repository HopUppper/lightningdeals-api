import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Power, Lock, Check } from 'lucide-react';

export const AdminEmergencyControls: React.FC = () => {
  const [globalApiDisabled, setGlobalApiDisabled] = useState(false);
  const [trialsDisabled, setTrialsDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchEmergencyStatus = async () => {
    try {
      const res = await fetch('/api/admin/emergency/status');
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
      const res = await fetch('/api/admin/emergency/toggle-global-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 fill-current" />
          <span>Emergency Controls & Maintenance</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          High-impact security controls. Instantly pause global API routing or stop trial key generation during attacks.
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
              Immediately stops all incoming API requests on `/v1/messages`. Admin portal remains online.
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
      </div>
    </div>
  );
};
