import { prisma, decryptText } from '../server/db';
import { buildProviderRequest } from '../server/providerAdapter';

async function test() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  const masterKey = decryptText(vendor!.masterApiKeyEncrypted);

  const systemPrompt = 'You are a web builder. Output ONLY a JSON object with {"title": "Test", "files": [{"path": "index.html", "content": "<h1>Hello</h1>"}]}. No conversational text before or after.';

  const payload: any = {
    messages: [{ role: 'user', content: 'Generate a portfolio site.' }],
    max_tokens: 4096,
    system: systemPrompt,
  };

  const prep = buildProviderRequest(vendor!, masterKey, 'claude-sonnet-5.5', payload);
  const res = await fetch(prep.url, {
    method: 'POST',
    headers: prep.headers,
    body: JSON.stringify(prep.body),
  });

  const data: any = await res.json();
  console.log('Stop reason:', data.stop_reason);
  console.log('Content:', JSON.stringify(data.content));
}

test().catch(console.error);
