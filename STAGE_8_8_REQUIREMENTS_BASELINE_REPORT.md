# Msafiri — Stage 8.8 Requirements Baseline & Decision Closure Report
Prototype only. Synthetic data; every government, National Police, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. **Stage 8.8 is documentation-only.** No application source, test, data, schema, authentication, permission, workflow or integration was changed. Nothing here establishes production readiness, regulatory compliance, approved requirements or formal approval.

## 0. Status at a glance
| | |
|---|---|
| **Stage 8.8 result** | **BLOCKED on the approved requirements baseline.** The documentation work that can be done without it (search, inventory, decision register) is complete. No decision has been closed. |
| **BLOCKER B1** | **The approved URS v2.0 is not available** in the project, the workspace or any upload. It has not been read, reconstructed or substituted. |
| **BLOCKER B2** | No approved roadmap, stage plan or acceptance-criteria document exists. |
| **Decision owner** | No project file names one (B3). The requester has named "Joy Sir"; his role/authority is not documented in the repo, so no decision is attributed to him. |
| **Register** | `STAGE_8_8_DECISION_REGISTER.md`: 33 items — 19 `OPEN — BLOCKED (SOURCE REQUIRED)`, 14 `OPEN — DECISION REQUIRED`, 0 approved. |

## 1. Search performed (commands and actual results)
| Search | Result |
|---|---|
| Filesystem-wide `find` for files named `*urs*`, `*requirement*`, `*.docx`, `*extract*` (excluding system/library paths) | Only copies of `STAGE8_4_REQUIREMENTS_READINESS_REPORT.md` (a report, not a requirements document). **No `.docx`, no URS, no extract.** |
| `ls /mnt/user-data/uploads` | Only `msafiri-prototype-stage8-6.zip` (the application project). |
| `grep -rIl URS` in the 8.7 package | 22 files, all of them reports, tests or code comments stating the URS is unavailable. None is a URS. |
| `grep -rIoh "MSF-…|MSAFIRI-URS…"` | Only `MSF-FR-002/005/013/015/016`, `MSF-NFR-001/003` and `MSAFIRI-URS-PROVISIONAL-2.0` — all inside Stage 8.4 reports and `tests/stage8_4_provisional_probe.py`, and all **provisional** (see §2). |
| Search of `*.md` for decision records, sign-offs, approvers, sponsors | None found. Matches were prose such as "signed extract" or "decision to confirm". |
| Search for "Joy" in `*.md`, `*.js`, `*.html` | No match as a stakeholder (one unrelated synthetic contact name "Joyce Temba" in `js/admin-data.js`). |
| `/mnt/transcripts` | Exists but is empty (0 entries). |
The README names `Msafiri_National_Guest_Registration_URS_v2.0-1.docx` as the missing document; no such file exists in the project.

## 2. Requirement identifiers in the project
- **Approved URS IDs: none exist in the repo.**
- **Provisional IDs (`MSF-FR-nnn`, `MSF-NFR-nnn`)** come from `MSAFIRI-URS-PROVISIONAL-2.0` (v2.0-P, 21 Oct 2026), which describes itself as "DRAFT — NOT THE ORIGINAL APPROVED URS", built from review screenshots, approval pending. Its .docx is **not in the project package**; only the Stage 8.4 addendum quotes it. It is **not** used as a baseline in this stage (B4 asks the stakeholder what to do with it).
- **`T1`–`T21`** are traceability rows created in `STAGE8_4_CLOSURE_REPORT.md`, not requirements. T1–T17 are BLOCKED — SOURCE REQUIRED; T18–T21 are VERIFIED against *project rules stated in stage prompts* (no real integrations, synthetic labelling, no shipped secrets), not against a URS.
- **`CAP-nn`** labels in `STAGE8_4_REQUIREMENTS_READINESS_REPORT.md` are capability labels with no authority.
- **`B`, `P`, `X`, `A` IDs** in the new register are tracking labels created in this stage. They are not requirement IDs.

