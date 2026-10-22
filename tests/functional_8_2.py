"""Msafiri Stage 8.2 — functional consistency regression checks (optional; NOT an app dependency).
Run: python3 tests/functional_8_2.py   (needs playwright + chromium; file://, synthetic data, no network)"""
import os, sys
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
res = []
def check(n, ok, d=''): res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:200]))
def go(pg, h): pg.evaluate('h=>location.hash=h', h); pg.wait_for_timeout(250)
def fresh(pg): pg.goto('about:blank'); pg.goto(BASE); pg.wait_for_timeout(300)
def fill(pg, d):
    for k, v in d.items(): (pg.select_option if k in ('nat', 'docType') else pg.fill)('#f-' + k, v)
SEARCH = '#main input[type=search]'
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900})
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'about:')) else None)
    fresh(pg)

    # 1 scan keeps typed fields
    go(pg, '#/hotel/new-registration'); pg.fill('#f-room', '777'); pg.click('[data-action=reg-scan]'); pg.wait_for_timeout(1200)
    check('Scan keeps room typed before it', pg.input_value('#f-room') == '777', pg.input_value('#f-room'))
    # 2 stale scan does not touch another page
    fresh(pg); go(pg, '#/hotel/new-registration'); pg.click('[data-action=reg-scan]'); go(pg, '#/hotel/registrations')
    pg.fill(SEARCH, 'Hannah'); pg.wait_for_timeout(1200)
    check('Late scan result does not wipe another page', pg.input_value(SEARCH) == 'Hannah', pg.input_value(SEARCH))
    # 3 table state survives simulated submission progress; focus kept
    fresh(pg); go(pg, '#/hotel/new-registration')
    fill(pg, dict(first='T', last='G', dob='1990-01-01', docNo='ABC12345', room='1', arrival='2026-10-21', departure='2026-10-23', nat='Kenya', docType='Passport')); pg.check('#f-checked')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(200); pg.click('#modal-root button:has-text("Confirm check-in")'); pg.wait_for_timeout(300)
    pg.keyboard.press('Escape'); go(pg, '#/hotel/registrations'); pg.click(SEARCH); pg.keyboard.type('Ana'); pg.wait_for_timeout(2800)
    check('Search kept while submission status changes', pg.input_value(SEARCH) == 'Ana' and 'of 2' in pg.inner_text('#main .count'), pg.inner_text('#main .count'))
    check('Search box keeps focus during background refresh', pg.evaluate("document.activeElement && document.activeElement.type==='search'"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    pg.wait_for_timeout(2000)
    check('Check-in status reached Acknowledged (simulated)', pg.evaluate("Msafiri.store.recs[0].sub") == 'Acknowledged')
    # 4 gov search single run
    fresh(pg); go(pg, '#/gov/search'); pg.select_option('#s-purpose', index=1); pg.fill('#s-case', 'CASE-1234')
    n0 = pg.evaluate('Msafiri.store.audit.length'); pg.click('[data-action=g-search]'); pg.wait_for_timeout(50)
    check('Search button disabled while searching', pg.evaluate("document.querySelector('[data-action=g-search]').disabled"))
    pg.evaluate("var b=document.querySelector('[data-action=g-search]'); if(b) b.click()"); pg.wait_for_timeout(1000)
    check('Quick double search writes one audit entry', pg.evaluate('Msafiri.store.audit.length') - n0 == 1, pg.evaluate('Msafiri.store.audit.length') - n0)
    # 4b stale search does not redraw other page
    fresh(pg); go(pg, '#/gov/search'); pg.select_option('#s-purpose', index=1); pg.fill('#s-case', 'CASE-1234'); pg.click('[data-action=g-search]'); go(pg, '#/gov/audit')
    pg.fill(SEARCH, 'zzz'); pg.wait_for_timeout(900)
    check('Late search result does not wipe the audit page filter', pg.input_value(SEARCH) == 'zzz')
    # 5 resolve conflict only touches its record
    fresh(pg); pg.evaluate("Msafiri.dir.actAs('hotel','USR-002')"); go(pg, '#/hotel/offline-queue')
    pg.click('[data-action=off-conflict]'); pg.wait_for_timeout(200); pg.click('#modal-root button:has-text("Keep server value")'); pg.wait_for_timeout(300)
    check('Resolving a conflict does not sync other queued records', pg.evaluate("Msafiri.store.get('REG-240950').sub") == 'Queued offline', pg.evaluate("Msafiri.store.get('REG-240950').sub"))
    check('Resolved record itself is resubmitted', pg.evaluate("Msafiri.store.get('REG-240951').sub") in ('Pending', 'Submitted', 'Acknowledged'))
    fresh(pg); pg.evaluate("Msafiri.dir.actAs('hotel','USR-002'); Msafiri.store.setOffline(true)"); go(pg, '#/hotel/offline-queue')
    pg.click('[data-action=off-conflict]'); pg.wait_for_timeout(200); pg.click('#modal-root button:has-text("Keep local value")'); pg.wait_for_timeout(300)
    h = pg.evaluate("Msafiri.store.get('REG-240950').history.map(x=>x.e).join('|')")
    check('Offline resolve logs no false synchronisation', 'Synchronisation started' not in h, h)
    # 6 stale validation errors cleared
    fresh(pg); go(pg, '#/hotel/new-registration'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(200)
    fill(pg, dict(first='A', last='B', dob='1990-01-01', docNo='ABC12345', room='5', arrival='2026-10-21', departure='2026-10-22', nat='Kenya', docType='Passport')); pg.check('#f-checked')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    check('Old validation errors removed once the form is valid', pg.evaluate("document.querySelectorAll('#reg-form .error-text').length") == 0 and pg.evaluate("document.querySelectorAll('#reg-form [aria-invalid]').length") == 0)
    check('Corrected form still reaches the confirmation dialog', pg.evaluate("!!document.querySelector('.modal')"))
    # 7 review conflict gating
    fresh(pg); go(pg, '#/hotel/offline-queue')
    check('Receptionist sees Review conflict disabled with a reason', pg.evaluate("(()=>{const b=[...document.querySelectorAll('#main button')].find(x=>/Review conflict/.test(x.innerText)); return b && b.disabled && /requires/i.test(b.parentElement.title)})()"))
    pg.evaluate("Msafiri.dir.actAs('hotel','USR-002')"); go(pg, '#/hotel/dashboard'); go(pg, '#/hotel/offline-queue')
    check('Hotel manager sees Review conflict enabled', pg.evaluate("(()=>{const b=[...document.querySelectorAll('#main button')].find(x=>/Review conflict/.test(x.innerText)); return b && !b.disabled})()"))
    # 8 chips
    fresh(pg); go(pg, '#/hotel/submissions')
    check('Hotel status chips include Conflict', pg.evaluate("[...document.querySelectorAll('.chip-stat')].some(c=>/Conflict/.test(c.innerText))"))
    go(pg, '#/gov/submission-quality')
    check('Government chips include Queued offline and Conflict', pg.evaluate("['Queued offline','Conflict'].every(k=>[...document.querySelectorAll('.chip-stat')].some(c=>c.innerText.includes(k)))"))
    # 9 unknown id
    go(pg, '#/hotel/registrations/REG-NOPE')
    check('Unknown record id shows a not-found notice', 'Record not found' in pg.inner_text('#main'))
    go(pg, '#/hotel/registrations/%E0%A4%A')
    check('Malformed address does not break the page', 'Guest records' in pg.inner_text('#main'))
    go(pg, '#/hotel/registrations/REG-240940')
    check('Known record id shows no not-found notice', 'Record not found' not in pg.inner_text('#main'))
    # 10 label
    go(pg, '#/hotel/dashboard'); check('Dashboard no longer calls Submission Centre planned', 'submission history (planned module)' not in pg.inner_text('#main'))
    # 11 table null safety
    r = pg.evaluate("""(()=>{const d=document.createElement('div'); document.body.appendChild(d);
      Msafiri.UI.table.mount(d,{caption:'t',rows:[{a:'x',b:undefined},{a:'y',b:null}],searchKeys:['a','b'],columns:[{key:'a',label:'A',sortable:true},{key:'b',label:'B',sortable:true}]});
      const i=d.querySelector('input[type=search]'); i.value='undefined'; i.dispatchEvent(new Event('input',{bubbles:true})); const c1=d.querySelector('.count').innerText;
      i.value='null'; i.dispatchEvent(new Event('input',{bubbles:true})); const c2=d.querySelector('.count').innerText; d.remove(); return [c1,c2]})()""")
    check('Missing values are not searchable as "undefined"/"null"', r == ['0 results', '0 results'], r)

    # 12 reset confirmation
    fresh(pg); pg.evaluate("Msafiri.store.recs[0].room='ZZ9'"); pg.click('#user-btn'); pg.click('[data-action=reset-demo]'); pg.wait_for_timeout(200)
    check('Reset asks for confirmation', pg.evaluate("!!document.querySelector('.modal')") and pg.evaluate("Msafiri.store.recs[0].room")=='ZZ9')
    pg.click('#modal-root button:has-text("Keep my changes")'); pg.wait_for_timeout(200)
    check('Declining reset keeps demo changes', pg.evaluate("Msafiri.store.recs[0].room")=='ZZ9')
    pg.click('#user-btn'); pg.click('[data-action=reset-demo]'); pg.click('#modal-root button:has-text("Reset demo data")'); pg.wait_for_timeout(300)
    check('Confirming reset restores data', pg.evaluate("Msafiri.store.recs[0].room")!='ZZ9')

    check('No console/page errors', not errs, errs[:2]); check('No external requests', not ext, ext[:2])
    b.close()
print('\n%d passed, %d failed' % (sum(res), len(res) - sum(res))); sys.exit(0 if all(res) else 1)
