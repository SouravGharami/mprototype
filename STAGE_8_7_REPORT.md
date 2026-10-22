# Msafiri — Stage 8.7 Report: Prototype Completeness & Workflow Hardening
Prototype only. Synthetic data; every government, National Police, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. **This stage does not establish production readiness, regulatory compliance or any formal approval.** Stage 8.8 was not started.

## 0. Scope basis (unconfirmed)
No Stage 8.7 specification, approved URS, or stage plan exists in the repo (README: URS v2.0 never supplied). Per the task's fallback rule, scope was limited to genuine defects found by probing the current code against rules the app **already applies in its own UI** (registration form rules, record-dialog lifecycle rules, Submission Centre showing Retry only for Rejected). No new business rule, role or permission was invented. The reconstructed baseline is *not* approved.

## 1. Acceptance criteria (set before editing)
1. A direct call to the store cannot create or change a record in ways the UI forbids (invalid check-in data; blank/overlong cancel reason; malformed amend date/room; retry of a non-rejected submission).
2. The form and the store share one validation routine; form behaviour (messages, preserved input) is unchanged.
3. Refused actions are audited (actor, type, target, detail, outcome, time) and do not claim success in the UI.
4. Already-correct areas are verified, not changed.
5. All earlier suites still pass; new tests fail on the 8.6 code.

## 2. Defects found by probe (8.6 code) and fixed
| # | Defect (reproduced) | Fix |
|---|---|---|
| D1 | `S.checkIn` accepted blank name, bad doc number, future/impossible DOB, departure before arrival, empty room, markup in room — it created the record | New `S.validateReg` (js/store.js), used by `S.checkIn` (refuses + audits "Action blocked") and by the form's `validate()` (js/pages/hotel.js). Pre-existing messages unchanged; added real-calendar-date checks and technical length bounds (names ≤80, room ≤20, no `< >`/control chars) |
| D2 | `S.retry` restarted an *Acknowledged* record (status went back to Pending) | Retry only for `Rejected`; returns true/false; otherwise refuse + audit. Submission Centre toast now shown only on success |
| D3 | `S.cancel` accepted a blank reason | Reason trimmed, 1–200 chars required; dialog enforces same limit and says not to enter personal data |
| D4 | `S.amend` accepted a non-date departure (`'garbage' > arrival` is true as strings), blank/markup room | Real-date check, room trimmed and bounded; dialog uses the same rule |
| D5 | "Clear form" gave no feedback | Info toast "Form cleared — nothing was saved or submitted" |

## 3. Verified, no change needed
Double-activating *Confirm check-in* creates exactly one record (dialog closes on first click); invalid form keeps valid input and shows per-field errors; backing out of the confirm dialog creates nothing; check-out/cancel/amend/re-check-in refused on checked-out records; permission backstop (`S.guard`) blocks every state-changing call for the read-only hotel role and audits it; audit and activity log contain no document number or date of birth; dashboard cards and status-chart totals agree with store records; no console errors; no network requests.

## 4. Files
Modified: `js/store.js`, `js/pages/hotel.js`, `README.md`. New: `tests/stage8_7_workflow_hardening.py` (49 checks), `STAGE_8_7_REPORT.md`. No CSS, data, permission, migration or dependency change. **No database exists** (browser-memory prototype); no migration.

## 5. Tests (Chromium via Playwright, `file://`, synthetic data, final code)
| Suite | Result |
|---|---|
| stage8_7_workflow_hardening (new) | 49 passed, 0 failed |
| stage8_7 on the **8.6 code** (negative control) | 22 passed, **27 failed** |
| stage8_6_residual_verification | 23 / 0 |
| audit_smoke / security_audit / ui_polish | 24 / 31 / 20 passed, 0 failed |
| functional_8_2 / workflow_8_2 / shell_8_2 | 27 / 23 / PROBLEMS 0 |
| journey_4 / journey_5 / journeys_1_3 | 28 / 48 / 32 passed, 0 failed |
| stage8_4_provisional_probe | 69 PASS, PROBLEMS 0 |
| stage8_4_closure_evidence | ran, exit 0 (evidence printer, no pass/fail counter) |
| stage8_5_labelling_and_scan | 53 / 53 |
| `node --check` all JS | clean |
Not run: lint, type-check, build (the project has none), other browsers, screen readers.

## 6. Known limits / unresolved decisions (unchanged, blocked on URS or decision)
Duplicate-guest rule (L1); unknown-id fallbacks (L4); "Test connection" on disabled integrations (L8); DOB plausibility beyond "not in the future"; the length bounds above are technical, not policy; unsaved-form handling; six "Soon" placeholder pages; T1–T17 remain BLOCKED — SOURCE REQUIRED. The audit trail is an in-memory list and is **not** tamper-proof. Role checks are frontend/store demonstration only, **not** production access control.
