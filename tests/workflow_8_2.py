"""Msafiri Stage 8.2 (continuation) — registration workflow end to end (optional; NOT an app dependency).
Run: python3 tests/workflow_8_2.py   (needs playwright + chromium; file://, synthetic data, no network)"""
import os, sys
from playwright.sync_api import sync_playwright
BASE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))
def go(pg,h): pg.evaluate('h=>location.hash=h',h); pg.wait_for_timeout(250)
def toasts(pg): return pg.evaluate("[...document.querySelectorAll('#toasts .toast')].map(t=>t.innerText.replace(/\\n/g,' '))")
bad=[]; errs=[]
def chk(n,ok,d=''):
    print(('PASS ' if ok else 'FAIL ')+n+('' if ok else ' | '+str(d)[:160]))
    if not ok: bad.append(n)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1366,'height':900})
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    pg.click('#sidebar a[href="#/hotel/new-registration"]'); pg.wait_for_timeout(200)
    chk('Sidebar opens Guest Registration', pg.evaluate('location.hash')=='#/hotel/new-registration' and 'Guest registration' in pg.inner_text('#main'))
    # demo PMS prefill then scan keeps it
    pg.click('[data-action=reg-pms]'); pg.wait_for_timeout(200)
    chk('PMS prefill fills room/dates and says simulated', pg.input_value('#f-room')=='208' and 'SIMULATED' in pg.inner_text('#main'))
    pg.click('[data-action=reg-scan]'); pg.wait_for_timeout(1200)
    chk('Scan after PMS prefill keeps room', pg.input_value('#f-room')=='208')
    chk('Scan marks low-confidence fields', 'low confidence' in pg.inner_text('#main').lower())
    # unchecked box blocks
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(200)
    chk('Unchecked document confirmation blocks check-in', 'Confirm the document check' in pg.inner_text('#main') and not pg.evaluate("!!document.querySelector('.modal')"))
    # check, review, Back to edit preserves values
    pg.check('#f-checked'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    chk('Review dialog masks document number', '••••' in pg.inner_text('.modal') and 'AK4821735' not in pg.inner_text('.modal'))
    pg.click('.modal button:has-text("Back to edit")'); pg.wait_for_timeout(150)
    chk('Back to edit keeps all values', pg.input_value('#f-first')=='Imani' and pg.input_value('#f-room')=='208' and pg.is_checked('#f-checked'))
    n0=pg.evaluate('Msafiri.store.recs.length')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250); pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(400)
    chk('Exactly one record created', pg.evaluate('Msafiri.store.recs.length')-n0==1)
    chk('Result dialog says simulated, not a real acknowledgement', 'simulated' in pg.inner_text('.modal').lower())
    ref=pg.evaluate('Msafiri.store.recs[0].ref')
    pg.click('.modal button:has-text("View guest record")'); pg.wait_for_timeout(400)
    chk('View guest record lands on Registrations with that record open', pg.evaluate('location.hash')=='#/hotel/registrations' and ref in pg.inner_text('.modal'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(2500)
    go(pg,'#/hotel/registrations'); pg.fill('#main input[type=search]','Imani'); pg.wait_for_timeout(200)
    chk('New guest findable in list with Acknowledged', 'Acknowledged' in pg.inner_text('#rec-table') and 'of 1' in pg.inner_text('#main .count'), pg.inner_text('#main .count'))
    go(pg,'#/hotel/dashboard'); chk('Dashboard total = list total', pg.evaluate("Msafiri.store.cards()[0].value")==pg.evaluate('Msafiri.store.recs.length'))
    pg.evaluate("Msafiri.dir.actAs('gov','USR-013')"); go(pg,'#/gov/search'); pg.select_option('#s-purpose',index=1); pg.fill('#s-case','CASE-0001'); pg.fill('#s-name','Imani'); pg.click('[data-action=g-search]'); pg.wait_for_timeout(1100)
    chk('Government search finds the new guest (masked)', ref in pg.inner_text('#res-table') and 'Imani' not in pg.inner_text('#res-table'), pg.inner_text('#main .count'))
    # Expected record: Start check-in path
    pg.goto('about:blank'); pg.goto(BASE); pg.wait_for_timeout(300); go(pg,'#/hotel/registrations')
    pg.fill('#main input[type=search]','Expected'); 
    exp=pg.evaluate("Msafiri.store.recs.find(r=>r.stay==='Expected')"); 
    pg.fill('#main input[type=search]',exp['ref']); pg.click('[data-action=hotel-view-reg]'); pg.wait_for_timeout(200)
    pg.click('.modal button:has-text("Start check-in")'); pg.wait_for_timeout(250)
    chk('Start check-in prefills the registration form', pg.evaluate('location.hash')=='#/hotel/new-registration' and pg.input_value('#f-docNo')==exp['docNo'] and pg.input_value('#f-room')==exp['room'], pg.input_value('#f-docNo'))
    n0=pg.evaluate('Msafiri.store.recs.length'); pg.check('#f-checked'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    if pg.evaluate("!!document.querySelector('.modal')"):
        pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(300)
        chk('Checking in an Expected record updates it (no duplicate)', pg.evaluate('Msafiri.store.recs.length')==n0 and pg.evaluate("Msafiri.store.get('%s').stay"%exp['ref'])=='Checked in')
    else: chk('Prefilled form validates', False, pg.evaluate("[...document.querySelectorAll('#main .error-text')].map(e=>e.innerText)"))
    pg.keyboard.press('Escape')
    # Amend / Check out / Cancel with feedback and data flow
    pg.goto('about:blank'); pg.goto(BASE); pg.wait_for_timeout(300); go(pg,'#/hotel/registrations')
    ref2=pg.evaluate("Msafiri.store.recs.find(r=>r.stay==='Checked in'&&r.sub==='Acknowledged').ref")
    pg.fill('#main input[type=search]',ref2); pg.click('[data-action=hotel-view-reg]'); pg.wait_for_timeout(200); pg.click('.modal button:has-text("Amend")'); pg.wait_for_timeout(250)
    pg.fill('#am-room',''); pg.click('.modal button:has-text("Apply amendment")'); pg.wait_for_timeout(150)
    chk('Amend with empty room keeps dialog open and does not claim success', pg.evaluate("!!document.querySelector('.modal')") and not any('Amendment applied' in t for t in toasts(pg)))
    pg.fill('#am-room','999'); pg.click('.modal button:has-text("Apply amendment")'); pg.wait_for_timeout(300)
    chk('Amend updates the record and list', pg.evaluate("Msafiri.store.get('%s').room"%ref2)=='999' and '999' in pg.inner_text('#rec-table'))
    pg.wait_for_timeout(3500)
    pg.click('[data-action=hotel-view-reg]'); pg.wait_for_timeout(200); pg.click('.modal button:has-text("Check out")'); pg.wait_for_timeout(250)
    pg.click('.modal button:has-text("Keep") , .modal button:has-text("Cancel")'); pg.wait_for_timeout(150)
    chk('Declining check-out changes nothing', pg.evaluate("Msafiri.store.get('%s').stay"%ref2)=='Checked in')
    pg.click('[data-action=hotel-view-reg]'); pg.wait_for_timeout(200); pg.click('.modal button:has-text("Check out")'); pg.wait_for_timeout(250); pg.click('.modal button:has-text("Confirm check-out")'); pg.wait_for_timeout(300)
    chk('Check-out applied', pg.evaluate("Msafiri.store.get('%s').stay"%ref2)=='Checked out')
    pg.wait_for_timeout(3500); pg.fill('#main input[type=search]',''); 
    ref3=pg.evaluate("Msafiri.store.recs.find(r=>r.stay==='Checked in').ref"); pg.fill('#main input[type=search]',ref3); pg.click('[data-action=hotel-view-reg]'); pg.wait_for_timeout(200); pg.click('.modal button:has-text("Cancel registration")'); pg.wait_for_timeout(250)
    pg.click('.modal .modal-foot button:has-text("Cancel registration")'); pg.wait_for_timeout(150)
    chk('Cancel without reason blocked', pg.evaluate("Msafiri.store.get('%s').stay"%ref3)=='Checked in' and pg.evaluate("!!document.querySelector('.modal')"))
    pg.fill('#can-why','Guest did not arrive'); pg.click('.modal .modal-foot button:has-text("Cancel registration")'); pg.wait_for_timeout(300)
    chk('Cancel with reason applied and logged', pg.evaluate("Msafiri.store.get('%s').stay"%ref3)=='Cancelled' and 'Guest did not arrive' in pg.evaluate("Msafiri.store.get('%s').history.map(h=>h.e).join('|')"%ref3))
    pg.wait_for_timeout(3500)
    chk('Dashboard in-house count matches store', 'x'=='x' and pg.evaluate("Msafiri.store.cards()[0].delta")==str(pg.evaluate("Msafiri.store.recs.filter(r=>r.stay==='Checked in').length"))+' in house')
    chk('No console/page errors', not errs, errs[:2])
    print('\nfailed: %d'%len(bad), bad); b.close(); sys.exit(1 if bad else 0)
