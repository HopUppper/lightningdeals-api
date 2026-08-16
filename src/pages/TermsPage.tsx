import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FileText, Shield, AlertTriangle, CheckCircle2, Lock, Scale, HelpCircle, Server, CreditCard, RefreshCw } from 'lucide-react';

export const TermsPage: React.FC = () => {
  const lastUpdatedDate = "August 16, 2026";

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-10 bg-card border border-border p-8 sm:p-12 rounded-panel shadow-sm">
          
          {/* Header */}
          <div className="border-b border-border pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200 inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> TERMS & CONDITIONS
              </span>
              <span className="text-xs font-mono text-muted">Effective Date: {lastUpdatedDate}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">Terms & Conditions of Service</h1>
            <p className="text-xs text-muted leading-relaxed font-mono">
              Operational & Legal Usage Agreement for Lightning Deals Digital Products, AI Subscriptions, and API Access.
            </p>
          </div>

          {/* Legal Sections */}
          <div className="space-y-8 text-sm text-muted leading-relaxed font-sans">
            
            {/* 1. Introduction & Definitions */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Scale className="w-4 h-4 text-violet-600" />
                <span>1. Introduction & Definitions</span>
              </h2>
              <p>
                Welcome to <strong>Lightning Deals</strong> ("we", "us", "our", "Lightning Deals API Gateway"). Lightning Deals operates an online digital commerce platform through which customers can purchase digital products, software-related services, digital subscriptions, and AI model API access.
              </p>
              <p>For the purposes of these Terms & Conditions ("Terms"):</p>
              <ul className="list-disc pl-5 space-y-1 text-xs font-mono">
                <li><strong>"Customer", "User", "You", "Your"</strong> refers to any individual, developer, company, or legal entity creating an account, making a purchase, or utilizing our services.</li>
                <li><strong>"Products", "Services"</strong> refers to all digital subscriptions, API token allocations, key credentials, digital passes, and software access provided via <a href="https://lightningapi.pro" className="text-violet-600 underline font-bold">lightningapi.pro</a>.</li>
                <li><strong>"API Key"</strong> refers to the digital authentication token credentials issued to grant programmatic HTTP access to AI models.</li>
              </ul>
            </section>

            {/* 2. Eligibility */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-600" />
                <span>2. Eligibility & Usage Requirements</span>
              </h2>
              <p>
                By accessing our website or purchasing any product, you represent and warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>You are at least 18 years of age or possess legal parental/guardian consent to enter into binding legal agreements.</li>
                <li>All registration information provided to Lightning Deals is accurate, current, and complete.</li>
                <li>You are responsible for maintaining the confidentiality and security of your account credentials and assigned API keys.</li>
              </ul>
            </section>

            {/* 3. Account Registration & Security */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-600" />
                <span>3. Account Registration & Fraud Prevention</span>
              </h2>
              <p>
                To access digital products or API keys, users must register an account with a verified email address. You agree that:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                <li>You are strictly responsible for all activity conducted under your account credentials.</li>
                <li>You must not attempt to access another customer's account or private API credentials without explicit authorization.</li>
                <li>Accounts must not be created using disposable email services or automated bots to conduct fraudulent activity.</li>
                <li>We reserve the right to suspend accounts suspected of multi-account registration for trial exploitation.</li>
              </ul>
            </section>

            {/* 4. Digital Products & AI Access */}
            <section className="space-y-4">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-600" />
                <span>4. Digital Products & AI Quota Architecture</span>
              </h2>
              <p>
                Lightning Deals provides digital subscriptions and API access delivered electronically via API key credentials (`ld_live_...` or `ld_trial_...`). Usage is governed by 5-hour rolling token windows, rate limits, and fixed validity periods.
              </p>

              <div className="p-4 bg-bg border border-border rounded-panel space-y-3 font-mono text-xs">
                <p className="font-bold text-fg">Claude Max Product Plans & Quota Specifications:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-border rounded">
                    <p className="font-bold text-violet-700">FREE 1-DAY TRIAL</p>
                    <p className="text-muted">Quota: 1M Tokens / 5 Hours</p>
                    <p className="text-muted">Validity: 1 Day (24 Hours)</p>
                    <p className="text-[10px] text-emerald-600 font-bold">1 per verified customer account</p>
                  </div>
                  <div className="p-3 bg-white border border-border rounded">
                    <p className="font-bold text-violet-700">PRO PLAN (₹2,499)</p>
                    <p className="text-muted">Quota: 5M Tokens / 5 Hours</p>
                    <p className="text-muted">Validity: 30 Days</p>
                    <p className="text-[10px] text-violet-600 font-bold">Automatic 5h Quota Refresh</p>
                  </div>
                  <div className="p-3 bg-white border border-border rounded">
                    <p className="font-bold text-violet-700">MAX PLAN (₹5,499)</p>
                    <p className="text-muted">Quota: 20M Tokens / 5 Hours</p>
                    <p className="text-muted">Validity: 30 Days</p>
                    <p className="text-[10px] text-violet-600 font-bold">Automatic 5h Quota Refresh</p>
                  </div>
                  <div className="p-3 bg-white border border-border rounded">
                    <p className="font-bold text-violet-700">ULTRA PLAN (₹9,999)</p>
                    <p className="text-muted">Quota: 40M Tokens / 5 Hours</p>
                    <p className="text-muted">Validity: 30 Days</p>
                    <p className="text-[10px] text-violet-600 font-bold">Automatic 5h Quota Refresh</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted">
                <strong>Important Notice:</strong> Our plans provide structured 5-hour rolling token capacity. We do NOT describe or market any plan as "unlimited" or "lifetime". Token allocations refresh continuously on a rolling 5-hour window schedule during the active validity period.
              </p>
            </section>

            {/* 5. Third-Party Services Disclaimer */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-600" />
                <span>5. Third-Party Services & Independence Disclaimer</span>
              </h2>
              <p>
                Lightning Deals operates an independent API gateway infrastructure. Certain digital products or model proxies rely on third-party model providers, cloud infrastructure, or upstream APIs. Lightning Deals does not directly control third-party upstream outages, scheduled maintenance, provider API protocol updates, or model availability changes.
              </p>
              <p className="text-xs text-muted">
                <strong>Trademark Disclaimer:</strong> Lightning Deals is an independent platform and is <strong>NOT affiliated, endorsed by, or sponsored by Anthropic PBC or OpenAI Inc.</strong> All product names, trademarks, and registered trademarks belong to their respective owners.
              </p>
            </section>

            {/* 6. Payments & Billing */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span>6. Payments, Checkout & Currency</span>
              </h2>
              <p>
                All product prices are displayed in Indian Rupees (INR ₹) on the website checkout page. Payments are securely processed through encrypted third-party payment processors (including <strong>Cashfree Payments</strong>). Lightning Deals does NOT store complete credit card numbers, CVV codes, or banking passwords on our servers. The price presented at final checkout is the binding purchase price.
              </p>
            </section>

            {/* 7. Subscriptions & Fixed Validity */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-violet-600" />
                <span>7. Subscriptions & Fixed Validity (No Auto-Renewal)</span>
              </h2>
              <p>
                All paid plans (PRO, MAX, ULTRA) come with a fixed 30-day validity period calculated from the moment of payment activation. Unless explicitly stated otherwise, <strong>subscriptions do NOT automatically renew</strong> or charge recurring fees to your payment method. Upon expiration after 30 days, customers may manually purchase a new plan to continue access.
              </p>
            </section>

            {/* 8. Prohibited Conduct */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>8. Prohibited Conduct & Infrastructure Abuse</span>
              </h2>
              <p>Customers strictly agree NOT to engage in:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                <li>Reselling or publicly sharing private API key credentials without express written authorization.</li>
                <li>Attempting to manipulate, bypass, or flood token accounting engines or rolling rate limits.</li>
                <li>Using API access for denial-of-service attacks, automated spamming, or unlawful activities.</li>
                <li>Reverse engineering protected gateway infrastructure or attempting unauthorized database access.</li>
                <li>Exploiting payment system bugs or conducting fraudulent chargebacks after full quota delivery.</li>
              </ul>
            </section>

            {/* 9. Suspension & Termination */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>9. Account Suspension & Termination</span>
              </h2>
              <p>
                Lightning Deals reserves the right to suspend or terminate service access immediately in cases of payment fraud, infrastructure abuse, unauthorized key resale, or serious violations of these Terms. In cases of service termination due to gross misconduct or illegal activity, access credentials will be permanently revoked.
              </p>
            </section>

            {/* 10. Service Availability */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-600" />
                <span>10. Service Availability & Maintenance</span>
              </h2>
              <p>
                While Lightning Deals strives for continuous 99.9% gateway availability, uninterrupted service cannot be guaranteed 100% of the time. Unscheduled downtime may occur due to cloud server maintenance, network provider issues, or upstream AI supplier disruptions.
              </p>
            </section>

            {/* 11. Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Scale className="w-4 h-4 text-violet-600" />
                <span>11. Limitation of Liability</span>
              </h2>
              <p>
                To the maximum extent permitted under applicable law, Lightning Deals shall not be liable for indirect, incidental, special, or consequential damages resulting from lost profits, service interruptions, or data loss. In all circumstances, Lightning Deals' aggregate liability under any claim shall be strictly limited to the amount paid by you for the active subscription in the 30 days prior to the claim.
              </p>
            </section>

            {/* 12. Intellectual Property */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-600" />
                <span>12. Intellectual Property Rights</span>
              </h2>
              <p>
                All proprietary branding, website designs, original logos, code, documentation, and user interfaces of Lightning Deals remain the exclusive intellectual property of Lightning Deals. Third-party trademarks, logos, and model names belong exclusively to their respective corporate owners.
              </p>
            </section>

            {/* 13. Governing Law & Jurisdiction */}
            <section className="space-y-3 border-t border-border pt-6">
              <h2 className="text-base font-bold text-fg">13. Governing Law & Jurisdiction</h2>
              <p>
                These Terms & Conditions are governed by and construed in accordance with the laws of <strong>India</strong>. Any legal disputes or claims arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>
            </section>

            {/* 14. Contact Information */}
            <section className="space-y-3 border-t border-border pt-6">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <span>14. Support & Official Contact</span>
              </h2>
              <p>
                For legal inquiries, terms clarification, or customer support, please contact our team via your Customer Portal ticket system or email us at:
              </p>
              <div className="p-4 bg-bg border border-border rounded-control font-mono text-xs space-y-1">
                <p className="font-bold text-fg">Official Support Desk: <a href="mailto:support@lightningdeals.in" className="text-violet-600 underline">support@lightningdeals.in</a></p>
                <p className="text-muted">Business Legal Entity: Lightning Deals API Gateway (`[BUSINESS LEGAL NAME]`) / Operating from India</p>
              </div>
            </section>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
