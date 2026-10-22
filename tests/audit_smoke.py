"""Msafiri Stage 7.1 — focused end-to-end smoke tests (optional; NOT an app dependency).
Run:  pip install playwright && playwright install chromium && python3 tests/audit_smoke.py
Loads index.html over file://, drives the real UI, uses synthetic data only, makes no network calls.
Stage 7.2: the M1-M4 defects from Stage 7.1 are now covered as normal regression checks."""
import csv, io, os, sys
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
res = []
def check(n, ok, d=''): res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:160]))
def go(pg, h): pg.evaluate('h=>location.hash=h', h); pg.wait_for_timeout(200)
def T(pg, s='#main'): return pg.inner_text(s)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900})
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)

    # Core: every nav route renders without runtime errors; planned routes are the known set
    routes = pg.evaluate("Msafiri.allItems().map(r=>[r.route,!!Msafiri.pages[r.portal+'/'+r.item.id]])")
    for r, _ in routes: go(pg, r)
    check('All %d nav routes render with no console/page errors' % len(routes), not errs, errs[:2])
    check('Unknown route shows not-found page', (go(pg, '#/hotel/nope') or 'Page not found' in T(pg)))
    # Roles
    pg.evaluate("Msafiri.dir.actAs('gov','USR-015')"); go(pg, '#/gov/reports'); pg.evaluate('Msafiri.rerender()')
    check('Government Auditor denied Reporting', 'Not permitted' in T(pg))
    pg.evaluate("Msafiri.dir.actAs('gov','USR-013')"); pg.evaluate('Msafiri.rerender()')
    check('Government Officer allowed Reporting', 'Not permitted' not in T(pg))
    # Registration validation + check-in
    go(pg, '#/hotel/new-registration'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(200)
    check('Empty registration form shows validation errors', 'Confirm the document check' in T(pg))
    def fill(d):
        for k, v in d.items(): (pg.select_option if k in ('nat', 'docType') else pg.fill)('#f-' + k, v)
    fill(dict(first='Test', last='Guest', dob='1990-01-01', nat='Kenya', docType='Passport', docNo='ABC12345', room='1', arrival='2026-10-19', departure='2026-10-22'))
    pg.check('#f-checked'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(3700)
    check('Check-in reaches Acknowledged (simulated)', pg.evaluate('Msafiri.store.recs[0].sub') == 'Acknowledged')
    # Integration
    go(pg, '#/admin/pms-health/INT-1001'); n = pg.evaluate('Msafiri.integ.events.length')
    pg.click('[data-action=integ-act][data-act=test]'); pg.wait_for_timeout(2500)
    check('Integration test connection logs an event', pg.evaluate('Msafiri.integ.events.length') > n)
    # Sandbox is read-only
    go(pg, '#/admin/developer/sandbox'); before = pg.evaluate('JSON.stringify(Msafiri.store.recs.map(r=>r.sub))+Msafiri.integ.events.length')
    pg.click('[data-action=sb-send]'); pg.wait_for_timeout(1300)
    check('Sandbox send does not mutate state', before == pg.evaluate('JSON.stringify(Msafiri.store.recs.map(r=>r.sub))+Msafiri.integ.events.length'))
    # Webhooks: create validation + simulate
    go(pg, '#/admin/developer/webhooks/new'); pg.fill('#wh-name', 'T'); pg.fill('#wh-url', 'http://example.com'); pg.locator('input[id^=wh-ev-]').first.check(); pg.click('#wh-form button[type=submit]'); pg.wait_for_timeout(250)
    check('Webhook rejects non-https URL', pg.evaluate('location.hash').endswith('/new'))
    go(pg, '#/admin/developer/webhooks/WH-001'); n = pg.evaluate('Msafiri.webhooks.state().dels.length'); pg.click('[data-action=wh-sim]'); pg.wait_for_timeout(1400)
    check('Webhook simulate adds exactly one delivery record', pg.evaluate('Msafiri.webhooks.state().dels.length') == n + 1)
    # Reporting export permission + CSV shape
    ids = pg.evaluate('Msafiri.reporting.rows().map(r=>r.id)'); go(pg, '#/gov/reports/' + ids[0])
    check('Export disabled by default', pg.locator('button:has-text("Export synthetic CSV")').first.is_disabled())
    pg.evaluate("(()=>{const r=Msafiri.dir.role('gov-officer');Msafiri.dir.roleSave('gov-officer',r.perms.concat(['reports:create']));Msafiri.rerender();})()")
    with pg.expect_download() as dl: pg.locator('button:has-text("Export synthetic CSV")').first.click()
    rows = list(csv.reader(io.StringIO(open(dl.value.path(), 'rb').read().decode('utf-8-sig'))))
    check('CSV has 17 columns on every row and SYNTHETIC notice', all(len(r) == 17 for r in rows) and all('SYNTHETIC' in r[-1] for r in rows[1:]))
    # Notifications
    go(pg, '#/gov/notifications'); first = pg.locator('#na-list [data-action=na-toggle]').first; a = first.inner_text(); first.click(); pg.wait_for_timeout(250)
    check('Notification read/unread toggle flips', a != pg.locator('#na-list [data-action=na-toggle]').first.inner_text())
    pg.fill('#na-search', 'zzzzqq'); pg.wait_for_timeout(250)
    check('Notification search with no match yields zero rows', pg.locator('#na-list [data-action=na-view]').count() == 0)

    # ---- Regression tests for Stage 7.1 defects (fixed in Stage 7.2) ----
    go(pg, '#/hotel/dashboard'); pg.evaluate('Msafiri.store.reset()')
    go(pg, '#/hotel/registrations'); pg.fill('#rec-table input[type=search]', 'REG-241012'); pg.wait_for_timeout(200)
    pg.click('[data-action=hotel-view-reg][data-ref=REG-241012]'); pg.wait_for_timeout(300); pg.click('#modal-root button:has-text("Cancel registration")'); pg.wait_for_timeout(300)
    pg.fill('#can-why', 'x'); pg.click('#modal-root button.btn-danger'); pg.wait_for_timeout(400)
    check('M1 Registrations list shows Cancelled right after the dialog closes', 'Cancelled' in pg.locator('#rec-table tbody tr').first.inner_text())
    go(pg, '#/hotel/dashboard'); pg.evaluate('Msafiri.store.reset()'); pg.evaluate('Msafiri.rerender()')
    live = pg.evaluate("[Msafiri.store.count('Rejected'), Msafiri.store.queue().length]")
    t = pg.evaluate("Msafiri.demo.notifications.hotel.map(n=>n.title).join('|')")
    check('M2 Hotel bell counts match live data', ('%d submission' % live[0]) in t and ('%d record' % live[1]) in t, t)
    pg.evaluate("Msafiri.store.sync()"); pg.wait_for_timeout(100)
    q = pg.evaluate('Msafiri.store.queue().length')  # the seeded Conflict record stays queued after sync
    check('M2 Hotel bell updates after sync (matches live queue)', q == 1 and '1 record(s) queued offline' in pg.evaluate("Msafiri.demo.notifications.hotel.map(n=>n.title).join('|')"), q)
    pg.evaluate("Msafiri.store.reset()")
    pg.evaluate("Msafiri.store.checkIn({guest:'Race Test',nat:'Kenya',docType:'Passport',docNo:'RACE12345',dob:'1990-01-01',room:'9',arrival:'2026-10-19',departure:'2026-10-20',nights:1})")
    rr = pg.evaluate('Msafiri.store.recs[0].ref'); pg.evaluate("Msafiri.store.cancel('%s','test')" % rr); pg.wait_for_timeout(3900)
    hist = pg.evaluate("Msafiri.store.get('%s').history.map(h=>h.e)" % rr)
    check('M3 No duplicate submission events after cancel mid-flight', len([h for h in hist if h.startswith('Sent to')]) == 1 and len([h for h in hist if h.startswith('Acknowledged')]) == 1, hist)
    go(pg, '#/admin/sandbox'); pg.wait_for_timeout(300)
    check('M4 OpenAPI & Sandbox nav item opens the sandbox', pg.evaluate('location.hash') == '#/admin/developer/sandbox' and pg.locator('#sb-ep').count() == 1, pg.evaluate('location.hash'))
    # ---- Stage 7.3 interaction regressions ----
    pg.evaluate('Msafiri.store.reset()'); go(pg, '#/hotel/registrations'); pg.fill('#rec-table input[type=search]', 'REG-241013'); pg.wait_for_timeout(200)
    pg.click('[data-action=hotel-view-reg][data-ref=REG-241013]'); pg.wait_for_timeout(300); pg.click('#modal-root button:has-text("Amend")'); pg.wait_for_timeout(300)
    pg.fill('#am-room', '999'); pg.click('#modal-root button:has-text("Apply amendment")'); pg.wait_for_timeout(300)
    check('M1 Amend shows the new room in the list immediately', '999' in T(pg, '#rec-table'))
    pg.evaluate('Msafiri.store.reset()'); go(pg, '#/hotel/dashboard'); pg.click('#notif-btn'); pg.click('[data-action=open-notification][data-id=h1]'); pg.wait_for_timeout(300)
    c0 = int(pg.inner_text('#notif-count') or 0)
    pg.evaluate("(()=>{const r=Msafiri.store.recs.find(x=>x.sub==='Acknowledged');r.sub='Rejected';Msafiri.store.changed()})()"); pg.wait_for_timeout(200)
    check('M2 Hotel bell becomes unread again when the rejected count rises', int(pg.inner_text('#notif-count') or 0) > c0)
    pg.click('#user-btn'); pg.click('[data-action=reset-demo]'); pg.click('#modal-root button:has-text("Reset demo data")'); pg.wait_for_timeout(300)
    check('M2 Reset restores Hotel bell to match reset data', pg.evaluate("Msafiri.demo.notifications.hotel[0].title").startswith('1 '))
    pg.evaluate("Msafiri.dir.roleSave('support',[])"); pg.evaluate("Msafiri.dir.actAs('admin','USR-019')"); go(pg, '#/admin/dashboard'); go(pg, '#/admin/sandbox'); pg.wait_for_timeout(300)
    check('M4 Sandbox redirect still enforces integrations:read (denied page, no controls)', 'Not permitted' in T(pg) and pg.locator('#sb-ep').count() == 0)
    pg.evaluate("Msafiri.dir.actAs('admin','USR-017')"); pg.click('#user-btn'); pg.click('[data-action=reset-demo]'); pg.click('#modal-root button:has-text("Reset demo data")'); pg.wait_for_timeout(300)
    check('No external network requests during run', not ext, ext[:2])
    b.close()
bad = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(bad), len(bad))); sys.exit(1 if bad else 0)
