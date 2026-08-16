import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, Lock, Database, EyeOff, Server, UserCheck, HardDrive, BarChart3, Cookie, HelpCircle } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const lastUpdatedDate = "August 16, 2026";

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-10 bg-card border border-border p-8 sm:p-12 rounded-panel shadow-sm">
          
          {/* Header */}
          <div className="border-b border-border pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> PRIVACY & DATA GOVERNANCE
              </span>
              <span className="text-xs font-mono text-muted">Effective Date: {lastUpdatedDate}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-muted leading-relaxed font-mono">
              Official Privacy Disclosure for Lightning Deals (<a href="https://lightningapi.pro" className="text-violet-600 underline font-bold">lightningapi.pro</a>).
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-sm text-muted leading-relaxed font-sans">
            
            {/* Zero Prompt Retention Banner */}
            <section className="space-y-3 bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-panel">
              <h2 className="text-base font-bold text-emerald-600 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-emerald-600" />
                <span>1. Zero Prompt Payload Retention Policy</span>
              </h2>
              <p className="text-fg font-medium text-xs leading-relaxed">
                Lightning Deals operates under a strict <strong>Zero Prompt Retention Policy</strong>. We do NOT log, record, inspect, store, or train machine learning models on your API prompt contents, system messages, code files, or model response text.
              </p>
              <p className="text-xs text-muted">
                All prompt text passes through transient server memory in-stream and is immediately forwarded over encrypted TLS 1.3 connections to authoritative providers. Prompt data is never stored on disk or written to databases.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-600" />
                <span>2. Information We Collect</span>
              </h2>
              <p>
                To manage customer accounts, deliver digital subscriptions, and enforce quota security, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                <li><strong>Account Credentials:</strong> Full name, account email address, phone number (where provided), and scrypt-hashed passwords.</li>
                <li><strong>Telemetry & Usage Data:</strong> Token consumption totals (input, output, and aggregate tokens), request latency (ms), model identifiers, and API status codes.</li>
                <li><strong>Order & Payment Identifiers:</strong> Internal Order IDs, Cashfree transaction references, payment status, purchase amounts, and subscription validity timestamps.</li>
                <li><strong>Security & Technical Identifiers:</strong> IP addresses and browser User-Agent strings recorded strictly for rate limiting, audit logging, and anti-abuse protection.</li>
                <li><strong>Google Analytics Data:</strong> Aggregated interaction events and traffic analytics (via property ID `G-GBRR7YHWVM`).</li>
              </ul>
            </section>

            {/* Information We Do NOT Collect */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-600" />
                <span>3. Sensitive Data We Do NOT Store</span>
              </h2>
              <p>
                Lightning Deals does NOT collect or store sensitive financial credentials. Specifically:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>We do NOT store full credit card or debit card numbers.</li>
                <li>We do NOT store CVV codes or card expiration dates.</li>
                <li>We do NOT store net banking passwords or UPI PINs.</li>
                <li>All payment processing is handled externally by encrypted payment gateways (e.g., <strong>Cashfree Payments</strong>).</li>
              </ul>
            </section>

            {/* How Data Is Used */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-600" />
                <span>4. How We Use Your Information</span>
              </h2>
              <p>Collected information is used exclusively for:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs font-mono">
                <li>Provisioning API key credentials and calculating 5-hour rolling token quotas.</li>
                <li>Authenticating customer logins and processing paid subscription activations.</li>
                <li>Providing customer support and ticket assistance.</li>
                <li>Detecting payment fraud, automated bot abuse, or rate-limit manipulation.</li>
                <li>Analyzing aggregate website performance and optimizing gateway responsiveness.</li>
              </ul>
            </section>

            {/* Google Analytics */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-600" />
                <span>5. Google Analytics Disclosure</span>
              </h2>
              <p>
                Our website utilizes <strong>Google Analytics</strong> (`G-GBRR7YHWVM`) to analyze general visitor traffic, browser types, interaction events, and page views. Google Analytics processes anonymized data to help us understand website performance. You can learn more about how Google uses data by visiting <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline font-bold">Google's Privacy & Terms</a>.
              </p>
            </section>

            {/* Cookies & Storage */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Cookie className="w-4 h-4 text-violet-600" />
                <span>6. Cookies & Local Storage</span>
              </h2>
              <p>
                We use essential HTTP-only cookies and browser session storage (`sessionStorage`) to maintain secure login sessions (`ld_token`, `ld_admin_token`) and manage checkout states. Users can manage or block cookies through browser settings, though blocking essential cookies may affect portal login functionality.
              </p>
            </section>

            {/* Data Sharing */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-violet-600" />
                <span>7. Data Sharing & Infrastructure Service Providers</span>
              </h2>
              <p>
                We do <strong>NOT sell or rent personal information</strong> to third parties or data brokers. Information is shared only with trusted infrastructure providers required to operate our service:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>Payment Processors:</strong> Cashfree Payments (for processing checkout orders).</li>
                <li><strong>Cloud Hosting & Database:</strong> Encrypted Supabase PostgreSQL database infrastructure and Render cloud hosting.</li>
                <li><strong>Transactional Email:</strong> Resend API (for verification and password resets).</li>
                <li><strong>Analytics Providers:</strong> Google Analytics.</li>
              </ul>
            </section>

            {/* Data Security & Retention */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-600" />
                <span>8. Data Security & Retention</span>
              </h2>
              <p>
                We implement industry-standard security measures including TLS 1.3 encryption for data in transit, AES-256-GCM AEAD encryption for master secrets, and timing-safe password verification. Data is retained for as long as necessary to maintain active accounts, fulfill subscription commitments, maintain financial transaction records, and comply with legal requirements under Indian law.
              </p>
            </section>

            {/* Customer Rights */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-600" />
                <span>9. Customer Rights & Data Requests</span>
              </h2>
              <p>
                Under applicable Indian data protection laws, customers have the right to request access to their personal information, correction of inaccurate records, or account deletion. Account deletion requests can be submitted via the Customer Support Portal or by emailing our privacy team.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg">10. Children's Privacy</h2>
              <p>
                Our services are directed to developers and businesses. Lightning Deals does not knowingly collect or solicit personal information from individuals under 18 years of age.
              </p>
            </section>

            {/* Privacy Contact */}
            <section className="space-y-3 border-t border-border pt-6">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <span>11. Contact Privacy Desk</span>
              </h2>
              <p>
                If you have questions regarding this Privacy Policy or wish to exercise data rights, contact us at:
              </p>
              <div className="p-4 bg-bg border border-border rounded-control font-mono text-xs space-y-1">
                <p className="font-bold text-fg">Privacy Support Email: <a href="mailto:support@lightningdeals.in" className="text-violet-600 underline">support@lightningdeals.in</a></p>
                <p className="text-muted">Lightning Deals API Gateway (`[BUSINESS LEGAL NAME]`) / Operating from India</p>
              </div>
            </section>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
