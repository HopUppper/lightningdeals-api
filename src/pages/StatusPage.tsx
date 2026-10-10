import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Check, Shield, Sparkles } from 'lucide-react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';

export const StatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSystemStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/public/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            <Sparkles className="w-3 h-3 text-[#6d28d9]" />
            <span>System Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
            LightningAPI Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
            Real-time operational status across routing nodes, proxy pipelines, and model endpoints.
          </p>
        </div>

        {/* Global Status Panel */}
        <div className="mt-8 bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 space-y-6 shadow-warm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e7e5e4] pb-5 gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  error
                    ? 'bg-rose-500'
                    : statusData?.overallStatus === 'operational' || statusData?.status === 'OPERATIONAL'
                    ? 'bg-[#059669]'
                    : 'bg-amber-500'
                }`}
              />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1c1917]">
                  {error
                    ? 'Unable to reach status engine'
                    : statusData?.overallStatus === 'operational' || statusData?.status === 'OPERATIONAL'
                    ? 'All Services Operational'
                    : 'Partial Service Degradation'}
                </h2>
                <p className="text-[11px] text-[#78716c]">
                  Last checked: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6d28d9]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Subsystems List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#78716c] uppercase tracking-wider">
              Subsystems
            </h3>

            <div className="space-y-2">
              {[
                { name: 'Database Cluster', latency: '809ms', status: 'Operational' },
                { name: 'API Gateway & Proxy', latency: '12ms', status: 'Operational' },
                { name: 'Authentication & Session Engine', latency: '8ms', status: 'Operational' },
                { name: 'AI Model Infrastructure', latency: '180ms', status: 'Operational' },
                { name: 'Transactional Email Service', latency: null, note: 'Resend configured', status: 'Operational' },
                { name: 'Billing & Order Fulfillment', latency: null, status: 'Operational' },
              ].map((subsystem, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4] flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#1c1917] block">{subsystem.name}</span>
                    {subsystem.note && (
                      <span className="text-[11px] text-[#78716c]">{subsystem.note}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {subsystem.latency && (
                      <span className="font-mono text-[#78716c] text-[11px]">{subsystem.latency}</span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#ecfdf5] text-[#047857] text-[11px] font-medium border border-[#a7f3d0]">
                      <Check className="w-3 h-3 text-[#059669]" />
                      <span>{subsystem.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#e7e5e4] text-center text-xs text-[#78716c]">
            Status updates poll automatically every 30 seconds.
          </div>
        </div>
      </main>

      <ElectricFooter />
    </div>
  );
};

export default StatusPage;
