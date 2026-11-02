import React from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const DocsSectionD: React.FC = () => {
  return (
    <section id="sec-models" className="scroll-mt-24 space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section D
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Models &amp; Intelligence Providers
        </h2>
      </div>

      {/* D1: Claude Frontier Models */}
      <article
        id="models-claude"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-violet-600" />
          <span>1. Anthropic Claude Frontier Models</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI provides direct access to Anthropic&apos;s frontier intelligence family. Use these technical model IDs across all API requests:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Technical Model ID</th>
                <th className="py-2.5 px-3">Display Name</th>
                <th className="py-2.5 px-3">Context Window</th>
                <th className="py-2.5 px-3">Max Output</th>
                <th className="py-2.5 px-3">Vision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">claude-sonnet-5.5</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Sonnet 5.5</td>
                <td className="py-2.5 px-3">1,000,000</td>
                <td className="py-2.5 px-3">16,384</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">claude-opus-5.5</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Opus 5.5</td>
                <td className="py-2.5 px-3">1,000,000</td>
                <td className="py-2.5 px-3">16,384</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">claude-fable-5</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Fable 5</td>
                <td className="py-2.5 px-3">1,000,000</td>
                <td className="py-2.5 px-3">8,192</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">claude-haiku-5.5</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Haiku 5.5</td>
                <td className="py-2.5 px-3">500,000</td>
                <td className="py-2.5 px-3">8,192</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">claude-sonnet-4.5</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Claude Sonnet 4.5</td>
                <td className="py-2.5 px-3">200,000</td>
                <td className="py-2.5 px-3">8,192</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* D2: OpenAI Frontier Models */}
      <article
        id="models-openai"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" />
          <span>2. OpenAI Frontier Models</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          OpenAI reasoning and multimodal models accessible via both <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">/v1/chat/completions</code> and native tooling:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Technical Model ID</th>
                <th className="py-2.5 px-3">Display Name</th>
                <th className="py-2.5 px-3">Context Window</th>
                <th className="py-2.5 px-3">Max Output</th>
                <th className="py-2.5 px-3">Specialty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">gpt-4o</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">GPT-4o Omnimodal</td>
                <td className="py-2.5 px-3">128,000</td>
                <td className="py-2.5 px-3">16,384</td>
                <td className="py-2.5 px-3 text-[#78716c]">General coding, multimodal</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">gpt-4o-mini</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">GPT-4o Mini</td>
                <td className="py-2.5 px-3">128,000</td>
                <td className="py-2.5 px-3">16,384</td>
                <td className="py-2.5 px-3 text-[#78716c]">Fast helper, high RPM</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">o1</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">o1 Deep Reasoning</td>
                <td className="py-2.5 px-3">200,000</td>
                <td className="py-2.5 px-3">100,000</td>
                <td className="py-2.5 px-3 text-[#78716c]">Complex math, algorithms</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">o3-mini</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">o3-mini Reasoning</td>
                <td className="py-2.5 px-3">200,000</td>
                <td className="py-2.5 px-3">100,000</td>
                <td className="py-2.5 px-3 text-[#78716c]">Fast scientific reasoning</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-700">gpt-4.5</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">GPT-4.5 Frontier</td>
                <td className="py-2.5 px-3">128,000</td>
                <td className="py-2.5 px-3">16,384</td>
                <td className="py-2.5 px-3 text-[#78716c]">Flagship reasoning</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* D3: Google Gemini Models */}
      <article
        id="models-gemini"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <span>3. Google Gemini Models</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Google&apos;s frontier multimodal intelligence with ultra-long 1,000,000 token context capability:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Technical Model ID</th>
                <th className="py-2.5 px-3">Display Name</th>
                <th className="py-2.5 px-3">Context Window</th>
                <th className="py-2.5 px-3">Vision &amp; Audio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-700">gemini-4-argon</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Gemini 4 Argon (1M Context)</td>
                <td className="py-2.5 px-3">1,000,000</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes (Multimodal)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-700">gemini-2.5-pro</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Gemini 2.5 Pro</td>
                <td className="py-2.5 px-3">1,000,000</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes (Multimodal)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-700">gemini-2.5-flash</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Gemini 2.5 Flash</td>
                <td className="py-2.5 px-3">1,000,000</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Yes (Fast)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* D4: Open-Weights & Labs */}
      <article
        id="models-local"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <span>4. Open-Weights &amp; Frontier Labs</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Cost-effective open-weights reasoning and code-specialized models routed through high-throughput edge nodes:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Technical Model ID</th>
                <th className="py-2.5 px-3">Lab / Family</th>
                <th className="py-2.5 px-3">Context</th>
                <th className="py-2.5 px-3">Specialty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-700">deepseek-reasoner</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">DeepSeek R1 Reasoning</td>
                <td className="py-2.5 px-3">64,000</td>
                <td className="py-2.5 px-3 text-[#78716c]">Chain-of-thought math &amp; code</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-700">deepseek-chat</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">DeepSeek V3</td>
                <td className="py-2.5 px-3">64,000</td>
                <td className="py-2.5 px-3 text-[#78716c]">High-throughput dialogue</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-700">qwen-2.5-coder-32b</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">Alibaba Qwen</td>
                <td className="py-2.5 px-3">128,000</td>
                <td className="py-2.5 px-3 text-[#78716c]">Specialized software synthesis</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-700">grok-2.0</td>
                <td className="py-2.5 px-3 font-sans text-[#1c1917]">xAI Grok</td>
                <td className="py-2.5 px-3">128,000</td>
                <td className="py-2.5 px-3 text-[#78716c]">Frontier reasoning &amp; vision</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* D5: Model Selection Guide */}
      <article
        id="model-selection"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <span>5. Model Selection Guide for Developers</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Choose the right model for your specific software engineering or agentic workload:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
            <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              <span>Full Repository Refactoring</span>
            </div>
            <p className="text-[#64607d] leading-relaxed">
              Use <strong className="text-violet-700">claude-sonnet-5.5</strong>. Best-in-class multi-file editing, tool execution, and AST comprehension in Cursor and Claude Code.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
            <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Massive Document &amp; Log Analysis</span>
            </div>
            <p className="text-[#64607d] leading-relaxed">
              Use <strong className="text-emerald-700">gemini-4-argon</strong>. Ingest up to 1,000,000 tokens of entire documentation trees, database dumps, and audio recordings.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
            <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Algorithmic &amp; Scientific Reasoning</span>
            </div>
            <p className="text-[#64607d] leading-relaxed">
              Use <strong className="text-blue-700">o3-mini</strong> or <strong className="text-blue-700">o1</strong>. Ideal for mathematical proofs, competitive programming, and formal verification.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
            <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Cost-Optimized Batch Workloads</span>
            </div>
            <p className="text-[#64607d] leading-relaxed">
              Use <strong className="text-indigo-700">deepseek-reasoner</strong> or <strong className="text-indigo-700">qwen-2.5-coder-32b</strong> for high-volume automated unit test generation.
            </p>
          </div>
        </div>
      </article>

      {/* D6: Technical Model IDs */}
      <article
        id="model-ids"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-600" />
          <span>6. Technical Model IDs Quick Reference</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Copy these exact strings into your JSON payloads and CLI configurations:
        </p>
        <div className="p-4 rounded-2xl bg-[#0c0d14] text-[#f4f4f5] font-mono text-xs border border-neutral-800 space-y-1 select-all">
          <div className="text-violet-400">&quot;claude-sonnet-5.5&quot;</div>
          <div className="text-violet-400">&quot;claude-opus-5.5&quot;</div>
          <div className="text-violet-400">&quot;claude-fable-5&quot;</div>
          <div className="text-violet-400">&quot;claude-haiku-5.5&quot;</div>
          <div className="text-blue-400">&quot;gpt-4o&quot;</div>
          <div className="text-blue-400">&quot;gpt-4o-mini&quot;</div>
          <div className="text-blue-400">&quot;o1&quot;</div>
          <div className="text-blue-400">&quot;o3-mini&quot;</div>
          <div className="text-emerald-400">&quot;gemini-4-argon&quot;</div>
          <div className="text-emerald-400">&quot;gemini-2.5-pro&quot;</div>
          <div className="text-indigo-400">&quot;deepseek-reasoner&quot;</div>
          <div className="text-indigo-400">&quot;qwen-2.5-coder-32b&quot;</div>
        </div>
      </article>

      {/* D7: Model Plan Permissions */}
      <article
        id="model-permissions"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>7. Model Plan Permissions &amp; Access Tiers</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Plan tiers authorize access to distinct model families. If you receive HTTP 403 Model Denied, verify your plan permissions:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Plan Architecture</th>
                <th className="py-2.5 px-3">Claude Models</th>
                <th className="py-2.5 px-3">OpenAI Models</th>
                <th className="py-2.5 px-3">Gemini Models</th>
                <th className="py-2.5 px-3">Open-Weights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#1c1917]">Claude Max (5-Hour Rolling)</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Full Access</td>
                <td className="py-2.5 px-3 text-zinc-400">Add Credit Pack</td>
                <td className="py-2.5 px-3 text-zinc-400">Add Credit Pack</td>
                <td className="py-2.5 px-3 text-zinc-400">Add Credit Pack</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#1c1917]">Prepaid Credit Wallet</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Universal</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Universal</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Universal</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">Universal</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#1c1917]">Consumable Token Packs</td>
                <td className="py-2.5 px-3 text-violet-700">Claude Pack</td>
                <td className="py-2.5 px-3 text-blue-700">OpenAI Pack</td>
                <td className="py-2.5 px-3 text-emerald-700">Universal Pack</td>
                <td className="py-2.5 px-3 text-indigo-700">Local Pack</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
