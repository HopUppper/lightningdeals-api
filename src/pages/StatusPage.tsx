import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Database, Server, RefreshCw, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const StatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="ui-kicker justify-center">Real-time Operations</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            LightningDeals System Status
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Live availability, API endpoint health, database response latency, and vendor gateway status.
          </p>
        </div>

        {/* Global Banner */}
        <div className="mt-8 bg-card border border-border rounded-panel p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                statusData?.status === 'OPERATIONAL' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
              }`} />
              <div>
                <h3 className="text-lg font-bold text-fg">
                  {statusData?.status === 'OPERATIONAL' ? 'All Systems Operational' : 'Degraded System Performance'}
                </h3>
                <p className="text-xs text-muted font-mono mt-0.5">
                  Last checked: {statusData?.timestamp ? new Date(statusData.timestamp).toLocaleTimeString() : 'Just now'}
                </p>
              </div>
            </div>

            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="ui-button-secondary text-xs py-2 px-3.5 gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Sub-services list */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted mb-2">Service Health Checks</p>
            {statusData?.services?.map((s: any, idx: number) => (
              <div key={idx} className="p-4 rounded-control bg-bg border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg">{s.name}</p>
                  {s.note && <p className="text-[11px] text-muted font-mono mt-0.5">{s.note}</p>}
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  {s.latency && <span className="text-muted">{s.latency}</span>}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    s.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
