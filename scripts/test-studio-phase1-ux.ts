import assert from 'assert';
import { sanitizeModelResponse, getFriendlyModelName } from '../server/gateway';
import {
  extractAllFilesFromMarkdown,
  extractFilenameFromCode,
  sanitizeFilename,
  getExtensionForLanguage,
} from '../src/utils/fileExport';
import { buildProviderRequest } from '../server/providerAdapter';

async function runStudioPhase1Tests() {
  console.log('--- STARTING LIGHTNINGAPI AI CHAT STUDIO PHASE 1 TESTS ---');

  // Test 1: Model Identity Scrubbing & Consistency
  console.log('Testing Test 1: Model Identity Scrubbing & Consistency...');
  {
    const friendlyModel = 'Claude Opus 5.5';
    const inputResponse = 'Hello! I am Claude 3.5 Sonnet, a large language model trained by Anthropic.';
    const sanitized = sanitizeModelResponse(inputResponse, friendlyModel);

    assert(
      sanitized.includes('Claude Opus 5.5'),
      `Expected sanitized response to include '${friendlyModel}', got: ${sanitized}`
    );
    assert(
      !sanitized.includes('Claude 3.5 Sonnet'),
      `Sanitized response should not contain 'Claude 3.5 Sonnet', got: ${sanitized}`
    );

    const snapshotInput = 'Active model snapshot: claude-3-7-sonnet-20250219 running on inference node.';
    const sanitizedSnapshot = sanitizeModelResponse(snapshotInput, friendlyModel);
    assert(
      sanitizedSnapshot.includes('Claude Opus 5.5'),
      `Expected snapshot to be scrubbed to friendly model name, got: ${sanitizedSnapshot}`
    );

    console.log('✓ Test 1 Passed: Model identity matches customer-selected model without contradiction.');
  }

  // Test 2: File Sanitization and Path Traversal Prevention
  console.log('Testing Test 2: File Sanitization & Path Traversal Prevention...');
  {
    const unsafeFilename1 = '../../etc/passwd';
    const safe1 = sanitizeFilename(unsafeFilename1, 'txt');
    assert(!safe1.includes('..'), `Path traversal not stripped: ${safe1}`);
    assert(!safe1.includes('/'), `Slashes not flattened: ${safe1}`);

    const unsafeFilename2 = '..\\..\\Windows\\System32\\cmd.exe';
    const safe2 = sanitizeFilename(unsafeFilename2, 'txt');
    assert(!safe2.includes('..'), `Windows traversal not stripped: ${safe2}`);
    assert(!safe2.includes('\\'), `Windows slashes not flattened: ${safe2}`);

    const empty = sanitizeFilename('', 'py');
    assert(empty.endsWith('.py'), `Expected fallback extension .py, got: ${empty}`);

    console.log('✓ Test 2 Passed: Filename sanitization strictly prevents path traversal.');
  }

  // Test 3: Language Extension Mapping
  console.log('Testing Test 3: Language Extension Mapping...');
  {
    assert.strictEqual(getExtensionForLanguage('typescript'), 'ts');
    assert.strictEqual(getExtensionForLanguage('tsx'), 'tsx');
    assert.strictEqual(getExtensionForLanguage('python'), 'py');
    assert.strictEqual(getExtensionForLanguage('py'), 'py');
    assert.strictEqual(getExtensionForLanguage('html'), 'html');
    assert.strictEqual(getExtensionForLanguage('svg'), 'svg');
    assert.strictEqual(getExtensionForLanguage('sql'), 'sql');
    assert.strictEqual(getExtensionForLanguage('rust'), 'rs');
    assert.strictEqual(getExtensionForLanguage('unknown-lang-xyz'), 'txt');

    console.log('✓ Test 3 Passed: Correct language extensions mapped accurately.');
  }

  // Test 4: Single & Multi-File Code Extraction from Assistant Markdown
  console.log('Testing Test 4: Multi-File Code Extraction from Markdown...');
  {
    const mockMarkdown = `Here are the two project files requested:

\`\`\`typescript:src/client.ts
// filename: client.ts
export class ApiClient {
  constructor(private apiKey: string) {}
}
\`\`\`

And the HTML preview demo:

\`\`\`html:index.html
<!DOCTYPE html>
<html>
  <body><h1>Live Preview</h1></body>
</html>
\`\`\`
`;

    const extracted = extractAllFilesFromMarkdown(mockMarkdown);
    assert.strictEqual(extracted.length, 2, `Expected 2 extracted files, got ${extracted.length}`);

    assert.strictEqual(extracted[0].filename, 'client.ts');
    assert.strictEqual(extracted[0].extension, 'ts');
    assert(extracted[0].content.includes('ApiClient'));

    assert.strictEqual(extracted[1].filename, 'index.html');
    assert.strictEqual(extracted[1].extension, 'html');
    assert(extracted[1].content.includes('Live Preview'));

    console.log('✓ Test 4 Passed: Multi-file extraction parses distinct code blocks with safe filenames.');
  }

  // Test 5: Persona Injection in Provider Adapter
  console.log('Testing Test 5: Persona Injection in Provider Adapter...');
  {
    const dummyVendor: any = {
      id: 'vendor_1',
      name: 'Test Vendor',
      providerType: 'anthropic',
      protocol: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      masterApiKeyEncrypted: 'enc',
      status: 'connected',
    };

    const prep = buildProviderRequest(dummyVendor, 'sk-ant-test', 'claude-sonnet-5.5', {
      messages: [{ role: 'user', content: 'What model are you?' }],
      injectPersona: true,
    });

    const systemText = typeof prep.body.system === 'string'
      ? prep.body.system
      : JSON.stringify(prep.body.system);

    assert(
      systemText.includes('Claude Sonnet 5.5'),
      `Expected persona instruction to inject 'Claude Sonnet 5.5', got: ${systemText}`
    );
    assert(
      systemText.includes('Always identify yourself'),
      `Expected persona instruction to mandate self-identification, got: ${systemText}`
    );

    console.log('✓ Test 5 Passed: Persona instruction enforces active model identity in upstream payload.');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL STUDIO PHASE 1 UX & RELIABILITY TESTS PASSED!');
  console.log('======================================================');
}

runStudioPhase1Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
