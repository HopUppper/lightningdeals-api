/**
 * server/documentGenerator.ts
 *
 * High-performance, pure Node.js document generation engine for LightningAPI Studio 2.0.
 * Produces 100% valid, authentic, downloadable files for:
 * - Word Documents (.docx) - OpenXML package
 * - Excel Spreadsheets (.xlsx) - OpenXML package
 * - PDF Documents (.pdf) - PDF 1.4 specification
 * - CSV Spreadsheets (.csv) - RFC 4180 with UTF-8 BOM
 * - Markdown Documents (.md) - Clean GFM formatting
 * - Plain Text (.txt) - Structured UTF-8 text
 */

import zlib from 'zlib';

export interface DocumentGenerationOptions {
  title: string;
  format: 'docx' | 'xlsx' | 'pdf' | 'csv' | 'md' | 'txt';
  content?: string;
  tableData?: string[][];
  author?: string;
  category?: string;
}

// ---------------------------------------------------------------------------
// CRC32 and ZIP Creation Engine (Pure Node.js)
// ---------------------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function calculateCrc32(buf: Buffer): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Buffer | string;
}

function createZipArchive(files: ZipEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const dataBuf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const compressed = zlib.deflateRawSync(dataBuf);
    const crc = calculateCrc32(dataBuf);

    // Local file header (30 bytes + filename)
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // Local file header signature
    lh.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    lh.writeUInt16LE(0, 6); // General purpose bit flag
    lh.writeUInt16LE(8, 8); // Compression method (8 = Deflate)
    lh.writeUInt16LE(0, 10); // Last mod file time
    lh.writeUInt16LE(0, 12); // Last mod file date
    lh.writeUInt32LE(crc, 14); // CRC-32
    lh.writeUInt32LE(compressed.length, 18); // Compressed size
    lh.writeUInt32LE(dataBuf.length, 22); // Uncompressed size
    lh.writeUInt16LE(nameBuf.length, 26); // Filename length
    lh.writeUInt16LE(0, 28); // Extra field length
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, compressed);

    // Central directory file header (46 bytes + filename)
    const ch = Buffer.alloc(46 + nameBuf.length);
    ch.writeUInt32LE(0x02014b50, 0); // Central directory header signature
    ch.writeUInt16LE(20, 4); // Version made by
    ch.writeUInt16LE(20, 6); // Version needed to extract
    ch.writeUInt16LE(0, 8); // Flags
    ch.writeUInt16LE(8, 10); // Compression method (Deflate)
    ch.writeUInt16LE(0, 12); // Mod time
    ch.writeUInt16LE(0, 14); // Mod date
    ch.writeUInt32LE(crc, 16); // CRC-32
    ch.writeUInt32LE(compressed.length, 20); // Compressed size
    ch.writeUInt32LE(dataBuf.length, 24); // Uncompressed size
    ch.writeUInt16LE(nameBuf.length, 28); // Filename length
    ch.writeUInt16LE(0, 30); // Extra field length
    ch.writeUInt16LE(0, 32); // File comment length
    ch.writeUInt16LE(0, 34); // Disk number start
    ch.writeUInt16LE(0, 36); // Internal file attributes
    ch.writeUInt32LE(0, 38); // External file attributes
    ch.writeUInt32LE(offset, 42); // Relative offset of local header
    nameBuf.copy(ch, 46);

    centralHeaders.push(ch);
    offset += lh.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// 1. Word Document (.docx) OpenXML Generator
