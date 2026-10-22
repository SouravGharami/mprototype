"""Msafiri Stage 8.1 — UI/responsive regression checks (optional; NOT an app dependency).
Run: python3 tests/ui_polish.py [path/to/index.html]   (Playwright, file://, synthetic data, no network)"""
import os, sys
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'index.html'))
res = []
def check(n, ok, d=''): res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:200]))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900}); ev = pg.evaluate; errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    routes = ev("Msafiri.allItems().map(r=>r.route)")
    for w in (1366, 768, 390):
        pg.set_viewport_size({'width': w, 'height': 900}); bad = []
        for r in routes:
            ev('h=>location.hash=h', r); pg.wait_for_timeout(100)
            o = ev("document.documentElement.scrollWidth-document.documentElement.clientWidth")
            if o > 0: bad.append((r, o))
        check('No horizontal page overflow on %d routes at %dpx' % (len(routes), w), not bad, bad[:3])
    # badges stay inside their cards
    pg.set_viewport_size({'width': 1366, 'height': 900}); ev("location.hash='#/hotel/profile'"); pg.wait_for_timeout(200)
    check('Profile status badges stay inside their card', ev("(()=>{const c=document.querySelectorAll('#main .card')[1].getBoundingClientRect();return [...document.querySelectorAll('#main .card')[1].querySelectorAll('.badge')].every(b=>b.getBoundingClientRect().right<=c.right)})()"))
    # top bar keeps the page title legible and the user name on one line
    pg.set_viewport_size({'width': 1366, 'height': 900}); ev("location.hash='#/hotel/profile'"); pg.wait_for_timeout(200)
    check('Top bar user name is on a single line', ev("(()=>{const n=document.querySelector('.user-meta .n');return n.getBoundingClientRect().height<22})()"))
    pg.set_viewport_size({'width': 768, 'height': 900}); ev("location.hash='#/gov/reports'"); pg.wait_for_timeout(200)
    check('Tablet top-bar title is not truncated (Reporting Dashboard)', ev("(()=>{const h=document.querySelector('#page-title');return h.scrollWidth<=h.clientWidth})()"))
    # mobile drawer closes when the current page link is tapped
    pg.set_viewport_size({'width': 390, 'height': 800}); ev("location.hash='#/hotel/registrations'"); pg.wait_for_timeout(200)
    pg.click('#btn-menu'); pg.wait_for_timeout(300); pg.click('.nav-item[aria-current=page]'); pg.wait_for_timeout(300)
    check('Mobile drawer closes after tapping the current page link', not ev("document.querySelector('#app').classList.contains('sidebar-open')"))
    # visible controls always do something: no enabled button/link without an action, href or handler
    pg.set_viewport_size({'width': 1366, 'height': 900}); dead = []
    for r in routes:
        if r == '#/admin/components': continue  # component library showcase
        ev('h=>location.hash=h', r); pg.wait_for_timeout(100)
        d = ev("""[...document.querySelectorAll('#main button:not([disabled]),#main a')].filter(e=>e.tagName==='A'?!e.getAttribute('href'):(!e.hasAttribute('data-action')&&e.type!=='submit'&&!e.hasAttribute('aria-controls')&&!e.closest('.table-wrap,.pager,[role=tablist]')&&!e.hasAttribute('role'))).map(e=>(e.innerText||'?').trim().slice(0,25))""")
        if d: dead.append((r, d))
    check('No enabled control without an action on any route', not dead, dead[:3])
    # ---- Stage 8.1 second pass ----
    # top-bar title is never clipped (wraps to two lines) from 360 px up, on every route
    for w in (1366, 768, 390, 360):
        pg.set_viewport_size({'width': w, 'height': 900}); pg.wait_for_timeout(300); clipped = []  # Stage 8.2: let layout settle after the resize (the check raced it and failed intermittently, also on the Stage 8.1 code)
        for r in routes:
            ev('h=>location.hash=h', r); pg.wait_for_timeout(60)
            if ev("(()=>{const h=document.querySelector('#page-title');return h.scrollHeight>h.clientHeight+1||h.scrollWidth>h.clientWidth+1})()"): clipped.append(r)
        check('Top-bar title not clipped on %d routes at %dpx' % (len(routes), w), not clipped, clipped[:3])
    # no horizontal page overflow at 320 px
    pg.set_viewport_size({'width': 320, 'height': 640}); bad = []
    for r in routes:
        ev('h=>location.hash=h', r); pg.wait_for_timeout(80)
        if ev("document.documentElement.scrollWidth-document.documentElement.clientWidth") > 0: bad.append(r)
    check('No horizontal page overflow on %d routes at 320px' % len(routes), not bad, bad[:3])
    # quick-navigation placeholder fits at tablet width
    pg.set_viewport_size({'width': 768, 'height': 900}); ev("location.hash='#/hotel/dashboard'"); pg.wait_for_timeout(200)
    check('Tablet search placeholder is not truncated', ev("""(()=>{const i=document.querySelector('#gsearch'),cs=getComputedStyle(i),c=document.createElement('canvas').getContext('2d');c.font=cs.fontSize+' '+cs.fontFamily;return c.measureText(i.placeholder).width<=i.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)})()"""))
    # a table that scrolls sideways is keyboard reachable and labelled; one that fits adds no tab stop
    pg.set_viewport_size({'width': 390, 'height': 800}); ev("location.hash='#/hotel/registrations'"); pg.wait_for_timeout(300)
    check('Scrollable table is a focusable, labelled region on a phone', ev("(()=>{const w=document.querySelector('.table-wrap');return w.scrollWidth>w.clientWidth&&w.tabIndex===0&&w.getAttribute('role')==='region'&&/scrolls sideways/.test(w.getAttribute('aria-label')||'')})()"))
    check('Scrollable table marks the edge with hidden columns', ev("document.querySelector('.table-wrap').getAttribute('data-scroll')==='right'"))
    pg.set_viewport_size({'width': 1920, 'height': 1000}); pg.wait_for_timeout(300)
    check('Table that fits has no extra tab stop on a wide screen', ev("(()=>{const w=document.querySelector('.table-wrap');return w.scrollWidth<=w.clientWidth+1&&!w.hasAttribute('tabindex')})()"))
    # trend arrows only where the delta is a signed number (no fabricated trend)
    check('Status-text deltas get no trend arrow; signed deltas do', ev("""(()=>{const U=Msafiri.UI,n=h=>(h.match(/<svg/g)||[]).length;return n(U.statCard({label:'x',value:1,delta:'3 rejected',dtone:'down'}))===1&&n(U.statCard({label:'x',value:1,delta:'+6',dtone:'up'}))===2})()"""))
    # text contrast: no failing text outside disabled controls and the palette showcase
    pg.set_viewport_size({'width': 1366, 'height': 900}); lowc = []
    CJS = r"""()=>{const lum=c=>{const a=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]};const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}};const bgOf=e=>{let L=[];while(e){const c=parse(getComputedStyle(e).backgroundColor);if(c&&c.a>0){L.push(c);if(c.a>=1)break}e=e.parentElement}let b={r:255,g:255,b:255};for(let i=L.length-1;i>=0;i--){const l=L[i];b={r:l.r*l.a+b.r*(1-l.a),g:l.g*l.a+b.g*(1-l.a),b:l.b*l.a+b.b*(1-l.a)}}return b};const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.textContent.trim())continue;const e=n.parentElement;if(!e||e.closest('[hidden],script,style,.sr-only,[disabled],[aria-disabled=true],.mx-off'))continue;const cs=getComputedStyle(e);const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;const fg=parse(cs.color),bg=bgOf(e);let op=1,x=e;while(x){op*=parseFloat(getComputedStyle(x).opacity);x=x.parentElement}const f={r:fg.r*fg.a*op+bg.r*(1-fg.a*op),g:fg.g*fg.a*op+bg.g*(1-fg.a*op),b:fg.b*fg.a*op+bg.b*(1-fg.a*op)};const a=lum([f.r,f.g,f.b]),b=lum([bg.r,bg.g,bg.b]);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);const fs=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;if(ratio<((fs>=24||(fs>=18.66&&bold))?3:4.5))out.push(n.textContent.trim().slice(0,20)+' '+ratio.toFixed(2))}return out}"""
    for r in routes:
        if r == '#/admin/components': continue
        ev('h=>location.hash=h', r); pg.wait_for_timeout(80)
        lowc += [(r, x) for x in ev(CJS)]
    check('Text contrast >= 4.5:1 (3:1 large) on every route, excluding disabled controls and the palette showcase', not lowc, lowc[:3])
    check('No console/page errors', not errs, errs[:2])
    b.close()
bad = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(bad), len(bad))); sys.exit(1 if bad else 0)
