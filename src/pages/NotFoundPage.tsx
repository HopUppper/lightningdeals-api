import React from 'react';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-6 max-w-lg">
          <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-600/20 text-violet-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
              404 Page Not Found
            </span>
            <h1 className="text-3xl font-bold text-fg">Page does not exist</h1>
            <p className="text-sm text-muted leading-relaxed">
              The page or resource you requested could not be located on the LightningDeals API Gateway platform.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <a
              href="/"
              className="ui-button-primary py-2.5 px-5 text-sm font-semibold gap-2 justify-center"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </a>
            <button
              onClick={() => window.history.back()}
              className="ui-button-secondary py-2.5 px-5 text-sm font-semibold gap-2 justify-center"
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
