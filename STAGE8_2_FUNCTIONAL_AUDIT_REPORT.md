# Msafiri — Stage 8.2 Functional Consistency & Interaction Audit
Prototype only. Synthetic data, simulated integrations (government interface, PMS, scan/OCR, webhooks, exports, notifications). Nothing here claims real connectivity or production readiness.
**URS v2.0 was not supplied to this build** (only the stage prompt was). Nothing could be checked against it; no business rule, mandatory field or permission was added or changed.

## Defects confirmed (each reproduced in a browser before fixing) and fixed
1. Simulated scan erased fields typed before it (room, dates).
2. A late scan/search callback redrew whichever page the person had moved to, wiping their search box.
3. Background status changes redrew Registrations/Submissions, clearing search, filter and page, stealing focus and scrolling to top.
4. Government guest search could be started twice (two audit entries); button now disabled while searching.
5. Resolving one offline conflict silently synchronised an unrelated queued record, and logged "Synchronisation started" while offline.
6. Old validation errors stayed on the check-in form after the fields were corrected.
7. "Review conflict" was enabled for roles that can only be refused; now disabled with the reason.
8. Submission status chips omitted Conflict (Hotel) and Queued offline/Conflict (Government), so they summed to fewer than the table rows.
9. `#/hotel/registrations/<unknown id>` silently showed the list; now shows a "Record not found" notice (malformed `%` sequences handled).
10. Hotel dashboard called the built Submission Centre a "planned module".
11. Table search/sort treated missing values as the text "undefined" (reproduced with a synthetic table).
12. "Reset demo data" discarded all session changes without asking; now confirms (Keep my changes / Reset demo data).
Also: the `ui_polish.py` title-clipping check raced the viewport resize and failed intermittently on the Stage 8.1 code too (2 of 4 runs); it now waits for layout. Not a UI defect.

## Files changed
`js/ui.js`, `js/app.js`, `js/store.js`, `js/pages/hotel.js`, `js/pages/gov.js`, `js/pages/dashboards.js`; tests: `tests/functional_8_2.py` (new, 27 checks), `tests/audit_smoke.py` (two reset calls now click the confirmation), `tests/ui_polish.py` (settle wait). No CSS, route, data-model or permission changes.

## Checked and found correct (no change)
All 26 shared tables (pages sum to the stated count, empty-search state, whitespace search, every filter option); registration validation and value preservation on failure; admin user, role, establishment, settings and webhook forms (required fields, formats, duplicate email, cancel, create); read-only hotel role blocked at page level; Hotel dashboard, Government views and Reporting live row agree after a check-in; sort controls (Reference Data "Last change" is a no-op only because all seeded values share one timestamp).

## Tests actually run (final code)
| Command | Result |
|---|---|
| `node --check` on all JS | all OK |
| `tests/functional_8_2.py` | 27 passed, 0 failed |
| same file on the Stage 8.1 code (negative control, before reset check existed) | 16 of 24 failed |
| `tests/audit_smoke.py` | 24 passed |
| `tests/security_audit.py` | 31 passed |
| `tests/ui_polish.py` | 20 passed (6 consecutive runs) |
| Click crawler (every control, fresh load per click) | ~100 of 192 routes/sub-routes: zero JS errors; remaining flags were links to the current page, scroll-jumps, already-selected toggles, "clear/reset" with nothing set |
| Build / lint / type-check | not run: the project has none |

## Not done / limits
- Crawler covered roughly half of the 192 routes (representative detail pages, not every user/establishment/report page).
- Not tested: other browsers, real touch devices, screen readers, print, full keyboard walkthrough.
- Not verified against URS v2.0 (not supplied).

## Observed, deliberately not changed (need a URS decision)
- Same guest and document can be checked in twice (no duplicate rule defined).
- Birth dates such as 1800 are accepted (no plausibility rule defined).
- Unsaved registration form is discarded when navigating away.
- Integration "Test connection" stays enabled for disabled integrations (intent unconfirmed).
- "Soon" placeholder modules remain (Check-in, In-House, Stay changes, PMS, Compliance, Connectors).

## Simulated / incomplete
Everything government-facing is simulated and labelled; no export, transmission or acknowledgement is real.

