"""Msafiri Stage 8.3 — Journeys 1-3 (optional; NOT an app dependency).
NOTE: the original Journey 1-3 scripts were NOT present in the Stage 8.2 package supplied for Stage 8.3, so these are NEW
compact journeys written in Stage 8.3 to give the regression its full set of five. They are not the earlier originals.
  J1 hotel: register a guest end to end (sidebar -> form -> review -> confirm -> list -> submission status)
  J2 government: purpose-bound search -> masked result -> unmasking refused/accepted -> audit trail
  J3 administration: create user (validation, duplicate email) -> appears in list -> audit; reference-data and config pages load
Run: python3 tests/journeys_1_3.py   (playwright + chromium; file://, synthetic data, no network; 5 s per-action timeout)"""
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
    def act_as(uid): menu(); pg.click('#user-panel [data-action=act-as][data-user=%s]' % uid); pg.wait_for_timeout(300)
    def portal(pid): menu(); pg.click('#user-panel [data-action=switch-portal][data-portal=%s]' % pid); pg.wait_for_timeout(300)
    def until(expr, ms=5000):
        for _ in range(ms // 100):
            if pg.evaluate(expr): return True
            pg.wait_for_timeout(100)
        return False
    fresh()
    # ---------------- J1 hotel registration ----------------
    pg.click('#sidebar a[href="#/hotel/new-registration"]'); pg.wait_for_timeout(250)
    check('J1 sidebar opens the registration form', pg.locator('#reg-form').count() == 1)
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    check('J1 empty form is refused with visible errors and no dialog', pg.locator('#reg-form .error-text').count() > 0 and pg.locator('.modal').count() == 0)
    for k, v in dict(first='Zawadi', last='Mwangi', dob='1991-05-17', docNo='KE7654321', room='305', arrival='2026-10-21', departure='2026-10-23').items(): pg.fill('#f-' + k, v)
    pg.select_option('#f-nat', 'Kenya'); pg.select_option('#f-docType', 'Passport'); pg.check('#f-checked')
    n0 = pg.evaluate('Msafiri.store.recs.length'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    check('J1 review dialog masks the document number', 'KE7654321' not in pg.inner_text('#modal-root'))
    pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(400)
    check('J1 exactly one record created', pg.evaluate('Msafiri.store.recs.length') - n0 == 1)
    pg.keyboard.press('Escape'); go('#/hotel/registrations'); pg.fill('#main input[type=search]', 'Zawadi'); pg.wait_for_timeout(250)
    check('J1 new guest is findable in Registrations', 'Zawadi' in main() and '1 of' in pg.inner_text('#main .count') or 'Zawadi' in main())
    ref = pg.evaluate('Msafiri.store.recs[0].ref'); until("Msafiri.store.recs[0].sub==='Acknowledged'", 6000)
    check('J1 submission reaches Acknowledged (simulated)', pg.evaluate('Msafiri.store.recs[0].sub') == 'Acknowledged', pg.evaluate('Msafiri.store.recs[0].sub'))
    go('#/hotel/dashboard'); check('J1 dashboard total equals the record count after the journey', ('Total registrations\n%d' % pg.evaluate('Msafiri.store.recs.length')) in main(), main()[300:420])
    # document ending in 9 is rejected by the simulated interface, then retry path exists
    go('#/hotel/submissions'); check('J1 Submission Centre offers Retry for a rejected record', pg.locator('[data-action=sub-retry], button:has-text("Retry")').count() >= 1)

    # ---------------- J2 government search ----------------
    fresh(); portal('gov'); pg.click('#sidebar a[href="#/gov/search"]'); pg.wait_for_timeout(300)
    check('J2 search page opens with a purpose selector', pg.locator('#s-purpose').count() == 1)
    pg.click('[data-action=g-search]'); pg.wait_for_timeout(300)
    check('J2 search without a purpose is refused', pg.locator('[data-action=g-view]').count() == 0)
    pg.select_option('#s-purpose', index=1); pg.fill('#s-case', 'CASE-2026-001'); pg.fill('#s-name', 'Okonkwo')
    a0 = pg.evaluate('Msafiri.store.audit.length'); pg.click('[data-action=g-search]'); pg.wait_for_timeout(1500)
    check('J2 search returns results', pg.locator('[data-action=g-view]').count() >= 1, main()[:200])
    check('J2 results do not expose the searched full name unmasked', 'Okonkwo' not in pg.inner_text('#main table') if pg.locator('#main table').count() else True)
    check('J2 the search is written to the audit trail', pg.evaluate('Msafiri.store.audit.length') > a0)
    pg.locator('[data-action=g-view]').first.click(); pg.wait_for_timeout(300)
    check('J2 record opens with sensitive fields masked', 'Sensitive fields masked' in pg.inner_text('#modal-root'))
    pg.click('#modal-root button:has-text("Request unmasking")'); pg.wait_for_timeout(250)
    pg.fill('#um-why', 'short'); pg.check('#um-ok'); pg.click('#modal-root button:has-text("Unmask this record")'); pg.wait_for_timeout(250)
    check('J2 unmasking with a too-short justification is refused', 'Unmasking' not in ' '.join(a['type'] for a in pg.evaluate('Msafiri.store.audit.slice(0,1)')))
    pg.fill('#um-why', 'Case review under reference CASE-2026-001'); pg.click('#modal-root button:has-text("Unmask this record")'); pg.wait_for_timeout(500)
    check('J2 valid justification unmasks and the action is audited', pg.evaluate("Msafiri.store.audit.some(a=>a.type==='Unmasking')"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    go('#/gov/audit'); check('J2 audit page lists the unmasking', 'Unmasking' in main())

    # ---------------- J3 administration ----------------
    fresh(); portal('admin'); pg.click('#sidebar a[href="#/admin/users"]'); pg.wait_for_timeout(300)
    check('J3 Users list renders', 'USR-001' in main() or 'Neema' in main())
    go('#/admin/users/new'); pg.click('#user-form button[type=submit]'); pg.wait_for_timeout(250)
    check('J3 empty user form shows validation errors', pg.locator('#user-form .error-text').count() > 0 and pg.locator('.modal').count() == 0)
    pg.fill('#u-name', 'Journey Tester'); pg.fill('#u-email', 'neema.kiptoo@example.test'); pg.select_option('#u-role', index=1)
    if pg.locator('#u-est').count(): pg.select_option('#u-est', index=1)
    n = pg.evaluate('Msafiri.dir.users.length'); pg.click('#user-form button[type=submit]'); pg.wait_for_timeout(300)
    dup_blocked = pg.evaluate('Msafiri.dir.users.length') == n
    check('J3 an obviously duplicate email is not silently created', dup_blocked or pg.locator('#user-form .error-text').count() > 0, main()[:160])
    if pg.locator('.modal').count(): pg.keyboard.press('Escape')
    pg.fill('#u-email', 'journey.tester@example.test'); pg.click('#user-form button[type=submit]'); pg.wait_for_timeout(300)
    if pg.locator('#modal-root .btn-primary').count(): pg.click('#modal-root .btn-primary >> nth=-1'); pg.wait_for_timeout(400)
    check('J3 valid user is created exactly once', pg.evaluate('Msafiri.dir.users.length') == n + 1, (n, pg.evaluate('Msafiri.dir.users.length')))
    go('#/admin/users'); pg.fill('#main input[type=search]', 'Journey Tester'); pg.wait_for_timeout(250)
    check('J3 new user is findable in the list', 'Journey Tester' in main())
    for h in ['#/admin/roles', '#/admin/establishments', '#/admin/reference-data', '#/admin/settings', '#/admin/audit-logs', '#/admin/pms-health', '#/admin/support-incidents']:
        go(h); check('J3 %s renders non-empty without error' % h, len(main().strip()) > 80 and 'Section not found' not in main(), main()[:80])
    check('J3 user creation is in the audit trail', pg.evaluate("Msafiri.store.audit.some(a=>/Journey Tester/.test(a.target+a.detail))"))
    check('No uncaught errors / console errors', not errs, errs[:2]); check('No external network requests', not ext, ext[:2])
    b.close()
print('\n%d passed, %d failed' % (sum(res), len(res) - sum(res))); sys.exit(0 if all(res) else 1)
