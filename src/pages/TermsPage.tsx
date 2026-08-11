import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FileText, Shield } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-8 bg-white border border-border p-8 sm:p-12 rounded-panel shadow-xs">
          
          <div className="border-b border-border pb-6 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Legal Agreement
            </span>
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">Terms of Service</h1>
            <p className="text-xs text-muted font-mono">Effective Date: January 1, 2026 · Last Updated: August 2026</p>
          </div>

          <div className="prose prose-sm max-w-none text-muted space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">1. Service Description</h2>
              <p>
                LightningDeals provides a high-performance API gateway ("Service") enabling drop-in Anthropic API protocol compatibility for developer tools, including Claude Code CLI, Cursor, Windsurf, and custom software applications.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">2. API Key Allocation & Rolling Token Windows</h2>
              <p>
                API keys issued by LightningDeals operate on a prepaid token allowance model with a 5-hour rolling usage window. Token allowances automatically reset on cycle according to your purchased package tier.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">3. Acceptable Use Policy</h2>
              <p>
                You agree not to use the Service for any unlawful activities, unauthorized automated scraping, denial of service attacks, or attempts to bypass system rate limits. Accounts violating safety guidelines or abuse policies may be suspended immediately.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">4. Service Level Agreement (SLA) & Availability</h2>
              <p>
                We strive for 99.9% gateway uptime. Real-time status updates and scheduled maintenance windows are publicly reported on our <a href="/status" className="text-amber-600 underline">Status Page</a>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">5. Limitation of Liability</h2>
              <p>
                LightningDeals is provided "as is" without warranty of any kind. Under no circumstances shall LightningDeals be liable for indirect, incidental, or consequential damages resulting from service interruptions or upstream model provider latency.
              </p>
            </section>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
