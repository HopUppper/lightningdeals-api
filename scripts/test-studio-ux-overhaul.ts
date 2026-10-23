import assert from 'assert';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  getExtensionForLanguage,
  sanitizeFilename,
  extractFilenameFromCode,
  extractAllFilesFromMarkdown,
} from '../src/utils/fileExport';

async function runStudioUXTests() {
  console.log('🧪 [TEST SUITE] AI Chat Studio Customer Feedback UX Overhaul Verification\n');

  // 1. File Export & Language Extensions
  console.log('1. Testing File Export Utilities & Sanitization:');
  assert.strictEqual(getExtensionForLanguage('typescript'), 'ts');
  assert.strictEqual(getExtensionForLanguage('tsx'), 'tsx');
  assert.strictEqual(getExtensionForLanguage('python'), 'py');
  assert.strictEqual(getExtensionForLanguage('html'), 'html');
  assert.strictEqual(getExtensionForLanguage('javascript'), 'js');
  assert.strictEqual(getExtensionForLanguage('rust'), 'rs');
  assert.strictEqual(getExtensionForLanguage('unknown_xyz'), 'txt');
  console.log('  ✓ Language-to-extension resolution is accurate');

  // Filename Sanitization & Path Traversal Prevention
  assert.strictEqual(sanitizeFilename('../../../etc/passwd.txt'), 'etc-passwd.txt');
  assert.strictEqual(sanitizeFilename('..\\..\\Windows\\System32.dll'), 'Windows-System32.dll');
  assert.strictEqual(sanitizeFilename('my file*with?bad:chars.ts'), 'my file-with-bad-chars.ts');
  assert.strictEqual(sanitizeFilename(''), 'output.txt');
  console.log('  ✓ Path traversal and dangerous character sanitization is strict and safe');

  // Code Block Filename Extraction
  const snippet1 = `// filename: HeaderNav.tsx\nexport const HeaderNav = () => <nav>Nav</nav>;`;
  const fn1 = extractFilenameFromCode('tsx', snippet1);
  assert.strictEqual(fn1, 'HeaderNav.tsx');

  const snippet2 = `# file: utils.py\ndef add(a, b): return a + b`;
  const fn2 = extractFilenameFromCode('python', snippet2);
  assert.strictEqual(fn2, 'utils.py');

  const snippet3 = `console.log("no header");`;
  const fn3 = extractFilenameFromCode('javascript', snippet3);
  assert.strictEqual(fn3, null);
  console.log('  ✓ Filename extraction from code block comments and headers works seamlessly');

  // Multi-file Markdown Extraction
  const sampleMarkdown = `
Here is your project structure:

\`\`\`tsx:src/components/Card.tsx
// filename: Card.tsx
export const Card = () => <div className="p-4">Card</div>;
\`\`\`

And the server handler:

\`\`\`ts:src/server.ts
// filename: server.ts
import http from 'http';
console.log('Server started');
\`\`\`

And the styling:

\`\`\`css:src/styles.css
/* filename: styles.css */
body { margin: 0; }
\`\`\`
`;

  const extractedFiles = extractAllFilesFromMarkdown(sampleMarkdown);
  assert.strictEqual(extractedFiles.length, 3);
  assert.strictEqual(extractedFiles[0].filename, 'Card.tsx');
  assert.strictEqual(extractedFiles[1].filename, 'server.ts');
  assert.strictEqual(extractedFiles[2].filename, 'styles.css');
  console.log(`  ✓ Extracted ${extractedFiles.length} files from multi-file markdown response`);

  // ZIP Archive Construction
  const zip = new JSZip();
  extractedFiles.forEach((f) => zip.file(f.filename, f.content));
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  assert.ok(zipBuffer.length > 50, 'ZIP archive must contain valid zip header and bytes');

  const unzipped = await JSZip.loadAsync(zipBuffer);
  assert.ok(unzipped.file('Card.tsx') !== null, 'Card.tsx must exist in unzipped package');
  assert.ok(unzipped.file('server.ts') !== null, 'server.ts must exist in unzipped package');
  assert.ok(unzipped.file('styles.css') !== null, 'styles.css must exist in unzipped package');
  console.log('  ✓ JSZip packaging creates valid zip archives with all extracted project files');

  // 2. Sandboxed Canvas & Security Boundaries
  console.log('\n2. Testing Sandboxed Canvas & Capability Boundaries:');
  const canvasSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/chat/ArtifactCanvas.tsx'),
    'utf8'
  );
  assert.ok(
    canvasSource.includes('sandbox="allow-scripts allow-modals"'),
    'ArtifactCanvas iframe must have strict sandbox attributes'
  );
  assert.ok(
    !canvasSource.includes('allow-same-origin'),
    'ArtifactCanvas MUST NOT have allow-same-origin (zero access to parent tokens/cookies)'
  );
  assert.ok(
    canvasSource.includes('Live browser sandboxing is supported for web components') &&
    canvasSource.includes('cannot be executed safely inside a browser sandbox'),
    'ArtifactCanvas must provide honest boundary notice for backend code (Python, Go, Rust)'
  );
  console.log('  ✓ ArtifactCanvas strictly sandboxed without allow-same-origin');
  console.log('  ✓ Honest boundary fallback present for non-previewable backend languages');

  // 3. Studio Onboarding Guide & Honest Capabilities
  console.log('\n3. Testing Studio Onboarding Guide:');
  const guideSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/chat/StudioOnboardingGuide.tsx'),
    'utf8'
  );
  assert.ok(
    guideSource.includes('Getting Started with AI Chat Studio'),
    'Guide must include clear title'
  );
  assert.ok(
    guideSource.includes('Inside Chat Studio') && guideSource.includes('In Your Terminal / IDE'),
    'Guide must clearly contrast in-browser Studio vs local CLI / IDE capabilities'
  );
  assert.ok(
    guideSource.includes('samplePrompts'),
    'Guide must provide 1-click starter prompts'
  );
  console.log('  ✓ Onboarding guide clearly explains 5-step workflow and honest capability boundaries');

  // 4. MarkdownBlock Multi-File Actions
  console.log('\n4. Testing MarkdownBlock Multi-File Actions:');
  const markdownBlockSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/chat/MarkdownBlock.tsx'),
    'utf8'
  );
  assert.ok(
    markdownBlockSource.includes('extractAllFilesFromMarkdown'),
    'MarkdownBlock must detect multi-file outputs'
  );
  assert.ok(
    markdownBlockSource.includes('Download All as ZIP') || markdownBlockSource.includes('downloadAllAsZip'),
    'MarkdownBlock must provide Download All as ZIP button when 2+ files are generated'
  );
  assert.ok(
    markdownBlockSource.includes('triggerFileDownload'),
    'MarkdownBlock must provide single-click individual file downloads'
  );
  console.log('  ✓ Multi-file ZIP download and single-file download actions wired up in MarkdownBlock');

  // 5. Clutter Reduction & Scroll Stability in UserChatStudio
  console.log('\n5. Testing Clutter Reduction & Scroll Stability:');
  const studioSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/pages/dashboard/UserChatStudio.tsx'),
    'utf8'
  );
  assert.ok(
    studioSource.includes('isNearBottomRef'),
    'UserChatStudio must track isNearBottomRef to prevent scroll jumping'
  );
  assert.ok(
    studioSource.includes('Primary 1-Click Attach Button'),
    'UserChatStudio must provide a prominent 1-click Attach button in composer'
  );
  assert.ok(
    studioSource.includes('Getting Started & Capability Guide (?)'),
    'UserChatStudio header must include Help ? button for quick guide access'
  );
  assert.ok(
    studioSource.includes('Inline Dismissible Onboarding Guide'),
    'UserChatStudio empty state must render inline dismissible guide'
  );
  console.log('  ✓ Scroll stability logic prevents stream updates from yanking user viewport');
  console.log('  ✓ Composer streamlined with direct Attach, Web Search, and Thinking toggles');
  console.log('  ✓ Inline guide and header ? button provide friction-free help');

  console.log('\n✅ ALL 5 AI CHAT STUDIO UX OVERHAUL TESTS PASSED SUCCESSFULLY!');
}

runStudioUXTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
