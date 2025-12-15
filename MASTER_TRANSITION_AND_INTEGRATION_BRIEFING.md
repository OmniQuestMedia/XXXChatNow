# HANDOFF PACKAGE B

## OmniQuestMedia/XXXChatNow

**Master Transition & Integration Briefing (v1)**

**Status:** Authoritative  
**Audience:** Organizational Copilot, frontend/backend engineers, product  
**Role:** Customer platform, orchestration layer  
**Last Updated:** 2025-12-15

---

### 1. Purpose of This Repository

XXXChatNow is a live broadcast, tokenized interaction platform.

#### It owns:
- User experience
- Broadcasting
- Tokens
- Games
- Checkout
- UI orchestration

#### It does *not* own:
- Loyalty balances
- Financial ledger logic
- Cross-site settlement

---

### 2. Relationship to RedRoomRewards

XXXChatNow is a **client** of RedRoomRewards.

- Requests loyalty data
- Displays options to users
- Executes UI flows
- Defers all value decisions to RedRoomRewards

**This separation is intentional and must be preserved.**

---

### 3. Transactional Flow Expectations

**Checkout**
- _Before payment gateway:_
  - Call RedRoomRewards for redemption options
  - Apply selected discount
  - Proceed with reduced payment
- _After payment:_
  - Call RedRoomRewards to credit earned points

**Runtime Messaging**
- Show:
  - “Points earned”
  - “Redemption applied”
  - “You’re good to go”
- Keep confirmations short and non-blocking

---

### 4. Slot Machine Responsibilities

XXXChatNow owns:
- Randomness
- Presentation
- Animation
- Timing

XXXChatNow must:
- Treat RedRoomRewards as final authority for value
- Never store balances locally
- Never assume redemption success

---

### 5. UX Constraints (Critical)

- Never block live broadcast
- Avoid persistent overlays
- Respect device sizes
- Allow silent failures with graceful messaging

**Example:**  
If loyalty call lags, gameplay continues and value resolution happens asynchronously.

---

### 6. Security Alignment

XXXChatNow must:
- Respect no-backdoor policy
- Use idempotency keys
- Never trust client payloads
- Log all value-affecting calls

---

### 7. Current State (Truthful)

- Core platform is stable
- Slot machine spec exists
- Loyalty integration is planned and partially documented
- Further UI coordination with RedRoomRewards is expected

This is correct and healthy.

---

### 8. Guidance to Copilot (Binding)

Copilot must:
- Treat RedRoomRewards as authoritative
- Avoid duplicating loyalty logic
- Ask for confirmation when UX impacts value
- Favor clarity over cleverness

---

END — XXXChatNow Master Transition Briefing

---
