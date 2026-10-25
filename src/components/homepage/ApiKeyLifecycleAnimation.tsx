import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Key, Terminal, Send, ShieldCheck, Cpu, MessageSquare, ArrowRight, Check, Play, Pause, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LifecycleStep {
  step: number;
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  codeSnippet: string;
  annotation: string;
}

const STEPS: LifecycleStep[] = [
  {
    step: 1,
    badge: 'STAGE 01 · KEY GENERATION',
    title: 'Generate Synthetic API Key',
    description: 'Instantly provision your production or trial key in the LightningAPI dashboard. Each key is backed by SHA-256 cryptographic hashing.',
    icon: Key,
    codeSnippet: `// 1. Key generated in LightningAPI Dashboard
{
  "key_prefix": "ld_live_",
  "display_key": "ld_live_49f8••••••••••••••••",
  "plan": "Claude Max 5x (5-Hour Rolling Pool)",
  "rate_limit_rpm": 60,
  "status": "active"
}`,
    annotation: 'Keys are hashed upon generation. Never stored in plaintext.',
  },
  {
    step: 2,
    badge: 'STAGE 02 · CLIENT CONFIGURATION',
    title: 'Configure Your Environment',
    description: 'Set two standard environment variables in your shell, IDE configuration, or CI pipeline. No custom SDK or wrapper library needed.',
    icon: Terminal,
    codeSnippet: `# Configure client environment for Anthropic SDK / Claude Code CLI
export ANTHROPIC_BASE_URL="https://lightningapi.pro"
export ANTHROPIC_API_KEY="ld_live_49f82d1c8e9b3a4f7e2d1c8e"

# Now run your normal workflow habits
claude`,
    annotation: 'Drop-in replacement for standard Anthropic SDK endpoints.',
  },
  {
    step: 3,
    badge: 'STAGE 03 · DISPATCH PROMPT',
    title: 'Send Standard Request',
    description: 'Your editor or terminal dispatches a standard Anthropic Messages API payload over TLS 1.3 towards the LightningAPI ingress gateway.',
    icon: Send,
    codeSnippet: `POST /v1/messages HTTP/1.1
Host: lightningapi.pro
x-api-key: ld_live_49f82d1c8e9b3a4f7e2d1c8e
anthropic-version: 2023-06-01
Content-Type: application/json

{
  "model": "claude-sonnet-5.5",
  "max_tokens": 1024,
  "messages": [{ "role": "user", "content": "Refactor async handler." }]
}`,
    annotation: 'Standard Anthropic JSON contract. Zero protocol translation.',
  },
  {
    step: 4,
    badge: 'STAGE 04 · INGRESS VERIFICATION',
    title: 'Authenticate & Verify Quota',
    description: 'The gateway validates your key status and checks continuous 5-hour rolling pool capacity atomically before forwarding upstream.',
    icon: ShieldCheck,
    codeSnippet: `[GATEWAY INGRESS AUDIT]
✔ Header Authorization: Valid x-api-key signature
✔ Key Hash Verification: SHA-256 digest verified
✔ Key Status: ACTIVE
✔ 5-Hour Quota Check: Available (3,800,000 / 5,000,000 tokens)
✔ Zero Prompt Logging Enforcement: ENABLED (In-memory passthrough)
✔ Latency Check: 0.8ms gateway overhead`,
    annotation: 'Atomic verification prevents concurrency race conditions.',
  },
  {
    step: 5,
    badge: 'STAGE 05 · SECURE ROUTING',
    title: 'Encrypted Upstream Routing',
    description: 'Your request is routed directly to the selected frontier model cluster over encrypted, dedicated TLS 1.3 pipes with zero logging.',
    icon: Cpu,
    codeSnippet: `[ROUTING ENGINE]
Target Model: claude-sonnet-5.5
Protocol: Native Anthropic Streaming Messages
Encryption: TLS 1.3 (Strict In-Stream Forwarding)
Logging Policy: ZERO Prompt or Response Data Retention
Upstream Handshake: 18ms`,
    annotation: 'Zero intermediate disk persistence or prompt training.',
  },
  {
    step: 6,
    badge: 'STAGE 06 · STREAMING RESPONSE',
    title: 'Return Streamed Inference',
    description: 'Tokens stream back directly into Cursor, Windsurf, or Claude Code CLI via Server-Sent Events (SSE) with minimal latency.',
    icon: MessageSquare,
    codeSnippet: `event: message_start
data: {"type": "message_start", "message": {"id": "msg_01...", "role": "assistant"}}

event: content_block_delta
data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Here is the refactored async handler with graceful shutdown..."}}

event: message_stop
data: {"type": "message_stop"}`,
    annotation: 'Full Server-Sent Events streaming with sub-50ms TTFT.',
  },
];

