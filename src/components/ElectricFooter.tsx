import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export const ElectricFooter: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<'OPERATIONAL' | 'DEGRADED'>('OPERATIONAL');

  useEffect(() => {
    fetch('/api/system/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status) {
          setSystemStatus(data.status === 'operational' ? 'OPERATIONAL' : 'DEGRADED');
        }
      })
      .catch(() => setSystemStatus('OPERATIONAL'));
  }, []);

  return (
    <footer className="border-t border-[#e7e5e4] bg-[#f5f2eb] pt-16 pb-12 text-xs text-[#78716c] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand & Mission Column (2 cols) */}
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
              Claude-compatible AI API gateway. Drop-in Anthropic compatibility with continuous 5-hour rolling token renewal windows for Claude Code CLI, Cursor, Windsurf, and custom software.
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

          {/* Column 2: Gateway */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-wider text-[#1c1917] uppercase">GATEWAY</span>
            <ul className="space-y-2">
              <li>
                <Link to="/models" className="hover:text-[#1c1917] transition-colors">
                  Supported Models
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#1c1917] transition-colors">
                  Capacity Plans
                </a>
              </li>
              <li>
                <Link to="/trial" className="hover:text-[#1c1917] transition-colors">
                  Free 1M Trial
                </Link>
              </li>
              <li>
                <Link to="/check-key" className="hover:text-[#1c1917] transition-colors">
                  Verify Key Balance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Developers */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-wider text-[#1c1917] uppercase">DEVELOPERS</span>
            <ul className="space-y-2">
              <li>
                <Link to="/docs" className="hover:text-[#1c1917] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <a href="#integration" className="hover:text-[#1c1917] transition-colors">
                  Claude Code Guide
                </a>
              </li>
              <li>
                <a href="#integration" className="hover:text-[#1c1917] transition-colors">
                  Cursor Integration
                </a>
              </li>
              <li>
                <a href="#integration" className="hover:text-[#1c1917] transition-colors">
                  Python & Node SDKs
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Governance */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-wider text-[#1c1917] uppercase">LEGAL</span>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="hover:text-[#1c1917] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#1c1917] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-[#1c1917] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <a href="/#faq" className="hover:text-[#1c1917] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#e7e5e4] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#78716c]">
          <p>© {new Date().getFullYear()} LightningAPI.pro. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Encrypted In-Stream Routing (TLS 1.3)</span>
            <span>·</span>
            <span>Zero Prompt Logging SLA</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
