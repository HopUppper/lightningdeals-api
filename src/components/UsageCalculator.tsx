import React, { useState } from 'react';
import { Calculator, TrendingDown } from 'lucide-react';

interface ModelRate {
  id: string;
  name: string;
  inputPerM: number;
  outputPerM: number;
}

export const UsageCalculator: React.FC = () => {
  const models: ModelRate[] = [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet ($3.00 / $15.00)', inputPerM: 3.0, outputPerM: 15.0 },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5 ($3.00 / $15.00)', inputPerM: 3.0, outputPerM: 15.0 },
    { id: 'claude-fable-5', name: 'Claude Fable 5 ($0.80 / $4.00)', inputPerM: 0.8, outputPerM: 4.0 },
    { id: 'claude-opus-5', name: 'Claude Opus 5 ($15.00 / $75.00)', inputPerM: 15.0, outputPerM: 75.0 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku ($0.80 / $4.00)', inputPerM: 0.8, outputPerM: 4.0 },
  ];

  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet-20241022');
  const [inputTokensM, setInputTokensM] = useState<number>(10); // in millions
  const [outputTokensM, setOutputTokensM] = useState<number>(2); // in millions

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];
  const rawMeterCost = inputTokensM * selectedModel.inputPerM + outputTokensM * selectedModel.outputPerM;

  return (
    <section id="calculator" className="border-b border-border bg-subtle" aria-labelledby="calc-title">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="ui-kicker flex items-center gap-1.5">
            <Calculator className="h-4 w-4 text-accent" />
            <span>Interactive Savings Calculator</span>
          </p>
          <h2 id="calc-title" className="mt-4 text-3xl font-semibold tracking-[-.03em] text-fg sm:text-4xl">
            Estimate your Claude API usage.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted">
            Select your Claude model and estimated token volume to inspect 5-hour rolling window throughput.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="rounded-card border border-border bg-card p-6 sm:p-8 shadow-e1 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-fg mb-2">
                Select Claude Model
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full rounded-control border border-border bg-subtle px-4 py-3 text-sm font-mono text-fg focus:border-accent focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-semibold text-fg">Input Tokens</span>
                <span className="font-mono text-accent font-bold">{inputTokensM} Million Tokens</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="100"
                step="0.5"
                value={inputTokensM}
                onChange={(e) => setInputTokensM(parseFloat(e.target.value))}
                className="w-full h-2 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-semibold text-fg">Output Tokens</span>
                <span className="font-mono text-accent font-bold">{outputTokensM} Million Tokens</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="30"
                step="0.1"
                value={outputTokensM}
                onChange={(e) => setOutputTokensM(parseFloat(e.target.value))}
                className="w-full h-2 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>

          <div className="rounded-card border border-amber-500/20 bg-amber-500/[0.03] p-6 sm:p-8 shadow-e2 flex flex-col justify-between space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                <TrendingDown className="h-3.5 w-3.5" /> 5-Hour Rolling Allowance
              </span>

              <h3 className="mt-4 text-xl font-bold text-fg">Claude API Volume Breakdown</h3>

              <div className="mt-6 space-y-4 border-t border-border pt-4">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-muted">Direct Meter Value:</span>
                  <span className="font-mono font-medium text-amber-500">
                    ${rawMeterCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs font-semibold text-fg">Recommended Package:</p>
              <p className="text-sm font-mono text-amber-500 font-bold mt-1">Claude Max 20x</p>
              <a
                href="#pricing"
                className="ui-button-primary mt-4 w-full justify-center text-center shadow-sm"
              >
                View Claude Max Packages →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
