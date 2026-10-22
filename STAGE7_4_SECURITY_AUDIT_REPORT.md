# Msafiri — Stage 7.4 Security & Permissions Audit
**This is a prototype security review. It is not a formal penetration test and not a production security certification.**
Build audited: Stage 7.3 (static HTML/JS, no backend, no real authentication, synthetic data only).

## Context
There is no server, no sign-in and no session. "Acting as" is a demo role switcher and every permission check runs in the browser, so none of it can be real access control. The review therefore asks one question: **does the UI and handler logic honour the roles the prototype itself defines?** A real backend must re-enforce everything below.

## Findings (each verified in the running app; before/after results below)
### High — fixed
- **H1 Hotel write permissions never enforced.** `registration:edit`, `registration:create`, `submissions:create`, `submissions:edit` were only checked at page level. A read-only *Reporting Viewer* could Amend, Cancel and Check out records, Retry submissions, Synchronise and resolve conflicts. Verified: a viewer's cancel changed state to *Cancelled*. Fix: `S.guard()` in `js/store.js` on every state-changing operation, handlers in `js/pages/hotel.js` check it, and the record dialog no longer offers actions the role lacks. Denials are audited ("Permission denied / Blocked").
- **H2 Guest-record unmasking ignored `guestsearch:approve`.** Any role able to open guest search could unmask names, document numbers and dates of birth; a stale unmask also stayed visible after switching to another government user. Fix (`js/pages/gov.js`, `js/admin-data.js`): approve is required to offer and to complete unmasking, search/view require `guestsearch:read`, the unmask flag is ignored without approve and cleared when the acting government user changes.
- **H3 Admin handlers trusted the rendered button.** A read-only *Support Analyst* could unlock, reactivate and reset accounts, delete roles, and approve/reject establishment onboarding from the dashboard (verified: queue 4→3). Fix (`js/pages/admin.js`, `js/pages/dashboards.js`): handlers re-check `users:admin`, `roles:admin`, `establishments:approve`.

### Medium — fixed
- **M1 Audit misattribution.** Hotel activity was always logged as "Neema Kiptoo", whoever acted. Now uses the acting user (`S.actor()`).
- **M2 No Content-Security-Policy.** Added a restrictive meta CSP in `index.html` (`default-src 'none'`, scripts from self only, no inline script, no network, no forms). The app has no inline scripts or external requests, and all tests pass with it. Inline styles remain allowed.

### Checked, no issue found
- **XSS:** hostile text in registrations, users, establishments, roles, hash fragments and unknown routes stayed inert on 18 pages. All output goes through `esc()`.
- **Secrets:** none. The only token-like value is the labelled `Bearer SYNTHETIC-SANDBOX-TOKEN`; the sandbox and webhook forms reject real-looking credentials, secrets in URLs, non-HTTPS URLs and embedded usernames.
- **Network:** zero non-file requests in every run; no `fetch`, `eval`, `postMessage`, or `localStorage` of data (only a sidebar preference).
- **Reporting export:** needs `reports:create` (held by no seeded role); CSV neutralises formula injection; carries a SYNTHETIC notice on every row.
- **Webhook/sandbox simulators:** read-only role refused in handlers (existing); invalid JSON, headers and URLs rejected; sandbox does not mutate state.
- **Page guards:** Auditor, locked and suspended accounts denied; unknown routes show not-found.

## Files changed
`index.html`, `js/store.js`, `js/pages/hotel.js`, `js/pages/gov.js`, `js/pages/admin.js`, `js/pages/dashboards.js`, `js/admin-data.js`; added `tests/security_audit.py`, this report.

## Tests and commands (actual results)
| Command | Result |
|---|---|
| `python3 tests/security_audit.py` against the **original** code | 14 passed, **17 failed** (confirms H1–H3, M1, M2) |
| `python3 tests/security_audit.py` against the **fixed** code | **31 passed, 0 failed** (includes positive controls: Receptionist, Officer, System Administrator keep access) |
| `python3 tests/audit_smoke.py` (Stage 7.1–7.3 suite, after fixes) | 24 passed, 0 failed |
| `node --check` on all 21 JS files | all OK |
| Build / lint / type-check | **not run: the project has none** |

## Remaining risks and limitations
- Everything is client-side and trivially bypassed from the browser console; there is no authentication, session, or server-side authorisation.
- Role permissions that are still only documented, not enforced: `staff:*`, `establishments:edit/admin` on some paths, and the hotel connection toggle (`off-toggle`, `off-adv`) which is a demo control. Not changed to avoid scope creep.
- Hotel `Retry` stays visible to read-only roles; the click is refused with a toast rather than hidden.
- CSP is a meta tag and still permits inline styles; `file://` behaviour of CSP varies by browser (only Chromium tested).
- The audit trail lives in browser memory and can be reset; it has no integrity protection.
- Not tested: other browsers, keyboard/screen-reader, dependency scanning (there are no dependencies), the Admin settings/approvals/reference-data modules beyond handler inspection.

## Needs human review before production
1. Real authentication, MFA, session management, lockout and password handling.
2. Server-side authorisation of every action above and establishment-level data scoping.
3. Tamper-resistant, server-side audit logging with retention rules.
4. Legal and governance review of guest-data access, unmasking policy and purpose-bound search.
5. Encryption, key management and secrets handling for any real integration, webhook signing and credentials.
6. Proper CSP/HTTP security headers set by the server, and an independent penetration test.
