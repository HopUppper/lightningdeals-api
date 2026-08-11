import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, Lock, Database, EyeOff, Server, UserCheck, HardDrive } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-8 bg-card border border-border p-8 sm:p-12 rounded-panel shadow-sm">
          
          {/* Header */}
          <div className="border-b border-border pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Privacy & Data Governance
              </span>
              <span className="text-xs font-mono text-muted">Version 2.4 · Updated August 2026</span>
            </div>
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">Privacy Policy & Data Security</h1>
            <p className="text-xs text-muted leading-relaxed font-mono">
              How LightningDeals (<a href="https://lightningapi.pro" className="text-violet-600 underline font-bold">lightningapi.pro</a>) protects your privacy, enforces Zero Prompt Retention, and secures telemetry.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-sm text-muted leading-relaxed font-sans">
            
            <section className="space-y-3 bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-panel">
              <h2 className="text-base font-bold text-emerald-600 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-emerald-600" />
                <span>1. Strict Zero Prompt Storage Policy</span>
              </h2>
              <p className="text-fg font-medium text-xs leading-relaxed">
                LightningDeals operates under a strict <strong>Zero Prompt Retention Policy</strong>. We do NOT store, log, record, inspect, or train AI models on the content of your API prompts, system messages, code files, or completion responses.
              </p>
              <p className="text-xs text-muted">
                All prompt text passes through transient server memory in-stream and is immediately forwarded over encrypted TLS 1.3 connections to authoritative model providers. No prompt payload content is ever written to disk, database, or secondary storage.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-600" />
                <span>2. Information & Metadata We Collect</span>
              </h2>
              <p>
                To provide token accounting, rate limiting, and security monitoring, we store only minimal operational metadata:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                <li><strong>Account Information:</strong> Account email, display name, and hashed credentials.</li>
                <li><strong>API Key Metrics:</strong> Masked key prefix (<code className="text-violet-600">ld_live_...1234</code>), status, and purchased token allowance.</li>
                <li><strong>Telemetry & Usage:</strong> Input token counts, output token counts, total tokens consumed, request latency (ms), HTTP status codes, and model identifiers.</li>
                <li><strong>Security Logs:</strong> Client IP address and browser User-Agent recorded strictly for audit logging and anti-abuse enforcement.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-600" />
                <span>3. Encryption & Security Architecture</span>
              </h2>
              <p>
                We employ industry-leading security practices to protect your data:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Password Security:</strong> User passwords are hashed using <code className="bg-bg px-1.5 py-0.5 rounded text-violet-600 font-mono text-xs">scrypt</code> with a 16-byte random salt and timing-safe verification.</li>
                <li><strong>Infrastructure Secrets:</strong> Upstream provider credentials are encrypted using AES-256-CBC authenticated encryption and kept completely isolated from browser bundles.</li>
                <li><strong>Data in Transit:</strong> All HTTP traffic between client, gateway, and upstream suppliers is enforced over TLS 1.3 encryption with HTTP Strict Transport Security (HSTS).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-600" />
                <span>4. Cookies & Browser Storage</span>
              </h2>
              <p>
                We use HTTP-only, secure cookies (<code className="bg-bg px-1 px-1 rounded font-mono text-xs text-fg">ld_token</code>) strictly for maintaining authenticated session state and preventing trial key abuse (<code className="bg-bg px-1 rounded font-mono text-xs text-fg">ld_trial_id</code>). We do <strong>NOT</strong> use third-party tracking cookies, Google Analytics, or invasive user-tracking scripts.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-600" />
                <span>5. Data Rights & Account Deletion</span>
              </h2>
              <p>
                You have the full right to request data export or complete deletion of your LightningDeals account and associated API keys at any time. To request account deletion, submit a ticket in your customer portal or contact our support team.
              </p>
            </section>

            <section className="space-y-3 border-t border-border pt-6">
              <h2 className="text-base font-bold text-fg">6. Contact Data Protection Officer</h2>
              <p>
                If you have privacy concerns or data protection questions, please reach out to our privacy team at <a href="mailto:privacy@lightningapi.pro" className="text-violet-600 font-bold underline">privacy@lightningapi.pro</a> or via support ticket.
              </p>
            </section>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};
