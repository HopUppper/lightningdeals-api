import fs from 'fs';
import path from 'path';

async function findKey() {
  const logPath = 'C:/Users/irons/.gemini/antigravity/brain/aae64645-147a-41a7-8cc5-d6d45c9c4d1f/.system_generated/logs/transcript.jsonl';
  if (!fs.existsSync(logPath)) {
    console.error('Log file not found!');
    return;
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const matches = content.match(/sm_live_[a-zA-Z0-9_]+/g);
  console.log('--- FOUND SM_LIVE KEYS IN TRANSCRIPT ---');
  console.log(matches ? Array.from(new Set(matches)) : 'None found');
}

findKey().catch(console.error);
