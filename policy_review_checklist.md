# LIGHTNINGAPI.PRO — POLICY REVIEW & LEGAL UNCERTAINTIES CHECKLIST
## Critical Operator Decisions & Legal Review Items

---

## 1. Purpose of this Checklist

In accordance with strict compliance directives, **we do not guess or fabricate legal identities, registration numbers, tax jurisdictions, dispute forums, or arbitrary financial guarantees**.

This document lists all policy topics, business facts, and operator decisions that require explicit review and confirmation by the operator of LightningAPI.pro.

---

## 2. Checklist of Operator Decisions & Business Information

### A. Legal Entity & Operator Identity
- [ ] **Operating Legal Entity**: Confirm the exact legal entity name (e.g., *LightningDeals Technology*, *ApexScale AI Infrastructure*, or an incorporated entity). Currently identified publicly as *LightningDeals (independently operated AI API gateway)*.
- [ ] **Registered Business Address**: Confirm whether a registered office address should be published in the Terms of Service and payment receipts, or provided upon request via support.
- [ ] **GST / Tax Registration**: Confirm whether Indian GSTIN or relevant VAT/tax identifiers should be stated on checkout receipts for domestic transactions.
- [ ] **Contact Email for Legal Inquiries**: Standardized across the website as `support@lightningapi.pro`. Confirm if a dedicated address (e.g. `legal@lightningapi.pro`) is preferred.

### B. Governing Law & Dispute Forum
- [ ] **Governing Law Jurisdiction**: The terms currently specify the mandatory laws of India (and the customer's jurisdiction where consumer protection laws cannot lawfully be excluded). Confirm the specific state/court jurisdiction (e.g., Courts of New Delhi, India).
- [ ] **Mandatory Pre-Dispute Informal Resolution**: Policy includes a 30-day informal resolution requirement where customers contact `support@lightningapi.pro` with their Order ID before initiating formal claims. Confirm whether arbitration rules should be formally specified.

### C. Commercial Model & Payment Processing
- [ ] **Payment Gateways**: Confirm active gateway integrations shown in policies: PayU and Cashfree (for INR / card / UPI / netbanking transactions). Note: Cryptomus or PayPal are maintained in backend records if enabled by admin.
- [ ] **Subscription Model vs Prepaid Packs**: Clarify in customer communications that packages (e.g. Claude Max 5x, 20x, 40x, 100x) are **prepaid digital token allocations** governed by fixed validity periods (e.g. 30 days) and 5-hour rolling refill windows, rather than auto-debiting recurring credit card subscriptions (unless an automated recurring mandate is explicitly authorized at checkout).
- [ ] **Unused Token Rollover**: Confirm policy that unused token balances expire at the end of the package validity period and do not roll over indefinitely, as capacity is reserved per cycle.

### D. Upstream Dependencies & Disclaimers
- [ ] **Third-Party Model Disclaimer**: Prominently disclosed that LightningAPI.pro is an independently operated API gateway and is **not affiliated with, endorsed by, or an agent of Anthropic, PBC**.
- [ ] **Upstream Availability & Force Majeure**: Disclosed that model availability, rate limits, and latency depend in part on upstream cluster health; service is provided on an "as available" basis without financial penalties for upstream outages.
- [ ] **Downstream AI Output Liability**: Confirmed standard limitation of liability: customers are responsible for reviewing AI-generated output before deploying to safety-critical, legal, medical, or production environments.

### E. Data Privacy & Telemetry Disclosures
- [ ] **Transient Memory Forwarding**: Confirmed that prompt and completion payloads are streamed through transient server memory over TLS 1.3 and **never persisted to disk or databases** by LightningAPI.pro.
- [ ] **Metadata Retention**: Disclosed that operational telemetry (token counts, latency ms, HTTP status code, model ID, timestamp, and scrypt-hashed API key) is retained in the database for the life of the API key to render customer dashboards and prevent fraud.
- [ ] **Third-Party Analytics**: Disclosed use of Google Analytics (property `G-GBRR7YHWVM`) for aggregated website traffic metrics.
- [ ] **Data Deletion Rights**: Confirmed that customers can request permanent deletion of their account, API keys, and associated usage records by contacting support.

---

## 3. Operator Action Items

| Item | Priority | Current Default in Code | Action Needed |
|---|---|---|---|
| Business Address | Medium | Available on request via support / checkout receipt | Provide official physical address if desired on public `/terms`. |
| Legal Entity Name | Medium | LightningDeals AI Infrastructure | Provide exact registered corporate entity if incorporated. |
| Support Email | Low | `support@lightningapi.pro` | Verified active and standardized across all components. |
| Tax / Invoice Rules | Low | Electronic order receipt with Order ID | Confirm if GST invoices are issued upon request. |
