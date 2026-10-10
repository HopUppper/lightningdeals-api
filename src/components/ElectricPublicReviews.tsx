import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquarePlus, Sparkles, ArrowRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublicReviewItem {
  id: string;
  displayName: string;
  roleOrCompany: string | null;
  rating: number;
  content: string;
  isFeatured: boolean;
  verifiedCustomer: boolean;
  createdAt: string;
}

export const ElectricPublicReviews: React.FC = () => {
  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchPublicReviews() {
      try {
        const res = await fetch('/api/public/reviews');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setReviews(data.reviews || []);
            setTotalCount(data.count || 0);
            setAverageRating(data.averageRating || null);
          }
        }
      } catch (err) {
        console.error('Failed to load public reviews:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPublicReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="reviews" className="relative py-20 sm:py-24 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans overflow-hidden">
      {/* Background Architectural Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#e7e5e4]">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#6d28d9]" />
              <span className="text-[#6d28d9] font-bold">COMMUNITY REVIEWS</span>
              <span className="text-[#d6d3d1]">·</span>
              <span>VERIFIED CUSTOMER FEEDBACK</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1c1917] leading-[1.15]">
              Built for people who build.
            </h2>

            <p className="text-sm sm:text-base text-[#57534e] leading-relaxed">
              Feedback from developers, engineering leaders, and teams routing critical agentic loops through LightningAPI.
            </p>
          </div>

          {/* Genuine Stats Pill & Feedback CTA */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {totalCount > 0 && averageRating && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono">
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-[#1c1917] ml-1">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-[#d6d3d1]">/</span>
                <span className="text-[#78716c]">{totalCount} {totalCount === 1 ? 'Review' : 'Reviews'}</span>
              </div>
            )}

            <Link
              to="/dashboard/feedback"
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#6d28d9]" />
              <span>Submit Feedback</span>
            </Link>
          </div>
        </div>

        {/* Content Area: Either Authentic Reviews or Polished Intentional Empty State */}
        {loading ? (
          <div className="py-16 text-center space-y-3 font-mono text-xs text-[#78716c]">
            <div className="w-5 h-5 border-2 border-[#6d28d9] border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading developer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Polished Intentional Empty State */
          <div className="relative rounded-2xl sm:rounded-3xl border border-[#e7e5e4] bg-white p-8 sm:p-12 text-center shadow-warm max-w-3xl mx-auto space-y-5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#f5f3ff] border border-[#ddd6fe] flex items-center justify-center text-[#6d28d9]">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c1917] tracking-tight">
                Be among the first to share your experience.
              </h3>
              <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
                LightningAPI has zero artificial ratings, fabricated avatars, or synthetic testimonials. Every review shown on this platform is submitted by an actual verified developer.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard/feedback"
                className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-xs sm:text-sm transition-all shadow-plum hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Share Your Workflow Feedback</span>
                <ArrowRight className="w-4 h-4 text-purple-200" />
              </Link>

              <Link
                to="/trial"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
              >
                Claim 1M Free Token Pass
              </Link>
            </div>

            <div className="pt-4 border-t border-[#f5f2eb] flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#78716c]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Fabricated Social Proof Guarantee</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6d28d9]" />
                <span>Independent Editorial Moderation</span>
              </span>
            </div>
          </div>
        ) : (
          /* Authentic Approved Reviews Grid (Natural Asymmetrical Lengths) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {reviews.map((item) => (
              <div
                key={item.id}
                className={`relative rounded-2xl border p-6 bg-white transition-all shadow-warm flex flex-col justify-between ${
                  item.isFeatured ? 'border-[#6d28d9]/30 ring-1 ring-[#6d28d9]/10' : 'border-[#e7e5e4]'
                }`}
              >
                <div className="space-y-4">
                  {/* Star Rating & Verified Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-500" aria-label={`${item.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating ? 'fill-current text-amber-500' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>

                    {item.verifiedCustomer && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>VERIFIED DEVELOPER</span>
                      </span>
                    )}
                  </div>

                  {/* Customer Review Content */}
                  <div className="relative">
                    <Quote className="w-5 h-5 text-stone-200 absolute -top-2.5 -left-1 pointer-events-none" />
                    <p className="text-xs sm:text-sm text-[#1c1917] leading-relaxed pt-1 whitespace-pre-line font-normal">
                      "{item.content}"
                    </p>
                  </div>
                </div>

                {/* Author Metadata Footer */}
                <div className="pt-4 mt-4 border-t border-[#e7e5e4]/70 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-[#1c1917] tracking-tight">
                      {item.displayName}
                    </h4>
                    {item.roleOrCompany && (
                      <p className="text-[11px] text-[#78716c] font-mono">
                        {item.roleOrCompany}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-[#a8a29e]">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
