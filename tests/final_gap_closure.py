"""Final gap-closure regression: placeholder pages point to existing simulated screens; donut subtitle is accurate.
Run from msafiri-prototype/: python3 tests/final_gap_closure.py  (Playwright + Chromium, file://, synthetic data)."""
import os, sys
from playwright.sync_api import sync_playwright
U = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
# Stage 9.0: the five Hotel placeholders were built (see tests/stage9_0_hotel_modules.py); only admin/connectors is still a placeholder.
ROUTES = ['admin/connectors']
res = []
def check(name, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else ' | ' + str(info)))
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (1366, 390):
        pg = b.new_page(viewport={'width': w, 'height': 800}); errs = []; reqs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('file:', 'data:')) else None)
        pg.goto(U, timeout=30000)
        for r in ROUTES:
            pg.evaluate("h=>location.hash=h", '#/' + r); pg.wait_for_timeout(250)
            t = pg.inner_text('#main')
            links = pg.eval_on_selector_all('#main ul.plain-list a', 'els=>els.map(a=>a.getAttribute("href"))')
            check('%d %s: still labelled Planned module / placeholder, with 2 links' % (w, r), 'Planned module' in t and 'not built' in t and len(links) == 2, (t[:120], links))
            check('%d %s: no horizontal overflow' % (w, r), not pg.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth"))
            bad = []
            for l in links:
                pg.evaluate("h=>location.hash=h", l); pg.wait_for_timeout(200)
                tt = pg.inner_text('#main')
                if 'Planned module' in tt or 'Page not found' in tt or 'Access not granted' in tt: bad.append(l)
            check('%d %s: every link opens a built page' % (w, r), not bad, bad)
        pg.evaluate("h=>location.hash=h", '#/hotel/dashboard'); pg.wait_for_timeout(300)
        t = pg.inner_text('#main')
        check('%d donut subtitle no longer claims "All registrations in the current period"' % w, 'All registrations in the current period' not in t and 'simulated submission status' in t)
        check('%d no page errors' % w, not errs, errs)
        check('%d no non-file network requests' % w, not reqs, reqs)
        pg.close()
    b.close()
print('%d passed, %d failed' % (sum(res), len(res) - sum(res))); sys.exit(0 if all(res) else 1)
