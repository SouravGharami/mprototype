from playwright.sync_api import sync_playwright
B='http://localhost:8080/index.html'
def go(pg,h): pg.evaluate('h=>location.hash=h',h); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1366,'height':900}); pg.goto(B); pg.wait_for_timeout(400)
    for r in ['#/hotel/new-registration','#/gov/search','#/admin/users/new','#/hotel/registrations']:
        go(pg,r); print('==',r, pg.evaluate('location.hash'))
        print(pg.evaluate("[...document.querySelectorAll('#main input,#main select,#main textarea,#main button')].map(e=>(e.tagName[0])+':'+(e.id||e.name||'')+':'+(e.getAttribute('data-action')||'')+':'+(e.textContent||'').trim().slice(0,25)).slice(0,45)"))
