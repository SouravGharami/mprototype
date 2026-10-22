"""Msafiri Stage 8.6 (DRAFT, unconfirmed scope) - residual-item verification for Stage 7.1 items L3, L5, L6, L7 (optional; NOT an app dependency).
Each item is reproduced on the current code. Outcome recorded in STAGE8_6_REPORT.md: L3/L5/L7 were OPEN and are fixed; L6 was already FIXED (regression guard).
L1, L4, L8 and T1-T17 are deliberately NOT tested or changed (they need a URS / decision).
Run: python3 tests/stage8_6_residual_verification.py   (playwright + chromium; file://; synthetic data; no network)"""
import os, re, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = 'file://' + os.path.join(ROOT, 'index.html')
res = []
def check(n, ok, d=''):
    res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:300]))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900})
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    go = lambda h: (pg.evaluate('h=>location.hash=h', h), pg.wait_for_timeout(120))
    names = lambda: pg.evaluate("[...document.querySelectorAll('#gsearch-results .t')].map(e=>e.innerText)")
    def q(s): pg.fill('#gsearch', ''); pg.fill('#gsearch', s); pg.wait_for_timeout(120); return names()

    # ---- L3 quick-navigation search ----
    r = q('webhook'); check('L3: "webhook" finds the Developer Portal (description match)', 'API / Developer Portal' in r, r)
    r = q('audit'); check('L3: label matches still returned and listed first ("audit")', r and all('udit' in x for x in r[:2]), r)
    check('L3: existing label search unchanged ("sandbox" finds OpenAPI & Sandbox)', 'OpenAPI & Sandbox' in q('sandbox'))
    r = q('zzqqxx'); check('L3: nonsense query still shows the empty message', r == [] and 'No pages match' in pg.inner_text('#gsearch-results'))
    r = q('integration'); check('L3: results capped at 8', len(r) <= 8, len(r))
    # a label hit must outrank a description-only hit
    r = q('registration'); check('L3: label hits precede description-only hits ("registration")', r and 'egistration' in r[0], r)
    pg.fill('#gsearch', ''); pg.keyboard.press('Escape')

    # ---- L5 Government bell vs Reporting Alerts page ----
    pg.evaluate("Msafiri.dir.actAs('gov','USR-013')"); go('#/gov/notifications'); pg.wait_for_timeout(250)
    bell = lambda: int(pg.inner_text('#notif-count'))
    page_unread = lambda: pg.evaluate("document.querySelectorAll('#na-list .unread, #na-list [data-unread=true]').length")
    check('L5: page button is labelled for what it does ("Mark all alerts as read")', pg.inner_text('#na-readall').strip() == 'Mark all alerts as read', pg.inner_text('#na-readall'))
    check('L5: button explains the bell scope in its title', 'bell' in (pg.get_attribute('#na-readall', 'title') or '').lower())
    b0, p0 = bell(), page_unread(); pg.click('#na-readall'); pg.wait_for_timeout(300)
    check('L5: after page mark-all, no alert on the page is unread', page_unread() == 0 and p0 > 0, (p0, page_unread()))
    left = bell(); pg.click('#notif-btn'); pg.wait_for_timeout(200)
    unread_items = pg.evaluate("[...document.querySelectorAll('#notif-panel .dd-item.unread')].map(e=>e.innerText)")
    check('L5: remaining bell count equals the unread items shown in the bell panel (consistent)', left == len(unread_items) and left < b0, (b0, left, len(unread_items)))
    check('L5: every remaining unread bell item is a static non-alert item (none is a simulated reporting alert)', all('imulated' not in t and 'llustrative' not in t for t in unread_items), unread_items)
    pg.click('#notif-panel [data-action=mark-all-read]'); pg.wait_for_timeout(250)
    check('L5: the bell\'s own "Mark all as read" clears the badge to 0', bell() == 0 and pg.evaluate("document.getElementById('notif-count').hidden"), bell())
    pg.keyboard.press('Escape'); go('#/gov/notifications'); pg.wait_for_timeout(200)
    check('L5: Reporting Alerts page still shows 0 unread after bell mark-all (no divergence)', page_unread() == 0)

    # ---- L6 no horizontal overflow at 390 px (regression guard; was already fixed when re-measured) ----
    routes = pg.evaluate("""(()=>{const R=new Set(Msafiri.allItems().map(r=>r.route));
      Msafiri.dir.users.forEach(u=>{R.add('#/admin/users/'+u.id);R.add('#/admin/users/'+u.id+'/edit')});Msafiri.dir.roles.forEach(r=>R.add('#/admin/roles/'+r.id));
      Msafiri.dir.ests.forEach(e=>R.add('#/admin/establishments/'+e.id));Msafiri.reporting.rows().forEach(r=>R.add('#/gov/reports/'+r.id));
      Msafiri.integ.all().forEach(i=>{R.add('#/admin/pms-health/'+i.id);R.add('#/admin/integration-events/'+i.id)});
      Msafiri.webhooks.state().hooks&&Msafiri.webhooks.state().hooks.forEach(h=>R.add('#/admin/developer/webhooks/'+h.id));return [...R]})()""")
    for w in (390, 320):
        pg.set_viewport_size({'width': w, 'height': 800}); pg.wait_for_timeout(250); ov = []
        for rt in routes:
            go(rt)
            if pg.evaluate("document.documentElement.scrollWidth>innerWidth"): ov.append(rt)
        check('L6: no horizontal page overflow on any of %d routes at %d px' % (len(routes), w), not ov, ov[:5])
    pg.set_viewport_size({'width': 1366, 'height': 900})

    # ---- L7 localStorage scope matches the documentation ----
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
    pg.click('#btn-collapse'); pg.wait_for_timeout(200)
    for rt in ('#/hotel/new-registration', '#/gov/search', '#/admin/users', '#/admin/settings'): go(rt)
    keys = pg.evaluate("Object.keys(localStorage)")
    check('L7: only one localStorage key is ever written (msafiri.collapsed)', keys == ['msafiri.collapsed'], keys)
    check('L7: its value is just a 0/1 flag (no demo or personal data)', pg.evaluate("localStorage.getItem('msafiri.collapsed')") in ('0', '1'))
    check('L7: nothing written to sessionStorage', pg.evaluate("sessionStorage.length")==0)
    readme = open(os.path.join(ROOT, 'README.md'), encoding='utf-8').read()
    check('L7: README states the localStorage exception (no longer claims "tab memory only" without it)', 'localStorage' in readme and 'msafiri.collapsed' in readme and 'with one exception' in readme)
    check('L7: README persistence table no longer says "None (browser tab memory only)" unqualified', '| Persistence | None (browser tab memory only) |' not in readme)
    pg.evaluate("Msafiri.actions && 0"); pg.click('#user-btn'); pg.wait_for_timeout(150); pg.click('[data-action=reset-demo]'); pg.wait_for_timeout(300)
    if pg.locator('#modal-root button:has-text("Reset")').count(): pg.locator('#modal-root button:has-text("Reset")').last.click(); pg.wait_for_timeout(300)
    check('L7: Reset demo data restores the preference to expanded (0)', pg.evaluate("localStorage.getItem('msafiri.collapsed')") == '0', pg.evaluate("localStorage.getItem('msafiri.collapsed')"))

    check('no console/page errors', not errs, errs[:3]); check('no non-file network request', not ext, ext[:3])
    b.close()
f = [n for n, ok in res if not ok]; print('\n%d passed, %d failed' % (len(res) - len(f), len(f))); sys.exit(1 if f else 0)
