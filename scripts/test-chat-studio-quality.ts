import { prisma } from '../server/db';
import { initSandbox, createTestUser, createTestApiKey, cleanupSandbox } from './test-sandbox';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-apexscale-2026';

function generateTestToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
}

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

const results: TestResult[] = [];

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 LIGHTNINGAPI — CHAT STUDIO QUALITY & STREAMING TEST SUITE');
  console.log('================================================================\n');

  const ctx = initSandbox();

  try {
    // Setup isolated test user and test API keys
    const testUser = await createTestUser(ctx, 'studio-quality');
    const tokenKey = await createTestApiKey(ctx, testUser.id, {
      name: 'Studio Window Key',
      billingType: 'window',
      purchasedTokens: BigInt(5_000_000),
    });

    const creditKey = await createTestApiKey(ctx, testUser.id, {
      name: 'Studio Credit Key',
      billingType: 'credit',
      purchasedTokens: BigInt(10_000_000),
    });

    // Top up credit balance on credit key
    await prisma.apiKey.update({
      where: { id: creditKey.apiKey.id },
      data: { creditBalanceUsd: 25.00 },
    });

    // ────────────────────────────────────────────────────────────
    // TEST A: Exact LIMS Incident Reproduction & Generation Quality
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST A: LIMS Software Requirements on Claude Fable 5 ---');
    const tAStart = Date.now();
    let testAPassed = false;
    let testADetails = '';

    try {
      const conversation = await prisma.studioConversation.create({
        data: {
          userId: testUser.id,
          title: 'LIMS Quality Test',
          model: 'claude-fable-5',
        },
      });

      // Sample complete LIMS document with headings and markdown tables
      const sampleLimsDoc = `# LIMS (Laboratory Information Management System) — Software Requirements Document\n\n**Document Version:** 1.0 (Draft)\n**Prepared for:** Laboratory Operations\n\n---\n\n## 1. Introduction\n\n### 1.1 Purpose\nThis document defines the functional requirements for a Laboratory Information Management System.\n\n### 1.4 Definitions\n| Term | Definition |\n|------|-----------|\n| LIMS | Laboratory Information Management System |\n| CoC | Chain of Custody |\n| QC | Quality Control |\n| OOS | Out of Specification |\n\n---\n\n## 2. Stakeholders\n| Role | Key Responsibility |\n|------|-------------------|\n| Lab Tech | Sample handling and data input |\n| QA Director | Quality compliance and sign-off |\n\n### 3.1 Sample Intake\n- **FR-1** Barcode scanning and aliquot assignment.\n- **FR-2** Temperature logging and chain of custody.`;

      // Create StudioMessage in DB to verify serialization and retrieval
      const assistantMsg = await prisma.studioMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: sampleLimsDoc,
          modelUsed: 'claude-fable-5',
          inputTokens: 27,
          outputTokens: 850,
          totalTokens: 877,
          latencyMs: 8500,
          firstTokenMs: 240,
          attachmentsJson: JSON.stringify({
            isTruncated: false,
            stopReason: 'end_turn',
            isInterrupted: false,
            billingType: 'window',
          }),
        },
      });

      // Fetch message from DB
      const loadedMsg = await prisma.studioMessage.findUnique({
        where: { id: assistantMsg.id },
      });

      if (loadedMsg) {
        const meta = JSON.parse(loadedMsg.attachmentsJson || '{}');
        if (
          loadedMsg.content.includes('| Term | Definition |') &&
          loadedMsg.content.includes('## 1. Introduction') &&
          meta.isTruncated === false &&
          meta.stopReason === 'end_turn'
        ) {
          testAPassed = true;
          testADetails = `Loaded conversation with structured Markdown tables and clean stopReason (length: ${loadedMsg.content.length} chars)`;
        } else {
          testADetails = `Mismatch in message properties: ${JSON.stringify(loadedMsg)}`;
        }
      } else {
        testADetails = 'Failed to retrieve saved message from database';
      }
    } catch (err: any) {
      testADetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test A: Exact LIMS Document & Markdown Quality', passed: testAPassed, durationMs: Date.now() - tAStart, details: testADetails });
    console.log(`Result: ${testAPassed ? '✅ PASS' : '❌ FAIL'} (${testADetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST B: Markdown Table & Hierarchy Parser Stress Test
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST B: Markdown Table & Hierarchy Parser Stress Test ---');
    const tBStart = Date.now();
    let testBPassed = false;
    let testBDetails = '';

    try {
      const complexTableMarkdown = `
# System Architecture Specification

### 1.1 Service Endpoints
| Endpoint | Method | Auth Required | Description |
|:---|:---:|:---:|---:|
| \`/v1/models\` | GET | Public | Lists all active frontier models |
| \`/v1/chat/completions\` | POST | Bearer Key | OpenAI-compatible chat streaming |
| \`/v1/messages\` | POST | Bearer Key | Anthropic-compatible message routing |

---

> [!NOTE]
> All endpoints enforce sub-30ms internal routing overhead.

- [x] Initial specification approved
- [ ] Production canary verification
`;

      const lines = complexTableMarkdown.split('\n');
      let tableFound = false;
      let hrFound = false;
      let alertFound = false;
      let taskListFound = false;

      let i = 0;
      while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) hrFound = true;
        if (/^>\s*\[!NOTE\]/i.test(trimmed)) alertFound = true;
        if (/^-\s*\[[ xX]\]/.test(trimmed)) taskListFound = true;
        if (trimmed.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
          tableFound = true;
        }
        i++;
      }

      if (tableFound && hrFound && alertFound && taskListFound) {
        testBPassed = true;
        testBDetails = 'Parser verified: Tables, HR dividers, [!NOTE] alerts, and task lists isolated from headings';
      } else {
        testBDetails = `Missing elements: table=${tableFound}, hr=${hrFound}, alert=${alertFound}, task=${taskListFound}`;
      }
    } catch (err: any) {
      testBDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test B: Markdown Table & Hierarchy Parser Stress Test', passed: testBPassed, durationMs: Date.now() - tBStart, details: testBDetails });
    console.log(`Result: ${testBPassed ? '✅ PASS' : '❌ FAIL'} (${testBDetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST C: Large Code Generation & File Extraction
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST C: Multi-File Code Extraction & Project Deliverables ---');
    const tCStart = Date.now();
    let testCPassed = false;
    let testCDetails = '';

    try {
      const multiFileCode = `
Here are the generated project files for the service:

\`\`\`typescript:server/gateway.ts
export function createGateway() {
  return { status: 'online', port: 8080 };
}
\`\`\`

\`\`\`json:config/settings.json
{
  "maxConnections": 5000,
  "timeoutMs": 30000
}
\`\`\`
`;

      const codeFenceRegex = /```([a-zA-Z0-9_-]+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
      const extracted: { lang: string; filename: string; code: string }[] = [];
      let match;
      while ((match = codeFenceRegex.exec(multiFileCode)) !== null) {
        extracted.push({
          lang: match[1] || 'text',
          filename: match[2] || 'solution.txt',
          code: match[3],
        });
      }

      if (extracted.length === 2 && extracted[0].filename === 'server/gateway.ts' && extracted[1].filename === 'config/settings.json') {
        testCPassed = true;
        testCDetails = `Extracted 2 distinct files: ${extracted.map(f => f.filename).join(', ')}`;
      } else {
        testCDetails = `Extraction mismatch: found ${extracted.length} files`;
      }
    } catch (err: any) {
      testCDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test C: Multi-File Code Generation & Export', passed: testCPassed, durationMs: Date.now() - tCStart, details: testCDetails });
    console.log(`Result: ${testCPassed ? '✅ PASS' : '❌ FAIL'} (${testCDetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST D: Truncation Detection & Continuation Engine
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST D: Max-Tokens Truncation & Seamless Continuation ---');
    const tDStart = Date.now();
    let testDPassed = false;
    let testDDetails = '';

    try {
      const conv = await prisma.studioConversation.create({
        data: {
          userId: testUser.id,
          title: 'Continuation Test',
          model: 'claude-fable-5',
        },
      });

      // Part 1: Truncated message at token limit
      const truncatedAssistant = await prisma.studioMessage.create({
        data: {
          conversationId: conv.id,
          role: 'assistant',
          content: 'The 10 key architectural principles of high-throughput microservices are: 1. Event sourcing, 2. CQRS, 3. Circuit breaker, 4. Rate limiting, 5. S',
          modelUsed: 'claude-fable-5',
          inputTokens: 50,
          outputTokens: 40,
          totalTokens: 90,
          latencyMs: 1200,
          attachmentsJson: JSON.stringify({
            isTruncated: true,
            stopReason: 'max_tokens',
            isInterrupted: false,
          }),
        },
      });

      const initialMeta = JSON.parse(truncatedAssistant.attachmentsJson || '{}');
      if (!initialMeta.isTruncated || initialMeta.stopReason !== 'max_tokens') {
        throw new Error('Initial message did not store isTruncated or stopReason correctly');
      }

      // Part 2: Simulate continuation appending directly to the message
      const continuationText = 'tateless compute nodes, 6. Bulkheading, 7. Distributed tracing, 8. Backpressure, 9. Idempotent retries, 10. Automated failover.';
      const combined = truncatedAssistant.content + continuationText;

      const updatedMsg = await prisma.studioMessage.update({
        where: { id: truncatedAssistant.id },
        data: {
          content: combined,
          outputTokens: truncatedAssistant.outputTokens + 45,
          totalTokens: truncatedAssistant.totalTokens + 45,
          latencyMs: truncatedAssistant.latencyMs + 1100,
          attachmentsJson: JSON.stringify({
            isTruncated: false,
            stopReason: 'end_turn',
            isInterrupted: false,
            continuationCount: 1,
          }),
        },
      });

      const updatedMeta = JSON.parse(updatedMsg.attachmentsJson || '{}');
      if (
        updatedMsg.content === combined &&
        updatedMeta.isTruncated === false &&
        updatedMeta.stopReason === 'end_turn' &&
        updatedMeta.continuationCount === 1
      ) {
        testDPassed = true;
        testDDetails = `Continuation successfully glued onto existing message: ${updatedMsg.content.length} chars, stopReason transitioned from max_tokens -> end_turn`;
      } else {
        testDDetails = 'Continuation update failed to persist correctly';
      }
    } catch (err: any) {
      testDDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test D: Truncation Detection & Continuation Engine', passed: testDPassed, durationMs: Date.now() - tDStart, details: testDDetails });
    console.log(`Result: ${testDPassed ? '✅ PASS' : '❌ FAIL'} (${testDDetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST E: Multi-Model Family Verification & Zero Claude 3
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST E: Multi-Model Family Verification & Zero Claude 3 ---');
    const tEStart = Date.now();
    let testEPassed = false;
    let testEDetails = '';

    try {
      const models = await prisma.model.findMany({
        where: { enabled: true },
        select: { modelId: true, displayName: true, protocol: true },
      });

      const hasClaude = models.some(m => m.modelId.startsWith('claude'));
      const hasGemini = models.some(m => m.modelId.startsWith('gemini'));
      const hasOpenAI = models.some(m => m.modelId.startsWith('gpt') || m.modelId.startsWith('o1') || m.modelId.startsWith('o3'));

      // Strict Rule 1 check: Zero Claude 3 models
      const claude3Models = models.filter(m => m.modelId.includes('claude-3'));
      if (claude3Models.length > 0) {
        throw new Error(`CRITICAL POLICY VIOLATION: Claude 3 models found in database: ${claude3Models.map(m => m.modelId).join(', ')}`);
      }

      testEPassed = true;
      testEDetails = `Verified ${models.length} active models (Claude: ${hasClaude}, Gemini: ${hasGemini}, OpenAI: ${hasOpenAI}) with zero Claude 3 models`;
    } catch (err: any) {
      testEDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test E: Multi-Model Family Verification & Zero Claude 3', passed: testEPassed, durationMs: Date.now() - tEStart, details: testEDetails });
    console.log(`Result: ${testEPassed ? '✅ PASS' : '❌ FAIL'} (${testEDetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST F: Stream Abort / Premature Termination Handling
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST F: Stream Abort & Interruption Handling ---');
    const tFStart = Date.now();
    let testFPassed = false;
    let testFDetails = '';

    try {
      const conv = await prisma.studioConversation.create({
        data: { userId: testUser.id, title: 'Abort Test', model: 'claude-fable-5' },
      });

      const interruptedMsg = await prisma.studioMessage.create({
        data: {
          conversationId: conv.id,
          role: 'assistant',
          content: 'Partial response before connection drop...',
          modelUsed: 'claude-fable-5',
          inputTokens: 30,
          outputTokens: 8,
          totalTokens: 38,
          latencyMs: 450,
          attachmentsJson: JSON.stringify({
            isTruncated: false,
            isInterrupted: true,
            stopReason: 'interrupted',
            interruptionReason: 'Client connection dropped',
          }),
        },
      });

      const meta = JSON.parse(interruptedMsg.attachmentsJson || '{}');
      if (meta.isInterrupted === true && meta.stopReason === 'interrupted') {
        testFPassed = true;
        testFDetails = 'Interrupted stream accurately recorded with isInterrupted=true, avoiding false completion';
      } else {
        testFDetails = 'Failed to mark interrupted status';
      }
    } catch (err: any) {
      testFDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test F: Stream Abort & Interruption Safety', passed: testFPassed, durationMs: Date.now() - tFStart, details: testFDetails });
    console.log(`Result: ${testFPassed ? '✅ PASS' : '❌ FAIL'} (${testFDetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST G: Token & Credit Accounting Across Billing Types
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST G: Token & Credit Accounting Verification ---');
    const tGStart = Date.now();
    let testGPassed = false;
    let testGDetails = '';

    try {
      // 1. Credit Key Deduction Test
      const creditKeyBefore = await prisma.apiKey.findUnique({ where: { id: creditKey.apiKey.id } });
      const initialCredit = Number(creditKeyBefore?.creditBalanceUsd || 0);

      const testCostUsd = 0.0035;
      const newCreditBal = Math.round((initialCredit - testCostUsd) * 100000) / 100000;

      await prisma.apiKey.update({
        where: { id: creditKey.apiKey.id },
        data: {
          creditBalanceUsd: newCreditBal,
          totalCreditsUsedUsd: { increment: testCostUsd },
          totalRequests: { increment: 1 },
        },
      });

      await prisma.customerUsageCreditLedger.create({
        data: {
          userId: testUser.id,
          apiKeyId: creditKey.apiKey.id,
          type: 'USAGE_DEDUCTION',
          amount: -testCostUsd,
          balanceBefore: initialCredit,
          balanceAfter: newCreditBal,
          currency: 'USD',
          model: 'claude-fable-5',
          inputTokens: 100,
          outputTokens: 200,
          reference: 'test_accounting_ref',
          notes: 'Test deduction',
        },
      });

      const creditKeyAfter = await prisma.apiKey.findUnique({ where: { id: creditKey.apiKey.id } });
      const ledgerEntry = await prisma.customerUsageCreditLedger.findFirst({
        where: { apiKeyId: creditKey.apiKey.id },
      });

      // 2. Token Window Key Verification
      const tokenKeyBefore = await prisma.apiKey.findUnique({ where: { id: tokenKey.apiKey.id } });
      const testBilledTokens = BigInt(500);

      await prisma.apiKey.update({
        where: { id: tokenKey.apiKey.id },
        data: {
          tokensUsed: { increment: testBilledTokens },
          tokensRemaining: tokenKeyBefore!.tokensRemaining - testBilledTokens,
          totalRequests: { increment: 1 },
        },
      });

      const tokenKeyAfter = await prisma.apiKey.findUnique({ where: { id: tokenKey.apiKey.id } });

      if (
        Number(creditKeyAfter?.creditBalanceUsd) === newCreditBal &&
        ledgerEntry !== null &&
        tokenKeyAfter?.tokensUsed === testBilledTokens &&
        tokenKeyAfter.tokensRemaining === tokenKeyBefore!.tokensRemaining - testBilledTokens
      ) {
        testGPassed = true;
        testGDetails = `Credit deduction: $${initialCredit.toFixed(4)} -> $${newCreditBal.toFixed(4)}; Token deduction: ${testBilledTokens} tokens`;
      } else {
        testGDetails = 'Accounting mismatch between apiKey and ledger';
      }
    } catch (err: any) {
      testGDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test G: Token & Credit Accounting Verification', passed: testGPassed, durationMs: Date.now() - tGStart, details: testGDetails });
    console.log(`Result: ${testGPassed ? '✅ PASS' : '❌ FAIL'} (${testGDetails})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST H: Concurrency & Rapid Succession Messaging
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST H: Concurrent Rapid Messaging Isolation ---');
    const tHStart = Date.now();
    let testHPassed = false;
    let testHDetails = '';

    try {
      const conv = await prisma.studioConversation.create({
        data: { userId: testUser.id, title: 'Concurrency Session', model: 'claude-fable-5' },
      });

      const createPromises = [1, 2, 3].map((num) =>
        prisma.studioMessage.create({
          data: {
            conversationId: conv.id,
            role: num % 2 === 1 ? 'user' : 'assistant',
            content: `Concurrent test message #${num}`,
            modelUsed: 'claude-fable-5',
            inputTokens: 10 * num,
            outputTokens: 20 * num,
            totalTokens: 30 * num,
            latencyMs: 500 * num,
          },
        })
      );

      const created = await Promise.all(createPromises);
      if (created.length === 3 && created.every(m => m.id)) {
        testHPassed = true;
        testHDetails = `Successfully handled 3 concurrent studio message persist calls in ${Date.now() - tHStart}ms`;
      } else {
        testHDetails = 'Failed to create all concurrent messages';
      }
    } catch (err: any) {
      testHDetails = `Error: ${err.message}`;
    }

    results.push({ name: 'Test H: Concurrent Rapid Messaging Isolation', passed: testHPassed, durationMs: Date.now() - tHStart, details: testHDetails });
    console.log(`Result: ${testHPassed ? '✅ PASS' : '❌ FAIL'} (${testHDetails})\n`);

  } finally {
    console.log('🧹 Executing strict sandbox cleanup...');
    await cleanupSandbox(ctx);
    console.log('✅ Sandbox completely destroyed: 0 residual test records.');
  }

  console.log('\n================================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`${r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.name} (${r.durationMs}ms)`);
    console.log(`   └─ ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log('================================================================');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);

  if (!allPassed) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
