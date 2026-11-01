# LIGHTNINGAPI — CYBER INCIDENT RESPONSE PLAYBOOK
**Platform:** LightningAPI (https://lightningapi.pro)  
**Document Purpose:** Standard Operating Procedures (SOP) for Security Incident Detection, Containment, Eradication, Recovery, and Post-Mortem.  
**Classification:** Confidential — Security Engineering Operations  
**Audience:** System Administrators, DevOps Engineers, and Security Response Team  

---

## 1. INCIDENT SEVERITY CLASSIFICATION

| Severity Level | Definition | Impact Examples | Response SLA | Escalation |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Active compromise of core platform assets, credentials, or customer data | Supplier master key leaked; unauthorized database admin access; widespread customer token exfiltration | **Immediate (< 15 mins)** | Super-Admin (`sidhjain9002@gmail.com`), Lead Architect, DevOps Lead |
| **SEV-2 (High)** | Degradation of critical security controls or targeted attack | Ongoing brute-force attack on admin accounts; suspected IDOR exploitation; upstream provider credential failure | **< 1 Hour** | Security Engineer, On-call Backend Engineer |
| **SEV-3 (Medium)** | Non-critical security anomaly or suspicious pattern detected | Multiple rate limit triggers on key check endpoint; blocked SQLi/SSRF probe spikes; isolated customer key theft | **< 4 Hours** | Security Engineer, Support Lead |
| **SEV-4 (Low)** | Minor security discrepancy or routine scanner activity | Automated bot probe blocked by firewall; minor CSP header report | **< 24 Hours** | Internal Security Queue |

---

## 2. STANDARD INCIDENT LIFECYCLE WORKFLOW

```
  [1. DETECTION & TRIAGE]
           │
           ▼
  [2. IMMEDIATE CONTAINMENT] ──► (Emergency Key Rotation / Session Revocation / IP Shunting)
           │
           ▼
  [3. ERADICATION & INVESTIGATION] ──► (Forensic Audit Logs / Threat Removal)
           │
           ▼
  [4. RECOVERY & VERIFICATION] ──► (Integrity Check / Controlled Service Restoration)
           │
           ▼
  [5. POST-INCIDENT POST-MORTEM] ──► (RCA / Permanent Defensive Upgrades)
```

### Phase 1: Detection & Triage
1. **Identify the Signal:** Audit alert from `AuditEvent`, spike in HTTP 401/403/429 status codes, Cloudflare WAF alert, customer report, or upstream supplier notice.
2. **Assign Incident Commander (IC):** Default IC is Super-Admin (`sidhjain9002@gmail.com`).
3. **Determine Severity:** Classify according to the severity matrix above.
4. **Initiate Incident Channel:** Record all actions, timestamps, and findings in an incident log.

---

### Phase 2: Immediate Containment
The primary directive during containment is **isolating the blast radius without causing unnecessary customer service interruption**.

#### Emergency Action A: Invalidate Compromised Admin Sessions
To terminate all active administrator sessions across the platform immediately:
```bash
# Set security epoch to current timestamp (invalidates all JWTs issued prior)
npx tsx -e "
import { prisma } from './server/db';
await prisma.systemSetting.upsert({
  where: { key: 'security_session_epoch' },
  update: { value: Date.now().toString() },
  create: { key: 'security_session_epoch', value: Date.now().toString() }
});
await prisma.userSession.updateMany({ data: { isRevoked: true } });
console.log('ALL SESSIONS INVALIDATED IMMEDIATELY');
"
```

#### Emergency Action B: Rotate Wholesale Supplier Master Key
If a supplier master key (ScaleMax, OpusMax, LotusAI) is suspected to be compromised:
1. Contact upstream vendor or use vendor management dashboard to provision a replacement key.
2. Update the encrypted key in PostgreSQL via Admin Control Center (`/deez/providers`) or database command:
```bash
npx tsx -e "
import { prisma, encryptText } from './server/db';
const providerId = 'PROV_ID';
const newKey = 'REPLACEMENT_KEY_FROM_VENDOR';
await prisma.vendorProvider.update({
  where: { id: providerId },
  data: {
    tokenApiKeyEncrypted: encryptText(newKey),
    status: 'connected',
    lastTestedAt: new Date()
  }
});
console.log('SUPPLIER KEY SAFELY ROTATED AND ENCRYPTED');
"
```

#### Emergency Action C: Revoke Compromised Customer API Key
```bash
npx tsx -e "
import { prisma } from './server/db';
import { invalidateKeyCache } from './server/cache/authCache';
const keyHash = 'SHA256_HASH_OF_KEY';
const key = await prisma.apiKey.update({
  where: { keyHash },
  data: { status: 'revoked' }
});
invalidateKeyCache(key.id);
console.log('KEY REVOKED AND CACHE EVICTED');
"
```

#### Emergency Action D: Block Malicious IP at Cloudflare Edge
If an attacker IP or subnet is launching high-volume attacks:
1. Navigate to Cloudflare Dashboard → `lightningapi.pro` → Security → WAF → Custom Rules.
2. Add block rule: `(ip.src eq X.X.X.X)` action: `Block`.
3. Alternatively, create local Node.js firewall block via `SystemSetting`:
```bash
npx tsx -e "
import { prisma } from './server/db';
const blockedIp = 'X.X.X.X';
await prisma.systemSetting.create({
  data: { key: 'ip_blacklist_' + blockedIp, value: 'BLOCKED_BY_INCIDENT_RESPONSE' }
});
"
```

---

### Phase 3: Eradication & Investigation
1. **Analyze Forensic Logs:**
   - Query PostgreSQL `AdminLog` and `AuditEvent` tables for actor activity:
     ```sql
     SELECT * FROM "AdminLog" WHERE "createdAt" > NOW() - INTERVAL '24 hours' ORDER BY "createdAt" DESC;
     SELECT * FROM "SecurityLog" WHERE "createdAt" > NOW() - INTERVAL '24 hours' ORDER BY "createdAt" DESC;
     ```
2. **Determine Ingress Vector:** Was the attack executed via stolen credentials, brute-force, phishing, software vulnerability, or third-party dependency?
3. **Scan for Backdoors or Altered Records:** Verify `User` table for unauthorized new administrators (`role: 'admin'`).

---

### Phase 4: Recovery & Verification
1. **Verify Integrity of Credentials:** Confirm all compromised credentials, tokens, and sessions have been replaced.
2. **Execute Regression Testing:** Run `scripts/security-hardening-test.ts` to ensure all defenses are operational.
3. **Monitor Live Telemetry:** Observe gateway latency, error rates, and request counts via `/deez/health` and `/deez/requests` for 1 hour.
4. **Restore Service Traffic:** If circuit breakers or failover mechanisms were triggered, gently restore primary traffic.

---

### Phase 5: Post-Incident Post-Mortem & Review
Within 48 hours of resolving any SEV-1 or SEV-2 incident, publish a Blameless Post-Mortem documenting:
1. Incident Timeline (T0 detection, T1 containment, T2 resolution).
2. Root Cause Analysis (5 Whys).
3. Impact Assessment (tokens affected, financial exposure, customer downtime).
4. Permanent Remediation Actions (code patches, architectural changes, rule updates).

---

## 3. SPECIFIC SCENARIO PLAYBOOKS

### Scenario A: Suspected Supplier Master Key Leakage
1. **Immediate Assessment:** Check upstream vendor usage panel (ScaleMax / LotusAI) for abnormal token consumption or unauthorized IP requests.
2. **Containment:**
   - Switch primary provider in LightningAPI Admin Panel (`/deez/providers`) to a secondary/backup provider or failover configuration.
   - Request key revocation and regeneration from the upstream supplier account manager.
   - Update `tokenApiKeyEncrypted` with the newly generated supplier key.
3. **Eradication:** Inspect git commit history, CI logs, and environment variables to ensure the key was not committed to version control.
4. **Verification:** Send test inference via `/api/admin/scalemax-live/test-inference` to verify the new supplier key is active.

---

### Scenario B: Administrator Account Lockout or Device Loss (MFA Recovery)
If the super-admin (`sidhjain9002@gmail.com`) loses their 2FA device or cannot receive TOTP codes:
1. Connect to production server via secure Render Shell or SSH console.
2. Run the verified recovery script:
   ```bash
   # Check MFA status
   npx tsx scripts/admin-mfa-recovery.ts status sidhjain9002@gmail.com

   # Option 1: Generate 8 new emergency backup recovery codes
   npx tsx scripts/admin-mfa-recovery.ts generate-backups sidhjain9002@gmail.com

   # Option 2: Disable MFA so admin can log in with password and re-enroll
   npx tsx scripts/admin-mfa-recovery.ts disable sidhjain9002@gmail.com
   ```
3. Super-admin logs in and immediately re-enrolls their new device via Control Center (`/deez/security`).

---

### Scenario C: Distributed Denial of Service (DDoS) / Gateway Flooding
1. **Edge Protection:** Activate Cloudflare "Under Attack" Mode on `lightningapi.pro`.
2. **Gateway Defense:**
   - Verify that `createRateLimiter` is enforcing 60 RPM on abusive keys.
   - Check if trial keys are being flooded: if so, reduce `trialLimiter` max claims or enable Turnstile challenge.
3. **Upstream Circuit Breaker:** Trip circuit breaker on degraded endpoints via Admin Emergency Controls (`/deez/emergency`).

---

### Scenario D: Suspected Customer Data Breach / IDOR Exfiltration
1. **Identify Customer Scope:** Run query on `ApiRequest` and `AdminLog` to inspect the targeted account IDs.
2. **Key Invalidation:** Revoke all API keys belonging to the compromised customer account.
3. **Credential Reset:** Invalidate user sessions and dispatch password reset token.
4. **Customer Communication:** Notify affected customer within 24 hours per privacy guidelines.

---

## 4. EMERGENCY CONTACTS & ESCALATION MATRIX

| Role | Name / Identifier | Email | Escalation Trigger |
| :--- | :--- | :--- | :--- |
| **Super-Administrator** | Sidh Jain | `sidhjain9002@gmail.com` | All SEV-1 and SEV-2 incidents |
| **Security Operations** | AI SecOps Lead | `security@lightningapi.pro` | System alerts, threat reports |
| **Upstream Supplier (ScaleMax)** | ScaleMax Vendor Support | `vendor-support@scalemax.pro` | Wholesale key compromise / balance sync |
| **Hosting Provider (Render)** | Render Operations | Render Dashboard Support | Host-level DDoS / network downtime |
| **Database Provider (Supabase)** | Supabase Support | Supabase Console Support | Database connection pool / storage issues |
| **Payment Gateways** | PayU India / Cashfree | Merchant Support Portals | Webhook integrity / transaction anomalies |
