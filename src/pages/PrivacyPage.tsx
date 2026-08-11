import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, Lock } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-8 bg-white border border-border p-8 sm:p-12 rounded-panel shadow-xs">
          
          <div className="border-b border-border pb-6 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Privacy & Data Governance
            </span>
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-muted font-mono">Effective Date: January 1, 2026 · Last Updated: August 2026</p>
          </div>

          <div className="prose prose-sm max-w-none text-muted space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">1. Zero Prompt Logging Policy</h2>
              <p>
                LightningDeals operates a strict Zero Prompt Storage policy. We do NOT store, log, inspect, or retain the content of your API prompts or completion payloads. Requests are proxied in memory directly to authoritative model providers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">2. Information We Collect</h2>
              <p>
                We collect minimal metadata strictly necessary for operating the gateway: account email, API key identifiers, token consumption counts (input/output), request timestamps, latency, and HTTP status codes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">3. Payment & Credentials Security</h2>
              <p>
                Payments are processed through encrypted payment gateways (e.g. Razorpay). API keys are hashed at rest using secure SHA-256 cryptographic hashes. Master supplier credentials are stored encrypted with AES-256-GCM.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-fg">4. Contact & Data Deletion</h2>
              <p>
                You may request complete account deletion or data export at any time by contacting our support team via WhatsApp or email.
              </p>
            </section>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
