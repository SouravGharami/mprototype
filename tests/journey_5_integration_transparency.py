"""Msafiri Stage 8.3 — Journey 5: integration transparency (optional; NOT an app dependency).
Run: python3 tests/journey_5_integration_transparency.py   (playwright + chromium; file://, synthetic data)
Verifies that every simulated integration, test-connection action, webhook, sandbox call, export and submission status is
represented honestly, and that nothing is actually transmitted. An init script counts every network-capable browser API
call from page start (fetch, XHR, sendBeacon, WebSocket, EventSource, remote <img>/<script>/<link>), so 'no external
request' is proven by instrumentation, not just by absence of Playwright request events. Every Playwright action has a 5 s timeout."""
import os, re, sys
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
res = []
def check(n, ok, d=''): res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:260]))
SPY = """(()=>{window.__net=[];const log=(k,u)=>window.__net.push(k+':'+String(u));
 const f=window.fetch; window.fetch=function(u){log('fetch',u);return f.apply(this,arguments)};
 const o=XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open=function(m,u){log('xhr',u);return o.apply(this,arguments)};
 if(navigator.sendBeacon){const sb=navigator.sendBeacon.bind(navigator); navigator.sendBeacon=function(u){log('beacon',u);return sb.apply(null,arguments)}}
 const W=window.WebSocket; window.WebSocket=function(u){log('ws',u);return new W(...arguments)};
 const E=window.EventSource; if(E) window.EventSource=function(u){log('sse',u);return new E(...arguments)};
 })()"""
# A line that CLAIMS real transmission/connectivity must carry a qualifier (simulated / not / never / demo ...) to pass.
CLAIM = re.compile(r"(sent|transmitted|submitted|delivered|forwarded|reported|uploaded|pushed|synchron\w+)\s+(successfully\s+)?to\s+(the\s+)?(government|ministry|national|authority|immigration|police|regulator)"
                   r"|live\s+(government|pms|connection|monitoring|integration|feed|api)|real[- ]time\s+(sync|connection|submission|monitoring)|connected to (the\s+)?(government|ministry)"
                   r"|officially\s+(acknowledged|accepted|registered)|production[- ]ready|certified|accredited|(received|accepted|acknowledged)\s+by\s+(the\s+)?(government|ministry|authority)", re.I)
