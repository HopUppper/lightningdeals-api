import React, { useState } from 'react';
import { MessageSquare, X, Mail, Ticket, Check, Copy, ArrowUpRight, LifeBuoy } from 'lucide-react';

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const email = 'support@apexscale.ai';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6">
      
      {/* Floating Modal Panel */}
      {isOpen && (
        <div className="mb-3 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl text-fg animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border bg-subtle/50">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent">
                Help & Support
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-fg">
                How can we help?
              </h3>
              <p className="mt-1 text-xs text-muted leading-4">
                Verify catalog state, setup guides, or open a support ticket.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-fg transition-colors"
              aria-label="Close support modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Options List */}
          <div className="p-3 space-y-1.5">
            
            {/* Public Ticket Support */}
            <a
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-subtle transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-semibold text-fg group-hover:text-accent transition-colors">
                  Open Support Ticket
                </strong>
                <small className="block text-[11px] text-muted truncate">
                  Dashboard or signed-in support path
                </small>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
            </a>

            {/* Email Support */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-subtle transition-colors group">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-semibold text-fg group-hover:text-accent transition-colors">
                    Email Support
                  </strong>
                  <small className="block text-[11px] text-muted truncate">
                    {email}
                  </small>
                </div>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                title="Copy support email"
                className="ml-2 p-2 rounded-lg text-muted hover:bg-white hover:text-accent transition-colors border border-transparent hover:border-border"
              >
                {copiedEmail ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Live Chat / WhatsApp */}
            <a
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-subtle transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-semibold text-fg group-hover:text-emerald-700 transition-colors">
                  WhatsApp Support
                </strong>
                <small className="block text-[11px] text-muted truncate">
                  Direct instant messaging assistance
                </small>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-emerald-700 transition-colors" />
            </a>

          </div>

          <div className="p-3 bg-subtle/40 border-t border-border text-[11px] text-center text-muted">
            Typical response time: &lt; 30 minutes
          </div>

        </div>
      )}

      {/* Launcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-accent px-4 py-3 font-semibold text-white shadow-e3 transition-all hover:bg-accent-hover active:scale-95"
      >
        <LifeBuoy className="h-5 w-5" />
        <span className="text-sm font-semibold">Contact Support</span>
      </button>

    </div>
  );
};
