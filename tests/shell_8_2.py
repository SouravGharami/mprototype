"""Msafiri Stage 8.2 (continuation) — navigation shell, breadcrumbs, menus, modals (optional; NOT an app dependency).
Run: python3 tests/shell_8_2.py   (needs playwright + chromium; file://, synthetic data, no network)"""
import os, sys
from playwright.sync_api import sync_playwright
BASE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))
def go(pg,h): pg.evaluate('h=>location.hash=h',h); pg.wait_for_timeout(150)
bad=[]; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1366,'height':900})
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(BASE); pg.wait_for_timeout(300)
    routes=pg.evaluate("Msafiri.allItems().map(r=>r.route)")
    # sidebar link of every route: click it, hash and aria-current must match
    n=0
    for r in routes:
        portal=r.split('/')[1]
        if pg.evaluate("Msafiri.state.portal")!=portal: go(pg,'#/%s/dashboard'%portal)
        link=pg.locator('#sidebar a.nav-item[href="%s"]'%r)
        if link.count()!=1: bad.append(('sidebar link count',r,link.count())); continue
        link.click(); pg.wait_for_timeout(120); n+=1
        want={'#/admin/sandbox':'#/admin/developer/sandbox'}.get(r,r)  # intended redirect
        if pg.evaluate("location.hash")!=want: bad.append(('sidebar nav hash',r,pg.evaluate("location.hash")))
        cur=pg.evaluate("document.querySelector('#sidebar a[aria-current=page]')&&document.querySelector('#sidebar a[aria-current=page]').getAttribute('href')")
        if cur!=r: bad.append(('aria-current',r,cur))
        if not pg.inner_text('#page-title').strip(): bad.append(('empty title',r))
    print('sidebar links clicked',n)
    # breadcrumbs: every crumb link resolves to a rendered page with a title
    crumbs=set()
    for r in routes:
        go(pg,r)
        for h in pg.evaluate("[...document.querySelectorAll('#main .crumbs a')].map(a=>a.getAttribute('href'))"): crumbs.add(h)
    for h in sorted(crumbs):
        go(pg,h)
        if h!=pg.evaluate('location.hash') or 'Page not found' in pg.inner_text('#main'): bad.append(('crumb',h))
    print('distinct breadcrumb targets',len(crumbs))
    # brand + portal switch + search
    pg.click('#sidebar .brand'); pg.wait_for_timeout(150); print('brand ->',pg.evaluate('location.hash'))
    for portal in ['gov','admin','hotel']:
        pg.click('#sidebar [data-action=switch-portal][data-portal=%s]'%portal); pg.wait_for_timeout(150)
        if pg.evaluate('location.hash')!='#/%s/dashboard'%portal: bad.append(('portal switch',portal))
    pg.fill('#gsearch','audit'); pg.wait_for_timeout(100); pg.keyboard.press('Enter'); pg.wait_for_timeout(150); print('search Enter ->',pg.evaluate('location.hash'))
    pg.fill('#gsearch','zzzqq'); pg.wait_for_timeout(100); print('search none ->',pg.inner_text('#gsearch-results').strip()[:40]); pg.keyboard.press('Escape')
    # user menu items
    pg.click('#user-btn'); items=pg.evaluate("[...document.querySelectorAll('#user-panel [data-action]')].map(e=>e.getAttribute('data-action')+(e.disabled?'(disabled)':''))"); print('user menu actions',items)
    pg.click('#user-panel [data-action=show-shortcuts]'); pg.wait_for_timeout(150)
    if not pg.evaluate("!!document.querySelector('.modal')"): bad.append('shortcuts modal')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    if pg.evaluate("!!document.querySelector('.modal')"): bad.append('esc closes modal')
    pg.click('#user-btn'); pg.click('#user-panel [data-action=sign-out]'); pg.wait_for_timeout(150)
    print('sign-out toast:',pg.evaluate("document.querySelector('#toasts .toast')&&document.querySelector('#toasts .toast').innerText.replace(/\\n/g,' ')"))
    # bell: open, open a notification, route goes somewhere that exists
    for portal in ['hotel','gov','admin']:
        go(pg,'#/%s/dashboard'%portal); pg.wait_for_timeout(100); pg.click('#notif-btn'); pg.wait_for_timeout(100)
        cnt=pg.locator('#notif-panel [data-action=open-notification]').count(); pg.keyboard.press('Escape')
        for i in range(cnt):
            go(pg,'#/%s/dashboard'%portal); pg.click('#notif-btn'); it=pg.locator('#notif-panel [data-action=open-notification]').nth(i); route=it.get_attribute('data-route'); it.click(); pg.wait_for_timeout(150)
            if pg.evaluate('location.hash')!=route or 'Page not found' in pg.inner_text('#main'): bad.append(('bell route',portal,route,pg.evaluate('location.hash')))
    # modal dismissal: X, backdrop, Esc, focus return
    go(pg,'#/hotel/registrations'); btn=pg.locator('[data-action=hotel-view-reg]').first
    for how in ['x','esc','backdrop','close-btn']:
        btn.click(); pg.wait_for_timeout(120)
        if how=='x': pg.click('[data-modal-close]')
        elif how=='esc': pg.keyboard.press('Escape')
        elif how=='backdrop': pg.mouse.click(5,5)
        else: pg.click('.modal-foot button:has-text("Close")')
        pg.wait_for_timeout(120)
        if pg.evaluate("!!document.querySelector('.modal')"): bad.append(('modal not closed by',how))
        if pg.evaluate("document.body.style.overflow")=='hidden': bad.append(('body scroll locked after',how))
    # browser back/forward after navigation
    go(pg,'#/hotel/dashboard'); go(pg,'#/hotel/submissions'); pg.go_back(); pg.wait_for_timeout(150); 
    if pg.evaluate('location.hash')!='#/hotel/dashboard': bad.append(('back',pg.evaluate('location.hash')))
    pg.go_forward(); pg.wait_for_timeout(150)
    if pg.evaluate('location.hash')!='#/hotel/submissions': bad.append(('forward',pg.evaluate('location.hash')))
    # unknown routes
    for h in ['#/nope','#/hotel/nope','#/gov/nope/x','#/','#']:
        go(pg,h); print(h,'->',pg.evaluate('location.hash'),'|',pg.inner_text('#page-title'))
    if errs: bad.append(('console/page errors',errs[:2]))
    print('\nPROBLEMS',len(bad)); [print(x) for x in bad]
    b.close(); sys.exit(1 if bad else 0)
