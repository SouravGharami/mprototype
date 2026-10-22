"""Msafiri Stage 8.7 - Prototype Completeness & Workflow Hardening (optional test; NOT an app dependency).
Covers store-level validation, lifecycle transitions, permission backstop, audit, form behaviour. Synthetic data, file://, no network.
Run: python3 tests/stage8_7_workflow_hardening.py   (playwright + chromium)"""
import os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BASE = 'file://' + os.path.join(ROOT, 'index.html')
res = []
def check(n, ok, d=''):
    res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:300]))
GOOD = "{guest:'Test Guest',nat:'Kenya',docType:'Passport',docNo:'AB123456',dob:'1990-01-01',room:'101',arrival:'2026-10-22',departure:'2026-10-25',nights:3}"
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900})
    errs, ext = [], []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    ev = pg.evaluate
    def fresh(): ev("Msafiri.store.reset()")
    # ---- store-level check-in validation ----
    bad = {
      'blank name': "Object.assign(%s,{guest:'   '})" % GOOD,
      'single-word name': "Object.assign(%s,{guest:'Madonna'})" % GOOD,
      'missing nationality': "Object.assign(%s,{nat:''})" % GOOD,
      'missing doc type': "Object.assign(%s,{docType:''})" % GOOD,
      'short doc no': "Object.assign(%s,{docNo:'x'})" % GOOD,
      'doc no with space': "Object.assign(%s,{docNo:'AB 12345'})" % GOOD,
      'future dob': "Object.assign(%s,{dob:'2999-01-01'})" % GOOD,
      'impossible date': "Object.assign(%s,{dob:'1990-02-31'})" % GOOD,
      'garbage date': "Object.assign(%s,{arrival:'garbage'})" % GOOD,
      'departure before arrival': "Object.assign(%s,{departure:'2026-10-20'})" % GOOD,
      'departure equals arrival': "Object.assign(%s,{departure:'2026-10-22'})" % GOOD,
      'empty room': "Object.assign(%s,{room:' '})" % GOOD,
      'markup in room': "Object.assign(%s,{room:'<b>1</b>'})" % GOOD,
      'overlong name': "Object.assign(%s,{guest:'A '+'B'.repeat(200)})" % GOOD,
      'undefined input': "undefined",
    }
    for n, expr in bad.items():
        fresh(); r = ev("(()=>{var S=Msafiri.store,c=S.recs.length,x;try{x=S.checkIn(%s)}catch(e){return 'THROW '+e}return [!!x,S.recs.length-c,S.audit[0].outcome]})()" % expr)
        check('check-in refused: ' + n, r == [False, 0, 'Blocked'], r)
    fresh(); r = ev("(()=>{var S=Msafiri.store,c=S.recs.length,x=S.checkIn(%s);return [!!x&&x.stay,S.recs.length-c]})()" % GOOD)
    check('valid check-in still succeeds (Checked in, +1 record)', r == ['Checked in', 1], r)
    fresh(); r = ev("(()=>{var S=Msafiri.store,x=S.recs.filter(r=>r.stay==='Expected')[0],c=S.recs.length;var y=S.checkIn({ref:x.ref,guest:x.guest,nat:x.nat,docType:x.docType,docNo:x.docNo,dob:x.dob,room:x.room,arrival:x.arrival,departure:x.departure,nights:x.nights});return [!!y&&y.stay,S.recs.length-c]})()")
    check('check-in of a seeded Expected record via the dialog path still works', r == ['Checked in', 0], r)
    # ---- retry transitions ----
    fresh(); r = ev("(()=>{var S=Msafiri.store,o={};['Acknowledged','Pending','Submitted','Queued offline','Not reported'].forEach(function(k,i){var x=S.recs[i];x.sub=k;S.retry(x.ref);o[k]=x.sub});return o})()")
    check('retry refused for every non-rejected status (status unchanged)', len(r) == 5 and all(k == v for k, v in r.items()), r)
    fresh(); r = ev("(()=>{var S=Msafiri.store,x=S.recs.filter(r=>r.sub==='Rejected')[0];var ok=S.retry(x.ref);return [ok,x.sub]})()")
    check('retry of a Rejected record still starts (Pending)', r == [True, 'Pending'], r)
    fresh(); r = ev("(()=>{var S=Msafiri.store;var n=S.audit.length;var x=S.recs.filter(r=>r.sub==='Acknowledged')[0];S.retry(x.ref);return [S.audit.length-n,S.audit[0].type,S.audit[0].outcome]})()")
    check('refused retry is audited as Action blocked', r == [1, 'Action blocked', 'Blocked'], r)
    # ---- cancel reason ----
    fresh()
    for lbl, why in [('blank', "'   '"), ('missing', 'undefined'), ('too long', "'x'.repeat(201)")]:
        r = ev("(()=>{var S=Msafiri.store,x=S.recs.filter(r=>r.stay==='Checked in')[0];var ok=S.cancel(x.ref,%s);return [ok,x.stay]})()" % why)
        check('cancel refused: reason %s' % lbl, r == [False, 'Checked in'], r)
    r = ev("(()=>{var S=Msafiri.store,x=S.recs.filter(r=>r.stay==='Checked in')[0];var ok=S.cancel(x.ref,'  Guest did not arrive  ');return [ok,x.stay,x.history[x.history.length-1].e]})()")
    check('cancel with a reason works; reason trimmed in history', r[0] and r[1] == 'Cancelled' and any(h['e'].endswith('reason: Guest did not arrive') for h in ev("Msafiri.store.recs.filter(r=>r.stay==='Cancelled')[0].history")), r)
    # ---- amend ----
    fresh()
    for lbl, v in [('garbage date', "{room:'5',departure:'garbage'}"), ('impossible date', "{room:'5',departure:'2026-13-45'}"), ('blank room', "{room:' ',departure:'2030-01-01'}"), ('markup room', "{room:'<i>',departure:'2030-01-01'}"), ('null', 'null')]:
        r = ev("(()=>{var S=Msafiri.store,x=S.recs.filter(r=>r.stay==='Checked in')[0],d=x.departure,rm=x.room;var ok=S.amend(x.ref,%s);return [ok,x.departure===d&&x.room===rm]})()" % v)
        check('amend refused: ' + lbl, r == [False, True], r)
    r = ev("(()=>{var S=Msafiri.store,x=S.recs.filter(r=>r.stay==='Checked in')[0];var ok=S.amend(x.ref,{room:' 77 ',departure:'2030-01-01'});return [ok,x.room,x.departure]})()")
    check('valid amend works; room trimmed', r == [True, '77', '2030-01-01'], r)
    # ---- other lifecycle (verified, pre-existing) ----
    fresh(); r = ev("(()=>{var S=Msafiri.store,c=S.recs.filter(r=>r.stay==='Checked out')[0];return [S.checkOut(c.ref),S.cancel(c.ref,'x'),S.amend(c.ref,{room:'1',departure:'2030-01-01'}),!!S.checkIn(Object.assign(%s,{ref:c.ref})),c.stay]})()" % GOOD)
    check('checked-out record: check-out, cancel, amend and re-check-in all refused', r == [False, False, False, False, 'Checked out'], r)
    # ---- permission backstop ----
    fresh(); viewer = ev("(Msafiri.dir.users.filter(u=>u.role==='hotel-viewer')[0]||{}).id")
    check('a seeded read-only hotel user exists for the permission test', bool(viewer), viewer)
    if viewer:
        ev("Msafiri.dir.actAs('hotel','%s')" % viewer)
        r = ev("(()=>{var S=Msafiri.store,c=S.recs.length,a=S.recs.filter(r=>r.stay==='Checked in')[0],rj=S.recs.filter(r=>r.sub==='Rejected')[0];return [!!S.checkIn(%s),S.recs.length-c,S.cancel(a.ref,'x'),S.checkOut(a.ref),S.amend(a.ref,{room:'1',departure:'2030-01-01'}),S.retry(rj.ref),a.stay,rj.sub]})()" % GOOD)
        check('read-only user: every state-changing store call refused, nothing changed', r == [False, 0, False, False, False, False, 'Checked in', 'Rejected'], r)
        check('denied attempts are audited with outcome Blocked', ev("Msafiri.store.audit.filter(a=>a.outcome==='Blocked'&&a.type==='Permission denied').length") >= 5)
        ev("Msafiri.dir.actAs('hotel','USR-001')")
    # ---- audit content: no document numbers / dob in audit ----
    fresh(); ev("Msafiri.store.checkIn(%s)" % GOOD)
    dump = ev("JSON.stringify(Msafiri.store.audit)+JSON.stringify(Msafiri.store.log)")
    check('audit and activity log do not contain the document number or date of birth', 'AB123456' not in dump and '1990-01-01' not in dump)
    check('audit entries carry actor, type, target, detail, outcome and time', ev("Msafiri.store.audit.every(a=>a.user&&a.type&&a.target&&a.detail&&a.outcome&&a.t)"))
    # ---- UI: form behaviour ----
    fresh(); ev("location.hash='#/hotel/new-registration'"); pg.wait_for_timeout(250)
    pg.fill('#f-first', 'Ada'); pg.fill('#f-last', 'Lovelace'); pg.fill('#f-docNo', 'ab 1'); pg.fill('#f-room', '12'); pg.check('#f-checked')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    check('invalid form: errors shown, no dialog, no record created', ev("!document.querySelector('.modal')") and pg.locator('.error-text').count() >= 4)
    check('invalid form: valid values preserved after error', pg.input_value('#f-first') == 'Ada' and pg.input_value('#f-last') == 'Lovelace' and pg.input_value('#f-room') == '12' and pg.is_checked('#f-checked'))
    check('invalid form: document-number error is understandable', 'letters or digits' in pg.inner_text('#f-docNo-err') if pg.locator('#f-docNo-err').count() else 'letters or digits' in pg.inner_text('#reg-form'))
    pg.fill('#f-dob', '2999-01-01'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(200)
    check('future date of birth rejected in the form', 'future' in pg.inner_text('#reg-form'))
    pg.click('[data-action=reg-clear]'); pg.wait_for_timeout(250)
    check('Clear form empties fields and gives feedback', pg.input_value('#f-first') == '' and 'Form cleared' in pg.inner_text('#toast-root') if pg.locator('#toast-root').count() else pg.input_value('#f-first') == '')
    # full happy path with double activation of Confirm
    pg.click('[data-action=reg-scan]'); pg.wait_for_timeout(1300); pg.click('[data-action=reg-pms]'); pg.wait_for_timeout(200)
    pg.fill('#f-docNo', 'AK4821735'); pg.check('#f-checked'); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250)
    n = ev("Msafiri.store.recs.length")
    ev("(()=>{var b=document.querySelector('[data-modal-btn=\"1\"]');b.click();var b2=document.querySelector('[data-modal-btn=\"1\"]');if(b2)b2.click()})()"); pg.wait_for_timeout(300)
    check('double-activating Confirm creates exactly one record', ev("Msafiri.store.recs.length") - n == 1, ev("Msafiri.store.recs.length") - n)
    check('success feedback dialog shown with reference', 'Checked in: REG-' in pg.inner_text('.modal'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    # back-to-edit cancels without creating
    ev("location.hash='#/hotel/new-registration'"); pg.wait_for_timeout(250); pg.click('[data-action=reg-pms]'); pg.wait_for_timeout(200)
    pg.fill('#f-first', 'Zed'); pg.fill('#f-last', 'Quill'); pg.select_option('#f-nat', index=1); pg.select_option('#f-docType', index=1); pg.fill('#f-dob', '1980-05-05'); pg.fill('#f-docNo', 'ZQ1234567'); pg.check('#f-checked')
    n = ev("Msafiri.store.recs.length"); pg.click('[data-action=reg-review]'); pg.wait_for_timeout(250); pg.click('text=Back to edit'); pg.wait_for_timeout(200)
    check('cancelling the confirm dialog creates no record and keeps the form values', ev("Msafiri.store.recs.length") == n and pg.input_value('#f-first') == 'Zed')
    # ---- Submission centre retry UI only offered for Rejected, dashboard consistency ----
    fresh(); ev("location.hash='#/hotel/submissions'"); pg.wait_for_timeout(300)
    rows = ev("[...document.querySelectorAll('#sub-table tbody tr')].map(r=>[r.innerText.includes('Rejected'),!!r.querySelector('[data-action=sub-retry]')])")
    check('Retry button appears only on Rejected rows', rows and all(a == b for a, b in rows), rows)
    cards = ev("Msafiri.store.cards().map(c=>c.value)"); S = ev("(()=>{var S=Msafiri.store;return [S.recs.length,S.count('Pending')+S.count('Submitted')+S.queue().length]})()")
    check('dashboard cards (total, pending) agree with store records', cards[0] == S[0] and cards[3] == S[1], (cards, S))
    seg = ev("Msafiri.store.segments().reduce((a,s)=>a+s.value,0)"); sub = ev("Msafiri.store.recs.filter(r=>r.sub!=='Not reported').length")
    check('status-chart segments sum equals records with a government status', seg == sub, (seg, sub))
    check('no uncaught page errors / console errors', not errs, errs)
    check('no external network requests', not ext, ext)
    b.close()
f = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(f), len(f))); sys.exit(1 if f else 0)
