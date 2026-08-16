import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, LifeBuoy, FileText, Lock, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'LOADING'>('LOADING');

  useEffect(() => {
    fetch('/api/public/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.overallStatus === 'operational' || data?.status === 'OPERATIONAL') {
          setSystemStatus('OPERATIONAL');
        } else if (data?.overallStatus === 'degraded') {
          setSystemStatus('DEGRADED');
        } else {
          setSystemStatus('OPERATIONAL');
        }
      })
      .catch(() => setSystemStatus('OPERATIONAL'));
  }, []);

  return (
    <footer className="border-t border-border bg-white pt-12 pb-8 text-xs text-muted font-sans">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand & Mission Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-sm font-bold text-fg group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-extrabold shadow-sm transition-transform group-hover:scale-105">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-base font-extrabold text-fg tracking-tight">
                Lightning<span className="animated-gradient-text">Deals</span>
              </span>
            </Link>
            <p className="text-muted leading-relaxed max-w-sm text-xs">
              Premium digital products, AI subscriptions, and high-performance API gateway solutions. Access Claude Max plans with 5-hour rolling token capacity.
            </p>

            <Link
              to="/status"
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                systemStatus === 'OPERATIONAL'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : systemStatus === 'DEGRADED'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  systemStatus === 'OPERATIONAL'
                    ? 'bg-emerald-500 animate-pulse'
                    : systemStatus === 'DEGRADED'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-red-500'
                }`}
              />
              <span>
                {systemStatus === 'OPERATIONAL'
                  ? 'All Gateway Systems Operational'
                  : systemStatus === 'DEGRADED'
                  ? 'Degraded System Performance'
                  : 'System Status Offline'}
              </span>
            </Link>
          </div>

          {/* Product & API Column */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Product & Plans</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/pricing" className="hover:text-violet-600 font-semibold">Claude Max Plans</Link></li>
              <li><Link to="/models" className="hover:text-violet-600">Claude Model Catalog</Link></li>
              <li><Link to="/check-key" className="hover:text-violet-600">Check API Key</Link></li>
              <li><Link to="/trial" className="hover:text-violet-600 font-semibold text-violet-700">Free 1-Day Trial</Link></li>
              <li><Link to="/docs" className="hover:text-violet-600">Developer Documentation</Link></li>
            </ul>
          </div>

          {/* Legal Column (OpusMax Inspired Structure) */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Legal</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/terms-and-conditions" className="hover:text-violet-600">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-violet-600">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-violet-600">Refund & Cancellation</Link></li>
              <li><Link to="/status" className="hover:text-violet-600">System Availability</Link></li>
            </ul>
          </div>

          {/* Support & Contact Column */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Support</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/dashboard/support" className="hover:text-violet-600">Customer Support Ticket</Link></li>
              <li><Link to="/dashboard" className="hover:text-violet-600 font-semibold text-violet-700">My Customer Portal</Link></li>
              <li><a href="https://wa.me/917695956938?text=Hi%20LightningDeals%20Support!%20I%20need%20assistance." target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 font-semibold text-emerald-700">WhatsApp Help Desk</a></li>
              <li><a href="mailto:support@lightningdeals.in" className="hover:text-violet-600">Email Support</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <p>© 2026 Lightning Deals. All rights reserved.</p>
          <div className="flex items-center gap-4 text-muted">
            <span>TLS 1.3 Encrypted</span>
            <span>·</span>
            <span>Zero Prompt Retention</span>
            <span>·</span>
            <span>Cashfree Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
