# Msafiri — National Guest Registration & Government Reporting Platform
**Confidential client-demonstration prototype — final gap-closure build (22 Oct 2026).** Not production-ready. All data is synthetic and every government, police, PMS, scan/OCR, webhook, notification and export behaviour is **simulated**. No requirement is verified against an approved URS (never supplied) and no stakeholder approval is recorded. No compliance, security certification or real integration is claimed.

Start with `FINAL_GAP_CLOSURE_REPORT.md` (this round: checklist, changes, exact test results, blockers), then `FINAL_VERIFICATION_REPORT.md` and `MSAFIRI_APPROVAL_ACTION_CHECKLIST.md`.

## Launch (no install, no build, no dependencies)
```
unzip msafiri-prototype-final.zip && cd msafiri-prototype
python3 -m http.server 8080        # then open http://localhost:8080
```
Alternatively open `index.html` directly (works from `file://`). Switch Hotel / Government / System Administration in the left sidebar; **Reset demo data** is in the user menu. Data lives in browser-tab memory only (only the sidebar-collapse flag is kept in `localStorage`).

## Run the checks (optional; need Node, Python 3, `pip install playwright`, `playwright install chromium`)
```
./run_tests.sh        # node --check on all JS, then every suite in tests/, 3 at a time (~8-10 min)
```
Or one suite: `python3 tests/<suite>.py`. **Do not run all suites at once:** with ~15 Chromium instances in parallel the suites' 5-second page-load timeouts fire and cause false failures (observed; see the report). Each suite prints PASS/FAIL lines and a summary.

## What changed in the final gap-closure round
- `js/app.js`: the six placeholder pages (Hotel › Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports; Admin › Connector Status) still say "Planned module" but now link to the existing simulated screens that cover part of that area, instead of an unexplained wireframe. No placeholder was turned into a feature (that needs decisions P1–P6).
- `js/pages/dashboards.js`: Hotel dashboard donut subtitle corrected to say it counts records that have a simulated submission status (it previously claimed "All registrations", which disagreed with the total card).
- `css/components.css`: small list style for the placeholder links.
- New `tests/final_gap_closure.py` (42 checks) and `run_tests.sh`.
Everything else is unchanged. Earlier per-stage notes below are kept as project history; where they conflict with this section, this section and `FINAL_GAP_CLOSURE_REPORT.md` are current.

---
**Clickable HTML prototype · latest build = Stage 8.7 code (unchanged since) · documentation through Stage 8.9 and final verification.** Earlier per-stage notes below are kept as history.

Client-demonstration prototype. **Not a production system.** All data is synthetic. There is no backend, and no real government interface, PMS connector, document scanning or identity verification. Nothing here is evidence of security certification or compliance.

## Status — read first
**Prototype only. Not production-ready.** Synthetic data; every government, National Police, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. No backend, database, real authentication or server-side authorisation exists. The approved URS v2.0 has never been supplied; no requirement is verified against it and no stakeholder approval is recorded. Start with `FINAL_VERIFICATION_REPORT.md`, then `MSAFIRI_APPROVAL_ACTION_CHECKLIST.md`.

## Run locally
No build step, no dependencies.
1. Unzip.
2. Double-click `index.html`, **or** `cd msafiri-prototype && python3 -m http.server 8080` and open http://localhost:8080

Scripts are classic `<script>` tags, so it also works from `file://`.

**Optional regression tests** (not an app dependency; need Python 3, `pip install playwright`, and a Chromium install): from `msafiri-prototype/` run `python3 tests/<suite>.py` for each script in `tests/`, and `for f in js/*.js js/pages/*.js; do node --check "$f"; done`. Each suite prints PASS/FAIL lines and a summary (`shell_8_2`, `stage8_4_provisional_probe` print `PROBLEMS 0`; `stage8_4_closure_evidence` is an evidence printer). A full run takes roughly 10 minutes. Tests use `file://`, synthetic data and no network.

State is in browser-tab memory only, **with one exception**: the sidebar collapsed/expanded preference is saved in the browser's `localStorage` (key `msafiri.collapsed`; no demo or personal data). **Reset demo data** (user menu) restores everything, including that preference.

## Stage 8.9 traceability audit notes
See `STAGE_8_9_TRACEABILITY_MATRIX.md` (26 provisional requirements: 7 Implemented, 19 Partial), `STAGE_8_9_IMPLEMENTATION_GAP_REPORT.md` and `STAGE_8_9_REPORT.md`. Baseline is the **unapproved** `MSAFIRI-URS-PROVISIONAL-2.0`. **Documentation and one read-only test (`tests/stage8_9_traceability_probe.py`) only — no application code changed.** Key gap: hotel records have no per-establishment ownership (FR-006). Six placeholder pages remain.

## Final handover notes
See `MSAFIRI_HANDOVER_REPORT.md` (verified state, test results, gaps), `NEXT_SESSION_GUIDE.md` (gate and safe next steps) and `MSAFIRI_APPROVAL_ACTION_CHECKLIST.md` (blockers). **Documentation only — no application code, test or data changed.** The older heading above and the "Not yet built" section predate Stages 7–8. Implementation is blocked on the approved URS v2.0 and the open decisions.

## Stage 8.9 notes
See `STAGE_8_9_STAKEHOLDER_APPROVAL_PACKAGE.md`. **Documentation only — no application code, test, data or configuration changed.** It packages the 33 open items of `STAGE_8_8_DECISION_REGISTER.md` (IDs and wording preserved) with evidence required, impact if unresolved, and a **blank** response block (Approved / Rejected / Deferred / Needs Clarification, comments, date) for the authorised stakeholder, plus the exact evidence needed for the approved URS v2.0 or a signed extract and the six placeholder pages by their navigation names. **No stakeholder response has been recorded and nothing is approved.** The approved URS is still not in the project (blocker B1); no stage after this is defined. Still a non-production prototype with simulated integrations and no compliance claim.

## Stage 8.8 notes
See `STAGE_8_8_REQUIREMENTS_BASELINE_REPORT.md` and `STAGE_8_8_DECISION_REGISTER.md`. **Documentation only — no application code, test, data or configuration changed.** **Blocked:** the approved URS v2.0 and any approved stage plan are not in the project (searched; nothing found), so no requirement is verified and no stage scope is approved. The register lists 33 open items (T1–T17, six placeholder pages, baseline, other and Stage 8.7 assumptions); none is approved. Responsible stakeholders are not recorded in the repo. Still a non-production prototype: all integrations simulated, no compliance claim. Post-8.7 audit: `PROJECT_COMPLETION_AUDIT.md`. Run/tests unchanged (see Stage 8.7 notes). Stage 8.9 not started.

