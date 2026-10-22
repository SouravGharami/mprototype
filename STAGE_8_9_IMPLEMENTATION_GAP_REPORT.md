# Msafiri — Stage 8.9 Implementation Gap Report

Baseline: `MSAFIRI-URS-PROVISIONAL-2.0` — **draft, not approved, not the original URS**. Prototype only; synthetic data; all integrations simulated; not production-ready. Row-level evidence is in `STAGE_8_9_TRACEABILITY_MATRIX.md`; probe check IDs (A1, B4 …) come from `tests/stage8_9_traceability_probe.py`. No application code was changed.

## 1. Portal inventory (verified by a route sweep of all 38 navigation items)
| Portal | Nav items | Live pages | Placeholders ("Soon", `Planned module` template) |
|---|---|---|---|
| Hotel | 12 | 7 — Dashboard, Guest Registration, Registrations, Submission Status & History, Offline Queue & Sync, Establishment Profile, Staff & Users | **5** — Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports |
| Government | 7 | 7 — Overview, Establishment Monitoring, Submission & Data Quality, Guest Record Search, Audit & Access History, Reporting Alerts, Reporting & Trends | 0 |
| Admin | 19 | 18 | **1** — Connector Status |

Sweep results (A1–A11): the six placeholders are exactly the six already in the register (P1–P6); no other route is unregistered; no console/page errors; no non-file network request; no horizontal scroll at 375px; a mobile navigation control exists; no password field anywhere. **No broken navigation was found.** Menu presence ≠ implementation: the six placeholder items sit in the live menu and show only a template. `OpenAPI & Sandbox` intentionally redirects into the Developer module (`#/admin/developer/sandbox`); this is deliberate (Stage 8.2), not a defect.

**Simulated (by design, labelled):** document scan/OCR, PMS prefill, government submission and acknowledgement (document number ending 9 is rejected), offline sync/conflicts, notifications, report CSV export, webhooks, API sandbox, integration health/events, exceptional access, config approvals. **Live in the shared store:** only Demo Hotel A (PIL-001) records; every other establishment's figures, all government dashboard/report totals, and the directory metrics are fixed samples.

**Incomplete workflows:** hotel check-in/in-house/stay-change dedicated flows (only the record dialog exists); PMS fallback and hotel compliance reporting (none); connector monitoring (Integration Dashboard exists instead); government export (disabled for every seeded role); establishment isolation (absent, see G1); real authentication (absent by design).

## 2. Prioritised gaps
Priority per the brief: **P1** registration, validation, review, search, lifecycle, establishment context; **P2** hotel dashboards, government review, consistent reporting, audit visibility; **P3** role/access, error handling, responsive navigation, integration transparency. "Needs decision" = cannot be fixed without an authorised answer (register ID shown); nothing below is approved.

### P1
| Gap | Requirement | Evidence | Fix type | Needs decision |
|---|---|---|---|---|
| **G1 No per-record establishment ownership; no data isolation.** Records have no establishment field (B2). Acting as a user of another establishment (set via console) shows the same 13 Demo Hotel A records while the header names the other establishment (B4, B5). Not reachable through the normal UI because only PIL-001 users are selectable (B3). | FR-006 | `js/store.js` seed; `js/admin-data.js` `R.eligible`, `R.syncPersonas` | Small hardening is possible without new business rules (reject non-PIL-001 hotel acting users in `R.actAs`; label the single-establishment limit). A real multi-establishment model (owner field, scoped queries, tests) is larger. | Model: **T9** |
| **G2 Lifecycle pages are placeholders:** Check-in, In-House Guests, Check-out/Amend & Cancel; actions exist only in the record dialog. | FR-005, FR-017 | A2, A3 | Build / merge / remove per decision | **P1, P2, P3**; lifecycle **T10** |
| **G3 Search is narrow.** Hotel list searches name, reference, room, nationality and one status filter; no document-number, stay-status or date filter (D3). "Supported fields" undefined. Government search purposes are placeholders. | FR-004 | `hotel.js` table `searchKeys`; `gov.js`; `js/ops.js` | Add filters once the field list is approved | **T1/T4, T15**, purposes list |
| **G4 Validation rules are what was built, not approved:** DOB 1800-01-01 accepted (C4); document types placeholder; 8.7 length/name rules unapproved. | FR-001, FR-002 | `S.validateReg` | Rule changes after approval | **T1–T4, A1** |
| **G5 No duplicate-guest rule.** | FR-005 | register T5 | Rule + tests after definition | **T5** |
| **G6 No "review" lifecycle action** (provisional text lists "create, amend, cancel, or review"). Review before confirm exists (FR-003); a record-review action does not. | FR-005 | — | Clarify intent first | **T10** |

### P2
| Gap | Requirement | Evidence | Fix type | Needs decision |
|---|---|---|---|---|
| **G7 Hotel-side Compliance & Reports and PMS pages missing.** | FR-009, FR-005 | A2 | Build after scope | **P4, P5, T16** |
| **G8 Government figures are samples, not derived from one rule set.** Reports/dashboard/other establishments are fixed values; only PIL-001 agrees with the store. Per-count inclusion rules not shown on every figure. | FR-018, FR-009, FR-008 | `gov/reports` (12,280 sample), `gov/establishments` | Derive more from the store, or label each sample; document status inclusion | **T16** |
| **G9 Audit is volatile and not tamper-evident;** required events/retention/export undefined. | FR-010 | `S.audit` array | Persistence/immutability only after architecture decision | **T12, T13, T17** |
| **G10 Export unusable by default** (no seeded role holds `reports:create`). | FR-009 | F5 | Role decision | **X5, T7** |

### P3
| Gap | Requirement | Evidence | Fix type | Needs decision |
|---|---|---|---|---|
| **G11 Access control is front-end only** (route guard + store guard; switchable and mutable from the console, E4). | FR-011, NFR-001 | `S.guard`, `M.dir.denied` | Needs a server-side design; prototype cannot satisfy it | **T6–T8** |
| **G12 Error-message honesty not exhaustively audited:** 31 toast call sites; only Hotel lifecycle/retry/export/permission paths tested. | FR-016 | grep of `toast.success` / `M.toast[` | Targeted audit + tests (no new rules) | None |
| **G13 Unknown-route behaviour:** `#/nope` redirects to Hotel dashboard; `#/hotel/nope` shows "Page not found". | FR-017 | Stage 8.4 note | Decide fallback | **X1** |
| **G14 Accessibility/browser coverage not tested** (other browsers, screen readers, keyboard-only). | NFR-004 | — | Test scope decision | Standard to meet |
| **G15 Placeholder Connector Status.** | FR-017, FR-014 | A2 | Build/remove | **P6** |
| **G16 Maintainability:** `gov/dashboard` registered twice (dead "National Dashboard" in `js/pages/dashboards.js`); README header stale (Stage 6.4) and "Not yet built" section predates Stages 7–8. | NFR-006, NFR-008 | grep | Remove dead block; refresh README | None |

## 3. What is already sound (verified now)
Dashboard, registrations, submissions and queue badge agree with the store (D1, D6–D9); invalid and forbidden actions are refused, audited and not shown as success (E1–E3, F2); synthetic markers on all live pages (A5, keyword level) and seeded identifiers (G2, G3); zero network calls (A7); CSP meta (G1); honest authentication wording (A8, A9).

## 4. Not assessed
Jurisdictional rules, retention, residency, encryption, legal purposes, real identity or government integration — all out of scope and not assumed (baseline §8). Performance, availability, concurrency, persistence — nothing exists to test.

## 5. Recommended next stage
See `STAGE_8_9_REPORT.md` §6.
