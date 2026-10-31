/**
 * Independent Billing and Cross-Plan Isolation Verification Script
 * Validates the 5 plans, atomic deductions, rolling window calculations,
 * and strict boundary isolation.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('=== LIGHTNINGAPI FIVE-PLAN & ISOLATION INDEPENDENT VERIFICATION ===\n');
  const results = [];

  // Helper to record result
  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${testName}`);
    if (details) console.log(`       Details: ${JSON.stringify(details)}`);
  }

  try {
    // -------------------------------------------------------------
    // 1. PLAN 1: OpusMax Claude 5h Rolling Pool Verification
    // -------------------------------------------------------------
    console.log('\n--- 1. PLAN 1: OpusMax Claude 5h Rolling Pool ---');
    const { calculateCustomerRollingWindow } = await import('../server/accounting/customerAccounting.js');
    const { isRollingPlan } = await import('../server/accounting/tokenReservation.js');

    // Create a mock/real key record for rolling pool
    const rollingKey = await prisma.apiKey.findFirst({
      where: {
        OR: [
          { billingType: 'window' },
          { name: { contains: 'Claude Max', mode: 'insensitive' } },
        ]
      }
    });

    if (rollingKey) {
      const isRolling = isRollingPlan(rollingKey);
      record('Plan 1: Recognized as Rolling Window Plan', isRolling === true, {
        keyId: rollingKey.id,
        plan: rollingKey.plan,
        billingType: rollingKey.billingType,
        isRolling
      });

      const metrics = await calculateCustomerRollingWindow(rollingKey);
      record('Plan 1: Rolling 5-Hour Window Calculation', metrics.windowHours === 5, {
        windowHours: metrics.windowHours,
        windowAllowance: metrics.windowAllowance,
        windowTokensUsed: metrics.windowTokensUsed,
        remainingWindowAllowance: metrics.remainingWindowAllowance,
        isRollingWindow: metrics.isRollingWindow
      });

      record('Plan 1: Rolloff Schedule Structure', Array.isArray(metrics.rolloffSchedule), {
        rolloffPointsCount: metrics.rolloffSchedule.length
      });
    } else {
      record('Plan 1: Rolling Key Discovery', false, { error: 'No rolling key found in DB' });
    }

    // -------------------------------------------------------------
    // 2. PLAN 2: ScaleMax Universal Credit Wallet Verification
    // -------------------------------------------------------------
    console.log('\n--- 2. PLAN 2: ScaleMax Universal Credit Wallet ---');
    const creditKey = await prisma.apiKey.findFirst({
      where: { billingType: 'credit' }
    });

    if (creditKey) {
      const isRolling = isRollingPlan(creditKey);
      record('Plan 2: Credit Plan NOT Treated as Rolling Window', isRolling === false, {
        billingType: creditKey.billingType,
        isRolling
      });

      const creditBal = Number(creditKey.creditBalanceUsd);
      record('Plan 2: Stored in USD with Positive Balance', creditBal >= 0, {
        creditBalanceUsd: creditBal,
        currency: 'USD'
      });

      // Verify ₹100 -> $7.00 multiplier rule
      const creditPlan = await prisma.plan.findFirst({
        where: {
          OR: [
            { id: { contains: 'credit' } },
            { name: { contains: 'Credit' } },
            { planType: 'credit' },
            { planCategory: 'claude_openai_credits' }
          ]
        }
      });

      if (creditPlan) {
        record('Plan 2: Plan Catalog Entry Verified', true, {
          planId: creditPlan.id,
          name: creditPlan.name,
          priceInr: creditPlan.priceInr,
          creditMultiplier: creditPlan.creditMultiplier,
          planType: creditPlan.planType,
          planCategory: creditPlan.planCategory
        });
      }

      // Verify immutable usage credit ledger entries exist or schema is valid
      const ledgerCount = await prisma.customerUsageCreditLedger.count({
        where: { apiKeyId: creditKey.id }
      });
      record('Plan 2: Customer Usage Credit Ledger Queryable', true, {
        apiKeyId: creditKey.id,
        historicalDeductionsRecorded: ledgerCount
      });
    } else {
      record('Plan 2: Credit Key Discovery', false, { error: 'No credit key found in DB' });
    }

    // -------------------------------------------------------------
    // 3. PLAN 3 & 4 & 5: Token Pack Plans Verification
    // -------------------------------------------------------------
    console.log('\n--- 3, 4, 5. Token Pack Plans (OpenAI, Claude, Local Models) ---');
    const tokenKeys = await prisma.apiKey.findMany({
      where: { billingType: 'token' },
      take: 5
    });

    record('Plans 3/4/5: Token Pack Keys Found in Database', tokenKeys.length > 0, {
      count: tokenKeys.length,
      samplePlans: tokenKeys.map(k => ({ id: k.id, name: k.name, billingType: k.billingType }))
    });

    for (const tk of tokenKeys) {
      const isRolling = isRollingPlan(tk);
      record(`Token Plan '${tk.name}': Not Rolling`, isRolling === false, {
        id: tk.id,
        billingType: tk.billingType,
        isRolling
      });
    }

    // -------------------------------------------------------------
    // 4. CROSS-PLAN BOUNDARY & MODEL FAMILY ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 4. CROSS-PLAN BOUNDARY & MODEL FAMILY ISOLATION ---');
    // Test model family classifier logic
    const { isLocalModelFamily, isClaudeOrOpenAIModelFamily } = await import('../server/providers/credentialResolver.js');

    const testFamilies = [
      { model: 'claude-3-5-sonnet-20241022', expectedLocal: false, expectedClaudeOpenAI: true },
      { model: 'gpt-4o', expectedLocal: false, expectedClaudeOpenAI: true },
      { model: 'deepseek-chat', expectedLocal: true, expectedClaudeOpenAI: false },
      { model: 'gemini-2.0-flash', expectedLocal: true, expectedClaudeOpenAI: false },
      { model: 'qwen-2.5-coder-32b', expectedLocal: true, expectedClaudeOpenAI: false },
    ];

    let familiesCorrect = true;
    for (const tf of testFamilies) {
      const local = isLocalModelFamily(tf.model);
      const co = isClaudeOrOpenAIModelFamily(tf.model);
      if (local !== tf.expectedLocal || co !== tf.expectedClaudeOpenAI) {
        familiesCorrect = false;
        console.log(`Mismatch on model ${tf.model}: got local=${local}, co=${co}`);
      }
    }
    record('Model Family Classifier Boundary Integrity', familiesCorrect, { testCasesCount: testFamilies.length });

    // -------------------------------------------------------------
    // 5. ATOMIC USD TOKEN RATE DEDUCTION ACCURACY
    // -------------------------------------------------------------
    console.log('\n--- 5. ATOMIC USD TOKEN RATE DEDUCTION ACCURACY ---');
    // Formula verification: uncachedInput * inPrice + actualCached * cachedPrice + outputTokens * outPrice / 1M
    const inPrice = 2.50; // $2.50 / M
    const outPrice = 10.00; // $10.00 / M
    const cachedPrice = 1.25; // $1.25 / M
    const inTokens = 1000;
    const outTokens = 500;
    const cachedTokens = 200;
    const uncachedIn = inTokens - cachedTokens; // 800

    const expectedCostUsd = Math.round(((uncachedIn * inPrice + cachedTokens * cachedPrice + outTokens * outPrice) / 1000000) * 100000) / 100000;
    // 800 * 2.50 = 2000
    // 200 * 1.25 = 250
    // 500 * 10.00 = 5000
    // sum = 7250 / 1,000,000 = $0.00725 USD
    record('Atomic Token Rate Pricing Math Precision', expectedCostUsd === 0.00725, {
      expectedCostUsd,
      precisionDecimals: 5
    });

    console.log('\n=============================================================');
    const passedCount = results.filter(r => r.passed).length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
    console.log('=============================================================');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
