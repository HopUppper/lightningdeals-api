import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function configureSupabase() {
  console.log('⚡ LightingDeals — Supabase PostgreSQL Auto-Configuration Utility');
  console.log('=================================================================\n');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  // Command line argument takes top priority
  let dbUrl = process.argv[2] || process.env.DATABASE_URL || '';

  if (!dbUrl || dbUrl.includes('file:')) {
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match && (match[1].startsWith('postgres://') || match[1].startsWith('postgresql://'))) {
      dbUrl = match[1];
    }
  }

  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    console.log('⚠️ No Supabase PostgreSQL URL detected in DATABASE_URL.');
    process.exit(1);
  }

  console.log('✅ Target Supabase URL verified:', dbUrl.replace(/:[^:@]+@/, ':****@'));

  // 1. Update prisma/schema.prisma provider to "postgresql"
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  schemaContent = schemaContent.replace(/provider = "sqlite"/g, 'provider = "postgresql"');
  schemaContent = schemaContent.replace(/url = "file:[^"]+"/g, 'url = env("DATABASE_URL")');
  fs.writeFileSync(schemaPath, schemaContent, 'utf-8');
  console.log('✅ Updated prisma/schema.prisma provider to "postgresql".');

  // 2. Update .env file
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${dbUrl}"`);
  } else {
    envContent += `\nDATABASE_URL="${dbUrl}"\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ Saved DATABASE_URL to .env.');

  // 3. Push schema to Supabase & Generate Prisma Client
  try {
    console.log('\n🚀 Pushing database schema to Supabase PostgreSQL...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: dbUrl } });

    console.log('\n⚡ Generating Prisma Client for PostgreSQL...');
    execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: dbUrl } });

    console.log('\n🌱 Seeding initial admin user & token packages to Supabase...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: dbUrl } });

    console.log('\n🎉 SUCCESS! LightningDeals is now 100% connected to Supabase PostgreSQL!');
    console.log('All customer accounts, API keys, and vendor token balances will now persist permanently in Supabase.\n');
  } catch (err: any) {
    console.error('\n❌ Failed to push schema to Supabase:', err.message);
    process.exit(1);
  }
}

configureSupabase();