// ---------------------------------------------------------------------------
export function generateWordDocument(options: DocumentGenerationOptions): Buffer {
  const title = options.title || 'LightningAPI Report';
  const content = options.content || 'Generated report created in LightningAPI Studio 2.0.';
  const author = options.author || 'LightningAPI AI Studio';
  const dateStr = new Date().toISOString();

  // Split content into clean paragraphs
  const paragraphs = content
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let paragraphsXml = '';
  for (const p of paragraphs) {
    if (p.startsWith('# ')) {
      paragraphsXml += `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>${escapeXml(p.slice(2))}</w:t></w:r>
        </w:p>`;
    } else if (p.startsWith('## ')) {
      paragraphsXml += `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
          <w:r><w:t>${escapeXml(p.slice(3))}</w:t></w:r>
        </w:p>`;
    } else if (p.startsWith('- ') || p.startsWith('* ')) {
      paragraphsXml += `
        <w:p>
          <w:pPr><w:pStyle w:val="ListBullet"/></w:pPr>
          <w:r><w:t>${escapeXml(p.slice(2))}</w:t></w:r>
        </w:p>`;
    } else {
      paragraphsXml += `
        <w:p>
          <w:r><w:t>${escapeXml(p)}</w:t></w:r>
        </w:p>`;
    }
  }

  // If tableData is present, add table
  if (options.tableData && options.tableData.length > 0) {
    paragraphsXml += `
      <w:tbl>
        <w:tblPr>
          <w:tblStyle w:val="TableGrid"/>
          <w:tblW w:w="0" w:type="auto"/>
        </w:tblPr>`;
    options.tableData.forEach((row, rowIdx) => {
      paragraphsXml += '<w:tr>';
      row.forEach((cell) => {
        paragraphsXml += `
          <w:tc>
            <w:p>
              <w:r>${rowIdx === 0 ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t>${escapeXml(cell)}</w:t></w:r>
            </w:p>
          </w:tc>`;
      });
      paragraphsXml += '</w:tr>';
    });
    paragraphsXml += '</w:tbl>';
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="48"/></w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>
      <w:r>
        <w:rPr><w:i/><w:color w:val="666666"/><w:sz w:val="22"/></w:rPr>
        <w:t>Authored by ${escapeXml(author)} • ${new Date().toLocaleDateString()}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    ${paragraphsXml}
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return createZipArchive([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: relsXml },
    { name: 'word/document.xml', data: documentXml },
  ]);
}

// ---------------------------------------------------------------------------
// 2. Excel Spreadsheet (.xlsx) OpenXML Generator
// ---------------------------------------------------------------------------
export function generateExcelWorkbook(options: DocumentGenerationOptions): Buffer {
  const table = options.tableData && options.tableData.length > 0
    ? options.tableData
    : [
        ['Item', 'Category', 'Quantity', 'Status'],
        ['API Gateway Nodes', 'Infrastructure', '12', 'Active'],
        ['Upstream Providers', 'Telemetry', '4', 'Verified'],
        ['Customer Studio Sessions', 'Productivity', '45', 'Normal'],
        ['Pre-allocated Token Quota', 'Capacity', '10,000,000', 'Assigned'],
      ];

  let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>`;

  table.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    sheetXml += `<row r="${rowNum}">`;
    row.forEach((cell, cIdx) => {
      const colLetter = String.fromCharCode(65 + (cIdx % 26));
      const cellRef = `${colLetter}${rowNum}`;
      sheetXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
    });
    sheetXml += '</row>';
  });

  sheetXml += `
  </sheetData>
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  return createZipArchive([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: relsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXml },
  ]);
}

// ---------------------------------------------------------------------------
// 3. PDF Document (.pdf) PDF 1.4 Specification Generator
// ---------------------------------------------------------------------------
export function generatePdfDocument(options: DocumentGenerationOptions): Buffer {
  const title = (options.title || 'LightningAPI Studio Document').slice(0, 80);
  const rawContent = options.content || 'Generated document report created by LightningAPI Studio 2.0.';
  
  // Format content lines
  const lines: string[] = [];
  rawContent.split(/\r?\n/).forEach((l) => {
    const clean = l.replace(/[()\\\\]/g, '').trim();
    if (clean.length > 80) {
      for (let i = 0; i < clean.length; i += 80) {
        lines.push(clean.slice(i, i + 80));
      }
    } else if (clean.length > 0) {
      lines.push(clean);
    }
  });

  // Build PDF Content stream
  let streamText = `BT /F1 18 Tf 50 740 Td (${title.replace(/[()\\\\]/g, '')}) Tj ET\n`;
  streamText += `BT /F1 10 Tf 50 715 Td (Created with LightningAPI Studio 2.0 • ${new Date().toLocaleDateString()}) Tj ET\n`;
  streamText += `50 700 m 560 700 l S\n`; // separator rule

  let currentY = 675;
  for (const line of lines.slice(0, 36)) {
    streamText += `BT /F1 11 Tf 50 ${currentY} Td (${line}) Tj ET\n`;
    currentY -= 16;
  }

  const streamBuf = Buffer.from(streamText, 'utf8');

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];

  // Obj 1: Catalog
  offsets.push(body.length);
  body += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Obj 2: Pages
  offsets.push(body.length);
  body += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  // Obj 3: Page (Letter: 612x792 pt)
  offsets.push(body.length);
  body += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  // Obj 4: Contents Stream
  offsets.push(body.length);
  body += `4 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n${streamText}endstream\nendobj\n`;

  // Obj 5: Font (Standard Helvetica)
  offsets.push(body.length);
  body += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const startXref = body.length;
  body += 'xref\n0 6\n0000000000 65535 f \n';
  for (const off of offsets) {
    body += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(body, 'binary');
}

