/**
 * src/config/brand.ts
 *
 * Central Brand Configuration System for Orbit & LightningAPI.
 * Defines authoritative product names, taglines, capabilities, metadata, and visual styling tokens.
 */

export const BRAND = {
  productName: 'Orbit',
  parentPlatform: 'LightningAPI',
  tagline: 'Your AI universe. One place.',
  shortDescription: 'Orbit is your all-in-one AI workspace, powered by LightningAPI.',
  longDescription:
    'Chat with leading AI models, research the web, create documents, analyse information, code and get things done — all in one place.',
  brandRelationship: 'Orbit is powered by LightningAPI',
  websiteUrl: 'https://lightningapi.pro',
  workspacePath: '/dashboard/studio',
  builderPath: '/dashboard/builder',

  capabilities: [
    {
      id: 'chat',
      name: 'Orbit Chat',
      badge: 'Multi-Model',
      description: 'Conversational reasoning, instruction following, and unified access across frontier model families.',
    },
    {
      id: 'research',
      name: 'Orbit Research',
      badge: 'Live Web Index',
      description: 'Evidence-driven web search, product listing discovery, verified pricing, and academic retrieval.',
    },
    {
      id: 'documents',
      name: 'Orbit Documents',
      badge: 'Artifact Studio',
      description: 'Structured requirements specifications, research papers, reports, and downloadable verified files.',
    },
    {
      id: 'code',
      name: 'Orbit Code',
      badge: 'Engineering',
      description: 'Code explanation, multi-file generation, syntax validation, debugging, and terminal CLI integration.',
    },
    {
      id: 'memory',
      name: 'Orbit Memory',
      badge: 'Persistent',
      description: 'Contextual memory, user preferences, project isolation, and cross-session knowledge retention.',
    },
    {
      id: 'builder',
      name: 'Orbit Builder',
      badge: 'Interactive',
      description: 'Full-stack application and website generation with live sandboxed preview and code export.',
    },
  ],

  colors: {
    primary: '#7136E8',
    primaryHover: '#5b21b6',
    accent: '#a855f7',
    violetGlow: 'rgba(113, 54, 232, 0.25)',
  },

  meta: {
    title: 'Orbit — Your AI Universe, Powered by LightningAPI',
    description:
      'Meet Orbit, the AI workspace by LightningAPI. Chat with AI models, research, create documents, code and analyse information in one place.',
    openGraphTitle: 'Orbit by LightningAPI — Your AI Universe. One Place.',
    openGraphDescription:
      'All-in-one AI workspace: frontier models, grounded web research, document artifacts, code generation and persistent memory.',
  },
} as const;

export type BrandConfig = typeof BRAND;