## Continuation (remaining items recovered and resolved)
**Recovered lists**
- *Completed and verified before:* defects 1-12 above and the four suites.
- *Unverified before:* the click crawl had covered ~88 of 115 routes. It stalled on a background-process problem (a tool issue, not an application defect). Also unverified: sidebar/top-bar/breadcrumb/menu behaviour, the full registration workflow and stay actions, keyboard-only use, role sweep, "Test connection" intent.
- *Blocked:* URS v2.0 is not available anywhere in this environment (only the stage prompts and the Stage 8.1 zip were supplied).

**Done in the continuation**
- Finished the crawl in bounded foreground chunks: the remaining 27 routes (users/USR-002..008 detail and edit, reports SIM-RPT-0002..0031) show 0 errors, 0 flags. Every one of the 115 routes in the current route set has now been crawled; the crawl covers controls inside the page content only (the shell is covered by `shell_8_2.py`). Some routes were crawled before the last small edits; the suites were re-run after them.
- **One more defect fixed:** choosing "OpenAPI & Sandbox" redirects into the Developer module, and the sidebar then highlighted "API / Developer Portal" instead of the item clicked. `js/app.js` now keeps the sandbox item highlighted. (Found by the new shell check; fails on the Stage 8.1 code, passes now.)
- Verified correct, no change: all 38 sidebar links (hash, `aria-current`, title), 5 distinct breadcrumb targets, brand link, portal switch, quick-navigation search (match and no match), user-menu actions (sign-out honestly says "not available"), keyboard-shortcuts dialog, every notification-bell item in all three portals opens an existing page, modal close by X / Escape / backdrop / Close button with body scroll released, browser Back/Forward, unknown and malformed addresses.
- Registration workflow, nav to result: Guest Registration via sidebar; demo PMS prefill; scan keeps typed values; unchecked document confirmation blocks; masked review; "Back to edit" keeps values; exactly one record on confirm; result dialog says simulated; record opens from the dialog; findable in the list; dashboard total equals list total; found by Government search with masked name; "Start check-in" on an Expected record updates it without a duplicate; amend (empty room refused, no false success), check-out (decline changes nothing), cancel (reason required and logged) all flow to the list and dashboard.
- Keyboard-only: logical tab order, form completed and submitted by keyboard, dialog traps focus, Escape returns focus to the button, Enter inside a field submits nothing.
- Access control: every demo user in all three portals swept across all of its portal's routes; 0 console errors; every denied page offers no working control and only a "back to dashboard" link. Locked account is withheld as designed. No rule changed.
- "Test connection" on a disabled integration: returns a Warning ("endpoint reachable; integration is disabled", labelled simulated), not a false success. Verified as correct; no longer an open item.

**Files changed in the continuation:** `js/app.js` (sidebar highlight); new `tests/workflow_8_2.py`, `tests/shell_8_2.py`.

**Tests actually run on the final code (all exit code 0):** `node --check` all JS OK; `functional_8_2.py` 27 passed; `workflow_8_2.py` 0 failed (22 checks); `shell_8_2.py` 0 problems; `audit_smoke.py` 24 passed; `security_audit.py` 31 passed; `ui_polish.py` 20 passed. Negative control on the Stage 8.1 code: `shell_8_2.py` reports the sidebar highlight defect; `workflow_8_2.py` passes there too (those flows were never broken; it is a regression guard).

**Not run / not verified:** other browsers, real touch devices, screen readers, print layout; no build/lint/type-check exists. 320 px phones still clip five page titles (Stage 8.1 known limit, unchanged).

## Remaining blockers (all need the URS or the client, none is a known application malfunction)
1. URS v2.0 not supplied, so no requirement could be confirmed. Please supply it, or confirm the rules below.
2. Duplicate-guest rule undefined: the same guest and document can be checked in twice.
3. Date-of-birth plausibility rule undefined: 1800 is accepted.
4. Whether an unsaved registration form should survive navigating away.
5. "Soon" placeholder modules (Check-in, In-House, Stay changes, PMS, Compliance, Connectors) remain by design.

## Simulated functionality
Government interface and acknowledgements, PMS, document scan/OCR, integrations, webhooks, exports and notifications are all simulated and labelled. No real connectivity is claimed.

## Status
**COMPLETE** for the audit work that can be done without the URS: every inspection item is addressed, all 13 confirmed defects are fixed with regression tests, and every check above has a recorded result. This status does **not** mean the prototype is validated against URS v2.0; blockers 1-4 need client or URS input and are documented, not resolved.