// ---------------------------------------------------------------------------
// 4. CSV Spreadsheet (.csv) RFC 4180 with UTF-8 BOM
// ---------------------------------------------------------------------------
export function generateCsvSpreadsheet(options: DocumentGenerationOptions): Buffer {
  let table: string[][] = [];

  if (options.tableData && options.tableData.length > 0) {
    table = options.tableData;
  } else if (options.content && options.content.trim()) {
    const lines = options.content.trim().split(/\r?\n/).filter(Boolean);
    table = lines.map((line) => {
      const cells: string[] = [];
      let inQuote = false;
      let curr = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
          cells.push(curr.trim());
          curr = '';
        } else {
          curr += c;
        }
      }
      cells.push(curr.trim());
      return cells;
    });
  }

  if (table.length === 0) {
    table = [
      ['Metric', 'Category', 'Value', 'Status'],
      ['Total Requests', 'Traffic', '124,500', 'OK'],
      ['Token Consumption', 'Accounting', '1,450,200', 'Verified'],
      ['Average Latency (TTFT)', 'Performance', '120ms', 'Optimal'],
      ['Active Provider Nodes', 'Gateway', '4', 'Healthy'],
    ];
  }

  const csvRows = table.map((row) =>
    row
      .map((val) => {
        const str = String(val || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  return Buffer.from(csvString, 'utf8');
}

// ---------------------------------------------------------------------------
// 5. Markdown Document (.md)
// ---------------------------------------------------------------------------
export function generateMarkdownDocument(options: DocumentGenerationOptions): Buffer {
  const title = options.title || 'Document';
  const content = options.content || 'Content generated in LightningAPI Studio.';
  const author = options.author || 'LightningAPI AI Studio';

  let md = `# ${title}\n\n`;
  md += `*Generated by ${author} on ${new Date().toISOString()}*\n\n---\n\n`;
  md += content;

  if (options.tableData && options.tableData.length > 0) {
    md += '\n\n### Data Table\n\n';
    const header = options.tableData[0];
    md += `| ${header.join(' | ')} |\n`;
    md += `| ${header.map(() => '---').join(' | ')} |\n`;
    for (let i = 1; i < options.tableData.length; i++) {
      md += `| ${options.tableData[i].join(' | ')} |\n`;
    }
  }

  return Buffer.from(md, 'utf8');
}

// ---------------------------------------------------------------------------
// 6. Plain Text (.txt)
// ---------------------------------------------------------------------------
export function generatePlainTextDocument(options: DocumentGenerationOptions): Buffer {
  const title = options.title || 'DOCUMENT';
  const content = options.content || '';

  let txt = `========================================================================\n`;
  txt += `${title.toUpperCase()}\n`;
  txt += `Generated: ${new Date().toISOString()} • LightningAPI Studio 2.0\n`;
  txt += `========================================================================\n\n`;
  txt += content;

  return Buffer.from(txt, 'utf8');
}

// ---------------------------------------------------------------------------
// Main Document Dispatcher
// ---------------------------------------------------------------------------
export function generateStudioDocument(options: DocumentGenerationOptions): {
  buffer: Buffer;
  mimeType: string;
  extension: string;
} {
  switch (options.format) {
    case 'docx':
      return {
        buffer: generateWordDocument(options),
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
      };
    case 'xlsx':
      return {
        buffer: generateExcelWorkbook(options),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      };
    case 'pdf':
      return {
        buffer: generatePdfDocument(options),
        mimeType: 'application/pdf',
        extension: 'pdf',
      };
    case 'csv':
      return {
        buffer: generateCsvSpreadsheet(options),
        mimeType: 'text/csv; charset=utf-8',
        extension: 'csv',
      };
    case 'md':
      return {
        buffer: generateMarkdownDocument(options),
        mimeType: 'text/markdown; charset=utf-8',
        extension: 'md',
      };
    case 'txt':
    default:
      return {
        buffer: generatePlainTextDocument(options),
        mimeType: 'text/plain; charset=utf-8',
        extension: 'txt',
      };
  }
}
