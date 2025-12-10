# ORGANIZATION_APP_POLICY.md

Purpose
- Define approved open-source GitHub Marketplace apps and GitHub-native features for OmniQuestMedia during the development phase.
- Capture additional controls and hardened requirements for sensitive repos handling customer data.
- Provide a safe, efficient rollout plan and an installation checklist to reduce risk and CI noise.

Scope & principles
- Customer data security is the top priority. Repos flagged as sensitive (currently: RedRoomRewards, XXXChatNow) must follow stricter controls.
- Only free, open-source apps and GitHub-native features are approved for initial development use. Paid SaaS may be introduced after security review and approval.
- Principle of least privilege: grant the minimum scopes needed. Prefer GitHub Apps (installation tokens) over OAuth apps.
- Pilot-first: test all apps in 1–2 low-risk repos before org-level installation.
- No secrets or PII should be posted to third-party services. Use scrubbing and restricted logs.
- No backdoors: never grant hidden or emergency access tokens. All access must be auditable.

High-level priorities (org policy)
1. Customer Data Security (Top priority)
   - Repos: RedRoomRewards, XXXChatNow (flagged as sensitive).
   - Sensitive repos require a stricter app approval and CI policy (see Sensitive-Repo Checklist below).
2. Code Quality & Reliability
   - Enforce CodeQL, Semgrep, and unit/integration tests. Gate merges on required status checks.
3. Efficiency & Minimalism
   - CI should be minimal and efficient. Prefer incremental and targeted steps; reduce duplication across workflows while preserving required security gates.

Approved OSS apps & tools (development phase)
- Renovate (renovatebot/renovate) — dependency updates.
- Probot apps: stale, welcome, labeler — issue/PR hygiene (non-sensitive repos).
- Semgrep (OSS) — SAST via GitHub Action.
- Gitleaks (zricethezav/gitleaks) — secret scanning in CI/pre-commit.
- Trivy (aquasecurity/trivy-action) — container image scanning.
- Danger (danger/danger-js) — automated PR checks.
- Reviewdog (reviewdog/action-reviewdog) — comment linter/analysis results.
- CodeQL (GitHub-native) — code scanning (required for sensitive repos where available).
- Dependabot (built-in) — dependency updates for simpler repos.
- Official, well-maintained GitHub Actions (pin to SHAs for critical repos).

Sensitive-Repo Checklist (strict rules for RedRoomRewards & XXXChatNow)
- App & Installation Controls
  - No app may be granted read/write access to a sensitive repo without a documented approval (Security + Repo Owner).
  - All apps requiring access must be GitHub Apps (not user OAuth apps) and listed in an "approved apps" log with scope and install date.
  - Deny org-wide auto-installation until review is complete for each app.
- CI / Scanning Strategy (fast + safe)
  - PRs: run lightweight, targeted checks:
    - Linting, unit tests for changed modules, Semgrep selected ruleset (low-noise), Gitleaks quick scan.
    - Use change-detection (run tests only for touched modules) and test sharding where possible.
  - Merge-to-main (or protected release branch): run full pipeline:
    - Full test suite, CodeQL, Semgrep full ruleset, Trivy on built images, dependency license checks, and any heavy SCA.
  - Pin Actions to specific commit SHAs for any third-party Actions used in these repos.
  - Cache dependencies and use incremental builds to reduce runtime.
  - For long-running scans, schedule during merge or nightly rather than every PR to conserve CI budget while preserving security.
- Access, Secrets & Runtime Controls
  - Secrets must be stored in GitHub Secrets or a dedicated secrets manager; no secrets in repo code or logs.
  - Enforce environment isolation and minimal runtime role permissions (IAM least privilege).
  - Use short-lived deploy credentials and rotate regularly.
  - Encrypt data at rest and in transit. Document where customer data is stored and how it flows.
  - Enforce strict data retention, anonymization, and PII scrubbing in logs and error reports.
- Code Review & Change Controls
  - Require at least two reviewers for PRs that touch data-handling, auth, or persistence code.
  - Require signed commits or verified commit authors where possible.
  - Maintain an audit trail of migrations or schema changes affecting customer data.
- Monitoring & Incident Controls
  - Enable runtime monitoring and alerting (open-source options acceptable in dev; vet before granting access to sensitive repos).
  - Define incident response runbook and notify Security on any suspected data leak.
- Vetting & Periodic Audit
  - Quarterly audit of installed apps and access logs for sensitive repos.
  - Any new app requesting sensitive repo access must pass a security checklist (scope review, OSS maintainer health, code review of the integration step if necessary).

CI Efficiency Guidelines (keeping pipelines minimal and effective)
- Use change-based test selection: only run tests relevant to changed files where feasible.
- Use build/test caching and workspace caching; avoid repeating identical steps.
- Split work into lightweight checks for PR feedback and heavier checks on merge.
- Use matrix pruning and conditional steps to avoid unnecessary permutations.
- Reuse artifacts between steps rather than re-building wherever safe.
- Prefer native GitHub Actions and pin to SHAs; self-hosted runners for heavy scans if budget permits.
- Track CI duration and flakiness; set SLOs for CI runtime (example: median PR feedback < 10 minutes for light checks).

Security & permissions checklist (before installing any app)
- Confirm required OAuth/GitHub App scopes and only grant the least privilege required.
- Prefer GitHub Apps over OAuth apps (installation tokens are scoped & rotate).
- Pin Actions and CI tools to SHAs for sensitive repos.
- Do not allow apps to exfiltrate logs or artifacts externally without approval.
- Use short-lived credentials for registry scanning or publishing.
- Audit app installations quarterly and remove unused apps.

Change log
## 2025-12-10
- Organization will prefer free, open-source Marketplace apps during development.
- RedRoomRewards and XXXChatNow are flagged as sensitive repos with stricter app, CI, and runtime controls.
- CI strategy updated: lightweight PR checks + full merge checks to balance speed and security.
- No backdoors, no secret exfiltration; all installs must follow least-privilege and be auditable.
