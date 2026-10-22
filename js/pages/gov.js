/* Msafiri — Government Portal Stage 3 (SYNTHETIC / SIMULATED). Reads the same Msafiri.store as the Hotel Portal.
   Frontend checks only: this is a demonstration of an access-control workflow, not production security. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, S = M.store, USER = 'Joseph Ndege (Gov, demo)';
  var PURPOSES = ['Sample purpose 1 (placeholder)', 'Sample purpose 2 (placeholder)', 'Sample purpose 3 (placeholder)'];
  var STATUSES = ['Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict', 'Not reported'];
  function crumbs(l) { return [{ label: 'Government Portal', href: '#/gov/dashboard' }, { label: l }]; }
  function note(t) { return UI.alert('info', 'Demonstration data.', esc(t)); }
  var SEC = 'Simulated access-control workflow. Frontend checks alone are not production-grade security.';

  /* ---- masking ---- */
  function mName(n) { return String(n).split(' ').map(function (w) { return w[0] + '••••'; }).join(' '); }
  function mDoc(n) { return '•••••••' + String(n).slice(-2); }
  function mDob() { return '••••-••-••'; }

  /* ---- establishments (synthetic; PIL-001 is live from the shared hotel store; edited via Administration) ---- */
  /* Master records live in Msafiri.dir (js/admin-data.js) so admin edits appear here. */
  function establishments() { return M.dir.estView(); }
  function sum(a, k) { return a.reduce(function (t, x) { return t + x[k]; }, 0); }

  /* ================= Dashboard ================= */
  var range = 14;
  var PRIOR = [520, 548, 531, 575, 610, 642, 655, 590, 563, 588, 612, 640, 628];
  function trend(total) {
    var vals = PRIOR.concat([total]).slice(-range), labels = vals.map(function (_, i) { var d = new Date(Date.now() - (vals.length - 1 - i) * 864e5); return String(d.getDate()); });
    return M.lineChart({ area: true, labels: labels, ariaLabel: 'Registrations per day, last ' + range + ' days (sample data)', series: [{ name: 'Registrations', values: vals, color: 'var(--chart-1)' }] });
  }
  M.pages['gov/dashboard'] = {
    title: 'Government Overview',
    render: function (ctx) {
      var E = establishments(), act = E.filter(function (e) { return e.status === 'Active'; }), tot = sum(E, 'reg');
      var cards = [
        { label: 'Registered establishments', value: E.length, icon: 'building', delta: 'Pilot planning context', dtone: 'flat', tone: 'up', foot: 'sample list, not onboarded sites' },
        { label: 'Active establishments', value: act.length, icon: 'activity', tone: 'orange', delta: (E.length - act.length) + ' inactive/onboarding', dtone: 'flat', foot: '', accent: true },
        { label: 'Guest registrations today', value: tot, icon: 'users', delta: 'sum of establishments', dtone: 'flat', tone: 'up', foot: 'sample data' },
        { label: 'Arrivals / departures', value: sum(E, 'arr') + ' / ' + sum(E, 'dep'), icon: 'log-in', delta: 'today', dtone: 'flat', tone: 'up', foot: 'sample data' },
        { label: 'Pending submissions', value: sum(E, 'pend'), icon: 'send', tone: 'red', delta: 'not yet acknowledged', dtone: 'flat', foot: 'simulated status' },
        { label: 'Failed submissions', value: sum(E, 'fail'), icon: 'alert', delta: 'rejected (simulated)', dtone: sum(E, 'fail') ? 'down' : 'flat', tone: 'down', foot: '' },
        { label: 'Data-quality issues', value: sum(E, 'qual'), icon: 'flag', delta: 'demo validation rules', dtone: 'flat', tone: 'down', foot: '' },
        { label: 'System availability', value: '99.9%', icon: 'shield-check', delta: 'sample figure', dtone: 'flat', tone: 'up', foot: 'not live monitoring' }];
      var segs = [['Pending', sum(E, 'pend'), 'var(--warning-500)'], ['Failed', sum(E, 'fail'), 'var(--danger-500)']].map(function (x) { return { label: x[0], value: x[1], color: x[2] }; });
      return UI.pageHead({ crumbs: crumbs('Overview'), title: 'Government overview', description: esc(ctx.user.role) + ' · demonstration workspace',
        actions: UI.button({ label: 'Search guest records', icon: 'search', variant: 'accent', href: '#/gov/search' }) }) + '<div class="stack">' +
        note('All figures are SAMPLE data. Demo Hotel A (PIL-001) is live from the shared Hotel Portal state; the other establishments are synthetic. Not real national statistics and not live monitoring.') +
        '<div class="grid cols-4">' + cards.map(UI.statCard).join('') + '</div>' +
        '<div class="grid main-side"><div class="stack">' +
        UI.card({ title: 'Registrations per day', subtitle: 'Sample trend; today = sum of establishments', actions: '<div class="segmented" role="group" aria-label="Date range">' + [[7, '7 days'], [14, '14 days']].map(function (r) { return '<button type="button" data-action="g-trend" data-n="' + r[0] + '" aria-pressed="' + (r[0] === range) + '">' + r[1] + '</button>'; }).join('') + '</div>', body: '<div id="g-trend">' + trend(tot) + '</div>' }) +
        UI.card({ title: 'Establishments needing follow-up', subtitle: 'Failed or pending submissions (sample)', flush: true, body: '<div id="g-follow"></div>' }) +
        '</div><div class="stack">' +
        UI.card({ title: 'Open submission issues', body: M.donutChart({ segments: segs, centerLabel: 'Open', ariaLabel: 'Pending and failed submissions' }), foot: '<a href="#/gov/submission-quality">Open submission monitoring</a>' }) +
        UI.card({ title: 'Recent audit activity', flush: true, body: S.audit.slice(0, 5).map(function (a) { return '<div class="list-row"><div class="grow"><div class="t">' + esc(a.type) + ' · ' + esc(a.target) + '</div><div class="s">' + esc(a.user + ' · ' + a.t) + '</div></div>' + UI.statusBadge(a.outcome) + '</div>'; }).join(''), foot: '<a href="#/gov/audit">Open audit history</a>' }) +
        '</div></div></div>';
    },
    mount: function (root) {
      var E = establishments().filter(function (e) { return e.fail || e.pend > 3; });
      UI.table.mount(root.querySelector('#g-follow'), { caption: 'Follow-up', rows: E, pageSize: 5, searchKeys: ['name', 'id'], searchPlaceholder: 'Search establishment…',
        columns: [{ key: 'name', label: 'Establishment', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.id) + '</div>'; } },
          { key: 'pend', label: 'Pending', sortable: true, align: 'right' }, { key: 'fail', label: 'Failed', sortable: true, align: 'right' },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'ghost', action: 'g-est-view', data: { id: r.id } }); } }] });
    }
  };
  M.actions.on('g-trend', function (el) { range = +el.getAttribute('data-n'); document.querySelectorAll('[data-action="g-trend"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); }); document.getElementById('g-trend').innerHTML = trend(sum(establishments(), 'reg')); });

  /* ================= Establishment directory ================= */
  M.pages['gov/establishments'] = {
    title: 'Establishment Monitoring',
    render: function () { return UI.pageHead({ crumbs: crumbs('Establishments'), title: 'Establishment directory', description: 'Synthetic establishments. No licensing or approval decision is implied.' }) + '<div class="stack">' + note('Pilot (~20) and national (~1,500) figures are planning context only; these are not onboarded sites.') + UI.card({ flush: true, body: '<div id="est-table"></div>' }) + '</div>'; },
    mount: function (root) {
      UI.table.mount(root.querySelector('#est-table'), { caption: 'Establishments', rows: establishments(), pageSize: 8, searchKeys: ['name', 'id', 'loc', 'cat'], searchPlaceholder: 'Search name, reference, location…',
        filter: { key: 'status', label: 'Operational status', options: M.dir.STATUS },
        columns: [{ key: 'name', label: 'Establishment', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.id) + ' · ' + esc(r.cat) + '</div>'; } },
          { key: 'loc', label: 'Location', sortable: true },
          { key: 'status', label: 'Status', sortable: true, render: function (r) { return UI.badge(r.status, r.status === 'Active' ? 'success' : r.status === 'Onboarding' ? 'info' : 'neutral'); } },
          { key: 'onb', label: 'Onboarding' },
          { key: 'pms', label: 'PMS', render: function (r) { return UI.badge(r.pms, /Simulated/.test(r.pms) ? 'info' : 'neutral'); } },
          { key: 'last', label: 'Last report' },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'ghost', action: 'g-est-view', data: { id: r.id } }); } }] });
    }
  };
  M.actions.on('g-est-view', function (el) {
    var e = establishments().filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; if (!e) return;
    S.aud(USER, 'Record view', e.id, 'Viewed establishment details');
    M.modal.open({ title: e.name, body: (e.sample ? UI.alert('info', 'Sample figures.', 'Synthetic values for demonstration.') : UI.alert('info', 'Live from shared demo state.', 'Counts come from the Hotel Portal records.')) +
      '<dl class="kv"><dt>Reference</dt><dd>' + esc(e.id) + '</dd><dt>Contact</dt><dd>' + esc(e.contact || '—') + ' · ' + esc(e.phone || '—') + ' · ' + esc(e.email || '—') + '</dd><dt>Address</dt><dd>' + esc(e.address || '—') + '</dd><dt>Profile completeness</dt><dd>' + e.pct + '%</dd><dt>Category</dt><dd>' + esc(e.cat) + '</dd><dt>Location</dt><dd>' + esc(e.loc) + '</dd><dt>Operational status</dt><dd>' + esc(e.status) + '</dd><dt>Onboarding</dt><dd>' + esc(e.onb) + '</dd><dt>PMS / integration</dt><dd>' + esc(e.pms) + '</dd><dt>Registrations today</dt><dd>' + e.reg + '</dd><dt>Arrivals / departures</dt><dd>' + e.arr + ' / ' + e.dep + '</dd><dt>Pending / failed</dt><dd>' + e.pend + ' / ' + e.fail + '</dd><dt>Data-quality issues</dt><dd>' + e.qual + '</dd><dt>Last report</dt><dd>' + esc(e.last) + '</dd></dl>', actions: [{ label: 'Close', variant: 'primary' }] });
  });

  /* ================= Guest record search ================= */
  var q = { purpose: '', cs: '', name: '', doc: '', nat: '', est: '', from: '', to: '', stay: '', sub: '', errors: {}, loading: false, results: null };
  function sel(id, label, opts, v, o) { return UI.select(Object.assign({ id: id, label: label, options: opts, placeholder: 'Any', value: v }, o || {})); }
  M.pages['gov/search'] = {
    title: 'Guest Record Search',
    render: function () {
      var e = q.errors, nats = [], E = establishments();
      S.recs.forEach(function (r) { if (nats.indexOf(r.nat) < 0) nats.push(r.nat); });
      var res = q.loading ? UI.alert('info', 'Searching…', 'Running demonstration search.') : q.results === null ? UI.empty ? '' : '' : '<div id="res-table"></div>';
      return UI.pageHead({ crumbs: crumbs('Guest Record Search'), title: 'Guest record search', description: 'Purpose and case reference are required for every search. Results are masked.' }) + '<div class="stack">' +
        UI.alert('warning', 'Purpose-bound access (demonstration).', 'Purpose options are configurable SAMPLE values pending governance and legal confirmation — not official categories. ' + SEC) +
        '<form id="s-form" novalidate onsubmit="return false">' +
        UI.card({ title: '1 · Purpose of search', body: '<div class="form-grid">' + sel('s-purpose', 'Purpose of search', M.ops.names('purposes'), q.purpose, { required: true, placeholder: 'Select a purpose…', error: e.purpose }) + UI.input({ id: 's-case', label: 'Case / reference number', required: true, value: q.cs, error: e.cs, hint: '4–24 letters, digits, - or /' }) + '</div>' }) +
        UI.card({ title: '2 · Criteria', subtitle: 'Identifying criteria (name, document number) are recorded in the audit history as criteria types only.', body: '<div class="form-grid">' + UI.input({ id: 's-name', label: 'Guest name', value: q.name }) + UI.input({ id: 's-doc', label: 'Identification / passport number', value: q.doc, error: e.doc }) + sel('s-nat', 'Nationality', nats, q.nat) + sel('s-est', 'Establishment', E.map(function (x) { return { value: x.id, label: x.name }; }), q.est, { hint: 'Only Demo Hotel A has guest records in the demo dataset.' }) +
          UI.input({ id: 's-from', label: 'Arrival from', type: 'date', value: q.from }) + UI.input({ id: 's-to', label: 'Arrival to', type: 'date', value: q.to, error: e.range }) + sel('s-stay', 'Registration status', ['Expected', 'Checked in', 'Checked out', 'Cancelled', 'Draft'], q.stay) + sel('s-sub', 'Government status', STATUSES, q.sub) + '</div>' +
          '<div class="form-actions">' + UI.button({ label: 'Clear', variant: 'ghost', action: 'g-clear' }) + UI.button({ label: q.loading ? 'Searching…' : 'Search', icon: 'search', variant: 'accent', action: 'g-search', disabled: q.loading }) + '</div>' }) + '</form>' + res + '</div>';
    },
    mount: function (root) { if (q.results !== null && !q.loading) tableResults(root); }
  };
  function tableResults(root) {
    UI.table.mount(root.querySelector('#res-table'), { caption: 'Search results (masked)', rows: q.results, pageSize: 6, emptyText: 'No records match these criteria in the demonstration dataset.',
      columns: [{ key: 'ref', label: 'Reference', sortable: true, render: function (r) { return '<span class="mono">' + esc(r.ref) + '</span>'; } },
        { key: 'guest', label: 'Guest (masked)', render: function (r) { return esc(mName(r.guest)) + '<div class="cell-sub">' + esc(r.docType) + ' ' + mDoc(r.docNo) + '</div>'; } },
        { key: 'nat', label: 'Nationality', sortable: true }, { key: 'arrival', label: 'Arrival', sortable: true }, { key: 'departure', label: 'Departure' },
        { key: 'stay', label: 'Stay' }, { key: 'sub', label: 'Government', render: function (r) { return UI.statusBadge(r.sub); } },
        { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'View', size: 'sm', variant: 'secondary', action: 'g-view', data: { ref: r.ref } }); } }] });
  }
  function readForm() { var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }; q.purpose = v('s-purpose'); q.cs = v('s-case'); q.name = v('s-name'); q.doc = v('s-doc'); q.nat = v('s-nat'); q.est = v('s-est'); q.from = v('s-from'); q.to = v('s-to'); q.stay = v('s-stay'); q.sub = v('s-sub'); }
  M.actions.on('g-clear', function () { if (q.loading) return; q = { purpose: '', cs: '', name: '', doc: '', nat: '', est: '', from: '', to: '', stay: '', sub: '', errors: {}, loading: false, results: null }; M.rerender(); });
  M.actions.on('g-search', function () {
    if (q.loading) return; /* Stage 8.2: one search at a time — a second click used to run the search and write the audit entry twice */
    if (!M.dir.can('guestsearch:read', 'gov')) { M.toast.danger('Not permitted', 'Your demo role does not hold Guest record search — read.'); return; }
    readForm(); var e = {}, ident = [];
    if (!q.purpose) e.purpose = 'Select a purpose of search.';
    if (!q.cs) e.cs = 'Enter a case / reference number.'; else if (!/^[A-Za-z0-9\-\/]{4,24}$/.test(q.cs)) e.cs = 'Use 4–24 letters, digits, - or /.';
    if (q.doc && q.doc.length < 3) e.doc = 'Enter at least 3 characters.';
    if (q.from && q.to && q.to < q.from) e.range = 'End date is before start date.';
    q.errors = e;
    if (e.purpose || e.cs) {
      S.aud(USER, 'Search blocked', '—', 'Missing: ' + [e.purpose ? 'purpose' : '', e.cs ? 'case reference' : ''].filter(Boolean).join(' and '), 'Blocked');
      q.results = null; M.rerender(); M.toast.danger('Search blocked', 'Purpose and a valid case reference are required.'); return;
    }
    if (Object.keys(e).length) { M.rerender(); M.toast.danger('Check the criteria', 'Fix the highlighted fields.'); return; }
    if (q.name) ident.push('name'); if (q.doc) ident.push('ID/passport number');
    q.loading = true; M.rerender();
    var started = location.hash;
    setTimeout(function () {
      q.results = S.recs.filter(function (r) {
        return (!q.name || r.guest.toLowerCase().indexOf(q.name.toLowerCase()) > -1) && (!q.doc || String(r.docNo).toLowerCase().indexOf(q.doc.toLowerCase()) > -1) && (!q.nat || r.nat === q.nat) && (!q.est || q.est === 'PIL-001') &&
          (!q.from || r.arrival >= q.from) && (!q.to || r.arrival <= q.to) && (!q.stay || r.stay === q.stay) && (!q.sub || r.sub === q.sub);
      });
      S.aud(USER, ident.length ? 'Identifying search' : 'Record search', q.cs, 'Purpose: ' + q.purpose + ' · Case: ' + q.cs + ' · Criteria: ' + (ident.concat(['nat', 'est', 'dates', 'status'].filter(function (k, i) { return [q.nat, q.est, q.from || q.to, q.stay || q.sub][i]; })).join(', ') || 'none') + ' · Results: ' + q.results.length);
      q.loading = false;
      if (M.onRoute(started)) M.rerender(); /* Stage 8.2: results stay in q for when the person returns; never redraw a different page */
    }, 600);
  });

  /* ---- record detail with controlled unmasking ---- */
  function openDetail(ref, log) {
    var r = S.get(ref); if (!r) { M.toast.danger('Record unavailable', 'It is no longer in the demonstration dataset.'); return; }
    if (log !== false) S.aud(USER, 'Record view', ref, 'Viewed record (' + (S.unmasked[ref] ? 'unmasked' : 'masked') + ') · case ' + (q.cs || 'n/a'));
    var canUnmask = M.dir.can('guestsearch:approve', 'gov'), u = S.unmasked[ref] && canUnmask, trail = S.audit.filter(function (a) { return a.target === ref; }).slice(0, 8);
    M.modal.open({ title: 'Guest record ' + ref,
      body: (u ? UI.alert('warning', 'Unmasked for this demonstration session.', 'Sensitive fields are visible. Action is logged. ' + SEC) : UI.alert('info', 'Sensitive fields masked.', 'Request unmasking to reveal them (justification required, logged).')) +
        '<dl class="kv"><dt>Guest</dt><dd>' + esc(u ? r.guest : mName(r.guest)) + '</dd><dt>' + esc(r.docType) + ' number</dt><dd>' + esc(u ? r.docNo : mDoc(r.docNo)) + '</dd><dt>Date of birth</dt><dd>' + esc(u ? r.dob : mDob()) + '</dd><dt>Nationality</dt><dd>' + esc(r.nat) + '</dd><dt>Establishment</dt><dd>Demo Hotel A (PIL-001)</dd><dt>Room</dt><dd>' + esc(r.room) + '</dd><dt>Arrival → departure</dt><dd>' + esc(r.arrival) + ' → ' + esc(r.departure) + '</dd><dt>Registration status</dt><dd>' + esc(r.stay) + '</dd><dt>Government status (simulated)</dt><dd>' + UI.statusBadge(r.sub) + (r.reason ? '<div class="hint">' + esc(r.reason) + '</div>' : '') + '</dd><dt>Submission reference</dt><dd class="mono">' + (r.sub === 'Not reported' ? '—' : 'SUB-' + esc(r.ref.slice(4)) + (r.subAt ? ' · ' + esc(r.subAt) : '')) + '</dd></dl>' +
        '<h3 class="mt-5" style="font-size:14px">Audit history for this record</h3>' + (trail.length ? trail.map(function (a) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(a.type + ' — ' + a.detail) + '</div><div class="s">' + esc(a.user + ' · ' + a.t) + '</div></div></div>'; }).join('') : '<div class="hint">No entries yet.</div>'),
      actions: [{ label: 'Close' }, u ? { label: 'Re-mask', onClick: function () { delete S.unmasked[ref]; S.aud(USER, 'Re-masked', ref, 'Sensitive fields masked again'); } } : (canUnmask ? { label: 'Request unmasking', variant: 'primary', onClick: function () { setTimeout(function () { unmask(ref); }, 30); } } : null)].filter(Boolean) });
  }
  function unmask(ref) {
    if (!M.dir.can('guestsearch:approve', 'gov')) { S.aud(USER, 'Permission denied', ref, 'Unmasking blocked — requires Guest record search — approve', 'Blocked'); M.toast.danger('Not permitted', 'Your demo role does not hold Guest record search — approve.'); return; }
    M.modal.open({ title: 'Request unmasking: ' + ref, body: UI.alert('warning', 'Single-record request.', 'Reveals name, document number and date of birth for this record only. Logged with your demonstration user. Bulk unmasking is not available. ' + SEC) +
      UI.textarea({ id: 'um-why', label: 'Justification (required by the demo policy)', required: true }) + UI.checkbox({ id: 'um-ok', label: 'I confirm this access matches the selected purpose and case reference.' }),
      actions: [{ label: 'Cancel' }, { label: 'Unmask this record', variant: 'danger', onClick: function (w) {
        var t = w.querySelector('#um-why').value.trim(), ok = w.querySelector('#um-ok').checked;
        if (t.length < M.ops.cfg.unmaskMinChars || !ok) { w.querySelector('#um-why').setAttribute('aria-invalid', t.length < M.ops.cfg.unmaskMinChars); M.toast.danger('Cannot unmask', t.length < M.ops.cfg.unmaskMinChars ? 'Enter a justification (at least ' + M.ops.cfg.unmaskMinChars + ' characters).' : 'Tick the confirmation.'); return false; }
        if (!M.dir.can('guestsearch:approve', 'gov')) { M.toast.danger('Not permitted', 'Unmasking requires Guest record search — approve.'); return; }
        S.unmasked[ref] = true; S.aud(USER, 'Unmasking', ref, 'Justification: ' + t + ' · Purpose: ' + (q.purpose || 'n/a') + ' · Case: ' + (q.cs || 'n/a'));
        M.toast.warning('Record unmasked (demo)', ref + ' — action logged.'); setTimeout(function () { openDetail(ref, false); }, 30);
      } }] });
  }
  M.actions.on('g-view', function (el) { if (!M.dir.can('guestsearch:read', 'gov')) { M.toast.danger('Not permitted', 'Your demo role does not hold Guest record search — read.'); return; } openDetail(el.getAttribute('data-ref')); });

  /* ================= Submission monitoring ================= */
  M.pages['gov/submission-quality'] = {
    title: 'Submission & Data Quality',
    render: function () {
      var E = establishments();
      var chips = ['Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'].map(function (k) { return '<div class="chip-stat">' + UI.statusBadge(k) + ' <strong class="num">' + S.count(k) + '</strong></div>'; }).join(' ');
      return UI.pageHead({ crumbs: crumbs('Submission monitoring'), title: 'Submission monitoring', description: 'Status and reporting information only. Responses are simulated.' }) + '<div class="stack">' +
        note('Statuses and rejection reasons are SIMULATED demonstration responses; no real government API is involved. Counts below are for Demo Hotel A records in the shared dataset.') + '<div class="row" style="flex-wrap:wrap;gap:16px">' + chips + '</div>' +
        UI.card({ title: 'Records', flush: true, body: '<div id="m-table"></div>' }) + UI.card({ title: 'Establishment summary (sample)', subtitle: 'Pending and failed counts per establishment', flush: true, body: '<div id="m-est"></div>' }) + '</div>';
    },
    mount: function (root) {
      UI.table.mount(root.querySelector('#m-table'), { caption: 'Submission records', rows: S.recs.filter(function (x) { return x.sub !== 'Not reported'; }), pageSize: 6, searchKeys: ['ref'], searchPlaceholder: 'Search reference…',
        filter: { key: 'sub', label: 'Status', options: ['Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'] },
        columns: [{ key: 'ref', label: 'Reference', sortable: true, render: function (r) { return '<span class="mono">' + esc(r.ref) + '</span><div class="cell-sub">Demo Hotel A</div>'; } },
          { key: 'sub', label: 'Status', sortable: true, render: function (r) { return UI.statusBadge(r.sub); } }, { key: 'subAt', label: 'Last update', render: function (r) { return esc(r.subAt || '—'); } },
          { key: 'reason', label: 'Reason (synthetic)', render: function (r) { return esc(r.reason || ''); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'ghost', action: 'g-sub-view', data: { ref: r.ref } }); } }] });
      UI.table.mount(root.querySelector('#m-est'), { caption: 'Establishment summary', rows: establishments(), pageSize: 6, searchKeys: ['name', 'id'], searchPlaceholder: 'Search establishment…', filter: { key: 'status', label: 'Status', options: ['Active', 'Inactive (demo)', 'Onboarding'] },
        columns: [{ key: 'name', label: 'Establishment', sortable: true }, { key: 'pend', label: 'Pending', sortable: true, align: 'right' }, { key: 'fail', label: 'Failed', sortable: true, align: 'right' }, { key: 'qual', label: 'Data-quality', sortable: true, align: 'right' }] });
    }
  };
  M.actions.on('g-sub-view', function (el) {
    var r = S.get(el.getAttribute('data-ref')); if (!r) return; S.aud(USER, 'Record view', r.ref, 'Viewed submission details');
    M.modal.open({ title: 'Submission ' + r.ref, body: UI.alert('info', 'Demonstration response.', 'Not from a real government system.') + '<dl class="kv"><dt>Status</dt><dd>' + UI.statusBadge(r.sub) + '</dd><dt>Reference</dt><dd class="mono">SUB-' + esc(r.ref.slice(4)) + '</dd><dt>Last update</dt><dd>' + esc(r.subAt || '—') + '</dd><dt>Reason</dt><dd>' + esc(r.reason || '—') + '</dd></dl><h3 class="mt-5" style="font-size:14px">History</h3>' +
      r.history.slice().reverse().map(function (h) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(h.e) + '</div><div class="s">' + esc(h.t) + '</div></div></div>'; }).join(''), actions: [{ label: 'Close', variant: 'primary' }] });
  });

  /* ================= Audit history (read-only) ================= */
  M.pages['gov/audit'] = {
    title: 'Audit & Access History',
    render: function () { return UI.pageHead({ crumbs: crumbs('Audit history'), title: 'Audit & access history', description: 'Read-only. Searches, record views, unmasking and submission events.' }) + '<div class="stack">' + note('Synthetic audit events for this browser session. This view has no edit or delete controls; production audit integrity would need server-side controls.') + UI.card({ flush: true, body: '<div id="aud-table"></div>' }) + '</div>'; },
    mount: function (root) {
      UI.table.mount(root.querySelector('#aud-table'), { caption: 'Audit events', rows: S.audit, pageSize: 10, searchKeys: ['user', 'type', 'target', 'detail'], searchPlaceholder: 'Search user, action, reference, detail…',
        filter: { key: 'type', label: 'Action type', options: M.ops.auditTypes() },
        columns: [{ key: 't', label: 'Time', render: function (r) { return '<span class="mono">' + esc(r.t) + '</span>'; } }, { key: 'user', label: 'User' }, { key: 'type', label: 'Action', sortable: true },
          { key: 'target', label: 'Target', render: function (r) { return '<span class="mono">' + esc(r.target) + '</span>'; } }, { key: 'detail', label: 'Detail' }, { key: 'outcome', label: 'Outcome', render: function (r) { return UI.statusBadge(r.outcome); } }] });
    }
  };
})(window);
