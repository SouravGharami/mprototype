# Msafiri — Final Gap-Closure Report (22 Oct 2026)

**Prototype only. Not production-ready.** Synthetic data; all integrations simulated; no compliance or approved-requirements coverage is claimed (the approved URS v2.0 was never supplied).

## 1. Gap checklist (what was inspected and how each item is classified)
Classes: **CD** confirmed defect · **IP** incomplete prototype feature · **SD** needs stakeholder decision · **PO** production-only requirement.

| # | Area | Finding | Class | Action |
|---|---|---|---|---|
| 1 | Hotel dashboard | Donut subtitle said "All registrations in the current period" but counts only the 8 records with a submission status (card says 13 total) | CD (misleading label) | **Fixed** |
| 2 | Placeholder pages (6) | Menu items open a generic wireframe saying nothing about what exists; scope undecided (P1–P6) | IP + SD | **Improved:** still labelled planned; now link to existing simulated screens. **Not built** (needs P1–P6) |
| 3 | Test suites | 5 false failures when all 15 suites ran in parallel (5 s page-load timeouts) | CD (test-run guidance) | **Fixed:** `run_tests.sh` runs 3 at a time; README warns |
| 4 | Hotel / Gov / Admin workflows, navigation, forms, validation, tables, search, responsive | No broken navigation, dead control or console error found by route sweep and suites at 1366/768/390/320 px | — | None needed |
| 5 | Search breadth (hotel list lacks document-number/date filter) | Field list not approved | SD (T1/T4/T15) | Not changed |
| 6 | Validation rules (e.g. DOB 1800 accepted), duplicate-guest rule | Rules as built, not approved | SD (T1–T5, A1) | Not changed |
| 7 | No per-record establishment ownership (G1) | Only reachable via console; model needs T9 | SD | Not changed |
| 8 | Government figures other than Demo Hotel A are fixed samples | Labelled as sample | IP + SD (T16) | Not changed |
| 9 | Report export disabled for every seeded role | Role decision | SD (X5, T7) | Not changed |
| 10 | Authentication, server-side authorisation, persistence, tamper-evident audit, retention, encryption, real integrations | Do not exist | PO | Not changed; stated in README |
| 11 | `gov/dashboard` registered twice (dead block in `js/pages/dashboards.js`) | Harmless, overwritten by `gov.js` | Housekeeping | Left as is (low value, non-zero risk) |
| 12 | Toast error-message honesty (31 call sites), accessibility, other browsers, screen readers, keyboard-only | Not exhaustively verified | Unverified | Not verified |

## 2. Working features (all simulated, synthetic) and known limitations
**Hotel (7 live of 12 items):** dashboard; guest registration with validation, simulated scan and PMS prefill, review/confirm; registrations list with search, status filter, record dialog (check-out, amend, cancel with reason, history, masked document number); submission status/history with retry for Rejected; offline queue, sync and conflict review; establishment profile; staff list.
**Government (7 of 7):** overview; establishment monitoring; submission and data quality; purpose-bound guest search with masking and audited unmasking; audit history; reporting alerts; reporting and trends with details and permission-gated CSV export.
**Admin (18 of 19):** users; roles and permissions; establishments; reference data; configuration with maker-checker approvals; integration dashboard and event history; developer portal, sandbox and webhooks; audit logs; notifications; support incidents; exceptional access; toolkit.
**Placeholders (6):** Hotel › Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports; Admin › Connector Status.
**Limitations:** no backend or persistence (reload resets); role checks are frontend-only and bypassable; audit is in-memory; only Demo Hotel A reads live state; document number ending in 9 is rejected by the simulated interface (demo rule); other browsers, screen readers and keyboard-only use not tested.

## 3. Files changed
`js/app.js`, `js/pages/dashboards.js`, `css/components.css`, `README.md`; new: `tests/final_gap_closure.py`, `run_tests.sh`, this report. Existing tests were not modified.

## 4. Exact test results (headless Chromium via Playwright 1.56, `file://`, Node 22 `node --check`)
**Baseline before changes, all 15 suites started in parallel:** 5 failures, all timing-related: three suites (journey_4, journey_5, journeys_1_3) hit `Page.goto: Timeout 5000ms` and produced no results; `stage8_5_labelling_and_scan` 52/1 and `stage8_6_residual_verification` 22/1 each failed one check on `#/hotel/dashboard`. Rerun one at a time on the **unchanged** code, all five passed (28, 48, 32, 53, 23). Conclusion: load-sensitive test timing, not application regressions. The `#/hotel/dashboard` failures under heavy load are not root-caused.

**After changes, `./run_tests.sh` (3 at a time):** `node --check` on 20 JS files: all OK.
| Suite | Result |
|---|---|
| final_gap_closure (new) | 42 passed, 0 failed |
| functional_8_2 | 27 / 0 |
| audit_smoke | 24 / 0 |
| journeys_1_3 | 32 / 0 |
| journey_4_auth_permissions | 28 / 0 |
| security_audit | 31 / 0 |
| journey_5_integration_transparency | 48 / 0 |
| stage8_4_provisional_probe | 69 PASS, PROBLEMS 0 |
| shell_8_2 | PROBLEMS 0 |
| stage8_7_workflow_hardening | 49 / 0 |
| stage8_6_residual_verification | 23 / 0 |
| stage8_9_traceability_probe | 52 / 0 |
| workflow_8_2 | 23 passed, failed: 0 |
| ui_polish | 20 / 0 |
| stage8_4_closure_evidence | exit 0 (evidence printer, no counter) |
| stage8_5_labelling_and_scan | **52 passed, 1 failed** in the runner (`#/hotel/dashboard` top-of-page label check at phone width, under load); **53 / 0 when rerun alone** |

Skipped tests: none. Counted checks with counters, using the 8.5 suite's standalone result (53/0): 479 existing + 42 new = 521 passed, 0 failed (the runner's own 8.5 result was 52/1; shell_8_2, stage8_4_closure_evidence and the PROBLEMS-0 line of stage8_4_provisional_probe are not additional counters).
**Not verified:** lint/type-check/build (none exist); Firefox, Safari, Edge, real devices; screen readers; keyboard-only walkthrough; accessibility conformance; toast message honesty audit; any real integration.

## 5. Remaining blockers and decisions requiring stakeholder approval
Unchanged from `STAGE_8_8_DECISION_REGISTER.md`, none approved: **B1** approved URS v2.0 or signed extract; **B2** approved roadmap/acceptance criteria; **B3** authorised approver; **B4** status of the provisional URS; **T1–T17** requirement decisions (fields, validation, duplicates, authentication, roles, enforcement, establishment isolation, lifecycle, submission rules, audit, masking, access, reporting, data handling); **P1–P6** the six placeholder pages (build, merge or remove); **X1–X5**; **A1** Stage 8.7 technical bounds. Production would additionally need a real backend, authentication, server-side authorisation, persistence, audit integrity, security assessment and legal review.

## 6. Completion status
Partially complete by design: the prototype is stable and demonstrable, two confirmed low-risk defects fixed, test-run guidance corrected. Remaining gaps are blocked on decisions or are production-only. One check (`stage8_5` phone-label on `#/hotel/dashboard`) is load-sensitive and fails in the runner on some runs.
