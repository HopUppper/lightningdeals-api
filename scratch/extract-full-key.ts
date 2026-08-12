import fs from 'fs';

async function extractKey() {
  const logPath = 'C:/Users/irons/.gemini/antigravity/brain/aae64645-147a-41a7-8cc5-d6d45c9c4d1f/.system_generated/logs/transcript.jsonl';
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('sm_live_41')) {
      const idx = line.indexOf('sm_live_41');
      console.log('--- FOUND LINE ---');
      console.log(line.slice(idx, idx + 100));
    }
  }
}

extractKey().catch(console.error);
