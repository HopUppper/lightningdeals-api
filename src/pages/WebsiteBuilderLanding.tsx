/**
 * src/pages/WebsiteBuilderLanding.tsx
 * ============================================================================
 * Public Marketing & Showcase Landing Page for LightningAPI Studio AI Website Builder
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Globe,
  Code,
  Zap,
  CheckCircle2,
  Download,
  Smartphone,
  Eye,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const WebsiteBuilderLanding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promptText, setPromptText] = useState('');

  const handleStartBuild = (promptToUse?: string) => {
    const finalPrompt = promptToUse || promptText;
    const targetUrl = user
      ? `/dashboard/builder?prompt=${encodeURIComponent(finalPrompt || 'Build a modern responsive landing page')}`
      : `/register?redirect=${encodeURIComponent(`/dashboard/builder?prompt=${encodeURIComponent(finalPrompt || 'Build a modern responsive landing page')}`)}`;
    navigate(targetUrl);
  };

  const starterChips = [
    'Yoga studio landing page',
    'Photographer portfolio',
    'Restaurant with menu',
    'SaaS analytics dashboard',
    'Online clothing store',
  ];

  const showcaseProjects = [
    {
      title: 'Masala Lane',
      category: 'Restaurant &middot; Pune',
      model: 'Claude Sonnet 5.5',
      time: '45s',
      prompt: 'A modern North Indian restaurant with menu tabs, hours, and WhatsApp ordering.',
      gradient: 'from-amber-900 to-stone-900',
    },
    {
      title: 'FlowFix Plumbing',
      category: 'Local Service &middot; Hyderabad',
      model: 'Claude Sonnet 5.5',
      time: '36s',
      prompt: 'Emergency 24/7 plumbing service with service cards and instant booking form.',
      gradient: 'from-blue-900 to-indigo-950',
    },
    {
      title: 'Aarav Mehta',
      category: 'Photographer &middot; Jaipur',
      model: 'Claude Sonnet 5.5',
      time: '40s',
      prompt: 'Editorial portrait portfolio with filtered project gallery and inquiry modal.',
      gradient: 'from-purple-900 to-zinc-950',
    },
    {
      title: 'LedgerLeaf',
      category: 'SaaS &middot; Bengaluru',
      model: 'Claude Sonnet 5.5',
      time: '42s',
      prompt: 'Executive financial dashboard with KPI cards and transaction search table.',
      gradient: 'from-emerald-950 to-teal-900',
    },
  ];

  const categoryCards = [
    {
      title: 'Landing pages',
      desc: 'A launch page with a clear offer, social proof sections, pricing tiers, and one strong call to action.',
      prompt: 'A bold landing page for a new habit-tracking app: hero with app mockup, three feature blocks, pricing with a free tier, FAQ and an email signup.',
    },
    {
      title: 'Portfolios',
      desc: 'Show your work in a gallery-first site with an about page, case-study modal, and a contact form.',
      prompt: 'A clean portfolio website for a UI designer with a project grid, case-study modals, an about section with skills, and a contact form.',
    },
    {
      title: 'Restaurants & cafés',
      desc: 'Menu, hours, location map, table reservation modal, and direct order-on-WhatsApp integration.',
      prompt: 'A cosy café website with artisanal menu, opening hours, location map section, and direct Order on WhatsApp button.',
    },
    {
      title: 'Dashboards & internal tools',
      desc: 'Charts, tables, and filters for the numbers your team checks every day.',
      prompt: 'A sales dashboard app with KPI cards, a monthly revenue chart, a deals table with status filters, and a responsive sidebar navigation.',
    },
    {
      title: 'Online stores',
      desc: 'A product catalogue with detail pages, category filters, and an interactive shopping cart.',
      prompt: 'An online clothing store with category filters, a product grid, product detail modal with size selection, and a cart with an order summary.',
    },
    {
      title: 'Events & invitations',
      desc: 'Schedule, venue, RSVP form — a single responsive page your guests can open on their phone.',
      prompt: 'A mobile-first wedding invitation website with the couple story, event schedule for three days, venue map, and an RSVP form.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#18181b] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 border-b border-[#e9e7e2] bg-radial from-violet-50/50 via-[#faf9f6] to-[#faf9f6]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100/80 text-violet-800 border border-violet-200">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>LightningAPI Studio &middot; AI website & app builder</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Describe it. <br className="hidden sm:inline" />
                  Watch it go live <br className="hidden sm:inline" />
                  in <span className="text-violet-600">minutes</span>.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Tell Studio the website or app you want. It writes the pages and code with top AI models, shows you a live interactive preview as it builds, and hands you the complete source.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs font-medium text-slate-500">
                  <span>✓ Free instant trial</span>
                  <span>&bull;</span>
                  <span>✓ Live interactive sandbox</span>
                  <span>&bull;</span>
                  <span>✓ Export complete ZIP</span>
                </div>
              </div>

              {/* Right Column: Interactive Prompt Box */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xl shadow-slate-200/50">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Describe the website or app you want
                  </label>
                  <textarea
                    rows={4}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. A website for my bakery with a menu, opening hours and an order-on-WhatsApp button..."
                    className="w-full bg-[#fbfaf8] border border-slate-200 focus:border-violet-500 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors resize-none"
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Free trial &bull; No card required
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartBuild()}
                      className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-violet-500/20 transition-all cursor-pointer"
                    >
                      <span>Build it</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Starter Chips */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Or start from an example:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {starterChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStartBuild(chip)}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-700 transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SHOWCASE SECTION */}
        <section className="py-20 border-b border-[#e9e7e2] bg-[#ffffff]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700 font-mono">
                Built with Studio
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
                Websites Studio built from one brief
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                Real Studio builds, unedited. The time and code are what each build actually took.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {showcaseProjects.map((p, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className={`h-40 bg-gradient-to-br ${p.gradient} p-4 flex flex-col justify-between text-white`}>
                    <span className="self-end px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/40 backdrop-blur-xs">
                      {p.time}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold">{p.title}</h3>
                      <p className="text-xs opacity-80" dangerouslySetInnerHTML={{ __html: p.category }} />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{p.prompt}"
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStartBuild(p.prompt)}
                      className="mt-4 w-full py-2 rounded-lg bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Build one like this</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORY GALLERY */}
        <section className="py-20 bg-[#faf9f6]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700 font-mono">
                Ideas to start from
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
                What people build with Studio
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                Each card is a ready-made prompt. Build it as-is, or open it in the builder and make it yours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryCards.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-violet-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{c.desc}</p>
                    <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 text-xs text-slate-700 leading-relaxed font-medium">
                      <span className="font-bold text-violet-700">Prompt: </span>
                      {c.prompt}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartBuild(c.prompt)}
                    className="mt-5 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Build this</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
