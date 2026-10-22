/* Msafiri — Stage 5A.1–5A.3: Integration Dashboard, listing, details, SIMULATED actions and health checks (#/admin/pms-health[/<id>]) and event history (#/admin/integration-events[/<id>]).
   SYNTHETIC. Nothing here calls a real PMS, vendor API or government system; every action outcome is a scripted local simulation.
   State lives in Msafiri.integ (browser-tab memory, restored by "Reset demo data"). Activity is kept in I.events (flat list) and is the single source for the details
   "Recent activity" and the event-history page. Health checks are scripted local simulations — no live monitoring. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, R = M.dir, S = M.store, I = M.integ = {}, H = 36e5, DAY = 864e5, MIN = 6e4;
  var STATUSES = ['Connected', 'Degraded', 'Disconnected'], TONE = { Connected: 'success', Degraded: 'warning', Disconnected: 'danger' }, RANK = { Disconnected: 0, Degraded: 1, Connected: 2 };
  var ACTS = { test: { label: 'Test connection', busy: 'Testing…', icon: 'activity' }, connect: { label: 'Connect', busy: 'Connecting…', icon: 'plus' }, enable: { label: 'Enable', busy: 'Enabling…', icon: 'check-circle' },
    disable: { label: 'Disable', busy: 'Disabling…', icon: 'lock' }, retry: { label: 'Retry failed operation', busy: 'Retrying…', icon: 'refresh' }, health: { label: 'Health check', busy: 'Checking…', icon: 'activity' } };
  I.STATUSES = STATUSES; I.ACTIONS = ACTS; I.RECENT_MS = DAY; I.busy = {};
  var SIM_NOTE = 'Simulated action — no real PMS, vendor API or government system is contacted.';

  /* [id, provider, type, estId, status, okAgo, errMsg, errAgo, {enabled, ops:[label,flaky], fault:'creds'|'transient'}] — only establishments whose directory PMS is "Simulated connector". */
  var SEED = [
    ['INT-1001', 'StayLedger PMS', 'Reservations & guest data', 'PIL-001', 'Connected', 4 * MIN, null, null, {}],
    ['INT-1002', 'RoomWave Cloud', 'Reservations & guest data', 'PIL-004', 'Degraded', 3 * H, 'Timeout after 30 s fetching arrivals (simulated).', 2 * H, { ops: [['Arrivals fetch (timeout)', 0], ['Guest data push, 6 records (timeout)', 1]] }],
    ['INT-1003', 'StayLedger PMS', 'Reservations & guest data', 'PIL-007', 'Connected', 22 * MIN, 'Rate limit reached; retry succeeded (simulated).', 5 * DAY, {}],
    ['INT-1004', 'FrontDesk One', 'Reservations & guest data', 'PIL-010', 'Disconnected', 3 * DAY, 'Authentication rejected: credentials expired (simulated).', 3 * DAY - 15 * MIN, { fault: 'creds', ops: [['Arrivals fetch (authentication)', 0]] }],
    ['INT-1005', 'RoomWave Cloud', 'Reservations & guest data', 'PIL-013', 'Connected', 9 * MIN, null, null, {}],
    ['INT-1006', 'Oakbridge Hospitality Suite', 'Reservations & guest data', 'PIL-016', 'Degraded', 5 * H, 'Partial payload: 12 of 40 arrival records missing guest nationality (simulated).', 4 * H, { ops: [['Arrivals import, 12 records (incomplete)', 1]] }],
    ['INT-1007', 'FrontDesk One', 'Reservations & guest data', 'PIL-019', 'Connected', 41 * MIN, 'Schema warning: unknown field "loyalty_tier" ignored (simulated).', 9 * DAY, { fault: 'drift' }],
    ['INT-1008', 'Oakbridge Hospitality Suite', 'Room status feed', 'PIL-007', 'Disconnected', 26 * H, 'Connection refused by simulated endpoint (host unreachable).', 20 * H, { fault: 'transient', ops: [['Room status push (unreachable)', 0]] }],
    ['INT-1009', 'StayLedger PMS', 'Room status feed', 'PIL-013', 'Connected', 2 * MIN, null, null, {}],
    ['INT-1010', 'NimbusStay', 'Reservations & guest data', 'PIL-004', 'Connected', 15 * MIN, 'Duplicate reservation reference skipped (simulated).', 30 * H, { enabled: false }]
  ];
  /* last health check, ms ago (consistent with each record's status) */
  var HC = { 'INT-1001': 12 * MIN, 'INT-1002': H, 'INT-1003': 30 * MIN, 'INT-1004': 2 * H, 'INT-1005': 20 * MIN, 'INT-1006': 2 * H, 'INT-1007': H, 'INT-1008': 3 * H, 'INT-1009': 8 * MIN, 'INT-1010': 45 * MIN };
  var CAPS = ['Pull reservations', 'Push guest registrations', 'Room status feed', 'Check-in / check-out events', 'Webhook notifications'];
  var CAPMAP = { 'Reservations & guest data': [1, 1, 0, 1, 0], 'Room status feed': [0, 0, 1, 0, 1] };
  I.CAPS = CAPS; I.CAPMAP = CAPMAP; /* read-only reference for the Developer Portal (Stage 5B.1) */
  var HOST = { 'StayLedger PMS': 'stayledger', 'RoomWave Cloud': 'roomwave', 'FrontDesk One': 'frontdesk-one', 'Oakbridge Hospitality Suite': 'oakbridge', NimbusStay: 'nimbusstay' };

  function mask(v, keep) { return '••••••••' + (keep ? String(v).slice(-keep) : ''); }
  function now() { return Date.now(); }
  function actor() { var u = R.me('admin'); return u ? u.name + ' (Admin, demo)' : 'Demo user'; }

  /* ---------- state ---------- */
  function codeOf(m) { return /Timeout|timed out/i.test(m) ? 'TIMEOUT' : /Rate limit/i.test(m) ? 'RATE_LIMIT' : /credential|Authentication/i.test(m) ? 'AUTH_EXPIRED' : /Partial/i.test(m) ? 'PARTIAL_PAYLOAD' : /Schema/i.test(m) ? 'SCHEMA_DRIFT' : /refused|unreachable/i.test(m) ? 'CONN_REFUSED' : /Duplicate/i.test(m) ? 'DUPLICATE_REF' : /offline/i.test(m) ? 'PORTAL_OFFLINE' : 'ERROR'; }
  I.reset = function () {
    var n = now(); I.busy = {}; I.events = []; I.seq = 0; var SYS = 'System (simulated)', ADM = 'Demo administrator (seed)';
    I.recs = SEED.map(function (s, i) {
      var o = s[8], r = { id: s[0], provider: s[1], type: s[2], estId: s[3], status: s[4], enabled: o.enabled !== false, okTs: n - s[5], errTs: s[7] == null ? 0 : n - s[7], err: s[6] || '', fault: o.fault || '', last: null, hcTs: n - HC[s[0]], opn: (o.ops || []).length,
        ops: (o.ops || []).map(function (x, j) { return { id: s[0] + '-OP' + (j + 1), label: x[0], flaky: !!x[1], ts: n - (s[7] == null ? s[5] : s[7]) }; }),
        cfg: { endpoint: 'https://sandbox.' + HOST[s[1]] + '.example/api/v2 (not a real address)', protocol: 'REST / JSON (simulated)', environment: 'Prototype sandbox', auth: 'API key + client secret', apiKey: mask('KEY' + (7391 + i * 137), 4), secret: mask('x'),
          interval: s[2] === 'Room status feed' ? 'Every 5 minutes' : 'Every 15 minutes', tz: 'Africa/Dar_es_Salaam', created: n - (60 + i * 9) * DAY } };
      var L = function (t, out, m, ago, who, x) { I.log(r, t, out, m, n - ago, who || SYS, x); };
      L('Enable', 'Success', 'Integration enabled (simulated)', 60 * DAY + i * 9 * DAY, ADM); L('Connect', 'Success', 'Connected (simulated)', 60 * DAY + i * 9 * DAY - 2 * MIN, ADM);
      L('Sync', 'Success', 'Scheduled sync completed (simulated)', s[5] + 15 * MIN); L('Sync', 'Success', 'Scheduled sync completed (simulated)', s[5]);
      if (r.errTs) L('Sync error', 'Failed', r.err, s[7], SYS, { code: codeOf(r.err) });
      if (r.status === 'Disconnected') L('Health check', 'Failed', r.err || 'Endpoint unreachable (simulated).', HC[r.id], SYS, { code: codeOf(r.err) });
      else L('Health check', r.status === 'Degraded' || !r.enabled ? 'Warning' : 'Success', r.status === 'Degraded' ? 'Reachable; ' + r.ops.length + ' failed operation(s) pending (simulated).' : !r.enabled ? 'Endpoint reachable; integration is disabled (simulated).' : 'All checks passed (simulated).', HC[r.id], SYS);
      L('Health check', 'Success', 'All checks passed (simulated).', HC[r.id] + DAY);
      return r;
    });
    var by = function (id) { return I.rec(id); }, X = function (id, t, out, m, ago, x) { I.log(by(id), t, out, m, n - ago, ADM, x); };
    X('INT-1002', 'Retry failed operation', 'Failed', 'Retry of “Arrivals fetch (timeout)” failed (simulated).', 90 * MIN, { code: 'RETRY_FAILED' });
    X('INT-1003', 'Retry failed operation', 'Success', 'Retry succeeded after rate limit (simulated).', 5 * DAY - 2 * MIN);
    X('INT-1004', 'Connect', 'Failed', 'Authentication rejected: credentials expired (simulated).', 2 * DAY, { code: 'AUTH_EXPIRED', sev: 'Critical' });
    X('INT-1004', 'Test connection', 'Failed', 'Authentication rejected: credentials expired (simulated).', DAY, { code: 'AUTH_EXPIRED', sev: 'Critical' });
    X('INT-1008', 'Test connection', 'Failed', 'Connection refused by simulated endpoint (host unreachable).', 22 * H, { code: 'CONN_REFUSED' });
    X('INT-1010', 'Disable', 'Success', 'Integration disabled (simulated). Manual entry remains available.', 20 * H);
    X('INT-1006', 'Test connection', 'Warning', 'Endpoint reachable, but 1 operation(s) are failing. Status unchanged.', 4 * H, { code: 'PARTIAL_PAYLOAD' });
  };
  /* Event record: { id, ts, intId, estId, type, outcome, status (= outcome), severity: Info|Warning|Error|Critical, msg, actor, code, diag, sim: true }.
     Stage 5A.2 callers pass (r, type, outcome, msg, ts, who); the optional x = { sev, code } adds severity and a synthetic diagnostic code. */
  I.log = function (r, type, outcome, msg, ts, who, x) {
    x = x || {}; var k = ++I.seq, sev = x.sev || { Success: 'Info', Info: 'Info', Warning: 'Warning', Failed: 'Error' }[outcome] || 'Info', bad = outcome === 'Failed' || outcome === 'Warning';
    var e = { id: 'EVT-' + ('0000' + k).slice(-4), ts: ts || now(), intId: r.id, estId: r.estId, type: type, outcome: outcome, status: outcome, severity: sev, msg: msg, actor: who || actor(), sim: true, code: x.code || '',
      diag: { 'Error code': bad ? x.code || 'NONE' : 'None', 'Correlation ID': 'SIM-' + ('00000' + (k * 7919) % 99999).slice(-5), 'Simulated duration': (90 + (k * 37) % 900) + ' ms', 'Endpoint': r.cfg.endpoint, 'Credentials': 'Not logged (masked)', 'Mode': 'Prototype simulation — not a real log' } };
    I.events.unshift(e); I.events.sort(function (a, b) { return b.ts - a.ts; }); return e;
  };
  I.eventsFor = function (id) { return I.events.filter(function (e) { return e.intId === id; }); };
  I.rec = function (id) { return (I.recs || []).filter(function (r) { return r.id === id; })[0]; };

  /* View rows: derived from state; PIL-001 mirrors the Hotel Portal's simulated offline toggle. */
  function view(r) {
    var e = R.est(r.estId), off = r.estId === 'PIL-001' && S.offline, st = off ? 'Disconnected' : r.status, err = off ? 'Hotel Portal is in simulated offline mode.' : r.err, et = off ? now() : r.errTs;
    var v = Object.assign({}, r, { estName: e ? e.name : r.estId, status: st, statusRank: RANK[st], err: err, errTs: et, offline: off, recent: !!et && now() - et <= I.RECENT_MS });
    v.health = I.health(v); return v;
  }
  /* Health state: the connection status, or "Attention Required" when an administrator has to act. */
  I.health = function (v) {
    var n = now(), ago = v.okTs ? R.rel(v.okTs) : 'never', why = '';
    if (v.offline) return { state: 'Disconnected', tone: 'danger', why: 'Hotel Portal is in simulated offline mode.', summary: 'Not exchanging data: the Hotel Portal is in simulated offline mode.' };
    if (v.status === 'Disconnected' && v.fault === 'creds') why = 'Credentials expired; renewal is outside this prototype.';
    else if (v.status === 'Disconnected' && n - v.okTs > DAY) why = 'Disconnected for more than 24 hours.';
    else if (v.status === 'Degraded' && v.ops.length >= 2) why = v.ops.length + ' failed operations are waiting.';
    else if (!v.hcTs || n - v.hcTs > DAY) why = 'No health check in the last 24 hours.';
    if (why) return { state: 'Attention Required', tone: 'warning', why: why, summary: why + ' Administrator action is needed (last successful sync ' + ago + ').' };
    var sm = v.status === 'Connected' ? (v.enabled ? 'Operating normally in the simulation; last sync ' + ago + ', no failed operations.' : 'Connection is healthy but the integration is disabled, so no data is exchanged.') :
      v.status === 'Degraded' ? 'Working with ' + v.ops.length + ' failed operation(s). Retry them or run a health check.' : 'Not exchanging data; last successful sync ' + ago + '. Try Connect.';
    return { state: v.status, tone: TONE[v.status], why: '', summary: sm };
  };
  I.all = function () { return I.recs.map(view); };
  I.one = function (id) { var r = I.rec(id); return r ? view(r) : null; };

  /* Which actions are valid right now, with the reason when not. */
  I.canDo = function (v, a) {
    if (!R.can('integrations:admin', 'admin')) return { ok: false, why: 'Requires “Integrations — administer” (the acting demo role is read-only)' };
    if (I.busy[v.id]) return { ok: false, why: 'Another simulated action is running' };
    if (v.offline) return { ok: false, why: 'Hotel Portal is in simulated offline mode — turn it off to run actions' };
    if (a === 'enable') return v.enabled ? { ok: false, why: 'Already enabled' } : { ok: true };
    if (a === 'disable') return v.enabled ? { ok: true } : { ok: false, why: 'Already disabled' };
    if (a === 'test' || a === 'health') return { ok: true };
    if (!v.enabled) return { ok: false, why: 'Enable the integration first' };
    if (a === 'connect') return v.status === 'Disconnected' ? { ok: true } : { ok: false, why: 'Already connected' };
    if (a === 'retry') return !v.ops.length ? { ok: false, why: 'No failed operations to retry' } : v.status === 'Disconnected' ? { ok: false, why: 'Connect the integration first' } : { ok: true };
    return { ok: false, why: 'Unknown action' };
  };

  /* Scripted outcomes. Returns { ok, outcome, msg }; mutates the record. */
  function simulate(r, a) {
    var n = now(), fail = function (m, code, sev) { r.err = m; r.errTs = n; return { ok: false, outcome: 'Failed', msg: m, code: code || codeOf(m), sev: sev }; };
    if (a === 'test') {
      if (r.status === 'Connected') return { ok: true, outcome: 'Success', msg: 'Handshake and authentication succeeded; simulated latency 142 ms.' };
      if (r.status === 'Degraded') return { ok: true, outcome: 'Warning', msg: 'Endpoint reachable, but ' + r.ops.length + ' operation(s) are failing. Status unchanged.' };
      return r.fault === 'creds' ? fail('Authentication rejected: credentials expired (simulated).', 'AUTH_EXPIRED', 'Critical') : fail('Connection refused by simulated endpoint (host unreachable).', 'CONN_REFUSED');
    }
    if (a === 'health') {
      r.hcTs = n; var res;
      if (r.status === 'Connected' && r.fault === 'drift') {
        r.fault = ''; r.status = 'Degraded'; r.err = 'Schema drift detected: field "room_type" renamed by provider (simulated).'; r.errTs = n; r.ops.push({ id: r.id + '-OP' + (++r.opn), label: 'Reservation import (schema drift)', flaky: false, ts: n });
        res = { ok: true, outcome: 'Warning', msg: 'Schema drift detected; status changed to Degraded with 1 failed operation.', code: 'SCHEMA_DRIFT' };
      } else if (r.status === 'Connected') res = r.enabled ? { ok: true, outcome: 'Success', msg: 'All checks passed (simulated): endpoint, authentication, schema, latency 118 ms.' } : { ok: true, outcome: 'Warning', msg: 'Endpoint reachable; integration is disabled, so no data is exchanged.' };
      else if (r.status === 'Degraded') res = { ok: true, outcome: 'Warning', msg: 'Endpoint reachable, but ' + r.ops.length + ' operation(s) are failing. Status unchanged.', code: codeOf(r.err) };
      else res = r.fault === 'creds' ? fail('Authentication rejected: credentials expired (simulated).', 'AUTH_EXPIRED', 'Critical') : fail('Endpoint unreachable (simulated).', 'CONN_REFUSED');
      r.hc = { outcome: res.outcome, msg: res.msg }; return res;
    }
    if (a === 'connect') {
      if (r.fault === 'creds') return fail('Authentication rejected: credentials expired (simulated). Credential renewal is not part of this prototype.', 'AUTH_EXPIRED', 'Critical');
      if (r.fault === 'transient') { r.fault = ''; return fail('Connection attempt timed out (simulated). A second attempt may succeed.', 'TIMEOUT'); }
      r.status = r.ops.length ? 'Degraded' : 'Connected'; r.okTs = n;
      return { ok: true, outcome: 'Success', msg: 'Connected' + (r.ops.length ? ', but ' + r.ops.length + ' failed operation(s) still need a retry.' : '.') };
    }
    if (a === 'enable') { r.enabled = true; return { ok: true, outcome: 'Success', msg: r.status === 'Disconnected' ? 'Integration enabled; connect it to resume syncing (simulated).' : 'Integration enabled; scheduled syncs may resume (simulated).' }; }
    if (a === 'disable') { r.enabled = false; return { ok: true, outcome: 'Success', msg: 'Integration disabled; no further syncs run (simulated). Manual entry remains available.' }; }
    if (a === 'retry') {
      var op = r.ops[0];
      if (op.flaky) { op.flaky = false; return fail('Retry of “' + op.label + '” failed again (simulated). Another retry may succeed.', 'RETRY_FAILED'); }
      r.ops.shift(); r.okTs = n; if (!r.ops.length && r.status === 'Degraded') r.status = 'Connected';
      return { ok: true, outcome: 'Success', msg: '“' + op.label + '” completed' + (r.ops.length ? '; ' + r.ops.length + ' still failed.' : '; no failed operations remain.') };
    }
  }

  function onRoute(id) { return location.hash.replace(/^#\/?/, '') === 'admin/pms-health/' + id; }
  I.run = function (id, a) {
    var v = I.one(id), r = I.rec(id), chk = v && I.canDo(v, a);
    if (!v || !chk.ok) { M.toast.warning('Action not available', chk ? chk.why : 'Integration not found'); return; }
    I.busy[id] = a; if (onRoute(id)) M.rerender();
    var gen = I.recs;
    setTimeout(function () {
      if (I.recs !== gen) return; /* demo data was reset while the simulated action ran: discard */
      delete I.busy[id];
      var res = simulate(r, a); r.last = { action: a, ok: res.ok, outcome: res.outcome, msg: res.msg, ts: now() };
      I.log(r, a === 'health' ? 'Health check' : ACTS[a].label, res.outcome, res.msg + ' [simulated]', null, null, { code: res.code, sev: res.sev });
      if (M.ops && M.ops.audit) M.ops.audit('Integration action (simulated)', 'Integrations', r.id, ACTS[a].label + ' — ' + r.provider + ' @ ' + v.estName + ': ' + res.msg, res.ok ? 'Success' : 'Failed');
      M.toast[res.ok ? (res.outcome === 'Warning' ? 'warning' : 'success') : 'danger'](ACTS[a].label + (res.ok ? ' — done (simulated)' : ' — failed (simulated)'), res.msg);
      if (onRoute(id)) M.rerender(); else if (location.hash.replace(/^#\/?/, '') === 'admin/pms-health') M.rerender();
    }, 900);
  };
  M.actions.on('integ-act', function (el) {
    var a = el.getAttribute('data-act'), id = el.getAttribute('data-id'), v = I.one(id);
    if (a !== 'disable') return I.run(id, a);
    if (!v || !I.canDo(v, 'disable').ok) return I.run(id, a);
    M.modal.open({ title: 'Disable integration?', body: '<p>' + esc(v.provider) + ' at <strong>' + esc(v.estName) + '</strong> will stop syncing. ' + esc(SIM_NOTE) + ' Manual entry is unaffected.</p>', actions: [{ label: 'Cancel' }, { label: 'Disable (simulated)', variant: 'danger', onClick: function () { I.run(id, 'disable'); } }] });
  });

  /* ---------- shared bits ---------- */
  function crumbs(last) { var a = [{ label: 'System Administration', href: '#/admin/dashboard' }, last ? { label: 'Integration Dashboard', href: '#/admin/pms-health' } : { label: 'Integration Dashboard' }]; if (last) a.push({ label: last }); return a; }
  function sel(id, label, opts) { return '<select class="select input-sm" id="' + id + '" aria-label="' + esc(label) + '"><option value="">' + esc(label) + ': All</option>' + opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>'; }
  function stateBadges(v) { return UI.badge(v.status, TONE[v.status]) + (v.enabled ? '' : ' ' + UI.badge('Disabled', 'neutral')) + (v.health.state === 'Attention Required' ? ' ' + UI.badge('Attention Required', 'warning', { dot: false }) : ''); }
  function oTone(o) { return { Success: 'success', Failed: 'danger', Warning: 'warning', Info: 'info' }[o] || 'neutral'; }
  function sTone(o) { return { Info: 'info', Warning: 'warning', Error: 'danger', Critical: 'danger' }[o] || 'neutral'; }
  function stats(rows) {
    var c = function (s) { return rows.filter(function (r) { return r.status === s; }).length; };
    return [{ label: 'Total integrations', value: rows.length, icon: 'activity', foot: rows.reduce(function (a, r) { return a.indexOf(r.estId) < 0 ? a.concat(r.estId) : a; }, []).length + ' properties · ' + rows.filter(function (r) { return !r.enabled; }).length + ' disabled' },
      { label: 'Connected', value: c('Connected'), icon: 'check-circle', tone: 'green', foot: 'simulated state' },
      { label: 'Degraded', value: c('Degraded'), icon: 'alert', tone: 'orange', foot: 'working with errors' },
      { label: 'Disconnected', value: c('Disconnected'), icon: 'lock', tone: 'red', foot: 'not exchanging data' },
      { label: 'Recent failures', value: rows.filter(function (r) { return r.recent; }).length, icon: 'flag', tone: 'red', foot: 'error in the last 24 h' }];
  }
  var BANNER = UI.alert('orange', 'Prototype data — simulated connectivity.', 'Provider names, statuses, sync times, errors and action results are synthetic and held in this browser tab. No real PMS, vendor API or government system is called or monitored.');

  /* ---------- listing (5A.1) ---------- */
  function listPage() {
    return UI.pageHead({ crumbs: crumbs(), title: 'Integration dashboard', description: 'PMS integrations by property: connection status, last successful sync and last error.', actions: UI.button({ label: 'Event history', icon: 'clipboard', variant: 'secondary', href: '#/admin/integration-events' }) + UI.button({ label: 'Establishments', icon: 'building', variant: 'secondary', href: '#/admin/establishments' }) }) +
      '<div class="stack">' + BANNER + '<div class="grid cols-5">' + stats(I.all()).map(UI.statCard).join('') + '</div>' + UI.card({ title: 'Integrations', subtitle: 'Simulated records', flush: true, body: '<div id="integ-table"></div>' }) + '</div>';
  }
  function listMount(root) {
    var all = I.all(), ctl, href = function (r) { return '#/admin/pms-health/' + r.id; };
    ctl = UI.table.mount(root.querySelector('#integ-table'), { caption: 'Integrations (simulated)', rows: all, pageSize: 8, searchKeys: ['provider', 'estName', 'id', 'type', 'err'], searchPlaceholder: 'Search provider, property, error…',
      filter: { key: 'status', label: 'Status', options: STATUSES }, toolbarExtra: sel('if-prov', 'Provider', all.reduce(function (a, r) { return a.indexOf(r.provider) < 0 ? a.concat(r.provider) : a; }, []).sort()), emptyText: 'No integrations match the current search and filters.',
      columns: [{ key: 'provider', label: 'Integration', sortable: true, render: function (r) { return '<a class="cell-main" href="' + href(r) + '">' + esc(r.provider) + '</a><div class="cell-sub">' + esc(r.id) + ' · ' + esc(r.type) + '</div>'; } },
        { key: 'estName', label: 'Property', sortable: true, render: function (r) { return '<a href="#/admin/establishments/' + esc(r.estId) + '">' + esc(r.estName) + '</a><div class="cell-sub">' + esc(r.estId) + '</div>'; } },
        { key: 'statusRank', label: 'Status', sortable: true, render: function (r) { return stateBadges(r) + '<div class="cell-sub">Simulated</div>'; } },
        { key: 'okTs', label: 'Last successful sync', sortable: true, render: function (r) { return r.okTs ? '<span title="' + esc(R.fmt(r.okTs)) + '">' + esc(R.rel(r.okTs)) + '</span>' : '<span class="muted">Never</span>'; } },
        { key: 'err', label: 'Last error', render: function (r) { return r.err ? '<div>' + esc(r.err) + '</div><div class="cell-sub" title="' + esc(R.fmt(r.errTs)) + '">' + esc(R.rel(r.errTs)) + (r.recent ? ' · recent' : '') + '</div>' : '<span class="muted">None recorded</span>'; } },
        { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'secondary', href: href(r), aria: 'Details for ' + r.provider + ' at ' + r.estName }); } }] });
    root.querySelector('#if-prov').addEventListener('change', function (e) { ctl.setRows(all.filter(function (r) { return !e.target.value || r.provider === e.target.value; })); });
  }

  /* ---------- details (5A.2) ---------- */
  function actionBtn(v, a, variant) {
    var c = I.canDo(v, a), busy = I.busy[v.id] === a, o = { label: busy ? ACTS[a].busy : ACTS[a].label, icon: busy ? 'refresh' : ACTS[a].icon, variant: variant || 'secondary', action: 'integ-act', data: { act: a, id: v.id }, disabled: !c.ok };
    return c.ok ? UI.button(o) : '<span title="' + esc(busy ? 'Running (simulated)…' : c.why) + '">' + UI.button(Object.assign(o, { action: null, data: null })) + '</span>';
  }
  function kv(rows) { return '<dl class="kv">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + (r[2] ? r[1] : esc(r[1])) + '</dd>'; }).join('') + '</dl>'; }
  function detailPage(id) {
    var v = I.one(id);
    if (!v) return UI.pageHead({ crumbs: crumbs('Not found'), title: 'Integration not found' }) + UI.card({ body: UI.empty({ icon: 'search', title: 'Integration not found', body: 'It may not exist in this prototype dataset or the address is wrong.', actions: UI.button({ label: 'Back to integration dashboard', variant: 'primary', href: '#/admin/pms-health' }) }) });
    var busy = I.busy[id], ev = I.eventsFor(id).slice(0, 8), last = I.rec(id).last, caps = CAPMAP[v.type] || [], c = v.cfg;
    var acts = actionBtn(v, 'health', 'primary') + actionBtn(v, 'test') + actionBtn(v, 'connect', 'primary') + actionBtn(v, 'enable') + actionBtn(v, 'disable') + actionBtn(v, 'retry') + UI.button({ label: 'Back to list', icon: 'arrow-right', variant: 'ghost', href: '#/admin/pms-health' });
    return UI.pageHead({ crumbs: crumbs(v.provider + ' · ' + v.estName), title: v.provider, description: esc(v.id) + ' · ' + esc(v.type) + ' · <a href="#/admin/establishments/' + esc(v.estId) + '">' + esc(v.estName) + '</a>', actions: acts }) +
      '<div class="stack">' + UI.alert('orange', 'Simulated actions.', esc(SIM_NOTE) + ' Outcomes are scripted and kept in this browser tab only.') +
      (v.offline ? UI.alert('warning', 'Hotel Portal is in simulated offline mode.', 'This integration shows as Disconnected and actions are paused until offline mode is switched off.') : '') +
      (busy ? UI.alert('info', ACTS[busy].busy.replace('…', '') + ' (simulated)…', 'Please wait a moment.') : '') +
      (last && !busy ? UI.alert(last.ok ? (last.outcome === 'Warning' ? 'warning' : 'success') : 'danger', ACTS[last.action].label + (last.ok ? ' completed' : ' failed') + ' (simulated).', esc(last.msg) + ' <span class="muted">' + esc(R.rel(last.ts)) + '</span>') : '') +
      '<div class="grid main-side"><div class="stack">' +
      UI.card({ title: 'Connection', subtitle: 'Simulated state', body: kv([['Status', stateBadges(v), 1], ['Enabled', v.enabled ? 'Yes' : 'No — no data is exchanged'], ['Property', '<a href="#/admin/establishments/' + esc(v.estId) + '">' + esc(v.estName) + '</a> <span class="muted">(' + esc(v.estId) + ')</span>', 1],
        ['Last successful sync', v.okTs ? R.fmt(v.okTs) + ' (' + R.rel(v.okTs) + ')' : 'Never'], ['Last error', v.err ? v.err + ' — ' + R.rel(v.errTs) : 'None recorded']]) }) +
      UI.card({ title: 'Health', subtitle: 'Simulated health check — local scripted result', body: '<div class="row" style="margin-bottom:var(--sp-4)">' + UI.badge(v.health.state, v.health.tone) + '<span class="muted">' + esc(v.health.summary) + '</span></div>' + kv([['Connection status', stateBadges(v), 1],
        ['Last health check', v.hcTs ? R.fmt(v.hcTs) + ' (' + R.rel(v.hcTs) + ')' + (I.rec(id).hc ? ' — ' + I.rec(id).hc.outcome : '') : 'Never'], ['Last successful sync', v.okTs ? R.rel(v.okTs) : 'Never'],
        ['Recent failed operations', v.ops.length ? v.ops.length + ': ' + v.ops.map(function (o) { return o.label; }).join('; ') : 'None'], ['Last error / diagnostic', v.err ? v.err + ' (' + (codeOf(v.err)) + ', ' + R.rel(v.errTs) + ')' : 'None recorded']]),
        foot: 'Not live monitoring. No PMS or government system is contacted.' }) +
      UI.card({ title: 'Failed operations', subtitle: 'Retry applies to the oldest first (simulated)', body: v.ops.length ? v.ops.map(function (o) { return '<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><div class="t">' + esc(o.label) + '</div><div class="s">' + esc(o.id) + ' · failed ' + esc(R.rel(o.ts)) + '</div></div>' + UI.badge('Failed', 'danger') + '</div>'; }).join('') : UI.empty({ icon: 'check-circle', title: 'No failed operations', body: 'Nothing is waiting for a retry.' }) }) +
      UI.card({ title: 'Recent activity', subtitle: 'Latest ' + ev.length + ' events', flush: true, foot: '<a href="#/admin/integration-events/' + v.id + '">Open full event history for this integration</a>', body: ev.length ? ev.map(function (e) { return '<div class="list-row"><div class="grow"><div class="t">' + esc(e.type) + ' <span class="muted">· ' + esc(e.msg) + '</span></div><div class="s" title="' + esc(R.fmt(e.ts)) + '">' + esc(e.actor + ' · ' + R.rel(e.ts)) + '</div></div>' + UI.badge(e.outcome, oTone(e.outcome)) + '</div>'; }).join('') : UI.empty({ icon: 'inbox', title: 'No activity yet', body: 'Run a simulated action to record an event.' }) }) +
      '</div><div class="stack">' +
      UI.card({ title: 'Capabilities', body: CAPS.map(function (n, i) { return '<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow t">' + esc(n) + '</div>' + UI.badge(caps[i] ? 'Supported' : 'Not supported', caps[i] ? 'success' : 'neutral', { dot: false }) + '</div>'; }).join('') }) +
      UI.card({ title: 'Configuration', subtitle: 'Credentials are masked and never shown', body: kv([['Endpoint', c.endpoint], ['Protocol', c.protocol], ['Environment', c.environment], ['Authentication', c.auth], ['API key', c.apiKey], ['Client secret', c.secret], ['Sync interval', c.interval], ['Time zone', c.tz], ['Configured', R.fmt(c.created)]]), foot: 'Synthetic values. Editing configuration is not part of this prototype.' }) +
      '</div></div></div>';
  }

  M.pages['admin/pms-health'] = {
    title: function (c) { var v = c.sub && I.one(c.sub); return v ? v.provider + ' · ' + v.estName : 'Integration Dashboard'; },
    render: function (c) { return c.sub ? detailPage(c.sub) : listPage(); },
    mount: function (root, c) { if (!c.sub) listMount(root); }
  };

  /* ---------- event history (5A.3) ---------- */
  function evRows() { return I.events.map(function (e) { var r = I.rec(e.intId), est = R.est(e.estId); return Object.assign({}, e, { provider: r ? r.provider : e.intId, estName: est ? est.name : e.estId, sevRank: { Info: 0, Warning: 1, Error: 2, Critical: 3 }[e.severity] }); }); }
  function evDetail(id) {
    var e = evRows().filter(function (x) { return x.id === id; })[0]; if (!e) return;
    M.modal.open({ title: 'Event ' + e.id, size: 'lg', body: UI.alert('orange', 'Synthetic event.', 'Simulated prototype record, not a real operational log.') + '<div style="margin-top:var(--sp-4)">' + kv([['Time', R.fmt(e.ts) + ' (' + R.rel(e.ts) + ')'], ['Integration', e.provider + ' · ' + e.intId], ['Property', e.estName + ' (' + e.estId + ')'], ['Event type', e.type],
      ['Severity', UI.badge(e.severity, sTone(e.severity), { dot: false }), 1], ['Status', UI.badge(e.status, oTone(e.status)), 1], ['Recorded by', e.actor], ['Message', e.msg]]) + '<h4 style="margin:var(--sp-5) 0 var(--sp-2);font-size:var(--fs-sm)">Diagnostic information</h4>' + kv(Object.keys(e.diag).map(function (k) { return [k, e.diag[k]]; })) + '</div>',
      actions: [{ label: 'Close', variant: 'primary' }] });
  }
  M.actions.on('ev-open', function (el) { evDetail(el.getAttribute('data-id')); });
  function evPage(pre) {
    var ev = evRows(), day = now() - DAY, c = function (f) { return ev.filter(f).length; };
    return UI.pageHead({ crumbs: [{ label: 'System Administration', href: '#/admin/dashboard' }, { label: 'Integration Dashboard', href: '#/admin/pms-health' }, { label: 'Event history' }], title: 'Integration event history', description: 'Simulated integration events: tests, connection attempts, health checks, sync failures, retries and enable/disable actions.',
      actions: UI.button({ label: 'Integration dashboard', icon: 'activity', variant: 'secondary', href: '#/admin/pms-health' }) }) +
      '<div class="stack">' + BANNER + '<div class="grid cols-4">' + [{ label: 'Events', value: ev.length, icon: 'clipboard', foot: 'in this session' }, { label: 'Failed', value: c(function (e) { return e.status === 'Failed'; }), icon: 'alert', tone: 'red', foot: 'status Failed' },
        { label: 'Warnings', value: c(function (e) { return e.status === 'Warning'; }), icon: 'flag', tone: 'orange', foot: 'status Warning' }, { label: 'Last 24 hours', value: c(function (e) { return e.ts >= day; }), icon: 'clock', foot: 'recorded events' }].map(UI.statCard).join('') + '</div>' +
      UI.card({ title: 'Events', subtitle: 'Newest first · synthetic data', flush: true, body: '<div id="ev-table"></div>' }) + '</div>';
  }
  function evMount(root, pre) {
    var all = evRows(), ctl, uniq = function (k) { return all.reduce(function (a, r) { return a.indexOf(r[k]) < 0 ? a.concat(r[k]) : a; }, []); };
    var extra = sel('ev-int', 'Integration', I.recs.map(function (r) { return r.id; })) + sel('ev-type', 'Type', uniq('type').sort()) + sel('ev-sev', 'Severity', ['Info', 'Warning', 'Error', 'Critical']);
    ctl = UI.table.mount(root.querySelector('#ev-table'), { caption: 'Integration events (simulated)', rows: all, pageSize: 10, searchKeys: ['provider', 'estName', 'intId', 'msg', 'type', 'id'], searchPlaceholder: 'Search integration, property or message…',
      filter: { key: 'status', label: 'Status', options: ['Success', 'Warning', 'Failed'] }, toolbarExtra: extra, emptyText: 'No events match the current search and filters.',
      columns: [{ key: 'ts', label: 'Time', sortable: true, render: function (r) { return '<span title="' + esc(R.fmt(r.ts)) + '">' + esc(R.fmt(r.ts)) + '</span><div class="cell-sub">' + esc(R.rel(r.ts)) + '</div>'; } },
        { key: 'provider', label: 'Integration', sortable: true, render: function (r) { return '<a class="cell-main" href="#/admin/pms-health/' + r.intId + '">' + esc(r.provider) + '</a><div class="cell-sub">' + esc(r.estName) + ' · ' + esc(r.intId) + '</div>'; } },
        { key: 'type', label: 'Type', sortable: true }, { key: 'sevRank', label: 'Severity', sortable: true, render: function (r) { return UI.badge(r.severity, sTone(r.severity), { dot: false }); } },
        { key: 'status', label: 'Status', sortable: true, render: function (r) { return UI.badge(r.status, oTone(r.status)); } }, { key: 'msg', label: 'Message', render: function (r) { return '<div style="min-width:220px">' + esc(r.msg) + '</div>'; } },
        { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'secondary', action: 'ev-open', data: { id: r.id }, aria: 'Details for event ' + r.id }); } }] });
    function apply() { var i = root.querySelector('#ev-int').value, t = root.querySelector('#ev-type').value, v = root.querySelector('#ev-sev').value; ctl.setRows(all.filter(function (r) { return (!i || r.intId === i) && (!t || r.type === t) && (!v || r.severity === v); })); }
    ['ev-int', 'ev-type', 'ev-sev'].forEach(function (i) { root.querySelector('#' + i).addEventListener('change', apply); });
    if (pre && I.rec(pre)) { root.querySelector('#ev-int').value = pre; apply(); }
  }
  M.pages['admin/integration-events'] = { title: 'Integration Event History', render: function (c) { return evPage(c.sub); }, mount: function (root, c) { evMount(root, c.sub); } };

  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(I.reset); I.reset();
})(window);