## Stage 8.7 notes
See `STAGE_8_7_REPORT.md`. **Unconfirmed scope:** no Stage 8.7 specification or URS exists in the repo; the work is bounded workflow hardening of defects reproduced on the 8.6 code. **Changed:** `js/store.js` (shared `S.validateReg`; `checkIn`, `retry`, `cancel`, `amend` now refuse invalid input/transitions and audit the refusal), `js/pages/hotel.js` (form uses the shared validation; truthful retry toast; cancel/amend limits; Clear-form feedback). New test `tests/stage8_7_workflow_hardening.py` (49 checks; 27 fail on the 8.6 code). No migration (no database), no dependency. Not production-ready; nothing is a real government submission. **Run:** open `index.html` (or `python3 -m http.server 8080`); tests: `python3 tests/<name>.py` (Playwright + Chromium). Stage 8.8 not started.

## Stage 8.6 notes
See `STAGE8_6_REPORT.md`. **Unconfirmed scope:** Stage 8.6 is not defined in the repo; the work follows a *draft* proposal (verify Stage 7.1 residual items L3/L5/L6/L7 and fix only those still open), not an approved requirement. No URS exists in the repo; L1, L4, L8 and T1–T17 untouched and still blocked. **Completed technical work (tested):** quick-navigation search now also matches page descriptions (`js/app.js`; "webhook" finds the Developer Portal); the Reporting Alerts button is relabelled "Mark all alerts as read" with an explanatory title (`js/notifications.js`; behaviour unchanged); README persistence wording corrected (sidebar-collapse flag in `localStorage`); overflow at 390/320 px re-measured as already fixed and guarded. New `tests/stage8_6_residual_verification.py` (23 checks; 5 fail on the Stage 8.5 code). All earlier suites re-run and pass. Stage 8.7 not started.

## Stage 8.5 notes
See `STAGE8_5_REPORT.md`. **Unconfirmed scope:** no stage plan or scope for Stage 8.5 exists in the repo; the work below is based on an *assumed* scope (the two Stage 8.4 items needing no requirement document). The approved URS v2.0 is still unavailable, T1–T17 remain BLOCKED — SOURCE REQUIRED, Stage 8.4 is still not approvable, and no authorization/data rule was changed. Stage 8.6 not started.
**Completed technical work (tested):** (1) `tests/stage8_5_labelling_and_scan.py` — detector self-tests, static scan of shipped files (no real-looking URL/email/phone, no secret-like pattern, no network API) and a 202-route rendered sweep for the synthetic-data label; (2) phone-only "Prototype · synthetic data" strip (`index.html`, `css/layout.css`); (3) top-bar title clipping fixed at narrow widths — a full-route measurement found **12 routes clipping at 320 px and 3 at 360 px** (the earlier "five at 320 px" count covered navigation routes only); CSS-only fix in `css/layout.css` (≤430 px: bar grows with the title). The same test file now has 53 checks, including title-layout regressions on all 202 routes at six widths; negative control fails 5 of them without the fix. All earlier suites re-run and pass (see report §7).

## Stage 8.4 notes
**Stage 8.4 addendum:** see `STAGE8_4_PROVISIONAL_TRACEABILITY_ADDENDUM.md`. The *approved* URS v2.0 is **still not available**; a supplied **provisional, reconstructed, unapproved** baseline (`MSAFIRI-URS-PROVISIONAL-2.0`) was used for a provisional audit only. One small fix: `js/store.js` (`checkOut` / `cancel` / `amend` now enforce the lifecycle and amend rules the record dialog already applied, and return true/false) and `js/pages/hotel.js` (success toasts only on success). New test: `tests/stage8_4_provisional_probe.py` (69 checks). Final-verification round also: `S.checkIn` refuses to re-check-in a non-Expected/Draft record, and the record dialog hides *Start check-in* from users without `registration:create` (see addendum §6). Still simulated: all government/PMS/scan/webhook/export behaviour. Stage 8.5 not started.

See `STAGE8_4_REQUIREMENTS_READINESS_REPORT.md` (that report was documentation only when written; code and a test were changed later in Stage 8.4 — see the addendum and `STAGE8_4_CLOSURE_REPORT.md`). **URS v2.0 was searched for and not found, so no requirement could be traced or verified**; the report gives a capability matrix (`CAP-nn` labels, not URS IDs; every conformance status "Not Verified"), gaps, a readiness summary and next steps. The prototype is **not** production-ready, makes no real integration, and no security certification is claimed.

## Stage 8.3 notes
See `STAGE8_3_COMPLETION_REPORT.md`. Adds `tests/journey_4_auth_permissions.py` (28 checks), `tests/journey_5_integration_transparency.py` (48 checks, proves no network API is called) and `tests/journeys_1_3.py` (32 checks; **new** journeys — the originals were not supplied). One app change: a simulation notice on the Registrations page (`js/pages/hotel.js`). Final regression: the six existing suites and all journeys pass; ESLint 0 errors / 16 pre-existing unused-variable warnings; no build step exists. Run any test with `python3 tests/<name>.py` (Playwright + Chromium). Note: the app's CSP forbids `unsafe-eval`, so tests must not use Playwright `wait_for_function`; poll with `evaluate`.
**Simulated in this prototype:** government interface/acknowledgements, PMS connectors, scan/OCR, integration test/health actions, webhooks, API sandbox, notifications, CSV export. **URS v2.0 was not supplied and has not been read or verified against.**

## Stage 8.2 notes
See `STAGE8_2_FUNCTIONAL_AUDIT_REPORT.md`; regression checks in `tests/functional_8_2.py`, `tests/workflow_8_2.py`, `tests/shell_8_2.py`.

## Stage 7.4–8.1 notes
See `STAGE7_4_SECURITY_AUDIT_REPORT.md` and `STAGE8_1_UI_POLISH_REPORT.md` (includes the second pass that completes Stage 8.1); optional tests: `tests/audit_smoke.py`, `tests/security_audit.py`, `tests/ui_polish.py`.

## Important: URS status
**`Msafiri_National_Guest_Registration_URS_v2.0-1.docx` has not been supplied to the build, so it has not been read.** No URS requirement IDs are cited, and none are invented. Module names follow the project brief, not the URS. Every item below marked "to reconcile" must be checked against the URS before client use.

