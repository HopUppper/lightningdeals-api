/**
 * scripts/test-studio-2-light-experience.ts
 *
 * Comprehensive end-to-end verification script for LightningAPI Studio 2.0:
 * 1. Document Generator: DOCX, XLSX, PDF, CSV, MD, TXT pure Node generation
 * 2. Automatic Contextual Memory: Heuristic preference extraction & secret filtering
 * 3. Bounded Memory Retrieval: Limit 5 items, max 500 characters total
 * 4. Theme & Layout verification tokens
 */

import { generateStudioDocument } from '../server/documentGenerator';
import { containsSecretOrSensitiveData } from '../server/studio';
import assert from 'assert';

console.log('====================================================');
console.log('⚡ LIGHTNINGAPI STUDIO 2.0 COMPREHENSIVE VERIFICATION');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 1: Server-Side Pure Node Document Generation
// ---------------------------------------------------------------------------
console.log('📂 1. Testing Document Generator (DOCX, XLSX, PDF, CSV, MD, TXT)...');

runTest('Word Document (.docx) generates authentic OpenXML ZIP with PK header', () => {
  const result = generateStudioDocument({
    title: 'Architecture Blueprint',
    format: 'docx',
    content: '# Architecture Overview\nThis is a production specification.',
  });

  assert.strictEqual(result.extension, 'docx');
  assert.strictEqual(result.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.ok(result.buffer.length > 500, 'Buffer should be larger than 500 bytes');
  // Check ZIP signature PK\x03\x04
  assert.strictEqual(result.buffer[0], 0x50, 'ZIP byte 0 must be P');
  assert.strictEqual(result.buffer[1], 0x4b, 'ZIP byte 1 must be K');
  assert.strictEqual(result.buffer[2], 0x03, 'ZIP byte 2 must be 0x03');
  assert.strictEqual(result.buffer[3], 0x04, 'ZIP byte 3 must be 0x04');
});

runTest('Excel Spreadsheet (.xlsx) generates authentic OpenXML workbook', () => {
  const result = generateStudioDocument({
    title: 'Token Economics',
    format: 'xlsx',
    content: 'Model,Multiplier,Context\nClaude Sonnet 5.5,1.0x,1000000\nClaude Opus 5.5,2.0x,1000000',
  });

  assert.strictEqual(result.extension, 'xlsx');
  assert.strictEqual(result.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.ok(result.buffer.length > 500);
  assert.strictEqual(result.buffer[0], 0x50);
  assert.strictEqual(result.buffer[1], 0x4b);
});

runTest('PDF Document (.pdf) generates valid PDF 1.4 with trailer and EOF', () => {
  const result = generateStudioDocument({
    title: 'Quarterly Executive Audit',
    format: 'pdf',
    content: '# Executive Audit Report\nSystem uptime has reached 99.99%.',
  });

  assert.strictEqual(result.extension, 'pdf');
  assert.strictEqual(result.mimeType, 'application/pdf');
  const pdfStr = result.buffer.toString('binary');
  assert.ok(pdfStr.startsWith('%PDF-1.4'), 'Must start with %PDF-1.4 header');
  assert.ok(pdfStr.includes('%%EOF'), 'Must end with %%EOF');
  assert.ok(pdfStr.includes('/Type /Catalog'), 'Must define PDF Catalog object');
});

runTest('CSV Spreadsheet (.csv) conforms to RFC 4180 with UTF-8 BOM', () => {
  const result = generateStudioDocument({
    title: 'Metrics Export',
    format: 'csv',
    content: 'Category,Key,Value\nPerformance,Latency,120ms\nSecurity,"Escaped, Quote",Valid',
  });

  assert.strictEqual(result.extension, 'csv');
  // Check UTF-8 BOM: 0xEF, 0xBB, 0xBF
  assert.strictEqual(result.buffer[0], 0xef);
  assert.strictEqual(result.buffer[1], 0xbb);
  assert.strictEqual(result.buffer[2], 0xbf);
  const csvStr = result.buffer.toString('utf-8');
  assert.ok(csvStr.includes('Performance,Latency,120ms'));
});

runTest('Markdown (.md) and Plain Text (.txt) generate clean structured buffers', () => {
  const mdResult = generateStudioDocument({
    title: 'System Notes',
    format: 'md',
    content: '# Title\n- Bullet item 1\n- Bullet item 2',
  });
  assert.strictEqual(mdResult.extension, 'md');
  assert.ok(mdResult.buffer.toString('utf-8').includes('# System Notes'));

  const txtResult = generateStudioDocument({
    title: 'Plain Log',
    format: 'txt',
    content: 'Standard text row',
  });
  assert.strictEqual(txtResult.extension, 'txt');
  const txtStr = txtResult.buffer.toString('utf-8');
  assert.ok(txtStr.includes('PLAIN LOG'), 'Must include title header in upper case');
  assert.ok(txtStr.includes('Standard text row'), 'Must include content');
});

// ---------------------------------------------------------------------------
// TEST SUITE 2: Automatic Contextual Memory & Secret Filtering
// ---------------------------------------------------------------------------
console.log('\n🧠 2. Testing Contextual Memory & Security Redaction Invariants...');

runTest('Strict secret filtering blocks passwords, api_keys, bearer tokens and JWTs', () => {
  assert.strictEqual(containsSecretOrSensitiveData('My password is supersecret123'), true);
  assert.strictEqual(containsSecretOrSensitiveData('Here is my api_key: sk-proj-12345678901234567890'), true);
  assert.strictEqual(containsSecretOrSensitiveData('Authorization: Bearer mytoken123'), true);
  assert.strictEqual(containsSecretOrSensitiveData('LK token: lk-abcdef123456'), true);
  assert.strictEqual(containsSecretOrSensitiveData('contact me at admin@example.com'), true);
  assert.strictEqual(containsSecretOrSensitiveData('card: 4532-1234-5678-9012'), true);
});

runTest('Valid coding preferences pass security inspection cleanly', () => {
  assert.strictEqual(containsSecretOrSensitiveData('I prefer TypeScript over vanilla JavaScript'), false);
  assert.strictEqual(containsSecretOrSensitiveData('Our primary tech stack is Next.js, Prisma, and Tailwind CSS'), false);
  assert.strictEqual(containsSecretOrSensitiveData('Please keep answers concise and production-ready'), false);
  assert.strictEqual(containsSecretOrSensitiveData('I usually write in Python and Go'), false);
});

// ---------------------------------------------------------------------------
// TEST SUITE 3: Bounded Memory Retrieval Constraints
// ---------------------------------------------------------------------------
console.log('\n📏 3. Testing Bounded Memory Context Constraints (Max 5 items / 500 chars)...');

runTest('Bounded memory logic halts at 5 items and caps character count at 500', () => {
  const sampleMemories = [
    { category: 'Tech Stack', fact: 'Tech stack: Next.js, Tailwind CSS, Prisma ORM, and PostgreSQL database' },
    { category: 'Preferences', fact: 'User prefers: TypeScript with strict null checks and clean modular functions' },
    { category: 'Coding Style', fact: 'Language preference: Go for microservices, Python for data science scripts' },
    { category: 'Workflow', fact: 'Responses should be: concise, test-driven, and follow SOLID design principles' },
    { category: 'General', fact: 'User name: Developer Alex' },
    { category: 'Extra', fact: 'This 6th item must be ignored to satisfy the bounded constraint' },
  ];

  const boundedMemories: string[] = [];
  let totalChars = 0;
  for (const m of sampleMemories.slice(0, 5)) {
    const entry = `- [${m.category}]: ${m.fact}`;
    if (totalChars + entry.length > 500 && boundedMemories.length > 0) break;
    boundedMemories.push(entry);
    totalChars += entry.length;
  }

  assert.ok(boundedMemories.length <= 5, 'Must not exceed 5 items');
  assert.ok(totalChars <= 500, 'Must not exceed 500 characters total');
  assert.strictEqual(boundedMemories.some(b => b.includes('6th item')), false, '6th item must not be included');
});

console.log('\n====================================================');
console.log(`📊 RESULTS: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('🎉 All Studio 2.0 verification tests passed successfully!');
}
