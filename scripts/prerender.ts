import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';

// Component imports
import { LandingPage, PublicPricingPage } from '../src/App';
import { DocsPage } from '../src/pages/docs/DocsPage';
import { ModelsPage } from '../src/pages/ModelsPage';
import { StatusPage } from '../src/pages/StatusPage';
import { CheckKeyPage } from '../src/pages/CheckKeyPage';
import { TrialPage } from '../src/pages/TrialPage';
import { QuoteRequestPage } from '../src/pages/QuoteRequestPage';
import { TermsPage } from '../src/pages/TermsPage';
import { PrivacyPage } from '../src/pages/PrivacyPage';
import { RefundPage } from '../src/pages/RefundPage';

const distDir = path.resolve(process.cwd(), 'dist');
const templatePath = path.resolve(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('Error: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');

interface RouteConfig {
  path: string;
  outFile: string;
  component: React.ComponentType;
  title: string;
  description: string;
  schemaType?: string;
  schemaJson?: any;
}

const BASE_URL = 'https://lightningapi.pro';

const routes: RouteConfig[] = [
  {
    path: '/',
    outFile: 'index.html',
    component: LandingPage,
    title: 'LightningDeals — Claude-Compatible AI API Gateway for Developers',
    description: 'High-performance Claude AI API gateway for developers. Access the full Claude model lineup with drop-in Anthropic compatibility, sub-50ms latency, and 5-hour rolling token windows.',
    schemaJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${BASE_URL}/#website`,
          url: BASE_URL,
          name: 'LightningDeals API Gateway',
          description: 'Claude-compatible AI API Gateway for developers, Claude Code CLI, Cursor, and Windsurf.',
          publisher: {
            '@type': 'Organization',
            name: 'LightningDeals',
            url: BASE_URL,
          },
        },
        {
          '@type': 'SoftwareApplication',
          name: 'LightningDeals AI Gateway',
          operatingSystem: 'Cross-platform (macOS, Windows, Linux)',
          applicationCategory: 'DeveloperApplication',
          url: BASE_URL,
          offers: {
            '@type': 'Offer',
            price: '0.00',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is LightningDeals?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'LightningDeals is a high-performance AI API gateway providing drop-in Anthropic API protocol compatibility (/v1/messages) for Claude Code CLI, Cursor IDE, Windsurf, VS Code, and custom applications.',
              },
            },
            {
              '@type': 'Question',
              name: 'How does the 5-hour rolling token window work?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Your token allowance is calculated over a continuous 5-hour rolling window. Used tokens automatically replenish as past usage ages past the 5-hour mark.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do I set up Claude Code with LightningDeals?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Simply run npx lightningdeals in your terminal or set ANTHROPIC_BASE_URL=https://lightningapi.pro and ANTHROPIC_AUTH_TOKEN=your_ld_live_key.',
              },
            },
          ],
        },
      ],
    },
  },
  {
    path: '/docs',
    outFile: 'docs.html',
    component: DocsPage,
    title: 'Developer Documentation & Setup Guide — LightningDeals AI Gateway',
    description: 'Official developer documentation for LightningDeals API Gateway. Setup guides for npx lightningdeals CLI, Claude Code, Cursor, Windsurf, cURL, and OpenAI-compatible SDKs.',
    schemaJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          headline: 'LightningDeals Developer Documentation & Setup Guide',
          description: 'Step-by-step setup guides for Claude Code CLI, Cursor, Windsurf, and custom API SDKs.',
          url: `${BASE_URL}/docs`,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Documentation', item: `${BASE_URL}/docs` },
          ],
        },
      ],
    },
  },
  {
    path: '/pricing',
    outFile: 'pricing.html',
    component: PublicPricingPage,
    title: 'Prepaid Token Packages & Pricing — LightningDeals AI Gateway',
    description: 'Explore prepaid token package allocations for Claude 3.5 Sonnet, Opus, and Haiku. Contact our WhatsApp help desk for custom developer quotes.',
    schemaJson: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${BASE_URL}/pricing` },
      ],
    },
  },
  {
    path: '/models',
    outFile: 'models.html',
    component: ModelsPage,
    title: 'Supported Models Catalog — LightningDeals AI Gateway',
    description: 'Explore supported Claude models: Sonnet 3.5, Opus 3, and Haiku 3.5 with 1M context windows, tool calling, and streaming SSE responses.',
    schemaJson: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Models', item: `${BASE_URL}/models` },
      ],
    },
  },
  {
    path: '/status',
    outFile: 'status.html',
    component: StatusPage,
    title: 'Live System Health & Operational Status — LightningDeals',
    description: 'Real-time operational status, database query latency, sub-50ms API proxy routing, and system availability for LightningDeals AI Gateway.',
    schemaJson: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Status', item: `${BASE_URL}/status` },
      ],
    },
  },
  {
    path: '/check-key',
    outFile: 'check-key.html',
    component: CheckKeyPage,
    title: 'Check API Key Status & Activity Logs — LightningDeals',
    description: 'Inspect active API key rolling window token balance, RPM rate limits, and latest 20 request activity logs in real time.',
  },
  {
    path: '/trial',
    outFile: 'trial.html',
    component: TrialPage,
    title: 'Claim Free 1M Token Trial Key — LightningDeals',
    description: 'Claim a free 1,000,000 token trial API key for Claude Code CLI, Cursor, and Windsurf directly via WhatsApp support.',
  },
  {
    path: '/request-quote',
    outFile: 'request-quote.html',
    component: QuoteRequestPage,
    title: 'Custom Enterprise API Quote — LightningDeals',
    description: 'Request custom high-volume token allocations and enterprise rate limits for engineering teams.',
  },
  {
    path: '/terms',
    outFile: 'terms.html',
    component: TermsPage,
    title: 'Terms of Service — LightningDeals AI Gateway',
    description: 'Terms of service agreement and acceptable use policy for LightningDeals API Gateway.',
  },
  {
    path: '/privacy',
    outFile: 'privacy.html',
    component: PrivacyPage,
    title: 'Privacy Policy & Zero Prompt Storage — LightningDeals',
    description: 'Privacy policy, zero prompt storage rules, and telemetry data protection policies for LightningDeals.',
  },
  {
    path: '/refund',
    outFile: 'refund.html',
    component: RefundPage,
    title: 'Refund Policy — LightningDeals AI Gateway',
    description: 'Refund policy and token credit adjustment policy for prepaid API packages.',
  },
];

console.log('⚡ Starting SSG Pre-rendering for LightningDeals marketing pages...');

for (const route of routes) {
  try {
    const appHtml = renderToString(
      React.createElement(StaticRouter, { location: route.path }, React.createElement(route.component))
    );

    let html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    const canonicalUrl = `${BASE_URL}${route.path === '/' ? '' : route.path}`;

    // 1. Title Tag
    if (route.title) {
      html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);
    }

    // 2. Meta Description
    if (route.description) {
      if (html.includes('<meta name="description"')) {
        html = html.replace(/<meta name="description".*?>/, `<meta name="description" content="${route.description}">`);
      } else {
        html = html.replace('</head>', `  <meta name="description" content="${route.description}">\n</head>`);
      }
    }

    // 3. SEO Head Injection: Canonical, Open Graph, Twitter Cards, and JSON-LD
    const headExtra = `
    <!-- Canonical URL -->
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph Social Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:site_name" content="LightningDeals" />
    <meta property="og:image" content="${BASE_URL}/og-banner.png" />

    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${BASE_URL}/og-banner.png" />

    ${route.schemaJson ? `<!-- Structured Data JSON-LD -->\n    <script type="application/ld+json">\n    ${JSON.stringify(route.schemaJson, null, 2)}\n    </script>` : ''}
    `;

    html = html.replace('</head>', `${headExtra}\n</head>`);

    const targetPath = path.resolve(distDir, route.outFile);
    fs.writeFileSync(targetPath, html, 'utf-8');
    console.log(`✅ Pre-rendered ${route.path} -> dist/${route.outFile} (${(html.length / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    console.error(`❌ Failed to pre-render ${route.path}:`, err);
  }
}

console.log('🎉 SSG Pre-rendering complete!');
