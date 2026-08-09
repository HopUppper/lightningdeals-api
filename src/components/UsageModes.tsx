import React from 'react';
import { CreditCard, Coins, ArrowRight } from 'lucide-react';

export const UsageModes: React.FC = () => {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-6 sm:py-24">
        
        <div className="max-w-2xl">
          <p className="ui-kicker font-mono text-xs uppercase tracking-widest text-accent">Billing Modes</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-fg sm:text-4xl">
            Choose how you pay for compute.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">
            ApexScale supports both USD-backed API credit keys and fixed token-allowance keys for specialized model families.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          
          {/* Card 1: API Credits */}
          <div className="rounded-card border border-border bg-subtle p-6 sm:p-8 flex flex-col justify-between hover:bg-white transition-colors shadow-e1">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent mb-5">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-fg">API Credits</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                Prepay USD credit packs ($2.50 to $100+) and spend down your balance against published customer model rates across all available LLM providers. Ideal for general development, multi-model workflows, and team use.
              </p>
            </div>
            <a
              href="#pricing"
              className="arrow-cta mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              <span>Explore credit packs</span>
              <span className="arrow-cta__icon">→</span>
            </a>
          </div>

          {/* Card 2: AI Token Allowances */}
          <div className="rounded-card border border-border bg-subtle p-6 sm:p-8 flex flex-col justify-between hover:bg-white transition-colors shadow-e1">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent mb-5">
                <Coins className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-fg">AI Tokens</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                Buy fixed prepaid token allowances for specific model families (e.g. GLM 5.2 or DeepSeek R2) at bulk rates. The installer and gateway select the matching token endpoint route automatically.
              </p>
            </div>
            <a
              href="#models"
              className="arrow-cta mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              <span>View token key rates</span>
              <span className="arrow-cta__icon">→</span>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};
