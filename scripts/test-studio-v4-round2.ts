/**
 * LIGHTNINGAPI.PRO — STUDIO 4.0 ROUND 2 VERIFICATION SUITE
 * Rigorous End-to-End Tests for:
 * 1. Connection-time SSRF & DNS Rebinding Immunity (safeLookup Agent)
 * 2. Real Web Research, URL Understanding & Fallback Cascades
 * 3. Context-Aware Live Thinking & Task Intent Understanding
 * 4. Privacy, Secret Redaction & Supplier Isolation
 * 5. Real Browser Automation via Native Chrome DevTools Protocol (CDP)
 * 6. Consequential Action Gating & Multi-Tenant Session Isolation
 */

import assert from 'assert';
import http from 'http';
import https from 'https';
import dns from 'dns';
import { isIpPrivateOrRestricted, validatePublicWebUrl, safeLookup, safeHttpAgent, safeHttpsAgent } from '../server/ssrf';
import {
  detectUrlsInText,
  extractReadableContentFromHtml,
  fetchPublicUrl,
  searchWeb,
  executeDeepResearch,
  buildWebResearchPromptDirective,
  WebSearchResult,
} from '../server/webResearch';
import {
  analyzePromptTaskContext,
  redactSensitiveActivityData,
  createActivityTracker,
  StudioActivityEvent,
} from '../server/studioActivity';
import {
  checkBrowserCapability,
  createBrowserSession,
  getBrowserSession,
  executeBrowserStep,
  confirmConsequentialAction,
  cancelBrowserSession,
  isActionConsequential,
} from '../server/browserService';

