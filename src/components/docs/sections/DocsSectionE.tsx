import React from 'react';
import {
  Globe,
  KeyRound,
  FileCode,
  Zap,
  Layers,
  Clock,
  Sparkles,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { MultiOsCodeBlock } from '../MultiOsCodeBlock';

export const DocsSectionE: React.FC = () => {
  return (
    <section id="sec-api-reference" className="scroll-mt-24 space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section E
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          API Reference &amp; Protocol Specification
        </h2>
      </div>

      {/* E1: Authentication */}
      <article
        id="api-authentication"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-violet-600" />
          <span>1. Authentication Standards &amp; Header Formats</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI accepts credentials via two standard header formats depending on whether you are using the Anthropic protocol or the OpenAI compatible protocol:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2">
            <div className="text-xs font-bold text-violet-700 font-sans">Anthropic Protocol Header</div>
            <code className="text-[#1c1917] font-bold block select-all">x-api-key: ld_live_...</code>
            <p className="text-[11px] text-[#78716c] font-sans">
              Required for <code className="font-mono">/v1/messages</code>. Also accepts <code className="font-mono">anthropic-version: 2023-06-01</code>.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2">
            <div className="text-xs font-bold text-blue-700 font-sans">OpenAI Compatible Header</div>
            <code className="text-[#1c1917] font-bold block select-all">Authorization: Bearer ld_live_...</code>
            <p className="text-[11px] text-[#78716c] font-sans">
              Required for <code className="font-mono">/v1/chat/completions</code> and <code className="font-mono">/v1/models</code>.
            </p>
          </div>
        </div>
      </article>

      {/* E2: Base URLs */}
      <article
        id="api-base-urls"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Globe className="w-5 h-5 text-violet-600" />
          <span>2. Base URLs &amp; Dual Protocols</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI hosts dual protocol endpoints with automatic header normalization:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
            <div className="text-xs font-bold text-violet-700 font-sans">Anthropic Native Base URL</div>
            <div className="font-bold text-[#1c1917] select-all">https://lightningapi.pro</div>
            <p className="text-[11px] text-[#78716c] font-sans">
              Used for Claude Code, Cursor Anthropic mode, and @anthropic-ai/sdk.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-1.5">
            <div className="text-xs font-bold text-blue-700 font-sans">OpenAI Compatible Base URL</div>
            <div className="font-bold text-[#1c1917] select-all">https://lightningapi.pro/v1</div>
            <p className="text-[11px] text-[#78716c] font-sans">
              Used for Codex, Windsurf, LangChain, and openai official SDKs.
            </p>
          </div>
        </div>
      </article>

      {/* E3: GET /v1/models */}
      <article
        id="api-models"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">GET</span>
            <span>/v1/models (Key-Scoped Discovery)</span>
          </h3>
          <span className="text-xs text-[#78716c] font-mono">OpenAI Compatible</span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Retrieves the list of models dynamically permitted by your authenticating key. Useful for editor auto-complete dropdowns:
        </p>
        <MultiOsCodeBlock
          title="GET /v1/models"
          tabs={[
            {
              label: 'cURL',
              language: 'bash',
              code: `curl -X GET "https://lightningapi.pro/v1/models" \\
  -H "Authorization: Bearer ld_live_your_api_key_here"`,
            },
            {
              label: 'Response JSON',
              language: 'json',
              code: `{
  "object": "list",
  "data": [
    {
      "id": "claude-sonnet-5.5",
      "object": "model",
      "created": 1730000000,
      "owned_by": "anthropic"
    },
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1730000000,
      "owned_by": "openai"
    },
    {
      "id": "gemini-4-argon",
      "object": "model",
      "created": 1730000000,
      "owned_by": "google"
    }
  ]
}`,
            },
          ]}
        />
      </article>

      {/* E4: POST /v1/messages */}
      <article
        id="api-messages"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-800 font-mono text-xs font-bold">POST</span>
            <span>/v1/messages</span>
          </h3>
          <span className="text-xs text-[#78716c] font-mono">Native Anthropic Protocol</span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Sends a structured message sequence to Claude Frontier models with streaming, tool execution, and vision support:
        </p>
        <MultiOsCodeBlock
          title="POST /v1/messages Example"
          tabs={[
            {
              label: 'cURL',
              language: 'bash',
              code: `curl -X POST "https://lightningapi.pro/v1/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Explain microservices in two sentences."}
    ]
  }'`,
            },
            {
              label: 'Python (anthropic SDK)',
              language: 'python',
              code: `from anthropic import Anthropic

client = Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_api_key_here"
)

response = client.messages.create(
    model="claude-sonnet-5.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain microservices in two sentences."}]
)
print(response.content[0].text)`,
            },
          ]}
        />
      </article>

      {/* E5: POST /v1/chat/completions */}
      <article
        id="api-chat-completions"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono text-xs font-bold">POST</span>
            <span>/v1/chat/completions</span>
          </h3>
          <span className="text-xs text-[#78716c] font-mono">OpenAI Compatible Protocol</span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Standard chat completions endpoint compatible with OpenAI, LangChain, and all OpenAI-compatible SDKs:
        </p>
        <MultiOsCodeBlock
          title="POST /v1/chat/completions Example"
          tabs={[
            {
              label: 'cURL',
              language: 'bash',
              code: `curl -X POST "https://lightningapi.pro/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ld_live_your_api_key_here" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Explain idempotent API design."}
    ]
  }'`,
            },
            {
              label: 'Python (openai SDK)',
              language: 'python',
              code: `from openai import OpenAI

client = OpenAI(
    base_url="https://lightningapi.pro/v1",
    api_key="ld_live_your_api_key_here"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain idempotent API design."}]
)
print(response.choices[0].message.content)`,
            },
          ]}
        />
      </article>

      {/* E6: POST /v1/responses */}
      <article
        id="api-responses"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-800 font-mono text-xs font-bold">POST</span>
            <span>/v1/responses (Universal Unified Endpoint)</span>
          </h3>
          <span className="text-xs text-[#78716c] font-mono">Universal Route</span>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed">
          High-performance direct route supporting cross-model requests with automatic translation and unified response envelope:
        </p>
        <MultiOsCodeBlock
          title="POST /v1/responses Example"
          tabs={[
            {
              label: 'cURL',
              language: 'bash',
              code: `curl -X POST "https://lightningapi.pro/v1/responses" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ld_live_your_api_key_here" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "input": "Summarize this diff in bullet points",
    "temperature": 0.2
  }'`,
            },
          ]}
        />
      </article>

      {/* E7: Streaming (SSE) */}
      <article
        id="api-streaming"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <span>7. Server-Sent Events (SSE) Streaming Format</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          When <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">&quot;stream&quot;: true</code> is passed, LightningAPI returns tokens via HTTP/2 SSE chunks with <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">content-type: text/event-stream</code>:
        </p>
        <div className="p-4 rounded-2xl bg-[#0c0d14] text-[#f4f4f5] font-mono text-xs border border-neutral-800 space-y-1.5">
          <div className="text-cyan-400">HTTP/2 200 OK</div>
          <div className="text-cyan-400">content-type: text/event-stream</div>
          <div className="text-emerald-300">data: &#123;&quot;choices&quot;:[&#123;&quot;delta&quot;:&#123;&quot;content&quot;:&quot;Hello&quot;&#125;&#125;]&#125;</div>
          <div className="text-emerald-300">data: &#123;&quot;choices&quot;:[&#123;&quot;delta&quot;:&#123;&quot;content&quot;:&quot; world&quot;&#125;&#125;]&#125;</div>
          <div className="text-amber-400">data: [DONE]</div>
        </div>
      </article>

      {/* E8: Multimodal Vision */}
      <article
        id="api-multimodal"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <span>8. Multimodal Vision &amp; Image Payloads</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Supported across <code className="font-mono font-bold text-violet-700">claude-sonnet-5.5</code>, <code className="font-mono font-bold text-blue-700">gpt-4o</code>, and <code className="font-mono font-bold text-emerald-700">gemini-4-argon</code>. Pass either base64 encoded strings or public HTTPS image URLs:
        </p>
        <MultiOsCodeBlock
          title="Vision Payload Example (OpenAI Format)"
          tabs={[
            {
              label: 'JSON Payload',
              language: 'json',
              code: `{
  "model": "claude-sonnet-5.5",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Describe the architecture diagram in this screenshot." },
        {
          "type": "image_url",
          "image_url": { "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." }
        }
      ]
    }
  ]
}`,
            },
          ]}
        />
      </article>

      {/* E9: Token Count */}
      <article
        id="api-token-count"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-600" />
          <span>9. Token Counting &amp; Pre-Request Estimation</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI provides exact token counts before execution to assist in budget management:
        </p>
        <MultiOsCodeBlock
          title="POST /v1/messages/count_tokens"
          tabs={[
            {
              label: 'cURL',
              language: 'bash',
              code: `curl -X POST "https://lightningapi.pro/v1/messages/count_tokens" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ld_live_your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "messages": [
      {"role": "user", "content": "How many tokens is this prompt?"}
    ]
  }'`,
            },
          ]}
        />
      </article>

      {/* E10: Rate Limits & Concurrency */}
      <article
        id="api-rate-limits"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span>10. Rate Limits, Concurrency &amp; Response Headers</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          All HTTP responses include telemetry headers indicating active concurrency and rolling quota limits:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#ede8e1] bg-[#faf8f5] text-[10px] font-bold uppercase text-[#78716c]">
                <th className="py-2.5 px-3">Header Name</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8e1]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">x-ratelimit-limit-requests</td>
                <td className="py-2.5 px-3 text-[#1c1917]">Maximum requests permitted per minute (RPM).</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">x-ratelimit-remaining-requests</td>
                <td className="py-2.5 px-3 text-[#1c1917]">Number of requests remaining in current window.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">x-ratelimit-reset-requests</td>
                <td className="py-2.5 px-3 text-[#1c1917]">Seconds until the request count resets.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-violet-700">retry-after</td>
                <td className="py-2.5 px-3 text-[#1c1917]">Returned on HTTP 429 indicating seconds to wait before retrying.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
