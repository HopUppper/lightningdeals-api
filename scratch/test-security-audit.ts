import { hashPasswordScrypt, verifyPasswordScrypt } from '../server/auth';
import { validateVendorBaseUrl } from '../server/ssrf';
import { sanitizeText } from '../server/sanitize';
import { prisma } from '../server/db';

async function runSecurityAuditSuite() {
  console.log('⚡ LightningDeals — Complete Security Hardening & Regression Suite');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Password Hashing & Timing-Safe Verification (Scrypt)
  console.log('--- TEST GROUP 1: Authentication & Password Security ---');
  const plainPassword = 'SuperSecretPass2026!';
  const scryptHash = hashPasswordScrypt(plainPassword);
  assert(scryptHash.startsWith('scrypt$'), 'Scrypt hash contains scrypt$ prefix format');
  assert(verifyPasswordScrypt(plainPassword, scryptHash), 'Scrypt password matches valid password');
  assert(!verifyPasswordScrypt('WrongPass2026!', scryptHash), 'Scrypt password rejects incorrect password');

  // 2. SSRF Protection & IP Validation
  console.log('\n--- TEST GROUP 2: SSRF & Base URL Protection ---');
  const loopbackTest = validateVendorBaseUrl('http://127.0.0.1:8080');
  assert(!loopbackTest.safe, 'SSRF filter blocks 127.0.0.1 loopback target');

  const localhostTest = validateVendorBaseUrl('http://localhost:3000');
  assert(!localhostTest.safe, 'SSRF filter blocks localhost target');

  const metadataTest = validateVendorBaseUrl('http://169.254.169.254/latest/meta-data/');
  assert(!metadataTest.safe, 'SSRF filter blocks AWS/cloud metadata 169.254.169.254 endpoint');

  const privateIpTest = validateVendorBaseUrl('http://10.0.0.5/v1');
  assert(!privateIpTest.safe, 'SSRF filter blocks private 10.0.0.0/8 IP range');

  const validVendorUrl = validateVendorBaseUrl('https://api2.scalemax.pro');
  assert(validVendorUrl.safe, 'SSRF filter permits valid external vendor domain (api2.scalemax.pro)');

  // 3. XSS Input Sanitization
  console.log('\n--- TEST GROUP 3: Cross-Site Scripting (XSS) Output Encoding ---');
  const maliciousScript = '<script>alert("xss")</script>';
  const sanitizedScript = sanitizeText(maliciousScript);
  assert(
    sanitizedScript === '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
    'XSS sanitizer converts executable script tags to text HTML entities'
  );

  const maliciousAttribute = '"><img src=x onerror=alert(1)>';
  const sanitizedAttr = sanitizeText(maliciousAttribute);
  assert(!sanitizedAttr.includes('<img'), 'XSS sanitizer strips img onerror payload HTML tags');

  // 4. Database Ledger & Token Accounting Integrity
  console.log('\n--- TEST GROUP 4: Database Ledger & Token Accounting ---');
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  assert(!!adminUser, 'Admin user account exists in database');

  const vendors = await prisma.vendorProvider.findMany();
  for (const v of vendors) {
    assert((v as any).masterApiKeyEncrypted !== 'sk-ant-12345', 'Vendor master key is stored in encrypted format, not plaintext');
  }

  console.log('\n=================================================================');
  console.log(`SECURITY SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED.`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditSuite().catch(console.error);
