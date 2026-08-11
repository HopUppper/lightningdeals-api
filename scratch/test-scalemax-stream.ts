import { prisma, decryptText } from '../server/db';

async function testScaleMaxStream() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  if (!vendor) return console.log('No vendor found');

  const key = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Testing ScaleMax STREAM (${vendor.baseUrl})...`);

  const tools = [
    {
      name: 'Bash',
      description: 'Execute a bash command',
      input_schema: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command'],
      },
    },
  ];

  const res = await fetch(`${vendor.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      stream: true,
      system: 'You are Claude Code, Anthropic’s official CLI.',
      messages: [{ role: 'user', content: 'build me a replica of the apple website' }],
      tools,
    }),
  });

  console.log(`Stream Status: ${res.status}`);
  const text = await res.text();
  console.log(`Stream Response Snippet:`, text.slice(0, 400));
}

testScaleMaxStream().catch(console.error);
