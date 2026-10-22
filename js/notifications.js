/* Msafiri — Stage 6.3: Notifications & reporting alerts (SYNTHETIC / SIMULATED).
   There is NO second notification system. Alerts are generated locally from existing prototype state (reports from Msafiri.reporting,
   integrations from Msafiri.integ, webhook deliveries from Msafiri.webhooks) and fed into the Stage 4B store (Msafiri.ops.notes / O.nst)
   through O.sources, so the Admin bell, the Admin "Notifications & Operations" page and this page share one read/unread state.
   This module adds: route #/gov/notifications ("Reporting Alerts", guard reports:read) with filters, search, details, read/unread and mark-all.
   Nothing is sent: no e-mail, SMS, push or API request; no background worker. URS v2.0 was not available to the build, so every category,
   severity and wording here is ILLUSTRATIVE — no statutory deadline, legal obligation or official alert rule is defined. No guest data is used. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, R = M.dir, O = M.ops, Rp = M.reporting, I = M.integ, A = M.actions, DAY = 864e5;
  var N = M.notif = {};
  var SCOPE = ['validation', 'review', 'export', 'pms', 'webhook'];
  var CATL = { validation: 'Report validation', review: 'Ready for review', export: 'Preparation / export', pms: 'Integration', webhook: 'Webhook delivery' };
  var ICON = { validation: 'flag', review: 'clipboard', export: 'download', pms: 'activity', webhook: 'send' };
  var SEVS = ['Critical', 'High', 'Medium', 'Low'];
  var TONE = { Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'info' };
  var fails = [], fseq = 0, view = { q: '', cat: '', sev: '', rd: '' }, root = null;
  N.SCOPE = SCOPE; N.CATL = CATL;

  function reset() { fails = []; fseq = 0; view = { q: '', cat: '', sev: '', rd: '' }; }
  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(reset);

  /* ---------- export failures are recorded from the real Stage 6.2 export path (permission refusals are not failures) ---------- */
  var origExport = Rp.exportReport;
  Rp.exportReport = function (id) {
    var res = origExport.apply(this, arguments);
    if (res && !res.ok && (res.why === 'error' || res.why === 'missing')) { fails.push({ id: id, n: ++fseq, ts: Date.now(), msg: res.message || 'The report no longer exists.' }); sync(); }
    return res;
  };

  /* ---------- generators (read-only views of existing state; no guest personal data) ---------- */
  function reportAlerts() {
    var rows = Rp.rows(), out = [], p = 'Illustrative alert from a synthetic sample report — no official rule or deadline is implied. ';
    function base(r, kind, cat, sev, title, detail) {
      var id = 'N-RPT-' + kind + '-' + r.id;
      return { id: id, cat: cat, sev: sev, status: 'Open', ts: r.ts, est: r.estId, title: title + ': ' + r.estName, detail: detail, route: '#/gov/reports/' + r.id, rel: r.id, sim: true };
    }
    rows.filter(function (r) { return r.status === 'Rejected'; }).slice(0, 3).forEach(function (r) {
      out.push(base(r, 'VAL', 'validation', 'High', 'Report validation failed (simulated)', r.id + ': ' + r.errors + ' of ' + r.records + ' sample records have illustrative validation errors. ' + p));
    });
    rows.filter(function (r) { return r.status === 'Pending' && !r.live; }).slice(0, 3).forEach(function (r) {
      out.push(base(r, 'REV', 'review', 'Low', 'Report ready for review (simulated)', r.id + ' is prepared and waiting for review; nothing has been sent. ' + p));
    });
    rows.filter(function (r) { return r.status === 'Draft' && Date.parse(r.end + 'T00:00:00Z') < Date.now() - 14 * DAY; }).slice(0, 2).forEach(function (r) {
      out.push(base(r, 'PREP', 'export', 'Medium', 'Report preparation not completed (illustrative)', r.id + ' is still a Draft for a period that ended more than 14 days ago (illustrative threshold, not a rule).'));
    });
    var ok = rows.filter(function (r) { return r.status === 'Acknowledged' && !r.live; })[0];
    if (ok) out.push(base(ok, 'EXP', 'export', 'Medium', 'Report export failed (simulated sample)', ok.id + ': a simulated CSV export did not complete. Fixed illustrative example; real export failures in this session are listed separately. Nothing was sent anywhere.'));
    fails.forEach(function (f) {
      var r = Rp.one(f.id), id = 'N-RPT-EXPF-' + f.n;
      out.push({ id: id, cat: 'export', sev: 'High', status: 'Open', ts: f.ts, est: r ? r.estId : '', title: 'Report export failed: ' + (r ? r.estName : f.id), detail: f.id + ': ' + f.msg + ' Nothing was sent anywhere.', route: r ? '#/gov/reports/' + f.id : '', rel: f.id, sim: true });
    });
    return out;
  }
  function integrationAlerts() {
    var seen = O.seedN.map(function (n) { return n.route; });      /* seeded N-002 already covers INT-1002 */
    return (I.recs || []).filter(function (r) { return r.enabled && r.status !== 'Connected' && seen.indexOf('#/admin/pms-health/' + r.id) < 0; }).map(function (r) {
      var est = R.est(r.estId), dis = r.status === 'Disconnected', id = 'N-INT-' + r.id + '-' + r.status;
      return { id: id, cat: 'pms', sev: dis ? 'High' : 'Medium', status: 'Open', ts: r.errTs || r.hcTs, est: r.estId, sim: true,
        title: (dis ? 'Integration connection failure (simulated): ' : 'Integration degraded (simulated): ') + (est ? est.name : r.estId),
        detail: r.provider + ' (' + r.id + ') is ' + r.status.toLowerCase() + '. ' + (r.err ? r.err + ' ' : '') + 'May delay data used for report preparation (illustrative).', route: '#/admin/pms-health/' + r.id, rel: r.id };
    });
  }
  function webhookAlerts() {
    var st = M.webhooks && M.webhooks.state && M.webhooks.state(); if (!st) return [];
    return st.hooks.map(function (h) {
      var l = st.dels.filter(function (d) { return d.hid === h.id; }).sort(function (a, b) { return b.seq - a.seq; })[0];
      if (!l || l.ok) return null;
      var id = 'N-WHK-' + h.id + '-' + l.id;
      return { id: id, cat: 'webhook', sev: 'Medium', status: 'Open', ts: l.ts, est: '', sim: true, title: 'Webhook delivery failed (simulated): ' + h.name,
        detail: l.id + ' · ' + l.event + ' · ' + (l.status == null ? 'no response' : l.status + ' ' + l.text) + '. Simulated attempt — nothing was sent anywhere.', route: '#/admin/developer/webhooks/' + h.id, rel: h.id };
    }).filter(Boolean);
  }
  [reportAlerts, integrationAlerts, webhookAlerts].forEach(function (fn) { O.sources.push(fn); });

  /* ---------- helpers ---------- */
  function scoped() { return O.notes().filter(function (n) { return SCOPE.indexOf(n.cat) > -1 && n.status !== 'Resolved'; }); }
  function unread() { return scoped().filter(function (n) { return !n.read; }).length; }
  function sync() { if (M.refreshSidebar) M.refreshSidebar(); }
  /* live badge on the sidebar item */
  var nav = M.findItem('gov', 'notifications'); if (nav) Object.defineProperty(nav.item, 'count', { configurable: true, enumerable: true, get: unread });

  /* Government top-bar bell: the Stage 1-3 static items plus these store-backed alerts (store state is the single source of truth) */
  var D = M.demo, staticGov = D.notifications.gov;
  Object.defineProperty(D.notifications, 'gov', { configurable: true, get: function () {
    return staticGov.concat(scoped().filter(function (n) { return O.cfg['notify.' + n.cat] !== false; }).map(function (n) {
      return { id: n.id, icon: ICON[n.cat] || 'bell', tone: n.sev === 'High' || n.sev === 'Critical' ? 'danger' : n.sev === 'Medium' ? 'warning' : '', title: n.title, sub: n.sev + ' · Simulated · ' + R.rel(n.ts), unread: !n.read, route: N.validRoute(n) ? n.route : '#/gov/notifications', store: true };
    }));
  } });
  function repaint() { if (root && root.isConnected) paint(); }
  N.bellRead = function (id) { if (scoped().some(function (n) { return n.id === id; })) { O.setRead(id, true); repaint(); } };
  N.readAllBell = function () { scoped().forEach(function (n) { O.nst[n.id] = O.nst[n.id] || {}; O.nst[n.id].read = true; }); O.changed(); repaint(); };

  /* a route is "valid" only when its page and (where present) its record exist */
  N.validRoute = function (n) {
    var p = String(n.route || '').replace(/^#\//, '').split('/'); if (!n.route || p.length < 2) return false;
    if (!M.findItem(p[0], p[1]) || !M.pages[p[0] + '/' + p[1]]) return false;
    if (p[0] === 'gov' && p[1] === 'reports' && p[2]) return !!Rp.one(p[2]);
    if (p[0] === 'admin' && p[1] === 'pms-health' && p[2]) return !!I.rec(p[2]);
    if (p[0] === 'admin' && p[1] === 'establishments' && p[2]) return !!R.est(p[2]);
    if (p[0] === 'admin' && p[1] === 'developer' && p[2] === 'webhooks' && p[3]) return !!(M.webhooks.state().hooks.filter(function (h) { return h.id === p[3]; })[0]);
    return true;
  };
  function byId(id) { return O.notes().filter(function (n) { return n.id === id; })[0]; }
  function filtered() {
    var q = view.q.toLowerCase();
    return scoped().filter(function (n) {
      return (!view.cat || n.cat === view.cat) && (!view.sev || n.sev === view.sev) && (!view.rd || (view.rd === 'Unread') === !n.read) &&
        (!q || (n.title + ' ' + n.detail).toLowerCase().indexOf(q) > -1);
    });
  }

  /* ---------- rendering ---------- */
  function item(n) {
    var ok = N.validRoute(n), un = !n.read;
    return '<article class="na-item' + (un ? ' unread' : '') + '" data-id="' + esc(n.id) + '" aria-label="' + esc((un ? 'Unread: ' : '') + n.title) + '">' +
      '<div class="na-ico ' + (TONE[n.sev] || '') + '">' + M.icon(ICON[n.cat] || 'bell', { size: 18 }) + '</div>' +
      '<div class="na-body"><div class="na-head">' + (un ? '<span class="na-dot" role="img" aria-label="Unread"></span>' : '') + '<h3 class="na-title">' + esc(n.title) + '</h3></div>' +
      '<div class="na-badges">' + (un ? UI.badge('Unread', 'orange', { dot: false }) : UI.badge('Read', 'neutral', { dot: false })) + UI.badge(n.sev, TONE[n.sev] || 'neutral') + UI.badge(CATL[n.cat] || n.cat, 'neutral', { dot: false }) + UI.badge('Simulated', 'info', { dot: false }) + '</div>' +
      '<p class="na-msg">' + esc(n.detail) + '</p>' +
      '<div class="na-meta"><span title="' + esc(R.fmt(n.ts)) + '">' + esc(R.rel(n.ts)) + '</span>' + (n.rel ? '<span aria-hidden="true">·</span><span>Related: ' + (ok ? '<a href="' + esc(n.route) + '" data-action="na-open" data-id="' + esc(n.id) + '">' + esc(n.rel) + '</a>' : esc(n.rel) + ' (no valid page)') + '</span>' : '') + '</div></div>' +
      '<div class="na-actions">' + UI.button({ label: 'Details', size: 'sm', variant: 'secondary', action: 'na-view', data: { id: n.id } }) +
      UI.button({ label: un ? 'Mark as read' : 'Mark as unread', size: 'sm', variant: 'ghost', action: 'na-toggle', data: { id: n.id } }) +
      (ok ? UI.button({ label: 'Open', size: 'sm', variant: 'primary', action: 'na-open', data: { id: n.id } }) : '') + '</div></article>';
  }
  function stats() {
    var all = scoped(), c = function (f) { return all.filter(f).length; };
    return [{ label: 'Unread', value: c(function (n) { return !n.read; }), icon: 'bell', tone: 'orange', foot: 'of ' + all.length + ' simulated alerts' },
      { label: 'Validation failures', value: c(function (n) { return n.cat === 'validation'; }), icon: 'flag', tone: 'red', foot: 'illustrative' },
      { label: 'Ready for review', value: c(function (n) { return n.cat === 'review'; }), icon: 'clipboard', foot: 'simulated' },
      { label: 'Integration & webhook issues', value: c(function (n) { return n.cat === 'pms' || n.cat === 'webhook'; }), icon: 'activity', foot: 'simulated' }].map(UI.statCard).join('');
  }
  function paint() {
    if (!root) return;
    var all = scoped(), list = filtered(), host = root.querySelector('#na-list'); if (!host) return;
    root.querySelector('#na-stats').innerHTML = stats();
    root.querySelector('#na-count').textContent = list.length === all.length ? 'Showing all ' + all.length + ' alerts' : 'Showing ' + list.length + ' of ' + all.length + ' alerts';
    var ra = root.querySelector('#na-readall'); if (ra) ra.disabled = !unread();
    host.innerHTML = !all.length ? UI.empty({ icon: 'bell', title: 'No simulated alerts', body: 'There are no reporting or integration alerts in the current demo data. Reset demo data to restore the samples.' })
      : !list.length ? UI.empty({ icon: 'search', title: 'No alerts match', body: 'Try a different search or clear the filters.', actions: UI.button({ label: 'Reset filters', variant: 'secondary', action: 'na-reset' }) })
      : list.map(item).join('');
  }
  function opts(list, label) { return '<option value="">' + esc(label) + ': All</option>' + list.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join(''); }
  function render() {
    return UI.pageHead({ crumbs: [{ label: 'Government Portal', href: '#/gov/dashboard' }, { label: 'Reporting Alerts' }], title: 'Reporting alerts & notifications',
      description: 'Simulated alerts about report validation, review, preparation/export and integration events that affect reporting.',
      actions: '<button type="button" class="btn btn-secondary" id="na-readall" data-action="na-readall" title="Marks the alerts listed on this page as read. Other top-bar notification items are cleared from the bell itself.">' + M.icon('check') + 'Mark all alerts as read</button>' }) +
      '<div class="stack">' + UI.alert('orange', 'Simulated alerts only.', 'Generated locally from synthetic prototype data. No e-mail, SMS, push notification or API request is sent, and there is no background delivery. Categories, severities and thresholds are illustrative: the URS was not available to this build, so no statutory deadline, legal obligation or official alert rule is implied.') +
      '<div class="grid cols-4" id="na-stats"></div>' +
      UI.card({ body: '<form class="na-filters" id="na-form" role="search" aria-label="Filter notifications" onsubmit="return false">' +
        '<div class="field na-q"><label for="na-search">Search title or message</label><input class="input" id="na-search" type="search" placeholder="Search alerts…" autocomplete="off" value="' + esc(view.q) + '"></div>' +
        '<div class="field"><label for="na-cat">Category</label><select class="select" id="na-cat">' + opts(SCOPE.map(function (c) { return [c, CATL[c]]; }), 'Category') + '</select></div>' +
        '<div class="field"><label for="na-sev">Severity</label><select class="select" id="na-sev">' + opts(SEVS.map(function (s) { return [s, s]; }), 'Severity') + '</select></div>' +
        '<div class="field"><label for="na-rd">Status</label><select class="select" id="na-rd">' + opts([['Unread', 'Unread'], ['Read', 'Read']], 'Status') + '</select></div>' +
        '<div class="field na-reset"><button type="button" class="btn btn-ghost" data-action="na-reset">Reset filters</button></div></form>' }) +
      '<div class="na-count" id="na-count" role="status" aria-live="polite"></div><div id="na-list" class="na-list"></div></div>';
  }
  function mount(el) {
    root = el;
    ['cat', 'sev', 'rd'].forEach(function (k) { var s = el.querySelector('#na-' + k); s.value = view[k]; s.addEventListener('change', function () { view[k] = s.value; paint(); }); });
    el.querySelector('#na-search').addEventListener('input', function (e) { view.q = e.target.value.trim(); paint(); });
    paint();
  }

  /* ---------- actions ---------- */
  function setRead(id, v) { O.setRead(id, v); sync(); paint(); }
  A.on('na-reset', function () { view = { q: '', cat: '', sev: '', rd: '' }; if (root) { root.querySelector('#na-search').value = ''; ['cat', 'sev', 'rd'].forEach(function (k) { root.querySelector('#na-' + k).value = ''; }); } paint(); });
  A.on('na-toggle', function (el) { var n = byId(el.getAttribute('data-id')); if (n) setRead(n.id, !n.read); });
  A.on('na-readall', function () {
    var list = scoped().filter(function (n) { return !n.read; }); if (!list.length) return;
    list.forEach(function (n) { O.nst[n.id] = O.nst[n.id] || {}; O.nst[n.id].read = true; }); O.changed(); sync(); paint();
    M.toast.success('All reporting alerts marked as read', list.length + ' simulated alert' + (list.length === 1 ? '' : 's') + ' updated.');
  });
  A.on('na-open', function (el) {
    var n = byId(el.getAttribute('data-id')); if (!n) return;
    if (!N.validRoute(n)) { M.toast.warning('No page to open', 'The related record is no longer available.'); return; }
    O.setRead(n.id, true); location.hash = n.route;
  });
  A.on('na-view', function (el) {
    var n = byId(el.getAttribute('data-id')); if (!n) return;
    if (!n.read) setRead(n.id, true);                       /* opening the details marks the alert as read; it can be marked unread again */
    var ok = N.validRoute(n), acts = [{ label: 'Close' }, { label: 'Mark as unread', onClick: function () { setRead(n.id, false); } }];
    if (ok) acts.push({ label: 'Open ' + n.rel, variant: 'primary', onClick: function () { O.setRead(n.id, true); location.hash = n.route; } });
    M.modal.open({ size: 'lg', title: n.title, actions: acts, body: '<div class="row">' + UI.badge(n.sev, TONE[n.sev] || 'neutral') + UI.badge(CATL[n.cat] || n.cat, 'neutral', { dot: false }) + UI.badge('Simulated', 'info', { dot: false }) + '</div>' +
      '<dl class="kv" style="margin-top:12px"><dt>Message</dt><dd>' + esc(n.detail) + '</dd><dt>Time</dt><dd>' + esc(R.fmt(n.ts)) + ' (' + esc(R.rel(n.ts)) + ')</dd>' +
      '<dt>Related</dt><dd>' + (n.rel ? (ok ? '<a href="' + esc(n.route) + '">' + esc(n.rel) + '</a>' : esc(n.rel) + ' — no valid page') : '—') + '</dd></dl>' +
      '<p class="hint" style="margin-top:12px">Simulated, illustrative alert generated locally from synthetic data. Nothing was sent, and no official government alert rule or deadline is implied.</p>' });
  });

  M.pages['gov/notifications'] = { title: 'Reporting Alerts', render: render, mount: mount };
})(window);
