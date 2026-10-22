# Msafiri — Stage 8.5 Report (provisional scope: synthetic-data labelling and repeatable scan)
Prototype only. Synthetic data; every government, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. Not production-ready; no certification claimed. **Stage 8.6 was not started.**

## 0. Status at a glance
| | |
|---|---|
| **Completed technical work (verified by tests below)** | Synthetic-label sweep and repeatable scan (30 checks); phone label strip; **top-bar title clipping fix at 320/360 px with 23 regression checks** (follow-up, §7) |
| **Unconfirmed scope** | What "Stage 8.5" was meant to cover. **No stage plan or scope document exists in the repository** (re-searched in the follow-up: the only "8.5" mentions are "not started" notes and this report). The scope below is my assumption, not a requirement. |
| **Unconfirmed requirements** | Everything URS-dependent (T1–T17) is unchanged and still BLOCKED — SOURCE REQUIRED. No requirement, authorization or data rule was added or changed. |

## 1. Scope determination (documented fact vs assumption)
- **Documented fact:** no file in the repository defines Stage 8.5 (no stage plan, scope or acceptance criteria). Every 8.x document only says "Stage 8.5 not started". The approved URS v2.0 is unavailable; the provisional URS docx is not in the package.
- **Assumption (mine, unconfirmed):** 8.5 = the Stage 8.4 items that need **no requirement document**, because they rest only on the project rules given in the stage prompts (synthetic data only, label simulations, no real integrations, no secrets): **T20** (labelling was checked on the 3 dashboards only) and **T21** (secret scan was an ad-hoc grep). If your 8.5 brief meant something else, it has not been seen.
- Not attempted, because they need decisions or sources: T1–T17 (field set, duplicate guest, DOB rule, authentication, isolation, audit protection, retention, report formats); the 8.4 "formal approval limitations" stay as recorded in `STAGE8_4_CLOSURE_REPORT.md` (Stage 8.4 remains **NOT READY FOR APPROVAL**).

## 2. Work completed
1. **New test `tests/stage8_5_labelling_and_scan.py` (30 checks)**
   - *Self-test (7):* each detector (URL host, email, phone, 8 secret patterns, network API, SVG-namespace exemption) fires on planted bad samples and stays quiet on good ones.
   - *Static scan (7)* of all 28 shipped js/css/html files: no URL outside reserved/example hosts, no email outside reserved domains, no phone outside the fictional `+255 000` convention, no secret-like pattern (the labelled `SYNTHETIC-SANDBOX-TOKEN` is the only allowed value), no network API in executable code, no external script/style/image/frame, CSP present without `unsafe-eval`.
   - *Rendered sweep (16):* 202 routes (38 nav + user/role/establishment/report/integration/event/webhook detail and form pages) at 1366 px and 390 px: label visible above the fold, footer "Synthetic data only / Not a production system" visible, page title present, no real-looking URL/email/phone in the rendered text, no console error, no non-file network request.
2. **Defect found and fixed (labelling):** at ≤560 px the top-bar "Prototype · synthetic data" ribbon is hidden by design, so phone users saw the label only in the footer at the bottom of each page (the test failed on all 202 routes before the fix). Added a slim phone-only strip under the top bar: `index.html` (one `div.demo-strip`), `css/layout.css` (hidden above 560 px).
3. **Test-side issues fixed during development (not app defects):** SVG `xmlns` identifiers in an inline icon and a string-concatenated example host (`'https://sandbox.' + …`, composed string checked in the rendered sweep) were false positives; one planted JWT sample was too short.

## 3. Files changed
New: `tests/stage8_5_labelling_and_scan.py`, `STAGE8_5_REPORT.md`. Edited: `index.html`, `css/layout.css`, `README.md` (Stage 8.5 section). No JS, data, permission, workflow or Stage 8.4 behaviour changed.

