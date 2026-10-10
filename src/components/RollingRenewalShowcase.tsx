import React, { useState } from 'react';
import { Clock, RefreshCw, Zap, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RollingRenewalShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const timelineSteps = [
    {
      time: '10:00 AM',
      title: 'Heavy Project Refactor',
      used: '2,000,000 tokens',
      remaining: '3,000,000 tokens',
      note: 'You run multi-file agentic edits in Cursor. Quota deducts in real-time.',
      percentRemaining: 60,
    },
    {
      time: '01:00 PM',
      title: 'Continuous Coding Flow',
      used: '1,000,000 tokens',
      remaining: '2,000,000 tokens',
      note: 'Writing tests and debugging with Sonnet. Work continues without interruption.',
      percentRemaining: 40,
    },
    {
      time: '03:00 PM (5h later)',
      title: 'First Rolling Token Reload',
      used: '+2,000,000 tokens restored',
      remaining: '4,000,000 tokens',
      note: 'Tokens spent at 10:00 AM exit the 5-hour window and automatically reload into your active balance.',
      percentRemaining: 80,
    },
    {
      time: '06:00 PM',
      title: 'Second Rolling Token Reload',
      used: '+1,000,000 tokens restored',
      remaining: '5,000,000 tokens (Full)',
      note: 'Your token reservoir is continuously replenished every day of your 30-day term.',
      percentRemaining: 100,
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#fbf9f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Heading */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            Continuous Reservoir
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.12]">
            How the 5-hour rolling renewal keeps you coding.
          </h2>
          <p className="text-base sm:text-lg text-[#57534e] leading-relaxed">
            Instead of a rigid monthly bucket that locks you out on Day 5, your allowance behaves like a flowing reservoir that continuously replenishes every 5 hours.
          </p>
        </div>

        {/* Visual Timeline Demonstration (Clean, open layout without nested card soup) */}
        <div className="border border-[#e7e5e4] rounded-2xl bg-white p-6 sm:p-8 space-y-8 shadow-xs">
          
          {/* Step Selector Segmented Rail */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {timelineSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.time}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 sm:p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#6d28d9] bg-[#f5f3ff] shadow-xs'
                      : 'border-[#e7e5e4] bg-[#fdfbf7] hover:bg-[#f5f2eb]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-[#6d28d9]' : 'text-[#78716c]'}`}>
                      {step.time}
                    </span>
                    <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-[#6d28d9]' : 'text-[#a8a29e]'}`} />
                  </div>
                  <p className="text-xs font-semibold text-[#1c1917] mt-1.5 truncate">
                    {step.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Step Visual Gauge & Metric */}
          <div className="p-6 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#78716c] font-semibold">
                  Step {activeStep + 1} of 4 · {timelineSteps[activeStep].time}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#1c1917] mt-0.5">
                  {timelineSteps[activeStep].title}
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[#78716c] block">Available Balance</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-[#6d28d9]">
                  {timelineSteps[activeStep].remaining}
                </span>
              </div>
            </div>

            {/* Visual Reservoir Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#e7e5e4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6d28d9] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${timelineSteps[activeStep].percentRemaining}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#78716c] font-mono">
                <span>0 Tokens</span>
                <span>{timelineSteps[activeStep].percentRemaining}% Available</span>
                <span>5M Full Quota</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
              {timelineSteps[activeStep].note}
            </p>
          </div>

          {/* Open 2-Column Comparative Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#f5f2eb]">
            <div className="space-y-1 text-xs">
              <strong className="text-[#ea580c] block text-xs font-semibold uppercase tracking-wider font-mono">
                Typical Monthly Quota System
              </strong>
              <p className="text-[#78716c] leading-relaxed">
                If you consume your monthly allocation during an intensive sprint, you are blocked for up to 25 days until the next calendar billing cycle.
              </p>
            </div>
            <div className="space-y-1 text-xs">
              <strong className="text-[#059669] block text-xs font-semibold uppercase tracking-wider font-mono">
                Lightning 5-Hour Continuous Renewal
              </strong>
              <p className="text-[#57534e] leading-relaxed">
                Tokens automatically reload throughout every single day. A heavy morning coding session never prevents you from working in the afternoon.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
