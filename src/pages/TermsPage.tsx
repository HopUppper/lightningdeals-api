import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Scale,
  CheckCircle2,
  Lock,
  Server,
  CreditCard,
  AlertTriangle,
  Shield,
  HelpCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';

export const TermsPage: React.FC = () => {
  const lastUpdatedDate = 'October 10, 2026';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col font-sans selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10 bg-white border border-[#e7e5e4] p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-3xl shadow-warm">
          
          {/* Header */}
          <div className="border-b border-[#e7e5e4] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#6d28d9] bg-[#f5f3ff] px-3 py-1 rounded-full border border-[#ddd6fe] inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#6d28d9]" />
                TERMS OF SERVICE
              </span>
              <span className="text-xs font-mono text-[#78716c]">Effective Date: {lastUpdatedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c1917] tracking-tight">
              Terms &amp; Conditions of Service
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
              Legal Usage Agreement &amp; Operating Standards for LightningAPI.pro Gateway, API Keys, and Digital Compute Packages.
            </p>
          </div>

          {/* Table of Contents Pill Box */}
          <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] text-xs text-[#57534e] space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#78716c] tracking-wider">SECTION INDEX</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-medium text-[11px]">
              <a href="#term-1" className="hover:text-[#6d28d9]">1. Introduction &amp; Gateway Scope</a>
              <a href="#term-2" className="hover:text-[#6d28d9]">2. Account Registration &amp; Eligibility</a>
              <a href="#term-3" className="hover:text-[#6d28d9]">3. API Keys &amp; Bearer Custody</a>
              <a href="#term-4" className="hover:text-[#6d28d9]">4. Capacity Plans &amp; 5-Hour Window</a>
              <a href="#term-5" className="hover:text-[#6d28d9]">5. Payments &amp; Prepaid Terms</a>
              <a href="#term-6" className="hover:text-[#6d28d9]">6. Acceptable Use &amp; Anti-Abuse</a>
              <a href="#term-7" className="hover:text-[#6d28d9]">7. Upstream Providers Disclaimer</a>
              <a href="#term-8" className="hover:text-[#6d28d9]">8. Service Availability &amp; Telemetry</a>
              <a href="#term-9" className="hover:text-[#6d28d9]">9. AI Output &amp; Liability Limits</a>
              <a href="#term-10" className="hover:text-[#6d28d9]">10. Intellectual Property Rights</a>
              <a href="#term-11" className="hover:text-[#6d28d9]">11. Governing Law &amp; Notices</a>
            </div>
          </div>

          {/* Legal Sections */}
          <div className="space-y-8 text-xs sm:text-sm text-[#57534e] leading-relaxed">
            
            {/* 1. Introduction */}
            <section id="term-1" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#6d28d9]" />
                <span>1. Introduction &amp; Gateway Scope</span>
              </h2>
              <p>
                Welcome to <strong>LightningAPI.pro</strong> (operated by LightningDeals AI Infrastructure, "we", "us", or "our"). LightningAPI.pro operates an independent, high-performance API gateway engineered to provide drop-in Anthropic Messages API compatible inference to supported models.
              </p>
              <p>
                By creating an account, claiming a trial pass, purchasing a capacity plan, or generating an API request through <code className="font-mono text-[#1c1917]">https://lightningapi.pro</code>, you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use or access our gateway.
              </p>
            </section>

            {/* 2. Account Registration & Eligibility */}
            <section id="term-2" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6d28d9]" />
                <span>2. Account Registration &amp; Eligibility</span>
              </h2>
              <p>
                To utilize the gateway, customers must be at least 18 years of age or possess valid legal authority to bind an entity. You represent that all registration details provided (including email address) are authentic, accurate, and current. Accounts created using temporary or disposable email domains to circumvent trial limits are subject to immediate suspension.
              </p>
            </section>

            {/* 3. API Keys & Bearer Custody */}
            <section id="term-3" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#6d28d9]" />
                <span>3. API Keys &amp; Bearer Token Custody</span>
              </h2>
              <p>
                Access to the gateway is authorized via cryptographically generated API keys (<code className="font-mono text-[#1c1917]">ld_live_...</code> or <code className="font-mono text-[#1c1917]">ld_trial_...</code>). These keys operate as confidential bearer credentials:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#57534e]">
                <li><strong>Strict Confidentiality:</strong> You are solely responsible for maintaining key custody. Never hardcode keys into publicly readable GitHub repositories, client-side web bundles, or public forums.</li>
                <li><strong>Custodial Liability:</strong> Any request originating with your key credential is treated as authorized by you, and token usage incurred will be deducted from your plan's rolling capacity.</li>
                <li><strong>Revocation:</strong> If you suspect that a key has been compromised, you must revoke or regenerate the credential immediately via the Customer Dashboard.</li>
              </ul>
            </section>

            {/* 4. Capacity Plans & 5-Hour Window */}
            <section id="term-4" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#6d28d9]" />
                <span>4. Capacity Plans &amp; 5-Hour Continuous Rolling Window</span>
              </h2>
              <p>
                LightningAPI.pro offers digital capacity packages calculated using a continuous 5-hour rolling mathematical allowance:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#faf8f5] rounded-xl border border-[#e7e5e4] text-xs font-mono">
                <div className="p-3 bg-white rounded-lg border border-[#e7e5e4]">
                  <p className="font-bold text-[#6d28d9]">Claude Max 5x (₹299)</p>
                  <p className="text-[#78716c]">Capacity: 5M Tokens / 5-hour window</p>
                  <p className="text-[#78716c]">Validity: 30 Days</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e7e5e4]">
                  <p className="font-bold text-[#6d28d9]">Claude Max 20x (₹899)</p>
                  <p className="text-[#78716c]">Capacity: 20M Tokens / 5-hour window</p>
                  <p className="text-[#78716c]">Validity: 30 Days</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e7e5e4]">
                  <p className="font-bold text-[#6d28d9]">Claude Max 40x (₹1,699)</p>
                  <p className="text-[#78716c]">Capacity: 40M Tokens / 5-hour window</p>
                  <p className="text-[#78716c]">Validity: 30 Days</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e7e5e4]">
                  <p className="font-bold text-[#6d28d9]">Claude Max 100x (₹3,999)</p>
                  <p className="text-[#78716c]">Capacity: 100M Tokens / 5-hour window</p>
                  <p className="text-[#78716c]">Validity: 30 Days</p>
                </div>
              </div>
              <p className="text-xs text-[#78716c]">
                <strong>No "Unlimited" Representation:</strong> We do not market or sell "unlimited" or "lifetime" token passes. All packages enforce high-precision mathematical rolling quotas. Tokens roll back into available headroom exactly 5 hours (300 minutes) after generation. Unused capacity does not accumulate beyond the plan's ceiling.
              </p>
            </section>

            {/* 5. Payments & Prepaid Terms */}
            <section id="term-5" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#6d28d9]" />
                <span>5. Payments, Pricing &amp; Prepaid Terms</span>
              </h2>
              <p>
                All prices are denominated in Indian Rupees (INR ₹) inclusive of applicable taxes unless specified otherwise. Purchases represent one-time prepaid digital capacity allocations for the stated duration (30 days). Unless explicitly requested, <strong>we do not perform recurring auto-renewal deductions</strong> without your affirmative authorization. Payments are settled securely via certified third-party payment gateways.
              </p>
            </section>

            {/* 6. Acceptable Use & Anti-Abuse */}
            <section id="term-6" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>6. Acceptable Use &amp; Anti-Abuse Policy</span>
              </h2>
              <p>Customers agree to use the service in compliance with all applicable laws and agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#57534e]">
                <li>Attempt to bypass, manipulate, or tamper with token counters or rate-limiting middleware.</li>
                <li>Resell, redistribute, or publicly broker access to private API keys without prior written authorization.</li>
                <li>Conduct denial-of-service (DoS) attacks, flood requests, or compromise platform infrastructure.</li>
                <li>Generate content prohibited by law, including malware, unauthorized surveillance, or abusive material.</li>
              </ul>
            </section>

            {/* 7. Upstream Providers Disclaimer */}
            <section id="term-7" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#6d28d9]" />
                <span>7. Upstream AI Providers &amp; Independence Disclaimer</span>
              </h2>
              <p>
                LightningAPI.pro operates as an independent technical gateway. Inference requests are processed using upstream AI infrastructure. <strong>LightningAPI.pro is NOT affiliated, endorsed, or sponsored by Anthropic PBC, OpenAI Inc., or their affiliates.</strong> All product names, model identifiers, and trademarks are the property of their respective owners. We do not control upstream scheduled maintenance, protocol modifications, or external provider outages.
              </p>
            </section>

            {/* 8. Availability, Maintenance & Telemetry */}
            <section id="term-8" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#6d28d9]" />
                <span>8. Service Availability &amp; Telemetry</span>
              </h2>
              <p>
                While we engineer our gateway for 99.9% availability and sub-35ms time-to-first-token latency, uninterrupted uptime cannot be guaranteed 100% of the time due to internet routing variances and upstream provider dependencies. Real-time platform telemetry is publicly accessible on our <Link to="/status" className="text-[#6d28d9] underline font-medium">Status Page</Link>.
              </p>
            </section>

            {/* 9. AI Output & Limitation of Liability */}
            <section id="term-9" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#6d28d9]" />
                <span>9. AI Output Disclaimer &amp; Limitation of Liability</span>
              </h2>
              <p>
                AI models generate probabilistic completions. LightningAPI.pro does not warrant the factual accuracy, completeness, or fitness for purpose of any model output. The customer is solely responsible for verifying code, text, or recommendations before deployment in production environments.
              </p>
              <p className="text-xs text-[#78716c]">
                To the maximum extent permitted by applicable law, LightningAPI.pro and its operators shall not be liable for indirect, incidental, or consequential damages resulting from downtime or output errors. In all circumstances, our maximum aggregate liability is limited to the fees actually paid by you in the 30 days preceding the event giving rise to liability.
              </p>
            </section>

            {/* 10. Intellectual Property Rights */}
            <section id="term-10" className="space-y-3 scroll-mt-24">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6d28d9]" />
                <span>10. Intellectual Property Rights</span>
              </h2>
              <p>
                All proprietary gateway software, documentation, website design, and logos are the exclusive property of LightningAPI.pro. You retain all ownership rights in the code, prompts, and application files you transmit through the gateway.
              </p>
            </section>

            {/* 11. Governing Law & Notices */}
            <section id="term-11" className="space-y-3 scroll-mt-24 border-t border-[#e7e5e4] pt-6">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#6d28d9]" />
                <span>11. Governing Law &amp; Legal Notices</span>
              </h2>
              <p>
                These Terms of Service are governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] text-xs font-mono space-y-1 text-[#57534e]">
                <p><strong>Official Legal Inquiries:</strong> <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline">support@lightningapi.pro</a></p>
                <p><strong>Operator:</strong> LightningDeals AI Infrastructure · India</p>
              </div>
            </section>

          </div>

        </div>
      </main>

      <ElectricFooter />
    </div>
  );
};

export default TermsPage;
