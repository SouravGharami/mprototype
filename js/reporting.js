/* Msafiri — Stage 6.1 Reporting Dashboard foundation (SYNTHETIC / ILLUSTRATIVE).
   Route: #/gov/reports (nav item "Reporting & Trends"; guard reports:read).
   Every report row is a SAMPLE generated locally. None is an official government submission; no report
   format, category or obligation is defined here (URS v2.0 was not supplied). Statuses are SIMULATED.
   Stage 6.2 adds #/gov/reports/<id> (details + illustrative validation summary) and a simulated CSV export of ONE report
   (gated by reports:create). The CSV is a prototype file, NOT an official submission format.
   Only the property PIL-001 (Demo Hotel A) newest-week row reads the shared Hotel Portal state. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, S = M.store, R = M.dir, DAY = 864e5, WEEKS = 6, BASE = Date.now(); /* BASE: sample timestamps are fixed for the session (Stage 6.4) */
  var Rp = M.reporting = {};
  var STATUSES = ['Draft', 'Pending', 'Submitted', 'Acknowledged', 'Rejected'];
  var MEANING = {
    Draft: 'Sample report not yet prepared for a simulated submission.',
    Pending: 'Simulated: prepared and waiting to be sent. Nothing has been transmitted.',
    Submitted: 'Simulated: sent to the simulated interface and awaiting a simulated acknowledgement.',
    Acknowledged: 'Simulated acknowledgement. This is NOT a real government acknowledgement.',
    Rejected: 'Simulated rejection that needs attention. This is NOT a real government response.'
  };
  /* cumulative thresholds per week-age (0 = newest): Pending, Submitted, Acknowledged, Rejected, else Draft */
  var T = [[30, 55, 80, 93], [10, 22, 84, 94], [4, 8, 88, 96], [0, 3, 91, 97], [0, 0, 93, 98], [0, 0, 95, 99]];
  /* Illustrative validation examples only: codes ILL-n are placeholders, not rules from any specification. */
  var ISSUES = [['ILL-01', 'Document number format not recognised (illustrative example)'], ['ILL-02', 'Departure date earlier than arrival date (illustrative example)'],
    ['ILL-03', 'Nationality value missing (illustrative example)'], ['ILL-04', 'Room number missing (illustrative example)']];
  var root = null;

  function iso(off) { return new Date(Date.now() + off * DAY).toISOString().slice(0, 10); }
  function fmtD(s) { return new Date(s + 'T00:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function fmtS(s) { return new Date(s + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }
  function fmtT(ts) { return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function hash(a, b) { var x = Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663); x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16; return Math.abs(x); }
  function statusFor(w, r) { var t = T[w]; return r < t[0] ? 'Pending' : r < t[1] ? 'Submitted' : r < t[2] ? 'Acknowledged' : r < t[3] ? 'Rejected' : 'Draft'; }

  /* ---- data: one weekly report per active property per week (illustrative) ---- */
  Rp.rows = function () {
    var props = R.ests.filter(function (e) { return e.status === 'Active'; }), now = Date.now(), out = [], n = 0, w;
    for (w = 0; w < WEEKS; w++) {
      props.forEach(function (p, pi) {
        var h = hash(pi, w), end = iso(-1 - 7 * w), start = iso(-7 - 7 * w);
        var ts = Math.min(BASE - 600000 * (1 + h % 30), Date.parse(end + 'T00:00:00Z') + DAY + (6 + h % 12) * 3600000);
        var row = { id: 'SIM-RPT-' + ('000' + (++n)).slice(-4), name: 'Weekly registration report', estId: p.id, estName: p.name, start: start, end: end,
          records: 40 + h % 260, status: statusFor(w, h % 100), ts: ts, live: false, reason: '' };
        if (w === 0 && pi === 0) {                       /* PIL-001 newest week: derived from the shared Hotel Portal state */
          var open = S.count('Pending') + S.count('Submitted') + S.queue().length, rej = S.count('Rejected');
          row.records = S.recs.length; row.status = rej ? 'Rejected' : open ? 'Pending' : 'Acknowledged'; row.live = true; row.ts = now - 120000;
          var bad = S.recs.filter(function (x) { return x.sub === 'Rejected'; })[0]; row.reason = bad ? bad.reason : '';
        } else if (row.status === 'Rejected') row.reason = 'Synthetic example: a sample validation rule was not met';
        row.created = row.ts - (1 + h % 5) * 3600000;
        validate(row, h);
        out.push(row);
      });
    }
    return out.sort(function (a, b) { return a.end < b.end ? 1 : a.end > b.end ? -1 : a.estName.localeCompare(b.estName); });
  };

  /* Illustrative validation: Draft = not validated; Acknowledged = no errors; Rejected = errors; Pending/Submitted = occasionally a few.
     The live row uses the real simulated Hotel Portal records (counts only; no guest details are copied). */
  function validate(r, h) {
    var errs = 0, issues = [];
    if (r.live) {
      var rej = S.recs.filter(function (x) { return x.sub === 'Rejected'; }).length, conf = S.recs.filter(function (x) { return x.sub === 'Conflict'; }).length;
      errs = rej + conf;
      if (rej) issues.push({ code: 'SIM-REJ', desc: 'Record rejected by the simulated interface: ' + (r.reason || 'see Hotel Portal') , count: rej });
      if (conf) issues.push({ code: 'SIM-CONF', desc: 'Offline synchronisation conflict awaiting review (simulated)', count: conf });
    } else if (r.status === 'Draft') { r.validated = false; r.reviewed = 0; r.valid = 0; r.errors = 0; r.issues = []; return; }
    else {
      errs = r.status === 'Rejected' ? 1 + Math.round(r.records * (2 + h % 6) / 100) : (r.status !== 'Acknowledged' && h % 5 === 0 ? 1 + h % 3 : 0);
      errs = Math.min(errs, r.records);
      var k = errs ? 1 + h % Math.min(3, errs) : 0, left = errs, i;
      for (i = 0; i < k; i++) { var c = i === k - 1 ? left : Math.max(1, Math.floor(left / (k - i) + (h >> i) % 2)); c = Math.min(c, left - (k - 1 - i)); left -= c; var it = ISSUES[(h + i) % ISSUES.length]; issues.push({ code: it[0], desc: it[1], count: c }); }
    }
    r.validated = true; r.reviewed = r.records; r.errors = errs; r.valid = r.records - errs; r.issues = issues;
  }
  Rp.one = function (id) { return Rp.rows().filter(function (x) { return x.id === id; })[0]; };

  /* ---- CSV export (browser-standard Blob download; no existing export utility in the project) ---- */
  var CSV_COLS = ['row_type', 'report_id', 'report_name', 'period_start', 'period_end', 'property_id', 'property_name', 'status_simulated', 'record_count', 'valid_records', 'records_with_errors', 'issue_code', 'issue_description', 'issue_count', 'created_utc', 'last_updated_utc', 'data_notice'];
  var NOTICE = 'SYNTHETIC PROTOTYPE DATA - illustrative sample, not an official government submission or format';
  /* RFC 4180 quoting plus spreadsheet-formula neutralisation for text cells that start with = + - @ tab or CR */
  Rp.csvCell = function (v) {
    if (v == null) return '';
    var t = String(v);
    if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  };
  Rp.toCsv = function (r) {
    if (!r) return '';
    var base = function (type) { return [type, r.id, r.name, r.start, r.end, r.estId, r.estName, r.status, r.records, r.validated ? r.valid : '', r.validated ? r.errors : '']; };
    var tail = [new Date(r.created).toISOString(), new Date(r.ts).toISOString(), NOTICE];
    var lines = [CSV_COLS.slice()];
    lines.push(base('summary').concat(['', r.validated ? '' : 'Not validated (draft sample)', '']).concat(tail));
    (r.issues || []).forEach(function (i) { lines.push(base('issue').concat([i.code, i.desc, i.count]).concat(tail)); });
    return lines.map(function (l) { return l.map(Rp.csvCell).join(','); }).join('\r\n') + '\r\n';
  };
  Rp.filename = function (r) { return 'msafiri-SYNTHETIC-report-' + r.id + '-' + r.start + '_to_' + r.end + '.csv'; };
  Rp.canExport = function () { return R.can('reports:create', 'gov'); };
  Rp.exportReport = function (id) {
    var r = Rp.one(id);
    if (!r) { M.toast.danger('Export failed', 'That sample report no longer exists.'); return { ok: false, why: 'missing' }; }
    if (!Rp.canExport()) { M.toast.warning('Export not permitted', 'The acting demo role does not hold the report-export permission.'); return { ok: false, why: 'permission' }; }
    try {
      if (!g.Blob || !g.URL || !g.URL.createObjectURL) throw new Error('This browser cannot create downloads.');
      var csv = '\ufeff' + Rp.toCsv(r), name = Rp.filename(r), url = g.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      var a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { try { g.URL.revokeObjectURL(url); } catch (e) { /* ignore */ } }, 1000);
      S.aud((M.demo.users.gov.name || 'Government user') + ' (Gov, demo)', 'Report export (simulated)', r.id, 'Downloaded synthetic CSV ' + name + ' — prototype file, not submitted anywhere');
      M.toast.success('Synthetic CSV created', name);
      return { ok: true, filename: name };
    } catch (err) {
      M.toast.danger('Export failed', 'The file could not be created: ' + (err && err.message ? err.message : 'unknown error') + ' Nothing was sent anywhere.');
      return { ok: false, why: 'error', message: err && err.message };
    }
  };

  /* ---- filtering: date range = report period overlaps [from, to] ---- */
  Rp.filter = function (rows, f) {
    if (f.from && f.to && f.from > f.to) return [];
    return rows.filter(function (r) {
      return (!f.from || r.end >= f.from) && (!f.to || r.start <= f.to) && (!f.est || r.estId === f.est) && (!f.status || r.status === f.status);
    });
  };
  function sum(a) { return a.reduce(function (t, r) { return t + r.records; }, 0); }
  function cnt(a, s) { return a.filter(function (r) { return s.indexOf(r.status) > -1; }).length; }
  Rp.cards = function (all, sel, f) {
    var period = f.from || f.to ? (f.from ? fmtD(f.from) : 'start') + ' – ' + (f.to ? fmtD(f.to) : 'today') : 'all dates', sub = cnt(sel, ['Submitted']);
    return [
      { label: 'Total guest registrations', value: sum(all), icon: 'users', delta: 'Illustrative', dtone: 'flat', tone: 'up', foot: all.length + ' sample reports, unfiltered' },
      { label: 'Registrations in period', value: sum(sel), icon: 'calendar', tone: 'orange', accent: true, delta: sel.length + ' of ' + all.length + ' reports', dtone: 'flat', foot: period },
      { label: 'Pending submissions', value: cnt(sel, ['Pending', 'Submitted']), icon: 'send', delta: sub + ' submitted', dtone: 'flat', tone: 'up', foot: 'simulated · awaiting ack.' },
      { label: 'Successful submissions', value: cnt(sel, ['Acknowledged']), icon: 'check-circle', delta: 'Simulated', dtone: 'flat', tone: 'green', foot: 'not a real ack.' },
      { label: 'Failed — needs attention', value: cnt(sel, ['Rejected']), icon: 'alert', tone: 'red', delta: 'Simulated', dtone: cnt(sel, ['Rejected']) ? 'down' : 'flat', foot: 'sample data' }
    ];
  };

  /* ---- page ---- */
  function render(ctx) {
    var all = Rp.rows(), props = R.ests.filter(function (e) { return e.status === 'Active'; }).map(function (e) { return { value: e.id, label: e.name }; });
    return UI.pageHead({ crumbs: [{ label: 'Government Portal', href: '#/gov/dashboard' }, { label: 'Reporting' }], title: 'Reporting dashboard',
      description: esc(ctx.user.role) + ' · foundation view with sample data only' }) +
      '<div class="stack">' +
      UI.alert('orange', 'Illustrative prototype data.', 'Every figure and report below is a <strong>synthetic sample</strong>. Statuses are <strong>simulated</strong>; nothing is a real government submission or acknowledgement, and no official report format, category or obligation is implied. The URS has not been supplied, so no URS requirement is cited. A report’s details page can export a simulated CSV (permission-gated); there is no scheduling or automated submission.') +
      '<div class="grid cols-5" id="rp-cards" aria-label="Summary (illustrative)"></div>' +
      UI.card({ title: 'Filters', subtitle: 'Narrow the sample reports and summary cards', body:
        '<div class="rp-filters" role="group" aria-label="Report filters">' +
        UI.input({ id: 'rp-from', label: 'Period from', type: 'date' }) + UI.input({ id: 'rp-to', label: 'Period to', type: 'date' }) +
        UI.select({ id: 'rp-est', label: 'Property or hotel', placeholder: 'All properties', options: props }) +
        UI.select({ id: 'rp-st', label: 'Status (simulated)', placeholder: 'All statuses', options: STATUSES }) +
        '<div class="rp-reset">' + UI.button({ label: 'Reset filters', icon: 'refresh', variant: 'secondary', action: 'rp-reset' }) + '</div></div>' +
        '<div class="error-text" id="rp-err" role="alert" hidden></div>' +
        '<p class="hint" style="margin-top:var(--sp-3)">A report matches the date range when its reporting period overlaps it. No report-category filter is offered because categories are not defined in the supplied materials.</p>' }) +
      UI.card({ title: 'Reports', subtitle: 'Sample weekly reports per active property · newest first', flush: true, body: '<div id="rp-table"></div><div id="rp-empty" hidden></div>',
        foot: 'Sample records only — not official government submissions. Open a report to see its details and the permission-gated simulated CSV export.' }) +
      '</div>';
  }

  function mount(el) {
    root = el; var all = Rp.rows(), $ = function (s) { return el.querySelector(s); }, ctl;
    ctl = UI.table.mount($('#rp-table'), { caption: 'Sample reports (synthetic)', rows: all, pageSize: 10, searchKeys: ['id', 'name', 'estName', 'status'], searchPlaceholder: 'Search report, property or status…',
      emptyText: 'No reports match the search.',
      columns: [
        { key: 'id', label: 'Report', sortable: true, render: function (r) { return '<a class="cell-main" href="#/gov/reports/' + esc(r.id) + '">' + esc(r.name) + '</a><div class="cell-sub"><span class="mono">' + esc(r.id) + '</span> · sample, not official</div>'; } },
        { key: 'start', label: 'Reporting period', sortable: true, render: function (r) { return esc(fmtS(r.start)) + ' – ' + esc(fmtD(r.end)); } },
        { key: 'estName', label: 'Property', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.estName) + '</div><div class="cell-sub">' + esc(r.estId) + (r.live ? ' · live from Hotel Portal state' : '') + '</div>'; } },
        { key: 'records', label: 'Records', sortable: true, align: 'right' },
        { key: 'status', label: 'Status (simulated)', sortable: true, render: function (r) { return UI.statusBadge(r.status); } },
        { key: 'ts', label: 'Last updated', sortable: true, render: function (r) { return esc(fmtT(r.ts)) + '<div class="cell-sub">' + esc(R.rel(r.ts)) + '</div>'; } },
        { key: 'a', label: 'Actions', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'secondary', action: 'rp-view', data: { id: r.id }, aria: 'View details for ' + r.id }); } }] });

    function read() { return { from: $('#rp-from').value, to: $('#rp-to').value, est: $('#rp-est').value, status: $('#rp-st').value }; }
    function apply() {
      var f = read(), bad = f.from && f.to && f.from > f.to, sel = Rp.filter(all, f), err = $('#rp-err');
      err.hidden = !bad; err.textContent = bad ? 'The start date is after the end date. Adjust the range or reset the filters.' : '';
      $('#rp-from').setAttribute('aria-invalid', bad ? 'true' : 'false');
      $('#rp-cards').innerHTML = Rp.cards(all, sel, bad ? {} : f).map(UI.statCard).join('');
      ctl.setRows(sel);
      $('#rp-table').hidden = !sel.length;
      $('#rp-empty').hidden = !!sel.length;
      $('#rp-empty').innerHTML = sel.length ? '' : UI.empty({ icon: 'search', title: bad ? 'Invalid date range' : 'No reports match these filters',
        body: bad ? 'The start date must be on or before the end date.' : 'Try a wider date range or a different property or status.', actions: UI.button({ label: 'Reset filters', variant: 'primary', icon: 'refresh', action: 'rp-reset' }) });
    }
    ['rp-from', 'rp-to'].forEach(function (i) { $('#' + i).addEventListener('input', apply); });
    ['rp-est', 'rp-st'].forEach(function (i) { $('#' + i).addEventListener('change', apply); });
    apply();
  }

  M.actions.on('rp-reset', function () {
    if (!root) return;
    ['rp-from', 'rp-to', 'rp-est', 'rp-st'].forEach(function (i) { var e = root.querySelector('#' + i); if (e) e.value = ''; });
    var e = root.querySelector('#rp-from'); if (e) e.dispatchEvent(new Event('input', { bubbles: true }));
    var f = root.querySelector('#rp-from'); if (f) f.focus();
  });
  M.actions.on('rp-view', function (el) { location.hash = '#/gov/reports/' + el.getAttribute('data-id'); });
  M.actions.on('rp-export', function (el) { Rp.exportReport(el.getAttribute('data-id')); });

  /* ---- details page ---- */
  function kv(rows) { return '<dl class="kv">' + rows.map(function (k) { return '<dt>' + esc(k[0]) + '</dt><dd>' + k[1] + '</dd>'; }).join('') + '</dl>'; }
  function exportBtn(r) {
    var can = Rp.canExport(), b = UI.button({ label: 'Export synthetic CSV', icon: 'download', variant: 'primary', action: can ? 'rp-export' : null, data: can ? { id: r.id } : null, disabled: !can });
    return can ? b : '<span title="The acting demo role does not hold the report-export permission">' + b + '</span>';
  }
  function detail(id) {
    var r = Rp.one(id), crumbs = [{ label: 'Government Portal', href: '#/gov/dashboard' }, { label: 'Reporting', href: '#/gov/reports' }, { label: r ? r.id : 'Not found' }];
    if (!r) return UI.pageHead({ crumbs: crumbs, title: 'Report not found' }) + UI.card({ body: UI.empty({ icon: 'search', title: 'Report not found', body: 'No sample report has this ID. Sample reports are regenerated for each prototype session.', actions: UI.button({ label: 'Back to reports', variant: 'primary', href: '#/gov/reports' }) }) });
    var pct = r.validated && r.reviewed ? Math.round(r.valid / r.reviewed * 1000) / 10 : null, can = Rp.canExport();
    var vs = r.validated ? '<div class="grid cols-3">' + [{ label: 'Records reviewed', value: r.reviewed, icon: 'list', foot: 'illustrative check' }, { label: 'Valid records', value: r.valid, icon: 'check-circle', tone: 'green', delta: pct + '%', dtone: 'flat', foot: 'of reviewed' },
      { label: 'With validation errors', value: r.errors, icon: 'alert', tone: 'red', delta: r.errors ? 'Needs attention' : 'None', dtone: r.errors ? 'down' : 'flat', foot: 'illustrative' }].map(UI.statCard).join('') + '</div>'
      : UI.empty({ icon: 'clock', title: 'Not yet validated', body: 'This sample report is a draft. No illustrative validation has been run, so no counts are shown.' });
    var issues = !r.validated ? '' : r.issues.length ? '<div class="table-wrap"><table class="dt"><caption class="sr-only">Illustrative validation issues</caption><thead><tr><th scope="col">Code</th><th scope="col">Issue (illustrative)</th><th scope="col" class="right">Records</th></tr></thead><tbody>' +
      r.issues.map(function (i) { return '<tr><td><span class="mono">' + esc(i.code) + '</span></td><td>' + esc(i.desc) + '</td><td class="right">' + i.count + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : UI.empty({ icon: 'check-circle', title: 'No validation issues', body: 'The illustrative check found no issues in this sample report.' });
    return UI.pageHead({ crumbs: crumbs, title: r.name, description: '<span class="mono">' + esc(r.id) + '</span> · ' + esc(r.estName) + ' · ' + esc(fmtD(r.start)) + ' – ' + esc(fmtD(r.end)),
      actions: UI.button({ label: 'Back to reports', icon: 'arrow-right', variant: 'ghost', href: '#/gov/reports' }) + exportBtn(r) }) +
      '<div class="stack">' + UI.alert('orange', 'Sample report.', 'Synthetic data with <strong>simulated</strong> statuses and <strong>illustrative</strong> validation. Not an official government submission; no official format, rule or obligation is implied. Nothing is sent anywhere.') +
      (!can ? UI.alert('info', 'Export unavailable for this role.', 'Exporting needs the existing “Reporting &amp; trends — create” permission, which the acting demo user’s role does not hold. A System Administrator can grant it under Roles &amp; Permissions.') : '') +
      '<div class="grid main-side"><div class="stack">' +
      UI.card({ title: 'Report information', subtitle: 'Sample record', body: kv([['Report ID', '<span class="mono">' + esc(r.id) + '</span> (sample, not official)'], ['Report', esc(r.name) + ' (illustrative placeholder)'], ['Report type', 'Not defined — pending specification'],
        ['Reporting period', esc(fmtD(r.start)) + ' – ' + esc(fmtD(r.end))], ['Property', esc(r.estName) + ' · ' + esc(r.estId)], ['Record count', String(r.records)], ['Status (simulated)', UI.statusBadge(r.status)],
        ['Created', esc(R.fmt(r.created))], ['Last updated', esc(R.fmt(r.ts)) + ' (' + esc(R.rel(r.ts)) + ')'], ['Data source', r.live ? 'Live from the shared Hotel Portal state; status is simulated' : 'Synthetic sample']]) }) +
      UI.card({ title: 'Validation summary', subtitle: 'Illustrative — no validation rules are defined without the URS', body: vs }) +
      (r.validated ? UI.card({ title: 'Validation issues', subtitle: 'Illustrative examples with placeholder codes (no guest details shown)', flush: true, body: issues }) : '') +
      '</div><div class="stack">' +
      UI.card({ title: 'Status', body: '<div style="margin-bottom:var(--sp-3)">' + UI.statusBadge(r.status) + ' <span class="muted">simulated</span></div><p class="hint" style="margin:0">' + esc(MEANING[r.status]) + '</p>' + (r.reason ? '<p class="hint" style="margin:var(--sp-3) 0 0"><strong>Reason (synthetic):</strong> ' + esc(r.reason) + '</p>' : '') }) +
      UI.card({ title: 'Export', body: '<p class="hint" style="margin:0 0 var(--sp-3)">Downloads this one report as a CSV: a summary row plus one row per illustrative issue, with a synthetic-data notice on every row. It is a prototype file, not an official submission format, and is not sent anywhere.</p><p class="hint" style="margin:0 0 var(--sp-3)">File name: <span class="mono" style="word-break:break-all">' + esc(Rp.filename(r)) + '</span></p>' + exportBtn(r) }) +
      '</div></div></div>';
  }

  M.pages['gov/reports'] = {
    title: function (c) { var r = c.sub && Rp.one(c.sub); return c.sub ? (r ? r.id + ' · Report details' : 'Report not found') : 'Reporting Dashboard'; },
    render: function (c) { return c.sub ? detail(c.sub) : render(c); },
    mount: function (el, c) { if (!c.sub) mount(el); }
  };
})(window);
