"""Msafiri Stage 8.5 - synthetic-data labelling sweep (every route) + repeatable static scan (optional; NOT an app dependency).
Closes the two Stage 8.4 items that rest only on the project rules (no requirement document needed):
  T20  demo/synthetic labelling was verified on the three dashboards only  -> every route, desktop + phone width
  T21  "no credentials / real contacts" was an ad-hoc grep                 -> repeatable scan with a built-in self-test
Run: python3 tests/stage8_5_labelling_and_scan.py   (playwright + chromium; file://; synthetic data; no network)
This shows the prototype carries its labels and contains no secret-like or real-looking contact/URL strings that this
scan can recognise. It is NOT proof of absence of real PII, NOT a security audit and NOT conformance to any URS."""
import os, re, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = 'file://' + os.path.join(ROOT, 'index.html')
res = []
def check(n, ok, d=''):
    res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:300]))

# ---------- detectors (shared by the static scan, the rendered-text scan and the self-test) ----------
RESERVED_HOST = re.compile(r'(^|\.)(example(\.(com|org|net))?|example\.test|test|invalid|localhost)$', re.I)
URL_RE   = re.compile(r'https?://([A-Za-z0-9.-]+)', re.I)
EMAIL_RE = re.compile(r'[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})')
PHONE_RE = re.compile(r'(?<![\w.])\+\d[\d ()-]{7,}\d')
SECRET_RES = [('private key block', re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')),
              ('AWS access key id', re.compile(r'\bAKIA[0-9A-Z]{16}\b')),
              ('GitHub token', re.compile(r'\bgh[pousr]_[A-Za-z0-9]{30,}\b')),
              ('API-style secret key', re.compile(r'\bsk-[A-Za-z0-9]{20,}\b')),
              ('JWT', re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}')),
              ('credentialed URL', re.compile(r'https?://[^/\s:@]+:[^/\s@]+@')),
              ('password/secret assignment', re.compile(r'''(?i)\b(password|passwd|secret|api[_-]?key|client[_-]?secret)\b["']?\s*[:=]\s*["'][^"'\s]{6,}["']''')),
              ('Bearer value', re.compile(r'Bearer\s+(?!SYNTHETIC-SANDBOX-TOKEN\b)[A-Za-z0-9._~+/-]{12,}'))]
NETWORK_RE = re.compile(r'\b(fetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|new\s+EventSource|importScripts|navigator\.serviceWorker)')
XMLNS_RE = re.compile(r"xmlns=['\"]http://www\.w3\.org/\d+/[A-Za-z]+['\"]")  # SVG namespace identifiers are not network requests
def bad_hosts(t):
    t = XMLNS_RE.sub('', t)
    # a literal ending in '.' is the first half of a string concatenation ('https://sandbox.' + host + '.example/...');
    # the composed string is checked by the rendered-text scan instead
    return sorted({h for h in URL_RE.findall(t) if not h.endswith('.') and not RESERVED_HOST.search(h)})
def bad_emails(t): return sorted({m.group(0) for m in EMAIL_RE.finditer(t) if not RESERVED_HOST.search(m.group(1))})
def bad_phones(t):  # prototype convention: fictional +255 000 ... numbers
    return sorted({m.group(0) for m in PHONE_RE.finditer(t) if not re.match(r'\+255 ?\(?000', m.group(0))})
def secrets(t): return sorted({n for n, rx in SECRET_RES if rx.search(t)})

# ---------- 0. self-test: each detector must fire on a planted bad sample and stay quiet on a good one ----------
check('selftest: real-looking URL flagged / reserved URL allowed', bad_hosts('see https://api.realbank.com/v1') == ['api.realbank.com'] and not bad_hosts('https://hooks.example.test/x https://a.example.com'))
check('selftest: SVG xmlns allowed but a bare w3.org link is still flagged', not bad_hosts("xmlns='http://www.w3.org/2000/svg'") and bad_hosts('http://www.w3.org/page') == ['www.w3.org'])
check('selftest: real-looking email flagged / .example allowed', bad_emails('jo@gmail.com') == ['jo@gmail.com'] and not bad_emails('ana@demo-hotel.example'))
check('selftest: real-looking phone flagged / +255 000 allowed', bad_phones('call +255 712 345 678') != [] and not bad_phones('+255 000 000 001'))
planted = {'private key block': '-----BEGIN RSA PRIVATE KEY-----', 'AWS access key id': 'AKIA' + 'A' * 16, 'GitHub token': 'ghp_' + 'a' * 36,
           'API-style secret key': 'sk-' + 'a' * 24, 'JWT': 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghij', 'credentialed URL': 'https://u:pw@host.example/',
           'password/secret assignment': 'password = "hunter2hunter2"', 'Bearer value': 'Bearer abcdef0123456789abcd'}
check('selftest: all %d secret detectors fire on planted samples' % len(planted), all(n in secrets(s) for n, s in planted.items()), [n for n, s in planted.items() if n not in secrets(s)])
check('selftest: documented placeholder token is allowed', not secrets('Bearer SYNTHETIC-SANDBOX-TOKEN'))
check('selftest: network-API detector fires', bool(NETWORK_RE.search('x = fetch(url)')) and bool(NETWORK_RE.search('new WebSocket(u)')))

# ---------- 1. static scan of everything shipped (js, css, html) ----------
shipped = []
for d, _, fs in os.walk(ROOT):
    if '/tests' in d.replace('\\', '/') or '/.git' in d: continue
    for f in fs:
        if f.endswith(('.js', '.css', '.html')): shipped.append(os.path.join(d, f))
shipped.sort(); text = {p: open(p, encoding='utf-8').read() for p in shipped}
rel = lambda p: os.path.relpath(p, ROOT)
check('static: scanned %d shipped files (js/css/html)' % len(shipped), len(shipped) >= 25, len(shipped))
check('static: no URL outside reserved/example hosts', not {rel(p): bad_hosts(t) for p, t in text.items() if bad_hosts(t)}, {rel(p): bad_hosts(t) for p, t in text.items() if bad_hosts(t)})
check('static: no email outside reserved/example domains', not {rel(p): bad_emails(t) for p, t in text.items() if bad_emails(t)}, {rel(p): bad_emails(t) for p, t in text.items() if bad_emails(t)})
check('static: no phone number outside the fictional +255 000 convention', not {rel(p): bad_phones(t) for p, t in text.items() if bad_phones(t)}, {rel(p): bad_phones(t) for p, t in text.items() if bad_phones(t)})
check('static: no secret-like pattern (documented SYNTHETIC-SANDBOX-TOKEN placeholder excepted)', not {rel(p): secrets(t) for p, t in text.items() if secrets(t)}, {rel(p): secrets(t) for p, t in text.items() if secrets(t)})
# comments/strings that merely *describe* "fetch/XHR" are fine; only code-looking uses are counted, so list hits for the reader
net = {rel(p): sorted({m.group(0) for m in NETWORK_RE.finditer(t)}) for p, t in text.items() if NETWORK_RE.search(t)}
code_net = {}
for p, t in text.items():
    stripped = re.sub(r'//[^\n]*|/\*.*?\*/', '', t, flags=re.S)            # drop comments
    stripped = re.sub(r"'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"|`(?:\\.|[^`\\])*`", "''", stripped)  # drop string literals (prose)
    hits = sorted({m.group(0) for m in NETWORK_RE.finditer(stripped)})
    if hits: code_net[rel(p)] = hits
check('static: no network API in executable code (comments and prose strings excluded)', not code_net, code_net)
html = text[os.path.join(ROOT, 'index.html')]
ext_refs = re.findall(r'<(?:script|link|img|iframe|source)[^>]+(?:src|href)=["\'](https?:|//)[^"\']*', html, re.I)
check('static: index.html loads no external script/style/image/frame', not ext_refs, ext_refs)
check('static: CSP meta present and forbids unsafe-eval', bool(re.search(r'Content-Security-Policy', html)) and 'unsafe-eval' not in html)

# ---------- 2. rendered sweep: every route, desktop + phone ----------
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900})
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    routes = pg.evaluate("""(()=>{const R=new Set(Msafiri.allItems().map(r=>r.route));
      Msafiri.dir.users.forEach(u=>{R.add('#/admin/users/'+u.id);R.add('#/admin/users/'+u.id+'/edit')});
      Msafiri.dir.roles.forEach(r=>R.add('#/admin/roles/'+r.id));
      Msafiri.dir.ests.forEach(e=>R.add('#/admin/establishments/'+e.id));
      Msafiri.reporting.rows().forEach(r=>R.add('#/gov/reports/'+r.id));
      Msafiri.integ.all().forEach(i=>{R.add('#/admin/pms-health/'+i.id);R.add('#/admin/integration-events/'+i.id)});
      Msafiri.webhooks.state().hooks&&Msafiri.webhooks.state().hooks.forEach(h=>R.add('#/admin/developer/webhooks/'+h.id));
      ['#/admin/developer/webhooks/new','#/admin/support-incidents','#/admin/exceptional-access','#/admin/roles/new','#/admin/users/new'].forEach(x=>R.add(x));
      return [...R]})()""")
    check('rendered: route set built (nav + detail pages), %d routes' % len(routes), len(routes) >= 100, len(routes))
    JS = """()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
      const rib=[...document.querySelectorAll('.demo-ribbon,.demo-strip')].find(e=>vis(e)&&e.getBoundingClientRect().top<120),foot=document.querySelector('.app-footer');
      return {rib:vis(rib)&&/synthetic|prototype/i.test(rib.textContent),foot:vis(foot)&&/synthetic data only/i.test(foot.textContent)&&/not a production system/i.test(foot.textContent),
              text:document.body.innerText,title:(document.getElementById('page-title')||{}).innerText||''}}"""
    for w, label in ((1366, 'desktop'), (390, 'phone')):
        pg.set_viewport_size({'width': w, 'height': 900}); miss_r, miss_f, miss_t = [], [], []; bh, be, bp = {}, {}, {}
        for r in routes:
            pg.evaluate('h=>location.hash=h', r); pg.wait_for_timeout(90)
            o = pg.evaluate(JS)
            if not o['rib']: miss_r.append(r)
            if not o['foot']: miss_f.append(r)
            if not o['title'].strip(): miss_t.append(r)
            if bad_hosts(o['text']): bh[r] = bad_hosts(o['text'])
            if bad_emails(o['text']): be[r] = bad_emails(o['text'])
            if bad_phones(o['text']): bp[r] = bad_phones(o['text'])
        check('%s: top-of-page demo label (ribbon or strip) visible above the fold with "synthetic/prototype" on all %d routes' % (label, len(routes)), not miss_r, miss_r[:5])
        check('%s: footer "Synthetic data only / Not a production system" visible on all routes' % label, not miss_f, miss_f[:5])
        check('%s: every route has a page title (no blank render)' % label, not miss_t, miss_t[:5])
        check('%s: rendered text has no real-looking URL' % label, not bh, list(bh.items())[:3])
        check('%s: rendered text has no real-looking email' % label, not be, list(be.items())[:3])
        check('%s: rendered text has no phone outside +255 000 convention' % label, not bp, list(bp.items())[:3])
    # ---- Stage 8.5 follow-up: top-bar title clipping on the FULL route set (the Stage 8.1/8.2 checks covered nav routes only) ----
    # Defects: at 320 px, 12 routes clipped their title (#/hotel/pms, roles/hotel-viewer, roles/gov-officer, pms-health/INT-1002..1010);
    # at 360 px, pms-health/INT-1006..1008. Fix is in css/layout.css (<=430 px: top bar grows with the title instead of clamping at 2 lines).
    TJS = """()=>{const h=document.querySelector('#page-title'),tb=document.querySelector('.topbar').getBoundingClientRect(),t=h.getBoundingClientRect();
      return {clip:h.scrollHeight>h.clientHeight+1||h.scrollWidth>h.clientWidth+1,inbar:t.top>=tb.top-1&&t.bottom<=tb.bottom+1,bar:Math.round(tb.height),over:document.documentElement.scrollWidth>innerWidth,title:h.innerText}}"""
    KNOWN = ['#/hotel/pms', '#/admin/roles/hotel-viewer', '#/admin/roles/gov-officer'] + ['#/admin/pms-health/INT-10%02d' % n for n in range(2, 11)]
    for w in (320, 360, 390, 430, 768, 1366):
        pg.set_viewport_size({'width': w, 'height': 800}); pg.wait_for_timeout(250); clip, outb, ovf = [], [], []; tall = {}
        for r in routes:
            pg.evaluate('h=>location.hash=h', r); pg.wait_for_timeout(70); o = pg.evaluate(TJS)
            if o['clip']: clip.append(r)
            if not o['inbar']: outb.append(r)
            if o['over']: ovf.append(r)
            tall[r] = o['bar']
        check('title: not clipped on all %d routes at %d px' % (len(routes), w), not clip, clip[:6])
        check('title: sits fully inside the top bar at %d px' % w, not outb, outb[:6])
        if w <= 430: check('title: no horizontal page overflow at %d px on any route' % w, not ovf, ovf[:6])
        if w >= 390: check('title: top bar keeps its normal 64 px height at %d px for titles that already fit (no layout change)' % w, set(tall.values()) == {64} or (w == 390 and max(tall.values()) <= 90 and sum(1 for v in tall.values() if v == 64) > len(routes) * 0.9), sorted(set(tall.values())))
        if w == 320:
            pg.evaluate('h=>location.hash=h', '#/admin/pms-health/INT-1008'); pg.wait_for_timeout(120); o = pg.evaluate(TJS)
            check('title: the longest title (INT-1008, 4 lines at 320 px) is fully visible, bar grows to fit', not o['clip'] and o['bar'] > 64, o)
            ok = []
            for r in KNOWN:
                pg.evaluate('h=>location.hash=h', r); pg.wait_for_timeout(70); ok.append(not pg.evaluate(TJS)['clip'])
            check('title: each of the 12 routes that clipped at 320 px is now unclipped', all(ok), [r for r, k in zip(KNOWN, ok) if not k])
        if w == 360:
            ok = []
            for r in ['#/admin/pms-health/INT-1006', '#/admin/pms-health/INT-1007', '#/admin/pms-health/INT-1008']:
                pg.evaluate('h=>location.hash=h', r); pg.wait_for_timeout(70); ok.append(not pg.evaluate(TJS)['clip'])
            check('title: the 3 routes that clipped at 360 px are now unclipped', all(ok))
    pg.set_viewport_size({'width': 1366, 'height': 900})
    check('rendered: no console/page errors during the whole sweep', not errs, errs[:3])
    check('rendered: no non-file/data/blob network request during the sweep', not ext, ext[:3])
    b.close()

fails = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(fails), len(fails)))
sys.exit(1 if fails else 0)
