import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { RefreshCw, CreditCard } from 'lucide-react';

export const RefundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-8 bg-white border border-border p-8 sm:p-12 rounded-panel shadow-xs">
          
          <div className="border-b border-border pb-6 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Customer Confidence
            </span>
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">Refund & Token Policy</h1>
            <p className="text-xs text-muted font-mono">Effective Date: January 1, 2026 · Last Updated: August 2026</p>
          </div>

          <div className="prose prose-sm max-w-none text-muted space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">1. 7-Day Money-Back Guarantee</h2>
              <p>
                If you purchase a prepaid token package and experience technical incompatibilities or service failure within 7 days of purchase, you are eligible for a full refund on unconsumed token allocations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">2. Token Credit Adjustments</h2>
              <p>
                If upstream provider outages cause request failures (5xx HTTP status codes), LightningDeals automatically credits affected token allowances back to your active rolling window.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">3. How to Request a Refund</h2>
              <p>
                To initiate a refund or token credit adjustment, contact our team via WhatsApp or email with your Payment Reference ID and API Key prefix (`ld_live_...`). Refunds are processed to the original payment method within 3–5 business days.
              </p>
            </section>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
