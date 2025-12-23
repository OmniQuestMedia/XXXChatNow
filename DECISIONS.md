## 2025-12-23
- All financial and loyalty logic must transit through `/api`; UI and admin code must never contain business logic or local state for monetary or loyalty adjudication.
- Slot machine randomization uses only CSPRNG; all spins, outcomes, and rewards are computed server-side, never client-side.
- Absolutely no backdoors, magic credentials, or override flows are permitted under any pretense (production or otherwise).
- OpenAPI/Swagger documentation published from `/api` is the sole source of truth for frontend/backend contracts.
- Production deployments must enforce hardening requirements as laid out in SECURITY_AUDIT_POLICY_AND_CHECKLIST.md.
- All boundary, security, and audit rules supersede convenience or velocity; if there is a conflict, security and auditability win by default.
