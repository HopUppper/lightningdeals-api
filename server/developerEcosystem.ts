import { Router, Response } from 'express';
import { AuthRequest } from './auth';

export const devEcosystemRouter = Router();

// Allow public or authenticated access to developer migration guides
devEcosystemRouter.get('/migration-guide', async (req: AuthRequest, res: Response) => {
  try {
    const origin = ((req.query.from as string) || 'openai').toLowerCase();
    const targetModel = (req.query.model as string) || 'claude-3-5-sonnet-20241022';

    const baseUrl = 'https://lightningapi.pro/v1';

    const defaultSteps = [
      {
        step: 1,
        title: 'Update Base URL',
        description: 'Direct your client SDK or HTTP requests to the LightningAPI gateway base URL.',
        before: origin === 'openai' ? 'https://api.openai.com/v1' : origin === 'anthropic' ? 'https://api.anthropic.com' : 'https://generativelanguage.googleapis.com',
        after: `${baseUrl}`,
        note: 'Global edge mesh with sub-50ms TTFT',
      },
      {
        step: 2,
        title: 'Configure API Key',
        description: 'Provide your LightningAPI master key as bearer authentication token.',
        before: origin === 'openai' ? 'Bearer sk-proj-...' : 'x-api-key: sk-ant-...',
        after: origin === 'anthropic' ? 'x-api-key: YOUR_LIGHTNING_API_KEY' : 'Authorization: Bearer YOUR_LIGHTNING_API_KEY',
        note: 'SHA-256 in-memory verification',
      },
      {
        step: 3,
        title: 'Select Model',
        description: 'Target your preferred frontier or open model with zero downstream code changes.',
        after: `model: "${targetModel}"`,
        note: 'Automatic protocol & adapter translation',
      },
    ];

    const defaultParameterNotes = [
      {
        parameter: 'model',
        openAiAnthropicDiff: 'Unified model identifier across all providers',
        recommendation: `Target any model in the active catalogue (e.g. ${targetModel})`,
      },
      {
        parameter: 'stream',
        openAiAnthropicDiff: 'Full Server-Sent Events (SSE) streaming support',
        recommendation: 'Set stream: true for live token rendering',
      },
      {
        parameter: 'temperature',
        openAiAnthropicDiff: 'Standard normalized temperature scale (0.0 to 1.0)',
        recommendation: 'Default 0.7 for general coding, 0.2 for deterministic output',
      },
      {
        parameter: 'max_tokens',
        openAiAnthropicDiff: 'Maps automatically to max_tokens (OpenAI) or max_output_tokens (Anthropic)',
        recommendation: 'Set up to model max limit (e.g. 8192)',
      },
    ];

    const guides: Record<string, any> = {
      openai: {
        title: 'Migrate from OpenAI SDK to LightningAPI',
        subtitle: '100% Drop-in OpenAI SDK compatibility in 2 lines of code',
        from: 'OpenAI (api.openai.com)',
        to: 'LightningAPI (lightningapi.pro)',
        compatibility: '100% Drop-in OpenAI SDK Compatibility',
        endpoint: `${baseUrl}/chat/completions`,
        authHeader: 'Authorization: Bearer YOUR_LIGHTNING_API_KEY',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_LIGHTNING_API_KEY',
        },
        steps: defaultSteps,
        parameterNotes: defaultParameterNotes,
        parameterSupport: {
          messages: 'Full multi-turn support',
          model: 'Specify any model in the LightningAPI catalogue',
          stream: 'Supported with Server-Sent Events',
          temperature: 'Supported (0.0 to 2.0)',
          max_tokens: 'Supported',
          tools: 'Function calling supported on compatible models',
        },
        codeSnippets: {
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
        title: 'Migrate from Anthropic SDK to LightningAPI',
        subtitle: '100% Native Anthropic Messages API Specification support',
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
        steps: defaultSteps,
        parameterNotes: defaultParameterNotes,
        parameterSupport: {
          messages: 'Full multi-turn role array support',
          system: 'Top-level system prompt parameter supported',
          model: 'Specify any frontier model (e.g. claude-3-5-sonnet-20241022, claude-opus-5.5)',
          thinking: 'Cryptographically signed extended thinking blocks supported',
          stream: 'Native message_start/content_block_delta event streaming',
        },
        codeSnippets: {
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
      gemini: {
        title: 'Migrate from Google Gemini to LightningAPI',
        subtitle: 'Use standard OpenAI format or unified gateway endpoints',
        from: 'Google Gemini (generativelanguage.googleapis.com)',
        to: 'LightningAPI (lightningapi.pro)',
        compatibility: 'REST & OpenAI SDK compatible endpoint',
        endpoint: `${baseUrl}/chat/completions`,
        authHeader: 'Authorization: Bearer YOUR_LIGHTNING_API_KEY',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_LIGHTNING_API_KEY',
        },
        steps: defaultSteps,
        parameterNotes: defaultParameterNotes,
        parameterSupport: {
          messages: 'Unified conversation payload',
          model: 'All Gemini and frontier models supported',
          stream: 'Live SSE streaming',
        },
        codeSnippets: {
          typescript: `import OpenAI from 'openai';

// Direct OpenAI SDK configured for LightningAPI gateway
const client = new OpenAI({
  apiKey: process.env.LIGHTNING_API_KEY || 'your_api_key_here',
  baseURL: '${baseUrl}',
});

async function main() {
  const res = await client.chat.completions.create({
    model: '${targetModel.includes('gemini') ? targetModel : 'gemini-3-flash-preview'}',
    messages: [{ role: 'user', content: 'Summarize key features of quantum computing.' }],
    stream: true,
  });

  for await (const chunk of res) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main().catch(console.error);`,
          python: `from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("LIGHTNING_API_KEY", "your_api_key_here"),
    base_url="${baseUrl}",
)

res = client.chat.completions.create(
    model="${targetModel.includes('gemini') ? targetModel : 'gemini-3-flash-preview'}",
    messages=[{"role": "user", "content": "Summarize key features of quantum computing."}],
    stream=True,
)

for chunk in res:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
print()`,
          curl: `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -d '{
    "model": "${targetModel.includes('gemini') ? targetModel : 'gemini-3-flash-preview'}",
    "messages": [{"role": "user", "content": "Summarize key features of quantum computing."}]
  }'`,
        },
      },
    };

    // Also alias snippets -> codeSnippets for compatibility
    for (const key of Object.keys(guides)) {
      guides[key].snippets = guides[key].codeSnippets;
    }

    const chosen = guides[origin] || guides.openai;

    res.json({
      success: true,
      guide: chosen,
      allOrigins: Object.keys(guides),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to retrieve migration guide.' } });
  }
});
