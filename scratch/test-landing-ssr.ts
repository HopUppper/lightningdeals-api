import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { LandingPage, PublicPricingPage } from '../src/App';
import { DocsPage } from '../src/pages/docs/DocsPage';

function testSSR(name: string, Component: React.ComponentType, path: string) {
  try {
    const html = renderToString(
      React.createElement(StaticRouter, { location: path }, React.createElement(Component))
    );
    console.log(`✅ ${name} (${path}) SSR Succeeded! HTML length: ${html.length}`);
  } catch (err: any) {
    console.error(`❌ ${name} (${path}) SSR Threw Error:`, err.message);
    console.error(err.stack);
  }
}

console.log('Testing SSR for components...');
testSSR('DocsPage', DocsPage, '/docs');
testSSR('PublicPricingPage', PublicPricingPage, '/pricing');
testSSR('LandingPage', LandingPage, '/');
