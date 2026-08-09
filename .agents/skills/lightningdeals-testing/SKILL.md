---
name: lightningdeals-testing
description: Full end-to-end testing, browser automation, API verification, and database validation workflow.
---

# LightningDeals Verification & Testing Protocol

## Required Execution Workflow

Every task or feature modification must strictly follow this cycle:

```text
AUDIT
  ↓
IMPLEMENT
  ↓
RUN (Server / CLI)
  ↓
BROWSER TEST (Chrome DevTools MCP / E2E)
  ↓
API TEST (cURL / HTTP Requests)
  ↓
DATABASE VERIFY (Prisma / Query Check)
  ↓
SECURITY CHECK
  ↓
FIX & RETEST
  ↓
VERIFIED REPORT
```

## Testing Directives

1. **No Assumption Policy**: Never assume a UI button or backend route works merely because the code compiles or renders.
2. **Interactive Verification**: Perform actual browser navigation, form fills, button clicks, console error inspections, and network request validation.
3. **Database Assertion**: Confirm that orders, user accounts, token deductions, and key creations update the database correctly.
