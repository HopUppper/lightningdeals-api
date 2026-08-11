import fs from 'fs';
import path from 'path';

async function validateSeoSuite() {
  console.log('⚡ LightningDeals — Complete SEO Audit & Automated Validation Suite');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const distDir = path.resolve(process.cwd(), 'dist');
  const publicDir = path.resolve(process.cwd(), 'public');

  // 1. Robots.txt Validation
  console.log('--- TEST GROUP 1: Crawl Control & Robots.txt ---');
  const robotsPath = path.resolve(publicDir, 'robots.txt');
  assert(fs.existsSync(robotsPath), 'public/robots.txt file exists');

  if (fs.existsSync(robotsPath)) {
    const robotsText = fs.readFileSync(robotsPath, 'utf-8');
    assert(robotsText.includes('Disallow: /admin'), 'robots.txt blocks /admin path');
    assert(robotsText.includes('Disallow: /dashboard'), 'robots.txt blocks /dashboard path');
    assert(robotsText.includes('Sitemap: https://lightningapi.pro/sitemap.xml'), 'robots.txt specifies canonical sitemap.xml URL');
  }

  // 2. Sitemap.xml Validation
  console.log('\n--- TEST GROUP 2: XML Sitemap ---');
  const sitemapPath = path.resolve(publicDir, 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'public/sitemap.xml file exists');

  if (fs.existsSync(sitemapPath)) {
    const sitemapText = fs.readFileSync(sitemapPath, 'utf-8');
    assert(sitemapText.includes('<loc>https://lightningapi.pro/</loc>'), 'sitemap.xml includes homepage canonical URL');
    assert(sitemapText.includes('<loc>https://lightningapi.pro/docs</loc>'), 'sitemap.xml includes docs canonical URL');
    assert(!sitemapText.includes('/admin'), 'sitemap.xml excludes private /admin routes');
    assert(!sitemapText.includes('/dashboard'), 'sitemap.xml excludes private /dashboard routes');
  }

  // 3. Pre-rendered HTML Page Validation
  console.log('\n--- TEST GROUP 3: Pre-rendered Metadata & Canonical Audit ---');

  const htmlFiles = [
    'index.html',
    'docs.html',
    'pricing.html',
    'models.html',
    'status.html',
    'check-key.html',
    'trial.html',
    'request-quote.html',
    'terms.html',
    'privacy.html',
    'refund.html',
  ];

  const seenTitles = new Set<string>();
  const seenDescriptions = new Set<string>();

  for (const file of htmlFiles) {
    const filePath = path.resolve(distDir, file);
    const exists = fs.existsSync(filePath);
    assert(exists, `Pre-rendered file dist/${file} exists`);

    if (exists) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check Title
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '';
      assert(title.length >= 15, `dist/${file} has non-empty title (${title.length} chars: "${title}")`);
      assert(!seenTitles.has(title), `dist/${file} title is unique across pages`);
      seenTitles.add(title);

      // Check Description
      const descMatch = content.match(/<meta name="description" content="(.*?)"/);
      const desc = descMatch ? descMatch[1] : '';
      assert(desc.length >= 30, `dist/${file} has non-empty meta description (${desc.length} chars)`);
      assert(!seenDescriptions.has(desc), `dist/${file} description is unique across pages`);
      seenDescriptions.add(desc);

      // Check Canonical
      const canonicalMatch = content.match(/<link rel="canonical" href="(.*?)"/);
      const canonical = canonicalMatch ? canonicalMatch[1] : '';
      assert(canonical.startsWith('https://lightningapi.pro'), `dist/${file} canonical URL points to https://lightningapi.pro...`);

      // Check Open Graph & Twitter Cards
      assert(content.includes('og:title'), `dist/${file} contains og:title metadata`);
      assert(content.includes('twitter:card'), `dist/${file} contains twitter:card metadata`);

      // Check Brand Isolation (No ScaleMax, OpusMax, OpusLive)
      const lowerContent = content.toLowerCase();
      assert(!lowerContent.includes('scalemax'), `dist/${file} contains zero ScaleMax supplier mentions`);
      assert(!lowerContent.includes('opusmax'), `dist/${file} contains zero OpusMax supplier mentions`);
      assert(!lowerContent.includes('opuslive'), `dist/${file} contains zero OpusLive supplier mentions`);
    }
  }

  // 4. Structured Data JSON-LD Audit
  console.log('\n--- TEST GROUP 4: Structured Data (JSON-LD) Audit ---');
  const indexContent = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');
  assert(indexContent.includes('application/ld+json'), 'Homepage dist/index.html contains JSON-LD structured data');
  assert(indexContent.includes('FAQPage'), 'Homepage JSON-LD contains FAQPage schema');

  console.log('\n=================================================================');
  console.log(`AUTOMATED SEO VALIDATION COMPLETED: ${passed} PASSED, ${failed} FAILED.`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

validateSeoSuite().catch(console.error);
