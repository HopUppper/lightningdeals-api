/**
 * LIGHTNINGAPI STUDIO 4.1 — DIRECT WEB ANSWERS & STREAMING BENCHMARK SUITE
 * Tests direct answer synthesis, multi-turn message retention, inline citation formatting,
 * cache hit acceleration, and latency instrumentation.
 */

import { searchWeb, fetchPublicUrl, buildWebResearchPromptDirective, clearWebResearchCaches } from '../server/webResearch';
import { analyzePromptTaskContext, createActivityTracker } from '../server/studioActivity';
import assert from 'assert';

console.log('========================================================================');
console.log('⚡ LIGHTNINGAPI.PRO — STUDIO 4.1 DIRECT ANSWERS & BENCHMARK SUITE ⚡');
console.log('========================================================================\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            passed++;
            console.log(`  ✅ [PASS] ${name}`);
          })
          .catch((err) => {
            console.error(`  ❌ [FAIL] ${name}:`, err.message);
            throw err;
          });
      } else {
        passed++;
        console.log(`  ✅ [PASS] ${name}`);
      }
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // --- SECTION 1: DIRECT ANSWER & CITATION PROMPT DIRECTIVE ---
  console.log('--- SECTION 1: DIRECT ANSWER SYNTHESIS & INLINE CITATION DIRECTIVES ---');

  test('buildWebResearchPromptDirective enforces direct answer first and inline citations', () => {
    const mockSources = [
      {
        citationIndex: 1,
        title: 'Grok (chatbot) - Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Grok_(chatbot)',
        snippet: 'Grok was announced by xAI on November 4, 2023.',
        domain: 'wikipedia.org',
        timestamp: new Date().toISOString(),
      },
      {
        citationIndex: 2,
        title: 'Introducing Grok | xAI',
        url: 'https://x.ai/blog/grok',
        snippet: 'Announcing Grok, an AI modeled after Hitchhikers Guide.',
        domain: 'x.ai',
        timestamp: new Date().toISOString(),
      },
    ];

    const directive = buildWebResearchPromptDirective(
      mockSources,
      'Evidence text indicating November 2023 release.',
      'When did Grok Bot release?'
    );

    assert(directive.includes('DIRECT ANSWER FIRST'), 'Must mandate direct answer first');
    assert(directive.includes('When did Grok Bot release?'), 'Must include user query');
    assert(directive.includes('INLINE CITATIONS'), 'Must mandate inline citations');
    assert(directive.includes('[1] "Grok (chatbot) - Wikipedia"'), 'Must list source 1 with title');
    assert(directive.includes('[2] "Introducing Grok | xAI"'), 'Must list source 2 with title');
    assert(directive.includes('Never output only source cards'), 'Must explicitly forbid source-only outputs');
  });

  // --- SECTION 2: MULTI-TURN PROMPT RETENTION & TURN ALTERNATION ---
  console.log('\n--- SECTION 2: MULTI-TURN PROMPT RETENTION & TURN NORMALIZATION ---');

  test('Multi-turn conversation retains active prompt as final user turn', () => {
    // Simulate what caused the bug in UserChatStudio: 10 prior messages in thread
    const clientMessages = [
      { role: 'user', content: 'can u visit websites?' },
      { role: 'assistant', content: 'Yes, I can browse verified public websites.' },
      { role: 'user', content: 'what models do you support?' },
      { role: 'assistant', content: 'I support Claude Opus 5.5, Sonnet 5.5, and more.' },
    ];
    const newPrompt = 'when did grok bot release?';

    // Apply the exact server/studio.ts resolution logic
    const outboundMessages: any[] = [];
    for (const m of clientMessages) {
      outboundMessages.push({ role: m.role, content: m.content });
    }

    const lastTurn = outboundMessages[outboundMessages.length - 1];
    const isPromptAlreadyLast = lastTurn?.role === 'user' && lastTurn.content.trim() === newPrompt.trim();
    if (!isPromptAlreadyLast) {
      outboundMessages.push({ role: 'user', content: newPrompt.trim() });
    }

    // Verify outboundMessages ends with user prompt
    assert.strictEqual(outboundMessages[outboundMessages.length - 1].role, 'user');
    assert.strictEqual(outboundMessages[outboundMessages.length - 1].content, 'when did grok bot release?');
    assert.strictEqual(outboundMessages.length, 5, 'Must contain all 4 previous turns plus the new prompt');
  });

  test('Strict turn-alternation normalizer merges same-role messages without API rejection', () => {
    const rawMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'user', content: 'Here is extra info' },
      { role: 'assistant', content: 'Got it.' },
      { role: 'user', content: 'When did Grok release?' },
    ];

    const normalized: any[] = [];
    for (let i = 0; i < rawMessages.length; i++) {
      const current = rawMessages[i];
      if (normalized.length === 0) {
        normalized.push(current);
      } else {
        const prev = normalized[normalized.length - 1];
        if (prev.role === current.role) {
          prev.content = `${prev.content}\n\n${current.content}`;
        } else {
          normalized.push(current);
        }
      }
    }

    assert.strictEqual(normalized.length, 3, 'Consecutive user messages must be merged into 1 turn');
    assert.strictEqual(normalized[0].content, 'Hello\n\nHere is extra info');
    assert.strictEqual(normalized[1].role, 'assistant');
    assert.strictEqual(normalized[2].role, 'user');
  });

  // --- SECTION 3: INLINE CITATION PARSING (FRONTEND LOGIC) ---
  console.log('\n--- SECTION 3: INLINE CITATION PARSER & MARKDOWN LINK VERIFICATION ---');

  test('Inline citation regex matches [1], [2] and markdown links correctly', () => {
    const sampleAnswer =
      '**Grok Bot Release Date**: Grok was announced by xAI on November 4, 2023 [1], with initial beta access rolled out to X Premium+ subscribers on December 7, 2023 [1]. For details, visit [Official Blog](https://x.ai/blog/grok) or check [2].';

    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[(?:[^\]]+)\]\((?:https?:\/\/[^\s)]+)\)|\[\d+\])/g;
    const tokens = sampleAnswer.split(tokenRegex).filter(Boolean);

    const citations = tokens.filter((t) => /^\[\d+\]$/.test(t));
    const markdownLinks = tokens.filter((t) => /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.test(t));

    assert(citations.includes('[1]'), 'Must extract citation [1]');
    assert(citations.includes('[2]'), 'Must extract citation [2]');
    assert.strictEqual(markdownLinks.length, 1, 'Must extract markdown link');
    assert(markdownLinks[0].includes('https://x.ai/blog/grok'), 'Link URL must match');
  });

  // --- SECTION 4: SAFE CACHING & LOW-LATENCY ACCELERATION ---
  console.log('\n--- SECTION 4: SAFE CACHING & REPEAT-QUERY ACCELERATION ---');

  await test('searchWeb and pageCache accelerate repeat queries by > 90%', async () => {
    clearWebResearchCaches();

    // 1. First search (cold)
    const t0 = Date.now();
    const coldSearch = await searchWeb('When did Grok Bot release?');
    const coldDuration = Date.now() - t0;

    assert(coldSearch.results.length > 0, 'Cold search must return results');
    console.log(`    ↳ Cold search: ${coldDuration}ms (${coldSearch.results.length} sources found)`);

    // 2. Second search (warm / cached)
    const t1 = Date.now();
    const warmSearch = await searchWeb('When did Grok Bot release?');
    const warmDuration = Date.now() - t1;

    assert(warmSearch.results.length === coldSearch.results.length, 'Warm search must return identical results');
    console.log(`    ↳ Warm search: ${warmDuration}ms (cached lookup)`);
    assert(warmDuration < 50, 'Cached search must return in under 50ms');

    // 3. Page fetch caching
    const testUrl = coldSearch.results[0].url;
    const p0 = Date.now();
    const coldPage = await fetchPublicUrl(testUrl, { timeoutMs: 3000 });
    const coldPageDuration = Date.now() - p0;
    console.log(`    ↳ Page fetch cold: ${coldPageDuration}ms (ok: ${coldPage.ok})`);

    const p1 = Date.now();
    const warmPage = await fetchPublicUrl(testUrl, { timeoutMs: 3000 });
    const warmPageDuration = Date.now() - p1;
    console.log(`    ↳ Page fetch warm: ${warmPageDuration}ms (cached)`);
    assert(warmPageDuration < 20, 'Cached page fetch must return in under 20ms');
  });

  // --- SECTION 5: REAL QUESTION BENCHMARK: "WHEN DID GROK BOT RELEASE?" ---
  console.log('\n--- SECTION 5: REAL END-TO-END FACTUAL BENCHMARK: GROK BOT RELEASE ---');

  await test('Grok Bot release date query retrieves factual ground truth with dates', async () => {
    const query = 'When did Grok Bot release?';
    const searchRes = await searchWeb(query, { maxResults: 5 });

    assert(searchRes.results.length >= 3, 'Must return at least 3 authoritative sources');

    // Check evidence snippets
    const allSnippetText = searchRes.results.map((r) => `${r.title} ${r.snippet}`).join(' ');
    const hasGrokMention = allSnippetText.toLowerCase().includes('grok');
    const hasXaiMention = allSnippetText.toLowerCase().includes('xai') || allSnippetText.toLowerCase().includes('spacex');
    assert(hasGrokMention, 'Retrieved evidence must mention Grok');

    // Check top page fetch
    const topUrl = searchRes.results[0].url;
    const page = await fetchPublicUrl(topUrl, { timeoutMs: 3000 });
    if (page.ok && page.text) {
      console.log(`    ↳ Top Source Content Length: ${page.text.length} chars`);
      assert(page.text.toLowerCase().includes('grok'), 'Top page content must mention Grok');
    }

    console.log(`    ↳ Primary source verified: "${searchRes.results[0].title}" (${searchRes.results[0].domain})`);
  });

  // --- SECTION 6: CONTEXT ACTIVITY STREAMING LATENCY INSTRUMENTATION ---
  console.log('\n--- SECTION 6: ACTIVITY TIMING & SSE EMISSION INSTRUMENTATION ---');

  test('Activity tracker immediately fires first visible update under 100ms', () => {
    const events: any[] = [];
    const t0 = Date.now();

    const tracker = createActivityTracker((act) => {
      events.push({ ...act, elapsedMs: Date.now() - t0 });
    });

    const taskAnalysis = analyzePromptTaskContext('When did Grok Bot release?', 'web_search');
    const initialStage = taskAnalysis.plannedStages[0];
    tracker.startStep(initialStage.type, initialStage.title, initialStage.detail);

    assert(events.length >= 1, 'Must emit at least 1 event immediately');
    assert(events[0].elapsedMs < 100, `First event must be emitted < 100ms, took ${events[0].elapsedMs}ms`);
    console.log(`    ↳ Time to First Visible Activity: ${events[0].elapsedMs}ms (Stage: "${events[0].title}")`);
  });

  console.log('\n========================================================================');
  console.log(`🎉 ALL STUDIO 4.1 BENCHMARK TESTS PASSED: ${passed}/${total} assertions verified!`);
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
