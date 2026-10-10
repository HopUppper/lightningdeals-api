import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

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
    <footer className="border-t border-[#e7e5e4] bg-[#f5f2eb] pt-16 pb-12 text-xs text-[#78716c] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand & Mission Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6d28d9] text-white shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current text-white" />
              </div>
              <span className="text-base font-bold text-[#1c1917] tracking-tight">
                LightningAPI<span className="font-semibold text-xs text-[#78716c] ml-0.5">.pro</span>
              </span>
            </Link>
            
            <p className="text-[#57534e] leading-relaxed max-w-sm text-xs">
              Claude-compatible AI API gateway. Drop-in Anthropic compatibility with 5-hour rolling token renewal windows for Claude Code CLI, Cursor, Windsurf, and custom software.
            </p>

            <div className="pt-1">
              <Link
                to="/status"
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-[#e7e5e4] text-xs font-medium text-[#047857] hover:bg-[#ecfdf5] transition-colors shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span>
                  {systemStatus === 'DEGRADED' ? 'Partial Outage' : 'All Systems Operational'}
                </span>
              </Link>
            </div>
          </div>

          {/* Product & Gateway Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1c1917] uppercase tracking-wider">Gateway</h4>
            <ul className="space-y-2 text-xs text-[#57534e]">
              <li><Link to="/models" className="hover:text-[#6d28d9] transition-colors">Supported Models</Link></li>
              <li><Link to="/pricing" className="hover:text-[#6d28d9] transition-colors">Capacity Plans</Link></li>
              <li><Link to="/trial" className="hover:text-[#6d28d9] transition-colors">Free 1M Trial</Link></li>
              <li><Link to="/check-key" className="hover:text-[#6d28d9] transition-colors">Verify API Key</Link></li>
              <li><Link to="/status" className="hover:text-[#6d28d9] transition-colors">System Telemetry</Link></li>
            </ul>
          </div>

          {/* Developers & Docs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1c1917] uppercase tracking-wider">Developers</h4>
            <ul className="space-y-2 text-xs text-[#57534e]">
              <li><Link to="/docs" className="hover:text-[#6d28d9] transition-colors">Documentation</Link></li>
              <li><Link to="/docs#claude-code" className="hover:text-[#6d28d9] transition-colors">Claude Code Guide</Link></li>
              <li><Link to="/docs#cursor" className="hover:text-[#6d28d9] transition-colors">Cursor Integration</Link></li>
              <li><Link to="/dashboard/referrals" className="hover:text-[#6d28d9] transition-colors">Referral Program</Link></li>
              <li><Link to="/rewards" className="hover:text-[#6d28d9] transition-colors">Credits Wallet</Link></li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1c1917] uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs text-[#57534e]">
              <li><Link to="/terms" className="hover:text-[#6d28d9] transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-[#6d28d9] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-[#6d28d9] transition-colors">Refund Policy</Link></li>
              <li><Link to="/request-quote" className="hover:text-[#6d28d9] transition-colors">Enterprise Inquiries</Link></li>
              <li><Link to="/admin/login" className="hover:text-[#6d28d9] transition-colors">Admin Console</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Compliance Notice */}
        <div className="border-t border-[#e7e5e4] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#78716c]">
          <div>
            &copy; {new Date().getFullYear()} LightningAPI.pro. All rights reserved.
          </div>
          <p className="text-[11px] text-[#a8a29e] max-w-xl text-center md:text-right">
            LightningAPI is an independent proxy gateway providing API protocol routing. Anthropic, Claude, and Claude Code are trademarks of their respective owners.
          </p>
        </div>

      </div>
    </footer>
  );
};
