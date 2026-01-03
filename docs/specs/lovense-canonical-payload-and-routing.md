# Lovense Canonical Payload and Routing Specification

> **Copilot Coding Agent Guardrails (Must Follow)**  
> This document is the source of truth for all Lovense-related development and refactoring in this codebase.  
> **If any existing repo code conflicts with this spec, the code must be changed to match the spec (not the other way around).**  
>
> **Non‑negotiable rules**:
> - Do not invent alternate architectures. No "simpler approach," no direct-to-Lovense shortcuts, no bypassing the canonical event.
> - Single canonical event only: All toy activation must be driven by exactly one post-settlement event: TipActivated.
> - Emit only after settlement: TipActivated must only be emitted after the token ledger/wallet settlement is confirmed.
> - Idempotency is mandatory: tipId is the idempotency key across all consumers. Duplicate tipId must be a no-op.
> - Auditability is mandatory: Every TipActivated must be traceable to authoritative ledger references (ledgerId, debitRef, creditRef).
> - Never couple settlement to device success: Lovense dispatch failures must not roll back settlement.
> - Respect settings boundaries: Platform Admin Controlled Settings are global (kill-switch + site identity). Model Controlled Settings are per-model (lovenseMode + viewerSyncMode).
> - No secrets client-side: No Lovense tokens/keys/secrets may be introduced into Next.js client code.
> - Do not rename event names, fields, or enum values defined in this spec. Any change requires explicit approval.
> - Do not dispatch Lovense toy commands directly from raw tipped/socket tip events. Toy dispatch must occur only as a consumer of the canonical TipActivated event.
>
> **Explicit non-goals (do not implement here):**
> - Do not implement message content logic (public/private gratitude). Other systems consume the payload.
> - Do not implement loyalty multiplier/expiry logic. Other systems consume the payload.
> - Do not implement model performance queue logic. It consumes the payload if enabled.
>
> **Acceptance criteria (definition of done):**
> - A change is "complete" only if:
>     - TipActivated payload matches the schema in this spec (fields + naming).
>     - Routing behavior matches the routing rules in this spec.
>     - UI gating matches the viewer/model rules in this spec.
>     - Idempotency is verified (duplicate tipId does not double-trigger).
>     - Audit logs exist per tipId and include dispatch attempts per target.
>
> **If anything is unclear:**  
> Stop and ask for clarification. Do not guess.

---

## Objective

Implement Lovense-powered reactions for model + viewers using a single canonical payload emitted after token settlement. The Lovense layer must not contain business logic for downstream systems (Model Mood Messaging, Loyalty, Model Performance Queue). It must only:

- Emit one auditable event per settled tip/purchase
- Route toy commands to eligible targets (model, tipper, VIP viewers)
- Make the same payload available to other internal consumers
- Ensure idempotency and observability keyed to a ledger/transaction record

---

## Scope

**In scope:**

- Model toy control via Cam Extension (primary) or Cam Kit (fallback)
- Viewer toy control via Lovense Basic JS SDK
- Viewer Sync modes:
    - OFF
    - SHARED_MOMENT (model + tipper only)
    - VIP_ROOM_SYNC (VIP viewers may opt-in to feel all tips)
- Canonical event emission and routing
- UI gating requirements (what toggles appear)
- Idempotency + audit logging

**Out of scope (handled by other systems):**

- Any logic/content generation for public/private messages
- Any loyalty multiplier/expiry logic
- Any model performance queue logic

---

## High-level Flow (authoritative)

1. User action occurs (tip or menu item purchase).
2. Wallet settlement succeeds (tokens debited from user wallet and credited to model wallet).
3. System emits one canonical event: TipActivated.  
   Do not emit TipActivated for pending/authorized/initiated transactions. Emit only when ledger status is SETTLED.
4. Consumers:
    - Lovense Orchestrator (toy commands)
    - Chat/Messaging system (reads payload)
    - Loyalty engine (reads payload)
    - Model Performance Queue (reads payload if enabled)

---

## Settings

### Platform Admin Controlled Settings (global)

These are platform-level controls managed in the admin settings panel.

