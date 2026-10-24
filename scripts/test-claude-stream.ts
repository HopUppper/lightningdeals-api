import { prisma, decryptText } from '../server/db';
import { buildProviderRequest } from '../server/providerAdapter';

async function testStream() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  const masterKey = decryptText(vendor!.masterApiKeyEncrypted);

  const payload: any = {
    messages: [{ role: 'user', content: 'Generate a short portfolio JSON with title and 1 file.' }],
    max_tokens: 1000,
    stream: true,
  };

  const prep = buildProviderRequest(vendor!, masterKey, 'claude-sonnet-5.5', payload);
  console.log('Sending streaming request to', prep.url);
  const t0 = Date.now();
  const res = await fetch(prep.url, {
    method: 'POST',
    headers: prep.headers,
    body: JSON.stringify(prep.body),
  });

  console.log('Stream response status:', res.status, 'Time to first byte:', Date.now() - t0, 'ms');
  if (!res.body) {
    console.error('No body in response');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunkCount++;
    const chunk = decoder.decode(value, { stream: true });
    accumulated += chunk;
    if (chunkCount % 5 === 0) {
      console.log(`Chunk ${chunkCount}: accumulated ${accumulated.length} bytes`);
    }
  }

  console.log('Stream complete! Total chunks:', chunkCount, 'Total bytes:', accumulated.length, 'Total time:', Date.now() - t0, 'ms');
  console.log('Sample chunk:', accumulated.slice(0, 300));
}

testStream().catch(console.error);
