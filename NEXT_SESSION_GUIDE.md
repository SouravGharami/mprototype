# Msafiri — Next Session Guide

Prototype only; synthetic data; all integrations simulated. This guide invents no stage, requirement or approval. It states what to read and the safe order of work **once** authoritative inputs exist. Today none do.

## 0. Gate — do not start implementation until all are true
1. The approved URS v2.0 (or signed extract with requirement IDs, version, date, approval record) is in the project (B1).
2. An approved roadmap / stage plan with acceptance criteria exists, or the authorised stakeholder has explicitly approved a scope in writing (B2).
3. The authorised approver is named with role (B3), and the status of `MSAFIRI-URS-PROVISIONAL-2.0` is decided (B4).
4. Each decision to be implemented has a completed response block (decision, name, role, date, source) in `STAGE_8_9_STAKEHOLDER_APPROVAL_PACKAGE.md`, or an equivalent signed record.
If any is missing, stop and work only on documentation. A message template is in `MSAFIRI_APPROVAL_ACTION_CHECKLIST.md` §6.

## 1. Files to inspect first, in this order
1. `MSAFIRI_HANDOVER_REPORT.md` — current verified state, test totals, gaps.
2. `MSAFIRI_APPROVAL_ACTION_CHECKLIST.md` — blockers, who/what/blocked work.
3. `STAGE_8_8_DECISION_REGISTER.md` — 33 items with exact IDs and wording.
4. `STAGE_8_9_STAKEHOLDER_APPROVAL_PACKAGE.md` — where answers are recorded.
5. `STAGE_8_8_REQUIREMENTS_BASELINE_REPORT.md` — what was searched and not found.
6. `STAGE8_4_CLOSURE_REPORT.md` and `STAGE8_4_PROVISIONAL_TRACEABILITY_ADDENDUM.md` — T1–T21 trace rows (provisional baseline).
7. `STAGE_8_7_REPORT.md`, `PROJECT_COMPLETION_AUDIT.md` — last code change, module and workflow inventory.
8. `README.md` — "Important: URS status" and per-stage notes.
Code, when needed: `js/store.js` (state, `S.validateReg`, `S.guard`, lifecycle), `js/pages/hotel.js`, `js/data.js`, `js/admin-data.js`, `js/nav.js` (placeholder routes), `js/app.js`.

## 2. Safe next steps (once the gate is met)
1. **Record inputs.** Place the approved URS/extract and decision records in the project (a new documents folder); update the register status per item using the "How to close an item" rule. Do not edit history in old reports.
2. **Reconcile.** Compare the approved URS with `MSAFIRI-URS-PROVISIONAL-2.0` IDs and the T1–T17 rows; write a gap list (documentation only) and get it confirmed.
3. **Scope.** From approved items only, write a scope with acceptance criteria *before* editing code. Unapproved items stay out.
4. **Baseline tests.** Re-run all 14 suites (§3) on a fresh extraction and confirm 0 failures before any change.
5. **Implement in small increments**, one approved decision at a time; typical mapping: P1–P6 → build/merge/remove per decision (`js/nav.js`, `js/pages/*`); T1–T5 → `S.validateReg`, form and data lists; T6–T9/T15 → authentication and permissions (needs a real architecture decision first, not front-end only); T10–T11 → lifecycle and submission rules in `js/store.js`; T12–T14 → audit and masking; T16–T17 → reporting and data handling; A1 → keep or change the 8.7 bounds; X1–X5 as decided.
6. **Test.** Add tests that fail on the old behaviour, update tests that encoded unapproved assumptions only with the approval reference, re-run all suites, and report actual counts.
7. **Document.** Update the register, checklist, README and a new report; list changed files; keep prototype/synthetic labelling unless real systems are genuinely introduced and separately approved.
8. **Package** and verify (below).

## 3. Commands
From the extracted `msafiri-prototype/` (needs `pip install playwright` and Chromium):
```
for f in js/*.js js/pages/*.js; do node --check "$f"; done
PYTHONDONTWRITEBYTECODE=1 python3 tests/<suite>.py
```
Suites: stage8_7_workflow_hardening, stage8_6_residual_verification, stage8_5_labelling_and_scan, audit_smoke, security_audit, ui_polish, functional_8_2, workflow_8_2, shell_8_2, journey_4_auth_permissions, journey_5_integration_transparency, journeys_1_3, stage8_4_provisional_probe, stage8_4_closure_evidence. Expected today: counters as in the handover report §3, 0 failures.

## 4. Packaging checklist
`unzip -t`; file list; no `.env`, credentials, nested ZIPs, `__pycache__`/`.pyc`; extracted tree `diff -r` equal to the working tree.

## 5. Do not
Invent or reconstruct the URS or an approval; attribute any decision to Joy Sir without his recorded response; claim production readiness, compliance or real integrations; change code, schema, authentication, permissions, workflows, integrations or demo data without an approved item; call this prototype's role checks or audit list production-grade.