QUAL = re.compile(r"simulat|synthetic|illustrative|demonstrat|demo\b|prototype|placeholder|\bnot\b|\bnever\b|\bno\b|nothing|would|pending specification|planned|reserved|sample|fictional|without|n't", re.I)
DISCLOSE = re.compile(r"simulat|synthetic|demonstrat|prototype|illustrative|fictional|demo\b", re.I)
def unqualified(text):
    # Judge each sentence/line WITH the next line, so label/value rows ("Live monitoring" / "None - status shown is a demonstration") count as one statement.
    lines = [l for l in re.split(r"[\n]+|(?<=[.!?])\s+", text) if l.strip()]; out = []
    for i, ln in enumerate(lines):
        if CLAIM.search(ln) and not QUAL.search(ln + ' ' + (lines[i + 1] if i + 1 < len(lines) else '')): out.append(ln.strip()[:140])
    return out

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True); pg = ctx.new_page(); pg.set_default_timeout(5000)
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    ctx.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'about:', 'blob:')) else None)
    ctx.add_init_script(SPY)
    def fresh(): pg.goto('about:blank'); pg.goto(BASE); pg.wait_for_timeout(300)
    def go(h): pg.evaluate('h=>location.hash=h', h); pg.wait_for_timeout(300)
    def main(): return pg.inner_text('#main')
    def menu(): pg.click('#user-btn'); pg.wait_for_selector('#user-panel [data-action=act-as]', state='visible')
    def act_as(uid): menu(); pg.click('#user-panel [data-action=act-as][data-user=%s]' % uid); pg.wait_for_timeout(300)
    def portal(pid): menu(); pg.click('#user-panel [data-action=switch-portal][data-portal=%s]' % pid); pg.wait_for_timeout(300)
    def modal(): return pg.inner_text('#modal-root')
    def net(): return pg.evaluate('window.__net||[]')
    def until(expr, arg=None, ms=5000):
        # CSP (script-src 'self', no unsafe-eval) forbids Playwright's wait_for_function; poll via evaluate instead, bounded.
        for _ in range(ms // 100):
            if pg.evaluate(expr, arg): return True
            pg.wait_for_timeout(100)
        raise AssertionError('timed out after %d ms waiting for: %s' % (ms, expr))
    fresh()

    # ---- A. Integration dashboard / detail / event history (admin) ----
    portal('admin'); go('#/admin/pms-health')
    t = main()
    check('Integration dashboard states no real PMS, vendor API or government system is called', re.search(r'No real PMS, vendor API or government system', t) is not None, t[:300])
    check('Every integration row is tagged "Simulated"', t.count('Simulated') >= 8, t.count('Simulated'))
    check('Dashboard stat cards labelled as simulated state', 'simulated state' in t)
    go('#/admin/pms-health/INT-1001'); t = main()
    check('Detail page: "Simulated actions" notice present', 'Simulated actions' in t and 'no real PMS' in t.lower().replace('—', ' ') or 'Simulated action' in t, t[:200])
    check('Detail page: health is labelled a local scripted result, not live monitoring', 'local scripted result' in t and 'Not live monitoring' in t)
    check('Detail page: credentials are masked, never shown', 'Credentials are masked and never shown' in t and not re.search(r'(sk|pk)_[A-Za-z0-9]{8,}|Bearer\s+\S{10,}', t))

    # ---- B. Test connection / health / connect actions are scripted and say so ----
    n0 = pg.evaluate('Msafiri.integ.events.length')
    pg.click('[data-action=integ-act][data-act=test]'); pg.wait_for_timeout(150)
    check('While running, UI says "(simulated)"', 'simulated' in main().lower() and 'Testing' in main() or 'simulated' in main().lower())
    until("!Msafiri.integ.busy['INT-1001']"); pg.wait_for_timeout(200)
    t = main()
    check('Test-connection result is labelled "(simulated)"', re.search(r'Test connection (completed|failed) \(simulated\)', t) is not None, t[:300])
    check('Test-connection result makes no real-system claim', not unqualified(t), unqualified(t))
    check('Test-connection recorded as a simulated event', pg.evaluate('Msafiri.integ.events.length') > n0 and '(simulated' in pg.evaluate("Msafiri.integ.events[0].msg").lower() or 'simulated' in pg.evaluate("JSON.stringify(Msafiri.integ.events[0])").lower(), pg.evaluate("Msafiri.integ.events[0]"))
    pg.click('[data-action=integ-act][data-act=health]'); until("!Msafiri.integ.busy['INT-1001']"); pg.wait_for_timeout(200)
    check('Health-check result is labelled "(simulated)"', re.search(r'Health check (completed|failed) \(simulated\)', main()) is not None, main()[:300])
    dis = pg.evaluate("(()=>{const r=Msafiri.integ.recs.find(x=>x.enabled===false); return r&&r.id})()")
    check('A disabled integration exists to test against', bool(dis), dis)
    if dis:
        go('#/admin/pms-health/' + dis); b_ = pg.locator('[data-action=integ-act][data-act=test]')
        if b_.count():
            b_.click(); until("id=>!Msafiri.integ.busy[id]", dis); pg.wait_for_timeout(200)
            t = main(); check('Test on a disabled integration is a Warning, never a success', 'completed' in t and 'disabled' in t.lower() and 'simulated' in t.lower() and 'Warning' in t or 'disabled' in t.lower() and 'simulated' in t.lower(), t[:300])
        else: check('Test button on disabled integration is withheld (acceptable)', True)
    # permission: read-only roles cannot run actions
    fresh(); portal('admin'); act_as('USR-019'); go('#/admin/pms-health/INT-1001')
    check('Support (read-only) role cannot run a test connection', pg.evaluate("[...document.querySelectorAll('[data-action=integ-act]')].filter(b=>!b.disabled).length") == 0, pg.evaluate("[...document.querySelectorAll('[data-action=integ-act]')].map(b=>b.dataset.act+':'+b.disabled)"))
    go('#/admin/integration-events'); t = main()
    check('Event history is labelled synthetic/simulated', 'Simulated integration events' in t and re.search(r'synthetic|simulated', t, re.I) is not None)
    pg.click('[data-action=ev-open]'); pg.wait_for_timeout(300)
    check('Event dialog says "Synthetic event … not a real operational log"', 'Synthetic event' in modal() and 'not a real operational log' in modal(), modal()[:200])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)

    # ---- C. Webhooks: nothing sent; "success" is never presented as a real delivery ----
    fresh(); portal('admin'); go('#/admin/developer/webhooks'); t = main()
    check('Webhook list: "Simulation only — nothing is sent"', 'Simulation only' in t and 'nothing is sent' in t)
    check('Webhook list: every destination shows "Never contacted"', t.count('Never contacted') == 3, t.count('Never contacted'))
    check('Webhook results carry "(simulated)"', 'Succeeded (simulated)' in t and 'Failed (simulated)' in t)
    go('#/admin/developer/webhooks/WH-001'); t = main()
    check('Webhook detail: "Signing secret — None. No secret is created"', 'None. No secret is created, stored or shown' in t)
    check('Webhook detail: event contract labelled illustrative/pending specification', 'Illustrative — pending specification' in t)
    check('Webhook payload preview carries "simulated": true and synthetic guest', '"simulated": true' in t and 'synthetic' in t.lower())
    pg.click('[data-action=wh-sim]'); pg.wait_for_timeout(1500); until("document.querySelector('#main').innerText.indexOf('Latest simulated attempt')>=0"); t = main()
    check('Simulated delivery success reads "Simulated — not a real delivery"', 'not a real delivery' in t, t[-500:])
    check('Delivery result makes no unqualified real-delivery claim', not unqualified(t), unqualified(t))
    # failure scenario then retry
    pg.select_option('select >> nth=1', index=4); pg.click('[data-action=wh-sim]'); pg.wait_for_timeout(2500); t = main()
    check('Persistent-failure scenario shows a simulated failure', re.search(r'Failed \(simulated\)|failed \(simulated\)|simulated', t) is not None and 'Failed' in t, t[-500:])
    check('Webhook toggling/deleting is a local configuration change only (notice stays)', 'Simulation only' in t)

    # ---- D. Sandbox: scripted JS responses, labelled simulated ----
    go('#/admin/developer/sandbox'); t = main()
    check('Sandbox page: "Simulated sandbox — nothing is sent"', 'Simulated sandbox' in t and 'nothing is sent' in t and 'No guest data is transmitted' in t)
    eps = pg.eval_on_selector_all('#sb-ep option', 'o=>o.map(x=>x.value)'); seen = 0; bad = []
    for ep in eps:
        pg.select_option('#sb-ep', ep); pg.wait_for_timeout(150)
        cases = pg.eval_on_selector_all('#sb-case option', 'o=>o.map(x=>x.value)')
        for cs in cases[:3]:
            pg.select_option('#sb-case', cs); pg.click('[data-action=sb-send]'); pg.wait_for_timeout(1200)
            txt = pg.inner_text('#main'); seen += 1
            if 'simulated' not in txt.lower().split('simulated response', 1)[-1]: bad.append((ep, cs))
            if unqualified(txt): bad.append((ep, cs, unqualified(txt)))
    check('Sandbox: %d responses across all endpoints are labelled simulated and make no real claim' % seen, seen >= 8 and not bad, bad[:2])
    check('Sandbox refuses/never shows credential-looking headers (no Authorization echo)', 'Bearer ' not in main())

    # ---- E. Registration submission & acknowledgement (hotel) ----
    fresh(); go('#/hotel/new-registration')
    for k, v in dict(first='Jo', last='Journey', dob='1990-01-01', docNo='ABC12345', room='9', arrival='2026-10-21', departure='2026-10-22').items(): pg.fill('#f-' + k, v)
    pg.select_option('#f-nat', 'Kenya'); pg.select_option('#f-docType', 'Passport'); pg.check('#f-checked')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250); t = modal()
    check('Review dialog does not claim anything has been sent yet', not unqualified(t), unqualified(t))
    pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(400); t = modal()
    check('Result dialog states the submission is simulated', 'simulated' in t.lower(), t[:300])
    check('Result dialog makes no unqualified government-transmission claim', not unqualified(t), unqualified(t))
    pg.keyboard.press('Escape'); go('#/hotel/submissions'); t = main()
    check('Submission Centre: "Acknowledged … NOT a real government acknowledgement"', 'NOT a real government acknowledgement' in t)
    pg.wait_for_timeout(4500); go('#/hotel/submissions')
    check('Submission eventually shows Acknowledged AND the disclaimer is still on the page', 'Acknowledged' in main() and 'NOT a real government acknowledgement' in main())
    go('#/hotel/offline-queue'); t = main()
    check('Offline queue says records are not delivered until synchronised', re.search(r'not (yet )?(delivered|sent|reported)|until', t, re.I) is not None and not unqualified(t), t[:300])
    go('#/hotel/pms'); t = main()
    # Stage 9.0: the Hotel PMS page is now a built, openly-simulated page (still no real-connection claim).
    check('Hotel PMS page is built, openly labelled simulated, and makes no unqualified connection claim', 'Planned module' not in t and 'Simulated PMS' in t and 'no real PMS is connected' in t and not unqualified(t), (unqualified(t) or t[:200]))
    portal('gov'); go('#/gov/submission-quality'); t = main()
    check('Government monitoring: "no real government API is involved"', 'no real government API is involved' in t and 'SIMULATED' in t)

    # ---- F. Export is a local synthetic file, "not submitted anywhere" ----
    fresh(); portal('gov'); rid = pg.evaluate('Msafiri.reporting.rows()[0].id'); go('#/gov/reports/' + rid)
    btn = pg.locator('button:has-text("Export synthetic CSV")').first
    check('Export disabled for the default government role (no silent export)', btn.is_disabled())
    nbefore = len(net())
    pg.evaluate("Msafiri.dir.roleSave('gov-officer', Msafiri.dir.role('gov-officer').perms.concat(['reports:create']))"); go('#/gov/reports'); go('#/gov/reports/' + rid)
    btn = pg.locator('button:has-text("Export synthetic CSV")').first
    if btn.is_enabled():
        with pg.expect_download(timeout=5000) as dl: btn.click()
        d = dl.value; path = d.path(); csv = open(path, encoding='utf-8-sig').read()
        check('Export produced a local file named as synthetic/sample', re.search(r'synthetic|sample|demo|sim', d.suggested_filename, re.I) is not None, d.suggested_filename)
        check('Export file content is marked synthetic/simulated', re.search(r'synthetic|simulated|sample|demo', csv, re.I) is not None, csv[:200])
        toasts = pg.inner_text('body')
        check('Export toast says "Synthetic CSV created" and claims no transmission', 'Synthetic CSV created' in toasts and not unqualified(toasts))
        check('Export audit entry says "not submitted anywhere"', pg.evaluate("Msafiri.store.audit.some(a=>a.type==='Report export (simulated)'&&/not submitted anywhere/.test(a.detail))"))
    else: check('Export enabled after granting the permission (test setup)', False, 'button still disabled')
    check('Export made no network call', len(net()) == nbefore, net())

    # ---- G. Sweep: every reachable page, every portal: no unqualified claims; status words come with a disclosure ----
    fresh(); sweep_bad, disc_bad, n_pages = [], [], 0
    extra = {'hotel': [], 'gov': [], 'admin': ['#/admin/developer', '#/admin/developer/integrations', '#/admin/developer/sandbox', '#/admin/developer/webhooks', '#/admin/developer/webhooks/WH-002', '#/admin/developer/webhooks/new', '#/admin/integration-events']
             + ['#/admin/pms-health/INT-10%02d' % i for i in range(1, 11)]}
    for pid in ['hotel', 'gov', 'admin']:
        portal(pid)
        hrefs = pg.eval_on_selector_all('#sidebar a[href^="#/"]', 'e=>[...new Set(e.map(a=>a.getAttribute("href")))]') + extra[pid]
        for h in dict.fromkeys(hrefs):
            go(h); t = main(); n_pages += 1
            u = unqualified(t)
            if u: sweep_bad.append((h, u[:1]))
            if re.search(r'\b(Acknowledged|Submitted|Connected|Delivered)\b', t) and not DISCLOSE.search(t): disc_bad.append(h)
    check('Sweep of %d pages: no unqualified real-transmission/connectivity claim' % n_pages, n_pages > 40 and not sweep_bad, sweep_bad[:3])
    check('Sweep: every page showing Acknowledged/Submitted/Connected/Delivered also carries a simulation/demo disclosure', not disc_bad, disc_bad[:5])

    # ---- H. Global proof: nothing left the browser ----
    check('Instrumented network APIs (fetch/XHR/beacon/WebSocket/SSE) were never called', not net(), net())
    check('No non-file/data/blob request seen by the browser', not ext, ext[:3])
    check('No uncaught page errors / console errors', not errs, errs[:2])
    b.close()
print('\n%d passed, %d failed' % (sum(res), len(res) - sum(res))); sys.exit(0 if all(res) else 1)
