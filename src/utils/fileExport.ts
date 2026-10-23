import JSZip from 'jszip';

export interface ExtractedCodeFile {
  filename: string;
  language: string;
  content: string;
  extension: string;
}

const LANGUAGE_EXTENSION_MAP: Record<string, string> = {
  typescript: 'ts',
  ts: 'ts',
  tsx: 'tsx',
  javascript: 'js',
  js: 'js',
  jsx: 'jsx',
  python: 'py',
  py: 'py',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  json: 'json',
  markdown: 'md',
  md: 'md',
  yaml: 'yaml',
  yml: 'yml',
  sql: 'sql',
  rust: 'rs',
  rs: 'rs',
  go: 'go',
  golang: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  cs: 'cs',
  php: 'php',
  ruby: 'rb',
  rb: 'rb',
  bash: 'sh',
  sh: 'sh',
  shell: 'sh',
  powershell: 'ps1',
  ps1: 'ps1',
  dockerfile: 'dockerfile',
  xml: 'xml',
  svg: 'svg',
  toml: 'toml',
  text: 'txt',
  txt: 'txt',
};

/**
 * Returns a sensible file extension for a given language tag
 */
export function getExtensionForLanguage(lang: string): string {
  const clean = (lang || '').trim().toLowerCase();
  return LANGUAGE_EXTENSION_MAP[clean] || 'txt';
}

/**
 * Sanitizes a filename to ensure safe download and prevent path traversal
 */
export function sanitizeFilename(filename: string, fallbackExt = 'txt', allowSubpaths = false): string {
  if (!filename || typeof filename !== 'string') {
    return `output.${fallbackExt}`;
  }

  // Strip null bytes and control chars
  let clean = filename.replace(/\0/g, '').trim();

  // Strip path traversal attempts like ../ or ..\
  clean = clean.replace(/(\.\.[\/\\])+/g, '');

  if (!allowSubpaths) {
    // Flatten any directory separators for safe single-file download
    clean = clean.replace(/[/\\]+/g, '-');
  } else {
    // Keep internal forward slashes, but remove leading slashes
    clean = clean.replace(/^[/\\]+/, '').replace(/\\+/g, '/');
  }

  // Replace forbidden characters on Windows / POSIX
  clean = clean.replace(/[<>:"|?*]/g, '-');

  if (!clean || clean === '.' || clean === '..') {
    return `file_${Date.now()}.${fallbackExt}`;
  }

  return clean;
}

/**
 * Extracts explicit filename from code block headers or leading comment
 * e.g., ```typescript:src/components/Header.tsx
 * or // filename: App.tsx
 * or /* index.css *\/
 */
export function extractFilenameFromCode(langHeader: string, code: string): string | null {
  // Check lang header like `ts:src/app.ts` or `typescript filename=Button.tsx`
  if (langHeader.includes(':')) {
    const candidate = langHeader.split(':')[1].trim();
    if (candidate) {
      const basename = candidate.split(/[/\\]/).pop() || candidate;
      return sanitizeFilename(basename);
    }
  }
  if (langHeader.includes('filename=')) {
    const match = langHeader.match(/filename=["']?([^"'\s]+)["']?/);
    if (match && match[1]) {
      const basename = match[1].split(/[/\\]/).pop() || match[1];
      return sanitizeFilename(basename);
    }
  }

  // Check first 3 lines of code for comments specifying filename
  const lines = code.split('\n').slice(0, 3);
  for (const line of lines) {
    const trimmed = line.trim();
    const commentMatch = trimmed.match(/^(?:\/{2,3}|#|\/\*+)\s*(?:filename|file):\s*([a-zA-Z0-9_./-]+)(?:\s*\*\/)?/i);
    if (commentMatch && commentMatch[1]) {
      const basename = commentMatch[1].split(/[/\\]/).pop() || commentMatch[1];
      return sanitizeFilename(basename);
    }
  }

  return null;
}

/**
 * Parses an entire assistant response to find all code blocks and extract structured files
 */
export function extractAllFilesFromMarkdown(markdown: string): ExtractedCodeFile[] {
  const files: ExtractedCodeFile[] = [];
  if (!markdown) return files;

  // Regex matching fenced code blocks: ```lang\ncode```
  const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const rawHeader = match[1].trim();
    const code = match[2];
    const lang = rawHeader.split(/[:\s]/)[0].toLowerCase() || 'text';
    const ext = getExtensionForLanguage(lang);

    const explicitName = extractFilenameFromCode(rawHeader, code);
    const filename = explicitName || `file_${counter}.${ext}`;

    files.push({
      filename,
      language: lang,
      content: code,
      extension: ext,
    });
    counter++;
  }

  return files;
}

/**
 * Initiates single file download directly in browser
 */
export function triggerFileDownload(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Packages multiple files into a clean ZIP archive and triggers browser download
 */
export async function downloadAllAsZip(files: ExtractedCodeFile[], zipName = 'lightning-studio-export.zip'): Promise<void> {
  if (!files || files.length === 0) return;

  const zip = new JSZip();

  for (const file of files) {
    // Sanitize path to prevent zip-slip traversal
    const safePath = sanitizeFilename(file.filename, file.extension);
    zip.file(safePath, file.content);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeFilename(zipName, 'zip');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
