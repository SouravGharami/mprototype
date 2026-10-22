# Msafiri — Stage 8.1 Final UI & Usability Polish
Prototype only. Synthetic data, simulated integrations. No routes, data models, permissions or workflows were changed.

## Issues found and corrected (each reproduced before fixing)
1. **Status badges overflowed their card** on Establishment Profile (Onboarding "complete (demo)" clipped; 10 px page overflow at 1366 px, 2 px at 390 px). Badges now wrap inside `.kv` and list rows and never exceed their container.
2. **Roles & Permissions overflowed on phones (4 px).** Cause: long non-wrapping permission badges. Fixed by the same badge rule plus wrapping chip rows.
3. **Top bar crowded the page title.** Title truncated ("Establishment Pro…", "Reporti…"), eyebrow wrapped to two lines on tablet, user name wrapped. Search box narrowed, user name kept on one line, long ribbon text shown only on very wide screens, role text and shortcut hint dropped on tablet only.
4. **Mobile drawer stayed open** when tapping the link for the page already open (no hashchange fired). It now closes on any sidebar link tap.
5. **Small touch targets** (sort headers 18 px, small buttons 32 px). Raised to 36 px on touch screens only.

## Reviewed, no change needed
Every one of the 38 navigation routes renders with no console errors; every page has a title and breadcrumb; every form field has a label; mobile dialogs fit the viewport with the footer reachable; no enabled button or link without an action (the only controls without one are disabled and explained, e.g. Edit contact details without permission; the Component Library page is a showcase and excluded).

## Files changed
`css/components.css`, `css/layout.css`, `js/app.js` (3-line drawer handler); added `tests/ui_polish.py` and this report.

## Responsive checks
All 38 routes at 1366, 768 and 390 px: no horizontal page overflow. Screenshots reviewed for Establishment Profile (desktop), Guest Registration (mobile), Reporting dashboard (tablet). Mobile dialog and drawer exercised; touch-target sizes measured with touch emulation.

## Tests and commands (actual results)
| Command | Result |
|---|---|
| `tests/ui_polish.py` on the Stage 8.0 code | 3 passed, **6 failed** |
| `tests/ui_polish.py` after fixes | **9 passed, 0 failed** |
| `tests/audit_smoke.py` | 24 passed, 0 failed |
| `tests/security_audit.py` | 31 passed, 0 failed |
| `node --check` on all JS files | all OK |
| Build / lint / type-check | not run: the project has none |

## Remaining issues for the next stage
- Tablet/mobile search placeholder is truncated ("Go to pa…") at about 768 px.
- The top-bar title duplicates the page H1 on every screen.
- Quick-navigation search matches page labels only; unknown `#/hotel/registrations/<id>` silently shows the list.
- Integration "Test connection" stays enabled for disabled integrations (intent unconfirmed).
- "Soon" placeholder modules remain; hotel bell is the only static-text remnant already fixed in 7.2.
- Not tested: other browsers, real touch devices, screen readers, full keyboard walkthrough, print layout.


---

# Second pass (completes Stage 8.1)

Re-audited the whole prototype with measurements across all 38 routes (accessible names, computed contrast, keyboard focus, font sizes, overflow at 1366/1024/768/560/390/360/320 px, long-value stress) before changing anything. Prototype only; synthetic data; no routes, data models, permissions, validation or workflows were changed.

## Correction to the first pass
The first pass said the top-bar title was no longer truncated. It had only been checked on one page. Measured on every route, **15 titles were clipped at 768 px and 31 at 390 px** (and 4 on desktop). This pass fixes that.

## Issues found and fixed (each measured before and after)
1. **Top-bar titles clipped** ("Check-out, Amend…", "Submission Status & History"). Titles now wrap to two lines at every width. Clipped titles: 0 of 38 routes at 1366/1024/768/560/390/360 px.
2. **Low-contrast text.** `--text-3` (#66728d) measured 4.42:1 on the page background (footer, breadcrumbs, hints) and the breadcrumb "/" separators were faded to 2.23:1. Darkened to #5f6b87 (>= 4.8:1 on every surface used), separators un-faded, required-field "*" moved to the darker red (7.1:1). Failing text groups went from 8 to 3; the 3 left are two disabled controls (exempt) and the palette showcase.
3. **Scrolling tables were not keyboard-reachable and gave no visual cue.** Tables wider than their container are now focusable, labelled regions ("<caption> (scrolls sideways)") with a fade on the edge that still hides columns. Tables that fit add no tab stop.
4. **Sidebar labels clipped** beside the SOON pill ("PMS Connection & …"). Labels now wrap to two lines; the SOON/count pills no longer shrink.
5. **Tablet search placeholder truncated** ("Go to pa…"). Right padding reserved for a hidden shortcut hint was removed; the placeholder now fits.
6. **Misleading trend arrows.** Status wording such as "5 acknowledged · 1 rejected" or "Simulated" drew a down-trend arrow, implying a time comparison that does not exist. Arrows now appear only when the delta is itself a signed number (e.g. "+6"). Done once in `UI.statCard`; no data changed. The delta pill also wraps cleanly instead of forming a lopsided blob.
7. **1 px page overflow at 320 px** on the Sandbox page (a non-wrapping badge inside a paragraph). Badges inside paragraphs, hints, alerts and card headers may now wrap.
8. **Interaction feedback:** buttons gain a pressed (`:active`) state; text-input focus ring strengthened (20% to 35% opacity). "Sending…", "Simulating…", spinner and "Searching…" states already existed and were left as they are.

## Reviewed, no change needed
Every control has an accessible name (0 unnamed across 38 routes); every table already has a contextual empty state; modals fit at 390x640 and 320x568; keyboard focus is visible on every control (date inputs reported "none" in a first measurement, which was a sampling artefact, re-measured as a visible ring); long names/values (90-char unbroken name, long nationality and room) wrap or scroll inside their containers with no page overflow at 1366/768/390 px; loading and busy states already exist where actions are simulated; confirmation dialogs already distinguish primary/secondary/danger actions.

## Files changed (second pass)
`css/tokens.css`, `css/components.css`, `css/layout.css`, `js/ui.js` (stat-card arrow rule, `Msafiri.syncScroll`), `js/app.js` (2 small calls), `tests/ui_polish.py` (10 new checks), this report.

## Tests and commands (actual results)
| Command | Result |
|---|---|
| `node --check` on all 20 JS files | all OK |
| `tests/ui_polish.py` (now 20 checks) | **20 passed, 0 failed** |
| same 10 new checks run against the code from before this pass (negative control) | **10 failed**, so they detect the defects |
| `tests/audit_smoke.py` | 24 passed, 0 failed |
| `tests/security_audit.py` | 31 passed, 0 failed |
| Build / lint / type-check | not run: the project has none |

## Known limits (not fixed)
- At **320 px** (very small phones) 5 page titles still clip after two lines; 360 px and up are clean.
- The top-bar title still repeats the page heading on each screen (by design, left as is).
- Brand tagline ("NATIONAL GUEST REGISTRATION") stays 10 px: it is a logo lockup that would overflow at a larger size.
- **URS v2.0 has not been supplied to this build** (see README). Nothing here can be confirmed against it.
- Not tested: other browsers, real touch devices, screen readers, a full manual keyboard walkthrough, print layout. Contrast was computed from CSS colours, not checked with an external tool.
- Carried over, behaviour rather than visual polish: unknown `#/hotel/registrations/<id>` silently shows the list; "Test connection" stays enabled for disabled integrations (intent unconfirmed); "Soon" placeholder modules remain by design.
