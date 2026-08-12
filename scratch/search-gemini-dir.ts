import fs from 'fs';
import path from 'path';

function searchDirectory(dir: string) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          searchDirectory(fullPath);
        } else if (stat.isFile() && f.endsWith('.jsonl') || f.endsWith('.json') || f.endsWith('.txt') || f.endsWith('.log')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes('sm_live_41')) {
            const matches = content.match(/sm_live_[a-zA-Z0-9_-]+/g);
            if (matches) {
              console.log(`FOUND IN FILE: ${fullPath}`);
              console.log(Array.from(new Set(matches)));
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Searching C:/Users/irons/.gemini for vendor key...');
searchDirectory('C:/Users/irons/.gemini');
