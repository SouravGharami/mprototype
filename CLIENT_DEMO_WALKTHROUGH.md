# Msafiri — Client Demo Guide (prototype, 23 Oct 2026)
**Clickable prototype. Synthetic data only. All government, police, PMS, scan/OCR, webhook and export behaviour is SIMULATED. Not production-ready; no compliance or approved-URS conformance is claimed (URS v2.0 was never supplied).**

## Run (no install, no build)
Option A (simplest): open `index.html` in Chrome/Edge (works from `file://`).
Option B: from this folder run `python3 -m http.server 8080`, then open **http://localhost:8080**.
Reload resets all data. "Reset demo data" is in the user menu (top right). Switch portals in the left sidebar.

## Suggested 10-minute flow
1. **Hotel › Dashboard** (opens here): 13 synthetic registrations; point out the "Prototype data" banner and simulated submission statuses.
2. **Hotel › Guest Registration**: submit empty (validation shows); enter a fictional guest (e.g. "Test Guest", document number of 6–12 letters/digits, e.g. AB123456, valid dates); use simulated scan/PMS prefill if shown; Review → Confirm check-in. (Demo rule: a document number ending in 9 is later marked Rejected by the simulated interface — useful to show Retry in Submission Status; AB123456 is Acknowledged.)
3. **Hotel › Registrations**: search/filter; open a record (masked document number, history, check-out/amend/cancel with reason).
4. **Hotel › Submission Status & History**: retry is available only for Rejected submissions. **Offline Queue & Sync**: simulated offline/conflict review.
5. **Government Portal › Overview, Submission & Data Quality, Guest Search** (purpose required, masked results, audited unmasking), **Audit History**, **Reporting & Trends** (Export is disabled by default — role decision pending).
6. **System Admin › Users, Roles & Permissions, Integration Dashboard, Developer Portal/Sandbox, Audit Logs**.

## Avoid during the demo
*(Updated for Stage 9.0.)* The five Hotel items that used to be tagged SOON are now working demonstration pages. Only **Admin › Connector Status** is still a labelled placeholder (SOON).

## Truthful capability list
**Implemented (frontend, in-browser memory):** 3 portals; hotel dashboard, registration with validation, registrations list/record actions, submission history/retry, offline queue; government monitoring, search with masking/purpose, audit, reports; admin users/roles/establishments/config/approvals/integration dashboards/audit/incidents.
**Simulated:** every external system (government gateway, National Police, PMS, scan/OCR, webhooks, notifications, exports), authentication (demo role switch), submission outcomes.
**Not built / incomplete:** backend, real authentication and server-side authorisation, persistence, tamper-proof audit, real integrations, retention/encryption, 6 placeholder pages, government figures other than Demo Hotel A are fixed samples, Export disabled by default. Open decisions B1–B4, T1–T17, P1–P6, X1–X5, A1 remain unresolved.

## Checks actually run this session (headless Chromium via Playwright; Node syntax check)
- `node --check` all 20 JS files: clean.
- `./run_tests.sh` on a fresh extraction: all suites passed, 0 failures (e.g. final_gap_closure 42, stage8_7 49, journey_5 48, stage8_5 53, stage8_9 52).
- HTTP route sweep (38 routes × 1366/768/390/320 px): 0 not-found, 0 empty, 0 overflow, 0 console errors, 0 external requests.
- Hotel/Gov/Admin exploratory workflow script over HTTP: 9 pass, 0 fail.
- Not run: other browsers, screen readers, real devices, lint/build (none exist).
**No application code was changed; no critical demo-breaking issue was found.**
