"""Msafiri Stage 8.4 — probe of the PROVISIONAL requirements baseline (MSAFIRI-URS-PROVISIONAL-2.0, 'v2.0-P').
That document is a reconstruction, NOT the approved URS. Every check below is tagged with the provisional ID it
supports; a PASS shows the prototype behaves as stated, NOT that an approved requirement is met.
Run: python3 tests/stage8_4_provisional_probe.py   (playwright + chromium; file://, synthetic data, no network)
Note: the app CSP forbids unsafe-eval, so this script never uses wait_for_function."""
import os, re
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
bad, errs, ext = [], [], []
def chk(n, ok, d=''):
    print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:200]))
    if not ok: bad.append(n)
def go(pg, h): pg.evaluate('h=>location.hash=h', h); pg.wait_for_timeout(250)
def txt(pg, s='#main'): return pg.inner_text(s)
def ev(pg, js): return pg.evaluate(js)
def dialog_buttons(pg):
    return ev(pg, "[...document.querySelectorAll('[role=dialog] button, .modal button')].map(b=>b.innerText.trim()).filter(Boolean)")
def close_dialog(pg):
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)

    # --- MSF-FR-005 record lifecycle: actions offered per stay status ------------------------------------
    go(pg, '#/hotel/registrations')
    stays = ev(pg, "Array.from(new Set(Msafiri.store.recs.map(r=>r.stay)))")
    print('INFO stay statuses present in seed data:', stays)
    for st in stays:
        ref = ev(pg, "(s=>{var r=Msafiri.store.recs.find(x=>x.stay===s);return r&&r.ref})('%s')" % st)
        ev(pg, "Msafiri.openRecord('%s')" % ref); pg.wait_for_timeout(250)
        btns = dialog_buttons(pg); close_dialog(pg)
        has = lambda w: any(w.lower() in x.lower() for x in btns)
        if st in ('Cancelled', 'Checked out'):
            chk('FR-005 [%s] terminal record offers no Amend / Cancel / Check out' % st, not (has('Amend') or has('Cancel registration') or has('Check out')), btns)
        if st == 'Expected':
            chk('FR-005 [Expected] offers Start check-in and no Check out', has('Start check-in') and not has('Check out'), btns)
        if st == 'Checked in':
            chk('FR-005 [Checked in] offers Amend, Cancel and Check out', has('Amend') and has('Cancel registration') and has('Check out'), btns)

    # --- MSF-FR-005/016 store-level guards (a direct call must not corrupt status; added in Stage 8.4) -------
    pg.reload(); pg.wait_for_timeout(300)
    R = lambda js: ev(pg, js)
    ci = R("Msafiri.store.recs.find(r=>r.stay==='Checked in').ref")
    chk('FR-005 store.cancel returns true for a legitimate cancel', R("Msafiri.store.cancel('%s','probe reason')" % ci) is True)
    chk('FR-005 record is Cancelled after legitimate cancel', R("Msafiri.store.get('%s').stay" % ci) == 'Cancelled')
    n0 = R("Msafiri.store.get('%s').history.length" % ci)
    chk('FR-005 store.checkOut on a Cancelled record returns false', R("Msafiri.store.checkOut('%s')" % ci) is False)
    chk('FR-005 ...and leaves it Cancelled with no new history event', R("Msafiri.store.get('%s').stay" % ci) == 'Cancelled' and R("Msafiri.store.get('%s').history.length" % ci) == n0)
    chk('FR-005 store.cancel on an already-Cancelled record returns false', R("Msafiri.store.cancel('%s','again')" % ci) is False)
    room0 = R("Msafiri.store.get('%s').room" % ci)
    chk('FR-005 store.amend on a Cancelled record returns false and keeps the room', R("Msafiri.store.amend('%s',{room:'999',departure:'2099-01-01'})" % ci) is False and R("Msafiri.store.get('%s').room" % ci) == room0)
    co = R("Msafiri.store.recs.find(r=>r.stay==='Checked out').ref")
    chk('FR-005 store.cancel on a Checked-out record returns false and keeps it Checked out', R("Msafiri.store.cancel('%s','x')" % co) is False and R("Msafiri.store.get('%s').stay" % co) == 'Checked out')
    ex = R("Msafiri.store.recs.find(r=>r.stay==='Expected').ref")
    chk('FR-005 store.checkOut on an Expected record returns false and keeps it Expected', R("Msafiri.store.checkOut('%s')" % ex) is False and R("Msafiri.store.get('%s').stay" % ex) == 'Expected')
    chk('FR-005 blocked lifecycle attempts are written to the audit list', R("Msafiri.store.audit.filter(a=>a.type==='Action blocked').length") >= 4)
    # MSF-FR-002 amend date rule enforced at store level, valid amend still works
    ch = R("Msafiri.store.recs.find(r=>r.stay==='Checked in').ref"); dep0 = R("Msafiri.store.get('%s').departure" % ch); arr = R("Msafiri.store.get('%s').arrival" % ch)
    chk('FR-002 store.amend rejects departure on arrival date', R("Msafiri.store.amend('%s',{room:'777',departure:'%s'})" % (ch, arr)) is False and R("Msafiri.store.get('%s').departure" % ch) == dep0)
    chk('FR-002 store.amend rejects an empty room', R("Msafiri.store.amend('%s',{room:'  ',departure:'2099-01-01'})" % ch) is False)
    chk('FR-002 store.amend accepts a valid change (regression)', R("Msafiri.store.amend('%s',{room:'777',departure:'2099-01-01'})" % ch) is True and R("Msafiri.store.get('%s').room" % ch) == '777')
    co2 = R("Msafiri.store.recs.find(r=>r.stay==='Checked in').ref")
    chk('FR-005 store.checkOut on a Checked-in record still works (regression)', R("Msafiri.store.checkOut('%s')" % co2) is True and R("Msafiri.store.get('%s').stay" % co2) == 'Checked out')
    # UI path: failed action must not show a success toast (MSF-FR-016) -> drive store refusal while a dialog flow is simulated
    pg.reload(); pg.wait_for_timeout(300)

    # --- Round 2: check-in guard (MSF-FR-005) ------------------------------------------------------------
    pg.reload(); pg.wait_for_timeout(300)
    def dd(r): return "{ref:'%s',guest:'G H',nat:'Kenya',docType:'Passport',docNo:'ABC12345',dob:'1990-01-01',room:'1',arrival:'2026-10-22',departure:'2026-10-24',nights:2}" % r
    for st in ('Checked out', 'Checked in'):
        ref = R("Msafiri.store.recs.find(r=>r.stay==='%s').ref" % st)
        chk('FR-005 store.checkIn on an existing [%s] record is refused (returns null) and keeps its status' % st,
            R("Msafiri.store.checkIn(%s)" % dd(ref)) is None and R("Msafiri.store.get('%s').stay" % ref) == st)
    ex = R("Msafiri.store.recs.find(r=>r.stay==='Expected').ref")
    chk('FR-005 store.checkIn on an Expected record still works (regression)', R("!!Msafiri.store.checkIn(%s)" % dd(ex)) is True and R("Msafiri.store.get('%s').stay" % ex) == 'Checked in')
    chk('FR-005 store.checkIn for a brand-new registration still works (regression)', R("(r=>!!r&&r.stay==='Checked in')(Msafiri.store.checkIn({guest:'New Person',nat:'Kenya',docType:'Passport',docNo:'NEW123456',dob:'1990-01-01',room:'2',arrival:'2026-10-22',departure:'2026-10-23',nights:1}))"))

    # --- Round 2: required-field validation through the real form (characterises EXISTING validation; field list NOT verified against an approved URS)
    pg.reload(); pg.wait_for_timeout(300); go(pg, '#/hotel/new-registration')
    recs0 = R('Msafiri.store.recs.length')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    want = {'first': 'first name', 'last': 'last name', 'dob': 'date of birth', 'nat': 'nationality', 'docType': 'document type', 'docNo': 'document number', 'room': 'room', 'arrival': 'arrival date', 'departure': 'departure date', 'checked': 'document check'}
    for k, w in want.items():
        has_msg = pg.locator('#reg-form .error-text').filter(has_text=re.compile(w, re.I)).count() > 0
        chk('FR-002 empty form: a message mentioning "%s" is shown' % w, has_msg)
    chk('FR-002 empty form: no confirmation dialog opens and no record is created', pg.locator('.modal').count() == 0 and R('Msafiri.store.recs.length') == recs0, (pg.locator('.modal').count(), recs0, R('Msafiri.store.recs.length')))
    chk('FR-002 empty form: first invalid field is flagged aria-invalid', R("document.querySelectorAll('#reg-form [aria-invalid=true]').length") >= 9)
    # per-rule messages that already exist in the code
    pg.fill('#f-first', 'A'); pg.fill('#f-last', 'B'); pg.fill('#f-dob', '2999-01-01'); pg.fill('#f-docNo', 'ab 1'); pg.fill('#f-room', '1'); pg.fill('#f-arrival', '2026-10-22'); pg.fill('#f-departure', '2026-10-22')
    pg.select_option('#f-nat', index=1); pg.select_option('#f-docType', index=1); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    et = ' | '.join(pg.locator('#reg-form .error-text').all_inner_texts())
    chk('FR-002 future date of birth is rejected with a message', 'future' in et.lower(), et)
    chk('FR-002 document number with a space / wrong length is rejected', re.search(r'6.12|letters or digits', et) is not None, et)
    chk('FR-002 departure on the arrival date is rejected', 'after arrival' in et.lower(), et)
    chk('FR-002 invalid form created no record and opened no dialog', pg.locator('.modal').count() == 0 and R("Msafiri.store.recs.some(r=>r.guest==='A B')") is False)

    # --- Round 2: authorization as the seeded READ-ONLY hotel user USR-004 (front-end enforcement only) -------
    pg.reload(); pg.wait_for_timeout(300)
    R("Msafiri.dir.actAs('hotel','USR-004')"); go(pg, '#/hotel/registrations'); R('Msafiri.rerender()'); pg.wait_for_timeout(200)
    st = {k: R("Msafiri.store.recs.find(r=>r.stay==='%s')" % k + ".ref") for k in ('Expected', 'Checked in')}
    R("Msafiri.openRecord('%s')" % st['Expected']); pg.wait_for_timeout(250); bt = dialog_buttons(pg); close_dialog(pg)
    chk('NFR-001 read-only user: Expected-record dialog offers no Start check-in', not any('Start check-in' in x for x in bt), bt)
    R("Msafiri.openRecord('%s')" % st['Checked in']); pg.wait_for_timeout(250); bt = dialog_buttons(pg); close_dialog(pg)
    chk('NFR-001 read-only user: Checked-in dialog offers no Amend / Cancel / Check out', not any(w in x for x in bt for w in ('Amend', 'Cancel registration', 'Check out')), bt)
    go(pg, '#/hotel/new-registration'); R('Msafiri.rerender()'); pg.wait_for_timeout(200)
    chk('FR-011 read-only user: registration route shows Not permitted and renders no form', 'Not permitted' in txt(pg) and pg.locator('#reg-form').count() == 0)
    snap = lambda: R("JSON.stringify(Msafiri.store.recs.map(r=>[r.ref,r.stay,r.room,r.departure,r.sub]))")
    s0 = snap(); a0 = R('Msafiri.store.audit.length'); n0 = R('Msafiri.store.recs.length')
    ci, ex2 = st['Checked in'], st['Expected']
    out = R("[Msafiri.store.cancel('%s','x'),Msafiri.store.amend('%s',{room:'9',departure:'2099-01-01'}),Msafiri.store.checkOut('%s'),Msafiri.store.checkIn(%s)]" % (ci, ci, ci, dd(ex2)))
    chk('FR-011/FR-016 read-only user: direct store cancel/amend/check-out/check-in are all refused', out == [False, False, False, None], out)
    chk('FR-011 read-only user: refused calls changed no record and created none', snap() == s0 and R('Msafiri.store.recs.length') == n0)
    pd = R("Msafiri.store.audit.slice(0,%d).filter(a=>a.type==='Permission denied').length" % (R('Msafiri.store.audit.length') - a0))
    chk('FR-010 read-only user: each refused call is audited as "Permission denied" (4 expected, got %s)' % pd, pd == 4, pd)
    R("Msafiri.dir.actAs('hotel','USR-001')")

    # --- Round 2: audit coverage per lifecycle action (MSF-FR-010) --------------------------------------------
    pg.reload(); pg.wait_for_timeout(300)
    a_start = R('Msafiri.store.audit.length')
    def audited(label, js, ref, needle=None):
        a0 = R('Msafiri.store.audit.length'); js_ok = R(js); grew = R('Msafiri.store.audit.length') - a0
        ents = R("Msafiri.store.audit.slice(0,%d)" % grew) if grew else []
        mine = [e for e in ents if e['target'] == ref]
        chk('FR-010 %s writes audit entries for %s (%d new)' % (label, ref, grew), grew > 0 and mine, ents[:2])
        if needle: chk('FR-010 %s audit text records "%s"' % (label, needle), any(needle in e['detail'] for e in mine), [e['detail'] for e in mine])
        return js_ok
    newref = R("Msafiri.store.checkIn({guest:'Audit Probe',nat:'Kenya',docType:'Passport',docNo:'AUD123456',dob:'1990-01-01',room:'8',arrival:'2026-10-22',departure:'2026-10-25',nights:3}).ref")
    ex3 = R("Msafiri.store.recs.find(r=>r.stay==='Expected').ref")
    audited('check-in', "!!Msafiri.store.checkIn(%s)" % dd(ex3), ex3, 'checked in')
    audited('amend', "Msafiri.store.amend('%s',{room:'12',departure:'2099-01-01'})" % ex3, ex3, 'Amended')
    audited('cancel (with reason)', "Msafiri.store.cancel('%s','Guest no-show probe')" % ex3, ex3, 'Guest no-show probe')
    audited('check-out', "Msafiri.store.checkOut('%s')" % newref, newref, 'Checked out')
    reg = R("Msafiri.store.audit.filter(a=>/^REG-/.test(a.target)).slice(0,%d)" % max(1, R('Msafiri.store.audit.length') - a_start))
    chk('FR-010 registration audit entries created by lifecycle actions name the acting demo user or "System (simulated)" (%d entries)' % len(reg), reg and all(re.search(r'\(Hotel, demo\)|System \(simulated\)', e['user']) for e in reg), [e['user'] for e in reg][:4])

    # --- Round 2: data protection in the hotel portal (MSF-NFR-001; masking is DISPLAY-ONLY) ----------------
    pg.reload(); pg.wait_for_timeout(300); go(pg, '#/hotel/registrations')
    full = R("Msafiri.store.recs.map(r=>r.docNo).filter(Boolean)")
    shown = txt(pg)
    chk('NFR-001 hotel list does not display any full document number', not any(d in shown for d in full), [d for d in full if d in shown][:3])
    ref = R("Msafiri.store.recs[0].ref"); R("Msafiri.openRecord('%s')" % ref); pg.wait_for_timeout(250)
    dlg = ev(pg, "document.querySelector('.modal')?document.querySelector('.modal').innerText:''"); close_dialog(pg)
    chk('NFR-001 hotel record dialog does not display the full document number', R("Msafiri.store.get('%s').docNo" % ref) not in dlg, dlg[:120])

    # --- MSF-FR-013 offline queue counts consistent across nav, dashboard card, queue page, bell ----------
    def qcounts(tag):
        go(pg, '#/hotel/offline-queue')
        store_n = ev(pg, 'Msafiri.store.queue().length')
        nav_n = ev(pg, "(()=>{var f=Msafiri.findItem('hotel','offline-queue');return f&&f.item.count})()")
        rows = ev(pg, "document.querySelectorAll('#main tbody tr').length")
        chk('FR-013 %s: nav badge (%s) == store queue (%s)' % (tag, nav_n, store_n), nav_n == store_n)
        chk('FR-013 %s: queue page rows (%s) == store queue (%s)' % (tag, rows, store_n), rows == store_n or (store_n == 0 and rows <= 1), rows)
        go(pg, '#/hotel/dashboard')
        card = ev(pg, "Msafiri.store.cards().map(c=>c.label+'|'+c.value)")
        pend = [c for c in card if c.startswith('Pending submissions')]
        sub = ev(pg, "Msafiri.store.count('Pending')+Msafiri.store.count('Submitted')+Msafiri.store.queue().length")
        chk('FR-013 %s: dashboard Pending card equals Pending+Submitted+queue (%s)' % (tag, sub), pend and pend[0].endswith('|' + str(sub)), pend)
    qcounts('seed')
    ev(pg, "Msafiri.store.setOffline(true)"); pg.wait_for_timeout(200)
    ev(pg, "Msafiri.store.checkIn({ref:'REG-PROBE1',guest:'Probe Guest',nat:'Kenya',docType:'Passport',docNo:'PRB000111',dob:'1990-01-01',room:'501',arrival:new Date().toISOString().slice(0,10),departure:new Date(Date.now()+864e5*2).toISOString().slice(0,10),nights:2})")
    pg.wait_for_timeout(250); qcounts('offline + 1 new check-in')
    ev(pg, "Msafiri.store.setOffline(false)"); ev(pg, "Msafiri.store.sync()"); pg.wait_for_timeout(300); qcounts('after sync')

    # --- MSF-FR-012 authentication transparency ---------------------------------------------------------
    routes = ev(pg, "Msafiri.allItems().map(r=>r.route)")
    pw = []
    for rt in routes:
        go(pg, rt)
        if ev(pg, "document.querySelectorAll('input[type=password]').length") : pw.append(rt)
    chk('FR-012 no password field exists on any route (no false sign-in affordance)', not pw, pw)
    for portal in ('hotel', 'gov', 'admin'):
        go(pg, '#/%s/dashboard' % portal); pg.click('#user-btn'); pg.wait_for_timeout(250)
        menu = txt(pg, '#user-panel').lower()   # CSS upper-cases the label while visible, so compare case-insensitively
        chk('FR-012 [%s] menu says users are "Acting as (demo user)" and Sign out is not available' % portal, 'acting as (demo user)' in menu and 'not available in prototype' in menu)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)

    # --- MSF-FR-015 demo / synthetic labelling on every landing page ------------------------------------
    unl = []
    for rt in routes:
        if not re.search(r'/(dashboard)$', rt): continue
        go(pg, rt)
        t = txt(pg, 'body').lower()
        if not any(w in t for w in ('synthetic', 'demo', 'sample', 'simulated', 'illustrative')): unl.append(rt)
    chk('FR-015 every dashboard page carries a demo/synthetic/sample label', not unl, unl)
    for portal in ('hotel', 'gov', 'admin'):
        go(pg, '#/%s/dashboard' % portal)
        t = txt(pg)
        print('INFO %s dashboard labels:' % portal, sorted(set(re.findall(r'(?i)synthetic|demo|sample|simulated|illustrative|planning', t)))[:6])

    # --- MSF-FR-006 establishment context (hotel portal) ------------------------------------------------
    go(pg, '#/hotel/registrations')
    others = ev(pg, "(()=>{try{var L=Msafiri.demo.establishments||Msafiri.demo.gov&&Msafiri.demo.gov.establishments||[];return L.map(e=>e.name||e)}catch(e){return []}})()")
    print('INFO establishment names found in demo data:', others[:6])

    # --- global ----------------------------------------------------------------------------------------
    chk('NFR-001/007 no external network requests during probe', not ext, ext[:3])
    chk('no console/page errors during probe', not errs, errs[:3])
    b.close()
print('PROBLEMS', len(bad))
raise SystemExit(1 if bad else 0)
