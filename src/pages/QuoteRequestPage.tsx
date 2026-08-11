import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" /> Enterprise Gateway
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Request Custom Enterprise Quote
          </h1>
          <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Specify your required token allocation and upstream rate limits. Our engineering desk will issue a custom key proposal within 1 hour.
          </p>
        </div>

        <div className="mt-8 bg-white border border-border rounded-panel p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-fg">Quote Request Submitted!</h3>
              <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
                Thank you for contacting LightningDeals. Our team is reviewing your requested token allocation ({tokenAmount}) and will issue your key quote to <span className="text-fg font-bold">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-fg mb-1">Full Name *</label>
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
                <label className="block font-semibold text-fg mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@enterprise.com"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1">Required 5-Hour Rolling Token Allocation *</label>
                <select
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500"
                >
                  <option value="5M / 5h Window">5M / 5h Window (Claude Max 5x)</option>
                  <option value="20M / 5h Window">20M / 5h Window (Claude Max 20x)</option>
                  <option value="40M / 5h Window">40M / 5h Window (Claude Max 40x)</option>
                  <option value="100M / 5h Window">100M / 5h Window (Claude Max 100x)</option>
                  <option value="250M / 5h Window">250M / 5h Window (Claude Max 250x)</option>
                  <option value="500M+ / 5h Window">500M+ / 5h Window (Enterprise Scale)</option>
                </select>
              </div>


              <div>
                <label className="block font-semibold text-fg mb-1">Primary IDE / Integration</label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-sans"
                >
                  <option value="Claude Code">Claude Code CLI</option>
                  <option value="Cursor IDE">Cursor IDE</option>
                  <option value="Windsurf">Windsurf IDE</option>
                  <option value="VS Code / Cline">VS Code / Cline / Roo Code</option>
                  <option value="Custom API Gateway">Custom API Integration</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1">Project Details / Rate Limit Requirements (Optional)</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide any additional details about your project or team token requirements..."
                  className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-control text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name || !email}
                className="ui-button-primary w-full justify-center text-xs py-3 font-bold disabled:opacity-50 gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting Quote Request...' : 'Submit Enterprise Quote Request'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
