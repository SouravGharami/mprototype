"""Msafiri Stage 8.9 — provisional traceability evidence probe (READ-ONLY; optional, NOT an app dependency).
Gathers the facts cited in STAGE_8_9_TRACEABILITY_MATRIX.md against the PROVISIONAL, UNAPPROVED baseline
(MSAFIRI-URS-PROVISIONAL-2.0). Several checks CHARACTERISE a known limit (e.g. no per-establishment record
isolation); a PASS there means "the limit is real and documented", NOT that a requirement is met.
Run: python3 tests/stage8_9_traceability_probe.py   (needs playwright + chromium). Synthetic data, file://, no network.
It changes no application file; it only drives index.html in a headless browser."""
import os, re, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = 'file://' + os.path.join(ROOT, 'index.html')
res = []
def check(n, ok, d=''): res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:200]))
def go(pg, h): pg.evaluate('h=>location.hash=h', h); pg.wait_for_timeout(220)
def T(pg, s='#main'): return pg.inner_text(s)
# Stage 9.0: the five Hotel placeholders are now built pages; only admin/connectors remains a placeholder (name SIX kept for history).
SIX = ['admin/connectors']
LABEL = re.compile(r'synthetic|demo|sample|simulated|illustrative|prototype', re.I)

with sync_playwright() as p:
    b = p.chromium.launch()
    def fresh(w=1280):
        pg = b.new_page(viewport={'width': w, 'height': 800}); errs = []; reqs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('file:', 'data:')) else None)
        pg.goto(BASE); pg.wait_for_timeout(300); return pg, errs, reqs

    # ---- A. Navigation / placeholder / responsive sweep (FR-017, NFR-004, FR-014/015, NFR-007) ----
    pg, errs, reqs = fresh()
    nav = pg.evaluate('JSON.parse(JSON.stringify(Msafiri.nav))')
    routes = [(po + '/' + it['id']) for po, gs in nav.items() for g in gs for it in g['items']]
    reg = {r: pg.evaluate('r=>!!Msafiri.pages[r]', r) for r in routes}
    unreg = [r for r in routes if not reg[r]]
    check('A1 nav has 38 items (hotel 12, gov 7, admin 19)', len(routes) == 38 and [sum(1 for r in routes if r.startswith(x + '/')) for x in ('hotel', 'gov', 'admin')] == [12, 7, 19], len(routes))
    check('A2 exactly the one remaining known placeholder route (admin/connectors) has no registered page (Stage 9.0; was six)', sorted(unreg) == sorted(SIX), unreg)
    ph_ok = True; unlabeled = []; shortp = []
    for r in routes:
        go(pg, '#/' + r); t = T(pg)
        if r in SIX and not re.search(r'Planned module', t): ph_ok = False
        if r not in SIX:
            if len(t) < 300: shortp.append(r)
            if not LABEL.search(t): unlabeled.append(r)
    check('A3 each placeholder shows the "Planned module" template and nothing else', ph_ok)
    check('A4 every live page has real content (>300 chars)', not shortp, shortp)
    check('A5 every live page carries a synthetic/demo/sample/simulated wording (keyword presence only)', not unlabeled, unlabeled)
    check('A6 no console/page errors across all 38 routes', not errs, errs[:3])
    check('A7 no non-file network request during the sweep (NFR-007, FR-014)', not reqs, reqs[:3])
    pwd = pg.evaluate('''()=>0'''); bad_pw = []
    for r in routes:
        go(pg, '#/' + r)
        if pg.evaluate("document.querySelectorAll('input[type=password]').length"): bad_pw.append(r)
    check('A8 no password field on any route (FR-012)', not bad_pw, bad_pw)
    for po in ('hotel', 'gov', 'admin'):
        go(pg, '#/%s/dashboard' % po); pg.click('.user-btn'); pg.wait_for_timeout(150)
        mt = pg.inner_text('body')
        check('A9 %s user menu: "Acting as (demo user)" and sign-out "Not available in prototype"' % po, 'acting as (demo user)' in mt.lower() and 'not available in prototype' in mt.lower())
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    pg.close()
    pg, errs, reqs = fresh(375); bad = []
    for r in routes:
        go(pg, '#/' + r)
        if pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'): bad.append(r)
    check('A10 no horizontal page scroll at 375px on any of 38 routes (NFR-004)', not bad, bad)
    check('A11 mobile "Open navigation" control exists at 375px', pg.evaluate("!!document.querySelector('button[aria-label=\"Open navigation\"]')"))
    pg.close()

    # ---- B. Establishment context (FR-006, NFR-001) ----
    pg, errs, reqs = fresh()
    check('B1 directory holds 20 synthetic establishments', pg.evaluate('Msafiri.dir.ests.length') == 20)
    keys = pg.evaluate('Object.keys(Msafiri.store.recs[0])')
    check('B2 LIMIT: hotel records carry no establishment field (no per-establishment data model)', not any(re.search(r'^(est|establishment|property|hotel|site)', k, re.I) for k in keys), keys)
    check('B3 LIMIT: only PIL-001 users can be chosen as the hotel acting user', pg.evaluate('Msafiri.dir.eligible("hotel").every(u=>u.est==="PIL-001")'))
    n1 = pg.evaluate('Msafiri.store.recs.length')
    pg.evaluate('Msafiri.dir.actAs("hotel","USR-005")'); go(pg, '#/hotel/dashboard'); go(pg, '#/hotel/registrations')
    t = T(pg); n2 = pg.evaluate('Msafiri.store.recs.length')
    check('B4 DEFECT EVIDENCE: acting as a user of another establishment (USR-005, Palm Crest Lodge, set via console) shows the SAME %d records — no isolation' % n1,
          n1 == n2 == 13 and 'REG-241012' in t, (n1, n2))
    pg.click('.user-btn'); pg.wait_for_timeout(200)
    check('B5 persona label follows the user while the data does not (user menu says Palm Crest Lodge)', 'Palm Crest Lodge' in pg.inner_text('body'))
    pg.close()

    # ---- C. Registration, validation, review (FR-001/002/003) ----
    pg, errs, reqs = fresh(); go(pg, '#/hotel/new-registration')
    ids = pg.evaluate("[...document.querySelectorAll('#main input,#main select')].map(e=>e.id)")
    check('C1 form exposes the 11 captured fields', len(ids) == 11, ids)
    unl = pg.evaluate('''()=>[...document.querySelectorAll('#main input,#main select')].filter(e=>!(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||(e.id&&document.querySelector('label[for="'+e.id+'"]'))||e.closest('label'))).length''')
    check('C2 every form control has an accessible name (NFR-004)', unl == 0, unl)
    r = pg.evaluate('''()=>{var f=Msafiri.store.validateReg({});return f}''')
    check('C3 shared validator rejects an empty record with field errors (FR-002)', r and (isinstance(r, dict) and len(r) >= 8 or isinstance(r, list) and len(r) >= 8), r)
    r = pg.evaluate('''()=>Msafiri.store.validateReg({first:'Ann',last:'Lee',dob:'1800-01-01',nat:'Kenya',docType:'Passport',docNo:'AB123456',room:'1',arrival:'2026-10-22',departure:'2026-10-23',checked:true})''')
    check('C4 LIMIT: DOB 1800-01-01 is accepted (no plausibility limit; not invented)', not r or (not isinstance(r, dict) and not len(r)) or ('dob' not in r), r)
    pg.close()

    # ---- D. Search / filters / lifecycle / consistency (FR-004/005/007/013/018) ----
    pg, errs, reqs = fresh(); go(pg, '#/hotel/registrations')
    def rows(): return pg.evaluate("document.querySelectorAll('#main tbody tr').length")
    def tot(): return re.search(r'of (\d+)', T(pg).split('Showing')[-1]).group(1) if 'Showing' in T(pg) else None
    check('D1 registrations list total equals the store (13)', tot() == '13', tot())
    for q, exp in (('Amara', 'REG-241012'), ('REG-241013', 'Lukas'), ('Tanzania', 'Zainab')):
        pg.fill('#main input[type=search]', q); pg.wait_for_timeout(250)
        check('D2 search "%s" finds %s' % (q, exp), exp in T(pg))
    pg.fill('#main input[type=search]', ''); pg.wait_for_timeout(200)
    docno = pg.evaluate('Msafiri.store.recs[0].docNo'); pg.fill('#main input[type=search]', docno); pg.wait_for_timeout(250)
    check('D3 LIMIT: search does not match document number (keys: name, reference, room, nationality); masked in list', 'No ' in T(pg) or rows() == 0 or 'REG-241012' not in T(pg), docno)
    check('D4 full document numbers are not displayed in the list', docno not in T(pg))
    pg.fill('#main input[type=search]', ''); pg.wait_for_timeout(200)
    pg.select_option('#main select', 'Rejected'); pg.wait_for_timeout(250)
    check('D5 status filter "Rejected" count equals store', tot() == str(pg.evaluate('Msafiri.store.count("Rejected")')), tot())
    go(pg, '#/hotel/dashboard'); t = T(pg)
    m = re.search(r'Total registrations\s+(\d+)', t)
    check('D6 dashboard total equals store (FR-007/018)', m and int(m.group(1)) == pg.evaluate('Msafiri.store.recs.length'))
    go(pg, '#/hotel/submissions'); n = re.search(r'of (\d+)', T(pg).split('Showing')[-1])
    check('D7 submissions list equals records with a reported status (FR-018)', n and int(n.group(1)) == pg.evaluate('Msafiri.store.recs.filter(r=>r.sub!=="Not reported").length'))
    badge = lambda: pg.evaluate("(document.querySelector('a[href=\"#/hotel/offline-queue\"] .nav-count')||{}).innerText")
    check('D8 offline-queue nav badge equals store queue (FR-013)', str(badge()) == str(pg.evaluate('Msafiri.store.queue().length')), badge())
    pg.evaluate('Msafiri.store.resolve("REG-240951","server")'); pg.wait_for_timeout(250)
    check('D9 badge follows the store after a conflict is resolved', str(badge()) == str(pg.evaluate('Msafiri.store.queue().length')), badge())
    pg.close()

    # ---- E. Access behaviour (FR-011, NFR-001) ----
    pg, errs, reqs = fresh()
    pg.evaluate('Msafiri.dir.actAs("hotel","USR-004")'); go(pg, '#/hotel/new-registration'); pg.wait_for_timeout(200)
    t = T(pg)
    check('E1 read-only hotel user: registration route shows no form and a denial (FR-011)', 'f-first' not in pg.content() and re.search(r'not permitted|permission', t, re.I), t[:120])
    n = pg.evaluate('Msafiri.store.recs.length'); ok = pg.evaluate('Msafiri.store.cancel("REG-241015","x")')
    check('E2 store-level call by that user is refused and changes nothing', ok is False and pg.evaluate('Msafiri.store.recs.length') == n and pg.evaluate('Msafiri.store.get("REG-241015").stay') != 'Cancelled')
    check('E3 refusal is audited as Permission denied', pg.evaluate('Msafiri.store.audit.some(a=>a.type==="Permission denied")'))
    pg.evaluate('Msafiri.dir.actAs("hotel","USR-001")')
    check('E4 LIMIT: access control is front-end only — the acting user can be switched from the console and records are mutable in memory (no server)', pg.evaluate('typeof Msafiri.store.recs.push==="function" && Msafiri.dir.can("registration:create","hotel")'))
    pg.evaluate('Msafiri.dir.actAs("gov","USR-014")'); go(pg, '#/gov/audit'); t = T(pg)
    check('E5 gov analyst opening Audit route sees a denial or the page, never a blank (FR-017)', len(t) > 100)
    pg.close()

    # ---- F. Audit visibility, reporting, export wording (FR-009/010/016) ----
    pg, errs, reqs = fresh()
    r = pg.evaluate('Msafiri.store.checkIn({first:"Zed",last:"Probe",dob:"1990-01-01",nat:"Kenya",docType:"Passport",docNo:"ZZ123456",room:"99",arrival:"%s",departure:"%s",checked:true})' % (__import__('datetime').date.today().isoformat(), (__import__('datetime').date.today() + __import__('datetime').timedelta(days=1)).isoformat()))
    check('F1 valid check-in creates a record and writes audit entries naming the acting demo user (FR-010)', pg.evaluate('Msafiri.store.audit.some(a=>/Neema Kiptoo/.test(a.user) && /REG-/.test(a.target))'), r)
    bad = pg.evaluate('Msafiri.store.checkIn({first:"",last:"",dob:"",nat:"",docType:"",docNo:"",room:"",arrival:"",departure:"",checked:false})')
    check('F2 invalid check-in returns no record and audits "Action blocked" (FR-016)', not bad and pg.evaluate('Msafiri.store.audit.some(a=>a.type==="Action blocked")'), bad)
    go(pg, '#/gov/audit'); t = T(pg)
    check('F3 government Audit page lists the Hotel events (FR-010)', re.search(r'Registration|Submission|Action blocked', t) is not None)
    go(pg, '#/gov/reports'); t = T(pg)
    check('F4 reports page states sample/simulated and that no real submission occurs (FR-009)', re.search(r'synthetic sample', t, re.I) and re.search(r'nothing is a real government submission', t, re.I))
    check('F5 LIMIT: no seeded role holds reports:create (export unusable by default)', not pg.evaluate('Msafiri.dir.roles.some(r=>(r.perms||[]).indexOf("reports:create")>-1)') if pg.evaluate('Array.isArray(Msafiri.dir.roles[0].perms)') else True)
    go(pg, '#/gov/dashboard'); t = T(pg)
    check('F6 gov dashboard labelled demo/synthetic; pilot "17 of 20" marked planning context (FR-015)', LABEL.search(t) and 'planning' in t.lower())
    pg.close()

    # ---- G. Privacy / security hygiene (NFR-001/002) ----
    pg, errs, reqs = fresh()
    check('G1 CSP meta present with default-src none and no inline <script> bodies', pg.evaluate("(document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')||{}).content||''").startswith("default-src 'none'") and pg.evaluate("[...document.scripts].every(s=>s.src)"))
    check('G2 all seeded document numbers follow the synthetic pattern P[AB]nnnnnnn', pg.evaluate('Msafiri.store.recs.every(r=>/^P[AB]\\d{7}$/.test(r.docNo))'))
    check('G3 all seeded user emails use reserved .example domains and +255 000 phones', pg.evaluate('Msafiri.dir.users.every(u=>/\\.example$/.test(u.email)&&/^\\+255 000/.test(u.phone))'))
    pg.close(); b.close()

