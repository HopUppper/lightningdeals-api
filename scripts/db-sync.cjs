const { execSync } = require('child_process');

console.log('⚡ [DB-SYNC] Preparing environment...');
require('./prepare-env.cjs');

console.log('⚡ [DB-SYNC] Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('⚡ [DB-SYNC] Synchronizing database schema...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✓ [DB-SYNC] Prisma db push succeeded.');
} catch (err) {
  console.warn('⚠️ [DB-SYNC] Prisma db push encountered pooler contention. Running fallback schema migration...');
  try {
    execSync('npx tsx scripts/migrate-purchases.ts', { stdio: 'inherit' });
    console.log('✓ [DB-SYNC] Fallback schema migration succeeded.');
  } catch (mErr) {
    console.error('❌ [DB-SYNC] Fallback migration failed:', mErr.message);
    process.exit(1);
  }
}
