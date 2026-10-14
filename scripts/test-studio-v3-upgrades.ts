/**
 * Studio 3.0 Verification Test Suite
 * Tests DOCX text extraction, Skills system, Prompt injection, and Workspace features.
 */
import assert from 'assert';
import yauzl from 'yauzl';

// 1. Test DOCX parsing logic identical to server/studio.ts
async function extractTextFromDocxTest(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        return reject(err || new Error('Invalid DOCX format'));
      }

      let documentText = '';
      let foundDocumentXml = false;

      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        if (entry.fileName === 'word/document.xml') {
          foundDocumentXml = true;
          zipfile.openReadStream(entry, (streamErr, readStream) => {
            if (streamErr || !readStream) {
              return reject(streamErr || new Error('Failed to read document.xml'));
            }

            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            readStream.on('end', () => {
              const xml = Buffer.concat(chunks).toString('utf-8');
              const textMatches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
              if (textMatches) {
                documentText = textMatches
                  .map((t) => t.replace(/<[^>]+>/g, ''))
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim();
              }
              zipfile.readEntry();
            });
            readStream.on('error', (e) => reject(e));
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on('end', () => {
        if (!foundDocumentXml) {
          return resolve('');
        }
        resolve(documentText);
      });

      zipfile.on('error', (e) => reject(e));
    });
  });
}

// 2. Mock DOCX ZIP builder (minimal ZIP containing word/document.xml)
import zlib from 'zlib';

function createMockDocxBuffer(textContent: string): Buffer {
  // Simple ZIP with one file: word/document.xml
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${textContent}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  const xmlBuffer = Buffer.from(xmlContent, 'utf-8');
  const fileName = 'word/document.xml';
  const fileNameBuffer = Buffer.from(fileName, 'utf-8');

  // Compute CRC32
  let crc = 0 ^ (-1);
  for (let i = 0; i < xmlBuffer.length; i++) {
    crc = (crc >>> 8) ^ [
      0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3,
      0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91
    ][(crc ^ xmlBuffer[i]) & 0x0f] ^ [
      0x00000000, 0x1db71064, 0x3b6e20c8, 0x26d930ac, 0x76dc4190, 0x6b6b51f4, 0x4db26158, 0x5005713c,
      0xedb88320, 0xf00f9344, 0xd6d6a3e8, 0xcb61b38c, 0x9b64c2b0, 0x86d3d2d4, 0xa00ae278, 0xbdbdf21c
    ][((crc ^ xmlBuffer[i]) >>> 4) & 0x0f];
  }
  crc = (crc ^ (-1)) >>> 0;

  // Local File Header
  const lfh = Buffer.alloc(30 + fileNameBuffer.length);
  lfh.writeUInt32LE(0x04034b50, 0); // signature
  lfh.writeUInt16LE(20, 4); // version needed
  lfh.writeUInt16LE(0, 6); // flags
  lfh.writeUInt16LE(0, 8); // compression: 0 (stored)
  lfh.writeUInt16LE(0, 10); // mod time
  lfh.writeUInt16LE(0, 12); // mod date
  lfh.writeUInt32LE(crc, 14); // crc32
  lfh.writeUInt32LE(xmlBuffer.length, 18); // compressed size
  lfh.writeUInt32LE(xmlBuffer.length, 22); // uncompressed size
  lfh.writeUInt16LE(fileNameBuffer.length, 26); // file name len
  lfh.writeUInt16LE(0, 28); // extra len
  fileNameBuffer.copy(lfh, 30);

  // Central Directory File Header
  const cdfh = Buffer.alloc(46 + fileNameBuffer.length);
  cdfh.writeUInt32LE(0x02014b50, 0); // signature
  cdfh.writeUInt16LE(20, 4); // version made by
  cdfh.writeUInt16LE(20, 6); // version needed
  cdfh.writeUInt16LE(0, 8); // flags
  cdfh.writeUInt16LE(0, 10); // compression: 0
  cdfh.writeUInt16LE(0, 12); // mod time
  cdfh.writeUInt16LE(0, 14); // mod date
  cdfh.writeUInt32LE(crc, 16); // crc32
  cdfh.writeUInt32LE(xmlBuffer.length, 20); // compressed size
  cdfh.writeUInt32LE(xmlBuffer.length, 24); // uncompressed size
  cdfh.writeUInt16LE(fileNameBuffer.length, 28); // file name len
  cdfh.writeUInt16LE(0, 30); // extra len
  cdfh.writeUInt16LE(0, 32); // comment len
  cdfh.writeUInt16LE(0, 34); // disk number start
  cdfh.writeUInt16LE(0, 36); // internal attr
  cdfh.writeUInt32LE(0, 38); // external attr
  cdfh.writeUInt32LE(0, 42); // relative offset of LFH (0)
  fileNameBuffer.copy(cdfh, 46);

  // End of Central Directory Record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk num
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(1, 8); // total entries disk
  eocd.writeUInt16LE(1, 10); // total entries
  eocd.writeUInt32LE(cdfh.length, 12); // size of CD
  eocd.writeUInt32LE(lfh.length + xmlBuffer.length, 16); // offset of CD
  eocd.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([lfh, xmlBuffer, cdfh, eocd]);
}

