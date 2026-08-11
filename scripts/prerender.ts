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
}

const routes: RouteConfig[] = [
  {
    path: '/',
    outFile: 'index.html',
    component: LandingPage,
    title: 'LightningDeals — High-Performance Claude AI API Gateway',
    description: 'LightningDeals provides drop-in Anthropic API compatibility for Claude Code CLI, Cursor, Windsurf, and VS Code with 5-hour rolling token windows.',
  },
  {
    path: '/docs',
    outFile: 'docs.html',
    component: DocsPage,
    title: 'Setup Guide & Technical Documentation — LightningDeals AI Gateway',
    description: 'Official setup guide for npx lightningdeals CLI, Claude Code CLI, Cursor, Windsurf, VS Code, and API integration examples.',
  },
  {
    path: '/pricing',
    outFile: 'pricing.html',
    component: PublicPricingPage,
    title: 'Prepaid Token Packages — LightningDeals AI Gateway',
    description: 'Prepaid token packages for Claude 3.5 Sonnet, Claude Fable 5, Opus, and Haiku. No recurring subscription, pay per token allowance.',
  },
  {
    path: '/models',
    outFile: 'models.html',
    component: ModelsPage,
    title: 'Live Models Catalog — LightningDeals AI Gateway',
    description: 'Explore all supported Claude models: Claude Fable 5, Sonnet 5, Sonnet 3.5, Opus 3, and Haiku 3.5 with 1M context windows.',
  },
  {
    path: '/status',
    outFile: 'status.html',
    component: StatusPage,
    title: 'Live Gateway System Status — LightningDeals',
    description: 'Real-time operational status, sub-50ms routing latency, and uptime metrics for LightningDeals AI API Gateway.',
  },
  {
    path: '/check-key',
    outFile: 'check-key.html',
    component: CheckKeyPage,
    title: 'Check API Key Status & Usage — LightningDeals',
    description: 'Inspect your active API key rolling window balance, RPM rate limits, and latest 20 request activity logs.',
  },
  {
    path: '/trial',
    outFile: 'trial.html',
    component: TrialPage,
    title: 'Claim Free 1M Token Trial Key — LightningDeals',
    description: 'Claim a free 1,000,000 token trial API key for Claude Code CLI, Cursor, and Windsurf directly via WhatsApp.',
  },
  {
    path: '/request-quote',
    outFile: 'request-quote.html',
    component: QuoteRequestPage,
    title: 'Custom Enterprise API Quote — LightningDeals',
    description: 'Request custom high-volume token quotas and enterprise rate limits for development teams.',
  },
  {
    path: '/terms',
    outFile: 'terms.html',
    component: TermsPage,
    title: 'Terms of Service — LightningDeals AI Gateway',
    description: 'Terms of service agreement for LightningDeals API Gateway services.',
  },
  {
    path: '/privacy',
    outFile: 'privacy.html',
    component: PrivacyPage,
    title: 'Privacy Policy — LightningDeals AI Gateway',
    description: 'Privacy policy and zero prompt logging practices for LightningDeals API Gateway.',
  },
  {
    path: '/refund',
    outFile: 'refund.html',
    component: RefundPage,
    title: 'Refund Policy — LightningDeals AI Gateway',
    description: 'Refund policy and token credit adjustment policy for prepaid packages.',
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

    // Inject SEO title and meta description
    if (route.title) {
      html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);
    }

    if (route.description) {
      if (html.includes('<meta name="description"')) {
        html = html.replace(/<meta name="description".*?>/, `<meta name="description" content="${route.description}">`);
      } else {
        html = html.replace('</head>', `  <meta name="description" content="${route.description}">\n</head>`);
      }
    }

    const targetPath = path.resolve(distDir, route.outFile);
    fs.writeFileSync(targetPath, html, 'utf-8');
    console.log(`✅ Pre-rendered ${route.path} -> dist/${route.outFile} (${(html.length / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    console.error(`❌ Failed to pre-render ${route.path}:`, err);
  }
}

console.log('🎉 SSG Pre-rendering complete!');
