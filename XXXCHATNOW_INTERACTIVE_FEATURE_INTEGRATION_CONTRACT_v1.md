# XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md

## Purpose
This document is the single source of truth for how any interactive monetization feature integrates with:
1) Wallet accounting (user balance, escrow, settlement, refunds)
2) The Model Performance Queue (the authoritative execution and settlement pipeline)
3) Public chat stream and private system messaging
4) Security, idempotency, auditability, and low-noise implementation standards

This contract applies to all current and future features including, but not limited to:
- Chip Menus (live-only, multi-menu)
- Model Performance Queue (start/finish/refund workflow)
- Slot Machine
- Spin Wheel / Wheel of Fortune
- Any future “burn” games that produce performance actions
- Non-queued instant items (GIF/emoticon gratitude items)

This contract is intentionally strict to reduce code noise, prevent duplicated business logic, and keep security and settlement correct.

---

## Golden Rules
1) The Queue owns execution and settlement.
   - Interactive features may determine a prize or action, but may NOT settle funds to model earnings.
2) Wallet movement rules are fixed:
   - User wallet -> Escrow happens immediately upon purchase/spin confirmation.
   - Escrow -> Model earned happens only when Queue “Finish/Settle” occurs.
   - Refunds move from Escrow -> User wallet only (never from earned).
3) No module may implement “queue business rules” internally.
   - Modules only emit a normalized Queue Intake payload (defined below).
4) Every request must be idempotent.
   - Every purchase/spin must have an Idempotency-Key to prevent duplicates.
5) No PII in logs.
   - Logs may include IDs, not emails/phone/IP. If IP is required for fraud signals, store separately, not in app logs.
6) Do not duplicate cooldown logic.
   - Game modules enforce their own cooldowns before creating queue items.
   - Queue does not enforce game cooldowns, queue only receives valid items.

---

## Feature Taxonomy
### A) Queue-Producing Features
Examples: chip menu performance actions, slot machine prize actions, wheel prize actions.
- These produce a Queue Item.
- Funds go to Escrow immediately.
- The Queue controls execution + settlement.

### B) Instant-Only Features (Non-Queued)
Examples: animated GIF gratitude items with token cost but no performance action, non-vibrating emoticons.
- These do NOT enter the Queue.
- These may settle immediately (platform policy decision), but must still follow idempotency and audit logging.
- Public chat announces the event; no queue timers.

### C) Hybrid Features (Queue Item + Sub-Effect)
Example: “Take off T-shirt” performance action with a Lovense vibration sub-effect.
- This is ONE queue item with optional sub-effects.
- The queue item controls settlement.
- Sub-effects timing is configurable (beginning, 25%, 50%, 75%, end).

---

## Standard Integration Pattern (How To Add Any New Interactive Feature)
Every new interactive feature must implement ONLY:
1) Config storage and retrieval (model-scoped and/or admin templated)
2) Runtime eligibility checks (auth, balance, cooldown)
3) Game logic to determine the winning prize (if applicable)
4) Queue Intake: create a normalized Queue Item via Queue API/service
5) Messaging hooks: emit public chat and private messages via messaging services

Everything else is owned by the Queue.

---

## Queue Intake Contract (Canonical Payload)
All queue-producing features must create a Queue Item using this payload shape.

### Required Fields
- source: string enum
  - "chip_menu" | "slot_machine" | "spin_wheel" | "admin" | "system"
- sourceEventId: string
  - Unique id for the feature event (spinId, purchaseId, etc)
- idempotencyKey: string
  - Required. Must be unique per attempt. Safe to retry.
- performerId: ObjectId/string
- userId: ObjectId/string
- tokenCost: number
  - The amount user paid for this action/spin/purchase.
- action:
  - actionType: "performance_action" | "toy_activation" | "private_request" | "system"
  - title: string (short name)
  - description: string (longer display)
  - menuItemId: optional (if the action is derived from a menu item)
  - rank: optional number (for games, 1..10 where 10 is highest)
  - durationHintMs: optional number
    - If provided, Queue uses it for the model timer UI. If omitted, Queue default is 90 seconds (30 green, 30 yellow, 30 red).
- createdAtHighPrecision: string
  - ISO timestamp plus higher precision if supported (Queue will re-stamp server-side as authority).
- chat:
  - publicAnnounceTemplateKey: string
    - e.g. "slot.spin.started" | "slot.spin.winner" | "wheel.spin.started" | "menu.purchase"
  - privateUserMessageTemplateKeys: string[]
    - e.g. queue receipt message, queue position update messages
- metadata (non-PII only):
  - userDisplayName: string (optional if safe)
  - performerUsername: string (optional if safe)
  - betTier: optional number (1/2/3 for slot)
  - clientSessionId: optional string (avoid storing raw IP)
  - uiSurface: optional string ("desktop" | "mobile" | "tablet")
  - additional: optional object (must remain non-PII)

### Optional Fields (Sub-Effects)
- effects:
  - toy:
    - enabled: boolean
    - timing: "start" | "p25" | "p50" | "p75" | "end"
    - intensity: optional number
    - durationMs: optional number
    - deviceVendor: optional string (e.g., "lovense")
  - other:
    - array of additional effects if needed later, each must be explicitly defined and versioned

### Forbidden Fields
- Any raw PII: email, phone, exact IP address, payment card data, full legal name.
- Any settlement directive: modules must not tell Queue to settle early or pay out.
- Any direct “earned wallet” mutations: features never credit the model directly.

---

## Wallet Accounting Contract
### Required Behavior
1) Before creating Queue Item:
   - Validate user has sufficient tokens.
   - Validate cooldown eligibility (module-owned).
   - Validate config exists and is valid.

