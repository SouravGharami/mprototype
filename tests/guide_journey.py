"""Msafiri guided journey - welcome intro, per-module spotlight tours, cookie memory, Guide Hub replay.
Optional regression test (NOT an app dependency). Synthetic data, file://, no network.
Run from msafiri-prototype/: python3 tests/guide_journey.py   (playwright + chromium)
Note: automated browsers skip the guide unless the URL has ?guide=on (so the other suites are not blocked by the intro)."""
import os, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = 'file://' + os.path.join(ROOT, 'index.html')
res = []
def check(n, ok, d=''):
    res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:300]))
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1366, 'height': 800}); pg = ctx.new_page()
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    ev = pg.evaluate
    st = lambda: ev("Msafiri.guide.state()")
    # 1. automation without ?guide=on is not blocked
    pg.goto(BASE); pg.wait_for_timeout(400)
    check('G1 guide stays out of the way for automated browsers by default', not pg.query_selector('.gd-intro') and pg.query_selector('#guide-btn') is not None)
    # 2. first visit shows the intro
    pg.goto(BASE + '?guide=on'); pg.wait_for_selector('.gd-intro', timeout=4000)
    check('G2 welcome intro shows on first visit', True)
    check('G3 intro has 6 slides and starts on slide 1', ev("document.querySelectorAll('.gd-slide').length") == 6 and ev("document.querySelector('.gd-slide.on')===document.querySelectorAll('.gd-slide')[0]"))
    check('G4 app is inert behind the intro', ev("document.getElementById('app').hasAttribute('inert')"))
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(200)
    check('G5 arrow key advances the intro', ev("document.querySelector('.gd-slide.on')===document.querySelectorAll('.gd-slide')[1]"))
    for _ in range(4): pg.click('[data-gd=intro-next]'); pg.wait_for_timeout(120)
    pg.click('[data-gd=intro-go]'); pg.wait_for_selector('.gd-coach', timeout=5000); pg.wait_for_timeout(600)
    check('G6 intro ends on Hotel dashboard and its tour starts', ev("location.hash") == '#/hotel/dashboard' and pg.query_selector('.gd-intro') is None)
    check('G7 intro marked as seen', st()['intro'] is True)
    # 3. step through the dashboard tour
    n = 1
    while pg.query_selector('.gd-coach [data-gd=tour-next]'):
        pg.click('.gd-coach [data-gd=tour-next]'); pg.wait_for_timeout(350); n += 1
    check('G8 dashboard tour has concept + steps + logic (>=5 steps)', n >= 5, n)
    check('G9 last step lists the unique logic', 'logic to remember' in pg.inner_text('.gd-coach').lower())
    pg.click('.gd-coach [data-gd=tour-close]'); pg.wait_for_timeout(300)
    check('G10 tour closes and app is interactive again', pg.query_selector('.gd-tour') is None and not ev("document.getElementById('app').hasAttribute('inert')"))
    check('G11 module is remembered as seen', st()['seen'].get('hotel/dashboard') is True)
    ck = ev("document.cookie") + ' ' + ev("localStorage.getItem('msafiri.guide')")
    check('G12 progress is persisted (cookie and/or storage mirror)', 'hotel.dashboard' in ck or 'hotel%2Edashboard' in ck, ck)
    # 4. reload: nothing shown again
    pg.reload(); pg.wait_for_timeout(1800)
    check('G13 after reload no intro and no repeat tour', pg.query_selector('.gd-intro') is None and pg.query_selector('.gd-coach') is None)
    # 5. new module auto-starts once
    ev("location.hash='#/hotel/registrations'"); pg.wait_for_selector('.gd-coach', timeout=4000)
    check('G14 first visit to another module auto-starts its tour', 'registrations' in ev("location.hash"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('G15 Escape closes the tour', pg.query_selector('.gd-coach') is None)
    ev("location.hash='#/hotel/dashboard'"); pg.wait_for_timeout(300); ev("location.hash='#/hotel/registrations'"); pg.wait_for_timeout(1500)
    check('G16 a seen module does not auto-start again', pg.query_selector('.gd-coach') is None)
    # 6. Guide Hub
    pg.click('#guide-btn'); pg.wait_for_selector('.gd-hub', timeout=2000)
    check('G17 Guide Me button opens the hub on "This page"', 'Registrations' in pg.inner_text('.gd-now'))
    check('G18 hub shows progress', 'modules explored' in pg.inner_text('.gd-hub-prog'))
    pg.click('[data-gd=tab][data-t=atlas]'); pg.wait_for_timeout(200)
    pg.fill('#gd-q', 'masked'); pg.wait_for_timeout(200)
    check('G19 atlas search finds modules by their logic', ev("document.querySelectorAll('.gd-mod').length") >= 1)
    pg.fill('#gd-q', ''); pg.click('[data-gd=pill][data-p=gov]'); pg.click('[data-gd=toggle][data-k="gov/search"]'); pg.wait_for_timeout(200)
    check('G20 a module expands to show its unique logic', 'masked' in pg.inner_text('.gd-mod.open').lower())
    pg.click('[data-gd=play][data-k="gov/search"]'); pg.wait_for_selector('.gd-coach', timeout=5000); pg.wait_for_timeout(500)
    check('G21 "Walk me through it" navigates and replays a tour (even if seen before)', ev("location.hash") == '#/gov/search' and pg.query_selector('.gd-hub') is None)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.keyboard.press('?'); pg.wait_for_timeout(300)
    check('G22 "?" opens the hub', pg.query_selector('.gd-hub') is not None)
    # auto-start switch
    pg.click('#gd-auto'); pg.wait_for_timeout(150)
    check('G23 auto-start switch turns page tours off', st()['off'] is True)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    ev("location.hash='#/gov/audit'"); pg.wait_for_timeout(1500)
    check('G24 with auto-start off a new module does not start a tour', pg.query_selector('.gd-coach') is None)
    pg.click('#guide-btn'); pg.wait_for_selector('.gd-hub'); pg.click('[data-gd=replay-intro]'); pg.wait_for_timeout(300)
    check('G25 hub can replay the welcome intro', pg.query_selector('.gd-intro') is not None)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    pg.click('#guide-btn'); pg.wait_for_selector('.gd-hub'); pg.click('[data-gd=reset]'); pg.click('[data-gd=reset]'); pg.wait_for_timeout(200)
    check('G26 reset (two clicks) clears progress', len(st()['seen']) == 0 and st()['intro'] is True)
    pg.keyboard.press('Escape')
    # 7. every module has a working tour with resolvable targets
    keys = ev("Object.keys(Msafiri.guide.modules)")
    allnav = ev("Msafiri.allItems().map(r=>r.portal+'/'+r.item.id)")
    check('G27 every navigation module has a guide', all(k in keys for k in allnav), [k for k in allnav if k not in keys])
    ev("Msafiri.guide.state"); pg.click('#guide-btn') if False else None
    bad = []
    for k in keys:
        ev("h=>{location.hash=h}", '#/' + k); pg.wait_for_timeout(250)
        ev("k=>Msafiri.guide.start(k)", k)
        try: pg.wait_for_selector('.gd-coach', timeout=3000)
        except Exception: bad.append((k, 'no tour')); continue
        pg.wait_for_timeout(250); i = 0
        while True:
            info = ev("()=>{var c=document.querySelector('.gd-coach'),s=document.querySelector('.gd-spot');return {t:c.querySelector('h3').textContent,step:!c.querySelector('.gd-badge'),centered:s.classList.contains('centered'),r:c.getBoundingClientRect().toJSON(),vw:innerWidth,vh:innerHeight}}")
            r = info['r']
            if info['step'] and info['centered']: bad.append((k, i, info['t'], 'target not found'))
            if r['left'] < -1 or r['top'] < -1 or r['right'] > info['vw'] + 1 or r['bottom'] > info['vh'] + 1: bad.append((k, i, 'coach off-screen'))
            nx = pg.query_selector('.gd-coach [data-gd=tour-next]')
            if not nx: break
            nx.click(); pg.wait_for_timeout(250); i += 1
        pg.click('.gd-coach [data-gd=tour-close]'); pg.wait_for_timeout(120)
    check('G28 all %d module tours: every spotlight target resolves and the coach card stays on screen' % len(keys), not bad, bad[:5])
    check('G29 journey-complete banner appears after the last unseen module', st()['done'] is True and len(st()['seen']) == len(keys))
    # 8. mobile
    m = b.new_context(viewport={'width': 390, 'height': 800}); mp = m.new_page(); merr = []
    mp.on('pageerror', lambda e: merr.append(str(e)))
    mp.goto(BASE + '?guide=on'); mp.wait_for_selector('.gd-intro')
    check('G30 mobile: intro fits without horizontal scroll', mp.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
    mp.click('[data-gd=intro-to][data-i="5"]'); mp.click('[data-gd=intro-go]'); mp.wait_for_selector('.gd-coach', timeout=5000); mp.wait_for_timeout(600)
    r = mp.evaluate("document.querySelector('.gd-coach').getBoundingClientRect().toJSON()")
    check('G31 mobile: coach card docks inside the viewport', r['left'] >= 0 and r['right'] <= 391 and r['bottom'] <= 801, r)
    mp.click('.gd-coach [data-gd=tour-next]'); mp.wait_for_timeout(500)
    check('G32 mobile: next step works', '2 / ' in mp.inner_text('.gd-count'))
    check('G33 no page/console errors', not errs and not merr, errs + merr)
    check('G34 no external network requests', not ext, ext)
    b.close()
bad = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(bad), len(bad)))
raise SystemExit(1 if bad else 0)
