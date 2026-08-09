import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const QuoteRequestPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tokenAmount, setTokenAmount] = useState('100M Tokens');
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
          <div className="ui-kicker justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>Prepaid Token Gateway</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Request a Custom Token Quote
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Select your required AI token allocation. LightningDeals will review your project and email a custom prepaid key proposal.
          </p>
        </div>

        <div className="mt-8 bg-card border border-border rounded-panel p-6 sm:p-8 shadow-xl">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-fg">Quote Request Submitted!</h3>
              <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
                Thank you for contacting LightningDeals. Our team is reviewing your requested token allocation ({tokenAmount}) and will issue your key quote to <span className="text-fg font-bold">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vikram Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Work or Personal Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@enterprise.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Required Token Allocation *</label>
                <select
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                >
                  <option value="10M Tokens">10 Million Tokens (Starter Allocation)</option>
                  <option value="40M Tokens">40 Million Tokens (Developer Allocation)</option>
                  <option value="100M Tokens">100 Million Tokens (Power User Allocation)</option>
                  <option value="250M Tokens">250 Million Tokens (Team Allocation)</option>
                  <option value="500M Tokens">500 Million Tokens (Scale Allocation)</option>
                  <option value="1B+ Tokens">1 Billion+ Tokens (Enterprise Allocation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Primary IDE / Tool</label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                >
                  <option value="Claude Code">Claude Code CLI</option>
                  <option value="Cursor IDE">Cursor IDE</option>
                  <option value="Windsurf">Windsurf IDE</option>
                  <option value="VS Code / Cline">VS Code / Cline / Roo Code</option>
                  <option value="Custom API Gateway">Custom API Integration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Message / Requirements (Optional)</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide any additional details about your project or team token requirements..."
                  className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs flex items-center gap-2">
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
                <span>{loading ? 'Submitting Quote Request...' : 'Submit Quote Request'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
