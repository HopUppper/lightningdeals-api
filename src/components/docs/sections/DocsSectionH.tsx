import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileCode,
  RefreshCw,
  HelpCircle,
  LifeBuoy,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { MultiOsCodeBlock } from '../MultiOsCodeBlock';

export const DocsSectionH: React.FC = () => {
  return (
    <section id="sec-security-support" className="scroll-mt-24 space-y-8 pt-4 pb-12">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section H
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Security, Best Practices &amp; Engineering Support
        </h2>
      </div>

      {/* H1: API Key Hygiene */}
      <article
        id="key-security"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>1. API Key Storage Hygiene &amp; Security Standards</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Your LightningAPI credentials provide access to frontier computing infrastructure. Adhere to these essential security rules:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-2 leading-relaxed">
          <li><strong>Never Commit to Version Control:</strong> Always place API keys in <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">.env</code> files and include them in your <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">.gitignore</code>.</li>
          <li><strong>Never Expose in Frontend Bundles:</strong> Client-side JavaScript bundles (React, Vue, Vite) can be reverse engineered. Route requests through a secure server proxy.</li>
          <li><strong>IP &amp; Origin Pinning:</strong> Configure allowed IP addresses in the Customer Dashboard for enterprise keys.</li>
        </ul>
      </article>

      {/* H2: Environment Variables */}
      <article
        id="environment-variables"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <FileCode className="w-5 h-5 text-violet-600" />
          <span>2. Storing Keys Securely in Environment Variables</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Standard practice for local development across Python, Node.js, and CLI scripts:
        </p>
        <MultiOsCodeBlock
          filename=".env.example"
          tabs={[
            {
              label: '.env file',
              language: 'bash',
              code: `# LightningAPI Environment Configuration
ANTHROPIC_BASE_URL=https://lightningapi.pro
ANTHROPIC_AUTH_TOKEN=ld_live_your_key_here

OPENAI_BASE_URL=https://lightningapi.pro/v1
OPENAI_API_KEY=ld_live_your_key_here`,
            },
            {
              label: '.gitignore snippet',
              language: 'bash',
              code: `# Ignore secret environment files
.env
.env.local
.env.*.local`,
            },
          ]}
        />
      </article>

      {/* H3: Emergency Rotation */}
      <article
        id="emergency-rotation"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-rose-600" />
          <span>3. Emergency Key Rotation Procedure</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          If you believe your key was leaked or compromised, execute this 3-minute rotation drill:
        </p>
        <ol className="space-y-2 text-xs text-[#44403c] list-decimal list-inside leading-relaxed">
          <li>Log into <strong className="text-[#1c1917]">Dashboard → API Keys</strong>.</li>
          <li>Click <strong className="text-[#1c1917]">&quot;Generate New Key&quot;</strong> and copy the newly generated secret string.</li>
          <li>Update your active applications, editors, and terminal environment variables with the new key.</li>
          <li>Return to the dashboard and click <strong className="text-rose-600">&quot;Revoke / Delete&quot;</strong> on the compromised key. The revoked key will be blocked across all gateway clusters in under 5 seconds.</li>
        </ol>
      </article>

      {/* H4: FAQ */}
      <article
        id="faq-section"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-violet-600" />
          <span>4. Frequently Asked Questions (Developer FAQ)</span>
        </h3>
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
            <div className="font-bold text-[#1c1917]">Does LightningAPI log prompt contents?</div>
            <p className="text-[#64607d] leading-relaxed">
              No. LightningAPI operates as a zero-persistence streaming proxy. Prompt and completion tokens stream through in memory and are never persisted to disk or used for training.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
            <div className="font-bold text-[#1c1917]">Can I use one key on multiple computers?</div>
            <p className="text-[#64607d] leading-relaxed">
              Yes. You can use your active API key across your desktop, laptop, and CI/CD pipelines simultaneously within your plan&apos;s concurrency limits.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1">
            <div className="font-bold text-[#1c1917]">What happens if my connection drops mid-stream?</div>
            <p className="text-[#64607d] leading-relaxed">
              Our fair accounting engine only charges for tokens actually streamed before disconnect, and charges zero tokens if the request encountered an error.
            </p>
          </div>
        </div>
      </article>

      {/* H5: Contact Support */}
      <article
        id="contact-support"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-violet-600" />
          <span>5. Engineering &amp; Account Support</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Our engineering support team is available 24/7. Reach out via email or submit a ticket from your dashboard:
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="mailto:support@lightningapi.pro"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Email support@lightningapi.pro
          </a>
          <Link
            to="/check-key"
            className="px-4 py-2 rounded-xl border border-[#ede8e1] bg-white hover:bg-stone-50 text-[#1c1917] font-bold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>Verify Key Diagnostics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </section>
  );
};