| Setting               | Type    | Purpose                                                   |
|-----------------------|---------|-----------------------------------------------------------|
| `enableLovense`       | boolean | Global kill-switch                                        |
| `lovenseCamSiteName`  | string  | Constant for Lovense discovery/association (see below)    |

**Notes:**

- lovenseCamSiteName is hard-coded as the constant "XXXChatNow".
- Platform Admin Controlled Settings apply to all rooms/models.

### Model Controlled Settings (per model)

These are model-level controls managed by the model (or by staff on behalf of the model).

| Setting           | Type                               | Purpose                                      |
|-------------------|------------------------------------|----------------------------------------------|
| `lovenseMode`     | EXTENSION \| CAM_KIT              | Integration type (extension/cam kit for web) |
| `viewerSyncMode`  | OFF \| SHARED_MOMENT \| VIP_ROOM_SYNC| Viewer sync mode selection                  |

---

## Model Session Requirements

The model broadcast session must use exactly one integration path:

- EXTENSION (Cam Extension)
- CAM_KIT (Cam Kit for Web)

Never initialize both simultaneously in the same broadcast session.

---

## Viewer Settings & UI Gating

### Viewer settings (session + persisted preference)

| Setting             | Type     | Purpose                                              |
|---------------------|----------|------------------------------------------------------|
| `toyConnected`      | boolean  | Is viewer's toy connected                            |
| `reactToMyTips`     | boolean  | Viewer wants toy reaction to their own tips          |
| `feelAllTips`       | boolean  | VIP-only; when true, viewer's toy reacts to all tips |

### Viewer UI gating

- Always show: Connect Your Lovense button + connection state.
- Show React to my tips toggle only when toyConnected=true and model viewerSyncMode != OFF.
- Show Feel all tips toggle only when all are true:
    - model viewerSyncMode == VIP_ROOM_SYNC
    - viewer is VIP-eligible
    - toyConnected=true

---

## Canonical Event

### Event name

- TipActivated

### Emission rule

- Emit only after wallet settlement is confirmed.
- Do not emit TipActivated for pending/authorized/initiated transactions. Emit only when ledger status is SETTLED.

### Idempotency rule

- tipId is the idempotency key.
- All consumers must treat repeated tipId as a no-op.

### Canonical payload schema (single payload used by multiple systems)

```json
{
  "eventName": "TipActivated",
  "eventId": "uuid",
  "tipId": "string_unique",
  "timestamp": "YYYY-MM-DDTHH:mm:ss-05:00",
  "ledger": {
    "ledgerId": "string",
    "sourceRef": "string",
    "debitRef": "string",
    "creditRef": "string",
    "status": "SETTLED"
  },
  "room": {
    "roomId": "string",
    "broadcastId": "string"
  },
  "model": {
    "modelId": "string",
    "modelDisplayName": "string",
    "lovenseMode": "EXTENSION|CAM_KIT",
    "viewerSyncMode": "OFF|SHARED_MOMENT|VIP_ROOM_SYNC"
  },
  "tipper": {
    "userId": "string",
    "username": "string",
    "membershipTier": "FREE|VIP_SILVER|VIP_GOLD|VIP_PLATINUM|VIP_DIAMOND",
    "isVip": true
  },
  "transaction": {
    "currency": "TOKENS",
    "amount": 150
  },
  "item": {
    "itemType": "TIP|MENU_ITEM",
    "itemId": "string",
    "itemName": "string",
    "descriptionPublic": "string",
    "vibration": {
      "type": "LEVEL|PRESET|PATTERN",
      "strength": 16,
      "durationSec": 5,
      "presetName": "earthquake",
      "pattern": null
    },
    "bonusPoints": 150
  },
  "viewerSync": {
    "tipperToyConnected": true,
    "tipperReactToMyTips": true,
    "tipperFeelAllTips": false
  },
  "routing": {
    "targets": [
      { "type": "MODEL_TOY", "modelId": "string" },
      { "type": "TIPPER_TOY", "userId": "string" },
      { "type": "VIP_VIEWER_TOY", "userId": "string" }
    ]
  }
}
