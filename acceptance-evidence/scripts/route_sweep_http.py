import json
from playwright.sync_api import sync_playwright
B='http://localhost:8080/index.html'
errs=[];reqs=[];res={}
def go(pg,h): pg.evaluate('h=>location.hash=h',h); pg.wait_for_timeout(200)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in [(1366,900),(768,1024),(390,844),(320,640)]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page()
        pg.on('pageerror',lambda e:errs.append((w,'pageerror',str(e))))
        pg.on('console',lambda m:errs.append((w,'console',m.text)) if m.type=='error' else None)
        pg.on('request',lambda r:reqs.append(r.url) if not r.url.startswith('http://localhost:8080') else None)
        pg.goto(B); pg.wait_for_timeout(400)
        routes=pg.evaluate("Msafiri.allItems().map(r=>r.route)")
        over=[];empty=[];nf=[]
        for r in routes:
            go(pg,r)
            ov=pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
            if ov>1: over.append((r,ov))
            t=pg.inner_text('#main')
            if len(t.strip())<20: empty.append(r)
            if 'Page not found' in t: nf.append(r)
        res[w]={'routes':len(routes),'overflow':over,'empty':empty,'notfound':nf}
        if w in (1366,390):
            for portal in ['hotel','gov','admin']:
                go(pg,'#/%s/dashboard'%portal); pg.screenshot(path='/home/claude/evidence/%s_%d.png'%(portal,w))
        ctx.close()
    b.close()
print(json.dumps(res,indent=1)); print('errs',errs); print('external reqs',reqs)