## Stage 6.4 — Reporting & notifications integration and QA (v1.8)
QA and fixes only; no new feature, no Stage 7 work. **Changed:** `js/reporting.js`, `js/notifications.js`, `js/ops.js`, `js/app.js`, `js/nav.js`, `css/layout.css`, README.
**Bugs fixed**
1. *Drifting report timestamps:* sample report “Last updated” was recomputed from the current time on every render, so it moved and could disagree with the alert about it. Sample timestamps are now fixed for the session (live Demo Hotel A row stays live); alerts use the report’s own timestamp (alert time = report time by construction). Integration/webhook alerts likewise use the record’s own timestamp instead of a first-seen stamp.
2. *Contradictory alert:* seeded N-002 (“Simulated PMS connector errors”, INT-1002) stayed open after INT-1002 recovered; it now resolves with the integration.
3. *Government bell ignored the new alerts:* the Government bell now lists the reporting alerts from the same store (respecting the existing bell preferences); bell open / mark-all update the store and the open Reporting Alerts page.
4. *Bell out of step with the store:* page-level read/unread changes did not refresh the top-bar bell, and a bell click could make “mark as unread” on a page invisible to the bell. Store-backed items now use the store as the single source of truth and the bell refreshes on every change.
5. *Mobile:* the top-bar notification/user menus were clipped off the left edge on phones; pinned inside the viewport.
6. *Stale wording:* the dashboard banner/footer and nav description still said downloads were not part of the build; they now describe the permission-gated simulated CSV export.
**Verified (no change needed):** dashboard cards vs report rows (unfiltered, property, status, date-overlap, empty and invalid range); every one of the 72 detail pages vs its record; every CSV parsed with an RFC 4180 parser (row/column counts, values, escaping, formula neutralisation, hostile values); zero-property empty data; alert ⇄ report/integration/webhook agreement; links open the right record; no horizontal page overflow on any route at 1366/768/390 px; no unregistered button actions; no external requests.
**Alerts are derived on demand** from current state when a page or bell renders — there is no background job or automatic delivery. A simulated webhook failure or integration change appears the next time the UI renders.
**Limitations:** the fixed “export failed (simulated sample)” alert has no matching entry on the report page (it is labelled as a sample); alerts have no history/dismiss/archive/per-user state; no scheduling, escalation or channel preferences; report categories, validation rules and thresholds remain undefined because the URS was not supplied; Export is disabled for all seeded roles (Stage 6.2 decision). Hotel bell remains the static Stage 1–3 list.
**Tests run (headless Chromium/Playwright, `file://`):** 71 (6.3 suite, re-run) + 42 (reporting/notification consistency audit) + 15 (bell, preferences, reset, mobile) + 25 (cross-module and Stage 1–5B route/interaction smoke) = 153 checks, all passing after the fixes; before the fixes the audit had 7 failures (items 1–4 above and the bell/mobile cases). Syntax: `node --check` on every JS file. **Not run:** lint/build (the project has none; eslint cannot be installed offline), the original Stage 1–5B test scripts (not supplied), other browsers, screen readers, keyboard walkthrough.

## Stage 6.3 — Notifications & reporting alerts (v1.7)
New: `js/notifications.js`, `css/notifications.css`. Small patches: `js/ops.js` (alert sources hook, 4 new categories, Related link fallback), `js/nav.js` (Government nav item), `js/admin-data.js` (guard `gov/notifications` → `reports:read`), `index.html` (includes). Reporting, integration and webhook modules are unchanged (the export function is wrapped, not edited).
- **One notification system, not two.** Alerts are generated locally from existing state and fed into the Stage 4B store through `Msafiri.ops.sources`, so read/unread state is shared by this page, the Admin bell and the Admin “Notifications & Operations” page (which now also lists these alerts, with its existing Open / Read / Acknowledge / Create-incident actions). State is tab memory only; **Reset demo data** restores it.
- **Page:** `#/gov/notifications` (nav item **Reporting Alerts**, live unread badge). Each alert shows title, message, category, severity, time, read/unread (dot + “Unread” badge + bold title), a **Simulated** badge and the related report / integration / webhook (link only if the target exists). Actions: **Details** (dialog; opening marks it read, “Mark as unread” available), **Mark as read/unread**, **Open** (navigates), **Mark all as read** (reporting alerts), search (title + message), filters (category, severity, status) and **Reset filters**; empty states for no alerts and no matches.
- **Alert sources (all simulated/illustrative):** rejected sample reports → *report validation failed*; Pending sample reports → *ready for review*; old Draft samples (>14 days, illustrative threshold) → *preparation not completed*; one fixed *export failed* sample plus real export failures from the Stage 6.2 export path (permission refusals are not failures); Degraded/Disconnected integrations → *integration issue* (follows live integration state; INT-1002 is already covered by seeded N-002); failed latest webhook delivery → *webhook delivery failed* (clears after a later success).
- **Notification preferences:** four new categories (validation, review, export, webhook) appear in System Configuration → bell preferences.
- **Not defined (URS v2.0 was not supplied to the build):** no statutory deadline, legal obligation, official alert rule, report category or channel is defined; all wording and thresholds are labelled illustrative. No guest data is used. No e-mail, SMS, push or network request; no background worker.
- **Known limits / for Stage 6.4:** (Government bell now fixed in 6.4; Hotel bell is still the static Stage 1–3 list); alerts are derived, not stored events (no history, no dismiss/archive, no per-user state); no scheduling, escalation, digest or delivery-channel preferences; a long list is not paginated.
- **Tested (real headless Chromium/Playwright, `file://`):** 71 scripted checks + permission check (Government Auditor denied, Analyst allowed), all passing; route sweep of every navigation item with no page/console errors; no horizontal scroll at 1366/768/390 px; no external requests. Not tested: other browsers, screen readers, keyboard walkthrough, earlier-stage scripts (not supplied). No lint tooling; `node --check` passed on every JS file.

## Stage 6.2 — Report details & export simulation (v1.6)
Changed: `js/reporting.js` only (plus this README). Route **`#/gov/reports/<SIM-RPT-id>`**; the Stage 6.1 listing’s Details button and report-name link now open it (Stage 6.1 used a dialog).
- **Details:** report information (ID, name, report type = “Not defined — pending specification”, period, property, record count, simulated status, created and last-updated timestamps, data source), status explanation, and an **illustrative validation summary** (records reviewed / valid / with errors) with an issue list using placeholder codes `ILL-nn` (the live Demo Hotel A row uses `SIM-` codes and counts only). Draft samples show “Not yet validated”; unknown IDs show a not-found state. **No validation rule, legal requirement or official format is defined** (URS not supplied). No guest details appear.
- **Export (CSV, simulated):** one report at a time, standard browser Blob download (no export utility existed in the project; the older inert “Export” buttons in other stages are untouched). Columns: `row_type, report_id, report_name, period_start, period_end, property_id, property_name, status_simulated, record_count, valid_records, records_with_errors, issue_code, issue_description, issue_count, created_utc, last_updated_utc, data_notice` — one `summary` row plus one `issue` row per issue; every row carries a “SYNTHETIC PROTOTYPE DATA” notice. RFC 4180 quoting, CRLF, UTF-8 BOM, and spreadsheet-formula neutralisation (text starting `= + - @` tab/CR is prefixed with `'`). File name: `msafiri-SYNTHETIC-report-<id>-<start>_to_<end>.csv`. **It is a prototype file, not an official submission format, and nothing is transmitted.** Failures (no Blob support, URL creation error, missing report, no permission) show a clear toast and write no audit entry; success writes an audit entry “Report export (simulated)”.
- **Permission (decision to confirm):** export needs the existing `reports:create` permission (“Export a report”, defined in Stage 4A). **No seeded role holds it** (the Government Officer description says “Cannot export”), so Export is **disabled by default** with an explanation; a System Administrator can grant it under Roles & Permissions, and **Reset demo data** removes the grant. Viewing details needs only `reports:read`. If the client wants a default exporter, adding `reports:create` to a seeded role is a one-line change in `js/admin-data.js` (and its description text); it was not made here to avoid altering the Stage 4A role matrix.
- **Not built (6.3+):** scheduling/notifications, any official submission format, real validation rules, export of lists or multiple reports, PDF/Excel, and real connectivity.
- **Tested (real headless Chromium/Playwright):** 72 Stage 6.2 checks + 66 Stage 6.1 checks, all passing; see the stage report. Not tested: other browsers, screen readers, keyboard walkthrough, earlier-stage scripts (not supplied). No lint tooling is available offline; `node --check` passed.

