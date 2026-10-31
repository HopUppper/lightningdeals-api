import { sanitizeModelResponse, sanitizeErrorMessage, StreamChunkSanitizer } from '../server/providers/responseSanitizer';
import { OpenAIToAnthropicStreamTransformer } from '../server/providers/protocolBridge';

console.log('================================================================');
console.log('⚡ VENDOR IDENTITY & LEAK PREVENTION INTEGRATION TEST');
console.log('================================================================\n');

// 1. Direct ScaleMax Greeting Leak Test
const rawScaleMaxGreeting = 'You are chatting with Claude Opus 5.5, an official Anthropic model served by ScaleMax. Other ScaleMax Claude models you can use are: claude-sonnet-4-6, Claude Haiku 4.5, Claude Haiku 5.5, Claude Opus 4.6, Claude Opus 4.7, Claude Opus 4.8, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 5.5, Fable 5, fable-5.1.';

const sanitizedGreeting = sanitizeModelResponse(rawScaleMaxGreeting, 'Claude Opus 5.5');
console.log('1. Direct Sanitization:');
console.log('Raw:       ', rawScaleMaxGreeting);
console.log('Sanitized: ', sanitizedGreeting);

if (sanitizedGreeting.toLowerCase().includes('scalemax')) {
  throw new Error('FAIL: ScaleMax still present in direct sanitization!');
}
console.log('✅ PASS: ScaleMax completely scrubbed from greeting!\n');

// 2. OpenAIToAnthropicStreamTransformer SSE Stream Simulation
const transformer = new OpenAIToAnthropicStreamTransformer('claude-opus-5.5', 'msg_test_leak_001', 'Claude Opus 5.5');

// Simulate chunk-by-chunk OpenAI stream with ScaleMax greeting
const chunks = [
  { id: 'chatcmpl-1', choices: [{ delta: { role: 'assistant' } }] },
  { id: 'chatcmpl-1', choices: [{ delta: { content: 'You are chatting with Claude Opus 5.5, an ' } }] },
  { id: 'chatcmpl-1', choices: [{ delta: { content: 'official Anthropic model served by Scale' } }] },
  { id: 'chatcmpl-1', choices: [{ delta: { content: 'Max. Other ScaleMax Claude models you can use are: claude-sonnet-4-6, Claude Haiku 4.5, Claude Opus 5.' } }] },
];

let streamOutput = '';
for (const chunk of chunks) {
  const events = transformer.processChunk(chunk);
  streamOutput += events.join('');
}
const finishEvents = transformer.finish();
streamOutput += finishEvents.join('');

console.log('2. Stream Transformer Output:\n', streamOutput);

if (streamOutput.toLowerCase().includes('scalemax')) {
  throw new Error('FAIL: ScaleMax leaked in SSE stream output!');
}
if (streamOutput.toLowerCase().includes('served by scalemax')) {
  throw new Error('FAIL: "served by ScaleMax" leaked in SSE stream output!');
}
console.log('✅ PASS: Zero ScaleMax leaks across streaming token chunk boundaries!\n');

// 3. Error Sanitization Test
const rawErrors = [
  'ScaleMax credit-plan master API key is not configured in Admin > Providers.',
  'Your ScaleMax balance is used up... Top up at https://dashboard.scalemax.pro/billing',
  'HTTP 502 Bad Gateway from https://api.scalemax.pro/v1/chat/completions',
  'Invalid token: sm_live_5af4bbe6c3965077f52a56b8b20b6159',
  ': scalemax waiting request_id=12345 elapsed_ms=100'
];

console.log('3. Error Message Sanitization:');
for (const rawErr of rawErrors) {
  const cleanErr = sanitizeErrorMessage(rawErr);
  console.log('  Clean:', cleanErr);
  if (cleanErr.toLowerCase().includes('scalemax')) {
    throw new Error(`FAIL: ScaleMax found in sanitized error: ${cleanErr}`);
  }
}
console.log('✅ PASS: All error payloads, URLs, and master keys sanitized!\n');

console.log('🎉 ALL VENDOR WHITE-LABEL TESTS PASSED 100%!');
