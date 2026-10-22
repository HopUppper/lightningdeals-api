const { execSync } = require('child_process');

console.log('⚡ [DB-SYNC] Preparing environment...');
require('./prepare-env.cjs');

console.log('⚡ [DB-SYNC] Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('⚡ [DB-SYNC] Synchronizing database schema...');
const isProd = process.env.NODE_ENV === 'production';
const allowDataLoss = process.env.ALLOW_DESTRUCTIVE_DB_PUSH === 'true';

if (isProd && allowDataLoss) {
  console.warn('⚠️ [DB-SYNC] CAUTION: ALLOW_DESTRUCTIVE_DB_PUSH=true detected in production environment!');
}

try {
  // Never pass --accept-data-loss by default in production
  const pushCmd = allowDataLoss
    ? 'npx prisma db push --accept-data-loss'
    : 'npx prisma db push';
    
  execSync(pushCmd, { stdio: 'inherit' });
  console.log('✓ [DB-SYNC] Prisma db push succeeded.');
  console.log('⚡ [DB-SYNC] Running annual pricing and entitlement migration...');
  execSync('npx tsx scripts/migrate-annual-pricing-entitlements.ts', { stdio: 'inherit' });
  console.log('✓ [DB-SYNC] Annual pricing and entitlement migration succeeded.');
  console.log('⚡ [DB-SYNC] Running token accounting and discovery migration...');
  execSync('npx tsx scripts/migrate-token-accounting.ts', { stdio: 'inherit' });
  console.log('✓ [DB-SYNC] Token accounting and discovery migration succeeded.');
} catch (err) {
  console.warn('⚠️ [DB-SYNC] Prisma db push encountered pooler contention or schema conflict. Running fallback schema migration...');
  try {
    execSync('npx tsx scripts/migrate-purchases.ts', { stdio: 'inherit' });
    execSync('npx tsx scripts/migrate-annual-pricing-entitlements.ts', { stdio: 'inherit' });
    execSync('npx tsx scripts/migrate-token-accounting.ts', { stdio: 'inherit' });
    console.log('✓ [DB-SYNC] Fallback schema migration succeeded.');
  } catch (mErr) {
    console.error('❌ [DB-SYNC] Fallback migration failed:', mErr.message);
    process.exit(1);
  }
}
