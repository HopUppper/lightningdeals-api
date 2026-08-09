---
name: lightningdeals-security
description: Security enforcement rules, authorization checks, secret isolation, and anti-abuse policies for LightningDeals.
---

# LightningDeals Security Standards

## Mandatory Security Directives

1. **Secret & Key Protection**:
   - Never log API keys (`ld_live_...`) or supplier master keys (`sk-ant-...`) in stdout, stderr, or server log files.
   - Never expose master credentials or environment secrets in frontend bundles, screenshots, or chat output.

2. **Network & TLS Security**:
   - **NEVER** set `NODE_TLS_REJECT_UNAUTHORIZED=0` or disable TLS verification in production or CLI tools.
   - Use secure HTTPS endpoints for upstream proxying.

3. **Backend Authorization & Multi-Tenant Isolation**:
   - Never trust frontend claims or client-side role checks.
   - Enforce server-side JWT verification for customer dashboard routes and admin control center endpoints (`/api/admin/*`).
   - Validate customer ownership of API keys before allowing retrieval or modification (`where: { userId }`).

4. **Input Validation & Rate Limiting**:
   - Validate all request payloads, query params, and JSON bodies.
   - Enforce per-key RPM rate limits on the API gateway to prevent upstream denial-of-service abuse.
   - Apply anti-abuse IP/fingerprint checks on trial key generation (`/api/trial/claim`).
