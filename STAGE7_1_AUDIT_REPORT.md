# Msafiri — Stage 7.1 End-to-End Workflow Audit
Audited build: `msafiri-prototype-stage6-4` (v1.8). Static HTML/JS, no backend. **No application source was changed.** Only `tests/audit_smoke.py` and this report were added.

**URS v2.0 was not found** in the upload or the container, so nothing could be verified against it. Findings reflect actual behaviour only. Items marked "confirm vs URS" need a requirement check.

## 1. Setup found
No `package.json`, build, lint, type-check or automated tests. Entry: `index.html`; classic `<script>` tags; hash router (`#/portal/page[/id]`); three demo portals (hotel / gov / admin); "authentication" is a frontend demo role switcher (`Msafiri.dir.actAs`) with permission checks in the UI only.

## 2. Commands executed
| Command | Result |
|---|---|
| `node --check` on all 21 JS files | all pass |
| Playwright (Chromium 141, `file://`) route sweep: all 38 nav items + 6 unknown/odd routes | no page/console errors; 0 non-file requests |
| Ad-hoc Playwright workflow scripts (areas A–E below) | pass except defects listed |
| `python3 tests/audit_smoke.py` (new) | 15 passed, 0 failed; 2 known defects confirmed present |
| Build / lint / type-check | **not run: none exist** (ESLint/tsc configs absent; not installed) |

## 3. Workflows inspected and result
- **A Core:** default route, portal switching, acting-as users, locked/auditor denial, sign-out placeholder, quick-nav search, not-found route. Pass (see L3, L4).
- **B Registration:** empty/invalid submit (future DOB, doc format, departure<=arrival, unchecked doc box), HTML in name (escaped, no script run), check-in → Pending → Submitted → Acknowledged, doc ending 9 → Rejected → Retry → Acknowledged, record detail with masked doc number, offline check-in → queue → sync, conflict resolution, reset with timers in flight, cancel/amend from Registrations. Pass except M1, M3, M4.
- **C PMS integration:** list, 10 detail pages, unknown id, test connection, health check, disable/enable, credential-fault stays Disconnected, retry recovers INT-1002, double-click, leave page mid-action, event history. Pass.
- **D Developer Portal:** all in-portal links resolve; sandbox all 6 cases, malformed JSON, credential-header refusal, read-only (state unchanged); webhooks create validation (7 bad URLs rejected, duplicate name rejected), simulate all scenarios, retry cap, disable, delete + history removal, reset, read-only role refused in handlers and UI. Pass.
- **E Reporting/notifications:** filters, invalid range, empty state, all 72 detail pages, export disabled by default, forced export refused, CSV (17 cols, notice on every row, formula neutralisation, audit entry), reset removes grant; alerts search/filters/reset, read/unread, details, open link, bell count, auditor denied. Pass (see L5).

**Not implemented (placeholder "Soon" pages):** Hotel `check-in`, `in-house`, `stay-changes`, `pms` (manual fallback), `compliance`; Admin `connectors`, `sandbox`.
**Not tested:** keyboard/screen-reader, other browsers, Admin users/roles/settings/approvals/reference-data/exceptional-access/audit-log modules, Government search/audit/monitoring pages beyond route render, Hotel check-out confirm path.

## 4. Defects
**Critical: none found.  High: none found.**

### Medium
- **M1 — Registrations list stale after modal actions (Hotel / Registrations).** Repro: open `#/hotel/registrations`, search REG-241012, View → Cancel registration → enter reason → confirm. Observed: store says Cancelled, row still shows "Checked in" (and after Amend, old room). Cause: `store.changed()` skips re-render while a modal is open and nothing re-renders afterwards; for already-reported records the next timer (~1.5 s) refreshes it. Not tested for records with status "Not reported", which have no later timer. Also the table search text is cleared on re-render.
- **M2 — Hotel bell contradicts live data (Hotel / notifications).** Repro: load app, open bell. Observed: "3 submissions were rejected" and "4 records queued offline" while data shows 1 rejected and 2 queued; text never changes after sync. (README lists this as a known Stage 1–3 limitation.)
- **M3 — Duplicate history/audit entries on overlapping submissions (Hotel / store).** Repro: check in, then cancel before the first simulation finishes. Observed: "Sent to simulated government interface" and "Acknowledged…" each recorded twice, and the cancelled record ends as Acknowledged from the earlier timer.
- **M4 — Navigation gap (Admin).** Nav item "OpenAPI & Sandbox" opens a planned-module placeholder, while the working sandbox is only reachable via Developer Portal → Sandbox.

### Low
- **L1** No duplicate-registration detection (same document number + room accepted twice) — confirm vs URS.
- **L2** Name fields accept any characters/length (output is escaped; no XSS observed).
- **L3** Quick-nav search matches page labels/groups only ("webhook" finds nothing).
- **L4** `#/hotel/registrations/<unknown-id>` silently shows the list; reports/webhooks/integrations show a not-found state.
- **L5** Reporting Alerts "Mark all as read" does not clear the two static Government bell items, so the bell can stay at 2 (documented scope, but looks inconsistent).
- **L6** Horizontal overflow at 390 px: `#/hotel/profile` (2 px, a badge) and `#/admin/roles` (4 px, table not in a scroll container). All other nav routes pass.
- **L7** `localStorage` used for sidebar-collapse preference while README says state is tab-memory only.
- **L8** Integration "Test connection" button stays enabled for a disabled integration — observed only; intended behaviour unconfirmed.

## 5. Tests added
`tests/audit_smoke.py` — 15 passing checks plus 2 "known defect" markers (M1, M2). Optional, needs Playwright, not an app dependency, synthetic data only.

## 6. Recommended Stage 7.2 fixes (in order)
1. M1: re-render affected list after modal closes (or in `store.changed()` once modal closes); keep search text.
2. M2: derive Hotel bell items from `Msafiri.store` like the Government bell.
3. M3: clear/ignore superseded timers per record in `store.submit()`.
4. M4: point "OpenAPI & Sandbox" to the existing sandbox route (or hide it).
5. L1–L8; decide placeholder modules' scope against the URS once supplied.
6. Add `package.json` with an ESLint config and a `test` script; move `audit_smoke.py` into CI.

---
## Stage 7.2 — fixes applied
No Critical/High defects existed. The four Medium defects were fixed with small changes:
- **M1** `js/store.js` (`changed()` now flags a skipped refresh; new `S.flush()`), `js/ui.js` (modal `close()` calls `store.flush()` unless silent).
- **M2** `js/store.js` (`syncBell()` keeps Hotel bell rejected/queued items in step with live counts).
- **M3** `js/store.js` (per-record submission token; superseded timers do nothing; cleared on reset).
- **M4** `js/developer.js` (registers `admin/sandbox`, which redirects to the existing `#/admin/developer/sandbox`).
- **Tests:** `tests/audit_smoke.py` now 20 checks; M1–M4 are normal regression checks.
- **Still open:** L1–L8 (not fixed, out of Medium scope); M1's search-text reset on re-render.

---
## Stage 7.3 — regression verification
No new defects; no application code changed. `tests/audit_smoke.py` extended to 24 checks (Amend refresh, bell unread-on-rise, reset restores bell, sandbox redirect keeps permission enforcement). Earlier 7.1 audit scripts re-run: only known unfixed items (L1, L5, L6) fail. Untested: keyboard/screen reader, other browsers, Admin users/roles/settings/approvals, Government search/audit pages beyond render, Hotel check-out confirm path with a checked-in record via UI.
