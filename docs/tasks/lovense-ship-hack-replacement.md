# Issue: Lovense: Replace EXTENSION ship-hack (receiveTip mapping) with command-level vibration API

## Context
Current EXTENSION dispatch is TEMP ship-hack: maps canonical vibration → synthetic tip amount and calls CamExtension.receiveTip(mappedAmount, 'Lovense', cParameter).
Reason: broadcast.js exposes no command-level vibration API (only receiveTip/getToyStatus/...).

## Prerequisites
- Model page + room flow stable in staging (or prod behind flag)
- Tip/menu purchase flow works end-to-end (settlement → TipActivated)
- Lovense Cam Extension install + login verified
- At least one physical toy available for validation

## Acceptance Criteria
- Implement command-level vibration dispatch (LEVEL + PRESET; PATTERN decision explicit) without mapping to receiveTip.
- Keep canonical flow + routing + idempotency unchanged (TipActivated → lovense.activate).
- Ship-hack code path is unreachable (deleted), and EXTENSION dispatch uses exactly one verified command-level method.
- Remove ship-hack mapping code and TEMP comments.
- Remove or migrate temporary logging/events and delete (or supersede) docs/specs/lovense-ops-logging-ship-hack.md.
- Add/confirm a basic test/validation checklist for real toy dispatch in staging.

## References
- Canonical spec: docs/specs/lovense-canonical-payload-and-routing.md (Current Implementation Status section)
- TEMP ops spec: docs/specs/lovense-ops-logging-ship-hack.md
- SDK source: https://api.lovense-api.com/cam-extension/static/js-sdk/broadcast.js