## 3. Stage 8.7 audit review → unresolved decisions
All unresolved items from `PROJECT_COMPLETION_AUDIT.md` §5C are carried into the register, plus the Stage 8.7 technical assumptions:
- **T1–T17** — each has its own row (question, evidence needed, current state, status, impact, source).
- **Six placeholder pages (P1–P6):** Hotel › Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports; Admin › Connector Status. Confirmed in this stage by rendering the navigation: these are the only six nav items with no registered page (script check from the 8.7 audit, `hotel/check-in`, `hotel/in-house`, `hotel/stay-changes`, `hotel/pms`, `hotel/compliance`, `admin/connectors`).
- **Other open items X1–X5:** unknown-id fallbacks (L4), alert/bell scope (L5), "Test connection" on disabled integration (L8), unsaved form handling, default export permission.
- **A1:** Stage 8.7's own technical choices (two-part name, 80/20-character bounds, 1–200-character cancel reason, retry only from Rejected) are implemented but unapproved.
- **Baseline items B1–B4.**
**Correction to the earlier audit:** `PROJECT_COMPLETION_AUDIT.md` §5D listed Stage 7.1 item M1 as "recorded open, not re-verified". A code comment in `js/store.js` ("Stage 7.2: refresh a hotel page whose re-render was skipped because a dialog was open") indicates it was addressed in Stage 7.2. This was **not re-tested here**, so its status is "believed addressed, not re-verified". The audit file was left unedited to preserve history.

## 4. What this stage does NOT provide
No approved requirement is verified; no conformance claim is made; the prototype remains non-production (no backend, authentication, server-side authorisation, tamper-resistant audit, persistence, retention/encryption, or real integrations). No integration with any real government, National Police, identity-provider or PMS system exists or is claimed.

## 5. Integrity checks executed (commands run in `msafiri-prototype/`; results as observed)
| # | Check | Result |
|---|---|---|
| C1 | `diff -rq <verified 8.7 package> . -x '*.md'` | No differences (exit 0) |
| C2 | `diff -rq <verified 8.7 package> . \| grep '\.md'` | Only new files `STAGE_8_8_DECISION_REGISTER.md` and (at that moment) `PROJECT_COMPLETION_AUDIT.md`, which was already in the audit package, not part of the 8.7 ZIP |
| C3 | `node --check` on every `js/*.js` and `js/pages/*.js` | 20 of 20 OK |
| C4 | `sha256sum` of `index.html`, `css/*.css`, `js/**/*.js`, `tests/*.py` compared with the 8.7 package | 42 files, identical |
| C5 | Register contains rows T1–T17 and P1–P6 | All present; 33 rows in total |
| C6 | Every register row has the expected 9 columns | No malformed rows |
| C7 | Every `STAGE*.md` file cited in the register exists | All 9 exist |
| C8 | Scan of the register for secret patterns and URLs | None found |
Final-ZIP checks (open, file list, byte-comparison with the working tree, secret/URL scan of all three new/changed documents) are recorded in §6.
**Not run:** the Playwright suites. The application is byte-identical to the build that passed 14 suites with 0 failures in the post-8.7 audit, so they were not repeated; no new test result is claimed for this stage. No lint/build exists.

## 6. Final package verification
See the delivery message; the checks are repeated there against the actual ZIP.

## 7. Files created / modified in Stage 8.8
Created: `STAGE_8_8_REQUIREMENTS_BASELINE_REPORT.md`, `STAGE_8_8_DECISION_REGISTER.md`. Modified: `README.md` (Stage 8.8 note only). No other file differs from the 8.7 package apart from `PROJECT_COMPLETION_AUDIT.md`, which was added in the preceding audit step and is included unchanged.

## 8. Recommended next step
Send `STAGE_8_8_DECISION_REGISTER.md` to the authorised stakeholder (Joy Sir, if he is that person — B3) with a request for: (1) the approved URS v2.0 or a signed extract (B1); (2) any approved stage plan (B2); (3) a recorded decision, approver and date for each row. **Do not start Stage 8.9 or any implementation until at least B1/B2 are answered or the stakeholder explicitly approves a scope.**
