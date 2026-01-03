Lovense EXTENSION Ship-Hack: Temporary Operations & Analytics Logging

This spec is temporary. Remove or migrate once a native command-level vibration API is available (e.g., Cam Kit / command-capable SDK).

Context (what shipped)

PR5PR7 wired canonical lovense.activate end-to-end with strict gating and idempotency.

PR7 introduced a temporary ship-hack for EXTENSION mode:

The Lovense broadcast.js SDK exposes no direct vibration/command API.

The only dispatch primitive available is CamExtension.receiveTip(amount, tipperName, cParameter).

Therefore, PR7 maps the canonical vibration spec to a bounded synthetic tip amount and calls receiveTip with operator label 'Lovense'.

Goals

Provide immediate observability during rollout without adding new infrastructure.

Quantify:

how often lovense.activate is emitted

whether emissions are actionable (feature flags + routing)

whether the frontend can dispatch via the ship-hack

Keep logs non-PII and temporary.

Non-PII rules

Do not log usernames, emails, IPs, device identifiers, or raw payment details.

Allowed identifiers:

tipId

sourceRef

roomId

booleans/counts

lovenseMode

synthetic amount (not a real payment amount)

Backend logging (NestJS)

Location

LovenseActivateBroadcasterService.emitLovenseActivate(...)

Emit log/metric on every emission

Fields:

event: lovense.activate.emit

tipId

sourceRef

roomId

targetsCount

hasModelToyTarget (boolean)

enableLovense (boolean)

lovenseMode (string; from envelope.model.lovenseMode)

Guidance

Prefer passing enableLovense into the broadcaster from the caller (listener) to avoid extra settings DB calls.

Logging must never block event emission.

Example JSON log line

{
  "event": "lovense.activate.emit",
  "tipId": "abc123",
  "sourceRef": "ledger/xyz",
  "roomId": "room_1",
  "targetsCount": 1,
  "hasModelToyTarget": true,
  "enableLovense": true,
  "lovenseMode": "EXTENSION"
}

Frontend logging (ship-hack)

Location

sendVibrationViaExtension(...) (PR7 ship-hack helper)

Failure logs (always)

Missing extension method

lovense.shiphack.no_receiveTip

Payload: { tipId, sourceRef }

Dispatch exception

lovense.shiphack.dispatch_failed

Payload: { tipId, sourceRef }

Example

console.warn('lovense.shiphack.no_receiveTip', { tipId, sourceRef });
console.error('lovense.shiphack.dispatch_failed', { tipId, sourceRef });

Success log (rate-limited)

lovense.shiphack.dispatch_ok

Payload: { tipId, sourceRef, amount }

Sampling: 1% random

Example

if (Math.random() < 0.01) {
  console.info('lovense.shiphack.dispatch_ok', { tipId, sourceRef, amount });
}

Operational use

What to look for

Backend lovense.activate.emit volume vs expected tip volume.

enableLovense=false occurrences (feature flag suppressions).

lovenseMode distribution (EXTENSION vs CAM_KIT).

Frontend failure rates:

no_receiveTip indicates SDK not loaded/initialized or extension not available.
dispatch_failed indicates runtime errors calling receiveTip.

Presence of sampled dispatch_ok confirms successful dispatch exists in real sessions.

Removal plan

When a command-level vibration API is implemented:

Remove the ship-hack mapping (receiveTip synthetic amount).

Remove or migrate these temporary log events.

Delete this spec file or replace it with the long-term observability spec.