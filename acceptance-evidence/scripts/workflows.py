from playwright.sync_api import sync_playwright
B='http://localhost:8080/index.html'
R=[]
def rec(n,ok,d=''): R.append((n,ok,d)); print(('PASS' if ok else 'FAIL'),n,d)
def go(pg,h): pg.evaluate('h=>location.hash=h',h); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1366,'height':900})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(B); pg.wait_for_timeout(400)
    # Hotel: empty submit
    go(pg,'#/hotel/new-registration'); n0=pg.evaluate("Msafiri.store.state? 1:0") if False else None
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(300)
    t=pg.inner_text('#main'); rec('Hotel empty form shows validation',('required' in t.lower() or 'enter' in t.lower() or 'select' in t.lower()) and pg.locator('[role=dialog]').count()==0, t[:0])
    # invalid: departure before arrival
    pg.fill('#f-first','Test'); pg.fill('#f-last','Synthetic'); pg.fill('#f-dob','1990-01-01')
    pg.select_option('#f-nat',index=1); pg.select_option('#f-res',index=1); pg.select_option('#f-docType',index=1)
    pg.fill('#f-docNo','SYN12345'); pg.fill('#f-room','101'); pg.fill('#f-arrival','2026-10-25'); pg.fill('#f-departure','2026-10-24')
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(300)
    t=pg.inner_text('#main').lower(); rec('Hotel departure-before-arrival rejected', pg.locator('[role=dialog]').count()==0 and ('departure' in t and ('after' in t or 'before' in t or 'earlier' in t)), '')
    # valid
    pg.fill('#f-departure','2026-10-27'); pg.check('#f-checked')
    cnt0=pg.evaluate("document.body.innerText.length")
    pg.click('[data-action=reg-review]'); pg.wait_for_timeout(400)
    rec('Hotel valid form opens review dialog', pg.locator('[role=dialog]').count()>=1)
    btns=pg.evaluate("[...document.querySelectorAll('[role=dialog] button')].map(b=>b.textContent.trim()+'|'+(b.getAttribute('data-action')||b.id))")
    print(btns)
    json_before=pg.evaluate("Msafiri.store.records?Msafiri.store.records.length:null")
    for sel in ["[role=dialog] button:has-text('Confirm')","[role=dialog] button:has-text('Check in')"]:
        if pg.locator(sel).count(): pg.locator(sel).first.click(); break
    pg.wait_for_timeout(400)
    t=pg.inner_text('body'); rec('Hotel check-in success shown', 'success' in t.lower() or 'checked in' in t.lower() or 'registered' in t.lower())
    pg.screenshot(path='/home/claude/evidence/hotel_checkin_success.png')
    # Gov search
    for sel in ["[role=dialog] button:has-text('Close')","[role=dialog] button:has-text('Done')"]:
        if pg.locator(sel).count(): pg.locator(sel).first.click(); break
    go(pg,'#/gov/dashboard'); go(pg,'#/gov/search')
    pg.click('[data-action=g-search]'); pg.wait_for_timeout(300)
    t=pg.inner_text('#main').lower(); rec('Gov empty search blocked with message', 'purpose' in t and ('required' in t or 'select' in t))
    pg.select_option('#s-purpose',index=1); pg.fill('#s-case','SYN-CASE-001'); pg.fill('#s-name','Synthetic')
    pg.click('[data-action=g-search]'); pg.wait_for_timeout(1500)
    rec('Gov valid search returns masked results/empty state', pg.inner_text('#main').lower().count('result')>0 or pg.locator('#main table').count()>0)
    pg.screenshot(path='/home/claude/evidence/gov_search.png')
    # Admin user form validation
    go(pg,'#/admin/dashboard'); go(pg,'#/admin/users/new')
    pg.click("#main button:has-text('Review and create')"); pg.wait_for_timeout(300)
    t=pg.inner_text('#main').lower(); rec('Admin empty user form shows errors', 'required' in t or 'enter' in t)
    pg.fill('#u-name','Synthetic Tester'); pg.fill('#u-email','not-an-email'); pg.select_option('#u-role',index=1)
    pg.click("#main button:has-text('Review and create')"); pg.wait_for_timeout(300)
    t=pg.inner_text('#main').lower(); rec('Admin invalid email flagged', 'email' in t and ('valid' in t or 'format' in t or 'invalid' in t))
    pg.screenshot(path='/home/claude/evidence/admin_user_validation.png')
    rec('No page errors during workflows', not errs, str(errs))
    b.close()
print(sum(1 for r in R if r[1]),'pass',sum(1 for r in R if not r[1]),'fail')
