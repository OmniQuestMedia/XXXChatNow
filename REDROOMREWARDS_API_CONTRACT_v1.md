# RedRoomRewards × XXXChatNow — Shared API Contract (v1)
Date: 2025-12-23  
Status: **Executable contract** (intended to be implemented exactly as written)  
Owners: **RedRoomRewards (canonical)**, XXXChatNow (client implementation)

## 0. Purpose
This document defines the **authoritative integration contract** between:
- **RedRoomRewards (RRR)**: loyalty ledger, promotions engine, liability reporting, auditing, dispute controls.
- **XXXChatNow (XCN)**: commerce surface (tokens + memberships), user experience, model tooling, and checkout flows.

It exists to prevent API drift, ensure **auditability-first**, and keep wallet ownership boundaries clear.

---

## 1. Non‑Negotiable Principles
1. **Correctness over speed**, then auditability, then speed.  
2. **All money movement stays in XCN** (payment gateways, chargebacks, refunds for purchases).  
3. **All points movement is canonical in RRR** (issuance, redemption, expiry, adjustments, transfers, merges).  
4. All mutating calls are **idempotent**.  
5. Every points mutation yields a **ledger entry** with immutable audit fields.  
6. **No PII in logs** for financial or points events.  
7. Timestamps for business rules are evaluated in **America/Toronto**.

---

## 2. Integration Topology
### 2.1 Systems of Record
| Asset | System of Record | Notes |
|---|---|---|
| Cash, payments, token purchases | XCN | Includes payment retries, chargebacks, refunds |
| Tokens (in‑platform spend) | XCN | Uses escrow/settlement architecture already established |
| Loyalty points | RRR | Includes earn, burn, expiry, escrow, adjustments |

### 2.2 Sync Strategy
- **XCN → RRR**: Earn events, redeem requests, customer tier status changes, model award events.
- **RRR → XCN**: Webhooks for posted transactions, reversals, promotion eligibility updates, link status updates.

---

## 3. Authentication, Linking, and SSO
### 3.1 Actor Types
- **Member**: end-user collecting points
- **Model**: content provider (earns points, may award points)
- **Client Admin**: XCN staff managing campaigns and exceptions
- **RRR Admin**: RRR staff overseeing platform integrity and approvals
- **Service**: system-to-system calls from XCN backend to RRR

### 3.2 Auth Methods
- **Service-to-service**: OAuth 2.0 Client Credentials (preferred) or signed JWT (fallback).
- **Admin + Member UI**: OIDC (OpenID Connect) hosted by RRR, with optional SSO from XCN.

### 3.3 Account Linking Rules
- A single RRR account may link to **at most one XCN profile**.
- A single XCN profile may link to **at most one RRR account**.
- Link requires proof of control from both sides (see endpoints below).

### 3.4 SSO UX Options (Supported)
**Option A (Recommended): Embedded Reflection**
- XCN shows points balance + expiring soon via **read-only API** calls to RRR.
- Deep actions (transfer, merge requests, detailed ledger export) open RRR in a new tab with SSO.

**Option B: Full Redirect**
- XCN provides "Open RedRoomRewards" button, launches RRR via SSO.
- XCN may still call balance endpoints for lightweight in-app display.

---

## 4. API Conventions
### 4.1 Base
- Base URL: `https://api.redroomrewards.com`
- Version prefix: `/v1`

