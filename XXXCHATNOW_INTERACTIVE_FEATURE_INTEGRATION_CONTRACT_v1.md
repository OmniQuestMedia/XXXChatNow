# XXXChatNow Interactive Feature Integration Contract v1
Date: 2025-12-23
Status: Authoritative integration contract for all interactive monetized features (chip menu, slot machine, wheel replacements, future games).

## 0. Purpose
This contract prevents feature modules (games/menus/UI) from embedding queue ordering, settlement, refund rules, or wallet logic.
All monetized features must route through escrow + standardized queue intake. The queue is the sole authority for settlement and refunds.

## 1. Definitions
- **Feature Module:** Any module that produces a purchasable action or outcome (Chip Menu, Slot Machine, future games).
- **Queue (Authoritative):** Performance Queue subsystem that owns ordering, lifecycle state, settlement, refunds.
- **Escrow Wallet:** Holds user funds until completion of performance.
- **Earned Wallet:** Model earnings wallet (credited only by queue settlement).
- **Idempotency Key:** Required unique key for hold/intake/settle/refund to prevent duplicates.

## 2. Non-negotiable Rules
### 2.1 Feature Modules MUST
1. Validate eligibility (auth, availability, user balance, rate limit/cooldown).
2. Create an **escrow hold** for the purchase amount.
3. Emit a **standardized queue intake payload** that references:
   - performerId
   - userId
   - sourceFeature (e.g., "chip_menu", "slot_machine", "wheel", "future_game_x")
   - sourceEventId (spinId / purchaseId / transactionId)
   - escrowTransactionId
   - item definition (name, description, tokens, duration if known, metadata)
   - idempotencyKey
4. Emit chat notifications only through **template keys** (no scattered literals).

### 2.2 Feature Modules MUST NOT
1. Settle escrow → earned.
2. Refund escrow.
3. Manipulate queue ordering rules.
4. Implement queue lifecycle rules (start/finish/abandon, rope drop timing, disconnection handling).
5. Hardcode user-facing chat strings in feature logic.

## 3. Queue Responsibilities (Authoritative)
The queue alone owns:
- Accepting intake payloads and ordering them
- Lifecycle state transitions (created, started, finished, abandoned, refunded, rope-drop paused)
- Settlement: escrow → earned only on explicit completion rules
- Refunds: partial or full, based on queue state and model actions
- Idempotency enforcement for intake + settlement + refund operations
- Chat messaging triggers for queue lifecycle events via templates

## 4. Wallet/Escrow Responsibilities
Wallet service alone owns:
- escrow holds
- escrow release (settlement)
- escrow refunds
All wallet operations require idempotency keys and audit logging without PII.

## 5. Messaging Contract
All interactive features and queue events must use a centralized template/message key system.
Examples:
- slot.spin.started
- slot.spin.winner
- queue.item.created
- queue.item.third_position_notice
- queue.item.completed
- queue.item.refunded

No feature module may emit literal strings to public chat that imply settlement, refunds, or completion.

## 6. Legacy Feature Policy
Any legacy feature found to violate this contract must be either:
- Disabled behind a feature flag (default approach for launch), or
- Refactored to conform by routing escrow + intake through the contract and migrating literals to templates

## 7. Compliance Checklist (PR Gate)
A PR adding or modifying an interactive feature is compliant only if:
- Feature does escrow hold + queue intake only
- Queue is the only settlement/refund authority
- Idempotency keys exist for hold + intake + settle/refund
- Messaging uses templates
- No embedded ordering rules exist in the feature module

## 8. Appendix: Standardized Queue Intake Payload (Schema)
Minimum fields required:

- idempotencyKey: string
- sourceFeature: string
- sourceEventId: string
- performerId: string
- userId: string
- escrowTransactionId: string
- tokens: number
- title: string
- description: string
- durationSeconds: number | null
- metadata: object (non-PII)
