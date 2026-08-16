import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ModelCatalog } from '../components/ModelCatalog';
import { DeveloperEcosystem } from '../components/DeveloperEcosystem';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const whatsappUrl = `https://wa.me/917695956938?text=${encodeURIComponent('Hi LightningDeals Team! I would like to get a free trial API key for testing.')}`;

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 space-y-8">
        {/* Models Header */}
        <section className="py-16 sm:py-20 border-b border-border bg-card/40">
          <div className="max-w-page mx-auto px-5 sm:px-6 text-center space-y-4 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Dedicated Claude LLM Catalog</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg">
              The Entire Claude Model Lineup
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Access Claude Opus 5, Claude Fable 5, Claude Sonnet 5, Claude Haiku 4.5... and many more through one base URL with 5-hour rolling token windows.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="ui-button-primary text-xs py-2.5 px-5 font-bold">
                Get Trial Key on WhatsApp
              </a>
              <Link to="/docs" className="ui-button-secondary text-xs py-2.5 px-5 font-semibold">
                Explore Setup Guides
              </Link>
            </div>
          </div>
        </section>

        {/* Model Catalog Grid & Filters */}
        <ModelCatalog />

        {/* Supported Developer Stack */}
        <DeveloperEcosystem />
      </main>

      <Footer />
    </div>
  );
};
