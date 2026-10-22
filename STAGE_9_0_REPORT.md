# Msafiri — Stage 9.0 Report: Hotel Modules Activated
Prototype only. Synthetic data; PMS, government interface, reporting statuses and CSV are **simulated**. Not production-ready; no regulatory compliance, real government integration or real PMS connectivity is claimed. The approved URS v2.0 was **not supplied**; no requirement was invented and nothing is verified against a URS. Page-access rules reuse existing permissions only (frontend demonstration, not production access control).

## 1. Completed modules (`js/pages/hotel-stay.js`, registered in the existing page registry)
| Module | What it does |
|---|---|
| **Check-in** (`#/hotel/check-in`) | Lists Expected/Draft guests (search, stay filter, masked document, readiness via the shared `S.validateReg`). *Check in* → confirmation dialog that requires the document-check tick → `S.checkIn` (validates, refuses and audits invalid/illegal changes) → success toast + simulated submission. Records with invalid data show *Complete details* (opens the prefilled registration form). Offline mode queues the check-in. |
| **In-House Guests** | Live list of Checked-in records (room, nationality, arrival, departure, nights, simulated government status), search + status filter, *Details* opens the existing record dialog. |
| **Check-out, Amend & Cancel** | All records with stay filter; per-row Check out / Amend / Cancel only where the lifecycle allows. Reuses the existing confirmation, amend and cancel-reason dialogs and the validated `S.checkOut/amend/cancel` (history + audit). Recent-changes list. Read-only roles see disabled buttons with the reason. |
| **PMS Connection & Manual Fallback** | Clearly labelled *Simulated PMS* status (from the synthetic integration record for Demo Hotel A, tied to the existing simulated-offline switch), "Simulate PMS outage" control, manual-fallback steps and a link to the existing registration form. No credentials shown. |
| **Compliance & Reports** | Summary cards and status donut computed from the live synthetic records, "needs attention" list, searchable record list with government-status and stay-status filters, counts-only **simulated** summary CSV (no guest data), explicit "not an official compliance report" notice. |

"Soon" badges removed for these five only. **Admin › Connector Status keeps "Soon"** (still a placeholder). **Staff & Users still shows "No access"** and the page stays denied for roles without `staff:read`.

## 2. Files changed
New: `js/pages/hotel-stay.js`, `tests/stage9_0_hotel_modules.py`, `STAGE_9_0_REPORT.md`.
Modified: `index.html` (one script tag); `js/pages/hotel.js` (extracted existing prefill/check-out logic into reusable functions and exported `M.hotelStartForm/hotelCheckOut/hotelCancel/hotelAmend` — behaviour unchanged); `js/store.js` (soft-refresh regex now includes the five new pages); `js/admin-data.js` (page guards: check-in → `registration:create`; in-house, stay-changes, pms → `registration:read`; compliance → `submissions:read`; no new permission); `README.md`, `CLIENT_DEMO_WALKTHROUGH.md` (notes).
Tests updated because they asserted the old placeholder state (reason: Stage 9.0 instruction): `tests/final_gap_closure.py` (now covers only `admin/connectors`; 42 → 12 checks), `tests/stage8_9_traceability_probe.py` (A2/A3: one remaining placeholder), `tests/journey_5_integration_transparency.py` (PMS page now built; still asserts simulated labelling and no unqualified connection claim).

## 3. Defects found in my own change and fixed
320 px horizontal overflow on PMS and Compliance (buttons in headers) → buttons moved into page body / shortened; contrast 4.41:1 on row-level red "Cancel" buttons → neutral button style in the table (the confirmation dialog keeps the danger button).

## 4. Tests (headless Chromium via Playwright 1.56, `file://`; `node --check` on all 21 JS files)
`./run_tests.sh` (3 at a time): stage9_0_hotel_modules **72/0** (new), final_gap_closure 12/0, functional_8_2 27/0, audit_smoke 24/0, journeys_1_3 32/0, journey_4 28/0, security_audit 31/0, journey_5 48/0, stage8_7 49/0, stage8_6 23/0, stage8_9 52/0, ui_polish 20/0, stage8_5 53/0, workflow_8_2 failed: 0, shell_8_2 PROBLEMS 0, stage8_4_provisional_probe PROBLEMS 0, stage8_4_closure_evidence exit 0. Negative control: the new suite fails (times out) on the pre-9.0 code. New suite covers routes/labels/Soon badges, eligibility, confirmation, validation refusals, lifecycle, audit, role restrictions (read-only user), offline path, filters/search, CSV contents, privacy of audit entries, overflow at 320/390/768 px, no console errors, no external requests.
**Not run:** other browsers, screen readers, real devices, keyboard-only walkthrough; no lint/build exists.

## 5. Remaining limitations
Admin › Connector Status placeholder. Compliance thresholds/report types/legal rules undefined (no URS). Check-in does not block a future arrival date (no approved rule). Hotel export permission not defined — the counts-only summary CSV is gated by the page's own `submissions:read` and labelled simulated; a role decision is still needed. Page access reuse of existing permissions is a provisional choice, not an approved role matrix. Data is in browser memory (reload resets); role checks are frontend-only; audit list is in memory and not tamper-proof. Open items B1–B4, T1–T17, P1–P5 (now built as demonstration pages, scope unapproved) and P6, X1–X5, A1 remain.

## 6. URS alignment
Approved URS v2.0 unavailable → no conformance claim. Work follows the user's Stage 9.0 brief and the project's existing rules/labels (provisional IDs not cited as authority).

## 7. Recommended next stage (not started)
Obtain the URS / written scope approval, then reconcile these five pages against it (documentation first). Meanwhile, a short UAT with the client on these flows, and a decision on Connector Status and the hotel export permission.
