import { prisma } from '../../db';
import { KnowledgeItem, TrainingExampleItem } from './types';

// Built-in Enterprise Seed Knowledge Base
const DEFAULT_KNOWLEDGE_ARTICLES = [
  {
    category: 'POLICY',
    title: 'Replacement and Guarantee Policy',
    content: 'All LightningDeals subscriptions come with 100% active uptime guarantee. If an account experiences any issues during your subscription period, our automated system or admin replaces it within 15 to 30 minutes without extra charge.',
    keywords: 'warranty, guarantee, replace, refund, broken, not working, valid, scam, safe',
    tags: 'policy,trust',
    priority: 10,
  },
  {
    category: 'SETUP_GUIDE',
    title: 'Post-Purchase Delivery & Onboarding',
    content: 'After completing payment via PayU, your private login credentials or API access keys are delivered directly inside this WhatsApp chat and synced to your dashboard within 5 to 15 minutes. Step-by-step setup instructions are provided immediately.',
    keywords: 'how to start, setup, activation, credentials, login, delivery time, how long, kab milega',
    tags: 'onboarding,delivery',
    priority: 9,
  },
  {
    category: 'OBJECTION',
    title: 'Why LightningDeals is Affordable & 100% Genuine',
    content: 'LightningDeals provides enterprise-volume shared seats and direct developer API bundles licensed officially at wholesale tiers. You get official features, private workspaces, and complete data privacy at up to 70% savings.',
    keywords: 'why cheap, real, fake, legit, genuine, trusted, safe, privacy, official',
    tags: 'objections,trust',
    priority: 9,
  },
  {
    category: 'PRODUCT_INFO',
    title: 'Recommendations for Software Developers & Programmers',
    content: 'For software engineering and full-stack development, our top picks are: 1. Cursor Pro AI IDE (AI code completion & codebase chat) and 2. Claude Max 5x (20M Tokens) for architecture, complex debugging, and deep refactoring.',
    keywords: 'coding, developer, programmer, software, python, javascript, react, ide, cursor, claude',
    tags: 'recommendation,developer',
    priority: 8,
  },
  {
    category: 'PRODUCT_INFO',
    title: 'Recommendations for Designers & Content Creators',
    content: 'For graphic design, social media reels, and YouTube thumbnails, Canva Pro offers unlimited templates, brand kits, and background removal. For high-end video editing and digital art, Adobe Creative Cloud and Midjourney Mega are ideal.',
    keywords: 'design, thumbnail, youtube, video, editing, canva, adobe, photoshop, premiere, midjourney',
    tags: 'recommendation,creator',
    priority: 8,
  },
  {
    category: 'SUPPORT',
    title: 'Payment Methods & Gateway Security',
    content: 'We support all major payment modes including UPI (Google Pay, PhonePe, Paytm), Net Banking, and Debit/Credit Cards processed securely via PayU with RBI-compliant encryption.',
    keywords: 'payment, pay, upi, gpay, phonepe, paytm, card, netbanking, payu, how to pay',
    tags: 'payment,faq',
    priority: 8,
  },
  {
    category: 'FAQ',
    title: 'Lightning Credits and Rewards Program',
    content: 'Every purchase on LightningAPI automatically earns you Lightning Credits (up to 5% to 15% cashback). Credits can be redeemed on future renewals or purchases. Referring a friend gives you and your friend bonus credits!',
    keywords: 'credits, cashback, coins, reward, points, referral, discount, friend, share',
    tags: 'credits,rewards',
    priority: 7,
  },
];

