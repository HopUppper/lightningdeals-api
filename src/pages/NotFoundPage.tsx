import React from 'react';
import { HelpCircle, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen min-h-screen bg-[#fafaf9] text-zinc-950 flex flex-col font-sans antialiased">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center p-6 max-w-4xl mx-auto w-full my-12">
        <div className="text-center space-y-6 max-w-lg bg-white border border-[#ede8e1] rounded-2xl p-8 sm:p-12 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200/60 flex items-center justify-center mx-auto shadow-2xs font-mono text-2xl font-bold">
            404
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span>Page Not Found</span>
            </span>
            <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
              Page Not Located
            </h1>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              The page you are looking for does not exist or may have been relocated.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="/"
              className="py-2.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </a>
            <button
              onClick={() => window.history.back()}
              className="py-2.5 px-5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 font-semibold text-xs transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NotFoundPage;