2) On confirmed purchase/spin:
   - Deduct tokens from user visible balance immediately.
   - Financially place same amount into Escrow wallet.
   - Create Queue Item referencing the escrow transaction id (or sourceEventId).

3) Settlement:
   - ONLY Queue transitions escrow -> model earned, and only on Finish/Settle.

4) Refunds:
   - Refunds return tokens from escrow to user wallet.
   - Refund reasons are tracked and reportable.
   - If item is never started and user leaves the room, Queue may auto-refund based on queue rules.

---

## Refund Reasons (Taxonomy)
Refund action is controlled by Queue UI, not by modules.
Refund must be tagged with a reason:
- goodwill
- dispute
- system_auto (user disconnected before performance, model disconnect policy)
- moderation
- other (requires admin note)

Refund amount:
- Token value, integer, must be <= tokenCost for that queue item.
- Refunds are from escrow only.

---

## Ordering Rules (Queue Policy Summary)
Queue is authoritative; modules do not attempt ordering.
Queue ordering is based on:
- Primary: server stamped purchase timestamp (high precision)
- Tie-breaker: higher tokenCost ranks ahead if timestamps collide
- Private requests may bump to position #2 (cannot interrupt current in-progress item), per queue rules

---

## Rate Limiting / Cooldowns (Module-Owned)
### Slot Machine
- The same user cannot spin again until 2 minutes after their last spin attempt (success or fail is defined by slot rules).
- Two different users can spin back-to-back with no extra throttling (queue ordering handles it).
- Module must enforce cooldown BEFORE creating escrow and queue item.

### Spin Wheel
- Module must define its own cooldown policy.
- If migrating legacy wheel, align to the same contract and avoid embedding queue logic.

---

## Messaging Contract
### Public Chat Stream
Public chat is used for event hype and transparency:
- On spin/purchase initiated: “Good luck <user>” or equivalent.
- On outcome: “WINNER! Thanks for playing <user> … won <prize> …”
- For menu purchases: “<user> just bought <action> for <tokens> …”
These must be template-driven to reduce hardcoded strings.

### Private Messaging
Private messaging is used for queue service communications:
- Immediate receipt message on purchase/spin (always).
- If more than 6 items ahead: “Sit back and enjoy … a few performances before you.”
- When item reaches position #3: “It won’t be long.”
- On refund: system or model message: “Couldn’t perform <action>, tokens refunded.”

Membership tiers may restrict replying, but the message should still be delivered.

---

## Config Contract (Performer-Scoped)
All performer-scoped interactive features should follow the same pattern:
- Admin templates exist for onboarding defaults where needed.
- Models can override.
- Models can hide individual prize items without deleting them.
- All config changes are hot-reloadable and apply immediately for future events.
- Changes must NOT retroactively affect items already in queue.

### Slot Machine Config Requirements
- spinPrices: 1..3 tiers (model chooses 1/2/3)
- each tier has a token cost
- prizes: 4..10 items required
- each prize has:
  - title, description
  - rank 1..10 (1 lowest, 10 highest)
  - enabled/hidden toggle
- outcome rules:
  - every spin wins
  - weighted randomness favors higher ranked prizes for higher tier spin cost
  - all prizes remain eligible at all tiers, but weights differ
- styling:
  - model chooses hex color(s) for skin theme
- UI:
  - press-and-hold or press-release behavior is UI-defined, but backend must not depend on client timing for fairness

### Chip Menu & Queue Config Requirements (Reference Summary)
- Live-only menus visible only when performer is broadcasting.
- Menu item ordering: drag and drop, plus optional auto-sort controls.
- Discount multiplier: 0%..150% integer per menu (model-controlled) applies to display + purchase price going forward only.

---

## Security & Performance Standards (Noise Reduction)
### Mandatory
- Use strict payload validation (DTOs / payload classes).
- Centralize shared types in one place:
  - Queue intake payload type
  - source enums
  - refund reason enums
- Emit domain events instead of deep coupling:
  - slot_machine emits “QueueItemRequested”
  - queue consumes and becomes single owner of lifecycle
- Keep database writes atomic for:
  - escrow creation
  - queue item creation
  - idempotency protection

### Prohibited
- Duplicated queue settlement logic in feature modules.
- Multiple wallet update paths (must go through wallet/escrow service).
- Hardcoding chat strings across modules (use templates).
- Storing PII in logs.

### Recommended
- Minimal surface area integration:
  - Feature module calls: escrowService.hold() then queueService.enqueue()
  - No extra queue state checks in feature module
- Use named constants for source values:
  - "slot_machine" not free-typed strings
- Prefer events + listeners for audit logging to keep core flows clean.

---

## Acceptance Criteria
A feature complies with this contract only if:
1) It can determine an outcome and enqueue a Queue Item without embedding queue ordering or settlement rules.
2) It holds funds in escrow immediately and never credits model earned directly.
3) It supplies required Queue Intake payload fields including idempotencyKey and source.
4) It enforces its own cooldown rules (if any) prior to escrow+enqueue.
5) It emits public and private messages using templates (not scattered literals).
6) It produces an auditable record:
   - sourceEventId, performerId, userId, tokenCost, action details, timestamps
7) It keeps logs free of PII and remains idempotent-safe under retries.

---

## Implementation Notes (Practical Guidance)
- Slot machine, wheel, and chip menu should all share the same “enqueue contract”.
- The queue service should expose a single method, e.g.:
  - queueService.enqueueFromInteractiveFeature(payload)
- The wallet/escrow service should expose:
  - escrowService.hold(userId, amount, reason, idempotencyKey, metadata)
- Queue settlement should expose:
  - queueService.finish(queueItemId)
  - queueService.refund(queueItemId, refundAmount, reason)

All new features must reference this file in their module README and top-level comments.
