/**
 * scripts/test-document-export.ts
 *
 * Automated verification of Word (.docx) & PDF (.pdf) conversion,
 * heading anchor slugs, and ToC navigation synchronization.
 */

import { generateStudioDocument } from '../server/documentGenerator';
import { slugifyHeading } from '../src/components/chat/MarkdownBlock';

async function runDocumentExportTests() {
  console.log('\n=== LIGHTNINGAPI DOCUMENT EXPORT & TOC AUTOSCROLL VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  const testSample = `# Enterprise Architecture Document
## Laboratory Information Management System (LIMS)
Business & Technical Requirements Specification — Executive Edition

### 1. Executive Summary
This document presents the consolidated business, functional, and technical requirements for the enterprise Laboratory Information Management System (LIMS) initiative.

### 1.4 Definitions
| Term | Definition |
|---|---|
| LIMS | Laboratory Information Management System |
| CoC | Chain of Custody |
| QC | Quality Control |
| SOP | Standard Operating Procedure |
| OOS | Out of Specification |

### 2. Strategic Context & Business Drivers
- **Regulatory Defensibility**: 21 CFR Part 11 compliant audit trails.
- **Instrument Automation**: Direct capture from HPLC, GC-MS, and balances.
- **Turnaround Time**: 40% reduction in sample processing cycle times.

### 3. Scope of the Enterprise Solution
The system covers complete lifecycle intake, chain of custody, and reporting.
`;

  // Test 1: Word Document (.docx) OpenXML generation with tables
  try {
    const docxResult = generateStudioDocument({
      title: 'Enterprise Architecture Document',
      format: 'docx',
      content: testSample,
    });

    if (!docxResult.buffer || docxResult.buffer.length < 500) {
      throw new Error(`Word buffer too small: ${docxResult.buffer?.length}`);
    }
    // Check ZIP magic bytes PK\x03\x04
    if (docxResult.buffer[0] !== 0x50 || docxResult.buffer[1] !== 0x4b) {
      throw new Error('Word document buffer missing ZIP PK magic bytes');
    }
    // Check mimeType
    if (docxResult.mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error(`Unexpected MIME type: ${docxResult.mimeType}`);
    }

    console.log('✅ Test 1 Passed: Word (.docx) generated with valid OpenXML ZIP package (' + docxResult.buffer.length + ' bytes)');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
    failed++;
  }

  // Test 2: PDF Document (.pdf) PDF 1.4 vector generation
  try {
    const pdfResult = generateStudioDocument({
      title: 'Enterprise Architecture Document',
      format: 'pdf',
      content: testSample,
    });

    if (!pdfResult.buffer || pdfResult.buffer.length < 500) {
      throw new Error(`PDF buffer too small: ${pdfResult.buffer?.length}`);
    }
    const pdfHeader = pdfResult.buffer.toString('utf8', 0, 8);
    if (!pdfHeader.startsWith('%PDF-1.4')) {
      throw new Error(`Invalid PDF header: ${pdfHeader}`);
    }
    const pdfTail = pdfResult.buffer.toString('utf8', pdfResult.buffer.length - 15);
    if (!pdfTail.includes('%%EOF')) {
      throw new Error(`Invalid PDF EOF marker: ${pdfTail}`);
    }

    console.log('✅ Test 2 Passed: PDF (.pdf) generated with valid PDF 1.4 vector specification (' + pdfResult.buffer.length + ' bytes)');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
    failed++;
  }

  // Test 3: Multi-page PDF pagination
  try {
    const multiPageContent = Array.from({ length: 150 }, (_, i) => `Line ${i + 1}: Specification detail for LIMS automated test execution and audit logging.`).join('\n');
    const multiPdf = generateStudioDocument({
      title: 'Long Multi-Page Document',
      format: 'pdf',
      content: multiPageContent,
    });

    const pdfStr = multiPdf.buffer.toString('utf8');
    const countMatch = pdfStr.match(/\/Count (\d+)/);
    const pageCount = countMatch ? parseInt(countMatch[1], 10) : 0;
    if (pageCount < 3) {
      throw new Error(`Expected at least 3 pages for 150 lines, got: ${pageCount}`);
    }

    console.log(`✅ Test 3 Passed: Multi-page PDF successfully created ${pageCount} pages with headers and footers`);
    passed++;
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
    failed++;
  }

  // Test 4: ToC Heading Slug Synchronization
  try {
    const headings = [
      '1. Executive Summary',
      '1.4 Definitions',
      '2. Strategic Context & Business Drivers',
      '3. Scope of the Enterprise Solution',
      '3.1 In Scope',
    ];

    for (const h of headings) {
      const slug = slugifyHeading(h);
      if (!slug || slug.includes(' ') || slug.includes('#')) {
        throw new Error(`Invalid slug generated for "${h}": "${slug}"`);
      }
    }

    console.log('✅ Test 4 Passed: Slugify utility generates clean URL-safe heading IDs for ToC autoscroll');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
    failed++;
  }

  
  // Test 5: Unicode Currency & Bullet List Rendering in PDF
  try {
    const userSample = `I can try again, but I need the **current Amazon and Flipkart product links** or screenshots to compare exact prices. I don't want to invent live prices.

Send any listings you found, and I'll identify the best deal based on:
• Intel i5 9th generation or newer
• 16 GB RAM
• 256 GB SSD
• Final price under ₹16,000–₹17,000
• Warranty, seller rating, condition, and return policy`;

    const pdfSample = generateStudioDocument({
      title: 'Hi',
      format: 'pdf',
      content: userSample,
    });

    const stream = pdfSample.buffer.toString('utf8');
    if (!stream.includes('Intel i5 9th generation or newer')) {
      throw new Error('Bullet text "Intel i5 9th generation or newer" missing from PDF stream');
    }
    if (!stream.includes('Rs. 16,000')) {
      throw new Error('Rupee and en-dash replacement missing or corrupted in PDF stream');
    }
    if (stream.includes('donât') || stream.includes('Iâll')) {
      throw new Error('Mojibake detected in PDF stream (donât / Iâll)');
    }
    if (stream.includes('**current Amazon')) {
      throw new Error('Raw markdown asterisks (**bold**) leaked into PDF stream');
    }

    console.log('✅ Test 5 Passed: PDF successfully handles Unicode currency, bullets, and clean typography without mojibake');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 5 Failed:', err.message);
    failed++;
  }

  console.log(`\nDocument Export Test Suite: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runDocumentExportTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
