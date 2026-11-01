import { Router, Response } from 'express';
import { AuthRequest, authenticateJwt } from './auth';

export const devEcosystemRouter = Router();

// Allow public or authenticated access to developer migration guides
devEcosystemRouter.get('/migration-guide', async (req: AuthRequest, res: Response) => {
  try {
    const origin = req.query.from || 'openai'; // 'openai' | 'anthropic' | 'gemini' | 'open_source'
    const targetModel = (req.query.model as string) || 'claude-3-5-sonnet-20241022';

    const baseUrl = 'https://lightningapi.pro/v1';

    const guides: Record<string, any> = {
      openai: {
        from: 'OpenAI (api.openai.com)',
        to: 'LightningAPI (lightningapi.pro)',
        compatibility: '100% Drop-in OpenAI SDK Compatibility',
        endpoint: `${baseUrl}/chat/completions`,
        authHeader: 'Authorization: Bearer YOUR_LIGHTNING_API_KEY',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_LIGHTNING_API_KEY',
        },
        parameterSupport: {
          messages: 'Full multi-turn support',
          model: 'Specify any model in the LightningAPI catalogue',
          stream: 'Supported with Server-Sent Events',
          temperature: 'Supported (0.0 to 2.0)',
          max_tokens: 'Supported',
          tools: 'Function calling supported on compatible models',
        },
        snippets: {
          typescript: `import OpenAI from 'openai';

// 1. Initialize official OpenAI SDK pointed to LightningAPI gateway
const client = new OpenAI({
  apiKey: process.env.LIGHTNING_API_KEY || 'your_api_key_here',
  baseURL: '${baseUrl}',
});

// 2. Execute chat completions with sub-50ms routing
async function main() {
  const completion = await client.chat.completions.create({
    model: '${targetModel}',
    messages: [{ role: 'user', content: 'Explain distributed consensus in 2 sentences.' }],
    stream: true,
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main().catch(console.error);`,
          python: `from openai import OpenAI
import os

# 1. Initialize official OpenAI client with LightningAPI base URL
client = OpenAI(
    api_key=os.environ.get("LIGHTNING_API_KEY", "your_api_key_here"),
    base_url="${baseUrl}",
)

# 2. Execute streaming completion
response = client.chat.completions.create(
    model="${targetModel}",
    messages=[{"role": "user", "content": "Explain distributed consensus in 2 sentences."}],
    stream=True,
)

for chunk in response:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
print()`,
          curl: `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -d '{
    "model": "${targetModel}",
    "messages": [{"role": "user", "content": "Explain distributed consensus in 2 sentences."}],
    "temperature": 0.7
  }'`,
        },
      },
      anthropic: {
        from: 'Anthropic (api.anthropic.com)',
        to: 'LightningAPI (lightningapi.pro)',
        compatibility: '100% Native Anthropic Messages API Specification',
        endpoint: `${baseUrl}/messages`,
        authHeader: 'x-api-key: YOUR_LIGHTNING_API_KEY',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_LIGHTNING_API_KEY',
          'anthropic-version': '2023-06-01',
        },
        parameterSupport: {
          messages: 'Full multi-turn role array support',
          system: 'Top-level system prompt parameter supported',
          model: 'Specify any frontier model (e.g. claude-3-5-sonnet-20241022, claude-opus-5.5)',
          thinking: 'Cryptographically signed extended thinking blocks supported',
          stream: 'Native message_start/content_block_delta event streaming',
        },
        snippets: {
          typescript: `import Anthropic from '@anthropic-ai/sdk';

// 1. Initialize official Anthropic SDK pointed to LightningAPI gateway
const client = new Anthropic({
  apiKey: process.env.LIGHTNING_API_KEY || 'your_api_key_here',
  baseURL: '${baseUrl}',
});

// 2. Stream message response
async function main() {
  const stream = await client.messages.stream({
    model: '${targetModel}',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Analyze the trade-offs of Paxos vs Raft.' }],
  });

  stream.on('text', (text) => {
    process.stdout.write(text);
  });

  await stream.finalMessage();
}

main().catch(console.error);`,
          python: `import anthropic
import os

# 1. Initialize official Anthropic client with LightningAPI base URL
client = anthropic.Anthropic(
    api_key=os.environ.get("LIGHTNING_API_KEY", "your_api_key_here"),
    base_url="${baseUrl}",
)

# 2. Stream message response
with client.messages.stream(
    model="${targetModel}",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Analyze the trade-offs of Paxos vs Raft."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print()`,
          curl: `curl ${baseUrl}/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your_api_key_here" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${targetModel}",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Analyze the trade-offs of Paxos vs Raft."}]
  }'`,
        },
      },
    };

    const chosen = guides[origin.toLowerCase()] || guides.openai;

    res.json({
      success: true,
      guide: chosen,
      allOrigins: Object.keys(guides),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to retrieve migration guide.' } });
  }
});