// Built-in Seed Training Examples (Hinglish, Slang & Typos)
const DEFAULT_TRAINING_EXAMPLES = [
  {
    inputText: 'bhai canva chahiye',
    expectedIntent: 'PRODUCT_INQUIRY',
    preferredResponse: 'Haan bilkul bhai! Canva Pro hamare paas available hai with all premium features, unlimited brand kits, AI magic tools aur cloud storage. Kya aapko personal use ke liye chahiye ya business team ke liye? Main admin se aapke liye best custom price confirm karwa deta hoon! ⚡',
    productId: 'prod_canva_pro',
    language: 'hinglish',
    tags: 'canva,hinglish,sales',
  },
  {
    inputText: 'kya rate h bhai canva ka',
    expectedIntent: 'PRICE_INQUIRY',
    preferredResponse: 'Canva Pro ke liye hamare paas special negotiated pricing hoti hai bhai! Main abhi admin ke paas aapki request bhej raha hoon taaki aapko sabse best discount mil sake. Kya aapka registered email address share kar sakte hain? ⚡',
    productId: 'prod_canva_pro',
    language: 'hinglish',
    tags: 'price,canva,hinglish',
  },
  {
    inputText: 'bhai payment krdiya maine',
    expectedIntent: 'PAYMENT_CLAIM',
    preferredResponse: 'Boht badhiya bhai! Main turant payment gateway se transaction verify kar raha hoon. Jaise hi PayU gateway se payment confirm hoti hai, aapka order fulfill ho jayega aur credentials WhatsApp par deliver ho jayenge! Ek minute dijiyega. ⚡',
    productId: null,
    language: 'hinglish',
    tags: 'payment,verification,hinglish',
  },
  {
    inputText: 'developer ke liye konsa tool best h',
    expectedIntent: 'CONSULTATIVE_RECOMMENDATION',
    preferredResponse: 'Developers ke liye Cursor Pro AI IDE sabse best recommendation hai for real-time coding & multi-file editing. Sath hi agar aapko large context aur architectural problem solving chahiye toh Claude Max 5x best hai. Aap kis language ya tech stack par kaam karte hain?',
    productId: 'prod_cursor_pro',
    language: 'hinglish',
    tags: 'coding,recommendation,hinglish',
  },
  {
    inputText: 'admin se baat krwa do / call me',
    expectedIntent: 'HUMAN_HANDOFF',
    preferredResponse: 'Sure! Maine aapki chat ko hamare human support specialist ke liye flag kar diya hai. Ek team member aapse boht jald isi chat par connect karenge. Tab tak agar koi specific sawal ho toh zaroor batayein! ⚡',
    productId: null,
    language: 'hinglish',
    tags: 'handoff,support',
  },
  {
    inputText: 'is this safe and genuine?',
    expectedIntent: 'OBJECTION_GENUINE',
    preferredResponse: 'Yes, 100%! All our tools and accounts are genuine enterprise licenses with a 100% replacement and uptime guarantee. If there are ever any login issues, our team resolves or replaces them within 15-30 minutes. Your workspace data remains completely private. 🛡️',
    productId: null,
    language: 'en',
    tags: 'objection,trust,english',
  },
];

export class KnowledgeService {
  private static seeded = false;

  /**
   * Ensures default knowledge and training items are seeded in DB on startup
   */
  static async seedDefaultsIfNeeded(): Promise<void> {
    if (this.seeded) return;
    try {
      const knowledgeCount = await prisma.aIKnowledge.count();
      if (knowledgeCount === 0) {
        for (const item of DEFAULT_KNOWLEDGE_ARTICLES) {
          await prisma.aIKnowledge.create({ data: item });
        }
      }

      const trainingCount = await prisma.aITrainingExample.count();
      if (trainingCount === 0) {
        for (const item of DEFAULT_TRAINING_EXAMPLES) {
          await prisma.aITrainingExample.create({ data: item });
        }
      }
      this.seeded = true;
    } catch (e: any) {
      console.warn('[KNOWLEDGE SEED WARN]', e.message);
    }
  }

  /**
   * Semantic/Keyword Search for relevant knowledge base entries
   */
  static async searchKnowledge(query: string, category?: string, limit: number = 3): Promise<KnowledgeItem[]> {
    await this.seedDefaultsIfNeeded();
    const cleanQuery = (query || '').toLowerCase().trim();
    const tokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    const allItems = await prisma.aIKnowledge.findMany({
      where: {
        enabled: true,
        ...(category && { category: { equals: category, mode: 'insensitive' } }),
      },
      orderBy: { priority: 'desc' },
    });

    if (tokens.length === 0) {
      return allItems.slice(0, limit);
    }

    // Score items by token matches in title, content, keywords, and tags
    const scored = allItems.map((item) => {
      let score = item.priority;
      const haystack = `${item.title} ${item.content} ${item.keywords || ''} ${item.tags || ''}`.toLowerCase();
      for (const token of tokens) {
        if (haystack.includes(token)) score += 3;
      }
      return { item, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.item);
  }

  /**
   * Search for few-shot training examples matching user query
   */
  static async getRelevantTrainingExamples(query: string, limit: number = 3): Promise<TrainingExampleItem[]> {
    await this.seedDefaultsIfNeeded();
    const cleanQuery = (query || '').toLowerCase().trim();
    const tokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    const allExamples = await prisma.aITrainingExample.findMany({
      where: { enabled: true },
      take: 50,
    });

    if (tokens.length === 0) return allExamples.slice(0, limit);

    const scored = allExamples.map((ex) => {
      let score = 0;
      const haystack = `${ex.inputText} ${ex.expectedIntent} ${ex.tags || ''}`.toLowerCase();
      if (haystack.includes(cleanQuery)) score += 10;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 2;
      }
      return { ex, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.ex);
  }
}
