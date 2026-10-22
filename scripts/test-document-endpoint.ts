/**
 * scripts/test-document-endpoint.ts
 *
 * Verifies document generation endpoint logic and payload validation
 */

import { generateStudioDocument } from '../server/documentGenerator';
import assert from 'assert';

console.log('Testing generateStudioDocument options and outputs...');

const formats = ['docx', 'xlsx', 'pdf', 'csv', 'md', 'txt'] as const;

for (const fmt of formats) {
  const doc = generateStudioDocument({
    title: `Sample ${fmt.toUpperCase()} Document`,
    format: fmt,
    content: `Test content for format ${fmt}\nLine 2 data\nLine 3 conclusions`,
  });

  assert.ok(doc.buffer instanceof Buffer, `Must return Buffer for ${fmt}`);
  assert.ok(doc.buffer.length > 50, `Buffer length must be > 50 for ${fmt}`);
  assert.strictEqual(doc.extension, fmt, `Extension must match ${fmt}`);
  assert.ok(doc.mimeType.length > 5, `MimeType must be set for ${fmt}`);
  console.log(`  ✓ Format ${fmt.padEnd(5)}: ${doc.buffer.length} bytes, MIME: ${doc.mimeType}`);
}

console.log('\nAll formats verified successfully!');
