import React, { useState } from 'react';
import { Copy, Check, Terminal, Code, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApiQuickStart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    curl: `export LIGHTNING_API_KEY="ld_live_your_key_here"

curl https://lightningapi.pro/v1/messages \\
  -H "x-api-key: $LIGHTNING_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Analyze this dataset for anomalous transaction patterns." }
    ]
  }'`,
    python: `import os
from anthropic import Anthropic

client = Anthropic(
    base_url="https://lightningapi.pro",
    api_key="ld_live_your_key_here"
)

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Analyze this dataset for anomalous transaction patterns."}
    ]
)

print(response.content[0].text)`,
    node: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: 'https://lightningapi.pro',
  apiKey: 'ld_live_your_key_here',
});

const message = await client.messages.create({
  model: 'claude-sonnet-5',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Analyze this dataset for anomalous transaction patterns.' }
  ],
});

console.log(message.content[0].text);`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="border-b border-[#e5e7eb] bg-[#fbfbfa] py-16 lg:py-24 font-sans">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start min-w-0">
          
          {/* Left Column: Explanation */}
          <div className="lg:col-span-5 space-y-6 min-w-0 w-full">
            <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
              Developer Quickstart
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827]">
              Drop into your existing codebase.
            </h2>

            <p className="text-sm sm:text-base text-[#4b5563] leading-relaxed">
              Because LightningAPI mirrors standard Anthropic protocol specifications, you don’t have to rewrite your prompting pipelines or change data structures. Just point your base URL to our gateway.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs text-[#4b5563]">
                <span className="font-semibold text-[#111827] shrink-0">1.</span>
                <span className="break-all sm:break-normal">Initialize client with <code className="text-[#111827] bg-[#f4f4f0] px-1.5 py-0.5 rounded font-mono text-[11px]">base_url="https://lightningapi.pro"</code></span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#4b5563]">
                <span className="font-semibold text-[#111827] shrink-0">2.</span>
                <span>Pass your API key via standard <code className="text-[#111827] bg-[#f4f4f0] px-1.5 py-0.5 rounded font-mono text-[11px]">x-api-key</code> headers</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#4b5563]">
                <span className="font-semibold text-[#111827] shrink-0">3.</span>
                <span>Stream messages token-by-token using standard SSE listeners</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/docs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e40af] hover:text-[#1d4ed8] transition-colors"
              >
                <span>Browse comprehensive API documentation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Code Snippet Card */}
          <div className="lg:col-span-7 min-w-0 w-full">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm min-w-0">
              
              {/* Tab Bar */}
              <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-3 bg-[#1e293b]/40">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('curl')}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      activeTab === 'curl'
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('python')}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      activeTab === 'python'
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('node')}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      activeTab === 'node'
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Node.js
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-sans font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Box */}
              <div className="p-4 sm:p-5 overflow-x-auto font-mono text-xs text-gray-100 leading-relaxed">
                <pre>{codeSnippets[activeTab]}</pre>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
