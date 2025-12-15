WORK ORDER: Super-Linter canonical reinstall + fix failures (XXXChatNow only)

Repo: OmniQuestMedia/XXXChatNow  
Base branch: main  
Working branch to create/use: copilot/fix-super-linter-canonical-2025-12-15

Goal: CI must pass. Fix Super-Linter failures. Do NOT disable the linter. Apply the smallest changes that make checks pass.

Scope constraints (non-negotiable):
  1. Only touch: .github/workflows/* and linter config files at repo root IF required by failures.
  2. Do NOT change application code, Chip Menu code, or token logic in this PR.
  3. There must be exactly one Super-Linter workflow file after this work: .github/workflows/lint.yml. Remove/merge any other linter workflows (if present) into that one file.

Step A — Confirm current state
  • Print the current branch and confirm you created/switched to copilot/fix-super-linter-canonical-2025-12-15.
  • List .github/workflows/ files and paste their names.
  • Fetch the most recent failed Super-Linter run logs and paste the first 50 lines of the failing section(s) (the actual error text).

Step B — Make canonical workflow
  • Ensure only .github/workflows/lint.yml exists for Super-Linter.
  • Keep lint coverage strict (no global relax).
  • Keep VALIDATE_ALL_CODEBASE: false.
  • Keep the existing excludes for node_modules/, dist/, build/.

Step C — Fix failures minimally
  • If the failure demands a missing config file, add it at repo root (or documented location) with minimal safe defaults.
  • If the failure is caused by invalid YAML / workflow syntax, fix only that.
  • If the failure is caused by missing default branch refs, ensure DEFAULT_BRANCH: main.

Step D — Verify
  • Push the branch and confirm the Actions run is green.

Commit message (must match): ci: fix Super-Linter failures (canonical lint.yml)

Deliverable: A single PR from copilot/fix-super-linter-canonical-2025-12-15 → main.

––––

Super-Linter minimal configuration template pack  
Refer to these only if the linter error explicitly requires the config.

A) .super-linter.yml (repo root)
# Minimal Super-Linter configuration (repo root)
# Only add if Super-Linter logs indicate it is required.
VALIDATE_ALL_CODEBASE: false
DEFAULT_BRANCH: main

# Keep filters conservative
FILTER_REGEX_EXCLUDE: |
  (^|/)(node_modules|dist|build|coverage)(/|$)
  (^|/)\.next(/|$)
  (^|/)\.turbo(/|$)
  (^|/)\.cache(/|$)

B) .markdownlint.yml (repo root) — only if markdown failures require it
default: true
MD013: false   # line length
MD033: false   # inline HTML
MD041: false   # first line heading

C) .yamllint.yml (repo root) — only if YAML lint requires it
extends: default
rules:
  line-length:
    max: 160
    level: warning
  truthy:
    allowed-values: ['true', 'false', 'on', 'off']

D) .editorconfig (repo root) — only if whitespace rules are killing the run
root = true

[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8

[*.{js,ts,tsx,json,yml,yaml,md}]
indent_style = space
indent_size = 2

Destination: These files go at the repo root (same level as README.md), not inside /docs, not inside /api.

––––

ChipMenuModule note:  
Add ChipMenuModule to app.module.ts as soon as the module exists, but do not mix this into the “fix Super-Linter” PR. Keep CI fixes isolated.