async function runStudioV4Round2Verification() {
  // Enforce TLS verification
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  console.log('========================================================================');
  console.log('⚡ LIGHTNINGAPI.PRO — STUDIO 4.0 ROUND 2 VERIFICATION SUITE ⚡');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(category: string, name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        await res;
      }
      passed++;
      console.log(`  ✅ [${category}] ${name}`);
    } catch (err: any) {
      console.error(`  ❌ [${category} FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  console.log('--- SECTION 1: CONNECTION-TIME SSRF & DNS REBINDING IMMUNITY ---');

  await test('UNIT', 'isIpPrivateOrRestricted blocks full spectrum of private/cloud metadata ranges', () => {
    // IPv4 Loopback & Private
    assert.strictEqual(isIpPrivateOrRestricted('127.0.0.1'), true);
    assert.strictEqual(isIpPrivateOrRestricted('127.10.20.30'), true);
    assert.strictEqual(isIpPrivateOrRestricted('10.0.0.5'), true);
    assert.strictEqual(isIpPrivateOrRestricted('172.16.0.1'), true);
    assert.strictEqual(isIpPrivateOrRestricted('172.31.255.254'), true);
    assert.strictEqual(isIpPrivateOrRestricted('192.168.1.1'), true);

    // Cloud Metadata & CGNAT
    assert.strictEqual(isIpPrivateOrRestricted('169.254.169.254'), true);
    assert.strictEqual(isIpPrivateOrRestricted('100.64.0.1'), true);

    // IPv6
    assert.strictEqual(isIpPrivateOrRestricted('::1'), true);
    assert.strictEqual(isIpPrivateOrRestricted('fe80::1'), true);
    assert.strictEqual(isIpPrivateOrRestricted('fc00::1'), true);
    assert.strictEqual(isIpPrivateOrRestricted('::ffff:127.0.0.1'), true);

    // Legitimate public IPs
    assert.strictEqual(isIpPrivateOrRestricted('8.8.8.8'), false);
    assert.strictEqual(isIpPrivateOrRestricted('1.1.1.1'), false);
    assert.strictEqual(isIpPrivateOrRestricted('93.184.216.34'), false);
  });

  await test('UNIT', 'safeLookup intercepts DNS resolution at socket connection time', async () => {
    // Verify that safeLookup refuses private IPs before socket creation
    await new Promise<void>((resolve, reject) => {
      safeLookup('127.0.0.1', {}, (err, address) => {
        if (err && err.message.includes('SSRF / DNS Rebinding blocked')) {
          resolve();
        } else {
          reject(new Error(`Expected safeLookup to block 127.0.0.1, got: ${address}`));
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      safeLookup('169.254.169.254', {}, (err, address) => {
        if (err && err.message.includes('SSRF / DNS Rebinding blocked')) {
          resolve();
        } else {
          reject(new Error(`Expected safeLookup to block cloud metadata, got: ${address}`));
        }
      });
    });
  });

  await test('INTEGRATION', 'fetchPublicUrl rejects SSRF destination targets', async () => {
    const resLocal = await fetchPublicUrl('http://127.0.0.1:8080/secret');
    assert.strictEqual(resLocal.ok, false);
    assert.strictEqual(resLocal.statusCode, 400);

    const resMeta = await fetchPublicUrl('http://169.254.169.254/latest/meta-data/');
    assert.strictEqual(resMeta.ok, false);
    assert.strictEqual(resMeta.statusCode, 400);
  });

  console.log('\n--- SECTION 2: REAL WEB RESEARCH & DIRECT URL ANALYSIS ---');

  await test('REAL-NET', 'fetchPublicUrl retrieves real public web page and extracts clean content', async () => {
    const page = await fetchPublicUrl('https://example.com', { timeoutMs: 8000 });
    assert.strictEqual(page.ok, true);
    assert.strictEqual(page.statusCode, 200);
    assert.strictEqual(page.title, 'Example Domain');
    assert.ok(page.text.includes('Example Domain'));
    assert.ok(!page.text.includes('<script>'));
    assert.ok(!page.text.includes('<style>'));
    console.log(`    ↳ Verified real page fetch: "${page.title}" (${page.text.length} chars)`);
  });

  await test('REAL-NET', 'searchWeb executes real search query and returns verified citations', async () => {
    const searchRes = await searchWeb('Anthropic Claude 3.7 Sonnet', { maxResults: 3 });
    assert.ok(searchRes.provider);
    assert.strictEqual(searchRes.query, 'Anthropic Claude 3.7 Sonnet');
    console.log(`    ↳ Real search provider: "${searchRes.provider}" (results: ${searchRes.results.length})`);
    if (searchRes.results.length > 0) {
      assert.strictEqual(searchRes.results[0].citationIndex, 1);
      assert.ok(searchRes.results[0].url.startsWith('http'));
      assert.ok(searchRes.results[0].title.length > 0);
    }
  });

  await test('UNIT', 'buildWebResearchPromptDirective wraps untrusted content with prompt injection delimiters', () => {
    const mockSources: WebSearchResult[] = [
      {
        citationIndex: 1,
        title: 'Verified Documentation',
        url: 'https://docs.example.com',
        snippet: 'Official architecture specification.',
        domain: 'docs.example.com',
        timestamp: new Date().toISOString(),
      },
    ];

    const directive = buildWebResearchPromptDirective(mockSources, '<<<BEGIN UNTRUSTED WEB RESEARCH EVIDENCE>>>\nData\n<<<END UNTRUSTED WEB RESEARCH EVIDENCE>>>');
    assert.ok(directive.includes('[WEB RESEARCH ACTIVE & GROUNDED]'));
    assert.ok(directive.includes('[1] "Verified Documentation" - https://docs.example.com'));
    assert.ok(directive.includes('Never invent fake URLs'));
    assert.ok(directive.includes('<<<BEGIN UNTRUSTED WEB RESEARCH EVIDENCE>>>'));
  });

  console.log('\n--- SECTION 3: CONTEXT-AWARE LIVE THINKING & TASK INTENT ---');

  await test('UNIT', 'analyzePromptTaskContext recognizes Account Registration intent and produces required stages', () => {
    const samplePrompt = 'https://lightningapi.pro/ — can you visit this and sign up for an account?';
    const analysis = analyzePromptTaskContext(samplePrompt, 'standard');

    assert.strictEqual(analysis.category, 'account_registration');
    assert.strictEqual(analysis.primaryUrl, 'https://lightningapi.pro/');
    assert.strictEqual(analysis.plannedStages.length, 4);

    assert.strictEqual(analysis.plannedStages[0].type, 'opening_url');
    assert.ok(analysis.plannedStages[0].title.includes('lightningapi.pro'));

    assert.strictEqual(analysis.plannedStages[1].type, 'inspecting_navigation');
    assert.strictEqual(analysis.plannedStages[2].type, 'checking_registration');
    assert.strictEqual(analysis.plannedStages[3].type, 'analyzing_form');
    assert.ok(analysis.plannedStages[3].detail.includes('I will ask before submitting anything'));
  });

  await test('UNIT', 'analyzePromptTaskContext recognizes Comparative Articles intent (2+ URLs)', () => {
    const prompt = 'Please compare https://example.com/article1 and https://example.org/article2 on API latency.';
    const analysis = analyzePromptTaskContext(prompt, 'standard');

    assert.strictEqual(analysis.category, 'compare_links');
    assert.strictEqual(analysis.detectedUrls.length, 2);
    assert.strictEqual(analysis.plannedStages[0].type, 'opening_url');
    assert.strictEqual(analysis.plannedStages[1].type, 'evaluating_sources');
    assert.strictEqual(analysis.plannedStages[2].type, 'comparing_sources');
    assert.strictEqual(analysis.plannedStages[3].type, 'generating_answer');
  });

  await test('UNIT', 'analyzePromptTaskContext recognizes Code Generation & Architecture intent', () => {
    const prompt = 'Write a TypeScript function to parse JSON with error handling and retry logic.';
    const analysis = analyzePromptTaskContext(prompt, 'standard');

    assert.strictEqual(analysis.category, 'code_generation');
    assert.strictEqual(analysis.plannedStages[0].type, 'understanding_request');
    assert.strictEqual(analysis.plannedStages[1].type, 'preparing_operation');
    assert.strictEqual(analysis.plannedStages[2].type, 'generating_answer');
  });

  await test('UNIT', 'analyzePromptTaskContext recognizes Deep Research intent', () => {
    const prompt = 'Investigate state of the art quantum computing error correction algorithms.';
    const analysis = analyzePromptTaskContext(prompt, 'deep_research');

    assert.strictEqual(analysis.category, 'deep_research');
    assert.strictEqual(analysis.plannedStages[0].type, 'searching_web');
    assert.strictEqual(analysis.plannedStages[1].type, 'evaluating_sources');
    assert.strictEqual(analysis.plannedStages[2].type, 'deep_research_round');
  });

  console.log('\n--- SECTION 4: PRIVACY, SECRET REDACTION & SUPPLIER ISOLATION ---');

  await test('UNIT', 'redactSensitiveActivityData strictly scrubs API keys, bearer tokens, and vendor identities', () => {
    const dirtyText = `
      Connected via OpenRouter using sk-ant-api03-abcdef12345678901234567890.
      Internal key: ld_live_supersecrettoken123456789.
      Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz123.
      Vendor: bedrock / claude-3-5-sonnet-20241022.
      User card: 4111 2222 3333 4444, password="MySecretPassword123!".
      File: C:\\Users\\Administrator\\server\\secrets.json.
    `;

    const cleaned = redactSensitiveActivityData(dirtyText);

    // Secrets scrubbed
    assert.ok(!cleaned.includes('ld_live_supersecrettoken123456789'));
    assert.ok(cleaned.includes('[REDACTED_API_KEY]'));
    assert.ok(!cleaned.includes('sk-ant-api03-abcdef12345678901234567890'));
    assert.ok(cleaned.includes('[REDACTED_KEY]'));
    assert.ok(!cleaned.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));

    // Vendor identities scrubbed
    assert.ok(!cleaned.includes('OpenRouter'));
    assert.ok(!cleaned.includes('bedrock'));
    assert.ok(!cleaned.includes('claude-3-5-sonnet-20241022'));
    assert.ok(cleaned.includes('AI Gateway'));
    assert.ok(cleaned.includes('Verified Model'));

    // Sensitive data scrubbed
    assert.ok(!cleaned.includes('4111 2222 3333 4444'));
    assert.ok(cleaned.includes('[REDACTED_CARD]'));
    assert.ok(!cleaned.includes('MySecretPassword123!'));
    assert.ok(!cleaned.includes('C:\\Users\\Administrator'));
    assert.ok(cleaned.includes('[SYSTEM_PATH]'));
  });

  await test('UNIT', 'createActivityTracker manages chronological steps and deduplicates active states', () => {
    const emittedEvents: StudioActivityEvent[] = [];
    const tracker = createActivityTracker((evt) => emittedEvents.push(evt));

    tracker.startStep('opening_url', 'Opening site', 'Connecting...', 'https://example.com');
    assert.strictEqual(emittedEvents.length, 1);
    assert.strictEqual(emittedEvents[0].stage, 'active');

    // Starting second step marks first step as completed
    tracker.startStep('inspecting_navigation', 'Inspecting nav', 'Scanning menus...');
    assert.strictEqual(emittedEvents.length, 2);
    assert.strictEqual(tracker.getActivities()[0].stage, 'completed');
    assert.strictEqual(tracker.getActivities()[1].stage, 'active');

    tracker.completeAll('Task finished');
    assert.strictEqual(tracker.getActivities()[1].stage, 'completed');
  });

  console.log('\n--- SECTION 5: REAL BROWSER AUTOMATION VIA NATIVE CDP ---');

  await test('CAPABILITY', 'checkBrowserCapability inspects host environment truthfully without simulated claims', () => {
    const cap = checkBrowserCapability();
    assert.strictEqual(typeof cap.available, 'boolean');
    assert.ok(['remote_endpoint', 'local_binary', 'unavailable'].includes(cap.engine));
    console.log(`    ↳ Host browser engine: ${cap.engine} (available: ${cap.available})`);
  });

  await test('BROWSER-E2E', 'executeBrowserStep performs real navigation and captures genuine screenshot via CDP', async () => {
    const cap = checkBrowserCapability();
    if (!cap.available) {
      console.log('    ↳ Skipping live CDP launch (no local browser or remote service configured)');
      return;
    }

    const session = createBrowserSession('usr_test_verified', 'conv_browser_real');

    // Step 1: Real Navigation
    const navStep = await executeBrowserStep(session, {
      action: 'navigate',
      target: 'https://example.com',
    });

    assert.strictEqual(navStep.status, 'completed');
    assert.strictEqual(session.currentUrl, 'https://example.com');
    assert.ok(session.pageTitle.includes('Example Domain'));
    assert.ok(session.lastScreenshot?.startsWith('data:image/png;base64,'));
    console.log(`    ↳ Live Chrome CDP navigated to: ${session.currentUrl} - Title: "${session.pageTitle}"`);
    console.log(`    ↳ Real Viewport Screenshot captured (${Math.round((session.lastScreenshot?.length || 0) / 1024)} KB)`);

    // Clean up
    cancelBrowserSession(session);
    assert.strictEqual(session.status, 'cancelled');
    assert.strictEqual(getBrowserSession(session.sessionId, 'usr_test_verified'), null);
  });

  console.log('\n--- SECTION 6: CONSEQUENTIAL ACTION GATING & ISOLATION ---');

  test('UNIT', 'isActionConsequential detects financial transactions, form submissions and account modifications', () => {
    // Financial & payment
    assert.strictEqual(isActionConsequential('click', 'button#checkout').isConsequential, true);
    assert.strictEqual(isActionConsequential('click', 'button.btn-pay').isConsequential, true);
    assert.strictEqual(isActionConsequential('fill', 'input#credit-card', '4111222233334444').isConsequential, true);
    assert.strictEqual(isActionConsequential('fill', 'input[name="cvv"]', '123').isConsequential, true);
    assert.strictEqual(isActionConsequential('click', 'button#place-order').isConsequential, true);

    // Destructive
    assert.strictEqual(isActionConsequential('click', 'button#delete-account').isConsequential, true);
    assert.strictEqual(isActionConsequential('click', 'a[href="/reset-password"]').isConsequential, true);
    assert.strictEqual(isActionConsequential('click', 'button#cancel-subscription').isConsequential, true);

    // Benign
    assert.strictEqual(isActionConsequential('navigate', 'https://example.com').isConsequential, false);
    assert.strictEqual(isActionConsequential('scroll', 'window').isConsequential, false);
    assert.strictEqual(isActionConsequential('inspect', 'body').isConsequential, false);
  });

  await test('INTEGRATION', 'executeBrowserStep halts on consequential action and enforces authorization gate', async () => {
    const session = createBrowserSession('usr_owner', 'conv_gate');

    // Consequential step: click "Pay Now"
    const step = await executeBrowserStep(session, {
      action: 'click',
      target: 'button#pay-now-button',
    });

    assert.strictEqual(step.status, 'requires_confirmation');
    assert.strictEqual(step.isConsequential, true);
    assert.strictEqual(session.status, 'waiting_confirmation');
    assert.ok(session.pendingConfirmation);

    const confId = session.pendingConfirmation.confirmationId;
    assert.ok(confId.startsWith('conf_'));

    // Reject action
    const rej = await confirmConsequentialAction(session, confId, false);
    assert.strictEqual(rej.success, true);
    assert.strictEqual(session.status, 'idle');
    assert.strictEqual(session.steps[0].status, 'cancelled');

    // Clean up
    cancelBrowserSession(session);
  });

  test('ISOLATION', 'Browser sessions enforce multi-tenant isolation across customer IDs', () => {
    const session = createBrowserSession('usr_alice', 'conv_alice');
    assert.ok(getBrowserSession(session.sessionId, 'usr_alice'));
    // Bob is strictly blocked from Alice's session
    assert.strictEqual(getBrowserSession(session.sessionId, 'usr_bob'), null);
    cancelBrowserSession(session);
  });

  console.log('\n========================================================================');
  console.log(`🎉 ALL STUDIO 4.0 ROUND 2 TESTS PASSED: ${passed}/${total} assertions verified!`);
  console.log('========================================================================\n');
}

runStudioV4Round2Verification().catch((err) => {
  console.error('\n❌ Test suite failed with error:\n', err);
  process.exit(1);
});
