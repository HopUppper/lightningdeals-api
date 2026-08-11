import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const Footer: React.FC = () => {
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

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Gateway Systems Operational</span>
            </div>
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
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Legal & Security</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/terms" className="hover:text-violet-600">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-violet-600">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-violet-600">Refund Policy</Link></li>
              <li><Link to="/request-quote" className="hover:text-violet-600">Enterprise Sales</Link></li>
              <li><a href="https://wa.me/917695956938?text=Hi%20LightningDeals%20Team!%20I%20need%20support%20with%20my%20API%20key." target="_blank" rel="noopener noreferrer" className="hover:text-violet-600">WhatsApp Help Desk</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted font-mono">
          <p>© {new Date().getFullYear()} LightningDeals AI Gateway. All rights reserved.</p>
          <div className="flex items-center gap-4 font-sans">
            <Link to="/terms" className="hover:text-violet-600">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-violet-600">Privacy</Link>
            <span>·</span>
            <Link to="/refund" className="hover:text-violet-600">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
