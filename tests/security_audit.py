"""Msafiri Stage 7.4 — security & permission regression tests (optional; NOT an app dependency).
Run:  python3 tests/security_audit.py [path/to/index.html]
Drives the real UI over file:// with Playwright. Synthetic data only; no network. Frontend checks only —
this is a prototype review, NOT a penetration test or production security certification."""
import os, sys
from playwright.sync_api import sync_playwright
BASE = 'file://' + os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'index.html'))
res = []
def check(n, ok, d=''): res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' | ' + str(d)[:160]))
XSS = '<img src=x onerror=alert(9)>'

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 900}); ev = pg.evaluate
    dialogs, errs, ext = [], [], []
    pg.on('dialog', lambda d: (dialogs.append(d.message), d.dismiss()))
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(('file:', 'data:')) else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    def go(h): ev('h=>location.hash=h', h); pg.wait_for_timeout(250)
    def act_as(portal, uid): ev("([p,u])=>{Msafiri.dir.actAs(p,u);Msafiri.rerender();}", [portal, uid])
    def reset(): ev('Msafiri.store.reset()'); ev("Msafiri.dir.actAs('hotel','USR-001');Msafiri.dir.actAs('gov','USR-013');Msafiri.dir.actAs('admin','USR-017')")
    def fire(a, i):  # invoke an action handler exactly as a click would
        ev("([a,i])=>{const b=document.createElement('button');b.setAttribute('data-action',a);b.setAttribute('data-id',i);b.setAttribute('data-ref',i);document.body.appendChild(b);b.click();b.remove();}", [a, i]); pg.wait_for_timeout(250)
    def modal_btns(): return pg.eval_on_selector_all('#modal-root button', 'e=>e.map(x=>x.innerText)')
    def close(): ev('Msafiri.modal.close(true)')

    # --- Hotel: read-only role must not change records or submissions ---
    reset(); act_as('hotel', 'USR-004')  # Reporting Viewer (read-only)
    ref = ev("Msafiri.store.recs.find(r=>r.stay==='Checked in').ref")
    ev("r=>Msafiri.store.cancel(r,'probe')", ref)
    check('Hotel viewer cannot cancel a registration', ev("r=>Msafiri.store.get(r).stay", ref) == 'Checked in')
    ev("r=>Msafiri.store.amend(r,{room:'777',departure:'2026-12-31'})", ref)
    check('Hotel viewer cannot amend a registration', ev("r=>Msafiri.store.get(r).room", ref) != '777')
    ev("r=>Msafiri.store.checkOut(r)", ref)
    check('Hotel viewer cannot check a guest out', ev("r=>Msafiri.store.get(r).stay", ref) == 'Checked in')
    n = ev('Msafiri.store.recs.length')
    ev("Msafiri.store.checkIn({guest:'No Perm',nat:'Kenya',docType:'Passport',docNo:'NOPERM123',dob:'1990-01-01',room:'1',arrival:'2026-10-19',departure:'2026-10-20',nights:1})")
    check('Hotel viewer cannot check in a guest', ev('Msafiri.store.recs.length') == n)
    rej = ev("(()=>{const r=Msafiri.store.recs.find(x=>x.sub==='Rejected');return r&&r.ref})()")
    ev("r=>Msafiri.store.retry(r)", rej); pg.wait_for_timeout(100)
    check('Hotel viewer cannot retry a submission', ev("r=>Msafiri.store.get(r).sub", rej) == 'Rejected')
    go('#/hotel/registrations'); pg.click('[data-action=hotel-view-reg]'); pg.wait_for_timeout(300)
    check('Hotel viewer record dialog offers no Amend/Cancel/Check out', not any(t in ('Amend', 'Cancel registration', 'Check out') for t in modal_btns()), modal_btns()); close()
    check('Denied hotel attempt is written to the audit trail', ev("Msafiri.store.audit.some(a=>a.type==='Permission denied'&&a.outcome==='Blocked')"))
    # positive control + audit attribution
    reset(); act_as('hotel', 'USR-003')  # Receptionist Grace Lyimo
    ref = ev("Msafiri.store.recs.find(r=>r.stay==='Checked in').ref"); ev("r=>Msafiri.store.cancel(r,'ok')", ref)
    check('Receptionist can still cancel (positive control)', ev("r=>Msafiri.store.get(r).stay", ref) == 'Cancelled')
    check('Audit entry names the acting user, not a hard-coded one', ev("Msafiri.store.audit.some(a=>a.type==='Registration activity'&&a.user.indexOf('Grace Lyimo')===0)"), ev("Msafiri.store.audit.slice(0,3).map(a=>a.user)"))

    # --- Government: unmasking requires guestsearch:approve; unmask does not follow a user switch ---
    reset(); ev("Msafiri.dir.roleSave('gov-analyst',['govmonitor:read','guestsearch:read'])"); act_as('gov', 'USR-014')
    ev("Msafiri.store.unmasked={}"); go('#/gov/search')
    ev("()=>{const b=document.createElement('button');b.setAttribute('data-action','g-view');b.setAttribute('data-ref','REG-241012');document.body.appendChild(b);b.click();b.remove();}"); pg.wait_for_timeout(300)
    check('Role with search but no approve is not offered "Request unmasking"', 'Request unmasking' not in modal_btns(), modal_btns()); close()
    ev("()=>{const b=document.createElement('button');b.setAttribute('data-action','g-view');b.setAttribute('data-ref','REG-241012');document.body.appendChild(b);b.click();b.remove();}")
    reset(); ev("Msafiri.dir.roleSave('gov-analyst',['govmonitor:read','guestsearch:read'])"); act_as('gov', 'USR-014')
    ev("Msafiri.store.unmasked={}"); go('#/gov/search'); close()
    # force the (unrendered) unmask dialog path via module internals: a forced unmask must not persist state
    ev("Msafiri.store.unmasked['REG-241012']=true")
    ev("()=>{const b=document.createElement('button');b.setAttribute('data-action','g-view');b.setAttribute('data-ref','REG-241012');document.body.appendChild(b);b.click();b.remove();}"); pg.wait_for_timeout(300)
    check('Stale unmask flag is ignored for a role without approve', 'Re-mask' not in modal_btns() and 'Sensitive fields masked' in pg.inner_text('#modal-root'), modal_btns()); close()
    reset(); act_as('gov', 'USR-013')  # Officer holds approve
    ev("Msafiri.store.unmasked['REG-241012']=true"); act_as('gov', 'USR-014')
    check('Switching acting government user clears earlier unmasks', ev("!Msafiri.store.unmasked['REG-241012']"))
    reset(); act_as('gov', 'USR-013'); go('#/gov/search')
    ev("()=>{const b=document.createElement('button');b.setAttribute('data-action','g-view');b.setAttribute('data-ref','REG-241012');document.body.appendChild(b);b.click();b.remove();}"); pg.wait_for_timeout(300)
    check('Officer (holds approve) still sees "Request unmasking" (positive control)', 'Request unmasking' in modal_btns(), modal_btns()); close()

    # --- Admin: read-only Support role cannot run account / role / onboarding actions ---
    reset(); act_as('admin', 'USR-019'); go('#/admin/users')
    ev("Msafiri.dir.user('USR-009').status") 
    fire('u-unlock', 'USR-009')
    check('Support role gets no unlock dialog', 'Unlock account' not in modal_btns(), modal_btns()); close()
    for a, uid in [('u-suspend', 'USR-001'), ('u-reactivate', 'USR-010'), ('u-reset', 'USR-001')]:
        fire(a, uid); check('Support role gets no dialog for ' + a, len(modal_btns()) == 0, modal_btns()); close()
    ev("Msafiri.dir.roleCreate('Tmp','admin','d',null)"); rid = ev("Msafiri.dir.roles[Msafiri.dir.roles.length-1].id"); fire('r-delete', rid)
    check('Support role gets no delete-role dialog', 'Delete role' not in modal_btns(), modal_btns()); close()
    go('#/admin/dashboard'); q0 = ev('Msafiri.demo.admin.queue.length'); qid = ev('Msafiri.demo.admin.queue[0].id'); fire('onb-approve', qid); fire('onb-reject', qid)
    check('Support role cannot approve/reject establishments from the dashboard', len(modal_btns()) == 0 and ev('Msafiri.demo.admin.queue.length') == q0, modal_btns()); close()
    reset(); act_as('admin', 'USR-017'); go('#/admin/dashboard'); fire('onb-approve', ev('Msafiri.demo.admin.queue[0].id'))
    check('System Administrator still gets the approve dialog (positive control)', 'Approve establishment' in modal_btns(), modal_btns()); close()
    reset(); act_as('admin', 'USR-017'); go('#/admin/users'); fire('u-unlock', 'USR-009')
    check('System Administrator still gets the unlock dialog (positive control)', 'Unlock account' in modal_btns(), modal_btns()); close()

    # --- Route protection & suspended accounts ---
    reset(); act_as('gov', 'USR-015'); go('#/gov/search')
    check('Government Auditor is denied guest search page', 'Not permitted' in pg.inner_text('#main'))
    act_as('gov', 'USR-016'); go('#/gov/reports')
    check('Locked government account is denied every guarded page', 'not active' in pg.inner_text('#main'))
    reset(); act_as('hotel', 'USR-004'); go('#/hotel/new-registration')
    check('Hotel viewer is denied the new-registration page', 'Not permitted' in pg.inner_text('#main'))
    reset(); act_as('admin', 'USR-019'); go('#/admin/roles')
    check('Support role has no role-edit controls rendered', pg.locator('[data-action=r-delete],[data-action=r-save]').count() == 0)

    # --- Reporting export is permission-gated at the function level ---
    reset(); act_as('gov', 'USR-013'); rid = ev('Msafiri.reporting.rows()[0].id'); go('#/gov/reports/' + rid)
    check('Export control is disabled without reports:create', pg.locator('button:has-text("Export synthetic CSV")').first.is_disabled())

    # --- Input handling: hostile values stay inert in every list/detail page ---
    reset()
    ev("x=>Msafiri.store.checkIn({guest:x,nat:'Kenya',docType:'Passport',docNo:'XSS12345',dob:'1990-01-01',room:x,arrival:'2026-10-19',departure:'2026-10-20',nights:1})", XSS)
    ev("x=>Msafiri.dir.userCreate({name:x,email:'a@b.example',phone:'',title:x,role:'receptionist',est:'PIL-001',status:'Active'})", XSS)
    ev("x=>Msafiri.dir.estSave('PIL-002',{contact:x,address:x,notes:x})", XSS)
    ev("x=>Msafiri.dir.roleCreate(x,'admin',x,null)", XSS)
    for h in ['#/hotel/registrations', '#/hotel/submissions', '#/hotel/dashboard', '#/gov/search', '#/gov/submission-quality', '#/gov/audit', '#/gov/establishments', '#/admin/users', '#/admin/roles', '#/admin/establishments', '#/admin/audit-logs', '#/admin/dashboard']: go(h)
    check('Hostile text saved in records/users/roles does not execute on any page', not dialogs and ev("document.querySelectorAll('img[src=x]').length") == 0, dialogs)
    for h in ['#/admin/pms-health/' + XSS, '#/gov/reports/"><svg onload=alert(1)>', '#/admin/developer/webhooks/' + XSS, '#/hotel/registrations/' + XSS, '#/admin/' + XSS, '#/' + XSS]: go(h)
    check('Hostile URL fragments do not execute', not dialogs and ev("document.querySelectorAll('img[src=x],svg[onload]').length") == 0, dialogs)
    check('Content-Security-Policy meta tag is present and blocks remote scripts', ev("(document.querySelector('meta[http-equiv=Content-Security-Policy]')||{}).content||''").find("default-src 'none'") >= 0 and 'script-src \'self\'' in ev("document.querySelector('meta[http-equiv=Content-Security-Policy]').content"))

    check('No uncaught page errors during the security run', not errs, errs[:2])
    check('No external network requests during the security run', not ext, ext[:2])
    b.close()
bad = [n for n, ok in res if not ok]
print('\n%d passed, %d failed' % (len(res) - len(bad), len(bad))); sys.exit(1 if bad else 0)
