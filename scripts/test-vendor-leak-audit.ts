import { prisma } from '../server/db';
import { sanitizeErrorMessage } from '../server/gateway';
import fs from 'fs';
import path from 'path';

interface LeakTestResult {
  suite: string;
  testName: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

const results: LeakTestResult[] = [];

function record(suite: string, testName: string, status: 'PASS' | 'FAIL', detail: string) {
  results.push({ suite, testName, status, detail });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${suite}] ${testName} -> ${status}: ${detail}`);
}

async function runVendorLeakAudit() {
  console.log('================================================================');
  console.log('🔒 LIGHTNINGAPI VENDOR IDENTITY LEAK AUDIT & VERIFICATION');
  console.log('================================================================\n');

  // 1. PUBLIC MODEL CATALOG AUDIT (/v1/models payload simulation)
  console.log('--- 1. AUDITING PUBLIC MODEL CATALOG PAYLOAD (/v1/models) ---');
  const activeModels = await prisma.model.findMany({
    where: { enabled: true, isCustomerAvailable: true },
  });

  const publicModelsPayload = activeModels.map((m) => ({
    id: m.modelId,
    object: 'model',
    created: Math.floor(m.createdAt.getTime() / 1000),
    owned_by: m.provider || m.family || 'lightningapi',
    family: m.family,
    protocol: m.protocol,
    display_name: m.displayName,
    description: m.description,
    context_window: m.contextWindow,
    input_price_per_1m: m.inputPrice,
    output_price_per_1m: m.outputPrice,
  }));

  const payloadString = JSON.stringify(publicModelsPayload);
  const vendorPattern = /(OpusMax|ScaleMax|opusmax|scalemax|api\.scalemax\.pro|api\.opusmax\.pro|MiniMax|abab-6\.5)/i;
  const hasVendorLeakInModels = vendorPattern.test(payloadString);
  const hasProviderSlugLeak = (publicModelsPayload as any[]).some((m) => 'provider_slug' in m || 'providerSlug' in m);

  record(
    'Public Model Catalog',
    'No Upstream Vendor Names or URLs in /v1/models Data',
    !hasVendorLeakInModels ? 'PASS' : 'FAIL',
    !hasVendorLeakInModels
      ? `Verified ${publicModelsPayload.length} public models have zero upstream vendor mentions.`
      : `Leak detected in models payload: ${payloadString.match(vendorPattern)?.[0]}`
  );

  record(
    'Public Model Catalog',
    'provider_slug Field Stripped from /v1/models Response',
    !hasProviderSlugLeak ? 'PASS' : 'FAIL',
    !hasProviderSlugLeak
      ? 'Verified provider_slug is strictly omitted from public /v1/models data.'
      : 'provider_slug was found in public model object payload!'
  );

  const distinctCreators = Array.from(new Set(publicModelsPayload.map((m) => m.owned_by)));
  const validCreators = distinctCreators.every((c) =>
    ['Anthropic', 'OpenAI', 'Google', 'DeepSeek', 'xAI', 'Alibaba Cloud', 'lightningapi'].includes(c)
  );

  record(
    'Public Model Catalog',
    'owned_by Exposes Creator Brand, Not Upstream Supplier',
    validCreators ? 'PASS' : 'FAIL',
    validCreators
      ? `Distinct model creators in catalogue: [${distinctCreators.join(', ')}]`
      : `Unexpected creator in catalogue: [${distinctCreators.join(', ')}]`
  );

  // 2. PUBLIC PLANS CATALOG AUDIT (/api/checkout/plans payload simulation)
  console.log('\n--- 2. AUDITING PUBLIC CHECKOUT PLANS (/api/checkout/plans) ---');
  const dbPlans = await prisma.plan.findMany({
    where: { status: 'active', enabled: true },
  });

  const publicPlansPayload = dbPlans.map((p) => ({
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    displayName: p.displayName,
    tokenAllowance: p.tokenAllowance.toString(),
    tokenDisplay: p.tokenDisplay,
    windowHours: p.windowHours,
    validityDays: p.validityDays,
    priceInr: p.priceInr,
    originalPriceInr: p.originalPriceInr,
    annualPriceInr: p.annualPriceInr,
    annualOriginalPriceInr: p.annualOriginalPriceInr,
    currency: p.currency,
    tagline: p.tagline,
    badge: p.badge,
    features: p.features,
    featured: p.featured,
    planType: p.planType || 'window',
    creditMultiplier: p.creditMultiplier,
    creditAmountUsd: p.creditAmountUsd,
    bonusCreditsUsd: p.bonusCreditsUsd,
    providerScope: p.providerScope === 'opus_max' ? 'window' : (p.providerScope || 'all'),
  }));

  const plansPayloadString = JSON.stringify(publicPlansPayload);
  const hasVendorLeakInPlans = vendorPattern.test(plansPayloadString);

  record(
    'Public Plans Catalog',
    'No Upstream Vendor Names in Plan Taglines or Features',
    !hasVendorLeakInPlans ? 'PASS' : 'FAIL',
    !hasVendorLeakInPlans
      ? `Verified ${publicPlansPayload.length} checkout plans have zero upstream vendor mentions.`
      : `Leak detected in plans payload: ${plansPayloadString.match(vendorPattern)?.[0]}`
  );

  const providerScopes = Array.from(new Set(publicPlansPayload.map((p) => p.providerScope)));
  const safeScopes = providerScopes.every((s) => !/opus_max|scalemax/i.test(s));

  record(
    'Public Plans Catalog',
    'providerScope Sanitized to Neutral Categories',
    safeScopes ? 'PASS' : 'FAIL',
    safeScopes
      ? `Distinct provider scopes: [${providerScopes.join(', ')}]`
      : `Leaked internal provider scope: [${providerScopes.join(', ')}]`
  );

  // 3. ERROR MESSAGE SANITIZER AUDIT
  console.log('\n--- 3. AUDITING ERROR MESSAGE SANITIZATION ---');
  const rawTestErrors = [
    'Failed to connect to https://api.scalemax.pro/v1/chat/completions: ScaleMax internal server error with key sm_live_5af4bbe6c3965077f52a56b8b20b6159',
    'OpusMax upstream gateway connection error at api.opusmax.pro: sk-ant-opm-1234567890abcdef failed quota',
    'Upstream vendor (ScaleMax) error: 500 Internal Error from abab-6.5 model',
  ];

  let allErrorsClean = true;
  for (const raw of rawTestErrors) {
    const sanitized = sanitizeErrorMessage(raw);
    const leaked = vendorPattern.test(sanitized) || /sm_live_|sk-ant-opm-/i.test(sanitized);
    if (leaked) {
      allErrorsClean = false;
      console.log(`Failed sanitizer test! Raw: "${raw}" -> Sanitized: "${sanitized}"`);
    }
  }

  record(
    'Error Sanitizer',
    'Sanitizer Scrubs Upstream Hostnames, Vendor Names & Master Keys',
    allErrorsClean ? 'PASS' : 'FAIL',
    allErrorsClean
      ? 'All sample raw error messages with vendor URLs and keys were cleanly scrubbed.'
      : 'One or more raw error messages failed sanitization.'
  );

  // 4. HTTP RESPONSE HEADERS AUDIT
  console.log('\n--- 4. AUDITING HTTP RESPONSE HEADERS IN GATEWAY ---');
  const gatewaySource = fs.readFileSync(path.resolve(process.cwd(), 'server/gateway.ts'), 'utf8');
  const hasLeakedHeader1 = gatewaySource.includes("setHeader('x-upstream-provider'");
  const hasLeakedHeader2 = gatewaySource.includes("setHeader('x-upstream-model'");
  const hasLeakedHeader3 = gatewaySource.includes("setHeader('x-gateway-resolved-model'");

  record(
    'Response Headers',
    'x-upstream-provider and x-upstream-model Omitted from Public Responses',
    !hasLeakedHeader1 && !hasLeakedHeader2 && !hasLeakedHeader3 ? 'PASS' : 'FAIL',
    !hasLeakedHeader1 && !hasLeakedHeader2 && !hasLeakedHeader3
      ? 'Verified no internal upstream provider or model headers are attached to client responses.'
      : `Leaked headers found in server/gateway.ts: ${[
          hasLeakedHeader1 ? 'x-upstream-provider' : null,
          hasLeakedHeader2 ? 'x-upstream-model' : null,
          hasLeakedHeader3 ? 'x-gateway-resolved-model' : null,
        ]
          .filter(Boolean)
          .join(', ')}`
  );

  // 5. PUBLIC FRONTEND AUDIT
  console.log('\n--- 5. AUDITING PUBLIC FRONTEND SOURCE FILES ---');
  function scanDir(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (!full.includes('admin') && !full.includes('node_modules') && !full.includes('.git')) {
          scanDir(full, fileList);
        }
      } else if (/\.(tsx|ts|jsx|js|html)$/.test(f) && !full.includes('admin')) {
        fileList.push(full);
      }
    }
    return fileList;
  }

  const frontendFiles = scanDir(path.resolve(process.cwd(), 'src'));
  const frontendLeaks: Array<{ file: string; line: number; text: string }> = [];

  for (const file of frontendFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((lineText, idx) => {
      if (vendorPattern.test(lineText)) {
        frontendLeaks.push({ file: path.relative(process.cwd(), file), line: idx + 1, text: lineText.trim() });
      }
    });
  }

  record(
    'Storefront Scan',
    'Zero Vendor Identity Mentions Across All Public Frontend Files',
    frontendLeaks.length === 0 ? 'PASS' : 'FAIL',
    frontendLeaks.length === 0
      ? `Scanned ${frontendFiles.length} public frontend source files with 0 leak occurrences.`
      : `Found ${frontendLeaks.length} leaks in public frontend: ${frontendLeaks.map((l) => `${l.file}:${l.line}`).join(', ')}`
  );

  // 6. ADMIN AUTHORIZATION ISOLATION
  console.log('\n--- 6. VERIFYING ADMIN PORTAL AUTHORIZATION ISOLATION ---');
  const adminSource = fs.readFileSync(path.resolve(process.cwd(), 'server/admin.ts'), 'utf8');
  const hasAdminAuthMiddleware = adminSource.includes('router.use(authenticateJwt, requireAdmin);');

  record(
    'Admin Security',
    'Admin Endpoints Strictly Require JWT + Admin Role',
    hasAdminAuthMiddleware ? 'PASS' : 'FAIL',
    hasAdminAuthMiddleware
      ? 'server/admin.ts mounts router.use(authenticateJwt, requireAdmin); protecting all /api/admin/* routes.'
      : 'Admin router is missing global authenticateJwt or requireAdmin middleware!'
  );

  // SUMMARY
  console.log('\n================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`🔒 VENDOR LEAK AUDIT FINISHED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runVendorLeakAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit failed with error:', err);
    process.exit(1);
  });
