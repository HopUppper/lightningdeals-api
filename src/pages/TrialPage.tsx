import React from 'react';
import { Sparkles, MessageCircle, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Official WhatsApp Logo SVG
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export const TrialPage: React.FC = () => {
  const whatsappNumber = '+917695956938';
  const whatsappMessage = encodeURIComponent('Hi LightningDeals Team! I would like to get a free trial API key for testing.');
  const whatsappUrl = `https://wa.me/917695956938?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-16 flex items-center justify-center">
        <div className="w-full bg-card border border-border rounded-panel p-8 sm:p-10 shadow-2xl text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
            <WhatsAppIcon className="w-8 h-8" />
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <div className="ui-kicker justify-center border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Instant Developer Trial</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              Connect on WhatsApp to Get Your Trial API Key
            </h1>
            <p className="text-muted text-sm sm:text-base leading-relaxed">
              To request a free trial API key with rolling 5-hour budgets and full LLM access, chat directly with our team on WhatsApp.
            </p>
          </div>

          <div className="p-6 bg-bg border border-border rounded-control space-y-4 max-w-md mx-auto text-left text-xs text-muted">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Instant key issuance directly from our engineering desk.</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-500 shrink-0" />
              <span>5-hour rolling token allowance for Claude Code, Cursor & VS Code.</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-control bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all hover:scale-105"
            >
              <WhatsAppIcon className="w-6 h-6" />
              <span>Chat on WhatsApp (+91 7695956938)</span>
              <ArrowUpRight className="w-5 h-5 opacity-80" />
            </a>
          </div>

          <p className="text-xs font-mono text-muted">
            Direct Line: <span className="text-fg font-bold">+91 7695956938</span> • Response within 2 minutes
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
