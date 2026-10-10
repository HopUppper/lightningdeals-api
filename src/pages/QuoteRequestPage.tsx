import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Zap, ShieldCheck, MessageSquare, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const QuoteRequestPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tokenAmount, setTokenAmount] = useState('20M / 5h Window');
  const [useCase, setUseCase] = useState('Claude Code');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          tokenAmount,
          useCase,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to submit quote request.');
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError('Network error submitting quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12 sm:py-16">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200">
            <span>Custom Capacity & Enterprise</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Request a Custom Plan
          </h1>
          <p className="text-[#4b5563] text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Need high-volume token allocations, multiple team seats, or custom rate limits? Let us know what you need and our team will get in touch quickly.
          </p>
        </div>

        <div className="mt-8 bg-white border border-[#e5e7eb] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* WhatsApp Direct Chat Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  Prefer Instant Answers on WhatsApp?
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Chat directly with our support desk for instant custom quotas and quotes.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/917695956938?text=Hi%20LightningDeals!%20I%20want%20to%20request%20a%20custom%20API%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-2xl shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span>WhatsApp Chat</span>
            </a>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-fg">Quote Request Received!</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-md mx-auto">
                Thank you for reaching out. Our team is reviewing your requested allocation ({tokenAmount}) and will send a proposal to <strong className="text-fg">{email}</strong> shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-fg uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-border/80 rounded-2xl focus:outline-none focus:border-violet-500 text-fg shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-fg uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-border/80 rounded-2xl focus:outline-none focus:border-violet-500 text-fg shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-fg uppercase tracking-wider">
                  Required 5-Hour Token Allocation *
                </label>
                <select
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-border/80 rounded-2xl focus:outline-none focus:border-violet-500 text-fg shadow-2xs cursor-pointer"
                >
                  <option value="5M / 5h Window">5M / 5h Window (Claude Max 5x)</option>
                  <option value="20M / 5h Window">20M / 5h Window (Claude Max 20x)</option>
                  <option value="40M / 5h Window">40M / 5h Window (Claude Max 40x)</option>
                  <option value="100M / 5h Window">100M / 5h Window (Claude Max 100x)</option>
                  <option value="250M / 5h Window">250M / 5h Window (Claude Max 250x)</option>
                  <option value="500M+ / 5h Window">500M+ / 5h Window (Enterprise Scale)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-fg uppercase tracking-wider">
                  Primary Tool or Environment
                </label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-border/80 rounded-2xl focus:outline-none focus:border-violet-500 text-fg shadow-2xs cursor-pointer"
                >
                  <option value="Claude Code">Claude Code CLI</option>
                  <option value="Cursor IDE">Cursor IDE</option>
                  <option value="Windsurf">Windsurf IDE</option>
                  <option value="VS Code / Cline">VS Code / Cline / Roo Code</option>
                  <option value="Custom API Gateway">Custom Application API</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-fg uppercase tracking-wider">
                  Project Details or Requirements (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share any special requirements or number of team members..."
                  className="w-full p-4 text-xs bg-white border border-border/80 rounded-2xl focus:outline-none focus:border-violet-500 text-fg shadow-2xs resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name || !email}
                className="ui-button-primary w-full justify-center text-xs py-3 font-bold rounded-2xl shadow-md cursor-pointer disabled:opacity-50 gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting Request...' : 'Submit Quote Request'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuoteRequestPage;
