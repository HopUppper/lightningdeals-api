import React, { useState } from 'react';
import { MessageSquare, X, ArrowUpRight, LifeBuoy } from 'lucide-react';

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const WHATSAPP_URL = "https://wa.me/917695956938?text=Hi%20LightningDeals%20Support!%20I%20need%20help%20with%20my%20API%20key.";

  return (
    <div className="fixed right-3 bottom-3 z-30 flex flex-col items-end sm:right-6 sm:bottom-6">
      
      {/* Floating Modal Panel */}
      {isOpen && (
        <div className="mb-3 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#e7e5e4] bg-[#fbf9f5] shadow-warm text-[#1c1917] animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans">
          
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#e7e5e4] bg-[#f5f2eb]">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#059669]">
                Support & Inquiries
              </p>
              <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-[#1c1917]">
                How can we help?
              </h3>
              <p className="mt-1 text-xs text-[#57534e] leading-relaxed">
                Connect directly with our engineering support desk on WhatsApp for instant assistance.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-[#78716c] hover:bg-[#e7e5e4] hover:text-[#1c1917] transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close support dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action Link: WhatsApp */}
          <div className="p-3.5 bg-white">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#059669] text-white shadow-xs">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-bold text-[#065f46]">
                  WhatsApp Engineering Desk
                </strong>
                <small className="block text-[11px] text-[#047857] truncate mt-0.5">
                  Direct instant messaging assistance
                </small>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#059669] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>
          </div>

          <div className="px-4 py-2.5 bg-[#fdfbf7] border-t border-[#e7e5e4] text-[11px] text-center text-[#78716c] font-mono">
            Typical response: &lt; 15 minutes
          </div>
        </div>
      )}

      {/* Trigger Button: Sleek icon button on mobile, subtle pill on desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-[#1c1917] hover:bg-[#059669] text-white p-2.5 sm:px-3.5 sm:py-2 text-xs font-semibold shadow-warm transition-all cursor-pointer border border-[#e7e5e4]/20"
        aria-label="Toggle support desk"
      >
        <LifeBuoy className="h-4 w-4 text-[#a7f3d0]" />
        <span className="hidden sm:inline">Engineering Support</span>
      </button>

    </div>
  );
};
