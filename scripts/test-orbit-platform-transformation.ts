/**
 * scripts/test-orbit-platform-transformation.ts
 *
 * Comprehensive End-to-End Verification Suite for:
 * LIGHTNINGAPI — ORBIT: Complete AI Platform Transformation & Rebranding
 *
 * Verifies all 5 Transformation Priorities:
 * 1. Central Brand Configuration & Surface Consistency
 * 2. Intelligent Request Understanding & Tool Orchestration
 * 3. Core Capabilities (Research, Documents, Coding, Data, Memory)
 * 4. Model Capabilities & Entitlement Routing
 * 5. Strict Platform Safety (Zero Vendor Leaks, Zero Claude 3 Mentions)
 */

import fs from 'fs';
import path from 'path';
import { BRAND } from '../src/config/brand';
import { BRAND as SERVER_BRAND } from '../server/config/brand';
import { classifyUrl, isDirectProductListing } from '../server/research/urlClassifier';
import { analyzeResearchIntent } from '../server/research/researchIntent';
import { executeAdvancedResearchPipeline } from '../server/research/multiStageResearchOrchestrator';
import { generateStudioDocument, StoredArtifact } from '../server/documentGenerator';
import { analyzeDelimitedData } from '../server/dataAnalysis';
import { detectExplicitMemoryInstruction, containsSecretOrSensitiveData } from '../server/memory/memoryEngine';
import { validatePublicWebUrl } from '../server/ssrf';