## Stage 6.1 — Reporting Dashboard foundation (v1.5)
New `js/reporting.js` (`Msafiri.reporting`) + `css/reporting.css`, at **`#/gov/reports`** (existing Government Portal nav item “Reporting & Trends”, previously a “Soon” placeholder). Small patches: `admin-data.js` (page guard `gov/reports` → `reports:read`; permission label), `nav.js` (description), `index.html` (includes). No other stage was changed.
- **Synthetic and illustrative only.** The URS was **not supplied**, so no requirement is cited and **no report category, format or legal obligation is defined**. Every report is a generated sample (IDs `SIM-RPT-nnnn`, placeholder name “Weekly registration report”, 6 weeks × each Active directory property = 72 rows). Statuses reuse the prototype’s *simulated* vocabulary (Draft, Pending, Submitted, Acknowledged, Rejected) and are labelled simulated everywhere. A banner, table footer and details dialog state that nothing is an official government submission. No network call, no file generated.
- **Summary cards (5):** Total guest registrations (all samples, unfiltered); Registrations in period (follows filters); Pending submissions (Pending + Submitted, with the Submitted count shown); Successful submissions (Acknowledged, simulated); Failed — needs attention (Rejected, simulated).
- **Filters:** period from / to (a report matches when its reporting period *overlaps* the range), property or hotel, status; **Reset filters**; inline error for a start date after the end date; empty state with a reset action. **No report-category filter** — categories are not defined without the URS.
- **Report listing:** report (placeholder name + sample ID), reporting period, property, records, status (simulated), last updated, and a **Details** dialog. Search, sorting and pagination use the shared table component. **No download, export, scheduling or submission control exists.**
- **One live link:** Demo Hotel A’s newest-week row reads the shared Hotel Portal state (record count and a status derived from the simulated submission statuses), so it moves with Hotel Portal changes; all other rows are fixed synthetic samples.
- **Permissions:** guarded by the existing `reports:read` (Authorised Government Officer and Government Analyst allowed; Government Auditor, and any locked or suspended account, see the standard “not permitted” page). Frontend check only — not production security.
- **Not built (6.2+):** downloads/exports, scheduled notifications, automated submission, real government connectivity, report categories/formats from the URS, trend charts.
- **Tested (real headless Chromium/Playwright, `file://`):** 68 scripted checks, all passing — see the stage report. Not tested: other browsers, screen readers, full keyboard walkthrough, the complete Stage 1–5B scripts (not supplied; a 37-route sweep and spot checks only). ESLint is not available offline, so no lint was run; `node --check` syntax check passed on every JS file.

