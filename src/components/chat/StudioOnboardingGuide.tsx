import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Cpu,
  Brain,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export interface StudioOnboardingGuideProps {
  open: boolean;
  onClose: () => void;
  isDarkTheme?: boolean;
}

interface StepItem {
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

const ONBOARDING_STEPS: StepItem[] = [
  {
    icon: Sparkles,
    badge: 'Welcome to Studio 2.0',
    badgeColor: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800/40',
    title: 'Your Workspace for Thinking, Creating & Building',
    subtitle: 'A unified AI workspace engineered for speed, high-precision engineering, and complex documents.',
    description:
      'LightningAPI Studio 2.0 brings together frontier Claude models, sandboxed interactive artifacts, automated context memory, and instant document generation in a serene, approachable interface.',
    highlights: [
      'Warm light-first design matching the LightningAPI dashboard',
      'Real-time token metrics, savings indicators, and audit logging',
      'Direct, zero-lag streaming with transparent model provenance',
    ],
  },
  {
    icon: Compass,
    badge: 'Effortless Navigation',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/40',
    title: 'Organized into 3 Simple Spaces',
    subtitle: 'Sidebar designed for focus: Create, Workspace, and Library.',
    description:
      'Keep your workflow clean and uncluttered. Easily start new tasks, group chats by project, and access previously generated documents or archives.',
    highlights: [
      'Create: Instant new blank chat or project-assigned workspace',
      'Workspace: Active conversations categorized by project and recent activity',
      'Library: Searchable archived conversations and generated file deliverables',
    ],
  },
  {
    icon: Cpu,
    badge: 'Frontier Intelligence',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/40',
    title: 'Capability-Aware Model Switching',
    subtitle: 'Claude Sonnet 5.5, Claude Opus 5.5 & Claude 3.7 Sonnet at your fingertips.',
    description:
      'Switch models mid-thread or compare responses side-by-side. Enable Extended Thinking for complex architecture and multi-step logic.',
    highlights: [
      'Claude Sonnet 5.5: Fast, agentic coding and multi-file refactoring',
      'Claude Opus 5.5: Deep logic, math, and system design',
      'Extended Thinking: Inspectable step-by-step reasoning buffer',
    ],
  },
  {
    icon: Brain,
    badge: 'Automatic Memory',
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/40',
    title: 'Learns Your Preferences Automatically',
    subtitle: 'Zero tedious configuration. Studio extracts guidelines and tech stacks as you chat.',
    description:
      'Tell the assistant "I prefer TypeScript" or "we use Tailwind and Next.js" and Studio retains the preference across conversations with automatic secret and PII redaction.',
    highlights: [
      'Automatic preference extraction without manual forms',
      'Bounded retrieval (max 5 items / 500 chars) prevents context bloat',
      'Full user control: inspect, edit, clear, or toggle off at any time',
    ],
  },
  {
    icon: FileSpreadsheet,
    badge: 'Authentic Outputs',
    badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/40',
    title: 'Direct Document & Spreadsheet Generator',
    subtitle: 'Export real Word (.docx), Excel (.xlsx), PDF, CSV, and Markdown files.',
    description:
      'Generate authentic OpenXML Word documents and Excel workbooks directly from your conversation data with one click—no third-party converters or mock placeholders.',
    highlights: [
      'Real .docx documents with styled headings and tables',
      'Real .xlsx spreadsheets with multiple tabs and formatted cells',
      'Production-ready PDF, CSV, and Markdown exports',
    ],
  },
  {
    icon: Layers,
    badge: 'Interactive Canvas',
    badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/40',
    title: 'Artifacts, Web Research & Skills',
    subtitle: 'Live sandboxed preview, web research, and expert agent personas.',
    description:
      'Render HTML and React components live side-by-side in the Artifact Canvas. Run real-time web searches or activate custom engineering skills.',
    highlights: [
      'Live sandbox preview for HTML, SVG, and interactive UI components',
      'Deep research and live web search with citations',
      'Curated personas: Senior Architect, Security Auditor, Test Specialist',
    ],
  },
];

export const StudioOnboardingGuide: React.FC<StudioOnboardingGuideProps> = ({
  open,
  onClose,
  isDarkTheme = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!open) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  const handleFinish = () => {
    localStorage.setItem('lightning_studio_onboarding_completed_v2', 'true');
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all flex flex-col ${
          isDarkTheme
            ? 'bg-[#141C30] border-[#28334B] text-[#F3F5FC]'
            : 'bg-white border-[#E9E4DD] text-[#171717]'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/60' : 'border-[#E9E4DD] bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${step.badgeColor}`}
            >
              {step.badge}
            </span>
            <span
              className={`text-xs font-mono font-medium ${
                isDarkTheme ? 'text-[#77839E]' : 'text-[#8E8A83]'
              }`}
            >
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isDarkTheme
                ? 'border-[#28334B] hover:bg-[#19233A] text-[#A5B0C7]'
                : 'border-[#E9E4DD] hover:bg-[#F5F2EE] text-[#625F5A]'
            }`}
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  isDarkTheme
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-violet-900/30'
                    : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/20'
                }`}
              >
                <StepIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{step.title}</h3>
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    isDarkTheme ? 'text-[#A5B0C7]' : 'text-[#625F5A]'
                  }`}
                >
                  {step.subtitle}
                </p>
              </div>
            </div>

            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isDarkTheme ? 'text-[#A5B0C7]' : 'text-[#625F5A]'
              }`}
            >
              {step.description}
            </p>

            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isDarkTheme
                  ? 'bg-[#0E1425]/50 border-[#28334B]'
                  : 'bg-[#FAF8F5] border-[#E9E4DD]'
              }`}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDarkTheme ? 'text-[#77839E]' : 'text-[#8E8A83]'
                }`}
              >
                Key Highlights
              </p>
              <div className="space-y-2">
                {step.highlights.map((hl, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className={isDarkTheme ? 'text-[#F3F5FC]' : 'text-[#171717]'}>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {ONBOARDING_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentStep
                    ? 'w-6 bg-violet-600'
                    : isDarkTheme
                    ? 'w-2 bg-[#28334B] hover:bg-[#3d4c6d]'
                    : 'w-2 bg-[#E9E4DD] hover:bg-[#c8c2b9]'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isDarkTheme ? 'border-[#28334B] bg-[#0E1425]/40' : 'border-[#E9E4DD] bg-[#FAF8F5]'
          }`}
        >
          <button
            type="button"
            onClick={handleFinish}
            className={`text-xs font-semibold cursor-pointer transition-colors ${
              isDarkTheme
                ? 'text-[#77839E] hover:text-[#F3F5FC]'
                : 'text-[#8E8A83] hover:text-[#171717]'
            }`}
          >
            Skip Walkthrough
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                  isDarkTheme
                    ? 'border-[#28334B] bg-[#19233A] text-[#F3F5FC] hover:bg-[#202b47]'
                    : 'border-[#E9E4DD] bg-white text-[#171717] hover:bg-[#F5F2EE]'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/20 transition-all"
            >
              <span>{isLast ? 'Get Started' : 'Continue'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
