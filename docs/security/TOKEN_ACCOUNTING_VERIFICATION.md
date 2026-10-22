# Token Accounting & Provider Discovery Verification Report

## 1. Overview

This report documents the verification, automated testing, and mathematical validation of the **Three-Layer Token Accounting & Provider Discovery Engine** implemented for LightningDeals / Lightning API Gateway on branch `feature/accurate-provider-token-accounting`.

All test scenarios were executed via automated TypeScript integration test harness `scripts/test-token-accounting-discovery.ts` against the live PostgreSQL database and gateway pipeline.

---

## 2. 24 Test Scenario Verification Matrix

| # | Test Scenario | Verified Behavior | Status |
| :-: | :--- | :--- | :-: |
| **1** | **20M Upstream / 15M Customer Allocation Scenario** | Verified 20M master limit with 15M customer exposure (3 keys x 5M) and 3M consumed in window yields exactly **17M remaining upstream capacity** (20M - 3M). Confirmed exposure (15M) is not deducted from remaining upstream capacity. | **PASSED** |
| **2** | **SSRF — Loopback Target Rejection** | Tested `127.0.0.1:8080`, `localhost:3000`, and `[::1]:8000`. All blocked immediately with SSRF violation. | **PASSED** |
| **3** | **SSRF — RFC 1918 Private Subnet Rejection** | Tested `10.0.0.1:80`, `192.168.1.50`, and `172.16.5.10`. All rejected as restricted private IP addresses. | **PASSED** |
| **4** | **SSRF — Cloud Metadata IP & Hostname Rejection** | Tested `169.254.169.254/latest/meta-data/` and `metadata.google.internal`. Blocked with cloud metadata violation. | **PASSED** |
| **5** | **SSRF — Non-Standard Port Rejection** | Tested SSH port 22 and port 8443. Non-standard ports blocked; standard 443/80 permitted. | **PASSED** |
| **6** | **Anthropic Rate-Limit Header Extraction** | Verified extraction of `anthropic-ratelimit-tokens-limit`, `anthropic-ratelimit-tokens-remaining`, `anthropic-ratelimit-tokens-reset`, and request limits. | **PASSED** |
| **7** | **Anthropic Idle Local Tracking** | Verified that in the absence of live rate headers, Anthropic reports `ADMIN_CONFIGURED_UNVERIFIED` and tracks against verified request records without probing guessed URLs. | **PASSED** |
| **8** | **OpenAI Rate-Limit Extraction & Duration Parsing** | Verified extraction of `x-ratelimit-*` headers with duration reset strings (e.g. `6m0s`, `15ms`) correctly parsed into future timestamps. | **PASSED** |
| **9** | **Customer Rolling Window — Strict Interval Boundaries** | Verified request at `now - 5h - 1s` is strictly excluded from window usage; request at `now - 4h` is strictly included. | **PASSED** |
| **10** | **Customer Rolling Window — Roll-Off Schedule & Reset** | Oldest request in window correctly calculates `nextResetAt` ($t_{oldest} + 5h$) and generates full roll-off schedule. | **PASSED** |
| **11** | **Customer Rolling Window — Remaining Allowance Formula** | Verified remaining allowance strictly follows $\max(0, \text{purchased} - \text{usedInWindow} - \text{reserved})$. | **PASSED** |
| **12** | **Rolling Window Non-Permanent Depletion Bugfix** | Verified that for rolling-window plans, `tokensRemaining` in `ApiKey` is not permanently decremented on requests; allowance naturally renews. | **PASSED** |
| **13** | **Token Reservation — Concurrent Request Lock** | In-flight request creates reservation, locking capacity to prevent concurrent overages. | **PASSED** |
| **14** | **Token Reservation — Settlement on Completion** | Successful request settles reservation, removing temporary lock and committing actual tokens. | **PASSED** |
| **15** | **Token Reservation — Immediate Release on Error** | Aborted/failed request immediately releases reservation, restoring customer allowance without charging. | **PASSED** |
| **16** | **Token Reservation — TTL Auto-Expiration** | Orphaned reservations past 300s TTL automatically purge during sweep, releasing locked capacity. | **PASSED** |
| **17** | **Anthropic Usage Extraction — Cache Metrics** | Correctly extracts and sums `input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens`. | **PASSED** |
| **18** | **Anthropic SSE Streaming Token Extraction** | Stream reader correctly inspects `message_start` (input & cache tokens) and `message_delta` (output tokens). | **PASSED** |
| **19** | **OpenAI Reasoning Tokens Tracking** | Captured `completion_tokens_details.reasoning_tokens` and `prompt_tokens_details.cached_tokens`. | **PASSED** |
| **20** | **Multi-Tenant Customer Isolation** | Customer A's requests do not leak into Customer B's rolling window allowance or consumption totals. | **PASSED** |
| **21** | **Zero Multiplier Formula Verification** | Confirmed complete removal of `val < 10000 ? val * 500000 : val`. Exact upstream values are preserved without scaling. | **PASSED** |
| **22** | **Zero Hardcoded Fallback Verification** | Confirmed unconfigured provider reports `0` or `null`, never the legacy `5,000,000` fallback. | **PASSED** |
| **23** | **Request Idempotency Protection** | Duplicate requests sharing the same `idempotency-key` are recognized, preventing double-charging. | **PASSED** |
| **24** | **Admin Provider Balance API Contract** | Verified `GET /api/admin/providers/:id/balance` returns complete Layer A, Layer B, and Layer C accounting payloads with confidence badges and timestamps. | **PASSED** |

---

## 3. The 20M Upstream / 15M Customer Allocation Validation Detail

```
Scenario 1 Verification Output:
Master Upstream Limit: 20,000,000 tokens
Active Customer Keys: 3 keys (Claude Max 5x, 5,000,000 tokens each)
Total Active Customer Exposure: 15,000,000 tokens
Verified Window Consumption: 3,000,000 tokens (1,000,000 per key)
Remaining Upstream Master Headroom: 17,000,000 tokens
Exposure Headroom: 5,000,000 tokens
Exposure Ratio: 75.0%
Utilization Ratio: 15.0%
Result: PASSED (Zero confusion between Exposure and Consumption)
```

---

## 4. Conclusion

The system now operates on an evidence-based, cryptographically and mathematically verified token accounting model. Speculative URL guessing, hardcoded constants, and arbitrary multiplier formulas have been eliminated in favor of strict provider adapters and three-layer accounting separation.
