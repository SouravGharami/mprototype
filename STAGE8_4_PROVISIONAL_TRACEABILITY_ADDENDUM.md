# Msafiri — Stage 8.4 Addendum: Provisional Traceability (MSAFIRI-URS-PROVISIONAL-2.0)
Prototype only. Synthetic data; every government, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. Not production-ready; no certification claimed. **Stage 8.5 was not started.**

> **Reconciliation note:** "Implemented / Partial" in §3 are judged against the *provisional, unapproved* wording only and must not be read as approved-requirement compliance. The decision-grade table, using the statuses VERIFIED / FAILED / BLOCKED — SOURCE REQUIRED / NOT IMPLEMENTED, is in `STAGE8_4_CLOSURE_REPORT.md`.

## 1. Source-document status (read first)
- The **original approved URS v2.0 (October 2026) is still NOT available.** It has not been read and is not verified against.
- Supplied instead: `MSAFIRI_Provisional_URS_v2_0_Reconstructed.docx` (id `MSAFIRI-URS-PROVISIONAL-2.0`, version 2.0-P, 21 Oct 2026). It describes itself as **"DRAFT — NOT THE ORIGINAL APPROVED URS"**, built from "summaries visible in prior Stage 8.1–8.4 review screenshots", approval **pending**, "for a provisional code audit only".
- It was therefore used **only as a provisional baseline**. Every `MSF-FR-nnn` / `MSF-NFR-nnn` below is **provisional — stakeholder confirmation required**. A PASS here does **not** show conformance to an approved requirement.
- The provisional baseline does not define "Stage 8.4". Stage 8.4 is taken to be what the repo's own previous report says it is: requirements traceability and readiness, plus fixes for defects found against the baseline. If the original 8.4 brief differed, it has not been seen.

## 2. Defect found and fixed (MSF-FR-005, MSF-FR-002, MSF-FR-016, MSF-NFR-003 — provisional)
**Defect:** the record dialog hides Amend / Cancel / Check out where they are not allowed, but `store.js` did not enforce the same rules. A direct call could cancel a Checked-out record, check out a Cancelled/Expected record, amend a Cancelled record, or amend with departure on/before arrival or an empty room — and the UI then showed a success toast regardless. **Not reachable through the normal UI**; it is a defence-in-depth / consistency gap.
**Fix (small):** `S.checkOut`, `S.cancel`, `S.amend` now apply the same status rules the dialog uses (+ the amend date/room rule), return `true`/`false`, and a refusal writes an "Action blocked" audit entry and an error toast (new helper `S.refuse`). The three success toasts in `hotel.js` now show only when the store returns `true`.
**Not changed:** no new business rule. Permission refusal behaviour is as before (now also returns `false`).

## 3. Provisional traceability matrix
Status vocabulary per baseline §9. "Implemented" = verified in code **and** by an executed test, *against the provisional wording only*.
| ID | Provisional requirement | Status | Evidence actually run | Gap |
|---|---|---|---|---|
| FR-001 | Structured registration form | Partial | workflow_8_2, journeys_1_3 | Mandated field set unknown |
| FR-002 | Field validation | Partial | workflow_8_2; **new probe** (amend date/room at store level) | DOB plausibility (e.g. 1800 accepted) and format rules not defined — not invented |
| FR-003 | Review before confirm | Implemented | workflow_8_2 | — |
| FR-004 | Search & filters | Implemented | functional_8_2, journeys_1_3 | Supported fields list unknown |
| FR-005 | Record lifecycle | Partial | workflow_8_2; **new probe** (UI actions per status; store guards on check-in, check-out, cancel, amend) | Documented lifecycle unknown; no duplicate-guest rule; separate Check-in / In-house / Stay-changes pages are placeholders |
| FR-006 | Establishment context / no cross-establishment view | **Not Verified** | — | Hotel portal runs on one synthetic establishment; no multi-establishment user isolation exists to test |
| FR-007 | Hotel dashboard from record data | Implemented | functional_8_2, **new probe** (Pending card = Pending+Submitted+queue) | — |
| FR-008 | Government review view | Partial | journeys_1_3, security_audit | Simulated; only PIL-001 reads live store |
| FR-009 | Reports/exports consistent; simulated labelled | Partial | journey_5 (zero network calls, labelled), Stage 6.x checks (not re-run, not in package) | Export disabled for all seeded roles; most figures are samples |
| FR-010 | Audit history | Partial | security_audit, journey_4; **new probe** (check-in, amend, cancel-with-reason, check-out each write audit entries naming the acting demo user; blocked/denied attempts audited) | Audit is volatile in-tab list; not tamper-evident |
| FR-011 | Role-based access beyond hidden menus | Partial | security_audit (31), journey_4 (28); **new probe** as read-only hotel user USR-004 (route denied, no form, direct store calls refused and audited) | **Front-end only**; trivially bypassable; no server |
| FR-012 | Authentication state communicated honestly | Implemented | **new probe** (no password field on any route; menu says "Acting as (demo user)" and "Sign out — Not available in prototype" in all 3 portals) | No real authentication exists |
| FR-013 | Offline queue counts consistent | Implemented | **new probe** (nav badge = store = queue rows; dashboard card; at seed, offline+check-in, after sync) | Tab-memory only |
| FR-014 | Integrations labelled simulated | Implemented | journey_5 (48) | — |
| FR-015 | Demo data labelled | Partial | **new probe** (all 3 dashboards labelled) | Other pages not exhaustively swept |
| FR-016 | Failed actions don't show success | Partial | **new probe**; 3 lifecycle toasts now gated | Other actions not audited for this |
| FR-017 | Navigation consistency | Partial | shell_8_2, ui_polish, audit_smoke route sweep | 6 placeholder ("Soon") pages |
| FR-018 | Data consistency | Partial | functional_8_2 (hotel/gov/reports agree after check-in) | Non-live figures are samples |
| NFR-001 | Access control in app logic, no secrets | Partial | security_audit; **new probe** (read-only user sees no write actions; full document numbers not displayed in hotel list/dialog) | CSP is a `<meta>` tag; masking is display-only |
| NFR-002 | Synthetic data only | Implemented (by design) | security_audit | No scan for real PII beyond earlier audits |
| NFR-003 | Reliability / no corruption | Partial | **new probe** | Lifecycle gap fixed (§2); concurrency not applicable |
| NFR-004 | Usability / responsive | Partial | ui_polish | No accessibility conformance, screen-reader or other-browser testing |
| NFR-005 | Traceability | Partial | this addendum | Real IDs pending approved URS |
| NFR-006 | Maintainability | Implemented | 2 app files changed (+1 test) | — |
| NFR-007 | Integrations mocked | Implemented | journey_5 | — |
| NFR-008 | Honest status reporting | Partial | this addendum | — |
No row is "Missing" or "Blocked" on the provisional baseline's own terms; items depending on the §8 unknowns (laws, mandatory fields, roles, schema, auth, retention) are **Blocked on stakeholder decisions**.