export const ApiKeyLifecycleAnimation: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !isPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= 6 ? 1 : prev + 1));
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying, prefersReducedMotion]);

  const currentStepData = STEPS.find((s) => s.step === activeStep) || STEPS[0];
  const StepIcon = currentStepData.icon;

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E1E8]">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
                DEVELOPER INTEGRATION LIFECYCLE
              </span>
            </div>

            <h2 className="section-headline text-[#191719] font-display">
              One key. Your workflow.
            </h2>

            <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
              Connect your compatible development tools through LightningAPI using the supported
              authentication and endpoint configuration.
            </p>
          </div>

          {/* Autoplay / Pause Control */}
          <div className="flex items-center gap-2 self-start lg:self-end">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-[#E6E1E8] text-xs font-mono text-[#191719] hover:bg-black/[0.03] transition-colors cursor-pointer shadow-2xs"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#7136E8]" />
                  <span>Pause Demo</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-[#7136E8] text-[#7136E8]" />
                  <span>Autoplay Demo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE STEP PICKER TABS (1 to 6)                         */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STEPS.map((s) => {
            const isCurrent = s.step === activeStep;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(s.step);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer font-mono ${
                  isCurrent
                    ? 'bg-[#141217] text-white border-[#141217] shadow-sm'
                    : 'bg-white text-[#68636B] border-[#E6E1E8] hover:border-[#7136E8]/40 hover:text-[#191719]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold pb-1">
                  <span>0{s.step}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8] animate-pulse" />}
                </div>
                <div className="text-xs font-sans font-semibold truncate">
                  {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* ANIMATED CINEMATIC DISPLAY CONTAINER                          */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-[24px] bg-white border border-[#E6E1E8] p-6 sm:p-10 shadow-sm">
          
          {/* Left Column: Stage Narrative (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEE6FF] text-[#7136E8] text-xs font-mono font-bold">
              <StepIcon className="w-3.5 h-3.5" />
              <span>{currentStepData.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display">
              {currentStepData.title}
            </h3>

            <p className="text-base text-[#68636B] leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Stage Technical Invariant Badge */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] text-xs font-mono text-[#191719]">
              <Check className="w-4 h-4 text-[#087F5B] shrink-0 mt-0.5" />
              <span>{currentStepData.annotation}</span>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep((p) => Math.max(1, p - 1));
                }}
                className="px-4 py-2 rounded-lg bg-white border border-[#E6E1E8] text-xs font-semibold text-[#191719] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02] cursor-pointer"
              >
                Previous Stage
              </button>

              <button
                type="button"
                disabled={activeStep === 6}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep((p) => Math.min(6, p + 1));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Code & Terminal Workspace Mockup (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-[18px] bg-[#141217] border border-[#26222C] shadow-lg overflow-hidden">
              
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1B1821] border-b border-[#26222C] font-mono text-xs text-[#A39EAA]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56]/80" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]/80" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F]/80" />
                  <span className="ml-2 text-white font-medium">terminal — stage-0{activeStep}.sh</span>
                </div>
                <span className="text-[11px] text-[#087F5B]">Simulated Sandbox</span>
              </div>

              {/* Code Content with Smooth Fade */}
              <div className="p-5 sm:p-6 overflow-x-auto min-h-[260px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.pre
                    key={activeStep}
                    initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -6 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
                    className="font-mono text-xs sm:text-sm text-[#E6E1E8] leading-relaxed w-full text-left"
                  >
                    <code>{currentStepData.codeSnippet}</code>
                  </motion.pre>
                </AnimatePresence>
              </div>

              {/* Bottom Security Assurance Banner */}
              <div className="px-5 py-2.5 bg-[#100E13] border-t border-[#26222C] flex items-center justify-between text-[11px] font-mono text-[#A39EAA]">
                <span>All keys shown are synthetic test fixtures. Zero production secrets exposed.</span>
                <Link
                  to="/docs"
                  className="text-[#EEE6FF] hover:text-white inline-flex items-center gap-1 shrink-0"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
