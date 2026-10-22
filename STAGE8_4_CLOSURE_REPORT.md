# Msafiri — Stage 8.4 Closure Report (Requirements Reconciliation)
Prototype only. Synthetic data; every government, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. Not production-ready; no certification claimed.

## Decision: **NOT READY FOR APPROVAL**
Stage 8.4 cannot be approved as complete because the approved URS v2.0 has never been available, so 17 of 21 traced items cannot be verified. The tests all pass, but they show the prototype behaves as built, not that it meets approved requirements. **Stage 8.5 has not been started.**

## 1. Confirmed implementation status
- **Source documents.** Approved URS v2.0: **absent** (re-checked this run; no new upload). The only requirements file is `MSAFIRI_Provisional_URS_v2_0_Reconstructed.docx`, which calls itself "DRAFT — NOT THE ORIGINAL APPROVED URS" and is **not treated as authoritative**. The only authoritative sources used are the project rules in your stage prompts (synthetic data, label simulations, no real integrations, no secrets) — items T18–T21.
- **Application code is unchanged since the last delivery** (verified by `diff` against the delivered zip before this run's edits). Code changed earlier in Stage 8.4 only in `js/store.js` and `js/pages/hotel.js`: lifecycle guards on `checkIn`/`checkOut`/`cancel`/`amend` (same rules the dialog already applied, returning true/false so success toasts show only on success), and *Start check-in* hidden from users without `registration:create`. These rules come from existing UI behaviour, not from an approved requirement.
- **Implemented and observable (simulated):** hotel registration with review and confirmation; records list and dialog; amend/cancel/check-out; submission centre and offline queue; masked government search with purpose/justification; admin users, roles, establishments, maker-checker configuration; integration, webhook, sandbox and export simulations; audit lists.
- **Absent (existence of a requirement unconfirmed):** duplicate-guest prevention (T5); authentication (T6); establishment isolation (T9); audit-log protection (T13); retention/encryption/backup (T17); 6 "Soon" placeholder pages.

## 2. Requirements traceability table
Statuses are limited to VERIFIED / FAILED / BLOCKED — SOURCE REQUIRED / NOT IMPLEMENTED. Where the requirement itself depends on the unavailable approved URS the status is **BLOCKED — SOURCE REQUIRED**, and what actually exists is recorded in the implementation column. **FAILED: 0** (nothing authoritative to fail against). **NOT IMPLEMENTED: 0** (absence is recorded as an observation in the table, because no authoritative requirement establishes that the feature is required). Counts: **VERIFIED 4**, **BLOCKED — SOURCE REQUIRED 17**.

| ID | Area · item | Authoritative source | Implementation evidence | Test evidence | Status |
|---|---|---|---|---|---|
| T1 | 1 Fields · Guest-registration mandatory field set | Approved URS v2.0 — **not available** | `js/pages/hotel.js` `validate()`: first name, last name, DOB, nationality, document type, document number, room, arrival, departure + document-check confirmation are required; country of residence is optional | workflow_8_2, journeys_1_3 (J1), probe (a message per field). These **characterise the code**; they do not show the set is the approved one | **BLOCKED — SOURCE REQUIRED** |
| T2 | 1 Fields · Hotel / establishment mandatory fields | Approved URS v2.0 — **not available** | `js/pages/admin.js` establishment dialog requires name, category, region, operational status, onboarding status; the hotel Profile page shows no required markers | Route sweeps only (audit_smoke, ui_polish). Establishment-form validation is **not** exercised by any Stage 8.4 check | **BLOCKED — SOURCE REQUIRED** |
| T3 | 2 Validation · Guest field rules: document number 6–12 letters/digits; DOB not in future; departure after arrival | Approved URS v2.0 — **not available** | `hotel.js` `validate()`; `store.js` amend rule (same date/room rule) | workflow_8_2; probe (messages, store-level amend) | **BLOCKED — SOURCE REQUIRED** |
| T4 | 2 Validation · DOB plausibility; accepted document types | Approved URS v2.0 — **not available** | Only "not in the future" exists; a DOB of 1800 is accepted. Document types are a placeholder reference list | None | **BLOCKED — SOURCE REQUIRED** |
| T5 | 2 Validation · Duplicate-guest prevention | Approved URS v2.0 — **not available** | **No mechanism exists.** Two check-ins with the same document number were both accepted (2 records added). Only a duplicate-email check exists, for admin users | journeys_1_3 J3 (duplicate *user email* only); `tests/stage8_4_closure_evidence.py` shows the guest case | **BLOCKED — SOURCE REQUIRED** |
| T6 | 3 Auth / roles · Authentication (sign-in, sessions, MFA) | Approved URS v2.0 — **not available** | **None.** No password field on any route; an "Acting as (demo user)" switch; Sign out says "Not available in prototype" | probe (no password field, menu wording, 3 portals); shell_8_2 (sign-out toast) | **BLOCKED — SOURCE REQUIRED** |
| T7 | 3 Auth / roles · Role and permission matrix | Approved URS v2.0 — **not available** | Seeded demo roles, e.g. hotel: Receptionist, Establishment Manager, Reporting Viewer (read-only); government: Authorised Officer, Analyst, Auditor; plus System Administrator | security_audit 31/31, journey_4 28/28, probe (read-only user USR-004) | **BLOCKED — SOURCE REQUIRED** |
| T8 | 3 Auth / roles · Authorisation enforced in application logic | Approved URS v2.0 — **not available** | Route guards (`admin-data.js`), `S.guard` in the store, UI gating. **Front-end only**: no server, bypassable from the browser console. Whether front-end enforcement is acceptable is itself unspecified | security_audit, journey_4, probe (route denied, direct store calls refused and audited) | **BLOCKED — SOURCE REQUIRED** |
| T9 | 3 Auth / roles · Data isolation between establishments | Approved URS v2.0 — **not available** | Hotel portal is bound to one synthetic establishment; no multi-establishment hotel model | **Not testable** with the current model | **BLOCKED — SOURCE REQUIRED** |
| T10 | 4 Lifecycle · Stay lifecycle and transition rules | Approved URS v2.0 — **not available** | Draft/Expected → Checked in → Checked out; cancel from any non-terminal state; amend from Expected/Checked in. Enforced in the dialog **and** `store.js` (`checkIn`, `checkOut`, `cancel`, `amend`) | workflow_8_2; probe: 69/69 incl. refused invalid transitions. Probe fails on the pre-fix code | **BLOCKED — SOURCE REQUIRED** |
| T11 | 4 Lifecycle · Submission and offline-queue status workflow (simulated) | Approved URS v2.0 — **not available** | Not reported, Pending, Submitted, Acknowledged, Rejected, Queued offline, Conflict; all outcomes scripted (a document number ending in 9 is rejected) | functional_8_2, journey_5, probe (queue counts agree across nav, page and dashboard) | **BLOCKED — SOURCE REQUIRED** |
| T12 | 5 Audit · Audit event coverage | Approved URS v2.0 — **not available** | Registration activity, submission events, permission denied, action blocked, unmasking, configuration proposal/approval, privileged access, admin actions | security_audit, journeys_1_3, journey_4, probe (each lifecycle action audited, naming the acting demo user) | **BLOCKED — SOURCE REQUIRED** |
| T13 | 5 Audit · Audit-log protection (immutability, retention, export) | Approved URS v2.0 — **not available** | No edit/delete control on `#/gov/audit` or `#/admin/audit-logs`. **But** the audit is an unfrozen in-memory array (`pop()` from the console removes an entry), is not persistent or signed, and **Reset demo data** reseeds it | `stage8_4_closure_evidence.py` (informational). No repo test asserts protection | **BLOCKED — SOURCE REQUIRED** |
| T14 | 6 Data / reporting · Masking and unmasking (purpose, justification, audit) | Approved URS v2.0 — **not available** | Government search masked by default; purpose and justification required; unmask audited. Masking is **display-only**: full values sit in browser memory | security_audit, journeys_1_3, journey_4; probe (hotel list/dialog show no full document number) | **BLOCKED — SOURCE REQUIRED** |
| T15 | 6 Data / reporting · Access restrictions on government search, audit and reports | Approved URS v2.0 — **not available** | Page guards `guestsearch:read`, `audit:read`, `reports:read` | security_audit; audit_smoke (Government Auditor denied Reporting) | **BLOCKED — SOURCE REQUIRED** |
| T16 | 6 Data / reporting · Report categories, formats, thresholds, deadlines | Approved URS v2.0 — **not available** | Not defined. Reports are labelled samples; only the live row reads shared state; export is disabled for every seeded role | journey_5 (local synthetic CSV, no network) | **BLOCKED — SOURCE REQUIRED** |
| T17 | 6 Data / reporting · Retention, residency, encryption, backup | Approved URS v2.0 — **not available** | None in the prototype (tab-memory only) | None | **BLOCKED — SOURCE REQUIRED** |
| T18 | 6 Data / reporting · Simulated integrations are labelled and nothing is transmitted | Project rules stated in your stage prompts | Labels and banners on integration, webhook, sandbox, scan and export features; no network code path | journey_5 48/48 (network instrumentation, zero API calls); probe (zero external requests) | **VERIFIED** |
| T19 | 6 Data / reporting · No real government, National Police or VeriDoc integration present or claimed | Project rules stated in your stage prompts | None present. External strings are reserved `.example.test` placeholders | journey_5; URL scan of `js/` and `index.html` | **VERIFIED** |
| T20 | 6 Data / reporting · Demo / synthetic data is labelled | Project rules stated in your stage prompts | Banners on dashboards | probe: all 3 dashboards carry a demo/synthetic/sample label. **Scope: dashboards only**; not every page swept, and absence of real PII is not proven | **VERIFIED** |
| T21 | 6 Data / reporting · No credentials or secrets in shipped code | Project rules stated in your stage prompts | Pattern scan of `js/`, `css/`, `index.html`, `tests/`: only `Bearer SYNTHETIC-SANDBOX-TOKEN` (`js/sandbox.js`), a labelled placeholder | Ad-hoc grep only. **A pattern scan is not proof of absence** | **VERIFIED** |

## 3. Test results and unresolved failures
Run this session on the final tree (Chromium 141 via Playwright, `file://`, synthetic data); each command `python3 tests/<name>.py`, run sequentially with a per-suite exit code:

| Suite | Exit | Result |
|---|---|---|
| audit_smoke | 0 | 24 passed, 0 failed |
| security_audit | 0 | 31 passed, 0 failed |
| ui_polish | 0 | 20 passed, 0 failed |
| functional_8_2 | 0 | 27 passed, 0 failed |
| workflow_8_2 | 0 | 23 PASS lines, failed: 0 |
| shell_8_2 | 0 | PROBLEMS 0 (38 sidebar links, 5 breadcrumb targets, menus, modals, bell routes, back/forward) |
| journey_4_auth_permissions | 0 | 28 passed, 0 failed |
| journey_5_integration_transparency | 0 | 48 passed, 0 failed |
| journeys_1_3 | 0 | 32 passed, 0 failed |
| stage8_4_provisional_probe | 0 | 69 passed, 0 failed |

`node --check` on all 20 JS files: clean. **Unresolved test failures: none.** **Shell-related failures:** none exist in any run I can see. `shell_8_2` prints a problems list, not PASS lines, so my earlier "PASS=0" was a counting artefact; it also fails when `aria-current` is removed from a throwaway copy, so a clean result is meaningful. Earlier timeouts were a tool time limit on long foreground commands (environment). If you hold a specific failing output from another session, I have not seen it.
**What the passes do not show:** conformance to an approved URS; the probe was written against the *provisional* baseline and its per-field and rule checks only describe existing behaviour. Journeys 1–3 are reconstructions (originals never supplied). **Not run:** lint and build (none exist), other browsers/devices, screen readers, earlier-stage suites (not in the package). The informational `tests/stage8_4_closure_evidence.py` was also run (exit 0); it makes no assertions.

## 4. Files changed during this run
No application or test-assertion code changed. Documentation: `STAGE8_4_CLOSURE_REPORT.md` (new), `README.md` (stale "no code changed" corrected), `STAGE8_4_REQUIREMENTS_READINESS_REPORT.md` (supersession note added, original text kept), `STAGE8_4_PROVISIONAL_TRACEABILITY_ADDENDUM.md` (pointer to this report). New informational script: `tests/stage8_4_closure_evidence.py`.

## 5. Outstanding blockers and the evidence needed
| Blocker | Items | Evidence needed |
|---|---|---|
| Approved URS v2.0 missing | T1–T17 | The approved document (or signed extract with requirement IDs and version) |
| Mandatory fields and validation rules | T1–T4 | Field list with formats, ranges, accepted document types |
| Duplicate-guest rule | T5 | Definition of "duplicate" (key fields, time window, block vs warn) |
| Authentication and authorisation model | T6–T8 | Whether authentication is required at prototype/pilot/production; identity provider; where enforcement must live |
| Establishment isolation | T9 | Whether the hotel portal must support several establishments; a multi-establishment data model to test |
| Lifecycle and submission rules | T10–T11 | Documented states, transitions, and reporting acknowledgement/rejection rules |
| Audit requirements | T12–T13 | Required event list, tamper-resistance, retention, export |
| Data handling and reporting | T14–T17 | Masking rules, purposes, report categories/formats/deadlines, retention, residency |

## 6. Cautions for any reader of the PASS counts
Masking and permission checks are front-end only; the audit trail is volatile and mutable from the console; there is no authentication; every integration outcome is scripted. None of that is a regression: it is the documented nature of the prototype, but it must not be read as compliance.

## 7. Stage 8.5
Not started and untouched.
