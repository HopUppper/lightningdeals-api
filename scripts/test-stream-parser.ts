import { prisma, decryptText } from '../server/db';
import { buildProviderRequest } from '../server/providerAdapter';

export async function testStreamParser() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  const masterKey = decryptText(vendor!.masterApiKeyEncrypted);

  const payload: any = {
    messages: [{ role: 'user', content: 'Output a JSON: {"test": "hello world"}' }],
    max_tokens: 200,
    stream: true,
  };

  const prep = buildProviderRequest(vendor!, masterKey, 'claude-sonnet-5.5', payload);
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
        } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
          fullText += parsed.choices[0].delta.content;
        }
      } catch {}
    }
  }

  console.log('Parsed text from SSE stream:', fullText);
}

testStreamParser().catch(console.error);
