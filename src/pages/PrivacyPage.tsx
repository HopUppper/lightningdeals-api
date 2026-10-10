import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  Server,
  UserCheck,
  HardDrive,
  BarChart3,
  Cookie,
  HelpCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';

export const PrivacyPage: React.FC = () => {
  const lastUpdatedDate = 'October 10, 2026';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col font-sans selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10 bg-white border border-[#e7e5e4] p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-3xl shadow-warm">
          
          {/* Header */}
          <div className="border-b border-[#e7e5e4] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                PRIVACY &amp; DATA GOVERNANCE
              </span>
              <span className="text-xs font-mono text-[#78716c]">Effective Date: {lastUpdatedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c1917] tracking-tight">
              Privacy Policy &amp; Data Disclosure
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
              Transparent, Comprehensive Architecture Disclosure on What LightningAPI.pro Processes, Stores, and Protects.
            </p>
          </div>

          {/* Quick Summary Pill Box */}
          <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#065f46] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <EyeOff className="w-4 h-4 text-emerald-700" />
              <span>Core Privacy Guarantee: Zero Prompt Retention</span>
            </div>
            <p className="leading-relaxed">
              Your source code, prompts, thinking tokens, and completions stream transiently in volatile RAM over TLS 1.3. We do NOT store prompt text on disk, log conversational payloads to databases, or train artificial intelligence models on your data.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-xs sm:text-sm text-[#57534e] leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#6d28d9]" />
                <span>1. Introduction &amp; Privacy Commitment</span>
              </h2>
              <p>
                LightningAPI.pro ("we", "our", or "us") provides a high-performance developer gateway for AI model inference. This Privacy Policy outlines our data handling practices with complete technical transparency. As developers ourselves, we prioritize privacy-by-design: we collect only what is strictly necessary to authenticate API requests, calculate rolling quota headroom, and prevent infrastructure abuse.
              </p>
            </section>

            {/* 2. What We Explicitly Do NOT Collect */}
            <section className="space-y-3 bg-[#faf8f5] p-5 rounded-2xl border border-[#e7e5e4]">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>2. What We Explicitly Do NOT Store or Collect</span>
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#57534e]">
                <li><strong className="text-[#1c1917]">Prompt Payloads:</strong> System instructions, user prompts, and conversation histories are never written to disk or logged in databases.</li>
                <li><strong className="text-[#1c1917]">Source Code &amp; Project Files:</strong> Code transmitted through IDE tools (Claude Code, Cursor, Windsurf) is never indexed or retained.</li>
                <li><strong className="text-[#1c1917]">Model Output Completions:</strong> Generated code, text completions, and thinking tokens stream directly to your client and vanish from gateway memory.</li>
                <li><strong className="text-[#1c1917]">Model Training:</strong> Neither LightningAPI.pro nor our gateway infrastructure uses customer data to train or fine-tune AI models.</li>
              </ul>
            </section>

            {/* 3. Transient RAM Streaming */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#6d28d9]" />
                <span>3. Transient Volatile RAM Streaming Architecture</span>
              </h2>
              <p>
                When an inference request arrives at <code className="font-mono text-[#1c1917]">/v1/messages</code>, the gateway parses only the necessary routing metadata (model name, stream boolean, and token counts). The HTTP payload streams over an encrypted TLS 1.3 socket directly to the upstream model provider. Responses are relayed chunk-by-chunk via Server-Sent Events (SSE) back to your development environment. The byte buffers reside solely in volatile process memory and are discarded upon request completion.
              </p>
            </section>

            {/* 4. Information We Do Collect */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6d28d9]" />
                <span>4. Information We Do Collect &amp; Store</span>
              </h2>
              <p>To operate customer accounts and enforce capacity allowances, we maintain:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#57534e]">
                <li><strong className="text-[#1c1917]">Account Identification:</strong> Registered email address, full name (optional), and securely hashed passwords (scrypt/bcrypt).</li>
                <li><strong className="text-[#1c1917]">API Key Signatures:</strong> Cryptographic SHA-256 hashes of generated API keys (raw keys are never stored in plaintext).</li>
                <li><strong className="text-[#1c1917]">Timestamped Token Counters:</strong> Aggregate integer metrics (input tokens, output tokens, request timestamp) necessary to calculate your active 5-hour rolling window sum.</li>
                <li><strong className="text-[#1c1917]">Order Metadata:</strong> Order reference IDs, plan name purchased, payment status, and duration timestamps.</li>
              </ul>
            </section>

            {/* 5. Upstream Data Handoff */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#6d28d9]" />
                <span>5. Upstream Provider Data Handoff</span>
              </h2>
              <p>
                As an API gateway, LightningAPI.pro routes inference payloads to upstream model providers. Upstream model processing is conducted under enterprise commercial API contracts that explicitly prohibit using API customer inputs for foundation model training. We recommend reviewing the upstream provider's commercial terms for complete details regarding their edge routing.
              </p>
            </section>

            {/* 6. Payment Processing & Financial Isolation */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#6d28d9]" />
                <span>6. Payment Processing &amp; Financial Isolation</span>
              </h2>
              <p>
                All billing transactions on LightningAPI.pro are processed through certified, PCI-DSS compliant banking gateways and UPI aggregators. <strong>LightningAPI.pro NEVER handles, collects, or stores raw payment card numbers, CVVs, expiration dates, or bank credentials.</strong> We receive only confirmation of successful settlement, masked transaction identifiers, and receipt numbers.
              </p>
            </section>

            {/* 7. Security Logs & Anti-Abuse */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#6d28d9]" />
                <span>7. Security Logs, Rate Limiting &amp; Anti-Abuse</span>
              </h2>
              <p>
                To protect against distributed denial-of-service (DDoS) attacks, brute-force key attacks, and token accounting circumvention, our reverse proxy logs incoming client IP addresses, User-Agent strings, and HTTP response codes. These operational server logs are kept for a maximum of 14 days and are then automatically purged.
              </p>
            </section>

            {/* 8. Cookies & Local Storage */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <Cookie className="w-4 h-4 text-[#6d28d9]" />
                <span>8. Cookies &amp; Local Storage</span>
              </h2>
              <p>
                We use strictly necessary cookies and local storage tokens (<code className="font-mono text-[#1c1917]">ld_token</code>, <code className="font-mono text-[#1c1917]">ld_ref</code>) to maintain authenticated sessions and attribute referral signups. We do not use third-party behavioral advertising cookies or cross-site tracking scripts.
              </p>
            </section>

            {/* 9. Analytics Disclosure */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#6d28d9]" />
                <span>9. Google Analytics Disclosure</span>
              </h2>
              <p>
                Our marketing pages use Google Analytics (<code className="font-mono text-[#1c1917]">G-GBRR7YHWVM</code>) with IP anonymization enabled to monitor aggregate website visitor volumes, page navigation patterns, and device categories. No API keys, prompts, or personal identifying tokens are transmitted to Google Analytics.
              </p>
            </section>

            {/* 10. Data Retention & Deletion */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#6d28d9]" />
                <span>10. Data Retention &amp; Deletion Lifecycle</span>
              </h2>
              <p>
                Account profiles and payment transaction records are retained for the duration of your active account to fulfill digital product commitments and satisfy statutory financial auditing obligations under Indian law. Upon account deletion request, user profiles and API keys are permanently deleted from active production databases within 7 days.
              </p>
            </section>

            {/* 11. Customer Data Rights */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#6d28d9]" />
                <span>11. Customer Rights &amp; Data Subject Inquiries</span>
              </h2>
              <p>
                Under applicable data protection laws, customers have the right to request access to personal data held by us, request correction of inaccurate profile data, or demand complete account deletion. Data requests can be submitted via the Customer Support Portal or by emailing our privacy team.
              </p>
            </section>

            {/* 12. Privacy Desk Contact */}
            <section className="space-y-3 border-t border-[#e7e5e4] pt-6">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#6d28d9]" />
                <span>12. Contact Privacy Desk</span>
              </h2>
              <p>
                For questions regarding this policy or to request account data deletion, please contact our Data Governance desk:
              </p>
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] text-xs font-mono space-y-1 text-[#57534e]">
                <p><strong>Privacy Inquiries:</strong> <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline">support@lightningapi.pro</a></p>
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

export default PrivacyPage;
