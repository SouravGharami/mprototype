# Msafiri — Stage 8.6 Report (DRAFT scope, unconfirmed): residual-item verification and documentation consistency
Prototype only. Synthetic data; every government, National Police, VeriDoc, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. Not production-ready; no certification or compliance claimed. **Stage 8.7 was not started.**

## 0. Status at a glance
| | |
|---|---|
| **Completed technical work (tested)** | Stage 7.1 items **L3, L5, L7** reproduced as open and fixed; **L6** re-measured as already fixed and now guarded by a regression test |
| **Unconfirmed scope** | Stage 8.6 is **not defined anywhere in the repo**. The scope used is the *draft proposal* from the preceding planning response, which you then instructed me to implement. It is not an approved requirement. |
| **Unconfirmed requirements** | No URS (approved or provisional) is in the repo. L1, L4, L8 and T1–T17 were **not touched** and remain blocked. No authorization, data, validation or integration rule changed. |

## 1. Acceptance criteria used (from the draft proposal, nothing added)
1. Re-verify L3, L5, L6, L7 on the current code with a test; classify each open / already fixed / by design.
2. Fix only items the test shows still open, minimally, in the existing architecture; correct README text that contradicts behaviour.
3. Leave L1, L4, L8 and T1–T17 unchanged and listed as blocked.
4. Run all suites; report results; update README and report; rebuild the ZIP.

## 2. Findings and changes
| Item | Finding on current code | Change |
|---|---|---|
| **L3** quick-nav search | **Open:** "webhook" returned nothing (search matched label/group/portal only) | `js/app.js` `runSearch`: also matches the page description; label/group/portal hits are listed first; 8-result cap and empty message unchanged |
| **L5** Government bell vs Reporting Alerts page | **Open (inconsistent wording):** page "Mark all as read" cleared only the page's alerts (bell 16 → 2; the 2 remaining are static non-alert bell items). No divergence in data, but the label implied more | `js/notifications.js`: button now reads **"Mark all alerts as read"** with a title explaining that other bell items are cleared from the bell. Behaviour unchanged (deliberately: marking items the page does not list would be a new rule) |
| **L6** overflow at 390 px | **Already fixed** (`#/hotel/profile` 390/390, `#/admin/roles` 390/390; all 199 measured routes clean at 390 and 320 px) | none; regression guard added |
| **L7** localStorage vs README | **Open (documentation):** README said "tab memory only", but the sidebar-collapse flag is kept in `localStorage` (`msafiri.collapsed`) | `README.md` (2 places) now states the one exception; Reset restores it to expanded. Code unchanged |

## 3. Files changed
`js/app.js` (L3), `js/notifications.js` (L5 label/title), `README.md`, `STAGE8_6_REPORT.md` (new), `tests/stage8_6_residual_verification.py` (new, 23 checks). No CSS, data, permission, workflow or integration change.

## 4. Tests (Chromium via Playwright, `file://`, synthetic data; final code)
| Suite | Result |
|---|---|
| stage8_6_residual_verification (new) | 23 passed, 0 failed |
| stage8_5_labelling_and_scan | 53/53 |
| audit_smoke / security_audit / ui_polish | 24 / 31 / 20 passed, 0 failed |
| functional_8_2 / workflow_8_2 / shell_8_2 | 27 passed / 0 failed / PROBLEMS 0 |
| journey_4 / journey_5 / journeys_1_3 | 28 / 48 / 32 passed, 0 failed |
| stage8_4_provisional_probe | 69 PASS, PROBLEMS 0 |
| `node --check` all JS | clean |
**Negative control:** the new test run against the delivered Stage 8.5 code: 18 pass, **5 fail** (L3 webhook, both L5 label checks, both L7 README checks); L6 passes there, confirming it was already fixed. Not run: lint/build (none exist), other browsers, screen readers.

## 5. Remaining blockers / unresolved
- Stage 8.6 scope itself is unconfirmed; approved URS v2.0 unavailable (T1–T17 BLOCKED — SOURCE REQUIRED; Stage 8.4 still not approvable).
- Product decisions open: L1 duplicate-guest rule, L4 unknown-id fallbacks, L8 "Test connection" on disabled integrations (verified earlier as returning a Warning), DOB plausibility, unsaved-form handling, six "Soon" placeholder pages.
- L5 design choice to confirm: should the page's mark-all also clear the static bell items? (Not done; would be a new rule.)

## 6. Next step
Confirm or replace the 8.6 scope and supply the URS (or signed extract). Stage 8.7 not started.
