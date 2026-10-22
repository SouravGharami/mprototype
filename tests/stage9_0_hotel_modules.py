"""Msafiri Stage 9.0 - Hotel modules: Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports.
Optional regression test (NOT an app dependency). Synthetic data, file://, no network.
Run from msafiri-prototype/: python3 tests/stage9_0_hotel_modules.py   (playwright + chromium)"""
import os, sys, re
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = 'file://' + os.path.join(ROOT, 'index.html')
res = []
def check(n, ok, d=''):
    res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:300]))
FIVE = ['check-in', 'in-house', 'stay-changes', 'pms', 'compliance']
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900}, accept_downloads=True)
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    ev = pg.evaluate
    def go(h): ev("h=>location.hash=h", h); pg.wait_for_timeout(250)
    def T(): return pg.inner_text('#main')
    def fresh(): ev("Msafiri.store.reset()"); ev("Msafiri.dir.actAs('hotel','USR-001')"); ev("Msafiri.rerender()"); pg.wait_for_timeout(150)
    def rec(ref): return ev("r=>{const x=Msafiri.store.get(r);return x?[x.stay,x.sub,x.room,x.departure]:null}", ref)
    def modal(): return pg.inner_text('#modal-root') if ev("!!document.querySelector('#modal-root .modal')") else ''
    def row_btn(ref, label):  # button inside the table row that contains ref
        return pg.locator('#main tbody tr', has_text=ref).locator('button:has-text("%s")' % label).first
    fresh()

    # ---- A. registration, labelling, Soon badges ----
    check('A1 all five Hotel routes have a registered page', ev("%s.every(i=>!!Msafiri.pages['hotel/'+i])" % FIVE))
    go('#/hotel/dashboard')
    soon = ev("[...document.querySelectorAll('.nav-soon')].map(e=>e.closest('a').innerText.replace(/\\s+/g,' ').trim())")
    check('A2 no Soon badge remains on the five Hotel modules (only the permission label on Staff & Users)', not any(re.search('Soon', x, re.I) for x in soon) and any('Staff' in x and 'access' in x.lower() for x in soon), soon)
    for i in FIVE:
        go('#/hotel/' + i); t = T()
        check('A3 %s: built page (not the Planned-module template), carries simulated/synthetic wording' % i, 'Planned module' not in t and len(t) > 300 and re.search(r'simulat|synthetic', t, re.I), t[:150])
    ev("Msafiri.state.portal"); 
    go('#/admin/connectors'); check('A4 Admin Connector Status is still an honest placeholder (Soon kept)', 'Planned module' in T())
    ev("document.querySelector('[data-action=switch-portal][data-portal=admin]').click()"); pg.wait_for_timeout(250)
    check('A5 Soon indicator still shown for the genuinely unfinished Admin item', ev("[...document.querySelectorAll('.nav-soon')].some(e=>/Connector/.test(e.closest('a').innerText)&&/Soon/i.test(e.innerText))"))
    go('#/hotel/dashboard'); pg.wait_for_timeout(250)

    # ---- B. Check-in ----
    fresh(); go('#/hotel/check-in')
    n_el = ev("Msafiri.store.recs.filter(r=>r.stay==='Expected'||r.stay==='Draft').length")
    check('B1 eligible list matches store (Expected + Draft)', pg.locator('#main tbody tr').count() == n_el and n_el > 0, (pg.locator('#main tbody tr').count(), n_el))
    check('B2 checked-in / checked-out records are not offered', not any(x in T() for x in ['Amara Okonkwo', 'Ana Costa', 'Ken Ito']))
    check('B3 document number is masked in the list', 'PA1111411' not in T() and '••••411' in T())
    row_btn('REG-241015', 'Check in').click(); pg.wait_for_timeout(250)
    check('B4 check-in opens a confirmation dialog with the document-check requirement', 'Check in Rafael Duarte' in modal() and 'physically checked' in modal(), modal()[:120])
    pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(250)
    check('B5 confirming WITHOUT the document check is blocked: dialog stays open, record unchanged', 'Check in Rafael' in modal() and rec('REG-241015')[0] == 'Expected', rec('REG-241015'))
    n_aud = ev("Msafiri.store.audit.length")
    pg.check('#ci-doc'); pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(300)
    r = rec('REG-241015')
    check('B6 valid check-in changes the shared record to Checked in with a simulated submission', r[0] == 'Checked in' and r[1] in ('Pending', 'Submitted', 'Acknowledged'), r)
    check('B7 success message shown', ev("/Checked in: REG-241015/.test(document.body.innerText)"), '')
    check('B8 guest left the eligible list; audit entries added naming the demo user', pg.locator('#main tbody tr', has_text='REG-241015').count() == 0 and ev("Msafiri.store.audit.length")>n_aud and ev("Msafiri.store.audit.some(a=>a.target==='REG-241015'&&/Neema Kiptoo/.test(a.user))"))
    pg.wait_for_timeout(3700)
    check('B9 simulated submission completes (Acknowledged) and the in-house count includes the guest', rec('REG-241015')[1] == 'Acknowledged' and ev("Msafiri.store.cards()[0].delta")=='7 in house', rec('REG-241015'))
    # invalid record: not offered as Ready; cannot be forced through the store
    ev("Msafiri.store.get('REG-241016').room=''"); go('#/hotel/check-in'); ev("Msafiri.rerender()"); pg.wait_for_timeout(250)
    check('B10 an invalid record shows "Needs details" and offers Complete details (not Check in)', pg.locator('#main tbody tr', has_text='REG-241016').locator('button:has-text("Complete details")').count() == 1 and pg.locator('#main tbody tr', has_text='REG-241016').locator('button:has-text("Check in")').count() == 0)
    out = ev("(()=>{const S=Msafiri.store,r=S.get('REG-241016');const x=S.checkIn({ref:r.ref,guest:r.guest,nat:r.nat,docType:r.docType,docNo:r.docNo,dob:r.dob,room:r.room,arrival:r.arrival,departure:r.departure,nights:1});return [x,r.stay,S.audit.some(a=>a.type==='Action blocked'&&a.target==='REG-241016')]})()")
    check('B11 direct store check-in of the invalid record is refused and audited', out == [None, 'Expected', True], out)
    row_btn('REG-241016', 'Complete details').click(); pg.wait_for_timeout(250)
    check('B12 Complete details opens the registration form prefilled', ev("location.hash")=='#/hotel/new-registration' and pg.input_value('#f-docNo') == 'PA1148548', ev("location.hash"))
    # already checked-in cannot be re-checked-in by direct call
    out = ev("Msafiri.store.checkIn({ref:'REG-241012',guest:'Amara Okonkwo',nat:'Nigeria',docType:'Passport',docNo:'PA1000000',dob:'1988-04-10',room:'201',arrival:'2026-10-22',departure:'2026-10-25',nights:3})")
    check('B13 re-check-in of an already checked-in record is refused', out is None and rec('REG-241012')[0] == 'Checked in', out)
    # offline path
    fresh(); ev("Msafiri.store.setOffline(true)"); go('#/hotel/check-in')
    check('B14 offline banner shown on the Check-in page', 'Connection unavailable (simulated)' in T())
    row_btn('REG-241019', 'Check in').click(); pg.wait_for_timeout(200); pg.check('#ci-doc'); pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(300)
    check('B15 offline check-in is queued locally (not reported)', rec('REG-241019')[0] == 'Checked in' and rec('REG-241019')[1] == 'Queued offline', rec('REG-241019'))

    # ---- C. In-house ----
    fresh(); go('#/hotel/in-house')
    n_ih = ev("Msafiri.store.recs.filter(r=>r.stay==='Checked in').length")
    check('C1 in-house list equals checked-in records in the store', pg.locator('#main tbody tr').count() == n_ih, (pg.locator('#main tbody tr').count(), n_ih))
    check('C2 stay information shown (room, arrival, departure, nights) and document numbers are not shown', all(x in T().lower() for x in ['room', 'arrived', 'departure', 'nights']) and 'PA1000000' not in T())
    pg.fill('#main input[type=search]', 'Priya'); pg.wait_for_timeout(250)
    check('C3 search narrows the list', pg.locator('#main tbody tr').count() == 1 and 'Priya Nair' in T(), pg.locator('#main tbody tr').count())
    pg.fill('#main input[type=search]', ''); pg.wait_for_timeout(200)
    pg.select_option('#main select[aria-label="Government status"]', 'Rejected'); pg.wait_for_timeout(250)
    check('C4 government-status filter works', pg.locator('#main tbody tr').count() == 1 and 'Priya Nair' in T())
    pg.locator('#main tbody tr button:has-text("Details")').first.click(); pg.wait_for_timeout(250)
    check('C5 Details links to the existing guest record dialog (masked document)', 'Guest record REG-241018' in modal() and 'PA1222822' not in modal() and '••••822' in modal(), modal()[:100])
    pg.click('#modal-root button:has-text("Close")'); pg.wait_for_timeout(150)
    fresh(); go('#/hotel/stay-changes'); row_btn('REG-241013', 'Check out').click(); pg.wait_for_timeout(250); pg.click('#modal-root button:has-text("Confirm check-out")'); pg.wait_for_timeout(300)
    go('#/hotel/in-house')
    check('C6 a guest checked out elsewhere leaves the in-house list', pg.locator('#main tbody tr', has_text='REG-241013').count() == 0 and pg.locator('#main tbody tr').count() == n_ih - 1)

    # ---- D. Check-out, Amend & Cancel ----
    fresh(); go('#/hotel/stay-changes')
    check('D1 all records listed with a stay filter', pg.locator('#main tbody tr').count() > 0 and ev("!!document.querySelector('select[aria-label=\"Stay status\"]')"))
    row_btn('REG-241013', 'Check out').click(); pg.wait_for_timeout(250)
    check('D2 check-out asks for confirmation and changes nothing until confirmed', 'Check out Lukas Brandt?' in modal() and rec('REG-241013')[0] == 'Checked in')
    pg.click('#modal-root button:has-text("Cancel")'); pg.wait_for_timeout(200)
    check('D3 backing out leaves the record unchanged', rec('REG-241013')[0] == 'Checked in')
    row_btn('REG-241013', 'Check out').click(); pg.wait_for_timeout(250); pg.click('#modal-root button:has-text("Confirm check-out")'); pg.wait_for_timeout(300)
    check('D4 confirmed check-out updates the store, history and audit; a simulated update is reported', rec('REG-241013')[0] == 'Checked out' and rec('REG-241013')[1] in ('Pending', 'Submitted', 'Acknowledged') and ev("Msafiri.store.get('REG-241013').history.some(h=>h.e==='Checked out')") and ev("Msafiri.store.audit.some(a=>a.target==='REG-241013'&&/Checked out/.test(a.detail))"))
    pg.wait_for_timeout(100)
    check('D5 a checked-out record offers no Check out / Amend / Cancel', all(pg.locator('#main tbody tr', has_text='REG-241013').locator('button:has-text("%s")' % x).count() == 0 for x in ['Check out', 'Amend', 'Cancel']))
    # amend validation
    row_btn('REG-241017', 'Amend').click(); pg.wait_for_timeout(250)
    pg.fill('#am-dep', '2026-10-20'); pg.click('#modal-root button:has-text("Apply amendment")'); pg.wait_for_timeout(200)
    check('D6 amendment with departure before arrival is rejected (dialog stays, record unchanged)', 'Amend REG-241017' in modal() and rec('REG-241017')[3] == '2026-10-29', rec('REG-241017'))
    pg.fill('#am-room', ''); pg.fill('#am-dep', '2026-10-30'); pg.click('#modal-root button:has-text("Apply amendment")'); pg.wait_for_timeout(200)
    check('D7 amendment with blank room is rejected', 'Amend REG-241017' in modal() and rec('REG-241017')[2] == '402', rec('REG-241017'))
    pg.fill('#am-room', '410'); pg.click('#modal-root button:has-text("Apply amendment")'); pg.wait_for_timeout(300)
    check('D8 valid amendment updates room and departure and records history', rec('REG-241017')[2] == '410' and rec('REG-241017')[3] == '2026-10-30' and ev("Msafiri.store.get('REG-241017').history.some(h=>/Amended/.test(h.e))"), rec('REG-241017'))
    # cancel
    row_btn('REG-241015', 'Cancel').click(); pg.wait_for_timeout(250)
    pg.click('#modal-root button:has-text("Cancel registration")'); pg.wait_for_timeout(200)
    check('D9 cancellation without a reason is blocked', 'Cancel REG-241015' in modal() and rec('REG-241015')[0] == 'Expected', rec('REG-241015'))
    pg.fill('#can-why', 'Guest did not arrive (demo)'); pg.click('#modal-root button:has-text("Cancel registration")'); pg.wait_for_timeout(300)
    check('D10 cancellation with a reason sets Cancelled and records the reason', rec('REG-241015')[0] == 'Cancelled' and ev("Msafiri.store.get('REG-241015').history.some(h=>/Cancelled — reason: Guest did not arrive/.test(h.e))"), rec('REG-241015'))
    check('D11 cancelled record offers no further stay actions', all(pg.locator('#main tbody tr', has_text='REG-241015').locator('button:has-text("%s")' % x).count() == 0 for x in ['Check out', 'Amend', 'Cancel']))
    out = ev("(()=>{const S=Msafiri.store;return [S.checkOut('REG-241015'),S.amend('REG-241015',{room:'1',departure:'2026-12-01'}),S.cancel('REG-241015','x'),S.checkOut('REG-241014')]})()")
    check('D12 direct store calls cannot move cancelled / not-checked-in records (all refused)', out == [False, False, False, False], out)
    check('D13 recent stay changes list shows this session\'s changes', 'Recent stay changes' in T() and re.search('Checked out|Cancelled|Amended', T()))

    # ---- E. PMS ----
    fresh(); go('#/hotel/pms'); t = T()
    check('E1 PMS page labelled simulated with no real-connection claim', 'Simulated PMS' in t and 'no real PMS is connected' in t and 'Connected' in t and 'live' not in t.lower().replace('delivered', ''), t[:200])
    check('E2 no credentials or secrets shown', not re.search(r'password|secret|api[_ -]?key|token', t, re.I), t)
    ev("Msafiri.store.setOffline(true)"); pg.wait_for_timeout(250)
    check('E3 simulated outage switches the page to Manual fallback active', 'Manual fallback active' in T() and 'Disconnected' in T(), T()[:300])
    pg.click('#main a:has-text("Open manual registration")'); pg.wait_for_timeout(250)
    check('E4 manual fallback opens the existing registration form, which warns that check-in will be queued', ev("location.hash")=='#/hotel/new-registration' and 'Connection unavailable (simulated)' in T())
    go('#/hotel/pms'); pg.click('#main button:has-text("Restore connection")'); pg.wait_for_timeout(300)
    check('E5 restoring the simulated connection returns to PMS prefill (simulated)', 'PMS prefill available (simulated)' in T() and not ev("Msafiri.store.offline"))

    # ---- F. Compliance ----
    fresh(); go('#/hotel/compliance'); t = T()
    check('F1 labelled illustrative / simulated / not an official report', 'not an official compliance report' in t and 'Illustrative, simulated reporting' in t)
    S_tot = ev("Msafiri.store.recs.length"); S_ack = ev("Msafiri.store.count('Acknowledged')"); S_rej = ev("Msafiri.store.count('Rejected')+Msafiri.store.count('Conflict')")
    nums = ev("[...document.querySelectorAll('#main .stat')].map(e=>[e.querySelector('.stat-label').innerText,e.querySelector('.stat-value').innerText])")
    d = {k: v for k, v in nums}
    check('F2 summary cards agree with the store (total, acknowledged, needs attention)', d.get('Records') == str(S_tot) and d.get('Acknowledged (simulated)') == str(S_ack) and d.get('Needs attention') == str(S_rej), (d, S_tot, S_ack, S_rej))
    pg.select_option('#main select[aria-label="Government status"]', 'Rejected'); pg.wait_for_timeout(250)
    check('F3 government-status filter shows only matching records', pg.locator('#main tbody tr').count() == ev("Msafiri.store.count('Rejected')") and 'Priya Nair' in T())
    pg.select_option('#main select[aria-label="Government status"]', ''); pg.wait_for_timeout(150)
    pg.select_option('#cmp-stay', 'Checked out'); pg.wait_for_timeout(300)
    check('F4 stay-status filter works', pg.locator('#main tbody tr').count() == ev("Msafiri.store.recs.filter(r=>r.stay==='Checked out').length") and 'Ana Costa' in T() and 'Priya Nair' not in T(), pg.locator('#main tbody tr').count())
    pg.select_option('#cmp-stay', ''); pg.wait_for_timeout(300)
    pg.fill('#main input[type=search]', 'Brandt'); pg.wait_for_timeout(250)
    check('F5 search works', pg.locator('#main tbody tr').count() == 1)
    # live link: a store change is reflected
    pg.fill('#main input[type=search]', ''); pg.wait_for_timeout(150)
    ev("Msafiri.store.checkOut('REG-241013')"); pg.wait_for_timeout(300)
    check('F6 after a store change the dashboard reflects the records (no stale totals)', ev("[...document.querySelectorAll('#main .stat')].find(e=>/Records/.test(e.innerText)).querySelector('.stat-value').innerText")==str(ev("Msafiri.store.recs.length")))
    with pg.expect_download(timeout=5000) as dl:
        pg.click('#main button:has-text("Summary CSV")')
    path = dl.value.path(); csv = open(path, encoding='utf-8-sig').read()
    check('F7 downloaded summary is labelled simulated and contains counts only (no guest names, references or document numbers)', 'SIMULATED' in dl.value.suggested_filename and 'ILLUSTRATIVE SIMULATED' in csv and not re.search(r'Brandt|Okonkwo|REG-|PA\d{6}|PB\d{6}', csv), csv[:200])

    # ---- G. Roles and permissions ----
    fresh(); ev("Msafiri.dir.actAs('hotel','USR-004')"); ev("Msafiri.rerender()"); pg.wait_for_timeout(200)
    go('#/hotel/check-in'); check('G1 read-only role: Check-in page is denied (same rule as Guest Registration)', 'Not permitted' in T() or 'Access not granted' in T())
    go('#/hotel/stay-changes'); t = T()
    check('G2 read-only role: Stay changes visible but read-only with disabled actions and reason', 'Read-only for the acting demo user' in t and pg.locator('#main tbody tr button:has-text("Check out")').count() > 0 and pg.locator('#main tbody tr button:has-text("Check out"):not([disabled])').count() == 0)
    out = ev("(()=>{const S=Msafiri.store;return [S.checkOut('REG-241013'),S.cancel('REG-241013','x'),S.amend('REG-241013',{room:'1',departure:'2026-12-01'}),S.checkIn({ref:'REG-241015'}),S.get('REG-241013').stay]})()")
    check('G3 read-only role: direct store changes are refused', out == [False, False, False, None, 'Checked in'], out)
    for i in ['in-house', 'pms', 'compliance']:
        go('#/hotel/' + i); check('G4 read-only role can view %s' % i, 'Not permitted' not in T() and 'Access not granted' not in T())
    go('#/hotel/pms'); check('G5 read-only role: manual-registration button is disabled with a reason', pg.locator('#main button:has-text("Open manual registration")[disabled]').count() == 1)
    go('#/hotel/staff'); check('G6 Staff & Users restriction unchanged for the read-only role', 'Not permitted' in T() or 'Access not granted' in T())
    ev("Msafiri.dir.actAs('hotel','USR-001')"); ev("Msafiri.rerender()"); go('#/hotel/staff')
    check('G7 Staff & Users still "No access" for the receptionist (not bypassed)', 'Not permitted' in T() or 'Access not granted' in T())
    nav_no = ev("[...document.querySelectorAll('.nav-item')].filter(a=>/Staff/.test(a.innerText)).map(a=>a.innerText.replace(/\\s+/g,' '))")
    check('G8 sidebar still marks Staff & Users "No access"', any('no access' in x.lower() for x in nav_no), nav_no)

    # ---- H. Privacy, responsiveness, hygiene ----
    fresh(); row_cnt = 0
    ev("(()=>{const S=Msafiri.store;S.cancel('REG-241014','Demo reason');S.amend('REG-241017',{room:'411',departure:'2026-10-30'})})()")
    leak = ev("Msafiri.store.audit.concat(Msafiri.store.log).some(a=>/PA1\\d{6}|PB2\\d{6}|1988-04|1985-09/.test(JSON.stringify(a)))")
    check('H1 audit and activity log contain no document numbers or dates of birth', not leak)
    for w in (320, 390, 768):
        pg.set_viewport_size({'width': w, 'height': 800}); bad = []
        for i in FIVE:
            go('#/hotel/' + i)
            if ev("document.documentElement.scrollWidth>document.documentElement.clientWidth"): bad.append(i)
        check('H2 no horizontal overflow on the five pages at %d px' % w, not bad, bad)
    pg.set_viewport_size({'width': 1366, 'height': 900})
    fresh(); go('#/hotel/compliance'); before = T()
    ev("Msafiri.store.checkOut('REG-241013')"); ev("Msafiri.resetDemo&&Msafiri.resetDemo()")
    ev("Msafiri.store.reset()"); pg.wait_for_timeout(250)
    check('H3 Reset demo data restores the seeded records', ev("Msafiri.store.recs.length")==13 and rec('REG-241013')[0] == 'Checked in')
    check('H4 no uncaught page errors / console errors', not errs, errs)
    check('H5 no external network requests', not ext, ext)
    b.close()
f = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(f), len(f))); sys.exit(1 if f else 0)
