import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export const TrialPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryTool, setPrimaryTool] = useState('Claude Code CLI');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hi LightningDeals Team! My name is ${name} (${email}). Primary IDE: ${primaryTool}. I would like to get my 1M token trial key.`;
    const whatsappUrl = `https://wa.me/917695956938?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-12 flex items-center justify-center">
        <div className="w-full bg-white border border-border rounded-panel p-8 sm:p-10 shadow-xs space-y-6">
          
          <div className="space-y-2 text-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Instant Developer Trial
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
              Claim Free 1M Token Trial Key
            </h1>
            <p className="text-xs text-muted leading-relaxed">
              Fill in your developer details below to route to our engineering desk for instant API key issuance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-fg mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Developer Name"
                className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-fg mb-1">Work / Developer Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@example.com"
                className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-fg mb-1">Primary AI Developer Tool</label>
              <select
                value={primaryTool}
                onChange={(e) => setPrimaryTool(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="Claude Code CLI">Claude Code CLI</option>
                <option value="Cursor IDE">Cursor IDE</option>
                <option value="Windsurf Editor">Windsurf Editor</option>
                <option value="VS Code Extension">VS Code Extension</option>
                <option value="Cline / Roo Code">Cline / Roo Code</option>
              </select>
            </div>

            <div className="p-4 bg-bg border border-border rounded-control space-y-2 text-[11px] text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant key verification & 5-hour rolling token window setup.</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Direct routing to human engineering desk (+91 7695956938).</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full ui-button-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white font-bold py-3 text-xs gap-2"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Route to Engineering Desk on WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </main>

      <Footer />
    </div>
  );
};
