"""Msafiri Stage 8.4 closure — INFORMATIONAL evidence script (NOT a pass/fail test; makes no assertions; NOT an app dependency).
Prints observed facts used by STAGE8_4_CLOSURE_REPORT.md: required-field markers, duplicate-guest behaviour, authentication surface,
lifecycle states, audit event types / UI controls / in-memory mutability, page guards. Fresh browser page each run; synthetic data;
file://; no network. Run: python3 tests/stage8_4_closure_evidence.py"""
import os, json, re
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
B='file://'+os.path.join(ROOT,'index.html')
def go(pg,h): pg.evaluate('h=>location.hash=h',h); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1366,'height':900}); pg.goto(B); pg.wait_for_timeout(300)
    E=lambda js: pg.evaluate(js)
    print('== A. Required markers on every form-like page (labels carrying * / required attr)')
    for rt in ['#/hotel/new-registration','#/hotel/profile','#/hotel/staff','#/admin/establishments','#/admin/users','#/admin/reference-data','#/admin/settings']:
        go(pg,rt)
        req=E("[...document.querySelectorAll('#main [required],#main [aria-required=true]')].map(e=>e.id||e.name).filter(Boolean)")
        stars=E("[...document.querySelectorAll('#main label')].filter(l=>/\\*/.test(l.innerText)).map(l=>l.innerText.replace(/\\s+/g,' ').trim().slice(0,30))")
        print(rt,'| required attrs:',req[:12],'| starred labels:',stars[:12])
    print('== B. Duplicate-guest prevention: same document twice')
    r=E("""(()=>{var S=Msafiri.store,n0=S.recs.length;var d=()=>({guest:'Dup Guest',nat:'Kenya',docType:'Passport',docNo:'DUP123456',dob:'1990-01-01',room:'1',arrival:'2026-10-22',departure:'2026-10-24',nights:2});
      var a=S.checkIn(d()),b=S.checkIn(d());return {first:!!a,second:!!b,added:S.recs.length-n0,refs:[a&&a.ref,b&&b.ref]}})()""")
    print(r)
    print('== C. Authentication surface')
    print('password inputs on any route:',sum(1 for rt in E("Msafiri.allItems().map(r=>r.route)") if (go(pg,rt) or True) and E("document.querySelectorAll('input[type=password]').length")))
    print('roles per portal:',E("""(()=>{var D=Msafiri.dir,o={};['hotel','gov','admin'].forEach(p=>{o[p]=D.eligible(p).map(u=>u.name+' ['+((D.role(u.role||u.roleId)||{}).name)+']')});return o})()"""))
    print('== D. Lifecycle states present in code/data')
    print('stay:',E("Array.from(new Set(Msafiri.store.recs.map(r=>r.stay)))"),'| submission:',E("Array.from(new Set(Msafiri.store.recs.map(r=>r.sub)))"))
    print('== E. Audit: event types, UI controls, mutability')
    print('types seeded:',E("Array.from(new Set(Msafiri.store.audit.map(a=>a.type)))"))
    for rt in ['#/gov/audit','#/admin/audit-logs']:
        go(pg,rt)
        btns=E("[...document.querySelectorAll('#main button, #main a.btn')].map(b=>b.innerText.trim()).filter(Boolean)")
        print(rt,'| buttons:',btns[:14],'| delete/edit/clear/purge control present:',any(re.search(r'delete|edit|clear|purge|remove',x,re.I) for x in btns))
    print('in-memory audit array frozen?',E("Object.isFrozen(Msafiri.store.audit)"),'| entry frozen?',E("Object.isFrozen(Msafiri.store.audit[0])"))
    n=E("Msafiri.store.audit.length"); E("Msafiri.store.audit.pop()"); print('console pop() removes an entry:',E("Msafiri.store.audit.length")==n-1)
    print('Reset demo data restores/wipes audit (S.reset reseeds):',bool(re.search(r'S\.audit = seedAudit\(\)',open(os.path.join(ROOT,'js','store.js'),encoding='utf-8').read())))
    print('== F. Data handling')
    go(pg,'#/gov/search'); t=E("document.querySelector('#main').innerText.slice(0,0)")
    print('gov search page guard perm:',E("Msafiri.dir.GUARDS&&Msafiri.dir.GUARDS['gov/search']"),'| audit guard:',E("Msafiri.dir.GUARDS&&Msafiri.dir.GUARDS['gov/audit']"))
    b.close()
