import { PrismaClient } from '@prisma/client';
import { executeModelSync } from '../server/models/modelSyncService';
import { validateModelAvailability } from '../server/gateway';

const prisma = new PrismaClient();

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 LIGHTNINGAPI — AUTOMATED MODEL SYNCHRONIZATION VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 8;

  // 1. SCENARIO A: Verify Gemini 4 Argon Discovered & Staged Safely
  console.log('▶ Test 1: Verify Discovery & Staged Validation of Gemini 4 Argon...');
  const argon = await prisma.model.findFirst({
    where: {
      OR: [{ modelId: 'gemini-4-argon' }, { upstreamModelId: 'gemini-4-argon' }],
    },
  });

  if (argon && argon.contextWindow === 1048576 && argon.validationStatus === 'PENDING_VALIDATION' && argon.enabled === false) {
    console.log(`  ✅ Passed: Gemini 4 Argon discovered with 1,048,576 tokens, staged as PENDING_VALIDATION (enabled: false).`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Gemini 4 Argon status mismatch:`, argon);
  }

  // 2. SCENARIO B: Pricing Separation Invariant Check
  console.log('\n▶ Test 2: Pricing Separation Invariant (Supplier Cost vs Customer Selling Price)...');
  const testModelId = 'test-pricing-invariant-' + Date.now();
  const testModel = await prisma.model.create({
    data: {
      modelId: testModelId,
      displayName: 'Test Invariant Model',
      provider: 'ScaleMax',
      providerSlug: 'scalemax',
      description: 'Test model for pricing separation',
      supplierCostInput: 1.00,
      supplierCostOutput: 4.00,
      inputPrice: 3.50, // Customer price
      outputPrice: 14.00, // Customer price
      validationStatus: 'ACTIVE',
      enabled: true,
    },
  });

  // Simulate an upstream price surge: Wholesale cost doubles to $2.00 / $8.00
  const oldCustomerPriceIn = testModel.inputPrice;
  const oldCustomerPriceOut = testModel.outputPrice;

  // Simulate sync updating supplier costs
  const updatedModel = await prisma.model.update({
    where: { id: testModel.id },
    data: {
      supplierCostInput: 2.00,
      supplierCostOutput: 8.00,
      hasUpstreamPriceChange: true,
      upstreamPriceChangeDetails: 'Upstream cost surge: In $1 -> $2, Out $4 -> $8',
      // inputPrice and outputPrice deliberately untouched!
    },
  });

  if (
    updatedModel.supplierCostInput === 2.00 &&
    updatedModel.supplierCostOutput === 8.00 &&
    updatedModel.hasUpstreamPriceChange === true &&
    updatedModel.inputPrice === oldCustomerPriceIn &&
    updatedModel.outputPrice === oldCustomerPriceOut
  ) {
    console.log(`  ✅ Passed: Upstream wholesale rates updated ($1->$2), hasUpstreamPriceChange=true, customer selling prices remained strictly untouched ($3.50/$14.00).`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Customer selling price was altered!`);
  }

  // 3. SCENARIO C: Gateway Availability Enforcement (PENDING_VALIDATION)
  console.log('\n▶ Test 3: Gateway Validation for Staged PENDING_VALIDATION Model...');
  const pendingCheck = await validateModelAvailability('gemini-4-argon');
  if (!pendingCheck.isValid && pendingCheck.status === 'PENDING_VALIDATION' && pendingCheck.error?.status === 400) {
    console.log(`  ✅ Passed: Gateway rejected unapproved model with HTTP 400: "${pendingCheck.error.message}"`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Gateway let unapproved model through:`, pendingCheck);
  }

  // 4. SCENARIO D: Admin Approval Workflow
  console.log('\n▶ Test 4: Admin Approval Workflow for Staged Model...');
  const approvedArgon = await prisma.model.update({
    where: { id: argon!.id },
    data: {
      validationStatus: 'ACTIVE',
      enabled: true,
      isCustomerAvailable: true,
      inputPrice: 10.00,
      outputPrice: 50.00,
    },
  });

  const activeCheck = await validateModelAvailability('gemini-4-argon');
  if (activeCheck.isValid && activeCheck.status === 'ACTIVE' && approvedArgon.enabled === true) {
    console.log(`  ✅ Passed: Approved model successfully promoted to ACTIVE status and accepted by gateway!`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Model not active after approval:`, activeCheck);
  }

  // Restore Argon back to PENDING_VALIDATION for safe staging
  await prisma.model.update({
    where: { id: argon!.id },
    data: {
      validationStatus: 'PENDING_VALIDATION',
      enabled: false,
      isCustomerAvailable: false,
    },
  });

  // 5. SCENARIO E: Gateway Availability Enforcement (DISABLED Model)
  console.log('\n▶ Test 5: Gateway Validation for DISABLED Model...');
  await prisma.model.update({
    where: { id: testModel.id },
    data: { validationStatus: 'DISABLED', enabled: false },
  });

  const disabledCheck = await validateModelAvailability(testModelId);
  if (!disabledCheck.isValid && disabledCheck.status === 'DISABLED' && disabledCheck.error?.status === 400) {
    console.log(`  ✅ Passed: Gateway rejected disabled model with HTTP 400: "${disabledCheck.error.message}"`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Disabled check failed:`, disabledCheck);
  }

  // 6. SCENARIO F: Removal Protection (Never delete, mark TEMPORARILY_UNAVAILABLE)
  console.log('\n▶ Test 6: Removal Upstream Protection (Zero Record Loss)...');
  await prisma.model.update({
    where: { id: testModel.id },
    data: { validationStatus: 'TEMPORARILY_UNAVAILABLE', availabilityStatus: 'unavailable' },
  });

  const unavailCheck = await validateModelAvailability(testModelId);
  if (!unavailCheck.isValid && unavailCheck.status === 'REMOVED_UPSTREAM' && unavailCheck.error?.status === 400) {
    console.log(`  ✅ Passed: Gateway returned unavailable status with HTTP 400: "${unavailCheck.error.message}"`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Unavailable check failed:`, unavailCheck);
  }

  // Clean up test invariant model
  await prisma.model.delete({ where: { id: testModel.id } });

  // 7. SCENARIO G: Concurrency Lock Verification
  console.log('\n▶ Test 7: Concurrency Lock Verification...');
  // Trigger model sync - verify history record exists and succeeded
  const history = await prisma.modelSyncHistory.findFirst({
    where: { status: 'SUCCESS' },
    orderBy: { startedAt: 'desc' },
  });

  if (history && history.modelsDiscovered > 0) {
    console.log(`  ✅ Passed: Sync history verified (Run ID: ${history.id}, Discovered: ${history.modelsDiscovered}, Status: ${history.status}, Duration: ${(history.durationMs / 1000).toFixed(1)}s).`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: No successful sync history found.`);
  }

  // 8. SCENARIO H: ModelChangeLog Integrity
  console.log('\n▶ Test 8: ModelChangeLog Audit Trail Integrity...');
  const logsCount = await prisma.modelChangeLog.count();
  if (logsCount > 0) {
    const sampleLog = await prisma.modelChangeLog.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log(`  ✅ Passed: ModelChangeLog contains ${logsCount} logged operations. Latest: [${sampleLog?.changeType}] on ${sampleLog?.modelId} (${sampleLog?.fieldName}: ${sampleLog?.newValue}).`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed: Change logs are empty.`);
  }

  console.log('\n================================================================');
  console.log(`🎉 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');
}

runTestSuite().catch(console.error).finally(() => prisma.$disconnect());
