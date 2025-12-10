# SECURITY_AUDIT_AND_NO_BACKDOOR_POLICY.md

Purpose
- Define security audit practices and an explicit no-backdoor policy for OmniQuestMedia.
- Ensure that all code, deployments, and administrative access follow auditable, least-privilege, and transparent practices.

No Backdoors (Non-negotiable)
- Absolute prohibition on backdoors, master passwords, secret bypass tokens, undocumented emergency access, or any hidden overrides in code, infrastructure, or operational procedures.
- Any change that could be interpreted as providing special access must be accompanied by an authorized design document, an explicit approval from Security and CTO, and a public audit entry.
- Hardcoded credentials of any kind are forbidden in source code, configs, or assets.
- No single person may possess an unrecorded secret that grants elevated access to production systems.

Security Audit Practices
- All repos are subject to periodic security audits. Sensitive repos (RedRoomRewards, XXXChatNow) require quarterly audits and code reviews for data-accessing changes.
- Before granting apps access to sensitive repos, perform a lightweight security review: check maintainer activity, license, requested scopes, and whether the app is a GitHub App (preferred).
- Maintain an "approved apps" ledger (repository or org-level secret) listing installed apps, requested scopes, install date, and approval owner.
- Enforce regular credential rotation, and use short-lived tokens and role-based access.
- Use automated secret scanning on all PRs and commits (Gitleaks, GitHub Secret Scanning where available).
- Log and retain audit trails for privileged actions and administrative changes for at least 90 days or longer as required by regulation.

Approvals & Change Control
- Any policy or config change affecting data access requires a documented change request and approval from Security and the repo owner.
- Emergency changes must follow an "emergency procedure" that includes post-facto audits and owner notification; they do not bypass review and must be minimized.

Enforcement & Violations
- Violations of the no-backdoor policy or unsafe practices will trigger an incident review and may result in immediate revocation of access and mandatory remediation.
- Security incidents must be reported per the incident response runbook and the Security team will coordinate investigations.

Change log
## 2025-12-10
- No backdoors policy added; mandatory audits for sensitive repos and an approved apps ledger required.
- Emergency access requires approvals and post-facto audits.
