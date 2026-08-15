import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'LOADING'>('LOADING');

  useEffect(() => {
    fetch('/api/system/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.status) {
          setSystemStatus(data.status);
        } else {
          setSystemStatus('OPERATIONAL');
        }
      })
      .catch(() => setSystemStatus('OPERATIONAL'));
  }, []);

  return (
    <footer className="border-t border-border bg-white pt-12 pb-8 text-xs text-muted">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          <div className="col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 text-sm font-bold text-fg group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-extrabold shadow-sm transition-transform group-hover:scale-105">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-base font-bold text-fg">LightningDeals</span>
            </Link>
            <p className="text-muted leading-relaxed max-w-sm text-xs">
              High-performance Claude AI API Gateway for developers. Access the full Claude lineup via drop-in Anthropic-compatible endpoints with 5-hour rolling token windows.
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

          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Product & API</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/#api" className="hover:text-violet-600">API Gateway</Link></li>
              <li><Link to="/models" className="hover:text-violet-600">Models Catalog</Link></li>
              <li><Link to="/pricing" className="hover:text-violet-600">Prepaid Token Packages</Link></li>
              <li><Link to="/check-key" className="hover:text-violet-600">Check API Key</Link></li>
              <li><Link to="/trial" className="hover:text-violet-600">Get Free Trial Key</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Developers</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/docs" className="hover:text-violet-600">Documentation</Link></li>
              <li><Link to="/docs#quick-install" className="hover:text-violet-600">Quick Setup Guide</Link></li>
              <li><Link to="/docs#ide-claude-code" className="hover:text-violet-600">Claude Code Setup</Link></li>
              <li><Link to="/docs#ide-cursor" className="hover:text-violet-600">Cursor Integration</Link></li>
              <li><Link to="/status" className="hover:text-violet-600">Live System Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Account & Security</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/login" className="hover:text-violet-600 font-bold text-violet-700">Sign In to Portal</Link></li>
              <li><Link to="/register" className="hover:text-violet-600 font-bold text-violet-700">Create Account</Link></li>
              <li><Link to="/forgot-password" className="hover:text-violet-600">Reset Password</Link></li>
              <li><Link to="/terms" className="hover:text-violet-600">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-violet-600">Privacy Policy</Link></li>
              <li><a href="https://wa.me/917695956938?text=Hi%20LightningDeals%20Team!%20I%20need%20support%20with%20my%20API%20key." target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 font-semibold text-emerald-700">WhatsApp Help Desk</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <p>© 2026 LightningDeals. All rights reserved.</p>
          <div className="flex items-center gap-4 text-muted">
            <span>TLS 1.3 Encrypted</span>
            <span>·</span>
            <span>Zero Prompt Retention</span>
            <span>·</span>
            <span>AES-256-GCM Vault</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
