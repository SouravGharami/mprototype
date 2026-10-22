"""Msafiri Stage 8.3 — Journey 4: authentication & permissions (optional; NOT an app dependency).
Run: python3 tests/journey_4_auth_permissions.py   (playwright + chromium; file://, synthetic data, no network)
Drives the REAL UI (user menu, sidebar, links). No authentication is bypassed: the prototype has no sign-in,
so 'who is acting' is chosen only through the on-screen 'Acting as (demo user)' menu, exactly as a person would.
Every Playwright action has a 5 s timeout and the whole run is bounded, so a missing control FAILS fast instead of hanging."""
import os, sys
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
res = []
def check(n, ok, d=''): res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:220]))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900}); pg.set_default_timeout(5000)
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'about:')) else None)
    def fresh(): pg.goto('about:blank'); pg.goto(BASE); pg.wait_for_timeout(300)
    def go(h): pg.evaluate('h=>location.hash=h', h); pg.wait_for_timeout(250)
    def main(): return pg.inner_text('#main')
    def menu(): pg.click('#user-btn'); pg.wait_for_selector('#user-panel [data-action=act-as]', state='visible')
    def act_as(uid):
        menu(); pg.click('#user-panel [data-action=act-as][data-user=%s]' % uid); pg.wait_for_timeout(300)
    def portal(pid): menu(); pg.click('#user-panel [data-action=switch-portal][data-portal=%s]' % pid); pg.wait_for_timeout(300)
    fresh()

    # 1. identity is visible and the menu lists demo users with roles
    menu(); txt = pg.inner_text('#user-panel')
    check('User menu shows current demo user and the "Acting as" list', 'acting as (demo user)' in txt.lower() and pg.locator('#user-panel [data-action=act-as]').count() >= 3, txt[:120])
    check('Menu states permissions are demonstration only', 'Demonstration only' in txt)
    pg.keyboard.press('Escape')

    # 2. there is no real sign-in/sign-out and the UI says so honestly
    menu(); pg.click('#user-panel [data-action=sign-out]'); pg.wait_for_timeout(300)
    body = pg.inner_text('body')
    check('Sign out is honestly reported as not available', 'Not available' in body or 'not available' in body, body[-200:])
    check('No sign-in form / password field exists anywhere', pg.locator('input[type=password]').count() == 0)

    # 3. hotel: read-only role (Reporting Viewer) is denied registration, via real clicks
    fresh(); act_as('USR-004'); go('#/hotel/new-registration')
    check('Hotel read-only role denied the new-registration page', 'Not permitted' in main(), main()[:150])
    check('Denied page offers no registration form control', pg.locator('#reg-form').count() == 0)
    check('Denied page offers a way back (link to dashboard)', pg.locator('#main a[href*=dashboard]').count() >= 1)
    pg.click('#main a[href*=dashboard]'); pg.wait_for_timeout(250)
    check('"Back to dashboard" from the denied page works', pg.evaluate('location.hash').endswith('dashboard'), pg.evaluate('location.hash'))
    # positive control
    act_as('USR-003'); go('#/hotel/new-registration')
    check('Positive control: Receptionist reaches the registration form', pg.locator('#reg-form').count() == 1, main()[:150])
    # and via the sidebar link, not only the hash
    fresh(); act_as('USR-003'); pg.click('#sidebar a[href="#/hotel/new-registration"]'); pg.wait_for_timeout(300)
    check('Receptionist reaches the form via the sidebar link', pg.locator('#reg-form').count() == 1)

    # 4. government: Auditor denied guest search; locked account cannot be selected at all
    fresh(); portal('gov'); act_as('USR-015'); go('#/gov/search')
    check('Government Auditor denied the guest-search page', 'Not permitted' in main(), main()[:150])
    check('Denied search page has no search button', pg.locator('[data-action=g-search]').count() == 0)
    menu(); locked = pg.locator('#user-panel [data-action=act-as][data-user=USR-016]')
    check('Locked government account is shown but disabled in the menu', locked.count() == 1 and locked.is_disabled(), locked.count())
    check('Locked account states why (status shown)', 'Locked' in locked.inner_text() or 'locked' in locked.inner_text().lower(), locked.inner_text())
    pg.keyboard.press('Escape')
    # officer positive control
    act_as('USR-013'); go('#/gov/search')
    check('Positive control: Government Officer reaches guest search', pg.locator('[data-action=g-search]').count() == 1, main()[:150])

    # 5. unmasking does not leak when the acting user changes
    fresh(); portal('gov'); act_as('USR-013'); pg.evaluate("Msafiri.store.unmasked['REG-241012']=true")
    act_as('USR-014')
    check('Switching acting user clears earlier unmasks', pg.evaluate("!Msafiri.store.unmasked['REG-241012']"))

    # 6. admin: Support (read-only) sees no account-changing controls; Sys Admin does
    fresh(); portal('admin'); act_as('USR-019'); go('#/admin/users')
    check('Support role: User management renders', 'User' in main())
    UCTL = "[...document.querySelectorAll('#main [data-action^=u-]')].filter(e=>!e.disabled).length"
    go('#/admin/users/USR-001')   # account actions live on the user detail page, not the list
    check('Support role: no enabled Suspend/Reset/Unlock/Reactivate controls on a user page', pg.evaluate(UCTL) == 0, pg.evaluate(UCTL))
    go('#/admin/roles')
    check('Support role: no role-edit controls on Roles page', pg.locator('[data-action=r-delete],[data-action=r-save]').count() == 0)
    act_as('USR-017'); go('#/admin/users/USR-001')
    check('Positive control: System Administrator has enabled account controls', pg.evaluate(UCTL) > 0, pg.evaluate(UCTL))

    # 7. maker-checker: the proposer of a configuration change cannot approve it (rule enforced in code AND audited)
    fresh(); portal('admin')
    pend = pg.evaluate("(()=>{const p=Msafiri.ops.props.find(x=>x.status==='Pending approval'); return p?[p.id,p.byId]:null})()")
    check('A pending configuration proposal exists to test against', bool(pend), pend)
    if pend:
        cid, by = pend; act_as(by); n0 = pg.evaluate('Msafiri.store.audit.length')
        msg = pg.evaluate("id=>String(Msafiri.ops.decide(id,true,'self approve attempt'))", cid)
        check('Proposer cannot approve their own change (reason given)', 'cannot decide their own' in msg, msg)
        check('Proposal is still pending after the self-approval attempt', pg.evaluate("id=>Msafiri.ops.props.find(x=>x.id===id).status", cid) == 'Pending approval')
        check('Blocked self-approval is written to the audit trail', pg.evaluate("Msafiri.store.audit.some(a=>a.outcome==='Blocked'&&/Self-approval blocked/.test(a.detail))"))
        other = 'USR-017' if by != 'USR-017' else 'USR-018'; act_as(other)
        msg2 = pg.evaluate("id=>String(Msafiri.ops.decide(id,true,'independent approval'))", cid)
        check('A different administrator can decide it (positive control)', msg2 in ('null', 'undefined') or pg.evaluate("id=>Msafiri.ops.props.find(x=>x.id===id).status", cid) != 'Pending approval', msg2)

    # 8. every denied route lists no live controls: sweep all roles x admin routes for crashes
    fresh(); bad = []
    for portal_id, users in [('hotel', ['USR-001', 'USR-002', 'USR-003', 'USR-004']), ('gov', ['USR-013', 'USR-014', 'USR-015']), ('admin', ['USR-017', 'USR-018', 'USR-019'])]:
        portal(portal_id)
        for u in users:
            act_as(u)
            hrefs = pg.eval_on_selector_all('#sidebar a[href^="#/"], nav a[href^="#/"]', 'e=>[...new Set(e.map(a=>a.getAttribute("href")))]')
            for h in hrefs[:60]:
                go(h)
                if pg.locator('#main').inner_text().strip() == '': bad.append((u, h))
    check('No acting user gets a blank page on any sidebar route', not bad, bad[:3])
    check('No uncaught errors / console errors', not errs, errs[:2]); check('No external network requests', not ext, ext[:2])
    b.close()
print('\n%d passed, %d failed' % (sum(res), len(res) - sum(res))); sys.exit(0 if all(res) else 1)