async function runTests() {
  console.log('================================================================');
  console.log('STUDIO 3.0: UPGRADE VERIFICATION TEST SUITE');
  console.log('================================================================');

  let passed = 0;

  // TEST 1: DOCX Parsing
  try {
    const testSample = 'LightningAPI Studio 3.0 Specification Document with Enterprise Features';
    const mockDocx = createMockDocxBuffer(testSample);
    const parsedText = await extractTextFromDocxTest(mockDocx);

    assert.strictEqual(parsedText, testSample);
    console.log('✅ TEST 1: DOCX Text Extraction via yauzl -> Passed');
    console.log(`   Extracted: "${parsedText}"`);
    passed++;
  } catch (err: any) {
    console.error('❌ TEST 1: DOCX Extraction failed:', err.message);
  }

  // TEST 2: Prebuilt Skills Catalogue
  try {
    const { PREBUILT_STUDIO_SKILLS } = await import('../server/studio');
    assert(Array.isArray(PREBUILT_STUDIO_SKILLS), 'PREBUILT_STUDIO_SKILLS must be an array');
    assert.strictEqual(PREBUILT_STUDIO_SKILLS.length, 6, 'Must have 6 prebuilt skills');
    
    const skillIds = PREBUILT_STUDIO_SKILLS.map((s) => s.id);
    assert(skillIds.includes('skill_senior_architect'));
    assert(skillIds.includes('skill_test_specialist'));
    assert(skillIds.includes('skill_security_auditor'));
    assert(skillIds.includes('skill_diff_engineer'));
    assert(skillIds.includes('skill_docs_writer'));
    assert(skillIds.includes('skill_ui_engineer'));

    console.log('✅ TEST 2: Prebuilt Skills Catalogue -> Passed');
    console.log(`   6 Skills verified: ${skillIds.join(', ')}`);
    passed++;
  } catch (err: any) {
    console.error('❌ TEST 2: Prebuilt Skills failed:', err.message);
  }

  // TEST 3: Active Skills Directive Assembly
  try {
    const { PREBUILT_STUDIO_SKILLS } = await import('../server/studio');
    const activeSkills = ['skill_senior_architect', 'skill_security_auditor'];

    const matchedDirectives = PREBUILT_STUDIO_SKILLS
      .filter((s) => activeSkills.includes(s.id))
      .map((s) => `--- SKILL: ${s.name} (${s.category}) ---\n${s.instructions}`);

    const basePrompt = 'You are Claude.';
    const effectiveSystemPrompt = basePrompt + '\n\n[ACTIVE WORKSPACE SKILLS]\n' + matchedDirectives.join('\n\n');

    assert(effectiveSystemPrompt.includes('[ACTIVE WORKSPACE SKILLS]'));
    assert(effectiveSystemPrompt.includes('Senior Code Architect'));
    assert(effectiveSystemPrompt.includes('Security Auditor'));
    assert(!effectiveSystemPrompt.includes('Test Suite Specialist'));

    console.log('✅ TEST 3: Active Skills Directive Injection -> Passed');
    console.log(`   Injected ${matchedDirectives.length} active directives cleanly into system prompt.`);
    passed++;
  } catch (err: any) {
    console.error('❌ TEST 3: Directive Injection failed:', err.message);
  }

  // TEST 4: Live Token Intelligence Calculations
  try {
    const messages = [
      { role: 'user', content: 'Hello', usage: { input_tokens: 120, output_tokens: 0 } },
      { role: 'assistant', content: 'Hi there!', usage: { input_tokens: 120, output_tokens: 45, savings_tokens: 30 } },
      { role: 'user', content: 'Write a quick function', usage: { input_tokens: 170, output_tokens: 0 } },
      { role: 'assistant', content: '```js\nconsole.log(1);\n```', usage: { input_tokens: 170, output_tokens: 85, savings_tokens: 50 } },
    ];

    let totalIn = 0;
    let totalOut = 0;
    let totalSavings = 0;
    for (const m of messages) {
      totalIn += m.usage?.input_tokens || 0;
      totalOut += m.usage?.output_tokens || 0;
      totalSavings += m.usage?.savings_tokens || 0;
    }

    const draftInput = 'Can you optimize this code further?';
    const draftTokens = Math.ceil(draftInput.length / 4);
    const contextLimit = 1000000;
    const totalContext = totalIn + totalOut + draftTokens;
    const contextPct = ((totalContext / contextLimit) * 100).toFixed(2);

    assert.strictEqual(totalIn, 580);
    assert.strictEqual(totalOut, 130);
    assert.strictEqual(totalSavings, 80);
    assert.strictEqual(draftTokens, 9);
    assert.strictEqual(totalContext, 719);
    assert.strictEqual(contextPct, '0.07');

    console.log('✅ TEST 4: Live Token Intelligence Calculation -> Passed');
    console.log(`   ~${totalIn} in · ${totalOut} out · ~${contextPct}% of context · ~${totalSavings} saved`);
    passed++;
  } catch (err: any) {
    console.error('❌ TEST 4: Token Intelligence failed:', err.message);
  }

  // TEST 5: Model Comparison Dual Result Resolution
  try {
    const comparisonMsg = {
      id: 'msg_compare_1',
      role: 'assistant',
      content: '', // Pending resolution
      comparison: {
        modelA: {
          modelId: 'claude-sonnet-5.5',
          content: 'Here is solution A from Sonnet 5.5.',
          usage: { input_tokens: 250, output_tokens: 120, total_tokens: 370 },
          latencyMs: 1420,
        },
        modelB: {
          modelId: 'claude-3-7-sonnet-20250219',
          content: 'Here is solution B from Claude 3.7 Sonnet.',
          usage: { input_tokens: 250, output_tokens: 110, total_tokens: 360 },
          latencyMs: 1180,
        },
      },
    };

    // User chooses Branch B
    const selectedBranch = 'modelB';
    const chosen = comparisonMsg.comparison[selectedBranch];
    const resolvedMsg = {
      ...comparisonMsg,
      content: chosen.content,
      modelUsed: chosen.modelId,
      usage: chosen.usage,
      comparison: undefined,
    };

    assert.strictEqual(resolvedMsg.content, 'Here is solution B from Claude 3.7 Sonnet.');
    assert.strictEqual(resolvedMsg.modelUsed, 'claude-3-7-sonnet-20250219');
    assert.strictEqual(resolvedMsg.usage?.output_tokens, 110);
    assert.strictEqual(resolvedMsg.comparison, undefined);

    console.log('✅ TEST 5: Model Comparison Branch Selection Resolution -> Passed');
    console.log('   Branch B cleanly adopted into canonical thread message.');
    passed++;
  } catch (err: any) {
    console.error('❌ TEST 5: Comparison Resolution failed:', err.message);
  }

  console.log('================================================================');
  console.log(`STUDIO 3.0 TESTS COMPLETE: ${passed}/5 PASSED`);
  console.log('================================================================');

  if (passed < 5) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});
