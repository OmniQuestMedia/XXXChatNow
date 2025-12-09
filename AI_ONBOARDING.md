# AI Assistant Onboarding & Integration Guide

Created: 2025-12-09  
Purpose: Define how the AI assistant (Copilot-style) should be treated as a team member: roles, permissions, workflows, guardrails, and measurable pilot plan.

## Summary
This document describes how to integrate an AI assistant into development workflows while preserving security, auditability, and human authority. The assistant provides suggestions, drafts, automation, and triage help — humans retain final decision-making, especially for security- or financial-impacting changes.

## Roles & Responsibilities
- AI assistant: draft docs, suggest diffs, help with triage, generate tests and examples, and automate repetitive edits.
- Humans: review, approve, and merge any code or policy changes; perform security and financial reviews; retain final sign-off.
- Owners: designate repository maintainers, reviewers, and CI gates for PRs created by the assistant.

## Permissions & Access Model
- Principle of least privilege: the assistant (bot/service account) receives only the permissions required: create branches, push to branches, open PRs. No direct write to protected branches unless explicitly permitted.
- All automated changes must be auditable: commits must include a traceable author, commit message that references the task/issue, and a PR with human reviewers.
- No secrets or credentials should be stored in the assistant's configuration. The assistant must never be granted access to production secrets, signing keys, or tokens except via short-lived, auditable workflows.

## Security & Safety Guarantees
- No backdoors, master passwords, magic strings, or undocumented overrides.
- Sensitive operations (auth, financial, ledger, payment) require explicit human approval and cannot be fully automated.
- All balance- or money-like changes must be backed by immutable transactions and tests, and changes must be reviewed by at least one human with domain authority.
- Avoid granting the assistant permission to merge its own PRs. Prefer at least one human reviewer for merging.

## Workflow Patterns
- Branching: assistant creates descriptive branches (e.g., ai-onboarding/ or ai/-).
- Commit messages: must include task/ticket reference, summary, and link to PR.
- PRs: include automated checks (CI, linters, security scanners), and require at least one human reviewer for merge.
- Emergency changes: documented runbook requiring human sign-off and postmortem.

## Auditability & Tracing
- Every commit from the assistant is retained, signed (where available), and includes a clear audit trail.
- PRs created by the assistant link back to the originating prompt/ticket and include a human-readable summary of actions taken.
- Maintain a simple CHANGELOG or DECISIONS.md for significant AI-driven decisions.

## Pilot Plan & Metrics
- Pilot scope: documentation and onboarding content first, then low-risk automation (tests, formatting).
- Metrics: PR acceptance rate, review latency, reverted changes, security findings, types of suggestions accepted.
- Duration and checkpoints: evaluate after N merges or 30 days and iterate on guardrails.

## Example Commit Policy
- Commit message template: "ai: add AI onboarding doc — relates to ISSUE-123 — authored-by: ai-assistant"
- PR template: include checklist for security, data handling, and reviewer signoff.

## Communication & Escalation
- The assistant should always surface uncertainty and propose multiple safe options when appropriate.
- Escalation path for suspected security or privacy issues: immediately notify repo owner and relevant on-call.

## Conclusions from this conversation (to be committed)
- The ai-onboarding branches have been created in both repositories and are ready to receive onboarding files.
- Recommended default behavior: open PRs to main and require at least one human reviewer and CI checks.
- Do not grant the assistant merge rights without explicit, auditable policy allowing it.

## 2025-12-09
- AI onboarding doc staged for ai-onboarding branch in both repos.
- AI changes require human review and sign-off.
- No backdoors permitted under any circumstances.
