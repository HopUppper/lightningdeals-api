import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#E6E1E8] bg-[#F8F6F2] pt-16 pb-12 text-xs text-[#68636B] font-sans">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Footer Directory Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand & Mission (Col 1 & 2 on mobile) */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7136E8] text-white shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current text-white" />
              </div>
              <div className="flex items-baseline">
                <span className="text-base font-bold text-[#191719] tracking-tight font-display">
                  LightningAPI
                </span>
                <span className="font-semibold text-xs text-[#68636B] ml-0.5">
                  .pro
                </span>
              </div>
            </Link>

            <p className="text-[#68636B] leading-relaxed max-w-sm text-xs">
              The Intelligence Layer. A unified API gateway providing access to supported frontier
              AI models through a consolidated, drop-in Anthropic compatible connection with continuous
              5-hour rolling pool renewal.
            </p>

            {/* Operational Telemetry Badge */}
            <div className="pt-1">
              <Link
                to="/status"
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-[#E6E1E8] text-xs font-medium text-[#087F5B] hover:bg-emerald-50/50 transition-colors shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse" />
                <span>All Systems Operational</span>
              </Link>
            </div>
          </div>

          {/* Col 3: Gateway Resources */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#191719] uppercase">
              Gateway
            </span>
            <ul className="space-y-2">
              <li>
                <Link to="/models" className="hover:text-[#191719] transition-colors">
                  Supported Models
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#191719] transition-colors">
                  Capacity Plans
                </Link>
              </li>
              <li>
                <Link to="/trial" className="hover:text-[#191719] transition-colors">
                  Free 200k Trial
                </Link>
              </li>
              <li>
                <Link to="/check-key" className="hover:text-[#191719] transition-colors">
                  Verify Key Balance
                </Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-[#191719] transition-colors">
                  Gateway Telemetry
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Developers */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#191719] uppercase">
              Developers
            </span>
            <ul className="space-y-2">
              <li>
                <Link to="/docs" className="hover:text-[#191719] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/docs#integration" className="hover:text-[#191719] transition-colors">
                  Claude Code Guide
                </Link>
              </li>
              <li>
                <Link to="/docs#cursor" className="hover:text-[#191719] transition-colors">
                  Cursor & Windsurf Setup
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#191719] transition-colors">
                  5-Hour Rolling Engine
                </Link>
              </li>
              <li>
                <Link to="/builder" className="hover:text-[#191719] transition-colors">
                  Website Builder
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Company & Legal */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#191719] uppercase">
              Legal & Support
            </span>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="hover:text-[#191719] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#191719] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-[#191719] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#191719] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@lightningapi.pro"
                  className="hover:text-[#191719] transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Privacy SLA */}
        <div className="border-t border-[#E6E1E8] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#68636B]">
          <p>© {new Date().getFullYear()} LightningAPI.pro. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" />
              <span>Zero Prompt Logging SLA</span>
            </span>
            <span>·</span>
            <span>Encrypted In-Stream Routing (TLS 1.3)</span>
            <span>·</span>
            <span>Drop-In Anthropic Messages Compatible</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
