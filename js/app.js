/* Msafiri — application shell: sidebar, top bar, menus, search, hash router.
   Pages register themselves on Msafiri.pages['<portal>/<id>'] = { title?, render(ctx), mount?(root, ctx) } */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});
  var esc = M.esc, icon = M.icon, UI = M.UI;

  M.pages = M.pages || {};
  M.templates = M.templates || {};
  M.state = { portal: 'hotel', id: 'dashboard', read: {}, firstRender: true };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var appEl, sidebarEl, contentEl;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Sidebar ---------- */
  function renderSidebar() {
    var p = M.state.portal, cur = M.state.id;
    /* Stage 8.2: "OpenAPI & Sandbox" redirects into the Developer module's sandbox section; keep the item the person clicked highlighted, not its neighbour */
    if (p === 'admin' && cur === 'developer' && parse().sub === 'sandbox') cur = 'sandbox';
    var prev = $('.sidebar-nav', sidebarEl); var scroll = prev ? prev.scrollTop : 0;

    var portalTabs = M.portalOrder.map(function (id) {
      var po = M.portals[id];
      return '<button type="button" class="portal-tab" data-action="switch-portal" data-portal="' + id + '" aria-pressed="' + (id === p) + '" title="' + esc(po.label) + '">' +
        icon(po.icon) + '<span>' + esc(po.label) + '</span><span class="portal-dot" aria-hidden="true"></span></button>';
    }).join('');

    var groups = M.nav[p].map(function (g) {
      return '<div class="nav-group" role="group" aria-label="' + esc(g.group) + '"><div class="nav-group-title">' + esc(g.group) + '</div>' + g.items.map(function (it) {
        var live = !!M.pages[p + '/' + it.id];
        return '<a class="nav-item" href="#/' + p + '/' + it.id + '"' + (it.id === cur ? ' aria-current="page"' : '') + ' title="' + esc(it.label) + '">' +
          icon(it.icon) + '<span class="nav-label">' + esc(it.label) + '</span>' +
          (it.count ? '<span class="nav-count" aria-label="' + it.count + ' items">' + it.count + '</span>' : '') +
          (!live ? '<span class="nav-soon" title="Planned module — not part of this build">Soon</span>' : (M.dir && M.dir.denied(p, it.id) ? '<span class="nav-soon" title="Not permitted for the acting demo user">No access</span>' : '')) + '</a>';
      }).join('') + '</div>';
    }).join('');

    sidebarEl.innerHTML =
      '<a class="brand" href="#/' + p + '/dashboard" aria-label="Msafiri home"><span class="brand-mark" aria-hidden="true">M</span><span class="brand-text"><span class="brand-name">Msafiri</span><span class="brand-sub">National Guest Registration</span></span></a>' +
      '<div class="portal-switch"><div class="portal-switch-label" id="portal-label">Portal (demo role)</div><div class="portal-tabs" role="group" aria-labelledby="portal-label">' + portalTabs + '</div></div>' +
      '<nav class="sidebar-nav" aria-label="' + esc(M.portals[p].label) + ' navigation">' + groups + '</nav>' +
      '<div class="sidebar-foot"><strong>Demonstration prototype</strong><br>Synthetic data only. No government systems are connected.</div>';

    var nav = $('.sidebar-nav', sidebarEl); if (nav) nav.scrollTop = scroll;
  }

  /* ---------- Top bar ---------- */
  function renderTopbar(title) {
    var p = M.state.portal, user = M.demo.users[p];
    $('#tb-eyebrow').textContent = M.portals[p].label;
    $('#page-title').textContent = title;
    $('#user-btn-inner').innerHTML = UI.avatar(user.initials, { orange: p === 'gov' }) + '<span class="user-meta"><span class="n">' + esc(user.name) + '</span><span class="r">' + esc(user.role) + '</span></span>' + icon('chevron-down', { size: 16 });
    renderNotifications();
    renderUserMenu();
  }

  function unreadCount() {
    var p = M.state.portal, read = M.state.read[p] || {};
    return M.demo.notifications[p].filter(function (n) { return n.store ? n.unread : n.unread && !read[n.id]; }).length;
  }
  function renderNotifications() {
    var p = M.state.portal, read = M.state.read[p] || {}, c = unreadCount();
    var badge = $('#notif-count');
    badge.textContent = c; badge.hidden = c === 0;
    $('#notif-btn').setAttribute('aria-label', 'Notifications' + (c ? ', ' + c + ' unread' : ', none unread'));
    var list = M.demo.notifications[p];
    $('#notif-panel').innerHTML =
      '<div class="dd-head"><h2>Notifications</h2>' + (c ? '<button type="button" class="btn btn-ghost btn-sm" data-action="mark-all-read">Mark all as read</button>' : '<span class="muted" style="font-size:var(--fs-xs)">All caught up</span>') + '</div>' +
      (list.length ? '<div class="dd-list">' + list.map(function (n) {
        var un = n.store ? n.unread : n.unread && !read[n.id];
        return '<button type="button" class="dd-item' + (un ? ' unread' : '') + '" data-action="open-notification" data-id="' + n.id + '" data-route="' + n.route + '"><span class="dd-ico ' + n.tone + '">' + icon(n.icon, { size: 18 }) + '</span><span><span class="t">' + esc(n.title) + '</span><span class="s" style="display:block">' + esc(n.sub) + '</span></span></button>';
      }).join('') + '</div>' : '<div class="dd-empty">No notifications</div>') +
      '<div class="menu-section"><div class="hint" style="padding:6px 12px">Demonstration notifications — generated locally.</div></div>';
  }

  function renderUserMenu() {
    var p = M.state.portal, user = M.demo.users[p];
    $('#user-panel').innerHTML =
      '<div class="menu-section" style="display:flex;gap:12px;align-items:center;padding:14px">' + UI.avatar(user.initials, { orange: p === 'gov' }) + '<div><div style="font-weight:700;font-size:var(--fs-sm)">' + esc(user.name) + '</div><div class="hint">' + esc(user.org) + '</div></div></div>' +
      '<div class="menu-section" role="group" aria-label="Switch demo role"><div class="menu-label">Switch demo role</div>' + M.portalOrder.map(function (id) {
        return '<button type="button" role="menuitemradio" class="menu-item" aria-checked="' + (id === p) + '" data-action="switch-portal" data-portal="' + id + '">' + icon(M.portals[id].icon) + esc(M.portals[id].label) + '</button>';
      }).join('') + '</div>' +
      '<div class="menu-section" role="group" aria-label="Acting as (demo user)"><div class="menu-label">Acting as (demo user)</div>' + M.dir.eligible(p).map(function (u) {
        var r = M.dir.role(u.role), ok = u.status === 'Active';
        return '<button type="button" role="menuitemradio" class="menu-item" aria-checked="' + (u.id === user.userId) + '"' + (ok ? '' : ' disabled') + ' data-action="act-as" data-user="' + u.id + '"><span>' + esc(u.name) + '<br><span class="hint">' + esc(r ? r.name : '') + (ok ? '' : ' · ' + esc(u.status)) + '</span></span></button>';
      }).join('') + '<div class="hint" style="padding:4px 12px">Permissions follow the user’s assigned role. Demonstration only.</div></div>' +
      '<div class="menu-section"><button type="button" role="menuitem" class="menu-item" data-action="guide-open">' + icon('help') + '<span>Guide Me<br><span class="hint">Replay tours · every module’s logic</span></span></button>' +
      '<button type="button" role="menuitem" class="menu-item" data-action="show-shortcuts">' + icon('keyboard') + 'Keyboard shortcuts</button>' +
      '<button type="button" role="menuitem" class="menu-item" data-action="reset-demo">' + icon('refresh') + 'Reset demo data</button>' +
      '<button type="button" role="menuitem" class="menu-item" data-action="sign-out">' + icon('log-out') + '<span>Sign out<br><span class="hint">Not available in prototype</span></span></button></div>';
  }

  /* ---------- Dropdown handling ---------- */
  var openDD = null;
  function toggleDD(btnId, panelId, force) {
    var btn = $('#' + btnId), panel = $('#' + panelId);
    var open = force !== undefined ? force : panel.hidden;
    closeDD();
    if (open) {
      panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); openDD = { btn: btn, panel: panel };
      var first = panel.querySelector('button'); if (first) first.focus();
    }
  }
  function closeDD(returnFocus) {
    if (!openDD) return;
    openDD.panel.hidden = true; openDD.btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) openDD.btn.focus();
    openDD = null;
  }
  document.addEventListener('click', function (e) {
    if (openDD && !e.target.closest('.dropdown-anchor')) closeDD();
    if (!e.target.closest('.gsearch')) hideSearch();
  });

  /* ---------- Global search / quick navigation ---------- */
  var sIdx = -1, sResults = [];
  function hideSearch() { var r = $('#gsearch-results'); if (r) r.hidden = true; $('#gsearch').setAttribute('aria-expanded', 'false'); sIdx = -1; }
  function runSearch(q) {
    var box = $('#gsearch-results');
    q = q.trim().toLowerCase();
    if (!q) return hideSearch();
    /* Stage 8.6 (L3): also match the page description (e.g. "webhook" finds the Developer Portal); label/group/portal matches are listed first */
    var head = function (r) { return (r.item.label + ' ' + r.group + ' ' + M.portals[r.portal].label).toLowerCase().indexOf(q) > -1; };
    var all = M.allItems(), byHead = all.filter(head);
    sResults = byHead.concat(all.filter(function (r) { return !head(r) && String(r.item.desc || '').toLowerCase().indexOf(q) > -1; })).slice(0, 8);
    box.innerHTML = sResults.length ? sResults.map(function (r, i) {
      return '<a class="dd-item" role="option" id="sr-' + i + '" href="' + r.route + '"><span class="dd-ico">' + icon(r.item.icon, { size: 18 }) + '</span><span><span class="t">' + esc(r.item.label) + '</span><span class="s" style="display:block">' + esc(M.portals[r.portal].label) + ' · ' + esc(r.group) + '</span></span></a>';
    }).join('') : '<div class="dd-empty">No pages match “' + esc(q) + '”</div>';
    box.hidden = false; $('#gsearch').setAttribute('aria-expanded', 'true'); sIdx = -1;
  }
  function markSearch() {
    sResults.forEach(function (_, i) { var el = $('#sr-' + i); if (el) el.classList.toggle('active', i === sIdx); });
    $('#gsearch').setAttribute('aria-activedescendant', sIdx > -1 ? 'sr-' + sIdx : '');
  }

  /* ---------- Drawer (mobile/tablet) ---------- */
  function setDrawer(open) {
    appEl.classList.toggle('sidebar-open', open);
    $('#btn-menu').setAttribute('aria-expanded', open);
    if (open) { var f = $('.nav-item[aria-current="page"]', sidebarEl) || $('.nav-item', sidebarEl); if (f) f.focus(); }
  }
  function setCollapsed(c) {
    appEl.classList.toggle('sidebar-collapsed', c);
    var b = $('#btn-collapse');
    b.setAttribute('aria-pressed', c);
    b.setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar');
    b.innerHTML = icon(c ? 'chevrons-right' : 'chevrons-left');
    store('msafiri.collapsed', c ? '1' : '0');
  }

  /* ---------- Templates ---------- */
  /* Final gap-closure: where the capability behind each placeholder menu item already works in this prototype (links only; taken from the decision register's evidence column; whether these pages get built is still decision P1-P6). */
  var PLANNED_TODAY = {
    'hotel/check-in': [['Guest Registration (check-in is completed here)', '#/hotel/new-registration'], ['Registrations (Start check-in on an Expected record)', '#/hotel/registrations']],
    'hotel/in-house': [['Registrations (records with stay status “Checked in”)', '#/hotel/registrations'], ['Hotel dashboard (in-house count)', '#/hotel/dashboard']],
    'hotel/stay-changes': [['Registrations (open a record to Check out, Amend or Cancel)', '#/hotel/registrations'], ['Submission Status & History (simulated resubmission outcomes)', '#/hotel/submissions']],
    'hotel/pms': [['Guest Registration (simulated “Fetch from demo PMS” and manual entry)', '#/hotel/new-registration'], ['Offline Queue & Sync (simulated offline mode)', '#/hotel/offline-queue']],
    'hotel/compliance': [['Submission Status & History (simulated statuses)', '#/hotel/submissions'], ['Hotel dashboard (counts from the same synthetic records)', '#/hotel/dashboard']],
    'admin/connectors': [['Integration Dashboard (simulated integration status)', '#/admin/pms-health'], ['Integration Event History (simulated events)', '#/admin/integration-events']]
  };
  M.templates.planned = function (ctx) {
    var home = '#/' + ctx.portal + '/dashboard', alt = PLANNED_TODAY[ctx.portal + '/' + ctx.id];
    var today = alt ? UI.card({ title: 'Where this works in the prototype today', subtitle: 'Existing simulated screens that cover part of this area', body:
      '<ul class="plain-list">' + alt.map(function (a) { return '<li><a href="' + a[1] + '">' + esc(a[0]) + '</a></li>'; }).join('') + '</ul>',
      foot: 'Whether this page is built, merged into another page or removed is an open stakeholder decision. Nothing here is a real integration.' }) : '';
    return UI.pageHead({
      crumbs: [{ label: M.portals[ctx.portal].label, href: home }, { label: ctx.group }, { label: ctx.item.label }],
      description: esc(ctx.item.desc),
      actions: UI.button({ label: 'Back to dashboard', variant: 'secondary', href: home, icon: 'grid' })
    }) +
    '<div class="stack">' + UI.alert('orange', 'Planned module.', 'This screen is a placeholder and is not built in this prototype. Its scope has not been decided; it is shown in the navigation so the structure can be reviewed.') + today +
    (alt ? '' : UI.card({ title: ctx.item.label, subtitle: 'Placeholder using the standard page template', body:
      '<div class="grid cols-2"><div class="wire"><div class="bar" style="width:55%"></div><div class="bar" style="width:80%"></div><div class="bar" style="width:68%"></div><div class="blk"></div></div>' +
      '<div class="wire"><div class="blk"></div><div class="bar" style="width:72%"></div><div class="bar" style="width:46%"></div><div class="bar" style="width:60%"></div></div></div>',
      foot: 'Layout preview only — no content or workflow is defined here.' })) + '</div>';
  };
  M.templates.denied = function (ctx, d) {
    var me = d.user, role = me && M.dir.role(me.role), home = '#/' + ctx.portal + '/dashboard';
    return UI.pageHead({ crumbs: [{ label: M.portals[ctx.portal].label, href: home }, { label: ctx.group }, { label: ctx.item.label }], description: esc(ctx.item.desc) }) +
      '<div class="stack">' + UI.alert('warning', d.reason === 'account' ? 'This demo account is not active.' : 'Not permitted for this demo role.',
        d.reason === 'account' ? esc(me ? me.name : 'The acting user') + ' has status “' + esc(me ? me.status : 'unknown') + '”, so every permission is withheld. Choose another account under “Acting as” in the user menu.'
          : esc(me.name) + ' (' + esc(role ? role.name : 'no role') + ') does not hold <strong>' + esc(M.dir.permLabel(d.perm)) + '</strong>. Choose another account under “Acting as” in the user menu, or change the role’s permissions in System Administration.') +
      UI.card({ body: UI.empty({ icon: 'lock', title: 'Access not granted', body: 'Demonstration of least-privilege behaviour. This is a frontend check only and is NOT production security — real enforcement must happen on the server.', actions: UI.button({ label: 'Back to dashboard', variant: 'primary', href: home }) }) }) + '</div>';
  };
  M.templates.notFound = function (ctx) {
    return UI.card({ body: UI.empty({ icon: 'search', title: 'Page not found', body: 'That address does not exist in this prototype.', actions: UI.button({ label: 'Go to dashboard', variant: 'primary', href: '#/' + ctx.portal + '/dashboard' }) }) });
  };

  /* ---------- Router ---------- */
  function parse() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    return { portal: parts[0], id: parts[1] || 'dashboard', sub: parts[2] || '', sub2: parts[3] || '' };
  }
  var softNext = false;
  function route() {
    var soft = softNext; softNext = false; /* Stage 8.2: a soft refresh re-draws the SAME page after shared demo state changed */
    var keep = null;
    if (soft) {
      var ae = document.activeElement, sy = window.scrollY;
      keep = { y: sy, tkey: ae && ae.getAttribute && ae.getAttribute('data-tkey'), a: ae && ae.selectionStart, b: ae && ae.selectionEnd };
    } else { M.tableState = {}; }
    var r = parse();
    if (!M.portals[r.portal]) { location.replace('#/hotel/dashboard'); return; }
    M.modal.close(true); closeDD(); hideSearch(); setDrawer(false);
    M.state.portal = r.portal; M.state.id = r.id;
    var found = M.findItem(r.portal, r.id);
    var page = M.pages[r.portal + '/' + r.id];
    var ctx = { portal: r.portal, id: r.id, sub: r.sub, sub2: r.sub2, item: found && found.item, group: found && found.group, user: M.demo.users[r.portal] };
    var title = found ? found.item.label : 'Page not found';
    if (page && page.title) title = typeof page.title === 'function' ? page.title(ctx) : page.title;

    var denied = found && page && M.dir && M.dir.denied(r.portal, r.id);
    if (denied) title = found.item.label;
    contentEl.innerHTML = !found ? M.templates.notFound(ctx) : denied ? M.templates.denied(ctx, denied) : page ? page.render(ctx) : M.templates.planned(ctx);
    renderSidebar(); renderTopbar(title);
    document.title = title + ' · Msafiri (prototype)';
    M._keepTables = soft;
    try { if (found && page && page.mount && !denied) page.mount(contentEl, ctx); } finally { M._keepTables = false; }
    M.syncScroll(contentEl); /* Stage 8.1: keyboard access + edge cue for scrollable tables */
    if (soft) {
      /* keep the reader where they were: same scroll position, and keep typing in a table search box */
      window.scrollTo(0, keep.y);
      if (keep.tkey) {
        var inp = Array.prototype.filter.call(contentEl.querySelectorAll('input[data-tkey]'), function (n) { return n.getAttribute('data-tkey') === keep.tkey; })[0];
        if (inp) { inp.focus({ preventScroll: true }); try { inp.setSelectionRange(keep.a, keep.b); } catch (e) { /* type=search may not allow */ } }
      }
    } else {
      window.scrollTo(0, 0);
      if (!M.state.firstRender) $('#page-title').focus({ preventScroll: true });
    }
    M.state.firstRender = false;
  }
  M.rerender = route;
  M.softRerender = function () { softNext = true; route(); };
  /* Stage 8.2: delayed callbacks (simulated scan, simulated search) call this to know the person is still on the page that started them,
     so a late callback never redraws — and wipes the form or filters of — a different page. */
  M.onRoute = function (hash) { return location.hash === hash; };
  M.refreshSidebar = renderSidebar;
  M.refreshBell = renderNotifications; /* Stage 6.4: lets page-level read/unread changes update the top-bar bell */

  /* ---------- Actions ---------- */
  function initActions() {
    M.actions.init();
    var A = M.actions;
    A.on('switch-portal', function (el) { closeDD(); location.hash = '#/' + el.getAttribute('data-portal') + '/dashboard'; });
    A.on('mark-all-read', function () {
      var p = M.state.portal; M.state.read[p] = M.state.read[p] || {};
      M.demo.notifications[p].forEach(function (n) { M.state.read[p][n.id] = true; }); if (p === 'admin' && M.ops) M.ops.readAll(); if (p === 'gov' && M.notif) M.notif.readAllBell();
      renderNotifications(); $('#notif-panel button').focus();
    });
    A.on('open-notification', function (el) {
      var p = M.state.portal; M.state.read[p] = M.state.read[p] || {}; M.state.read[p][el.getAttribute('data-id')] = true; if (p === 'admin' && M.ops) M.ops.setRead(el.getAttribute('data-id'), true); if (p === 'gov' && M.notif) M.notif.bellRead(el.getAttribute('data-id'));
      closeDD(); location.hash = el.getAttribute('data-route'); renderNotifications();
    });
    A.on('show-shortcuts', function () {
      closeDD();
      M.modal.open({ title: 'Keyboard shortcuts', body: '<dl class="kv"><dt><kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd></dt><dd>Quick navigation search</dd><dt><kbd>?</kbd></dt><dd>Open Guide Me (replay tours, browse every module’s logic)</dd><dt><kbd>Esc</kbd></dt><dd>Close menus, dialogs and search</dd><dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd></dt><dd>Move through and open search results</dd></dl>', actions: [{ label: 'Close', variant: 'primary' }] });
    });
    A.on('reset-demo', function () {
      closeDD();
      /* Stage 8.2: reset discards every demo change made in this tab, so it asks first */
      M.modal.confirm({ title: 'Reset demo data?', variant: 'danger', confirmLabel: 'Reset demo data', cancelLabel: 'Keep my changes',
        body: '<p>This discards every change made in this browser tab (registrations, users, roles, settings, notifications, simulated submissions) and restores the original synthetic data. It cannot be undone.</p>',
        onConfirm: function () {
          M.state.read = {}; store('msafiri.collapsed', '0'); setCollapsed(false);
          if (M.resetHandlers) M.resetHandlers.forEach(function (fn) { fn(); });
          route(); M.toast.success('Demo data reset', 'Notifications and demo changes restored.');
        } });
    });
    A.on('act-as', function (el) { var p = M.state.portal; closeDD(); M.dir.actAs(p, el.getAttribute('data-user')); route(); M.toast.info('Now acting as ' + M.demo.users[p].name, M.demo.users[p].role + ' (demo permissions)'); });
    A.on('sign-out', function () { closeDD(); M.unavailable('Sign out'); });
    A.on('unavailable', function (el) { M.unavailable(el.getAttribute('data-label') || undefined); });
    A.on('go', function (el) { location.hash = el.getAttribute('data-route'); });
  }

  /* ---------- Init ---------- */
  function init() {
    appEl = $('#app'); sidebarEl = $('#sidebar'); contentEl = $('#main');
    initActions();

    /* Stage 8.1: tapping the link for the page already open does not fire hashchange, so close the mobile drawer explicitly */
    sidebarEl.addEventListener('click', function (e) { if (e.target.closest('a.nav-item')) setDrawer(false); });
    $('#btn-menu').addEventListener('click', function () { setDrawer(!appEl.classList.contains('sidebar-open')); });
    $('#scrim').addEventListener('click', function () { setDrawer(false); $('#btn-menu').focus(); });
    $('#btn-collapse').addEventListener('click', function () { setCollapsed(!appEl.classList.contains('sidebar-collapsed')); });
    setCollapsed(store('msafiri.collapsed') === '1');

    $('#notif-btn').addEventListener('click', function () { toggleDD('notif-btn', 'notif-panel'); });
    $('#user-btn').addEventListener('click', function () { toggleDD('user-btn', 'user-panel'); });

    var gs = $('#gsearch');
    gs.addEventListener('input', function () { runSearch(gs.value); });
    gs.addEventListener('focus', function () { if (gs.value) runSearch(gs.value); });
    gs.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sIdx = Math.min(sIdx + 1, sResults.length - 1); markSearch(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sIdx = Math.max(sIdx - 1, 0); markSearch(); }
      else if (e.key === 'Enter') { var t = sResults[sIdx > -1 ? sIdx : 0]; if (t) { location.hash = t.route; gs.value = ''; gs.blur(); } }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (openDD) { closeDD(true); return; }
        if ($('#gsearch-results') && !$('#gsearch-results').hidden) { hideSearch(); gs.blur(); return; }
        if (appEl.classList.contains('sidebar-open')) { setDrawer(false); $('#btn-menu').focus(); }
        return;
      }
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        if (getComputedStyle($('.gsearch')).display !== 'none') gs.focus();
      }
    });
    /* Arrow-key navigation inside open menus */
    document.addEventListener('keydown', function (e) {
      if (!openDD || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      var items = Array.prototype.slice.call(openDD.panel.querySelectorAll('button:not([disabled])'));
      var i = items.indexOf(document.activeElement);
      if (!items.length) return; e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    });

    var rsz; window.addEventListener('resize', function () { if (window.innerWidth > 1024) setDrawer(false); clearTimeout(rsz); rsz = setTimeout(function () { M.syncScroll(document); }, 120); });
    window.addEventListener('hashchange', route);
    if (!location.hash) location.replace('#/hotel/dashboard');
    route();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