## 4. Test results (Chromium via Playwright, `file://`, synthetic data; run on final code, parallel)
| Check | Result |
|---|---|
| `stage8_5_labelling_and_scan.py` | 30 passed, 0 failed (before the fix: phone label check failed) |
| audit_smoke / security_audit / ui_polish | 24 / 31 / 20 passed, 0 failed |
| functional_8_2 / workflow_8_2 / shell_8_2 | 27 passed / 0 failed / PROBLEMS 0 |
| journey_4 / journey_5 / journeys_1_3 | 28 / 48 / 32 passed, 0 failed |
| stage8_4_provisional_probe | 69 PASS, PROBLEMS 0 |
| `node --check` on all JS files | clean |
Not run: lint/build (none exists), other browsers/devices, screen readers. **Limits:** pattern scans cannot prove there is no real personal data, and this is not a security audit or URS conformance.

## 5. Unresolved decisions / blockers
- Confirm what Stage 8.5 was meant to cover (no plan exists in the repo).
- Approved URS v2.0 (T1–T17 stay BLOCKED — SOURCE REQUIRED).
- Product decisions still open: duplicate-guest rule, DOB plausibility, unsaved-form handling, six "Soon" placeholder pages, unknown-route redirect (`#/nope` → hotel dashboard vs "Page not found"), unknown `#/hotel/registrations/<id>` silently showing the list.
- ~~Five page titles clip at 320 px~~ — fixed in the follow-up (§7); the true count was larger than recorded.

## 6. Next step
Confirm or replace the 8.5 scope above (the repo has no plan to check it against); supply the URS (or signed extract) so T1–T17 can be traced. Stage 8.6 was not started.

## 7. Follow-up: top-bar title clipping at narrow widths (technical work, completed)
**Correction to earlier records.** Stage 8.1/8.2 said "five page titles clip at 320 px, 360 px and up are clean". That was measured on the 38 navigation routes only. Measured on all 202 routes (nav + detail/form pages): **12 routes clipped at 320 px** (`#/hotel/pms`, `#/admin/roles/hotel-viewer`, `#/admin/roles/gov-officer`, `#/admin/pms-health/INT-1002…INT-1010`) and **3 at 360 px** (`#/admin/pms-health/INT-1006/1007/1008`). Cause: at ≤430 px only ~127 px is left for the title beside the menu, bell and user buttons, and the title was clamped to two lines in a fixed 64 px bar; the longest title (INT-1008) needs four lines at 320 px.
**Fix (CSS only, `css/layout.css`, inside the existing `@media (max-width: 430px)` block):** the top bar uses `min-height` instead of a fixed height and the title is no longer line-clamped, so the bar grows only when a title needs it. Wider than 430 px nothing changed; titles that fit keep the 64 px bar. Side effect to know about: the fixed-position bell/user dropdowns on phones are anchored at 68 px, so with a tall (3–4 line) title bar they overlap the lowest bar line slightly; they remain usable.
**Regression tests (new, in `tests/stage8_5_labelling_and_scan.py`, now 53 checks):** on all 202 routes at 320/360/390/430/768/1366 px — title not clipped, title inside the bar, no horizontal overflow (≤430 px), bar stays 64 px for titles that fit (≥390 px); plus named checks for the 12 routes at 320 px, the 3 at 360 px and the 4-line INT-1008 case. **Negative control:** against a copy with the fix removed, 5 of these checks fail (320 px, 360 px, longest title, the 12-route and 3-route checks); on the fixed code all pass.
**Results on the final code:** stage8_5 53/53; audit_smoke 24/24; security_audit 31/31; ui_polish 20/20; functional_8_2 27/27; workflow_8_2 0 failed (23 PASS lines); shell_8_2 PROBLEMS 0; journey_4 28/28; journey_5 48/48; journeys_1_3 32/32; stage8_4_provisional_probe 69 PASS, PROBLEMS 0; `node --check` clean. Not run: lint/build (none exist), other browsers/devices, screen readers, widths below 320 px, a visual review of the taller bar (measured, not eyeballed).
**Files changed in the follow-up:** `css/layout.css`, `tests/stage8_5_labelling_and_scan.py`, `STAGE8_5_REPORT.md`, `README.md`.
