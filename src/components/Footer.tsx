import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card/60 pt-12 pb-8 text-xs text-muted">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-bold text-fg">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-black font-extrabold">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span>LightningDeals</span>
            </Link>
            <p className="text-muted leading-relaxed max-w-sm text-xs">
              Dedicated Claude AI API Gateway for developers. Access the full Claude lineup via Anthropic-compatible endpoints with 5-hour rolling token windows.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Product</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/#api" className="hover:text-accent">API Gateway</Link></li>
              <li><Link to="/#models" className="hover:text-accent">Models Catalog</Link></li>
              <li><Link to="/pricing" className="hover:text-accent">Flexible Packages</Link></li>
              <li><Link to="/check-key" className="hover:text-accent">Check API Key</Link></li>
              <li><Link to="/trial" className="hover:text-accent">Get Free Trial</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Developers</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/docs" className="hover:text-accent">Documentation</Link></li>
              <li><Link to="/docs#quick-install" className="hover:text-accent">Quick Install</Link></li>
              <li><Link to="/docs#ide-claude-code" className="hover:text-accent">Claude Code Setup</Link></li>
              <li><Link to="/docs#ide-cursor" className="hover:text-accent">Cursor Integration</Link></li>
              <li><Link to="/status" className="hover:text-accent">Live System Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg mb-3">Account & Sales</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/login" className="hover:text-accent">Sign In</Link></li>
              <li><Link to="/request-quote" className="hover:text-accent">Request Quote</Link></li>
              <li><a href="#" className="hover:text-accent">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent">Security & Risk</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted">
          <p>© {new Date().getFullYear()} LightningDeals AI Gateway Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Prepaid Token Model</span>
            <span>·</span>
            <span>No Subscription</span>
            <span>·</span>
            <span>Developer Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
