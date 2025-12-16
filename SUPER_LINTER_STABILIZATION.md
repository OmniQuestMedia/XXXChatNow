# SUPER-LINTER STABILIZATION WORK ORDER  
**Repository:** `OmniQuestMedia/XXXChatNow`  
**Phase 2 – Winter 2025-2026**  
**Owner:** OmniQuestMediaInc  
**Date Issued:** 2025-12-16  

---

## Purpose

Resolve recurring Super-Linter CI failures by enforcing a single, canonical linter configuration and eliminating historical duplication.

---

## Mandated Approach

1. Inventory all lint configuration files.
2. Designate one canonical config for each linter type (preferably at the project root and referenced solely by Super-Linter).
3. Delete all duplicate/legacy/overlapping configs and workflows.
4. Remove and reinstall Super-Linter, referencing only the canonical config.

---

## Canonical Setup & Policy

- `.github/workflows/lint.yml` is the **only** allowed Super-Linter workflow.
- Only **one** markdownlint config file, stored at the repo root (`/.markdownlint.yml` or `/.markdownlint.json`).
- **No** per-folder or per-language overrides unless formally justified and documented.
- Any other linter configs (JS, Python, etc.) must be unique and placed according to Super-Linter’s precedence, preferably at the root.

---

## Acceptance Criteria

- ✅ Super-Linter passes on `main` branch.
- ✅ No duplicate or overridden lint configs remain.
- ✅ CI is green before and after linter re-installation.
- 🚫 No per-directory or override config files.

---

## Audit Log

- 2025-12-16: Work order and policy issued.
- 2025-12-XX: [To be updated during stabilization.]

---

_This file is reference for future Super-Linter issues or audits._
