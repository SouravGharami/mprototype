/* Msafiri — Guided journey engine.
   1. Welcome intro (first visit only)      2. Spotlight tour per module (first visit to each module only)
   3. "Guide Me" button -> Guide Hub: replay this page's tour, replay the intro, browse every module's unique logic.
   Progress is remembered in a cookie (mirrored to localStorage so it also survives file:// where cookies are not kept).
   Content lives in js/guide-data.js. Nothing here touches guest data or demo state. */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});
  var G = (M.guide = M.guide || {});
  var esc = M.esc, icon = M.icon;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var COOKIE = 'msafiri_guide', LS = 'msafiri.guide';

  /* ======================= Persistence (cookie + localStorage mirror) ======================= */
  var st = { intro: false, off: false, done: false, seen: {} };

  function serialise() {
    return 'v=1&i=' + (st.intro ? 1 : 0) + '&o=' + (st.off ? 1 : 0) + '&c=' + (st.done ? 1 : 0) +
      '&s=' + Object.keys(st.seen).filter(function (k) { return st.seen[k]; }).map(function (k) { return k.replace('/', '.'); }).join('~');
  }
  function parseInto(str, into) {
    if (!str) return;
    str.split('&').forEach(function (kv) {
      var p = kv.split('='), k = p[0], v = p.slice(1).join('=');
      if (k === 'i' && v === '1') into.intro = true;
      if (k === 'o' && v === '1') into.off = true;
      if (k === 'c' && v === '1') into.done = true;
      if (k === 's' && v) v.split('~').forEach(function (x) { if (/^[a-z]+\.[a-z0-9-]+$/.test(x)) into.seen[x.replace('.', '/')] = true; });
    });
  }
  function readCookie() {
    try {
      var m = document.cookie.split('; ').filter(function (c) { return c.indexOf(COOKIE + '=') === 0; })[0];
      return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : '';
    } catch (e) { return ''; }
  }
  function load() {
    var a = { intro: false, off: false, done: false, seen: {} };
    parseInto(readCookie(), a);
    try { parseInto(localStorage.getItem(LS) || '', a); } catch (e) { /* storage blocked */ }
    st = a;
  }
  function save() {
    var v = serialise();
    try { document.cookie = COOKIE + '=' + encodeURIComponent(v) + '; path=/; max-age=31536000; SameSite=Lax'; } catch (e) { /* cookies blocked */ }
    try { localStorage.setItem(LS, v); } catch (e) { /* storage blocked */ }
  }
  G.state = function () { return JSON.parse(JSON.stringify(st)); };

  /* ======================= Helpers ======================= */
  function curRoute() {
    var p = location.hash.replace(/^#\/?/, '').split('/'), id = p[1] || 'dashboard';
    if (p[0] === 'admin' && id === 'developer' && p[2] === 'sandbox') id = 'sandbox'; /* same alias the sidebar uses */
    return { portal: p[0], id: id };
  }
  function curKey() { var r = curRoute(); return r.portal + '/' + r.id; }
  function keys() {
    return M.allItems().map(function (r) { return r.portal + '/' + r.item.id; }).filter(function (k) { return !!G.modules[k]; });
  }
  function seenCount() { return keys().filter(function (k) { return st.seen[k]; }).length; }
  function meta(key) {
    var p = key.split('/'), f = M.findItem(p[0], p[1]);
    return f ? { portal: p[0], id: p[1], item: f.item, group: f.group, label: f.item.label, icon: f.item.icon } : null;
  }
  function nextUnseen(after) {
    var ks = keys(), i = ks.indexOf(after), n;
    for (n = 1; n <= ks.length; n++) { var k = ks[(i + n) % ks.length]; if (!st.seen[k] && k !== after) return k; }
    return null;
  }
  function lockApp(on) { var a = $('#app'); if (!a) return; if (on) a.setAttribute('inert', ''); else a.removeAttribute('inert'); }
  function mobile() { return global.innerWidth <= 640; }
  function trap(root, e) {
    if (e.key !== 'Tab') return;
    var f = [].slice.call(root.querySelectorAll('button:not([disabled]), a[href], input, [tabindex="0"]')).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ======================= Guide button ======================= */
  var R = 12, C = 2 * Math.PI * R;
  function renderButton() {
    var b = $('#guide-btn'); if (!b) return;
    var total = keys().length, n = seenCount(), k = curKey();
    var isNew = !!G.modules[k] && !st.seen[k];
    b.classList.toggle('has-new', isNew);
    b.innerHTML = '<span class="guide-ring"><svg class="gd-ring" viewBox="0 0 28 28" aria-hidden="true"><circle class="gd-ring-bg" cx="14" cy="14" r="' + R + '"/><circle class="gd-ring-fg" cx="14" cy="14" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - (total ? n / total : 0))).toFixed(2) + '"/></svg>' + icon('help') + '</span>' +
      '<span class="gd-label">Guide Me</span><span class="gd-frac">' + n + '/' + total + '</span>';
    b.setAttribute('aria-label', 'Guide Me: replay tours and browse every module’s logic. ' + n + ' of ' + total + ' modules explored' + (isNew ? '; this page has a new guide' : ''));
    b.setAttribute('title', 'Guide Me — replay this page’s tour or browse every module’s logic (shortcut: ?)');
  }

  /* ======================= Welcome intro ======================= */
  var introEl = null, slide = 0, SLIDES = 6;

  function introHTML() {
    var flow = G.journey.map(function (s, i) {
      return '<div class="gd-node"><span class="gd-node-ico">' + icon(s.icon) + '</span><span class="gd-node-n">0' + s.n + '</span><h3>' + esc(s.t) + '</h3><p>' + esc(s.s) + '</p>' +
        (i === 2 ? '<div class="gd-stat" aria-hidden="true"><span class="s1">Pending</span><span class="s2">Submitted</span><span class="s3">Acknowledged</span></div>' : '') + '</div>';
    }).join('');
    var portals = G.portalsIntro.map(function (p) {
      return '<div class="gd-card"><div class="ico">' + icon(p.icon) + '</div><h3>' + esc(p.t) + '</h3><p>' + esc(p.s) + '</p><span class="who">' + esc(p.who) + '</span></div>';
    }).join('');
    var rules = G.rules.map(function (r) {
      return '<div class="gd-card"><div class="ico">' + icon(r.icon) + '</div><h3>' + esc(r.t) + '</h3><p>' + esc(r.s) + '</p></div>';
    }).join('');
    return '<div class="gd-orb o1"></div><div class="gd-orb o2"></div><div class="gd-orb o3"></div>' +
      '<div class="gd-intro-top"><div class="gd-intro-brand"><span class="brand-mark" aria-hidden="true">M</span>Msafiri</div><button type="button" class="gd-skip" data-gd="intro-skip">Skip intro</button></div>' +
      '<div class="gd-stage">' +
      '<section class="gd-slide" aria-label="Welcome"><div class="gd-hero-mark" aria-hidden="true">M</div><span class="gd-eyebrow">Welcome</span><h2 class="gd-h wide">Welcome to <em>Msafiri</em></h2>' +
      '<p class="gd-lead">One national guest register. Hotels register guests and report to government; government oversees with privacy built in; administrators keep it all running.</p>' +
      '<div class="gd-chips"><span class="gd-chip">' + icon('building') + 'Hotels report</span><span class="gd-chip">' + icon('shield-check') + 'Government oversees</span><span class="gd-chip">' + icon('sliders') + 'Administrators govern</span></div></section>' +
      '<section class="gd-slide" aria-label="The journey of one guest"><span class="gd-eyebrow">The big idea</span><h2 class="gd-h wide">Follow one guest, from the front desk to government</h2>' +
      '<p class="gd-lead">Every screen in Msafiri is a step in this single journey.</p><div class="gd-flow">' + flow + '</div></section>' +
      '<section class="gd-slide" aria-label="Three portals"><span class="gd-eyebrow">Who uses it</span><h2 class="gd-h wide">Three portals. Three jobs.</h2>' +
      '<p class="gd-lead">Switch between them in the sidebar under “Portal (demo role)”.</p><div class="gd-cards c3">' + portals + '</div></section>' +
      '<section class="gd-slide" aria-label="Five rules"><span class="gd-eyebrow">What makes it different</span><h2 class="gd-h wide">Five rules you will meet on almost every screen</h2>' +
      '<div class="gd-cards c5">' + rules + '</div></section>' +
      '<section class="gd-slide" aria-label="How guidance works"><span class="gd-eyebrow">You will never be left guessing</span><h2 class="gd-h wide">Every module explains itself — once</h2>' +
      '<div class="gd-mock" aria-hidden="true"><div class="bar"><span class="pill">Guide Me</span></div><div class="blk b1"></div><div class="blk b2"></div><div class="blk b3"></div><div class="blk b4"></div><div class="spot"></div><div class="coach"><b>Four live counters</b><span>Calculated from the records you create.</span><i></i></div></div>' +
      '<div class="gd-points"><div class="gd-point"><b>Shown once per module</b>The first time you open a page, a short spotlight tour explains what it is for.</div><div class="gd-point"><b>Remembered</b>Finished tours are saved on this device and never shown again.</div><div class="gd-point"><b>Replay any time</b>The <b style="display:inline;color:var(--orange-400)">Guide Me</b> button (top right) replays a tour or lists every module’s unique logic.</div></div></section>' +
      '<section class="gd-slide" aria-label="Ready"><span class="gd-eyebrow">Ready</span><h2 class="gd-h wide">Let’s start at the <em>Hotel front desk</em></h2>' +
      '<p class="gd-lead">We will take you to the Hotel Portal dashboard and walk you through it. Each new module you open after that gets its own short tour.</p>' +
      '<div class="gd-cta"><button type="button" class="gd-go" data-gd="intro-go">Start the guided journey ' + icon('arrow-right') + '</button><button type="button" class="gd-ghost" data-gd="intro-self">I’ll explore on my own</button></div>' +
      '<p class="gd-fine">Either way, “Guide Me” stays available whenever you want it.</p></section>' +
      '</div>' +
      '<div class="gd-intro-foot"><div class="gd-dots" role="tablist" aria-label="Intro progress">' + Array.apply(null, Array(SLIDES)).map(function (_, i) { return '<button type="button" class="gd-dot" role="tab" data-gd="intro-to" data-i="' + i + '" aria-label="Slide ' + (i + 1) + ' of ' + SLIDES + '"></button>'; }).join('') + '</div>' +
      '<div class="gd-nav"><button type="button" data-gd="intro-back">Back</button><button type="button" class="primary" data-gd="intro-next">Next</button></div></div>';
  }

  function showSlide(i) {
    slide = Math.max(0, Math.min(SLIDES - 1, i));
    [].forEach.call(introEl.querySelectorAll('.gd-slide'), function (s, n) { s.classList.toggle('on', n === slide); });
    [].forEach.call(introEl.querySelectorAll('.gd-dot'), function (d, n) { d.classList.toggle('on', n === slide); d.classList.toggle('done', n < slide); d.setAttribute('aria-selected', n === slide); });
    var back = $('[data-gd="intro-back"]', introEl), next = $('[data-gd="intro-next"]', introEl);
    back.disabled = slide === 0; next.style.display = slide === SLIDES - 1 ? 'none' : '';
    var st0 = $('.gd-stage', introEl); if (st0) st0.scrollTop = 0;
    if (slide === SLIDES - 1) { var go = $('[data-gd="intro-go"]', introEl); if (go) go.focus(); } else if (next) next.focus();
  }

  function openIntro() {
    closeTour(true); closeHub(true);
    if (introEl) return;
    introEl = document.createElement('div');
    introEl.className = 'gd-intro'; introEl.setAttribute('role', 'dialog'); introEl.setAttribute('aria-modal', 'true'); introEl.setAttribute('aria-label', 'Welcome to Msafiri');
    introEl.innerHTML = introHTML();
    document.body.appendChild(introEl); lockApp(true);
    showSlide(0);
  }
  function closeIntro(then) {
    if (!introEl) return;
    var el = introEl; introEl = null;
    st.intro = true; save();
    el.classList.add('gd-leaving');
    setTimeout(function () { el.remove(); }, 400);
    lockApp(false);
    if (then) then();
  }
  function introFinish(startTour) {
    closeIntro(function () {
      if (!startTour) { st.off = true; save(); renderButton(); M.toast && M.toast.info('Page tours are off', 'Open “Guide Me” any time to replay a tour or browse every module.'); return; }
      st.off = false; save();
      var want = '#/hotel/dashboard';
      if (location.hash !== want) { pending = 'hotel/dashboard'; location.hash = want; }
      else setTimeout(function () { startTour2('hotel/dashboard'); }, 500);
      renderButton();
    });
  }
  function startTour2(k) { startTour(k, { auto: false }); }

  /* ======================= Spotlight tour ======================= */
  var tour = null, pending = null, autoTimer = null, forceTimer = null, forceKey = null, suppressed = false;

  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && r.right > 0 && r.left < global.innerWidth && getComputedStyle(el).visibility !== 'hidden';
  }
  function cardByTitle(t) {
    t = t.toLowerCase();
    var cs = [].slice.call(document.querySelectorAll('#main .card'));
    return cs.filter(function (c) {
      var l = (c.getAttribute('aria-label') || '') + ' ' + (($('h3', c) || {}).textContent || '');
      return l.toLowerCase().indexOf(t) > -1;
    })[0] || null;
  }
  function find1(s) {
    var main = $('#main'), m;
    if (s.indexOf('card:') === 0) {
      var rest = s.slice(5), cut = rest.search(/ [.#\[]/), title = cut > -1 ? rest.slice(0, cut) : rest, sub = cut > -1 ? rest.slice(cut + 1) : '';
      var c = cardByTitle(title); return c && sub ? $(sub, c) : c;
    }
    if (s.indexOf('btn:') === 0) {
      var t = s.slice(4).toLowerCase();
      return [].slice.call(main.querySelectorAll('button, a.btn, a')).filter(function (b) { return visible(b) && b.textContent.toLowerCase().indexOf(t) > -1; })[0] || null;
    }
    if (s.indexOf('nav:') === 0) { m = $('#sidebar .nav-item[href$="/' + s.slice(4) + '"]'); return m; }
    try { return [].slice.call(main.querySelectorAll(s)).filter(visible)[0] || $(s); } catch (e) { return null; }
  }
  function resolve(spec) {
    if (!spec) return null;
    var list = Array.isArray(spec) ? spec : [spec];
    for (var i = 0; i < list.length; i++) { var el = find1(list[i]); if (el && visible(el)) return el; }
    return null;
  }

  function buildSteps(key) {
    var mt = meta(key), mod = G.modules[key] || { purpose: mt ? mt.item.desc : '', logic: [], steps: [] };
    var steps = [{ kind: 'intro', t: 'What is “' + mt.label + '” for?', b: mod.purpose }];
    mod.steps.forEach(function (s) { steps.push({ kind: 'step', at: s.at, t: s.t, b: s.b, tip: s.tip }); });
    if (mod.logic && mod.logic.length) steps.push({ kind: 'logic', t: 'The logic to remember', logic: mod.logic });
    return steps;
  }

  function startTour(key, opts) {
    var mt = meta(key); if (!mt) return;
    closeTour(true); closeHub(true);
    clearTimeout(autoTimer); clearTimeout(forceTimer); forceTimer = null;
    st.seen[key] = true; save(); renderButton();
    var steps = buildSteps(key);
    var el = document.createElement('div');
    el.className = 'gd-tour'; el.id = 'gd-tour';
    el.innerHTML = '<div class="gd-shield"></div><div class="gd-spot centered"></div><div class="gd-coach" role="dialog" aria-modal="true" aria-labelledby="gd-c-t" aria-describedby="gd-c-b"></div>';
    document.body.appendChild(el); lockApp(true);
    tour = { key: key, mt: mt, steps: steps, i: 0, el: el, spot: $('.gd-spot', el), coach: $('.gd-coach', el), target: null, spec: null, opener: document.activeElement, raf: 0, auto: !!(opts && opts.auto) };
    el.querySelector('.gd-shield').addEventListener('mousedown', function (e) { e.preventDefault(); });
    tour.coach.addEventListener('click', onTourClick);
    global.addEventListener('resize', onTourMove); global.addEventListener('scroll', onTourMove, true);
    showStep(0);
    loop();
  }

  function closeTour(silent) {
    if (!tour) return;
    var t = tour; tour = null;
    cancelAnimationFrame(t.raf);
    global.removeEventListener('resize', onTourMove); global.removeEventListener('scroll', onTourMove, true);
    t.el.remove(); lockApp(false);
    if (!silent) {
      var back = t.opener && document.body.contains(t.opener) && t.opener.focus ? t.opener : $('#page-title');
      try { back.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      if (seenCount() === keys().length && !st.done) { st.done = true; save(); celebrate(); }
    }
  }

  var moveTimer = null;
  function onTourMove() {
    if (!tour) return;
    tour.spot.classList.add('nt'); tour.coach.classList.add('nt');
    tour.spot.style.transition = 'none'; tour.coach.style.transition = 'none';
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () { if (tour) { tour.spot.style.transition = ''; tour.coach.style.transition = ''; } }, 140);
  }
  /* Keeps the spotlight glued to its target while the page scrolls, redraws or resizes */
  function loop() {
    if (!tour) return;
    var t = tour;
    if (t.spec && (!t.target || !t.target.isConnected)) t.target = resolve(t.spec);
    placeSpot(false);
    t.raf = requestAnimationFrame(loop);
  }

  function showStep(i) {
    var t = tour; if (!t) return;
    t.i = Math.max(0, Math.min(t.steps.length - 1, i));
    var s = t.steps[t.i], last = t.i === t.steps.length - 1, first = t.i === 0;
    t.spec = s.kind === 'step' ? s.at : null;
    t.target = t.spec ? resolve(t.spec) : null;
    var centered = !t.target;
    if (t.target) bringIntoView(t.target);

    var dots = t.steps.map(function (_, n) { return '<i class="' + (n < t.i ? 'done' : n === t.i ? 'on' : '') + '"></i>'; }).join('');
    var nextK = last ? nextUnseen(t.key) : null, nm = nextK && meta(nextK);
    var body;
    if (s.kind === 'logic') body = '<ul class="gd-rules">' + s.logic.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>';
    else body = '<p id="gd-c-b">' + s.b + '</p>' + (s.tip ? '<div class="gd-tip">' + icon('info') + '<span>Try it: ' + esc(s.tip) + '</span></div>' : '');
    var badge = s.kind === 'intro' ? '<span class="gd-badge">' + icon('info') + 'Concept</span>' : s.kind === 'logic' ? '<span class="gd-badge">' + icon('key') + 'Unique logic in this module</span>' : '';

    t.coach.className = 'gd-coach' + (s.kind === 'logic' || s.kind === 'intro' ? ' big' : '');
    t.coach.innerHTML =
      '<div class="gd-coach-head"><span class="gd-coach-eyebrow">' + esc(M.portals[t.mt.portal].label) + ' · ' + esc(t.mt.label) + '</span><button type="button" class="gd-coach-x" data-gd="tour-close" aria-label="Close tour">' + icon('x') + '</button></div>' +
      '<div class="gd-coach-body">' + badge + '<h3 id="gd-c-t">' + esc(s.t) + '</h3>' + (s.kind === 'logic' ? '<div id="gd-c-b">' + body + '</div>' : body) + '</div>' +
      '<div class="gd-coach-foot"><div class="gd-prog" aria-hidden="true">' + dots + '</div><div class="gd-btns"><span class="gd-count">' + (t.i + 1) + ' / ' + t.steps.length + '</span>' +
      (first ? '<button type="button" class="gd-skiplink" data-gd="tour-close">Skip tour</button>' : '<button type="button" class="btn btn-secondary btn-sm" data-gd="tour-back">Back</button>') +
      (last ? (nm ? '<button type="button" class="btn btn-secondary btn-sm" data-gd="tour-next-module" data-k="' + esc(nextK) + '">Next: ' + esc(nm.label.length > 22 ? nm.label.slice(0, 21) + '…' : nm.label) + '</button>' : '') + '<button type="button" class="btn btn-accent btn-sm" data-gd="tour-close">Got it</button>'
        : '<button type="button" class="btn btn-accent btn-sm" data-gd="tour-next">' + (first ? 'Show me' : 'Next') + ' ' + icon('arrow-right', { size: 16 }) + '</button>') + '</div></div>';
    /* restart entrance animation without re-creating the element (keeps the position glide) */
    t.coach.style.animation = 'none'; void t.coach.offsetWidth; t.coach.style.animation = '';
    t.spot.classList.toggle('centered', centered);
    placeSpot(true);
    var primary = $('.btn-accent', t.coach) || $('button', t.coach); if (primary) primary.focus({ preventScroll: true });
  }

  function bringIntoView(el) {
    if (el.closest && el.closest('#sidebar')) return;
    var r = el.getBoundingClientRect(), vh = global.innerHeight, m = mobile();
    var top = 90, bottom = m ? vh * 0.5 : vh - 40;
    if (r.top >= top && r.bottom <= bottom) return;
    var y;
    if (r.height > vh - 220) y = r.top - 100;
    else if (m) y = r.top - 90;
    else y = r.top - (vh - r.height) / 2 + 20;
    global.scrollTo({ top: Math.max(0, global.scrollY + y), behavior: 'instant' });
  }

  function placeSpot(initial) {
    var t = tour; if (!t) return;
    var spot = t.spot, coach = t.coach, vw = global.innerWidth, vh = global.innerHeight, pad = 8;
    var rect = null;
    if (t.target && visible(t.target)) {
      var r = t.target.getBoundingClientRect();
      var l = Math.max(4, r.left - pad), tp = Math.max(4, r.top - pad), rr = Math.min(vw - 4, r.right + pad), bb = Math.min(vh - 4, r.bottom + pad);
      rect = { left: l, top: tp, width: Math.max(10, rr - l), height: Math.max(10, bb - tp) };
    }
    var cw = coach.offsetWidth, ch = coach.offsetHeight, left, top, side = '';
    if (!rect) {
      spot.style.left = vw / 2 + 'px'; spot.style.top = vh / 2 + 'px'; spot.style.width = '0px'; spot.style.height = '0px';
      left = (vw - cw) / 2; top = Math.max(12, (vh - ch) / 2);
    } else {
      spot.style.left = rect.left + 'px'; spot.style.top = rect.top + 'px'; spot.style.width = rect.width + 'px'; spot.style.height = rect.height + 'px';
      var gap = 16, edge = 12, space = { bottom: vh - (rect.top + rect.height), top: rect.top, right: vw - (rect.left + rect.width), left: rect.left };
      var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      if (space.bottom >= ch + gap + edge) { side = 'bottom'; top = rect.top + rect.height + gap; left = cx - cw / 2; }
      else if (space.top >= ch + gap + edge) { side = 'top'; top = rect.top - ch - gap; left = cx - cw / 2; }
      else if (space.right >= cw + gap + edge) { side = 'right'; left = rect.left + rect.width + gap; top = cy - ch / 2; }
      else if (space.left >= cw + gap + edge) { side = 'left'; left = rect.left - cw - gap; top = cy - ch / 2; }
      else { left = vw - cw - 20; top = vh - ch - 20; }
      left = Math.max(edge, Math.min(vw - cw - edge, left)); top = Math.max(edge, Math.min(vh - ch - edge, top));
      if (side === 'bottom' || side === 'top') coach.style.setProperty('--ax', Math.max(16, Math.min(cw - 30, cx - left - 7)) + 'px');
      if (side === 'left' || side === 'right') coach.style.setProperty('--ay', Math.max(16, Math.min(ch - 30, cy - top - 7)) + 'px');
    }
    coach.setAttribute('data-side', side);
    if (!mobile()) { coach.style.left = Math.round(left) + 'px'; coach.style.top = Math.round(top) + 'px'; }
    if (initial) { /* first paint of a step: allow the glide */ }
  }

  function onTourClick(e) {
    var b = e.target.closest('[data-gd]'); if (!b || !tour) return;
    var a = b.getAttribute('data-gd');
    if (a === 'tour-next') showStep(tour.i + 1);
    else if (a === 'tour-back') showStep(tour.i - 1);
    else if (a === 'tour-close') closeTour();
    else if (a === 'tour-next-module') { var k = b.getAttribute('data-k'); closeTour(true); goModule(k, true); }
  }

  function celebrate() {
    var n = keys().length, d = document.createElement('div');
    d.className = 'gd-done'; d.setAttribute('role', 'status');
    d.innerHTML = '<span class="ico">' + icon('check-circle') + '</span><div><b>Journey complete — all ' + n + ' modules explored</b><span>Open Guide Me any time to replay a tour or revisit a module’s logic.</span></div><button type="button" class="btn btn-ghost btn-sm" style="color:#fff" data-gd="done-x">Dismiss</button>';
    document.body.appendChild(d);
    d.addEventListener('click', function () { d.remove(); });
    setTimeout(function () { if (d.isConnected) d.remove(); }, 9000);
  }

  /* ======================= Navigation into a module ======================= */
  function goModule(key, force) {
    var mt = meta(key); if (!mt) return;
    closeHub(true); closeTour(true);
    var hash = '#/' + mt.portal + '/' + mt.id;
    if (curKey() === key) { setTimeout(function () { startTour(key, { auto: false }); }, 250); return; }
    pending = key; location.hash = hash;
  }

  /* ======================= Auto start for first-time modules ======================= */
  function maybeAuto() {
    if (forceTimer) return;
    clearTimeout(autoTimer);
    if (suppressed || !st.intro || st.off || tour || introEl || hubEl) return;
    var k = curKey();
    if (!G.modules[k] || st.seen[k]) return;
    var r = curRoute();
    if (M.dir && M.dir.denied && M.dir.denied(r.portal, r.id)) return;
    autoTimer = setTimeout(function () {
      if (curKey() !== k || tour || introEl || hubEl || st.seen[k]) return;
      if ($('.modal-backdrop')) return;
      startTour(k, { auto: true });
    }, 750);
  }

  /* ======================= Guide Hub ======================= */
  var hubEl = null, hubTab = 'now', hubPortal = 'hotel', hubQuery = '', hubOpen = {}, resetArmed = false, resetTimer = null;

  function ring(n, total) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - (total ? n / total : 0));
    return '<div class="gd-bigring"><svg viewBox="0 0 62 62" aria-hidden="true"><circle class="bg" cx="31" cy="31" r="' + r + '"/><circle class="fg" cx="31" cy="31" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + Math.round(total ? 100 * n / total : 0) + '%</b></div>';
  }
  function logicList(l) { return '<ul class="gd-logic">' + l.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }

  function nowTab() {
    var k = curKey(), mt = meta(k), mod = G.modules[k];
    if (!mt) return '<div class="gd-empty">This address is not a Msafiri page. Use the Module Atlas to browse every module.</div>';
    var nk = nextUnseen(k), nm = nk && meta(nk);
    var out = '<div class="gd-now"><div class="eyebrow">' + esc(M.portals[mt.portal].label) + ' · ' + esc(mt.group) + '</div><h3>' + esc(mt.label) + '</h3>';
    if (mod) {
      out += '<p>' + esc(mod.purpose) + '</p><h4>Unique logic implemented here</h4>' + logicList(mod.logic) +
        '<div class="row-btns"><button type="button" class="btn btn-accent" data-gd="play" data-k="' + esc(k) + '">' + icon('arrow-right') + '<span>Play the step-by-step tour</span></button></div>';
    } else {
      out += '<p>' + esc(mt.item.desc || '') + '</p><div class="hint">No guided tour has been written for this page.</div>';
    }
    out += '</div>';
    if (nm) out += '<div class="gd-now" style="margin-top:12px"><div class="eyebrow">Continue the journey</div><h3>' + esc(nm.label) + '</h3><p>' + esc((G.modules[nk] || {}).purpose || '') + '</p><div class="row-btns"><button type="button" class="btn btn-secondary" data-gd="play" data-k="' + esc(nk) + '">' + icon('arrow-right') + '<span>Take me there</span></button></div></div>';
    return out;
  }

  function atlasTab() {
    var q = hubQuery.trim().toLowerCase();
    var pills = ['hotel', 'gov', 'admin', 'all'].map(function (p) {
      var lbl = p === 'all' ? 'All modules' : M.portals[p].label;
      return '<button type="button" class="gd-pill" data-gd="pill" data-p="' + p + '" aria-pressed="' + (hubPortal === p) + '">' + esc(lbl) + '</button>';
    }).join('');
    var body = '', shown = 0;
    M.portalOrder.forEach(function (p) {
      if (hubPortal !== 'all' && hubPortal !== p) return;
      M.nav[p].forEach(function (g) {
        var rows = g.items.filter(function (it) {
          var mod = G.modules[p + '/' + it.id]; if (!mod) return false;
          if (!q) return true;
          return (it.label + ' ' + g.group + ' ' + mod.purpose + ' ' + mod.logic.join(' ')).replace(/<[^>]+>/g, '').toLowerCase().indexOf(q) > -1;
        });
        if (!rows.length) return;
        body += '<div class="gd-group"><div class="gd-group-t">' + esc((hubPortal === 'all' ? M.portals[p].label + ' · ' : '') + g.group) + '</div>' + rows.map(function (it) {
          var k = p + '/' + it.id, mod = G.modules[k], open = !!hubOpen[k] || (!!q && rows.length < 4), seen = !!st.seen[k]; shown++;
          return '<div class="gd-mod' + (open ? ' open' : '') + '"><button type="button" class="gd-mod-h" data-gd="toggle" data-k="' + esc(k) + '" aria-expanded="' + open + '">' +
            '<span class="gd-mod-ico">' + icon(it.icon) + '</span><span class="gd-mod-t"><b>' + esc(it.label) + '</b><span>' + esc(mod.purpose) + '</span></span>' +
            '<span class="gd-seen' + (seen ? '' : ' no') + '" title="' + (seen ? 'Tour seen' : 'Tour not seen yet') + '">' + icon('check') + '</span><span class="gd-chev">' + icon('chevron-down') + '</span></button>' +
            '<div class="gd-mod-b"><p>' + esc(mod.purpose) + '</p><h4>Unique logic implemented</h4>' + logicList(mod.logic) +
            '<div class="row-btns"><button type="button" class="btn btn-accent btn-sm" data-gd="play" data-k="' + esc(k) + '">' + icon('arrow-right') + '<span>Walk me through it</span></button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-gd="open" data-k="' + esc(k) + '">Open page</button></div></div></div>';
        }).join('') + '</div>';
      });
    });
    return '<div class="gd-find">' + icon('search') + '<input type="search" id="gd-q" placeholder="Search modules or rules, e.g. “masked”, “offline”, “approval”" value="' + esc(hubQuery) + '" aria-label="Search modules"></div>' +
      '<div class="gd-filter" role="group" aria-label="Filter by portal">' + pills + '</div>' + (shown ? body : '<div class="gd-empty">No module matches “' + esc(hubQuery) + '”.</div>');
  }

  function hubHTML() {
    var total = keys().length, n = seenCount();
    return '<div class="gd-hub-scrim" data-gd="hub-close"></div><div class="gd-hub" role="dialog" aria-modal="true" aria-labelledby="gd-hub-t">' +
      '<div class="gd-hub-head"><button type="button" class="gd-hub-close" data-gd="hub-close" aria-label="Close guide">' + icon('x') + '</button><h2 id="gd-hub-t">Guide Hub</h2><p>Replay a tour, or browse the unique logic built into every module.</p>' +
      '<div class="gd-hub-prog">' + ring(n, total) + '<div class="txt"><strong>' + n + ' of ' + total + ' modules explored</strong>' + (n === total ? 'You have seen everything. Replay any time.' : 'Open a new page and its tour starts automatically.') + '</div></div></div>' +
      '<div class="gd-tabs" role="tablist"><button type="button" class="gd-tab" role="tab" data-gd="tab" data-t="now" aria-selected="' + (hubTab === 'now') + '">This page</button><button type="button" class="gd-tab" role="tab" data-gd="tab" data-t="atlas" aria-selected="' + (hubTab === 'atlas') + '">Module atlas</button></div>' +
      '<div class="gd-hub-body" id="gd-hub-body" role="tabpanel">' + (hubTab === 'now' ? nowTab() : atlasTab()) + '</div>' +
      '<div class="gd-hub-foot"><span class="gd-switch"><button type="button" role="switch" id="gd-auto" data-gd="auto" aria-checked="' + (!st.off) + '" aria-label="Show a tour automatically the first time I open a module"></button><label for="gd-auto">Auto-start tours for new modules</label></span>' +
      '<span class="gd-foot-links"><button type="button" class="btn btn-ghost btn-sm" data-gd="replay-intro">Replay welcome</button><button type="button" class="btn btn-ghost btn-sm" data-gd="reset">' + (resetArmed ? 'Click again to confirm' : 'Reset progress') + '</button></span></div></div>';
  }

  function paintHub(keepScroll) {
    if (!hubEl) return;
    var body = $('#gd-hub-body', hubEl), y = body ? body.scrollTop : 0, q = $('#gd-q', hubEl), sel = q && document.activeElement === q ? [q.selectionStart, q.selectionEnd] : null;
    hubEl.innerHTML = hubHTML();
    var nb = $('#gd-hub-body', hubEl); if (nb && keepScroll) nb.scrollTop = y;
    if (sel) { var nq = $('#gd-q', hubEl); nq.focus(); try { nq.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignore */ } }
  }
  function openHub(tab) {
    closeTour(true);
    if (introEl) return;
    if (hubEl) { closeHub(); return; }
    var r = curRoute(); hubPortal = M.portals[r.portal] ? r.portal : 'hotel';
    hubTab = tab || 'now'; hubQuery = ''; resetArmed = false;
    hubEl = document.createElement('div'); hubEl.className = 'gd-hub-wrap'; hubEl.opener = document.activeElement;
    document.body.appendChild(hubEl); lockApp(true); paintHub();
    var x = $('.gd-hub-close', hubEl); if (x) x.focus();
  }
  function closeHub(silent) {
    if (!hubEl) return;
    var el = hubEl, op = el.opener; hubEl = null; el.remove(); lockApp(false); clearTimeout(resetTimer);
    if (!silent) { var b = op && document.body.contains(op) ? op : $('#guide-btn'); try { b.focus(); } catch (e) { /* ignore */ } }
  }
  function onHubClick(e) {
    var b = e.target.closest('[data-gd]'); if (!b || !hubEl || !hubEl.contains(b)) return;
    var a = b.getAttribute('data-gd'), k = b.getAttribute('data-k');
    if (a === 'hub-close') closeHub();
    else if (a === 'tab') { hubTab = b.getAttribute('data-t'); paintHub(); }
    else if (a === 'pill') { hubPortal = b.getAttribute('data-p'); paintHub(); }
    else if (a === 'toggle') { hubOpen[k] = !hubOpen[k]; paintHub(true); var t = $('[data-k="' + k + '"]', hubEl); if (t) t.focus(); }
    else if (a === 'play') goModule(k, true);
    else if (a === 'open') { closeHub(true); location.hash = '#/' + k; }
    else if (a === 'auto') { st.off = !st.off; save(); paintHub(true); $('#gd-auto', hubEl).focus(); }
    else if (a === 'replay-intro') { closeHub(true); openIntro(); }
    else if (a === 'reset') {
      if (!resetArmed) { resetArmed = true; paintHub(true); resetTimer = setTimeout(function () { resetArmed = false; paintHub(true); }, 3500); return; }
      st = { intro: true, off: false, done: false, seen: {} }; save(); resetArmed = false; hubOpen = {}; renderButton(); paintHub(true);
      M.toast && M.toast.info('Guide progress reset', 'Each module will show its tour again the first time you open it.');
    }
  }

  /* ======================= Global events ======================= */
  function onIntroClick(e) {
    var b = e.target.closest('[data-gd]'); if (!b || !introEl || !introEl.contains(b)) return;
    var a = b.getAttribute('data-gd');
    if (a === 'intro-next') showSlide(slide + 1);
    else if (a === 'intro-back') showSlide(slide - 1);
    else if (a === 'intro-to') showSlide(+b.getAttribute('data-i'));
    else if (a === 'intro-skip') closeIntro(function () { renderButton(); maybeAuto(); });
    else if (a === 'intro-go') introFinish(true);
    else if (a === 'intro-self') introFinish(false);
  }
  function onKey(e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    if (introEl) {
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); showSlide(slide + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); showSlide(slide - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeIntro(function () { renderButton(); maybeAuto(); }); }
      else trap(introEl, e);
      return;
    }
    if (tour) {
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); showStep(tour.i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); showStep(tour.i - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeTour(); }
      else trap(tour.coach, e);
      return;
    }
    if (hubEl) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeHub(); }
      else trap($('.gd-hub', hubEl), e);
      return;
    }
    if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openHub('now'); }
  }
  function onHash() {
    if (tour) closeTour(true);
    if (hubEl) closeHub(true);
    renderButton();
    if (forceTimer && curKey() !== forceKey) { clearTimeout(forceTimer); forceTimer = null; }
    if (pending && curKey() === pending) { var k = pending; pending = null; clearTimeout(autoTimer); forceKey = k; forceTimer = setTimeout(function () { forceTimer = null; startTour(k, { auto: false }); }, 700); return; }
    pending = null; maybeAuto();
  }

  /* Public API (also used by tests) */
  G.open = openHub; G.intro = openIntro; G.start = function (k) { goModule(k || curKey(), true); };
  G.reset = function () { st = { intro: false, off: false, done: false, seen: {} }; save(); renderButton(); };

  function init() {
    load();
    var b = $('#guide-btn'); if (b) b.addEventListener('click', function () { openHub('now'); });
    document.addEventListener('click', function (e) { if (introEl) onIntroClick(e); else if (hubEl) onHubClick(e); }, false);
    global.addEventListener('keydown', onKey, true);
    global.addEventListener('hashchange', onHash);
    document.addEventListener('input', function (e) { if (hubEl && e.target && e.target.id === 'gd-q') { hubQuery = e.target.value; paintHub(true); } });
    if (M.actions && M.actions.on) M.actions.on('guide-open', function () { var p = $('#user-panel'); if (p && !p.hidden) { var bt = $('#user-btn'); p.hidden = true; if (bt) bt.setAttribute('aria-expanded', 'false'); } openHub('atlas'); });
    renderButton();
    /* Automated browsers (Playwright/Selenium regression suites) would otherwise be blocked by the first-visit intro;
       add ?guide=on to the URL to exercise the guide under automation. People are never affected. */
    suppressed = !!(navigator.webdriver && !/[?&]guide=on\b/.test(location.search));
    if (suppressed) return;
    if (!st.intro) openIntro(); else maybeAuto();
  }
  /* This file is loaded after app.js, so its DOMContentLoaded handler runs after the app has drawn the first page */
  document.addEventListener('DOMContentLoaded', init);
})(window);
