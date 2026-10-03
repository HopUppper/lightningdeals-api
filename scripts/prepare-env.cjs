const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

let databaseUrl = process.env.DATABASE_URL;
let directUrl = process.env.DIRECT_URL;

// If not present in process.env, check if defined in local .env
if (!databaseUrl && envContent) {
  const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match) {
    databaseUrl = match[1];
  }
}
if (!directUrl && envContent) {
  const match = envContent.match(/^DIRECT_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match) {
    directUrl = match[1];
  }
}

// Ensure DATABASE_URL uses port 6543 (transaction mode pooler) for runtime stability if using Supabase pooler
if (databaseUrl && databaseUrl.includes('.pooler.supabase.com:5432')) {
  databaseUrl = databaseUrl.replace('.pooler.supabase.com:5432', '.pooler.supabase.com:6543');
  if (!databaseUrl.includes('pgbouncer=true')) {
    const sep = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${sep}pgbouncer=true`;
  }
  process.env.DATABASE_URL = databaseUrl;
}

// If DIRECT_URL is not explicitly provided, safely derive from DATABASE_URL on port 5432 (session/direct mode)
if (!directUrl && databaseUrl) {
  directUrl = databaseUrl
    .replace(':6543', ':5432')
    .replace('?pgbouncer=true&', '?')
    .replace('&pgbouncer=true', '')
    .replace('?pgbouncer=true', '');
  process.env.DIRECT_URL = directUrl;
}

const updates = [];

if (databaseUrl && !envContent.includes('DATABASE_URL=')) {
  updates.push(`DATABASE_URL="${databaseUrl}"`);
}

if (directUrl && !envContent.includes('DIRECT_URL=')) {
  updates.push(`DIRECT_URL="${directUrl}"`);
}

if (updates.length > 0) {
  fs.appendFileSync(envPath, '\n' + updates.join('\n') + '\n');
  console.log(`⚡ [PREPARE-ENV] Configured DIRECT_URL for Prisma.`);
} else if (directUrl || databaseUrl) {
  console.log('⚡ [PREPARE-ENV] Database environment variables prepared.');
} else {
  console.log('⚡ [PREPARE-ENV] No external DATABASE_URL provided. Operating with existing configuration.');
}
