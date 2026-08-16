import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FileText, Shield, AlertTriangle, CheckCircle2, Lock, Scale, HelpCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-8 bg-card border border-border p-8 sm:p-12 rounded-panel shadow-sm">
          
          {/* Header */}
          <div className="border-b border-border pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/30 inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Terms of Service
              </span>
              <span className="text-xs font-mono text-muted">Version 2.4 · Updated August 2026</span>
            </div>
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">Terms of Service & Usage Agreement</h1>
            <p className="text-xs text-muted leading-relaxed font-mono">
              Please read these Terms of Service carefully before accessing or using the LightningDeals API Gateway (<a href="https://lightningapi.pro" className="text-violet-600 underline font-bold">lightningapi.pro</a>).
            </p>
          </div>

          {/* Legal Sections */}
          <div className="space-y-8 text-sm text-muted leading-relaxed font-sans">
            
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Scale className="w-4 h-4 text-violet-600" />
                <span>1. Acceptance of Terms</span>
              </h2>
              <p>
                By creating an account, generating an API key, or sending HTTP requests to the LightningDeals API Gateway ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all terms and conditions, you may not access or use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-600" />
                <span>2. Service Description & API Compatibility</span>
              </h2>
              <p>
                LightningDeals provides a high-performance API proxy gateway offering drop-in Anthropic API protocol compatibility (<code className="bg-bg px-1.5 py-0.5 rounded text-violet-600 font-mono text-xs">/v1/messages</code>). The Service enables seamless integration with developer tools, including Claude Code CLI, Cursor, Windsurf, VS Code, Roo Code, and custom API implementations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-600" />
                <span>3. Pre-Paid Tokens & 5-Hour Rolling Window Accounting</span>
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Token Allowances:</strong> Access to the Service is granted based on pre-paid token package allocations (e.g., 20M, 50M, 100M tokens) or assigned trial keys.
                </li>
                <li>
                  <strong>5-Hour Rolling Window:</strong> Your token consumption is calculated dynamically over a continuous 5-hour rolling usage window. Once consumed, window allowances automatically replenish continuously as old usage ages past the 5-hour threshold.
                </li>
                <li>
                  <strong>Non-Transferability:</strong> Purchased token packages and API keys are non-transferable and assigned exclusively to the registered user account.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>4. Acceptable Use & Anti-Abuse Policy</span>
              </h2>
              <p>You strictly agree NOT to engage in any of the following prohibited activities:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                <li>Attempting to bypass, manipulate, or attack token accounting or rolling window rate limits.</li>
                <li>Creating multiple automated accounts or device fingerprints to claim unauthorized free trial keys.</li>
                <li>Distributing, reselling, or sharing your production API key publicly or to unauthorized third parties.</li>
                <li>Using the Service for unlawful activities, malware generation, automated scraping, or denial-of-service (DoS) attacks.</li>
                <li>Reverse engineering or attempting to extract master vendor infrastructure credentials.</li>
              </ul>
              <p className="text-xs text-red-500 font-semibold mt-2">
                Violation of the Acceptable Use Policy will result in immediate API key revocation and permanent account suspension without refund.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-600" />
                <span>5. Independence & Third-Party Trademark Disclaimer</span>
              </h2>
              <p>
                LightningDeals is an independent API infrastructure platform operated by LightningDeals API Gateway. LightningDeals is <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with Anthropic PBC, OpenAI Inc., or any of their subsidiaries or affiliates. All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                <span>6. Payments, Billing & Refund Policy</span>
              </h2>
              <p>
                All token package purchases are processed via encrypted payment gateways (e.g. Cashfree Payments). Due to the immediate allocation of server bandwidth and upstream capacity, all sales are final and non-refundable once token usage has commenced, unless a major technical failure on our platform prevents delivery of services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <span>7. Limitation of Liability & SLA</span>
              </h2>
              <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. LightningDeals targets 99.9% uptime, but shall not be held liable for indirect, incidental, or consequential damages resulting from upstream provider outages, network latency, or service disruptions beyond our immediate control. Our total aggregate liability under any claim shall not exceed the amount paid by you for the Service during the 30-day period prior to the event giving rise to liability.
              </p>
            </section>

            <section className="space-y-3 border-t border-border pt-6">
              <h2 className="text-base font-bold text-fg">8. Contact & Legal Inquiries</h2>
              <p>
                If you have questions regarding these Terms of Service or need legal assistance, please contact our team via support ticket or email at <a href="mailto:support@lightningapi.pro" className="text-violet-600 font-bold underline">support@lightningapi.pro</a>.
              </p>
            </section>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