## 4. Tests and checks actually executed (Chromium 141 via Playwright, `file://`, synthetic data)
Final run on the final code, each exit code 0: audit_smoke 24/24 · security_audit 31/31 · ui_polish 20/20 · functional_8_2 27/27 · workflow_8_2 23 PASS lines, 0 failed · shell_8_2 PROBLEMS 0 (see §6: it reports a problems list, not PASS lines) · journey_4 28/28 · journey_5 48/48 · journeys_1_3 32/32 · `tests/stage8_4_provisional_probe.py` **69/69**. `node --check` on all 20 JS files: clean.
**Negative controls:** the probe fails 12 checks on the original code (round 1) and exactly 3 on the round-1 code (round 2: check-in revival ×2, Start check-in shown to a read-only user); none on the final code. `shell_8_2` was also shown able to fail: with `aria-current` removed in a throwaway copy it reports problems.
**Not run:** lint (no tooling), a build (none exists), other browsers/devices/screen readers, earlier-stage suites (not in package). The first attempt at a pre-change baseline was cut off by a tool time limit and its partial logs were not used.

## 5. Remaining Stage 8.4 work
1. Obtain the **approved URS v2.0**, replace `MSF-*` labels with real IDs, re-run this audit.
2. Stakeholder decisions listed in provisional baseline §8 (mandatory fields, DOB rule, duplicates, roles, retention, auth, reporting schema).
3. FR-006 cannot be tested until a multi-establishment hotel model exists or is ruled out of scope.

## 6. Final verification round (continuation of Stage 8.4)
**Reported "shell-related failures":** none found. `shell_8_2.py` clicks all 38 sidebar links (hash + `aria-current` + title), 5 breadcrumb targets, brand/portal switch, search, user menu, modal dismissal four ways, bell routes for 3 portals, back/forward and unknown routes; it exited 0 with "PROBLEMS 0" in both full runs. The earlier "PASS=0" was my log-counting artefact (the script prints a problems list, not PASS lines). Another earlier "failure" was a tool time limit on a long foreground command (environment limitation, not an app or test defect). Three probe failures in round 1 and one in round 2 were **probe defects**, fixed.
**Two further defects fixed (same class as §2):**
1. `S.checkIn` accepted the `ref` of an existing record and set it to Checked in, so a direct call could revive a Cancelled / Checked-out record. It now refuses unless the record is Expected/Draft (the rule the dialog already applies), returns `null`, audits and toasts. The UI handler already tolerated `null`.
2. The record dialog offered **Start check-in** to a user without `registration:create` (it led only to a Not-permitted page). It is now hidden for such users, matching how Amend/Cancel/Check out are already gated.
**Characterised, not mandated:** the required-field checks assert the messages the code *already* produces (10 fields, future DOB, document-number format, departure after arrival). They do **not** show these are the approved mandatory fields or rules.
**Observation, not changed (needs confirmation):** an unknown route with no portal (`#/nope`) silently redirects to the hotel dashboard, whereas `#/hotel/nope` shows "Page not found". Whether this is acceptable under FR-017 is unconfirmed.
**Authentication / isolation:** there is no authentication (an "Acting as" switch only). Permission checks and masking are front-end only; full values are in browser memory. Hotel-to-hotel isolation (FR-006) cannot be tested because only one establishment exists.
