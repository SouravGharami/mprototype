# Msafiri — Stage 8.9 Report: Provisional Requirements Traceability & Implementation Gap Audit

Prototype only. Synthetic data; every government, National Police, PMS, scan/OCR, webhook, sandbox, notification and export behaviour is **simulated**. **Not production-ready; no compliance, certification or stakeholder approval is claimed.** The baseline used is `MSAFIRI-URS-PROVISIONAL-2.0` (v2.0-P, 21 Oct 2026), a reconstructed **draft — NOT THE ORIGINAL APPROVED URS**; its approval table is entirely "Pending".

*Numbering note:* a document called "Stage 8.9 Stakeholder Approval Package" already exists. This audit reuses the label as requested; its files are distinct (`STAGE_8_9_TRACEABILITY_MATRIX.md`, `…IMPLEMENTATION_GAP_REPORT.md`, `STAGE_8_9_REPORT.md`).

## 1. Scope and inputs
Inspected: the complete project (final-handover ZIP, byte-identical to the previous delivery), `README.md`, Stage 8.7 report and completion audit, Stage 8.8 baseline report/register, Stage 8.9 approval package, handover report, and the supplied `MSAFIRI_Provisional_URS_v2.0_Reconstructed.docx` (read in full: 18 FR, 8 NFR, §5–§10). Application architecture and all functionality were preserved; **no application source, CSS, data, schema, authentication, permission, workflow or integration file was changed.**

## 2. Result
| | |
|---|---|
| Requirements mapped | 18 FR + 8 NFR = 26, each with evidence, status, remaining work and a confirmation flag (matrix) |
| Statuses | **Implemented 7** (FR-003, 007, 012, 013, 014; NFR-002, 007) · **Partial 19** · Missing 0 · Blocked 0 · Not Verified 0 |
| Portals | 38 nav items: 32 live, **6 placeholders**; no broken navigation, console errors or horizontal scroll found |
| Highest-priority gaps | G1 no per-record establishment ownership/isolation (FR-006); G2 lifecycle pages are placeholders; G3 narrow search; G4/G5 validation and duplicate rules unapproved; G11 front-end-only access control |
| Confirmed defect evidence | With the acting user set (via console) to another establishment's user, the Hotel portal shows the same 13 Demo Hotel A records under that establishment's name (probe B4, B5). Not reachable from the normal UI. Not fixed in this stage. |
"Implemented" means verified against the provisional wording only. Nothing is "Missing" or "Blocked" under baseline §9 because every confirmable-but-absent item is better described as Partial with the absent part named; items that depend on §8 unknowns are flagged "stakeholder confirmation required".

## 3. Checks actually run (Chromium via Playwright, `file://`, synthetic data, exit codes 0)
| Suite | Result |
|---|---|
| **stage8_9_traceability_probe (new, read-only)** | see §4 |
| stage8_7_workflow_hardening | 49 passed, 0 failed |
| stage8_6_residual_verification | 23 / 0 |
| stage8_5_labelling_and_scan | 53 / 0 |
| audit_smoke / security_audit / ui_polish | 24 / 31 / 20 passed, 0 failed |
| functional_8_2 / workflow_8_2 / shell_8_2 | 27 / 23 (`failed: 0 []`) / `PROBLEMS 0` |
| journey_4 / journey_5 / journeys_1_3 | 28 / 48 / 32 passed, 0 failed |
| stage8_4_provisional_probe | 69 PASS, `PROBLEMS 0` |
| stage8_4_closure_evidence | exit 0 (evidence printer, no counter) |
| `node --check` all 20 JS files | clean |
Totals with counters: 14 existing suites, **0 failures**. **Not run / not available:** lint, type-check, build (none exist); other browsers; screen readers; keyboard-only walkthrough; accessibility conformance; any real integration.

## 4. New test: `tests/stage8_9_traceability_probe.py`
Read-only; drives `index.html` and changes nothing. Sections: A route/placeholder/responsive sweep (38 routes at 1280px and 375px, errors, network, password fields, user menus); B establishment context; C form and validator; D search, filters, lifecycle consistency, queue badge; E access behaviour; F audit/report wording; G privacy hygiene; H documentation integrity (26 IDs, allowed statuses, provisional labelling, report files exist).
- **Final result: see the line "Final probe run" appended at the foot of this report.**
- **First run failed 7 checks (recorded honestly):** A9 ×3 and B2, B5 were **probe defects** (the menu text is upper-cased by CSS so `inner_text` did not match; `'est'` matched inside the word "guest"; the persona label lives in the user menu, not the page body) and were corrected; H4 ×2 failed only because the two documents did not exist yet. No application defect caused a failure.
- **Negative control:** adding one unregistered navigation item to a throwaway copy made the probe fail A1, A2 and A5 (plus the then-missing report file), so it can detect regressions.
- Several checks are **characterisations of known limits** (labelled LIMIT / DEFECT EVIDENCE: B2–B5, C4, D3, E4, F5); a PASS there confirms the limit exists. A5 is keyword presence only.

## 5. Files
Created: `STAGE_8_9_TRACEABILITY_MATRIX.md`, `STAGE_8_9_IMPLEMENTATION_GAP_REPORT.md`, `STAGE_8_9_REPORT.md`, `tests/stage8_9_traceability_probe.py`. Modified: `README.md` (one Stage 8.9 audit note). Unchanged: everything else (verified by `diff -rq` against the supplied ZIP, §7).

## 6. Recommended next stage (exact)
**P1 Gap-Remediation Stage (proposed label "Stage 8.11"; label only — renumber as the project owner prefers). Code stage; start only on the owner's explicit go-ahead.**
- **Tier A — may proceed without new business decisions** (enforces what the prototype already does; small, tested): (1) G1 hardening — make `R.actAs` refuse hotel users outside PIL-001 and clearly label the single-establishment limit, so the B4/B5 mismatch cannot occur; add tests that fail on today's code. (2) G12 — audit the 31 toast call sites for false success and add tests where a gap is found. (3) G16 — remove the dead duplicate `gov/dashboard` block; refresh the stale README header. Run all 15 suites; report actual results.
- **Tier B — only with recorded authorised decisions:** a real multi-establishment model (T9); the three lifecycle pages (P1–P3, T10); search fields (T1/T4); validation rules and A1; duplicate rule (T5). Each from approved text only.
- **Still blocked regardless:** approved URS v2.0 (B1), roadmap (B2), approver (B3), status of this provisional baseline (B4); real authentication, server-side authorisation, retention, integrations (T6–T8, T12–T17). No legal rule, production authentication or retention policy is to be assumed.

## 7. Package verification
Final-ZIP checks are appended below after packaging.

**Final probe run (after the documents were written):** `stage8_9_traceability_probe` — **52 passed, 0 failed**, exit 0 (47 evidence checks + 5 documentation-integrity checks; matrix has all 26 IDs, 7 Implemented / 19 Partial counted from its rows).

**Final package (`msafiri-stage-8.9-complete.zip`)** — `unzip -t` no errors; contains the complete application (`index.html`, `css/` 7, `js/` 20, `tests/` 15 scripts) and all prior reports plus the four new files; no `.env`, key/credential files, nested ZIPs, `__pycache__` or `.pyc`; extracted tree identical (`diff -r`) to the working tree; versus the supplied final-handover ZIP only `README.md` and the four new files differ.
