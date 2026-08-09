import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-20 text-center flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-lg">
          <Zap className="w-8 h-8 fill-current" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">404 Error</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Page not found
          </h1>
          <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            The page or route you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/" className="ui-button-primary text-xs py-3 px-6 gap-2 font-bold inline-flex items-center">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to LightningDeals</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