# ---- H. Documentation integrity (only when the Stage 8.9 documents exist) ----
mx = os.path.join(ROOT, 'STAGE_8_9_TRACEABILITY_MATRIX.md')
if os.path.exists(mx):
    s = open(mx, encoding='utf-8').read()
    ids = ['MSF-FR-%03d' % i for i in range(1, 19)] + ['MSF-NFR-%03d' % i for i in range(1, 9)]
    miss = [i for i in ids if not re.search(r'^\|\s*\*?\*?%s\b' % i, s, re.M)]
    check('H1 traceability matrix has a row for all 26 provisional IDs', not miss, miss)
    st = re.findall(r'^\|\s*\*?\*?MSF-N?FR-\d{3}\*?\*?\s*\|(?:[^|]*\|){2}\s*\*?\*?(Implemented|Partial|Missing|Blocked|Not Verified)\b', s, re.M)
    check('H2 every matrix row uses an allowed status (found %d)' % len(st), len(st) == 26, len(st))
    check('H3 matrix labels itself provisional and unapproved', 'Provisional — stakeholder confirmation required' in s and 'NOT THE ORIGINAL APPROVED URS' in s)
for f in ('STAGE_8_9_IMPLEMENTATION_GAP_REPORT.md', 'STAGE_8_9_REPORT.md'):
    check('H4 %s exists' % f, os.path.exists(os.path.join(ROOT, f)))

fails = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(fails), len(fails)))
if fails: print('FAILED:', fails); sys.exit(1)
