import { prisma, decryptText } from '../server/db';
import { buildProviderRequest } from '../server/providerAdapter';

export function parseMarkdownFiles(text: string): Array<{ path: string; content: string; language?: string }> {
  const files: Array<{ path: string; content: string; language?: string }> = [];
  // Pattern 1: File: path\n```lang ... ```
  const fileHeaderRegex = /(?:###?\s*)?(?:File|Path):\s*([a-zA-Z0-9_\-\.\/]+)[\r\n]+```([a-zA-Z0-9_\-]*)\r?\n([\s\S]*?)```/gi;
  let match;
  while ((match = fileHeaderRegex.exec(text)) !== null) {
    const path = match[1].trim();
    const language = match[2].trim() || (path.endsWith('.html') ? 'html' : path.endsWith('.css') ? 'css' : 'javascript');
    const content = match[3].trim();
    files.push({ path, content, language });
  }

  // Fallback pattern if header is in backtick: ```html filename=index.html ... ```
  if (files.length === 0) {
    const codeBlockRegex = /```([a-zA-Z0-9_\-]+)?(?:\s+(?:file|filename)=([a-zA-Z0-9_\-\.\/]+))?\r?\n([\s\S]*?)```/gi;
    let blockIdx = 0;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const lang = (match[1] || '').trim();
      let path = (match[2] || '').trim();
      const content = match[3].trim();
      if (!path) {
        if (lang === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) path = 'index.html';
        else if (lang === 'css' || content.includes('{') && content.includes(':')) path = blockIdx === 1 ? 'styles/theme.css' : 'assets/site.css';
        else if (lang === 'js' || lang === 'javascript') path = 'assets/site.js';
        else path = `file_${blockIdx}.txt`;
      }
      files.push({ path, content, language: lang });
      blockIdx++;
    }
  }

  return files;
}

async function test() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  const masterKey = decryptText(vendor!.masterApiKeyEncrypted);

  const prompt = 'Build a premium portfolio website for a design director with an editorial hero, rich project gallery, case studies, bio, skills, and contact form.';

  const systemPrompt = `You are an elite Frontend Architect.
Synthesize a complete, production-ready website for the user's prompt.
Output each file in this exact format:

File: index.html
\`\`\`html
<!DOCTYPE html>
...
\`\`\`

File: styles.css
\`\`\`css
...
\`\`\`

File: app.js
\`\`\`javascript
...
\`\`\`

File: README.md
\`\`\`markdown
...
\`\`\`

Do not include conversational chatter. Output only the file sections.`;

  const payload: any = {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    stream: true,
    system: systemPrompt,
  };

  const prep = buildProviderRequest(vendor!, masterKey, 'claude-sonnet-5.5', payload);
  console.log('Streaming website generation from Claude...');
  const t0 = Date.now();
  const res = await fetch(prep.url, {
    method: 'POST',
    headers: prep.headers,
    body: JSON.stringify(prep.body),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text;
        }
      } catch {}
    }
  }

  console.log('Stream done in', Date.now() - t0, 'ms. Total bytes:', fullText.length);
  const parsedFiles = parseMarkdownFiles(fullText);
  console.log('Extracted files count:', parsedFiles.length);
  parsedFiles.forEach(f => console.log(' - File:', f.path, 'Size:', f.content.length));
}

test().catch(console.error);
