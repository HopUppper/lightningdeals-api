const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

let databaseUrl = process.env.DATABASE_URL;
let directUrl = process.env.DIRECT_URL;

// If DIRECT_URL is not explicitly provided in environment, derive from DATABASE_URL
if (!directUrl && databaseUrl) {
  directUrl = databaseUrl
    .replace(':6543', ':5432')
    .replace('?pgbouncer=true&', '?')
    .replace('&pgbouncer=true', '')
    .replace('?pgbouncer=true', '');
}

// Fallback direct connection URL to Supabase on port 5432
if (!directUrl) {
  directUrl = 'postgresql://postgres.efalzdhwheuywqpebzak:Jr6*C-UE-5VxRgZ@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?connect_timeout=15';
}

process.env.DIRECT_URL = directUrl;

const updates = [];

if (databaseUrl && !envContent.includes('DATABASE_URL=')) {
  updates.push(`DATABASE_URL="${databaseUrl}"`);
}

if (!envContent.includes('DIRECT_URL=')) {
  updates.push(`DIRECT_URL="${directUrl}"`);
}

if (updates.length > 0) {
  fs.appendFileSync(envPath, '\n' + updates.join('\n') + '\n');
  console.log(`⚡ [PREPARE-ENV] Configured DIRECT_URL for Prisma.`);
} else {
  console.log('⚡ [PREPARE-ENV] DIRECT_URL is active.');
}
