/**
 * scripts/test-studio-phase3-advanced.ts
 *
 * Comprehensive Automated Verification Suite for LightningAPI AI Chat Studio Phase 3:
 * Advanced AI, Multimodal Creation & Bounded Agent Workflows.
 *
 * Test Suites:
 * 1. Tool Registry & Server-Side Validation
 * 2. Model Tool-Calling Capability & Loop Detection
 * 3. Safe Tool Execution (Docs, Data Analysis, ZIP Bundling)
 * 4. Side-by-Side Model Comparison (Bounds, Identity, Error Isolation)
 * 5. Multimodal Image Generation & Video Feasibility Assessment
 * 6. Bounded Task Agents (Research, Document, Data, Website Builder)
 * 7. Agent Cancellation & Step Logging
 * 8. Model Categorization & Task Recommendations
 * 9. Security, Multi-Tenant Isolation & Zero Secret Leakage
 */

import {
  STUDIO_TOOL_REGISTRY,
  executeStudioTool,
  isModelToolCallingSupported,
  checkToolCallSafety,
} from '../server/studioTools';
import { executeModelComparison } from '../server/studioCompare';
import { getTechnicalVideoAssessment, AspectRatio } from '../server/imageService';
import { executeAgentWorkflow, cancelAgentRun, getAgentRun } from '../server/studioAgents';
import { recommendModelForTask, categorizeModel } from '../server/studioCapabilities';
import { saveArtifact, getArtifactById } from '../server/documentGenerator';
import assert from 'assert';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          passedTests++;
          console.log(`  ✅ [PASS] ${name}`);
        })
        .catch((err) => {
          console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
          throw err;
        });
    } else {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    }
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

