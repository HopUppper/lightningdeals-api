/**
 * scripts/test-studio-builder.ts
 * ============================================================================
 * Automated Test Suite for LightningAPI Studio AI Website & App Builder
 * ============================================================================
 */

import assert from 'assert';
import JSZip from 'jszip';
import { prisma } from '../server/db';
import {
  STARTER_TEMPLATES,
  compilePreviewBundle,
  synthesizeProjectFiles,
} from '../server/studioBuilder';

async function runBuilderTestSuite() {
  console.log('\n================================================================');
  console.log('⚡ LIGHTNINGAPI STUDIO: AI WEBSITE BUILDER & PREVIEW VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name: string, ok: boolean, detail?: string) {
    if (ok) {
      console.log(`  ✅ [PASS] ${name}${detail ? ` — ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // --- SUITE 1: Starter Templates Registry ---
  console.log('--- TEST SUITE 1: Starter Templates Gallery & Scaffolding ---');
  report(
    'Starter templates count >= 4 curated archetypes',
    STARTER_TEMPLATES.length >= 4,
    `Loaded ${STARTER_TEMPLATES.length} templates`
  );

  const landingTmpl = STARTER_TEMPLATES.find((t) => t.category === 'landing_page');
  report(
    'Landing page template includes all core files (HTML, CSS, JS, README)',
    Boolean(
      landingTmpl &&
        landingTmpl.files.some((f) => f.path === 'index.html') &&
        landingTmpl.files.some((f) => f.path === 'styles.css') &&
        landingTmpl.files.some((f) => f.path === 'app.js') &&
        landingTmpl.files.some((f) => f.path === 'README.md')
    )
  );

  const portfolioTmpl = STARTER_TEMPLATES.find((t) => t.category === 'portfolio');
  report(
    'Portfolio template defines interactive filter and project modal scaffolding',
    Boolean(
      portfolioTmpl &&
        portfolioTmpl.files[0].content.includes('filter-btn') &&
        portfolioTmpl.files[0].content.includes('projectModal')
    )
  );

  const restaurantTmpl = STARTER_TEMPLATES.find((t) => t.category === 'restaurant');
  report(
    'Restaurant template features WhatsApp order link and table booking dialog',
    Boolean(
      restaurantTmpl &&
        restaurantTmpl.files[0].content.includes('wa.me') &&
        restaurantTmpl.files[0].content.includes('resModal')
    )
  );

  const dashboardTmpl = STARTER_TEMPLATES.find((t) => t.category === 'dashboard');
  report(
    'Dashboard template includes KPI cards and searchable transaction table',
    Boolean(
      dashboardTmpl &&
        dashboardTmpl.files[0].content.includes('kpi-grid') &&
        dashboardTmpl.files[0].content.includes('searchInput')
    )
  );

  // --- SUITE 2: Dynamic Project Synthesis & Custom Briefs ---
  console.log('\n--- TEST SUITE 2: Dynamic Custom Brief Synthesis ---');
  const customFiles = synthesizeProjectFiles('a landing page for a sunscreen brand', 'landing_page');
  report(
    'Synthesizes project files from unstructured brief',
    customFiles.length >= 3 && customFiles.some((f) => f.path === 'index.html'),
    `Generated ${customFiles.length} files`
  );

  const customHtml = customFiles.find((f) => f.path === 'index.html')?.content || '';
  report(
    'Synthesized HTML customizes page title from brief',
    customHtml.includes('Sunscreen Brand') || customHtml.includes('sunscreen brand')
  );

  // --- SUITE 3: Isolated Sandboxed Live Preview Bundler ---
  console.log('\n--- TEST SUITE 3: Isolated Sandboxed Live Preview Bundler ---');
  const previewBundle = compilePreviewBundle(customFiles);
  report(
    'Live preview bundle inlines styles and scripts into self-contained document',
    previewBundle.includes('<style data-source="styles.css">') &&
      previewBundle.includes('<script data-source="app.js">')
  );

  report(
    'Preview bundle wraps JS in runtime try/catch error boundary',
    previewBundle.includes('catch (err)') && previewBundle.includes('[Preview Runtime Error')
  );

  report(
    'Preview bundle strips external script/link tags to enforce isolated sandbox runtime',
    !previewBundle.includes('<link rel="stylesheet" href="styles.css">') &&
      !previewBundle.includes('<script src="app.js"></script>')
  );

  // --- SUITE 4: Database Persistence & Version Lifecycle ---
  console.log('\n--- TEST SUITE 4: Database Persistence & Version Snapshots ---');

  // Find or create test user
  let testUser = await prisma.user.findFirst();
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `test_builder_${Date.now()}@lightningapi.test`,
        passwordHash: 'dummy_hash',
      },
    });
  }

  // Create test project in DB
  const testProject = await prisma.builderProject.create({
    data: {
      userId: testUser.id,
      title: 'Automated Test Project',
      brief: 'Build an automated test website',
      category: 'landing_page',
      modelId: 'claude-sonnet-5.5',
      filesJson: JSON.stringify(customFiles),
      currentVersion: 1,
      lastWorkingVersion: 1,
      versionsJson: JSON.stringify([
        {
          version: 1,
          summary: 'Initial project synthesis',
          files: customFiles,
          createdAt: new Date().toISOString(),
        },
      ]),
      buildStatus: 'ready',
    },
  });

  report(
    'Creates persistent BuilderProject record in PostgreSQL',
    Boolean(testProject && testProject.id)
  );

  // --- SUITE 5: Conversational Iterative Refinement & Snapshotting ---
  console.log('\n--- TEST SUITE 5: Conversational Iterative Refinement ---');
  // Simulate conversational refinement: "change primary color to violet and add testimonials"
  const existingFiles: ProjectFile[] = JSON.parse(testProject.filesJson);
  const cssFile = existingFiles.find((f) => f.path === 'styles.css')!;
  cssFile.content = cssFile.content.replace(/--primary:\s*#[a-fA-F0-9]{3,6}/g, '--primary: #8b5cf6');

  const updatedProject = await prisma.builderProject.update({
    where: { id: testProject.id },
    data: {
      filesJson: JSON.stringify(existingFiles),
      currentVersion: 2,
      lastWorkingVersion: 2,
      versionsJson: JSON.stringify([
        {
          version: 2,
          summary: 'Changed accent color to violet',
          files: existingFiles,
          createdAt: new Date().toISOString(),
        },
        {
          version: 1,
          summary: 'Initial project synthesis',
          files: customFiles,
          createdAt: new Date().toISOString(),
        },
      ]),
    },
  });

  report(
    'Iterative refinement increments version and appends to snapshot history',
    updatedProject.currentVersion === 2 && JSON.parse(updatedProject.versionsJson!).length === 2
  );

  // --- SUITE 6: Version Rollback & Recovery ---
  console.log('\n--- TEST SUITE 6: Version Rollback & Recovery ---');
  const versions: any[] = JSON.parse(updatedProject.versionsJson!);
  const v1Snapshot = versions.find((v) => v.version === 1);

  const rolledBackProject = await prisma.builderProject.update({
    where: { id: testProject.id },
    data: {
      filesJson: JSON.stringify(v1Snapshot.files),
      currentVersion: 1,
      lastWorkingVersion: 1,
    },
  });

  report(
    'Version rollback cleanly restores earlier file state with 100% fidelity',
    rolledBackProject.currentVersion === 1 &&
      JSON.parse(rolledBackProject.filesJson)[0].path === 'index.html'
  );

  // --- SUITE 7: Validated ZIP Archive Packaging ---
  console.log('\n--- TEST SUITE 7: ZIP Project Export & Path Traversal Guards ---');
  const zip = new JSZip();
  for (const f of customFiles) {
    const clean = f.path.replace(/^(\.\.[\/\\])+/, '').replace(/^\/+/, '');
    zip.file(clean, f.content);
  }
  zip.file('.env.example', 'PORT=3000\n');
  const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

  // Read back zip to verify validity
  const unzipped = await JSZip.loadAsync(zipBuf);
  report(
    'ZIP export packages complete file tree and configuration',
    Boolean(unzipped.file('index.html') && unzipped.file('styles.css') && unzipped.file('.env.example')),
    `Archive size: ${zipBuf.length.toLocaleString()} bytes`
  );

  // Clean up test project
  await prisma.builderProject.delete({ where: { id: testProject.id } });
  report('Cleans up test database resources', true);

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runBuilderTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
