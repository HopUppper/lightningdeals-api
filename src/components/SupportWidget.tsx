import React, { useState } from 'react';
import { MessageSquare, X, ArrowUpRight, LifeBuoy } from 'lucide-react';

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const WHATSAPP_URL = "https://wa.me/917980313066?text=Hi%20LightningDeals%20Support!%20I%20need%20help%20with%20my%20API%20key.";

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6">
      
      {/* Floating Modal Panel */}
      {isOpen && (
        <div className="mb-3 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl text-fg animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border bg-subtle/50 font-sans">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                Help & Support
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-fg">
                How can we help?
              </h3>
              <p className="mt-1 text-xs text-muted leading-4">
                Chat directly with our technical support desk on WhatsApp for instant assistance.
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

          {/* Single Option: WhatsApp Support Only */}
          <div className="p-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all group font-sans"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                  WhatsApp Support
                </strong>
                <small className="block text-[11px] text-muted truncate mt-0.5">
                  Direct instant messaging assistance
                </small>
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700 transition-colors shrink-0" />
            </a>
          </div>

          <div className="p-3 bg-subtle/40 border-t border-border text-[11px] text-center text-muted font-mono">
            Typical response time: &lt; 15 minutes
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95"
        aria-label="Toggle support help desk"
      >
        <LifeBuoy className="h-4 w-4" />
        <span>Contact Support</span>
      </button>

    </div>
  );
};