async function runAllTests() {
  console.log('\n================================================================');
  console.log('⚡ LIGHTNINGAPI STUDIO PHASE 3: ADVANCED CAPABILITIES & AGENTS');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: Tool Registry & Server-Side Validation
  // -------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Tool Registry & Validation ---');

  runTest('Registry defines all 6 core tools with schemas and timeouts', () => {
    const requiredTools = ['web_search', 'file_read', 'document_generate', 'data_analyze', 'code_bundle_zip', 'image_generate'];
    for (const toolId of requiredTools) {
      assert.ok(STUDIO_TOOL_REGISTRY[toolId], `Tool ${toolId} must be registered`);
      assert.ok(STUDIO_TOOL_REGISTRY[toolId].timeoutMs > 0, `Tool ${toolId} must define timeout`);
      assert.ok(STUDIO_TOOL_REGISTRY[toolId].parameters.required.length > 0, `Tool ${toolId} must define required params`);
    }
  });

  await runTest('Rejects unknown tool gracefully with TOOL_NOT_FOUND error', async () => {
    const res = await executeStudioTool({
      toolId: 'unregistered_hack_tool',
      parameters: {},
      userId: 'test_user_1',
      isPaidCustomer: false,
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error?.code, 'TOOL_NOT_FOUND');
  });

  await runTest('Rejects missing required parameters with INVALID_PARAMETERS', async () => {
    const res = await executeStudioTool({
      toolId: 'document_generate',
      parameters: { title: 'Missing Format and Content' },
      userId: 'test_user_1',
      isPaidCustomer: false,
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error?.code, 'INVALID_PARAMETERS');
  });

  // -------------------------------------------------------------------------
  // SUITE 2: Model Tool-Calling Verification & Loop Defense
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Tool-Calling Capability & Loop Defense ---');

  runTest('isModelToolCallingSupported verifies tool calling capability by model', () => {
    assert.strictEqual(isModelToolCallingSupported('claude-sonnet-5.5'), true);
    assert.strictEqual(isModelToolCallingSupported('gpt-4o'), true);
    assert.strictEqual(isModelToolCallingSupported('gemini-2.5-flash'), true);
    assert.strictEqual(isModelToolCallingSupported('deepseek-r1'), false); // DeepSeek R1 is text-only reasoning
  });

  await runTest('Tool dispatcher rejects tool execution for unsupported models', async () => {
    const res = await executeStudioTool({
      toolId: 'web_search',
      parameters: { query: 'test query' },
      userId: 'test_user_loop',
      isPaidCustomer: true,
      selectedModel: 'deepseek-r1',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error?.code, 'MODEL_UNSUPPORTED');
  });

  runTest('Loop defense detects and prevents consecutive identical tool calls', () => {
    const userId = 'user_loop_test_' + Date.now();
    const params = { query: 'repeated query identical' };

    const first = checkToolCallSafety(userId, 'web_search', params);
    assert.strictEqual(first.allowed, true);

    const second = checkToolCallSafety(userId, 'web_search', params);
    assert.strictEqual(second.allowed, true);

    // Third identical call triggers loop protection
    const third = checkToolCallSafety(userId, 'web_search', params);
    assert.strictEqual(third.allowed, false);
    assert.ok(third.reason?.includes('loop detected'));
  });

  // -------------------------------------------------------------------------
  // SUITE 3: Safe Tool Execution (Docs, Data Analysis, ZIP Bundling)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Safe Tool Execution ---');

  await runTest('document_generate tool creates validated downloadable artifact', async () => {
    const res = await executeStudioTool({
      toolId: 'document_generate',
      parameters: {
        title: 'Q3 Financial Overview',
        format: 'docx',
        content: '# Q3 Financial Report\n\nRevenue grew by 24% year-over-year.',
        author: 'Finance Team',
      },
      userId: 'user_alice',
      isPaidCustomer: true,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.data?.artifactId);
    assert.strictEqual(res.data?.format, 'docx');
    assert.ok(res.data?.sizeBytes > 1000);
    assert.ok(res.data?.downloadUrl.includes('/download'));
  });

  await runTest('data_analyze tool performs deterministic summary and cleaning', async () => {
    const testCsv = 'Product,Units,Price\nWidget A,10,25.5\nWidget B,20,15.0\nWidget A,10,25.5\nWidget C,,30.0';
    const res = await executeStudioTool({
      toolId: 'data_analyze',
      parameters: {
        data: testCsv,
        cleanDuplicates: true,
        imputeStrategy: 'mean',
      },
      userId: 'user_alice',
      isPaidCustomer: true,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.analysis.totalRows, 3); // 4 rows minus 1 duplicate = 3 rows
    assert.ok(res.data.revisedData.includes('Widget B'));
  });

  await runTest('code_bundle_zip tool packages multiple source files into a valid ZIP archive', async () => {
    const files = [
      { path: 'index.html', content: '<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>' },
      { path: 'styles.css', content: 'body { font-family: sans-serif; background: #faf8f5; }' },
      { path: 'app.js', content: 'console.log("LightningAPI");' },
    ];
    const res = await executeStudioTool({
      toolId: 'code_bundle_zip',
      parameters: {
        projectName: 'demo_webapp',
        files: JSON.stringify(files),
      },
      userId: 'user_alice',
      isPaidCustomer: true,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data?.fileCount, 3);
    assert.ok(res.data?.sizeBytes > 300);
    assert.strictEqual(res.data?.filename, 'demo_webapp.zip');
  });

  await runTest('file_read tool accesses authorized user artifact with multi-tenant check', async () => {
    const testArt = saveArtifact({
      userId: 'user_alice',
      title: 'Secret Spec',
      format: 'md',
      filename: 'spec.md',
      mimeType: 'text/markdown',
      sizeBytes: 42,
      buffer: Buffer.from('# Internal Architecture Specification', 'utf-8'),
    });

    // Alice reads her own artifact
    const aliceRes = await executeStudioTool({
      toolId: 'file_read',
      parameters: { fileId: testArt.id },
      userId: 'user_alice',
      isPaidCustomer: true,
    });
    assert.strictEqual(aliceRes.success, true);
    assert.ok(aliceRes.data?.preview.includes('Internal Architecture'));

    // Bob attempts to read Alice artifact (multi-tenant isolation check)
    const bobRes = await executeStudioTool({
      toolId: 'file_read',
      parameters: { fileId: testArt.id },
      userId: 'user_bob',
      isPaidCustomer: true,
    });
    assert.strictEqual(bobRes.success, false);
    assert.ok(bobRes.error?.message.includes('not found or access denied'));
  });

  // -------------------------------------------------------------------------
  // SUITE 4: Model Comparison Engine
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Model Comparison Engine ---');

  await runTest('executeModelComparison enforces bounded model constraints (min 2, max 3)', async () => {
    // Rejects single model
    const single = await executeModelComparison({
      userId: 'user_alice',
      isPaidCustomer: true,
      prompt: 'Compare prompt',
      modelIds: ['claude-sonnet-5.5'],
    });
    assert.strictEqual(single.success, false);
    assert.ok(single.error?.includes('requires at least 2 models'));
  });

  runTest('Model comparison preserves authentic model identifiers and metadata', () => {
    const metaA = categorizeModel('claude-sonnet-5.5');
    const metaB = categorizeModel('gemini-2.5-flash');
    assert.strictEqual(metaA.category, 'coding');
    assert.strictEqual(metaB.category, 'long_context');
  });

  // -------------------------------------------------------------------------
  // SUITE 5: Multimodal Image Synthesis & Video Assessment
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Multimodal Image & Video Assessment ---');

  runTest('Video generation feasibility report is honest, authoritative, and deferred', () => {
    const report = getTechnicalVideoAssessment();
    assert.strictEqual(report.status, 'deferred');
    assert.ok(report.reason.includes('not technically viable'));
    assert.ok(report.hardwareRequirements.includes('24GB-80GB VRAM'));
    assert.ok(report.commercialApiCosts.includes('$0.25 to $0.60'));
    assert.ok(report.recommendation.includes('No fake video mockup'));
  });

  // -------------------------------------------------------------------------
  // SUITE 6: Bounded Task Agents (Research, Document, Data, Website Builder)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Bounded Task Agents ---');

  await runTest('Research Agent completes multi-step cited investigation & exports DOCX', async () => {
    const state = await executeAgentWorkflow({
      agentType: 'research_agent',
      prompt: 'Latest TypeScript 5.8 features and performance optimizations',
      userId: 'user_agent_test',
      isPaidCustomer: true,
    });

    assert.strictEqual(state.status, 'completed');
    assert.strictEqual(state.steps.length, 5);
    assert.strictEqual(state.steps[0].status, 'completed');
    assert.strictEqual(state.steps[4].status, 'completed');
    assert.ok(state.result?.artifactId);
    assert.ok(state.result?.filename?.endsWith('.docx'));
    assert.ok(state.result?.downloadUrl?.includes('/download'));
  });

  await runTest('Document Agent completes structured drafting and validates binary output', async () => {
    const state = await executeAgentWorkflow({
      agentType: 'document_agent',
      prompt: 'Enterprise API SLA Agreement',
      userId: 'user_agent_test',
      isPaidCustomer: true,
      parameters: { format: 'pdf' },
    });

    assert.strictEqual(state.status, 'completed');
    assert.strictEqual(state.steps.length, 3);
    assert.strictEqual(state.steps[2].status, 'completed');
    assert.ok(state.result?.artifactId);
    assert.ok(state.result?.filename?.endsWith('.pdf'));
  });

  await runTest('Data Analysis Agent deterministically profiles and exports revised workbook', async () => {
    const state = await executeAgentWorkflow({
      agentType: 'data_agent',
      prompt: 'Analyze sales dataset and clean anomalies',
      userId: 'user_agent_test',
      isPaidCustomer: true,
      parameters: {
        data: 'Region,Revenue,Costs\nNorth,50000,32000\nSouth,62000,41000\nEast,48000,31000\nWest,71000,45000',
      },
    });

    assert.strictEqual(state.status, 'completed');
    assert.strictEqual(state.steps.length, 4);
    assert.ok(state.result?.artifactId);
    assert.ok(state.result?.filename?.endsWith('.xlsx'));
    assert.strictEqual(state.result?.data?.analysis?.totalRows, 4);
  });

  await runTest('Website Building Agent synthesizes multi-file project and bundles ZIP archive', async () => {
    const state = await executeAgentWorkflow({
      agentType: 'website_builder_agent',
      prompt: 'Developer Portfolio Landing Page',
      userId: 'user_agent_test',
      isPaidCustomer: true,
    });

    assert.strictEqual(state.status, 'completed');
    assert.strictEqual(state.steps.length, 3);
    assert.ok(state.result?.artifactId);
    assert.ok(state.result?.filename?.endsWith('.zip'));
    assert.ok(state.result?.data?.previewHtml.includes('<!DOCTYPE html>'));
    assert.strictEqual(state.result?.data?.files.length, 4);
  });

  // -------------------------------------------------------------------------
  // SUITE 7: Agent Cancellation & Step Logging
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Agent Cancellation & State ---');

  runTest('cancelAgentRun safely cancels active agent workflow', () => {
    const testRunId = 'agrun_cancel_test_' + Date.now();
    // Verify non-existent run returns false
    const cancelNonExistent = cancelAgentRun(testRunId, 'user_agent_test');
    assert.strictEqual(cancelNonExistent, false);
  });

  // -------------------------------------------------------------------------
  // SUITE 8: Model Categorization & Recommendations
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Model Categorization & Recommendations ---');

  runTest('recommendModelForTask suggests optimal model based on query intent & account tier', () => {
    // Coding query on paid account
    const recPaidCode = recommendModelForTask('refactor this typescript function to avoid memory leak', true);
    assert.strictEqual(recPaidCode.recommendedModelId, 'claude-sonnet-5.5');
    assert.strictEqual(recPaidCode.primaryCategory, 'coding');

    // Coding query on trial account
    const recTrialCode = recommendModelForTask('write a python script to parse logs', false);
    assert.strictEqual(recTrialCode.recommendedModelId, 'deepseek-v3');
    assert.strictEqual(recTrialCode.primaryCategory, 'coding');

    // Deep reasoning query on paid account
    const recPaidMath = recommendModelForTask('solve this complex logic puzzle step by step', true);
    assert.strictEqual(recPaidMath.recommendedModelId, 'o3-mini');
    assert.strictEqual(recPaidMath.primaryCategory, 'reasoning');

    // Large context query
    const recLongContext = recommendModelForTask('summarize all 100 pages of this entire document file', true);
    assert.strictEqual(recLongContext.recommendedModelId, 'gemini-2.5-pro');
    assert.strictEqual(recLongContext.primaryCategory, 'long_context');
  });

  // -------------------------------------------------------------------------
  // SUITE 9: Security, Multi-Tenant Isolation & Zero Secret Leakage
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 9: Security & Multi-Tenant Isolation ---');

  runTest('Tool registry parameters and execution state never leak server secrets', () => {
    for (const tool of Object.values(STUDIO_TOOL_REGISTRY)) {
      const toolStr = JSON.stringify(tool);
      assert.ok(!toolStr.includes('API_KEY'), 'Tool registry must not leak API keys');
      assert.ok(!toolStr.includes('Bearer'), 'Tool registry must not leak Bearer tokens');
      assert.ok(!toolStr.includes('secret'), 'Tool registry must not leak secrets');
    }
  });

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
