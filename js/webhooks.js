/* Msafiri — Stage 5B.3: Webhook management & DELIVERY SIMULATOR (#/admin/developer/webhooks[/new|/<WH-id>[/edit]]).
   SIMULATION ONLY. Delivery outcomes are chosen by local JavaScript in this tab. There is NO fetch/XHR/WebSocket/beacon/form-post in this module:
   destination URLs are stored as text and never contacted. A "successful" simulated delivery is NOT a delivery — nothing leaves the browser.
   The webhook event contract is not defined in this prototype (and the URS was not supplied to this build): event names, payload shapes, the retry limit and
   the signature header are ILLUSTRATIVE PLACEHOLDERS, pending specification. No signing secret exists; no signature is computed or verified.
   Data is synthetic, held in browser-tab memory and restored by "Reset demo data". */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, R = M.dir, I = M.integ, D = M.dev, A = M.actions, BASE = '#/admin/developer/webhooks';
  var PENDING = 'Illustrative — pending specification';
  var MAX_ATT = 5; /* illustrative retry limit for this simulator only */

  /* ---------- illustrative event catalogue (names + payload data are placeholders) ---------- */
  var EVENTS = [
    { id: 'registration.submitted', group: 'Guest registration', label: 'Registration submitted', data: function () { return { registrationRef: 'REG-900003', establishmentId: 'PIL-001', submissionStatus: 'Pending', guest: { fullName: 'Ana Sample (synthetic)' } }; } },
    { id: 'registration.acknowledged', group: 'Guest registration', label: 'Registration acknowledged', data: function () { return { registrationRef: 'REG-900001', establishmentId: 'PIL-001', submissionStatus: 'Acknowledged', note: 'Acknowledged by simulated interface (demo — not a real acknowledgement)' }; } },
    { id: 'registration.rejected', group: 'Guest registration', label: 'Registration rejected', data: function () { return { registrationRef: 'REG-900002', establishmentId: 'PIL-001', submissionStatus: 'Rejected', reason: 'Document number format not accepted (synthetic example)' }; } },
    { id: 'registration.queued_offline', group: 'Guest registration', label: 'Registration queued offline', data: function () { return { registrationRef: 'REG-900004', establishmentId: 'PIL-001', submissionStatus: 'Queued offline', note: 'Connection unavailable — queued locally. NOT delivered to government.' }; } },
    { id: 'integration.status_changed', group: 'Integration operations', label: 'Integration status changed', data: function () { var r = I.rec('INT-1002'); return { integrationId: 'INT-1002', establishmentId: r ? r.estId : 'PIL-004', from: 'Connected', to: 'Degraded' }; } },
    { id: 'integration.sync_failed', group: 'Integration operations', label: 'Integration sync failed', data: function () { var r = I.rec('INT-1002'); return { integrationId: 'INT-1002', establishmentId: r ? r.estId : 'PIL-004', code: 'TIMEOUT', message: r && r.err ? r.err : 'Timeout after 30 s fetching arrivals (simulated).' }; } },
    { id: 'integration.health_check_completed', group: 'Integration operations', label: 'Health check completed', data: function () { var r = I.rec('INT-1001'), good = !r || r.status === 'Connected'; return { integrationId: 'INT-1001', establishmentId: r ? r.estId : 'PIL-001', outcome: good ? 'Success' : r.status === 'Degraded' ? 'Warning' : 'Failed', message: good ? 'All checks passed (simulated).' : 'Integration is ' + r.status + ' (simulated).' }; } }
  ];
  function evOf(id) { return EVENTS.filter(function (e) { return e.id === id; })[0]; }
  function evLabel(id) { var e = evOf(id); return e ? e.label : id; }

  /* ---------- scripted destination behaviours (simulated; no real endpoint involved) ---------- */
  var SCEN = [
    { id: 'ok', label: 'Destination accepts (200 OK)', status: 200, text: 'OK', ok: true, retry: 'ok', ms: 140 },
    { id: 'e500', label: 'Destination error (500) — succeeds on retry', status: 500, text: 'Internal Server Error', ok: false, retry: 'ok', ms: 260, err: 'Simulated destination returned 500. Transient error — a retry is scripted to succeed.' },
    { id: 'e503', label: 'Destination unavailable (503) — succeeds on retry', status: 503, text: 'Service Unavailable', ok: false, retry: 'ok', ms: 90, err: 'Simulated destination returned 503. Transient error — a retry is scripted to succeed.' },
    { id: 'tmo', label: 'No response — timeout — succeeds on retry', status: null, text: 'No response', ok: false, retry: 'ok', ms: 10000, err: 'Simulated timeout after 10 s: no response from destination.' },
    { id: 'p500', label: 'Persistent destination error (500) — retries fail', status: 500, text: 'Internal Server Error', ok: false, retry: 'same', ms: 310, err: 'Simulated destination returned 500 again. Persistent error — retries keep failing.' },
    { id: 'r401', label: 'Destination rejects request (401) — retries fail', status: 401, text: 'Unauthorized', ok: false, retry: 'same', ms: 120, err: 'Simulated destination rejected the request (401). Illustrative: a signature or credential check would have failed. Retrying does not help.' },
    { id: 'g410', label: 'Destination gone (410) — retries fail', status: 410, text: 'Gone', ok: false, retry: 'same', ms: 80, err: 'Simulated destination reports the endpoint no longer exists (410). Review the configuration.' }
  ];
  function scOf(id) { return SCEN.filter(function (s) { return s.id === id; })[0] || SCEN[0]; }

  /* ---------- state (browser-tab memory) ---------- */
  var st;
  var MIN = 60000, H = 3600000, DAY = 86400000;
  function now() { return Date.now(); }
  function seed() {
    var n = now();
    st = { hooks: [], dels: [], hn: 3, dn: 0, seq: 0, busy: {}, tok: (st ? st.tok + 1 : 1), sel: {}, flash: {}, q: null };
    st.hooks = [
      { id: 'WH-001', name: 'Registration status feed (demo)', url: 'https://hooks.example.test/msafiri/registrations', events: ['registration.submitted', 'registration.acknowledged', 'registration.rejected'], enabled: true, created: n - 21 * DAY, updated: n - 21 * DAY },
      { id: 'WH-002', name: 'Integration alerts (demo)', url: 'https://alerts.example.invalid/integrations', events: ['integration.status_changed', 'integration.sync_failed', 'integration.health_check_completed'], enabled: true, created: n - 14 * DAY, updated: n - 3 * DAY },
      { id: 'WH-003', name: 'Archive receiver (demo)', url: 'https://archive.example.test/msafiri/events', events: ['registration.queued_offline'], enabled: false, created: n - 9 * DAY, updated: n - 2 * DAY }
    ];
    /* chronological seed history (oldest first) */
    rec('WH-001', 'registration.submitted', 'ok', n - 5 * H, null);
    rec('WH-001', 'registration.rejected', 'ok', n - 2 * H, null);
    rec('WH-002', 'integration.sync_failed', 'ok', n - 26 * H, null);
    rec('WH-002', 'integration.status_changed', 'e503', n - 70 * MIN, null);
  }
  function pad(v, w) { return ('0000' + v).slice(-w); }
  /* Build and store one delivery record. parent = earlier record being retried (or null). */
  function rec(hid, event, scId, ts, parent) {
    var h = hook(hid), sc = scOf(scId), k = ++st.dn, ok = sc.ok, s = ++st.seq;
    var r = { id: 'DLV-' + pad(k, 4), seq: s, hid: hid, hname: h ? h.name : hid, url: h ? h.url : '', event: event, payload: payload(event, s, ts), status: sc.status, text: sc.text, ok: ok, ts: ts, ms: sc.ms, err: ok ? '' : sc.err, scenario: sc.id,
      attempt: parent ? parent.attempt + 1 : 1, retryOf: parent ? parent.id : '', retriedBy: '', trigger: parent ? 'Retry (simulated)' : 'Manual simulation' };
    if (parent) parent.retriedBy = r.id;
    st.dels.push(r); return r;
  }
  function payload(event, s, ts) {
    var e = evOf(event);
    return { id: 'SIM-EVT-' + pad(s, 4), type: event, createdAt: new Date(ts).toISOString(), simulated: true, specification: PENDING, data: e ? e.data() : {} };
  }
  function hook(id) { return st.hooks.filter(function (h) { return h.id === id; })[0]; }
  function delsFor(id) { return st.dels.filter(function (d) { return d.hid === id; }).sort(function (a, b) { return b.seq - a.seq; }); }
  function last(id) { return delsFor(id)[0]; }
  function del(id) { return st.dels.filter(function (d) { return d.id === id; })[0]; }
  function can() { return R.can('integrations:admin', 'admin'); }
  function audit(type, target, detail, outcome) { if (M.ops && M.ops.audit) M.ops.audit(type, 'Developer Portal', target, detail, outcome || 'Success'); }

  /* ---------- formatting ---------- */
  function fmtS(ts) { return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  function stBadge(en) { return en ? UI.badge('Enabled', 'success') : UI.badge('Disabled', 'neutral'); }
  function resBadge(d) { return d.ok ? UI.badge('Succeeded (simulated)', 'success') : UI.badge('Failed (simulated)', 'danger'); }
  function code(d) { return d.status == null ? '—' : d.status + ' ' + d.text; }
  function pretty(o) { return JSON.stringify(o, null, 2); }
  function evBadges(list) { return list.map(function (e) { return '<code class="dp-inline">' + esc(e) + '</code>'; }).join(' '); }
  var SIM_BANNER = UI.alert('orange', 'Simulation only — nothing is sent.', 'Webhook configurations and delivery attempts exist only in this browser tab. Destination URLs are never contacted, no guest or personal data leaves the browser, and a “successful” simulated attempt is <strong>not</strong> a real delivery. Event names, payloads and the retry limit are <strong>illustrative and pending specification</strong> (the URS was not available to this build).');
  function sec(h) {
    return headA(h || '', h || 'Webhooks', 'Manage illustrative webhook configurations and simulate delivery attempts. Nothing is transmitted.') + D.subnav('webhooks');
  }
  function headA(crumb, title, desc, actions) {
    return UI.pageHead({ crumbs: [{ label: 'System Administration', href: '#/admin/dashboard' }, { label: 'API / Developer Portal', href: '#/admin/developer' }, { label: 'Webhooks', href: crumb ? BASE : undefined }].concat(crumb ? [{ label: crumb }] : []), title: title, description: desc, actions: actions });
  }
  function roNote() { return can() ? '' : UI.alert('warning', 'Read-only for your role.', 'Creating, editing, enabling, deleting and simulating webhooks need the “Integrations — administer” permission. Switch “Acting as” in the user menu to a System Administrator to try them.'); }

  /* ---------- list ---------- */
  function rows() {
    return st.hooks.map(function (h) {
      var l = last(h.id);
      return Object.assign({}, h, { state: h.enabled ? 'Enabled' : 'Disabled', evText: h.events.join(' '), lastTs: l ? l.ts : 0, lastRes: l ? (l.ok ? 'Succeeded' : 'Failed') : 'No attempts', lastId: l ? l.id : '' });
    });
  }
  function listPage() {
    var rs = rows(), ok = can();
    var failed = rs.filter(function (r) { return r.lastRes === 'Failed'; }).length;
    var stats = [{ label: 'Webhook configurations', value: rs.length, icon: 'send', foot: 'synthetic' }, { label: 'Enabled', value: rs.filter(function (r) { return r.enabled; }).length, icon: 'check-circle', tone: 'green', foot: 'would receive events' },
      { label: 'Disabled', value: rs.filter(function (r) { return !r.enabled; }).length, icon: 'lock', foot: 'paused' }, { label: 'Latest attempt failed', value: failed, icon: 'alert', tone: 'red', foot: 'simulated result' }];
    return headA('', 'Webhooks', 'Manage illustrative webhook configurations and simulate delivery attempts. Nothing is transmitted.', ok ? UI.button({ label: 'Create webhook', icon: 'plus', variant: 'primary', href: BASE + '/new' }) : UI.button({ label: 'Create webhook', icon: 'plus', variant: 'primary', disabled: true, aria: 'Create webhook (needs administer permission)' })) + D.subnav('webhooks') +
      '<div class="stack">' + SIM_BANNER + roNote() + '<div class="grid cols-4">' + stats.map(UI.statCard).join('') + '</div>' +
      UI.card({ title: 'Webhook configurations', subtitle: 'Synthetic · destinations are illustrative and never contacted', flush: true, body: '<div id="wh-table"></div>' }) + '</div>';
  }
  function emptyList() {
    return UI.empty({ icon: 'send', title: 'No webhooks configured', body: 'Create an illustrative webhook configuration, then simulate delivery attempts against it. Nothing is ever sent.',
      actions: can() ? UI.button({ label: 'Create webhook', icon: 'plus', variant: 'primary', href: BASE + '/new' }) : '<span class="muted">Your role cannot create webhooks.</span>' });
  }
  function listMount(root) {
    var host = root.querySelector('#wh-table'); if (!host) return;
    if (!st.hooks.length) { host.innerHTML = '<div style="padding:var(--sp-5)">' + emptyList() + '</div>'; return; }
    var ok = can();
    UI.table.mount(host, { caption: 'Webhook configurations (synthetic)', rows: rows(), pageSize: 8, searchKeys: ['name', 'url', 'id', 'evText'], searchPlaceholder: 'Search name, URL or event…',
      filter: { key: 'state', label: 'Status', options: ['Enabled', 'Disabled'] }, emptyText: 'No webhooks match the current search and filters.',
      columns: [
        { key: 'name', label: 'Webhook', sortable: true, render: function (r) { return '<a class="cell-main" href="' + BASE + '/' + esc(r.id) + '">' + esc(r.name) + '</a><div class="cell-sub">' + esc(r.id) + '</div>'; } },
        { key: 'url', label: 'Destination (synthetic)', sortable: true, render: function (r) { return '<code class="dp-inline" title="' + esc(r.url) + '">' + esc(r.url) + '</code><div class="cell-sub">Never contacted</div>'; } },
        { key: 'evText', label: 'Subscribed events', render: function (r) { return '<div class="wh-evs">' + evBadges(r.events) + '</div>'; } },
        { key: 'state', label: 'Status', sortable: true, render: function (r) { return stBadge(r.enabled); } },
        { key: 'lastTs', label: 'Last delivery', sortable: true, render: function (r) { return r.lastTs ? '<span title="' + esc(fmtS(r.lastTs)) + '">' + esc(R.rel(r.lastTs)) + '</span><div class="cell-sub">Simulated</div>' : '<span class="muted">Never</span>'; } },
        { key: 'lastRes', label: 'Last result', sortable: true, render: function (r) { var l = last(r.id); return l ? resBadge(l) + '<div class="cell-sub">' + esc(code(l)) + '</div>' : '<span class="muted">No attempts</span>'; } },
        { key: 'a', label: 'Actions', render: function (r) {
          var d = ok ? '' : ' title="Needs the administer permission"';
          return '<div class="wh-actions">' + UI.button({ label: 'View', size: 'sm', variant: 'secondary', href: BASE + '/' + r.id, aria: 'View details of ' + r.name }) +
            (ok ? UI.button({ label: 'Edit', size: 'sm', variant: 'secondary', href: BASE + '/' + r.id + '/edit', aria: 'Edit ' + r.name }) : '<span' + d + '>' + UI.button({ label: 'Edit', size: 'sm', variant: 'secondary', disabled: true }) + '</span>') +
            '<span' + d + '>' + UI.button({ label: r.enabled ? 'Disable' : 'Enable', size: 'sm', variant: 'secondary', action: ok ? 'wh-toggle' : null, data: ok ? { id: r.id } : null, disabled: !ok, aria: (r.enabled ? 'Disable ' : 'Enable ') + r.name }) + '</span>' +
            '<span' + d + '>' + UI.button({ label: 'Delete', size: 'sm', variant: 'ghost', action: ok ? 'wh-delete' : null, data: ok ? { id: r.id } : null, disabled: !ok, aria: 'Delete ' + r.name }) + '</span></div>'; } }] });
  }

  /* ---------- form ---------- */
  function urlCheck(v) {
    v = String(v || '').trim(); if (!v) return 'Destination URL is required.';
    if (v.length > 200) return 'Destination URL must be 200 characters or fewer.';
    if (/\s/.test(v)) return 'Destination URL must not contain spaces.';
    var u; try { u = new URL(v); } catch { return 'Enter a valid URL such as https://hooks.example.test/msafiri/events.'; }
    if (u.protocol !== 'https:') return 'Destination URL must use https:// (illustrative requirement).';
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(u.hostname) || /^\d+(\.\d+){3}$/.test(u.hostname)) return 'Use a hostname with a domain (not localhost or an IP address), e.g. hooks.example.test.';
    if (u.username || u.password) return 'The URL must not contain a username or password. Credentials are never stored.';
    if (/(^|[?&])(token|key|api_?key|secret|signature|sig|password|pwd|auth)=/i.test(u.search)) return 'The URL must not carry a token, key, secret or signature in its query string. Secrets are never stored.';
    return '';
  }
  function validate(v, selfId) {
    var e = {}, n = String(v.name || '').trim();
    if (!n) e.name = 'Webhook name is required.'; else if (n.length < 3 || n.length > 60) e.name = 'Name must be 3–60 characters.';
    else if (st.hooks.some(function (h) { return h.id !== selfId && h.name.toLowerCase() === n.toLowerCase(); })) e.name = 'Another webhook already uses this name.';
    var u = urlCheck(v.url); if (u) e.url = u;
    if (!v.events.length) e.events = 'Select at least one event type.';
    return e;
  }
  function realHost(url) { try { var h = new URL(url).hostname.toLowerCase(); return !/(^|\.)(example|test|invalid|localhost)$|(^|\.)example\.(com|org|net)$/.test(h); } catch { return false; } }
  function formPage(id) {
    var h = id ? hook(id) : null;
    if (id && !h) return notFound();
    if (!can()) return sec(id ? 'Edit' : 'Create') + '<div class="stack">' + roNote() + UI.card({ body: UI.empty({ icon: 'lock', title: 'Access not granted', body: 'Your demo role is read-only for webhooks. This is a frontend demonstration, not production security.', actions: UI.button({ label: 'Back to webhooks', variant: 'primary', href: BASE }) }) }) + '</div>';
    var carried = st.q && st.q.id === (id || 'new') ? st.q : null; st.q = null;
    var v = carried || { id: id || 'new', name: h ? h.name : '', url: h ? h.url : 'https://', events: h ? h.events.slice() : [], enabled: h ? h.enabled : true }, er = (carried && carried.errors) || {};
    var groups = ['Guest registration', 'Integration operations'], summary = Object.keys(er).length;
    var evField = '<fieldset class="field span-2 wh-fs"><legend>Event types<span class="req" aria-hidden="true">*</span><span class="sr-only"> (required)</span> ' + UI.badge(PENDING, 'warning', { dot: false }) + '</legend>' +
      '<div class="hint" id="wh-ev-hint">Event names and payload shapes below are placeholders for this simulator, pending specification.</div>' +
      groups.map(function (gp) { return '<div class="wh-grp"><div class="wh-grp-t">' + esc(gp) + '</div>' + EVENTS.filter(function (e) { return e.group === gp; }).map(function (e) {
        return UI.checkbox({ id: 'wh-ev-' + e.id.replace(/\W/g, '_'), checked: v.events.indexOf(e.id) > -1, label: '<strong>' + esc(e.label) + '</strong> <code class="dp-inline">' + esc(e.id) + '</code>' }); }).join('') + '</div>'; }).join('') +
      (er.events ? '<div class="error-text" id="wh-ev-err" role="alert">' + M.icon('alert', { size: 14 }) + esc(er.events) + '</div>' : '') + '</fieldset>';
    var warn = '<div id="wh-url-warn">' + urlWarn(v.url) + '</div>';
    return sec(h ? 'Edit ' + h.name : 'Create webhook') + '<div class="stack">' + SIM_BANNER +
      (summary ? UI.alert('danger', 'Please fix ' + summary + ' problem' + (summary > 1 ? 's' : '') + ' before saving.', '<ul style="margin:4px 0 0;padding-left:18px">' + Object.keys(er).map(function (k) { return '<li>' + esc(er[k]) + '</li>'; }).join('') + '</ul>') : '') +
      UI.card({ title: h ? 'Edit webhook configuration' : 'New webhook configuration', subtitle: h ? esc0(h.id) + ' · changes apply to this browser tab only' : 'Synthetic configuration — never sent anywhere',
        body: '<form id="wh-form" novalidate autocomplete="off"><div class="form-grid">' +
          UI.input({ id: 'wh-name', label: 'Webhook name', required: true, value: v.name, error: er.name, hint: '3–60 characters, unique.', span2: true }) +
          UI.input({ id: 'wh-url', label: 'Destination URL (illustrative, HTTPS)', required: true, type: 'text', value: v.url, error: er.url, placeholder: 'https://hooks.example.test/msafiri/events', hint: 'Stored as text only. It is never contacted. Use an illustrative address; do not enter a real endpoint, credentials or secrets.', span2: true }) +
          '<div class="span-2">' + warn + '</div>' + evField +
          '<div class="field span-2">' + UI.switch({ id: 'wh-en', label: 'Enabled — this configuration is eligible for simulated deliveries', checked: v.enabled }) + '</div></div>' +
          '<div class="alert info" role="note" style="margin-top:var(--sp-5)">' + M.icon('info') + '<div><strong>No signing secret.</strong> This prototype does not create, store or display webhook secrets, and does not sign payloads.</div></div>' +
          '<div class="form-actions">' + UI.button({ label: 'Cancel', variant: 'secondary', href: h ? BASE + '/' + h.id : BASE }) + UI.button({ label: h ? 'Save changes' : 'Create webhook', icon: 'check', variant: 'primary', type: 'submit' }) + '</div></form>' }) + '</div>';
  }
  function esc0(s) { return esc(s); }
  function urlWarn(url) { return url && !urlCheck(url) && realHost(url) ? UI.alert('warning', 'This host does not look illustrative.', 'It is saved as text only and nothing will be sent to it. Prefer reserved example names such as <code>example.test</code> or <code>example.com</code>.') : ''; }
  function readForm(root) {
    var ev = EVENTS.filter(function (e) { var c = root.querySelector('#wh-ev-' + e.id.replace(/\W/g, '_')); return c && c.checked; }).map(function (e) { return e.id; });
    return { name: root.querySelector('#wh-name').value, url: root.querySelector('#wh-url').value, events: ev, enabled: root.querySelector('#wh-en').checked };
  }
  function formMount(root, id) {
    var f = root.querySelector('#wh-form'); if (!f) return; var h = id ? hook(id) : null;
    var u = f.querySelector('#wh-url'); u.addEventListener('input', function () { root.querySelector('#wh-url-warn').innerHTML = urlWarn(u.value.trim()); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!can()) return;
      var v = readForm(root); v.name = v.name.trim(); v.url = v.url.trim(); var er = validate(v, h && h.id);
      if (Object.keys(er).length) { v.id = id || 'new'; v.errors = er; st.q = v; M.rerender(); var fld = document.querySelector('[aria-invalid="true"]') || document.querySelector('.wh-fs input'); if (fld) fld.focus(); return; }
      st.q = null;
      if (h) {
        var ch = []; if (h.name !== v.name) ch.push('name'); if (h.url !== v.url) ch.push('destination URL'); if (h.events.slice().sort().join() !== v.events.slice().sort().join()) ch.push('events'); if (h.enabled !== v.enabled) ch.push(v.enabled ? 'enabled' : 'disabled');
        h.name = v.name; h.url = v.url; h.events = v.events; h.enabled = v.enabled; h.updated = now();
        audit('Webhook configuration change', h.id, 'Edited webhook “' + h.name + '” (simulated; ' + (ch.length ? 'changed: ' + ch.join(', ') : 'no changes') + ')');
        M.toast.success('Webhook saved', ch.length ? 'Updated ' + ch.join(', ') + '.' : 'No changes were made.'); location.hash = BASE.slice(1) + '/' + h.id;
      } else {
        var n = { id: 'WH-' + pad(++st.hn, 3), name: v.name, url: v.url, events: v.events, enabled: v.enabled, created: now(), updated: now() }; st.hooks.push(n);
        audit('Webhook configuration change', n.id, 'Created webhook “' + n.name + '” with ' + n.events.length + ' event type(s) (simulated)');
        M.toast.success('Webhook created', n.name + ' was added (synthetic; nothing is sent).'); location.hash = BASE.slice(1) + '/' + n.id;
      }
    });
  }

  /* ---------- details ---------- */
  function notFound() {
    return sec('Not found') + '<div class="stack">' + UI.card({ body: UI.empty({ icon: 'search', title: 'Webhook not found', body: 'It may have been deleted, or the address is wrong.', actions: UI.button({ label: 'Back to webhooks', variant: 'primary', href: BASE }) }) }) + '</div>';
  }
  function selFor(h) { var s = st.sel[h.id] || {}; var ev = h.events.indexOf(s.event) > -1 ? s.event : h.events[0]; return { event: ev, scenario: s.scenario || 'ok' }; }
  function previewOf(evId) { var s = st.seq + 1; return pretty(payload(evId, s, now())); }
  function simCard(h) {
    var s = selFor(h), ok = can(), busy = st.busy[h.id], block = !ok ? 'Needs the administer permission.' : !h.enabled ? 'This webhook is disabled. Enable it to simulate a delivery.' : !h.events.length ? 'No event types are subscribed.' : busy ? 'A simulated attempt is already running.' : '';
    return UI.card({ title: 'Simulate delivery', subtitle: 'Choose an event and a scripted destination behaviour · nothing is sent', body:
      UI.alert('orange', '', 'The destination is <strong>not contacted</strong>. The result below is chosen by this page, not by any server.') +
      '<div class="form-grid" style="margin-top:var(--sp-4)">' + UI.select({ id: 'wh-sev', label: 'Event type (' + PENDING.toLowerCase() + ')', options: h.events.map(function (e) { return { value: e, label: evLabel(e) + ' — ' + e }; }), value: s.event }) +
      UI.select({ id: 'wh-ssc', label: 'Simulated destination behaviour', options: SCEN.map(function (x) { return { value: x.id, label: x.label }; }), value: s.scenario }) + '</div>' +
      '<p class="dp-code-label" style="margin-top:var(--sp-4)">Synthetic payload preview (illustrative · pending specification)</p><pre class="dp-code" tabindex="0" aria-label="Synthetic payload preview" id="wh-prev"><code>' + esc(h.events.length ? previewOf(s.event) : '(no event types subscribed)') + '</code></pre>' +
      '<div class="row">' + (block ? '<span title="' + esc(block) + '">' : '') + UI.button({ label: busy ? 'Simulating…' : 'Simulate delivery', icon: busy ? 'refresh' : 'send', variant: 'primary', action: block ? null : 'wh-sim', data: block ? null : { id: h.id }, disabled: !!block }) + (block ? '</span><span class="hint">' + esc(block) + '</span>' : '') + '</div>' +
      '<div id="wh-busy" role="status" aria-live="polite">' + (busy ? '<div class="dp-busy"><span class="dp-spin" aria-hidden="true"></span><span>Processing simulated delivery attempt…</span></div>' : '') + '</div>' });
  }
  function latestCard(h) {
    var l = last(h.id);
    if (!l) return UI.card({ title: 'Latest simulated attempt', body: UI.empty({ icon: 'send', title: 'No delivery attempts yet', body: 'Use “Simulate delivery” to record the first simulated attempt for this webhook.' }) });
    return UI.card({ title: 'Latest simulated attempt', subtitle: l.id + ' · attempt ' + l.attempt, actions: UI.badge('Simulated', 'info', { dot: false }), body: '<div id="wh-latest" tabindex="-1">' + attemptBody(l) + '</div>' });
  }
  function attemptBody(l) {
    return D.kv([['Result', resBadge(l) + ' ' + UI.badge('Simulated — not a real delivery', 'info', { dot: false }), 1], ['Event type', evLabel(l.event) + ' (' + l.event + ')'], ['Simulated HTTP status', code(l)], ['Attempt timestamp', fmtS(l.ts)],
      ['Simulated duration', l.ms >= 10000 ? '10.0 s (simulated timeout)' : '≈ ' + l.ms + ' ms'], ['Trigger', l.trigger + (l.retryOf ? ' of ' + l.retryOf : '')], ['Error summary', l.err || 'None — the scripted destination accepted the request.'],
      ['Destination (synthetic)', '<code class="dp-inline">' + esc(l.url) + '</code> — never contacted', 1]]) + D.code('Synthetic payload (illustrative · pending specification)', pretty(l.payload));
  }
  function histCard(h) {
    var n = delsFor(h.id).length;
    return UI.card({ title: 'Delivery history', subtitle: n + ' simulated attempt' + (n === 1 ? '' : 's') + ' · every attempt is simulated', flush: true, body: n ? '<div id="wh-hist"></div>' : '<div style="padding:var(--sp-5)">' + UI.empty({ icon: 'clock', title: 'No simulated attempts yet', body: 'Simulated attempts and retries will be listed here, newest first.' }) + '</div>' });
  }
  function detailPage(id) {
    var h = hook(id); if (!h) return notFound(); var ok = can(), d = ok ? '' : ' title="Needs the administer permission"';
    var acts = (ok ? UI.button({ label: 'Edit', icon: 'edit', variant: 'secondary', href: BASE + '/' + h.id + '/edit' }) : UI.button({ label: 'Edit', icon: 'edit', disabled: true })) +
      '<span' + d + '>' + UI.button({ label: h.enabled ? 'Disable' : 'Enable', variant: 'secondary', action: ok ? 'wh-toggle' : null, data: ok ? { id: h.id } : null, disabled: !ok }) + '</span>' +
      '<span' + d + '>' + UI.button({ label: 'Delete', variant: 'danger', action: ok ? 'wh-delete' : null, data: ok ? { id: h.id } : null, disabled: !ok }) + '</span>' + UI.button({ label: 'Back to list', variant: 'ghost', href: BASE });
    return headA(h.name, h.name, esc(h.id) + ' · synthetic webhook configuration', acts) + D.subnav('webhooks') +
      '<div class="stack">' + SIM_BANNER + roNote() + '<div class="grid main-side"><div class="stack">' +
      UI.card({ title: 'Configuration', subtitle: 'Synthetic · stored in this browser tab only', body: D.kv([['Status', stBadge(h.enabled), 1], ['Destination URL', '<code class="dp-inline">' + esc(h.url) + '</code> <span class="muted">— illustrative; never contacted</span>', 1], ['Subscribed events', '<div class="wh-evs">' + evBadges(h.events) + '</div>', 1],
        ['Event contract', PENDING + '. Names and payloads are placeholders.'], ['Created', R.fmt(h.created)], ['Last updated', R.fmt(h.updated)], ['Signing secret', 'None. No secret is created, stored or shown.']]) }) +
      simCard(h) + latestCard(h) + histCard(h) + '</div><div class="stack">' + sigCard() + UI.card({ title: 'About this page', body: '<ul class="wh-ul"><li>No outbound HTTP request is made, ever.</li><li>Retry limit of ' + MAX_ATT + ' attempts is an illustrative simulator rule.</li><li>Deleting a webhook removes its history from this tab; the audit trail keeps a record.</li><li>Changes are written to the shared <a href="#/admin/audit-logs">audit log</a>.</li></ul>' }) + '</div></div></div>';
  }
  function sigCard() {
    return UI.card({ title: 'Signature verification — concept only', subtitle: 'Not implemented', body: '<p class="muted" style="font-size:var(--fs-sm);margin:0 0 var(--sp-3)">In a real design a receiver would check a signature header to confirm a payload came from Msafiri and was not altered. <strong>This prototype does not sign payloads or verify signatures</strong>, has no secret, and shows no signature value.</p>' +
      D.code('Illustrative header (not generated)', 'X-Msafiri-Signature: <not generated — concept only>') });
  }
  function histMount(root, h) {
    var host = root.querySelector('#wh-hist'); if (!host) return; var ok = can();
    UI.table.mount(host, { caption: 'Simulated delivery history for ' + h.name, rows: delsFor(h.id), pageSize: 6, searchKeys: ['id', 'event', 'err', 'text'], searchPlaceholder: 'Search attempts…', emptyText: 'No attempts match the search.',
      filter: { key: 'res', label: 'Result', options: ['Succeeded', 'Failed'] },
      columns: [
        { key: 'seq', label: 'Attempt', sortable: true, render: function (r) { return '<span class="cell-main">' + esc(r.id) + '</span><div class="cell-sub">#' + r.attempt + (r.retryOf ? ' · retry of ' + esc(r.retryOf) : '') + '</div>'; } },
        { key: 'ts', label: 'Timestamp', sortable: true, render: function (r) { return esc(fmtS(r.ts)) + '<div class="cell-sub">Simulated</div>'; } },
        { key: 'event', label: 'Event', render: function (r) { return '<code class="dp-inline">' + esc(r.event) + '</code>'; } },
        { key: 'status', label: 'HTTP status', render: function (r) { return esc(code(r)); } },
        { key: 'ok', label: 'Result', render: function (r) { return resBadge(r) + (r.retriedBy ? '<div class="cell-sub">Retried as ' + esc(r.retriedBy) + '</div>' : ''); } },
        { key: 'err', label: 'Error summary', render: function (r) { return r.err ? '<span class="wh-err">' + esc(r.err) + '</span>' : '<span class="muted">—</span>'; } },
        { key: 'a', label: 'Actions', render: function (r) {
          var why = !ok ? 'Needs the administer permission.' : !r.ok ? '' : '', can2 = !r.ok && !r.retriedBy && ok && h.enabled && r.attempt < MAX_ATT && !st.busy[h.id];
          if (!r.ok && !r.retriedBy) why = !ok ? 'Needs the administer permission.' : !h.enabled ? 'Webhook is disabled.' : r.attempt >= MAX_ATT ? 'Maximum of ' + MAX_ATT + ' attempts reached (illustrative limit).' : st.busy[h.id] ? 'Another attempt is running.' : '';
          return '<div class="wh-actions">' + UI.button({ label: 'Details', size: 'sm', variant: 'secondary', action: 'wh-view', data: { id: r.id }, aria: 'Details of attempt ' + r.id }) +
            (!r.ok && !r.retriedBy ? '<span' + (why ? ' title="' + esc(why) + '"' : '') + '>' + UI.button({ label: 'Retry', icon: 'refresh', size: 'sm', variant: 'primary', action: can2 ? 'wh-retry' : null, data: can2 ? { id: r.id } : null, disabled: !can2, aria: 'Retry attempt ' + r.id }) + '</span>' : '') + '</div>'; } }]
      });
  }

  /* ---------- behaviour ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function onWebhooks() { return /^#\/admin\/developer\/webhooks/.test(location.hash); }
  function run(hid, event, scId, parent) {
    var h = hook(hid); if (!h || st.busy[hid]) return;
    st.busy[hid] = true; var tok = st.tok; M.rerender();
    setTimeout(function () {
      if (tok !== st.tok) return; /* reset during the attempt: discard */
      delete st.busy[hid]; var hh = hook(hid);
      if (!hh) return;
      var sc = parent ? scOf(scOf(parent.scenario).retry === 'ok' ? 'ok' : parent.scenario) : scOf(scId);
      var r = rec(hid, event, sc.id, now(), parent);
      audit('Webhook delivery (simulated)', hid, (parent ? 'Retry' : 'Simulation') + ' ' + r.id + ' for “' + hh.name + '”: ' + r.event + ' → ' + (r.status == null ? 'no response' : r.status) + ' ' + (r.ok ? 'succeeded' : 'failed') + ' (SIMULATED — nothing was sent)', r.ok ? 'Success' : 'Failed');
      if (onWebhooks()) { M.rerender(); var lt = $('wh-latest'); if (lt) lt.focus({ preventScroll: false }); }
      M.toast.show({ title: r.ok ? 'Simulated delivery succeeded' : 'Simulated delivery failed', message: r.id + ' · ' + code(r) + ' · simulated — nothing was sent.', tone: r.ok ? 'success' : 'danger' });
    }, 800);
  }
  A.on('wh-sim', function (el) {
    if (!can()) return M.toast.info('Not permitted', 'Your role is read-only.');
    var h = hook(el.getAttribute('data-id')); if (!h || !h.enabled) return;
    var ev = $('wh-sev'), sc = $('wh-ssc'); st.sel[h.id] = { event: ev ? ev.value : h.events[0], scenario: sc ? sc.value : 'ok' };
    if (h.events.indexOf(st.sel[h.id].event) < 0) return;
    run(h.id, st.sel[h.id].event, st.sel[h.id].scenario, null);
  });
  A.on('wh-retry', function (el) {
    if (!can()) return M.toast.info('Not permitted', 'Your role is read-only.');
    var d = del(el.getAttribute('data-id')), h = d && hook(d.hid); if (!d || !h || d.ok || d.retriedBy || !h.enabled || d.attempt >= MAX_ATT) return;
    run(h.id, d.event, null, d);
  });
  A.on('wh-view', function (el) {
    var d = del(el.getAttribute('data-id')); if (!d) return;
    M.modal.open({ title: 'Simulated attempt ' + d.id, size: 'lg', body: UI.alert('orange', 'Simulated.', 'This attempt was evaluated locally. No request was made to the destination.') + '<div style="margin-top:var(--sp-4)">' + attemptBody(d) + '</div>', actions: [{ label: 'Close', variant: 'secondary' }] });
  });
  A.on('wh-toggle', function (el) {
    if (!can()) return M.toast.info('Not permitted', 'Your role is read-only.');
    var h = hook(el.getAttribute('data-id')); if (!h) return; h.enabled = !h.enabled; h.updated = now();
    audit('Webhook configuration change', h.id, (h.enabled ? 'Enabled' : 'Disabled') + ' webhook “' + h.name + '” (simulated)');
    M.toast.success(h.enabled ? 'Webhook enabled' : 'Webhook disabled', h.name + (h.enabled ? ' can now be used for simulated deliveries.' : ' will not accept simulated deliveries.')); M.rerender();
  });
  A.on('wh-delete', function (el) {
    if (!can()) return M.toast.info('Not permitted', 'Your role is read-only.');
    var h = hook(el.getAttribute('data-id')); if (!h) return; var n = delsFor(h.id).length, hid = h.id;
    M.modal.confirm({ title: 'Delete webhook?', variant: 'danger', confirmLabel: 'Delete webhook', cancelLabel: 'Keep webhook',
      body: '<p>Delete <strong>' + esc(h.name) + '</strong> (' + esc(h.id) + ')?</p><p class="muted" style="font-size:var(--fs-sm)">The configuration and its ' + n + ' simulated delivery record' + (n === 1 ? '' : 's') + ' will be removed from this browser tab. The audit log keeps a record of the deletion. Nothing is deleted anywhere else because nothing was ever sent.</p>',
      onConfirm: function () {
        var x = hook(hid); if (!x) return; st.hooks = st.hooks.filter(function (k) { return k.id !== hid; }); st.dels = st.dels.filter(function (d) { return d.hid !== hid; }); delete st.busy[hid];
        audit('Webhook configuration change', hid, 'Deleted webhook “' + x.name + '” and ' + n + ' simulated delivery record(s)');
        M.toast.success('Webhook deleted', x.name + ' was removed.'); if (location.hash === BASE + '/' + hid || location.hash === BASE + '/' + hid + '/edit') location.hash = BASE.slice(1); else M.rerender();
      } });
  });

  function reset() { seed(); }
  seed();
  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(reset);

  /* ---------- entry points used by developer.js ---------- */
  function parts() { return location.hash.replace(/^#\/?/, '').split('/'); }
  function render(ctx) {
    if (!D.ok()) return D.head('', 'API / Developer Portal', '') + '<div class="stack">' + D.crash() + '</div>';
    var id = ctx.sub2, p4 = parts()[4];
    if (!id) return listPage();
    if (id === 'new') return formPage(null);
    if (p4 === 'edit') return formPage(id);
    return detailPage(id);
  }
  function mount(root, ctx) {
    var id = ctx.sub2, p4 = parts()[4];
    if (!id) return listMount(root);
    if (id === 'new') return formMount(root, null);
    if (p4 === 'edit') return formMount(root, id);
    var h = hook(id); if (!h) return;
    histMount(root, h);
    var ev = $('wh-sev'), sc = $('wh-ssc');
    function sync() { st.sel[h.id] = { event: ev.value, scenario: sc.value }; var pv = $('wh-prev'); if (pv) pv.querySelector('code').textContent = previewOf(ev.value); }
    if (ev && sc) { ev.addEventListener('change', sync); sc.addEventListener('change', sync); }
  }
  M.webhooks = { render: render, mount: mount, reset: reset, EVENTS: EVENTS, SCEN: SCEN, MAX_ATTEMPTS: MAX_ATT, urlCheck: urlCheck, state: function () { return st; } };
})(window);
