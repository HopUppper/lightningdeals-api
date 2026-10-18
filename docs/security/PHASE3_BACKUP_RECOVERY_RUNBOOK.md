# Phase 3 Database Resilience, Backups & Recovery Runbook
**Project:** LightningDeals / Lightning API Gateway  
**Repository:** `HopUppper/lightningdeals-api`  
**Database Infrastructure:** PostgreSQL (Supabase / Render Managed DB)  
**Target Branch:** `security/phase3-production-hardening`  
**Date:** October 19, 2026  

---

## 1. Database Topology & Connection Architecture

The application connects to PostgreSQL using two distinct connection strings:
1. **`DATABASE_URL` (Runtime / PgBouncer Connection Pooler):**
   - Typically connects on port `6543` (transaction pooling mode).
   - Used by the Prisma client in `server/db.ts` for all application queries.
   - Restricts session-level state, prevents connection exhaustion on Render container spikes, and enforces connection timeouts.
2. **`DIRECT_URL` (Direct Connection / Port 5432):**
   - Connects directly to PostgreSQL without PgBouncer.
   - Required for Prisma schema pushes, advisory locking, and DDL migrations.
   - Configured in `prisma/schema.prisma` via `directUrl = env("DIRECT_URL")`.

```mermaid
graph TD
    API[Lightning API Node.js Process] -->|DATABASE_URL: Port 6543 / Pooled| PGB[PgBouncer Connection Pool]
    PGB -->|Internal High Throughput| PG[(PostgreSQL Database)]
    MIG[Prisma Migrations / db-sync.cjs] -->|DIRECT_URL: Port 5432 / Direct DDL| PG
    PG -->|Automated Daily Snapshots| WAL[(Supabase / Render Backups)]
```

---

## 2. Backup Expectations & Service Level Objectives

- **Recovery Point Objective (RPO):** Maximum 24 hours under standard daily snapshots; < 5 minutes if Point-in-Time Recovery (PITR) / WAL archiving is enabled on the paid tier.
- **Recovery Time Objective (RTO):** < 30 minutes to spin up an isolated staging database and complete table validation drills.
- **Backup Retention:** 7 to 30 days depending on the underlying Supabase/Render plan.
- **Backup Scope:**
  - Complete database schema and relations (Prisma schema).
  - All customer accounts (`User`), API keys (`ApiKey`), and organizations.
  - Billing ledger, balance logs (`BalanceTransaction`), and token usage logs (`GatewayRequestLog`).
  - Encrypted records (`VendorProvider.masterApiKeyEncrypted`, `ApiKey.keyEncrypted`, `InventoryItem.dataEncrypted`).
  - Cryptographic audit trail (`SecurityAuditEvent`).

> [!IMPORTANT]
> A backup is only as good as its tested restore. Never perform a test restore into the live production database. All restore testing MUST be performed into an isolated staging schema or separate test database instance.

---

## 3. Step-by-Step Isolated Restore Drill Procedure

```mermaid
sequenceDiagram
    participant Op as Security Operator
    participant Cloud as Supabase / Render
    participant Staging as Isolated Staging DB
    participant Script as Test Validation Suite

    Op->>Cloud: Request latest snapshot / export
    Cloud-->>Op: Exported SQL dump or clone URL
    Op->>Staging: Provision staging instance
    Op->>Staging: Restore dump into staging DB
    Op->>Script: Run post-restore verification suite
    Script->>Staging: Validate tables, counts, decryptability
    Script-->>Op: Verification Report (PASS/FAIL)
    Op->>Staging: Tear down isolated staging instance
```

### Step 1: Provision Isolated Staging Target
1. In Supabase/Render, create a temporary staging database or a dedicated local PostgreSQL container:
   ```bash
   docker run --name pg-restore-drill -e POSTGRES_PASSWORD=drillpass -p 5439:5432 -d postgres:16
   ```
2. Note the staging URL: `postgresql://postgres:drillpass@localhost:5439/postgres`.

### Step 2: Download & Restore Database Dump
1. Export the latest backup snapshot from Supabase/Render:
   ```bash
   # Example pg_dump from replica/snapshot (never dump from primary under peak load)
   pg_dump "postgresql://..." --no-owner --no-acl -F c -b -v -f lightning_backup_drill.dump
   ```
2. Restore the dump into the isolated target:
   ```bash
   pg_restore -d "postgresql://postgres:drillpass@localhost:5439/postgres" --no-owner --clean lightning_backup_drill.dump
   ```

### Step 3: Post-Restore Integrity Verification Checklist
Run verification queries against the restored staging database to confirm data integrity:

| Check Item | Validation Query / Check | Pass Criteria |
|:---|:---|:---:|
| **Schema Integrity** | Verify all tables exist via `\dt` | 15+ application tables present |
| **Customer Records** | `SELECT COUNT(*) FROM "User";` | Count matches pre-incident baseline |
| **API Keys** | `SELECT COUNT(*) FROM "ApiKey";` | Active API keys preserved |
| **Balance Integrity** | `SELECT SUM("balanceUsd") FROM "User";` | Total customer balance reconciled |
| **Audit Log Integrity** | Run `npx tsx scripts/verify-audit-chain.ts` against restored DB | Hash chain unbroken (100% verified) |
| **Vault Decryptability** | Test decrypting `masterApiKeyEncrypted` with active `DATA_ENCRYPTION_KEY` | Plaintext matches expected format (not empty, not error) |
| **Ledger Reconciliation** | Check `BalanceTransaction` against `GatewayRequestLog` sums | Discrepancy = 0 |

---

## 4. Production Migration Safety Controls

1. **Destructive Guard in `scripts/db-sync.cjs`:**
   - In Phase 3, `scripts/db-sync.cjs` was hardened to block `--accept-data-loss` in production.
   - If a schema commit drops a table or alters a column in a way that risks data loss, Prisma aborts immediately unless `ALLOW_DESTRUCTIVE_DB_PUSH=true` is explicitly provided.
2. **Backward Compatibility Rule:**
   - Schema migrations must be additive (add new columns as optional/nullable, deploy code, backfill data, and only then make columns non-nullable in subsequent releases).
3. **Migration Locking:**
   - Always run migrations using `DIRECT_URL` (direct port 5432) to avoid PgBouncer session pooling deadlock during advisory lock acquisition.

---

## 5. Current Operational Status

- **Code-level database synchronization guards:** **`PASS`** (Implemented and tested in `scripts/db-sync.cjs`).
- **Audit chain verification tool:** **`PASS`** (Verified 50+ event audit records in Phase 2).
- **Live Production Database Restore Drill:** **`BLOCKED`** (Requires owner to download production snapshot and supply isolated staging credentials. Cannot be executed autonomously to prevent production disruption).

---
**Runbook Status:** Active & Standardized for Phase 3 Operations.
