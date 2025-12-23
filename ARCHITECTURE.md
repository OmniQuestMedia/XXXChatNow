# XXXChatNow Platform Architecture

## Component Boundaries

- `/api`: Owns all business logic, transaction processing, and connections to external systems (e.g., loyalty, payment, audit).
    - Never exposes secret or financial logic to clients.
    - Only `/api` can adjudicate loyalty points, credits, or bonuses.
- `/user`: User-facing website (Next.js) for streaming, chat, and games.
    - Responsible only for UX/presentation; calls documented `/api` endpoints for all value transfers.
    - Must never cache, store, or compute financial/loyalty state locally.
- `/admin`: Administration interface (Next.js + AntD).
    - Enables backoffice management, but not direct editing of user balances or value states.
- `config-example/`: Contains only ENV/nginx/deployment samples—never secrets or business logic.
- **All code:** Enforced by SECURITY_AUDIT_POLICY_AND_CHECKLIST.md—no backdoors, no magic passwords, and strict audit trail requirements.

## Data & Integration Flows

- All financial/loyalty operations:
    - Initiated/recorded via `/api`.
    - `/api` delegates loyalty/ledger adjudication to RedRoomRewards as the single source of value and finality.
    - All transaction and audit logs are written and retained in immutable, queryable form.

## Security & Audit

- Deployment checklist, onboarding, and code review MUST always reference `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`.
- Violations (e.g., local computation of value, PII in logs, or any attempt to bypass) are critical defects and block release.

## Change Management

- Any architecture or boundary change MUST first be captured in `DECISIONS.md` with date and rationale.
- All README and docs must be updated in sync with technical changes or major decisions.

---

_Last reviewed: 2025-12-23_