## Stage 5B.4 — Integration, consistency & final QA (v1.4)
Fixes only; no new features. **Changed:** `js/webhooks.js` (2 fixes + tidy), `README.md`.
- **Fix 1 — stale form state:** an invalid, abandoned create/edit form kept its values and error banner and re-appeared the next time any webhook form opened. Carried form state is now consumed once.
- **Fix 2 — payload/data consistency:** webhook example payloads used registration references (REG-9001xx) and integration facts that matched nothing else. They now use the sandbox fixture references (REG-900001–900004, with identical statuses and rejection reason) and read the establishment, error text and status **live from the Integration Dashboard records** (INT-1001/INT-1002).
- **Tidy:** two unused catch variables removed (lint warnings).
- **Verified, no change needed:** all Developer Portal links and `data-action`s resolve; sandbox is read-only (state identical before/after 23 requests) and reflects live integration state (e.g. disabling INT-1001 in the dashboard makes the sandbox return 409); the API reference still marks Simulated vs Illustrative; no credential-like strings render; no network requests.
- **Tests (real Chromium/Playwright, file://):** QA suite 63/63 (portal nav and links, all 23 sandbox cases, JSON errors, Format/Load/Reset/Clear, credential-header refusal, payload cross-checks, reset/navigation during a running simulation, form-state leak, HTML escaping, secret scan, 37-route sweep across all three portals, no horizontal scroll at 768/390 on 11 routes, zero non-file requests); webhook suite 64/64; Stage 5A/4B/cross-module regression 14/14. ESLint 9 (installed outside the project, rules: no-undef, no-redeclare, no-dupe-keys, no-unreachable): 0 errors; 11 warnings remain, all unused variables in Stage 1–4 files (pre-existing), none in developer/sandbox/integrations/webhooks code.
- **Not tested:** other browsers, screen readers, full keyboard walkthrough, the complete earlier Stage 1–4B scripts (not supplied; only route-level plus the spot checks above).

## Stage 5B.3 — Webhook management & delivery simulator (v1.3)
New `js/webhooks.js` (`Msafiri.webhooks`), at `#/admin/developer/webhooks[/new|/<WH-id>[/edit]]`. Small patches: `developer.js` routes the Webhooks section to it and updates the overview/API-reference wording; `css/developer.css`, `index.html`, `nav.js` text. Reuses `UI.table`, modal/confirm, toasts, badges, alerts, the Developer Portal header/sub-nav and the shared audit trail.
- **Simulation only.** No fetch/XHR/WebSocket/beacon exists in the module. Destination URLs are stored as text and never contacted. A “successful” attempt is **not** a delivery; every attempt, badge and toast says *simulated*.
- **Management:** table (name, synthetic URL, subscribed events, enabled/disabled, last delivery, last result, actions) with search, status filter, sorting, summary cards and an empty state; details page; create/edit form; enable/disable; delete with confirmation (removes the configuration and its simulated history from the tab; audit log keeps a record). 3 seeded synthetic webhooks.
- **Form validation:** name required, 3–60 chars, unique; URL required, `https://` only, ≤200 chars, domain hostname (no localhost/IP), **no credentials or token/key/secret/signature query parameters**; ≥1 event type. Inline errors + summary; a non-blocking warning if the host is not an example/test domain.
- **Events (illustrative, pending specification):** 4 guest-registration events (submitted / acknowledged / rejected / queued offline) and 3 integration-operation events (status changed / sync failed / health check completed). Names and payloads are placeholders, labelled as such; payloads use synthetic data (“Ana Sample (synthetic)”, REG-9001xx).
- **Delivery simulator:** choose a subscribed event and a scripted destination behaviour (200 OK; 500, 503 or timeout that succeed on retry; persistent 500; 401; 410). Shows payload preview, then after an 0.8 s loading state: event, payload, simulated HTTP status, timestamp, result, error summary. History and the list’s last-delivery/last-result update from the same record store. **Retry** creates a new history entry (attempt n+1, linked both ways); transient failures succeed on retry, persistent ones keep failing; illustrative cap of 5 attempts. Disabled webhooks cannot simulate or retry.
- **Signature:** shown only as a *concept* card; **no signature is computed or verified, and no secret exists** or is displayed.
- **Permissions:** viewing needs `integrations:read`; create/edit/toggle/delete/simulate/retry need `integrations:admin` (Support Analyst is read-only; enforced in the UI and refused in handlers — demonstration only, not production security).
- **Audit:** configuration changes and simulated attempts are written to the shared audit log (“Webhook configuration change”, “Webhook delivery (simulated)”).
- **Known limits / not built:** URS still not supplied — no URS IDs cited; event contract, retry policy and statuses are placeholders. No scheduled/automatic retries, dead-letter queue, filtering by payload, per-webhook secrets, delivery export, or pagination of history beyond the table pager. History and configs are in-memory (Reset demo data restores seeds). Webhook deliveries are not added to the Integration Event History (different record type).
- **Tested:** 64 scripted checks in headless Chromium (1366/768/390 px) — all passing; see stage report. Not tested: other browsers, screen readers, full keyboard walkthrough. No lint tooling exists.

## Stage 5B.2 — API sandbox & request simulator (v1.2)
New `js/sandbox.js` (`Msafiri.sandbox`), at `#/admin/developer/sandbox[/<entry-id>]` (deep links from each API-reference entry's “Try this in the sandbox”). Patches: `developer.js` exposes a small `Msafiri.dev` helper object and hooks the sandbox section; `css/developer.css` and `index.html` additions.
- **Simulation only.** Requests are evaluated by local JavaScript. No fetch/XHR/WebSocket/beacon exists in the module; nothing is transmitted. The sandbox is **read-only** (verified: prototype state is identical before and after a run of requests).
- **Illustrative contracts.** The prototype has no HTTP API, so every method, path (prefixed `/illustrative/`), schema and status code is a **placeholder for this simulator, pending the URS** (still not supplied to the build) and a real implementation. Each is labelled as such on the page.
- **4 endpoints, 23 example cases:** Submit guest registration (valid, missing fields, invalid data, document ending in 9 → rejected, establishment not active, unknown establishment); Get submission status (sandbox fixtures only — administrators have no guest-record access, so hotel records are never read); Test integration connection and Run health check (read the Integration Dashboard records: Connected, Degraded, expired credentials → 401, host unreachable → 503, disabled → 409, unknown, missing id). Hotel Portal's simulated offline mode is reflected for INT-1001.
- **Interface:** endpoint selector, method + path indicator, example-case selector, JSON editor with **Format JSON**, collapsible synthetic headers, **Send request** with processing state, response panel (status badge, “Simulated” label, simulated time, body, headers), recent requests (last 5), **Load example**, **Reset**, **Clear response**. Invalid JSON → readable inline error (line/column where the browser reports one) and a simulated 400. Document type validation uses the active Reference Data list.
- **Safety:** the Authorization header is a fixed placeholder; any other value, and API-key/cookie headers, are refused and never echoed. Responses never include credentials. No authentication is performed.
- **Known limits:** JSON error wording/position comes from the browser's parser and differs between browsers; field rules (formats, 1–365 nights, 5–20-character document numbers) are illustrative; 4xx/5xx mapping is illustrative; nothing is persisted; the older “OpenAPI & Sandbox” sidebar item remains a “Soon” placeholder (no OpenAPI document exists).
- **Not built:** webhooks, API-key lifecycle, real execution, production authentication, OpenAPI document.
- **Tested:** 112 sandbox checks + 100 Developer Portal/regression checks (real headless Chromium, 1366/768/390 px), all passing — see test list in the stage report. Not tested: other browsers, screen readers, full keyboard walkthrough. No lint tooling exists.

## Stage 5B.1 — Developer Portal foundation (v1.1)
New `js/developer.js` + `css/developer.css`, at `#/admin/developer[/docs|/api|/sandbox|/webhooks]` (existing nav item “API / Developer Portal”; needs `integrations:read`, the same permission as the Integration Dashboard). Small patches: `integrations.js` exposes `I.CAPS`/`I.CAPMAP` read-only (avoids duplicating the capability list); `nav.js` description; `index.html` includes.
- **Overview:** live counts, section cards, capability table (read from the integration data), acting-user/permission panel.
- **Integration documentation:** overview, authentication *concepts*, 7-step workflow, request/response examples, error responses (catalogue of the codes that really occur in simulated events, with a live “seen in current events” column).
- **API reference:** 11 entries — 6 *Simulated in prototype* (in-browser behaviour that exists) and 5 *Illustrative only* (capability named, no behaviour); search and type filter with empty state; each has example request/response and error cases.
- **Sandbox / Webhooks:** entry points only (disabled call-to-action, what exists today, what is not built).
- **Verified facts:** this build has **no HTTP API** — no fetch/XHR, server or OpenAPI document. **Zero implemented endpoints.** Therefore **no HTTP method or path is shown anywhere** (“Not defined — to be specified”); all payloads are illustrative and subject to specification. Wording such as status names, rejection reason and error codes is copied from the real prototype behaviour.
- **URS:** `Msafiri_National_Guest_Registration_URS_v2.0` was again **not in the upload**, so it was not read; no URS IDs are cited and no URS contract reproduced. The pages say so. Reconcile with the URS before client use.
- **Safety:** read-only; no credentials or masked config values are rendered; no network requests; frontend permission checks are a demonstration, not production security.
- **Not built (5B.2+, only where the URS supports it):** executable sandbox, OpenAPI document, API-key lifecycle, webhook management/delivery/signing, real PMS or government connectivity.
- **Tested:** 102 scripted real-browser checks (headless Chromium/Playwright; 1366/768/390 px): navigation, content, filter/empty state, permissions (denied, read-only, reset), no secrets, no external requests, no horizontal page scroll, mobile drawer, and a sweep of every nav route in all three portals plus 5A/4A/3/2 spot checks. **Not tested:** other browsers, screen readers, full keyboard walkthrough. No lint tooling exists in the project.

## Stage 5A.4 — Consistency & final QA (v1.0)
Fixes only: a reset during a running simulated action no longer applies a stale result; Enable message is accurate for a disconnected integration; dead "Info" status filter removed; dashboard shows the disabled count; Stage 4B notification N-002 / incident INC-1002 now name the establishment that PIL-004 really is (Lakeview Guest House) and link to its integration. Verified by a randomised 1,500-action invariant run (Connected ⇒ no failed operations, Degraded ⇒ at least one, blocked actions never log, one event per action) plus scripted browser checks. **No lint/build tooling exists in this project and eslint could not be installed (network blocked), so no lint was run.**

## Stage 5A.3 — Health monitoring & event history (v0.9)
Same module, `js/integrations.js`. **Health** card on the details page: health state (Connected / Degraded / Disconnected / **Attention Required**, derived from status — e.g. expired credentials, disconnected >24 h, ≥2 failed operations, no check in 24 h), last health check, last sync, failed operations, last error with code, summary. **Run Health Check** is a scripted local simulation (INT-1007 reveals schema drift on its first check and becomes Degraded). **Event history** at `#/admin/integration-events[/<INT-id>]`: ~70 synthetic events with search, type/severity/status/integration filters, pagination and a details dialog (full message + synthetic diagnostics, no credentials). Events are one shared list (`Msafiri.integ.events`) fed by seed data, actions and health checks; state is in memory and restored by Reset demo data. Not live monitoring.

## Stage 5A.2 — Integration details & simulated actions (v0.8)
Same file, `js/integrations.js`; details at `#/admin/pms-health/<INT-id>` (linked from the listing). Shows provider, property, status, last sync/error, capabilities, **masked** configuration, failed operations and the latest activity. Simulated actions: Test connection, Connect, Enable, Disable (with confirmation), Retry failed operation — 0.9 s simulated delay with loading, toast and inline result; invalid actions are disabled with a reason (e.g. enable when already enabled). Outcomes are scripted: INT-1004 always fails to connect (expired credentials), INT-1008 fails once then connects, INT-1002/1006 contain a retry that fails once. State is in memory (restored by Reset demo data). Events go to `Msafiri.integ.events` (flat records) and to the shared audit trail. Needs the new `integrations:admin` permission (System Administrator has it; Support Analyst is read-only). **Not built (5A.3):** health-monitoring dashboard, searchable event history, editing configuration/credentials.

## Stage 5A.1 — Integration Dashboard & listing (v0.7)
New `js/integrations.js` (`Msafiri.integ`), at `#/admin/pms-health` (nav label "Integration Dashboard"; needs `integrations:read`). Summary cards (total / connected / degraded / disconnected / recent failures = error in last 24 h) and a searchable table with status and provider filters. 10 **synthetic** records with fictional provider names, linked to directory establishments whose PMS is "Simulated connector"; Demo Hotel A shows Disconnected while the Hotel Portal's simulated offline mode is on. **Not built (later parts):** integration details (the Details button is disabled), operational actions, health checks, event history. No real PMS or government API is called.

## Stage 4B — Reference data, configuration, audit & support (v0.6)
One new module, `js/ops.js` (`Msafiri.ops`), plus small patches to existing files. **URS IDs: none cited** (the URS was not in the upload). All of it is frontend-only, synthetic and not production security.
- **Reference Data** (`#/admin/reference-data`): 5 lists (countries, administrative divisions, document types, establishment categories, search purposes) with search, list/status filters, add/edit, effective-from/to dates (Scheduled/Expired/Inactive are not selectable), per-value change history, in-use counts. Names in use are locked; the last active value cannot be deactivated. Changes feed the Hotel registration lists, establishment forms/filters and Government search purposes. Lists are marked configurable/unresolved; no official list is reproduced.
- **System Configuration** (`#/admin/settings`): validated form, review dialog, Save/Cancel, change history, read-only integration/environment status. Each setting is labelled *applies in this prototype* or *display-only*. Wired: offline threshold (Hotel offline page), reference review interval, notification-bell preferences, unmasking justification length, exceptional-access maximum.
- **Configuration Approvals** (`#/admin/approvals`): security-relevant settings are *proposed* and applied only after a **different** acting admin approves (reject needs a comment; proposer may withdraw; self-approval is disabled in the UI **and** refused in code, and the blocked attempt is audited). Switch “Acting as” between Sofia Okello and Zawadi Mwita. Prototype workflow, not production enforcement.
- **Audit Logs** (`#/admin/audit-logs`): the same `Msafiri.store.audit` trail used by the Government Portal (its action filter now lists every type). Search, action and area filters, detail dialog. No edit/delete control; not tamper-proof.
- **Notification centre & operations** (`#/admin/incidents`): seeded plus live-derived items (rejected submissions and offline queue from hotel state, pending approvals, incidents, access requests); severity, status, read/unread, filters, Open/Acknowledge/Create-incident. Admin top-bar bell and sidebar badge read the same store. Not live monitoring.
- **Support incidents** (`#/admin/support-incidents`): directory, filters, create (needs an establishment or component), assign, notes, status (resolution notes required), 3-level escalation history (level 3 = external operator, *not connected*).
- **Exceptional access** (`#/admin/exceptional-access`): Support Analyst has no default guest-data permission; requests need an open incident, justification and a duration within the configured maximum; a different admin approves; the grant is time-limited, viewable only by the requester, audited per view, with Expired/Revoked states and a “Simulate expiry” demo control. Synthetic records only.
- New permission modules (config, incidents, privaccess) appear in the role matrix; 7 new page guards.

**Assumptions:** list set, setting set and ranges, which settings are “security-relevant”, the escalation levels, the “incident required” rule for access requests, and default durations are assumptions to reconcile with the URS.
**Known limits / not built:** no dedicated detail pages for reference values, proposals or incidents (dialogs are used); no establishment-detail incident panel; the access countdown is not live-ticking (expiry is evaluated on use/page load); PMS Health, Connectors, Developer Portal and Sandbox remain “Soon”; Hotel/Government notification bells are still the Stage 1–3 static lists.
**Tested (Stage 4B):** 71 scripted real-browser checks (headless Chromium/Playwright, 1366/768/390 px), all passing, no script errors: route sweep, reference-data search/add/duplicate/effective-date propagation, configuration validation/save/cancel/history, hotel threshold wiring, maker-checker propose/approve/reject/self-approval, audit consistency across Admin and Government, notification badge/navigation/mark-all, incident create/validate/escalate, access request/approve/view/expire, permission checks, reset, and no horizontal page scroll at 768/390 px. **Not tested:** other browsers, screen readers, full keyboard walkthrough, full re-run of the earlier Stage 2/3/4A scripts (only route-level regression on 7 pages).
**Next stage:** PMS integration health and connectors, developer portal, API documentation, sandbox and integration monitoring.

## Stage 4A — Administration: users, roles, establishments (v0.5)
All of this is frontend-only demonstration on one shared state: `js/admin-data.js` (`Msafiri.dir`) holds establishments, users, roles and the permission engine; `js/pages/admin.js` holds the pages. The Hotel and Government Portals read the same records.

**Users** (`#/admin/users`, detail `/<id>`, form `/new` and `/<id>/edit`)
- Directory with search (name, email, role, establishment), status / role / establishment filters, sorting, paging, last activity (synthetic).
- Detail page: profile, role and effective permissions, establishment link, account status, administrative history from the shared audit trail.
- Create and edit forms with inline + summary validation (required fields, email format and uniqueness, phone format, establishment required for Hotel Portal roles and cleared for government/platform roles), a confirmation dialog listing exactly what will change, success toasts.
- Suspend (reason required), reactivate/activate, unlock, reset password (simulated) — each confirmed and written to the audit trail. Guards: the acting demo user cannot be suspended/moved to another workspace, and the last active System Administrator cannot be demoted or suspended.
- No password, token or credential is created or stored.

**Roles & permissions** (`#/admin/roles`, `/<id>`, `/<id>/edit`, `/new`)
- 8 **configurable demonstration roles** (3 hotel, 3 government, 2 platform) — *not* an approved role matrix. Permission catalogue: 13 modules × Read / Create / Edit / Approve / Administer, each module grantable only in its own workspace.
- Role directory, per-role detail with matrix and assigned users, side-by-side permission overview, editable matrix with a diff-and-confirm dialog, custom demo roles (create / delete when unused).
- Least privilege: a role cannot hold every permission available in its workspace; System Administrator keeps user/role administration (lock-out protection); administrators have no guest-record access.
- **Acting as (demo user)** in the user menu: pick a directory user per workspace. Their *assigned role* drives access. Page-level checks are enforced for 13 routes (listed on the Roles page); a refused route shows an explanatory “not permitted” page, the sidebar shows “No access”, and write buttons are disabled with an explanation. Changing a user's role or a role's permissions changes what the acting user can open immediately.
- **Frontend-only checks are a demonstration, not production security.** Other matrix cells are defined but not yet enforced by any screen.

**Establishment administration** (`#/admin/establishments`, `/<id>`, `/<id>/edit`)
- Directory (20 synthetic establishments) with search and operational-status / category / location / PMS filters, sorting, completeness, user count.
- Detail: profile and contact, operational and onboarding status, PMS/integration (simulated), reporting activity (PIL-001 live from hotel state, others sample), profile completeness (8 fields, missing list), associated users with “Add user” pre-linked to the establishment.
- Edit with validation (unique name, email/phone format, “Active requires onboarding complete” demo rule), confirm dialog with diff; PIL-001 operational status is locked because it is the live demo establishment. Statuses are demonstration values — no licence, approval or government decision is implied.
- Onboarding queue (admin dashboard) now writes through: approving sets the establishment Active/onboarding complete; rejecting returns it to “In progress”.

**Shared-data consistency**
- Government establishment directory, overview cards and follow-up list now read the directory (renames, status, PMS, contact appear there). The Stage 1 overdue list was re-keyed by name so ids/regions agree.
- Hotel Portal **Establishment Profile** (view; Establishment Manager may edit contact details) and **Staff & Users** (read-only, scoped to the acting user's establishment) are now live and read the same records.
- Admin dashboard “Active users / Onboarded establishments / Locked accounts” are derived from the directory (replacing the static Stage 1 numbers: 86 / 14 / 2 → 15 / 15 / 2 initially).
- Every admin, hotel-profile and onboarding change writes to the shared audit trail (type “Administrative action”), visible in Government → Audit & Access History.

**URS IDs: none cited.** `Msafiri_National_Guest_Registration_URS_v2.0` was not supplied with this build; no requirement IDs are claimed. Fields, roles, permissions and statuses are assumptions to reconcile with the URS.

**Assumptions / simulated:** role names and matrix; user fields (name, email, mobile, job title, role, establishment, status, notes); statuses Active / Invited (demo) / Suspended / Locked; “last activity” values; establishment contact data (placeholder `.example` emails, `+255 000…` numbers); profile-completeness field list; password reset and invitations (no message is sent).

**Known limits:** no persistence (reload resets); the “Acting as” switch is per portal and not a sign-in; no establishment *create* flow; user-menu act-as list shows only users of the workspace (hotel: Demo Hotel A staff); Hotel pages not listed in the guard table are not role-gated; audit remains in-memory and not tamper-proof.

**Stage 4B should continue with:** Reference Data & Settings, PMS Integration Health, Connector Status, API/Developer Portal, OpenAPI & Sandbox, Audit Logs & Config History (an admin view of the shared audit trail), Notifications & Incidents — all still “Soon”.

## Stage 3 — Government Portal (v0.4)
Same shared state as the Hotel Portal (`js/store.js`); new pages in `js/pages/gov.js`.
- **Government overview:** 8 sample-labelled cards, 7/14-day trend, follow-up table, open-issue chart, recent audit activity. National totals are the sum of the 20 synthetic establishments; **Demo Hotel A (PIL-001) is live from hotel state**, so hotel check-ins change these numbers.
- **Establishment directory:** search, status filter, sort, paging, detail view. No licensing/approval decisions are implied; onboarding wording is "(demo)".
- **Guest record search:** purpose (sample placeholder options) + case reference required for **every** search (stricter than "identifying only" — assumption); validation, loading, empty and blocked states; results always masked; blocked attempts are audited.
- **Record detail and controlled unmasking:** masked by default; single-record unmask needs justification + confirmation, shows user/time in audit, can be re-masked. No bulk unmasking. No sensitive data in URLs.
- **Submission monitoring:** record table with status filter/search, details and history, establishment summary. All responses labelled simulated.
- **Audit history:** read-only, searchable and filterable; hotel events and government actions share one trail.
- **Still placeholder:** Reporting & Trends page (trend is on the overview). Audit is in-memory and resets with demo data; it is not tamper-proof.
- Purposes, masking rules, justification length (10 characters), role permissions and "who may unmask" are **assumptions pending governance/legal confirmation**. **URS IDs: none cited** (URS still not supplied).

## Stage 2 — Hotel Portal core (v0.3)
Built on one shared synthetic state (`js/store.js`), so dashboard, records, submissions and offline queue always agree.
- **Dashboard** (updated): counts, status chart, attention list, recent activity and connection/queue status all derive from the shared records.
- **Guest Registration & check-in** (`new-registration`): field validation, required markers, **simulated scan** (labelled; two low-confidence fields highlighted and editable), simulated PMS prefill (disabled offline, manual entry otherwise), mandatory document-check confirmation, review/confirm dialog, success dialog.
- **Guest records** (`registrations`): search, status filter, sort, paging; masked document numbers; record detail modal with activity history; **check-out, amend, cancel (reason required)** each with confirmation and simulated resubmission.
- **Submission Centre** (`submissions`): Pending → Submitted → Acknowledged/Rejected progression (simulated, labelled), explanations, **Retry** for rejected records, history.
- **Offline queue** (`offline-queue`): simulate connection loss, local queueing (never shown as delivered), +24 h offline-duration warnings against a configurable demo threshold (72 h default per the brief), blocked/successful sync, **conflict review** (never silently overwritten; choice logged).
- Demo rule: a document number ending in **9** is rejected by the simulated interface; retry then succeeds.

**Not built yet (still "Soon" placeholders):** standalone Check-in and In-House pages, PMS Connection page (PMS status appears only on the dashboard and as the registration prefill), Compliance & Reports, a full guest-record *page* (a modal is used), sync-error simulation beyond rejection.
**URS IDs:** none cited — the URS has still not been supplied.

## Stage 1 — implemented
- Application shell: sidebar, top bar, breadcrumb-ready page headers, responsive (desktop / tablet / mobile drawer), keyboard and screen-reader support.
- Three visibly distinct workspaces with demo role switching: **Hotel Portal** (Receptionist), **Government Portal** (Authorised Government Officer), **System Administration**.
- Navigation for every module named in the brief (modules not yet built show a **Soon** chip).
- Dashboards for all three portals (stat cards, charts, tables, lists).
- Honest status vocabulary: **Pending, Submitted, Acknowledged, Rejected, Queued offline** (all simulated and labelled as such).
- "Connections & mode" panels showing every integration as **Simulated** or **Not included**.
- Component library, list/form page templates (Admin → Prototype Toolkit), toasts, modals, confirm dialogs, sortable/filterable/paged tables, charts.
- Demo-mode ribbon, banners and footer on every page; **Reset demo data** in the user menu.

## Change log v0.1 → v0.2 (alignment with updated brief)
- Navigation rebuilt to the brief's workspace modules (hotel: registration, check-in, check-out/amend/cancel, submission history, offline queue, PMS fallback, compliance, profile, staff; government: overview, establishment monitoring, submission/data quality, purpose-bound guest search, audit & access, trends; admin: users/roles, establishments, reference data, PMS health, connectors, developer portal, OpenAPI sandbox, audit/config history, incidents).
- Removed invented items: "Corrections", "Review Queue", "Reporting Monitor", "Security Policies", the "National Registry Office" name, and the "23:59 reporting window" rule.
- Statuses changed from Needs correction / Draft-style wording to Pending / Submitted / Acknowledged / Rejected / Queued offline.
- Scale reset to pilot context (~20 hotels) instead of 600+ establishments; the ~1,500 national figure is described as planning context only.
- Government workspace states that guest-identifying data is masked by default.
- Receptionist persona replaces "Front Office Manager"; government persona uses a generic title.

## Not yet built
The early "next stages" list that stood here is obsolete (those stages are built; see the per-stage notes). What is **not** built: the six placeholder pages (Hotel › Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports; Admin › Connector Status), per-establishment data isolation, real authentication and server-side access control, persistence, real integrations, and anything depending on the unresolved decisions in `STAGE_8_8_DECISION_REGISTER.md`. No further stage is approved.

## Simulated or excluded
| Item | State |
|---|---|
| Government interface and acknowledgements | Simulated (not built yet) |
| Hotel PMS connector and PMS data | Simulated (not built yet) |
| Document scan / field extraction | Simulated (not built yet) |
| Identity verification | Not included |
| Sign-in / authentication | Not built; role switch is a demo control |
| Persistence | None for demo data (browser tab memory only). Only the sidebar-collapse preference is kept in `localStorage` |

## Needs discovery, government input, legal decision or infrastructure confirmation
Authority names and legal purposes of search; permissions per government role; retention periods; masking rules per field; real submission rules and acknowledgement/rejection codes; PMS vendors and APIs; offline conflict rules; hosting, credential management and security assessment. None of these are decided in the prototype.

## Assumptions
- Navy `#0A1F44` and orange `#F47B20` approximate the "navy and orange" direction; the "M" logo is a placeholder.
- Regions, establishment names, people and nationalities are fictional. Statuses, "Overdue / At risk" thresholds and flags are configurable-demo ideas, not URS rules.
- Schedule: 20 October 2026 is treated as a project target, not a confirmed deadline for every deliverable.
- Browsers: current Chrome, Edge, Firefox, Safari.

## Files
```
index.html            css/{tokens,base,layout,components}.css
js/{icons,data,nav,ui,charts,store,admin-data,app}.js
js/pages/{dashboards,hotel,gov,admin,toolkit}.js, js/ops.js, js/integrations.js
```
Extend by adding `Msafiri.pages['hotel/<id>'] = { render, mount }` in a new `js/pages/*.js` and one `<script>` line in `index.html`; the "Soon" chip disappears automatically.

## Testing performed
Stage 4A: scripted **real-browser** run (headless Chromium via Playwright, 1366/768/390 px viewports): 138 checks, all passed, covering route sweep (every nav route renders), user search/filter/sort, create/edit/suspend/unlock flows, validation and confirmation dialogs, role assignment → acting-user permissions, role matrix edit incl. least-privilege and lock-out guards, custom role create/delete, establishment search/filter/edit/validation, Hotel→Admin→Government data consistency, onboarding approve write-through, read-only support role, reset, label association on every form control, keyboard Enter-submit, and no page-level horizontal scroll on the new screens. A further Hotel check-in → shared directory regression passed. **Not tested:** other browsers (Firefox/Safari), real screen readers, full keyboard-only walkthrough, the complete Stage 2/3 journeys as a re-run of the earlier 23-check scripts (only spot regressions above).

Earlier stages:
Stage 3: a 23-check scripted government journey (blocked/invalid/valid search, masking, unmasking + audit, hotel-to-gov consistency, submission and audit views) plus the Stage 2 journey re-run as regression (23/23) — all passed, zero script errors. Headless-DOM (jsdom) tests only: syntax check, all 31 routes render, and a 23-check scripted Stage 2 journey (scan, validation, dialog cancel, check-in, simulated ack, rejection, retry, offline queue, sync, conflict, check-out, cancel, amend, dashboard consistency) — all passed with zero script errors. NOT tested: real browsers, desktop/mobile layouts, keyboard or screen-reader use.
