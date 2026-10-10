import React from 'react';
import { HelpCircle, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 max-w-4xl mx-auto w-full my-12">
        <div className="text-center space-y-6 max-w-lg bg-white border border-[#e5e7eb] rounded-xl p-8 sm:p-12 shadow-xs">
          <div className="w-16 h-16 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-xs font-mono text-xl font-bold">
            404
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>Page Not Found</span>
            </span>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Page Not Located
            </h1>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              The page you are looking for does not exist or may have been relocated.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="/"
              className="ui-button-brand py-2.5 px-4 text-xs font-semibold gap-2 justify-center rounded-lg shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </a>
            <button
              onClick={() => window.history.back()}
              className="ui-button-secondary py-2.5 px-4 text-xs font-semibold gap-2 justify-center rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