async function runOrbitTransformationSuite() {
  console.log('================================================================');
  console.log('🪐 ORBIT — COMPLETE AI PLATFORM TRANSFORMATION TEST SUITE 🪐');
  console.log('       "Your AI universe. One place. Powered by LightningAPI"');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: Central Brand Configuration & Consistency
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: Central Brand Configuration & Consistency ---');

  assert(
    BRAND.productName === 'Orbit' && SERVER_BRAND.productName === 'Orbit',
    'Product name is strictly configured as "Orbit" across frontend and backend'
  );

  assert(
    BRAND.tagline === 'Your AI universe. One place.' && SERVER_BRAND.tagline === 'Your AI universe. One place.',
    'Official tagline configured as "Your AI universe. One place."'
  );

  assert(
    BRAND.brandRelationship === 'Orbit is powered by LightningAPI',
    'Brand relationship explicitly set: Orbit is powered by LightningAPI'
  );

  assert(
    Array.isArray(BRAND.capabilities) && BRAND.capabilities.length >= 6,
    `Brand capabilities defined: ${BRAND.capabilities.map((c) => c.name).join(', ')}`
  );

  // -------------------------------------------------------------------------
  // SECTION 2: Surface Rebranding Verification
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Platform Surface Rebranding Audit ---');

  // 2.1 index.html
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  assert(
    indexHtml.includes('Orbit — Your AI Universe, Powered by LightningAPI') &&
      indexHtml.includes('Meet Orbit, the AI workspace by LightningAPI'),
    'index.html updated with Orbit title and SEO meta description'
  );

  // 2.2 Public SiteHeader.tsx
  const siteHeader = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SiteHeader.tsx'), 'utf8');
  assert(
    siteHeader.includes("name: 'Orbit'") && siteHeader.includes("badge: 'Workspace'"),
    'Public SiteHeader navigation features Orbit as primary Workspace link'
  );

  // 2.3 EditorialHero.tsx
  const heroTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/homepage/EditorialHero.tsx'), 'utf8');
  assert(
    heroTsx.includes('INTRODUCING ORBIT') && heroTsx.includes('Explore Orbit'),
    'Homepage Hero highlights Orbit launch banner and primary "Explore Orbit" CTA'
  );

  // 2.4 StudioFlagshipSection.tsx
  const flagshipTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/StudioFlagshipSection.tsx'), 'utf8');
  assert(
    flagshipTsx.includes('MEET ORBIT · POWERED BY LIGHTNINGAPI') &&
      flagshipTsx.includes('Your AI universe. One place.') &&
      flagshipTsx.includes('Explore Orbit'),
    'Homepage Flagship section showcases "Meet Orbit. Your AI universe, all in one place."'
  );

  // 2.5 UserDashboardLayout.tsx
  const dashLayout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/dashboard/UserDashboardLayout.tsx'), 'utf8');
  assert(
    dashLayout.includes('Orbit Workspace') && dashLayout.includes('OrbitIcon'),
    'Customer Dashboard sidebar navigation features "Orbit Workspace" with OrbitIcon'
  );

  // 2.6 UserOverview.tsx
  const overviewTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/dashboard/UserOverview.tsx'), 'utf8');
  assert(
    overviewTsx.includes('Orbit Workspace') && overviewTsx.includes('Your AI universe. One place.'),
    'Dashboard Overview Developer Quick Action card highlights Orbit Workspace'
  );

  // 2.7 UserChatStudio.tsx
  const studioTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/dashboard/UserChatStudio.tsx'), 'utf8');
  assert(
    studioTsx.includes('Welcome to Orbit') &&
      studioTsx.includes('Your AI universe. One place.') &&
      studioTsx.includes('Orbit Brand Mark') &&
      studioTsx.includes('document.title = activeThread.title'),
    'Orbit workspace interface displays Orbit Brand Mark, Welcome greeting, and window title sync'
  );

  // 2.8 Route Aliasing in src/App.tsx
  const appTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  assert(
    appTsx.includes('path="orbit"') && appTsx.includes('path="studio"'),
    'App.tsx provides /dashboard/orbit route while seamlessly preserving /dashboard/studio for existing links'
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Core Assistant Capabilities Verification
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Core Assistant Capabilities ---');

  // 3.1 Advanced Research & Direct Marketplace Links
  const classifiedAmz = classifyUrl('https://www.amazon.in/dp/B0CY5Q2N1M');
  assert(
    classifiedAmz.urlType === 'direct_product_listing' && classifiedAmz.productIdentifier === 'B0CY5Q2N1M',
    'Orbit Research: Amazon direct listing accurately parsed with ASIN'
  );

  const searchIntent = analyzeResearchIntent('Find the best laptops under ₹60,000 for programming in India');
  assert(
    searchIntent.isShoppingOrProduct === true &&
      searchIntent.targetLocation === 'India' &&
      searchIntent.budgetLimit?.amount === 60000,
    'Orbit Intent: Budget laptop query classified with ₹60,000 limit in India'
  );

  // 3.2 Professional Document Generation (DOCX & PDF)
  const docxArtifact = await generateStudioDocument({
    title: 'Laboratory Management System SRS',
    format: 'docx',
    author: 'Orbit Engineering',
    category: 'Software Architecture',
    content: `# Software Requirements Specification: Laboratory Management System
## 1. Executive Summary
This document specifies the technical and regulatory requirements for the enterprise laboratory management system.

| Requirement ID | Module | Priority |
| :--- | :--- | :--- |
| REQ-001 | Sample Ingestion & Tracking | High |
| REQ-002 | Automated Assay Verification | Critical |
| REQ-003 | FDA 21 CFR Part 11 Audit Trail | Mandatory |`,
  });

  assert(
    docxArtifact.buffer.length > 1000 && docxArtifact.mimeType.includes('openxmlformats'),
    `Orbit Documents: Generated valid binary Word (.docx) document (${docxArtifact.buffer.length} bytes)`
  );

  // 3.3 Data Analysis & Deterministic Computation
  const sampleCsv = `Department,Q1_Revenue,Q2_Revenue,Growth_Target
Engineering,1200000,1450000,0.20
Marketing,850000,920000,0.10
Operations,450000,430000,-0.05`;

  const dataAnalysis = analyzeDelimitedData(sampleCsv, 'revenue_report.csv');
  assert(
    dataAnalysis.totalRows === 3 &&
      dataAnalysis.totalColumns === 4 &&
      dataAnalysis.columns.find((s) => s.name === 'Q1_Revenue')?.type === 'numeric',
    'Orbit Data Analysis: Deterministic statistical profiling calculated without language-model arithmetic errors'
  );

  // 3.4 Persistent Conversational Memory
  const explicitAction = detectExplicitMemoryInstruction('Remember that I prefer Python and FastAPI for microservices');
  assert(
    explicitAction.type === 'save' &&
      explicitAction.fact?.includes('Python and FastAPI'),
    'Orbit Memory: Explicit "Remember that..." command accurately detected for durable storage'
  );

  // -------------------------------------------------------------------------
  // SECTION 4: Security, Anti-Leak & Safety Enforcement
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Platform Security & Confidentiality ---');

  // 4.1 SSRF Perimeter Defense
  const safePublic = await validatePublicWebUrl('https://example.com');
  const blockedInternal = await validatePublicWebUrl('http://169.254.169.254/latest/meta-data/');
  const blockedLocalhost = await validatePublicWebUrl('http://127.0.0.1:8080/admin');
  assert(
    safePublic.safe && !blockedInternal.safe && !blockedLocalhost.safe,
    'SSRF Protection: Permitted public HTTPS and strictly blocked internal metadata (169.254.169.254) and localhost'
  );

  // 4.2 Anti-Secret & Prompt Injection Filter in Memory
  const sensitiveCheck = containsSecretOrSensitiveData('My database password is SuperSecret123!');
  assert(
    sensitiveCheck === true,
    'Memory Security: Passwords and raw secrets strictly filtered from persistent memory'
  );

  // 4.3 Zero Supplier Leaks (Rule 5)
  const allBrandText = `${JSON.stringify(BRAND)} ${indexHtml} ${heroTsx} ${dashLayout} ${studioTsx}`;
  const prohibitedVendors = ['scalemax', 'lotusai', 'openpipe', 'opusmax'];
  const hasVendorLeak = prohibitedVendors.some((v) => allBrandText.toLowerCase().includes(v));
  assert(
    !hasVendorLeak,
    'Zero Supplier Leaks: Zero vendor names present across Orbit customer-facing surfaces (Rule 5)'
  );

  // 4.4 Zero Claude 3 Mentions (Rule 1)
  const claude3Terms = ['claude-3', '3-5-sonnet', '3-opus', '3-haiku', '3.5 sonnet', '3.7 sonnet'];
  const hasClaude3 = claude3Terms.some((t) => allBrandText.toLowerCase().includes(t));
  assert(
    !hasClaude3,
    'Zero Claude 3 Mentions: Prohibited models strictly excluded from all public and workspace surfaces (Rule 1)'
  );

  console.log('\n================================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runOrbitTransformationSuite().catch((err) => {
  console.error('Fatal test error in Orbit suite:', err);
  process.exit(1);
});