### 4.2 Headers (Required)
- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` (required on all POST/PATCH/DELETE)
- `X-Client-Id: <client_id>` (RRR-issued; stable)
- `X-Request-Trace: <uuid>` (propagated across services)
- `Content-Type: application/json`

### 4.3 Idempotency Rules
- RRR must store idempotency keys per endpoint + client for **at least 30 days**.
- Same key + same payload → return original result.
- Same key + different payload → `409 IDEMPOTENCY_KEY_REUSE_MISMATCH`.

### 4.4 Time and Currency
- All timestamps are ISO-8601 with offset.  
- Business evaluation timezone is **America/Toronto**.  
- Currency fields are ISO 4217 (e.g., `USD`, `CAD`, `EUR`) and minor units as integer (cents).

### 4.5 Error Model (Canonical)
Responses use:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message",
    "details": { "field": "context" }
  }
}
```
Common codes:
- `401 UNAUTHENTICATED`
- `403 UNAUTHORIZED`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `422 VALIDATION_FAILED`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`

---

## 5. Core Data Objects (Schema Summary)
### 5.1 MemberWallet
- `member_id` (RRR UUID)
- `balances`:  
  - `available_points`  
  - `escrow_points`  
  - `pending_points` (optional; for "posting within 48h" pipeline)
- `expiring_soon`: array of `{ points, expires_at }`

### 5.2 LedgerEntry (immutable)
- `entry_id`, `member_id`, `client_id`
- `type`: `EARN|REDEEM|EXPIRE|ADJUST|TRANSFER_IN|TRANSFER_OUT|REVERSAL`
- `points_delta` (signed integer)
- `balance_after`
- `reason_code` (enum)
- `source_ref` (client-provided reference)
- `created_at`, `posted_at`
- `actor`: `{ actor_type, actor_id }` (no PII)

### 5.3 Promotion
- `promotion_id`, `client_id`
- `name`, `status` (`DRAFT|PENDING_APPROVAL|ACTIVE|PAUSED|ENDED`)
- `eligibility`: includes XCN membership tier constraints
- `earn_rules`: multipliers, caps, expiry policy
- `approval`: multi-sig fields (see §9)

---

## 6. Endpoints — Linking and Identity
### 6.1 Create Link Intent (RRR)
`POST /v1/links/intents`
```json
{
  "client_user_id": "XCN_USER_12345",
  "link_type": "MEMBER|MODEL"
}
```
Response:
```json
{
  "intent_id": "uuid",
  "expires_at": "2025-12-23T18:00:00-05:00",
  "rrr_link_code": "short-code"
}
```

### 6.2 Confirm Link (RRR)
`POST /v1/links/confirm`
```json
{
  "intent_id": "uuid",
  "rrr_member_id": "uuid",
  "client_user_id": "XCN_USER_12345",
  "proof": {
    "method": "SSO_ASSERTION|EMAIL_OTP|SIGNED_JWT",
    "assertion": "..."
  }
}
```

### 6.3 Get Link Status (XCN read)
`GET /v1/links/status?client_user_id=XCN_USER_12345`
Response:
```json
{
  "linked": true,
  "rrr_member_id": "uuid",
  "link_type": "MEMBER",
  "linked_at": "..."
}
```

---

## 7. Endpoints — Balances and Member UX
### 7.1 Wallet Summary (for in-app reflection)
`GET /v1/members/{rrr_member_id}/wallet`
Response:
```json
{
  "member_id": "uuid",
  "available_points": 1250,
  "escrow_points": 0,
  "pending_points": 300,
  "expiring_soon": [
    { "points": 200, "expires_at": "2026-01-15T00:00:00-05:00" }
  ],
  "as_of": "..."
}
```

### 7.2 Ledger Query (last 120 days fast path)
`GET /v1/members/{rrr_member_id}/ledger?from=...&to=...&type=EARN,REDEEM`
- RRR must keep "hot" query performance for **120 days**; older falls back to archive but remains retrievable for **7 years**.

---

## 8. Endpoints — Earn (Issuance)
### 8.1 Post Earn Event (purchase-based)
`POST /v1/points/earn`
```json
{
  "client_user_id": "XCN_USER_12345",
  "rrr_member_id": "uuid",
  "source": {
    "event_type": "TOKEN_PURCHASE|MEMBERSHIP_PURCHASE|ADJUSTMENT|MODEL_AWARD",
    "order_id": "XCN_ORDER_987",
    "line_id": "1"
  },
  "currency": "USD",
  "amount_minor": 1999,
  "points": 200,
  "policy": {
    "expires_at": "2026-12-23T00:00:00-05:00",
    "posting_mode": "POSTED|PENDING"
  },
  "metadata": {
    "xcn_membership_tier": "GOLD",
    "promotion_id": "optional"
  }
}
```
Response:
```json
{
  "status": "ACCEPTED",
  "ledger_entry_id": "uuid",
  "posted_at": null,
  "pending_until": "2025-12-25T00:00:00-05:00"
}
```

### 8.2 Post Earn Batch (CSV upload equivalent)
`POST /v1/points/earn/batch`
- Payload may contain up to N items; each item must include its own `source_ref` and be idempotent.
- RRR returns per-row acceptance.

---

## 9. Endpoints — Promotions and Approvals (Multi‑Sig)
### 9.1 Create/Update Promotion (XCN Admin)
`POST /v1/promotions`  
`PATCH /v1/promotions/{promotion_id}`

### 9.2 Submit for Approval
`POST /v1/promotions/{promotion_id}/submit`  
State becomes `PENDING_APPROVAL`.

### 9.3 Approve (Two XCN + One RRR)
`POST /v1/promotions/{promotion_id}/approve`
```json
{
  "actor": { "actor_type": "CLIENT_ADMIN|RRR_ADMIN", "actor_id": "uuid" },
  "signature": { "method": "OIDC_SESSION", "attestation": "..." }
}
```
Rules:
- Must receive **2 distinct XCN admins** approvals + **1 RRR admin/account manager** approval.
- Order does not matter.
- RRR records each signature as an immutable audit record.

---

## 10. Endpoints — Redemption (Burn)
### 10.1 Quote Redemption at Checkout
`POST /v1/redemptions/quote`
```json
{
  "client_user_id": "XCN_USER_12345",
  "rrr_member_id": "uuid",
  "cart": {
    "currency": "USD",
    "total_minor": 999,
    "items": [{ "sku": "XCN_MEMBERSHIP_GOLD_1M", "qty": 1, "minor": 999 }]
  },
  "requested": { "mode": "MAX|EXACT", "points": 500 }
}
```
Response:
```json
{
  "eligible": true,
  "min_points": 250,
  "max_points": 800,
  "quote": { "points_to_burn": 500, "discount_minor": 500 },
  "quote_id": "uuid",
  "expires_at": "..."
}
```

### 10.2 Commit Redemption (atomic burn)
`POST /v1/redemptions/commit`
```json
{
  "quote_id": "uuid",
  "client_order_id": "XCN_ORDER_987",
  "client_user_id": "XCN_USER_12345",
  "rrr_member_id": "uuid"
}
```

### 10.3 Reversal (if order fails after burn)
`POST /v1/redemptions/reverse`
```json
{
  "client_order_id": "XCN_ORDER_987",
  "reason": "PAYMENT_FAILED|CANCELLED|FRAUD_BLOCKED"
}
```

---

## 11. Endpoints — "Top Up" Points Purchase
Top-ups are **cash transactions** executed by XCN, then points are issued in RRR.

### 11.1 Quote Top Up
`POST /v1/points/topup/quote`
```json
{ "bundle": 250, "unit_price_minor": 3 }
```

### 11.2 Commit Top Up (after XCN payment success)
`POST /v1/points/topup/commit`
```json
{
  "topup_quote_id": "uuid",
  "client_order_id": "XCN_ORDER_987_TOPUP",
  "client_user_id": "XCN_USER_12345",
  "rrr_member_id": "uuid"
}
```

---

## 12. Endpoints — Model Award to Viewer (Model → Member)
### 12.1 Create Award Intent (XCN)
`POST /v1/awards/intents`
```json
{
  "client_model_id": "XCN_MODEL_444",
  "rrr_model_member_id": "uuid",
  "client_viewer_user_id": "XCN_USER_12345",
  "rrr_viewer_member_id": "uuid",
  "points": 25,
  "context": { "room_id": "abc", "stream_id": "def" }
}
```

### 12.2 Commit Award (RRR atomic)
`POST /v1/awards/commit`
- Validates balance availability, link status, and caps.
- Writes two ledger entries: `TRANSFER_OUT` (model) and `TRANSFER_IN` (viewer).

---

## 13. Webhooks (RRR → XCN)
### 13.1 Register Webhook
`POST /v1/webhooks`
```json
{
  "url": "https://xcn.com/api/rrr/webhook",
  "events": ["POINTS_POSTED","REDEMPTION_REVERSED","LINK_UPDATED"]
}
```

### 13.2 Delivery Requirements
- `X-RRR-Signature: HMAC_SHA256(body, secret)`
- Retries with exponential backoff
- Idempotent by `event_id`

Event types:
- `POINTS_POSTED`
- `POINTS_REVERSED`
- `REDEMPTION_COMMITTED`
- `REDEMPTION_REVERSED`
- `LINK_UPDATED`
- `PROMOTION_STATUS_CHANGED`
- `TRANSFER_COMPLETED`
- `TRANSFER_REVERSED`

---

## 14. Reporting Endpoints (Liability + Reconciliation)
### 14.1 Liability Summary
`GET /v1/reports/liability?client_id=...&from=...&to=...`

### 14.2 Segmentation
`GET /v1/reports/segments?...`
- By tier, cohort, promotion_id, etc. (non-PII).

---

## 15. Rate Limiting and SLAs
- Service calls: baseline 100 rps per client, burst 200 rps (configurable).
- Posting SLA: **<= 48 hours** for pending earn events.
- Balance reads low-latency; archive ledger reads may be slower.

---

## 16. Repo Implementation Notes
### 16.1 Canonical Location
- Commit this document into **both repos**.
- **RRR repo is canonical**; changes must originate there and be mirrored into XCN.

### 16.2 Contract Tests
- JSON schema validation
- Idempotency replay tests
- Webhook signature verification tests
- Negative tests for one-to-one linking constraint

---

## 17. Open Items (Explicit)
- Chargeback propagation policy (cash reversals → points reversals timing/thresholds)
- Shared ledger vs separate ledger (tokens vs points) (currently separate)
- Jurisdictional privacy workflows (DSAR/delete vs retention)
