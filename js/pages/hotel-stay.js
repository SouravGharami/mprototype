/* Msafiri — Stage 9.0: Hotel Portal modules that were "Soon" placeholders (all SYNTHETIC / SIMULATED).
   Check-in, In-House Guests, Check-out/Amend & Cancel, PMS Connection & Manual Fallback, Compliance & Reports.
   Reuses the shared store (js/store.js: S.checkIn / checkOut / amend / cancel / validateReg / guard) and the existing dialogs exported by js/pages/hotel.js.
   No new business rule, role or permission is introduced; page access reuses existing permissions (see R.GUARDS in js/admin-data.js).
   Frontend demonstration only — not production access control, not a real government or PMS integration. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, S = M.store;
  var CMP = { stay: '' }; /* Compliance page: stay-status filter (kept across soft refreshes) */

  function crumbs(l) { return [{ label: 'Hotel Portal', href: '#/hotel/dashboard' }, { label: l }]; }
  function banner(t) { return UI.alert('info', 'Demonstration mode.', esc(t)); }
  function masked(n) { return '••••' + String(n || '').slice(-3); }
  function can(p) { return !!(M.dir && M.dir.can(p, 'hotel')); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function nights(r) { return Math.max(1, Math.round((new Date(r.departure) - new Date(r.arrival)) / 864e5)); }
  function stayBadge(s) { return UI.badge(s, { 'Checked in': 'success', 'Checked out': 'neutral', Cancelled: 'danger', Expected: 'info', Draft: 'neutral' }[s] || 'neutral'); }
  function guestCell(r) { return '<div class="cell-main">' + esc(r.guest) + '</div><div class="cell-sub">' + esc(r.ref) + '</div>'; }
  /* Same rule set the registration form and S.checkIn use (S.validateReg) — a record is "ready" only if the store would accept it. */
  function problems(r) {
    var parts = String(r.guest || '').trim().split(/\s+/);
    return S.validateReg({ first: parts[0] || '', last: parts.slice(1).join(' '), dob: r.dob, nat: r.nat, docType: r.docType, docNo: r.docNo, room: r.room, arrival: r.arrival, departure: r.departure });
  }
  function disabledBtn(label, why, variant) { return '<span title="' + esc(why) + '">' + UI.button({ label: label, size: 'sm', variant: variant || 'secondary', disabled: true }) + '</span>'; }

  /* ================= Check-in ================= */
  function eligible() { return S.recs.filter(function (x) { return x.stay === 'Expected' || x.stay === 'Draft'; }); }
  M.pages['hotel/check-in'] = {
    title: 'Check-in',
    render: function () {
      var el = eligible(), ready = el.filter(function (r) { return !Object.keys(problems(r)).length; }).length;
      return UI.pageHead({ crumbs: crumbs('Check-in'), title: 'Check-in', description: 'Registered guests who are expected or in draft and can be checked in. Check-in needs a physical document check.',
        actions: UI.button({ label: 'Register a new guest', icon: 'user-plus', variant: 'accent', href: '#/hotel/new-registration' }) }) +
      '<div class="stack">' + banner('Check-in updates the shared synthetic records. The government report that follows is SIMULATED: “Acknowledged” is produced by the prototype and is not a real government acknowledgement. Demo rule: a document number ending in 9 is later rejected by the simulated interface.') +
      (S.offline ? UI.alert('warning', 'Connection unavailable (simulated).', 'Check-ins are saved to the local offline queue and are not delivered to government until synchronised.') : '') +
      '<div class="grid cols-3">' + [
        { label: 'Eligible guests', value: el.length, icon: 'users', foot: 'Expected or Draft' },
        { label: 'Ready to check in', value: ready, icon: 'check-circle', tone: 'green', foot: 'details pass validation' },
        { label: 'Need details', value: el.length - ready, icon: 'alert', tone: el.length - ready ? 'orange' : '', foot: 'complete in the registration form' }].map(UI.statCard).join('') + '</div>' +
      UI.card({ title: 'Guests awaiting check-in', subtitle: 'Choose a guest, then confirm the document check.', flush: true, body: '<div id="ci-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var canCreate = can('registration:create');
      UI.table.mount(root.querySelector('#ci-table'), { caption: 'Guests awaiting check-in', rows: eligible().map(function (r) { var p = problems(r); return Object.assign({}, r, { ready: Object.keys(p).length ? 'Needs details' : 'Ready' }); }),
        pageSize: 8, searchKeys: ['guest', 'ref', 'room', 'nat'], searchPlaceholder: 'Search name, reference, room…', emptyText: 'No guests are awaiting check-in.',
        filter: { key: 'stay', label: 'Stay status', options: ['Expected', 'Draft'] },
        columns: [
          { key: 'guest', label: 'Guest', sortable: true, render: guestCell },
          { key: 'room', label: 'Room', sortable: true },
          { key: 'arrival', label: 'Arrival', sortable: true }, { key: 'departure', label: 'Departure', sortable: true },
          { key: 'doc', label: 'Document', render: function (r) { return esc(r.docType || '—') + ' ' + masked(r.docNo); } },
          { key: 'stay', label: 'Stay', render: function (r) { return stayBadge(r.stay); } },
          { key: 'ready', label: 'Readiness', render: function (r) { return UI.badge(r.ready, r.ready === 'Ready' ? 'success' : 'warning'); } },
          { key: 'a', label: '', align: 'right', render: function (r) {
            if (!canCreate) return disabledBtn('Check in', 'Checking in requires ' + M.dir.permLabel('registration:create') + ' — not held by the acting demo user', 'primary');
            return r.ready === 'Ready' ? UI.button({ label: 'Check in', size: 'sm', variant: 'primary', action: 'ci-start', data: { ref: r.ref } }) : UI.button({ label: 'Complete details', size: 'sm', variant: 'secondary', action: 'ci-complete', data: { ref: r.ref } });
          } }] });
    }
  };
  M.actions.on('ci-complete', function (el) { var r = S.get(el.getAttribute('data-ref')); if (r) M.hotelStartForm(r); });
  M.actions.on('ci-start', function (el) {
    var r = S.get(el.getAttribute('data-ref')); if (!r) { M.toast.danger('Record not found', 'It may have been reset.'); return; }
    if (!S.guard('registration:create', 'Check-in')) return;
    if (r.stay !== 'Expected' && r.stay !== 'Draft') { M.toast.danger('Not allowed', 'A ' + String(r.stay).toLowerCase() + ' record cannot be checked in.'); return; }
    M.modal.open({ title: 'Check in ' + r.guest + '?',
      body: '<dl class="kv"><dt>Reference</dt><dd>' + esc(r.ref) + '</dd><dt>Nationality</dt><dd>' + esc(r.nat) + '</dd><dt>Document</dt><dd>' + esc(r.docType) + ' ' + masked(r.docNo) + '</dd><dt>Room</dt><dd>' + esc(r.room) + '</dd><dt>Stay</dt><dd>' + esc(r.arrival) + ' → ' + esc(r.departure) + ' (' + nights(r) + ' night(s))</dd></dl>' +
        UI.alert(S.offline ? 'warning' : 'info', S.offline ? 'Offline.' : 'Simulated reporting.', S.offline ? 'This check-in will be queued locally, not reported.' : 'A simulated submission to a demonstration government interface will start.') +
        UI.checkbox({ id: 'ci-doc', label: 'I have physically checked the guest’s original document against these details. *' }),
      actions: [{ label: 'Cancel' }, { label: 'Confirm check-in', variant: 'primary', onClick: function (w) {
        var cb = w.querySelector('#ci-doc');
        if (!cb || !cb.checked) { if (cb) { cb.setAttribute('aria-invalid', 'true'); cb.focus(); } M.toast.danger('Document check required', 'Confirm the document check to continue.'); return false; }
        var rec = S.checkIn({ ref: r.ref, guest: r.guest, nat: r.nat, docType: r.docType, docNo: r.docNo, dob: r.dob, room: r.room, arrival: r.arrival, departure: r.departure, nights: nights(r) });
        if (rec) M.toast.success('Checked in: ' + rec.ref, 'Submission status: ' + rec.sub + ' (simulated).');
        /* on refusal the store has already shown the reason and audited "Action blocked" */
      } }] });
  });

  /* ================= In-House Guests ================= */
  function inHouse() { return S.recs.filter(function (x) { return x.stay === 'Checked in'; }); }
  M.pages['hotel/in-house'] = {
    title: 'In-House Guests',
    render: function () {
      var ih = inHouse(), t = today(), dep = ih.filter(function (r) { return r.departure === t; }).length, att = ih.filter(function (r) { return r.sub === 'Rejected' || r.sub === 'Conflict'; }).length;
      return UI.pageHead({ crumbs: crumbs('In-House Guests'), title: 'In-house guests', description: 'Guests currently checked in at Demo Hotel A (synthetic). Document numbers are masked.',
        actions: UI.button({ label: 'Check out, amend & cancel', icon: 'edit', variant: 'secondary', href: '#/hotel/stay-changes' }) }) +
      '<div class="stack">' + banner('The “Government” column shows simulated statuses; “Acknowledged” is not a real government acknowledgement.') +
      '<div class="grid cols-3">' + [
        { label: 'In house now', value: ih.length, icon: 'bed', foot: 'checked-in records' },
        { label: 'Departing today', value: dep, icon: 'log-out', foot: 'by departure date' },
        { label: 'Report needs attention', value: att, icon: 'alert', tone: att ? 'red' : '', foot: 'rejected or in conflict (simulated)' }].map(UI.statCard).join('') + '</div>' +
      UI.card({ title: 'Guests in house', flush: true, body: '<div id="ih-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var t = today();
      UI.table.mount(root.querySelector('#ih-table'), { caption: 'In-house guests', rows: inHouse(), pageSize: 8, searchKeys: ['guest', 'ref', 'room', 'nat'], searchPlaceholder: 'Search name, reference, room, nationality…', emptyText: 'No guests are currently checked in.',
        filter: { key: 'sub', label: 'Government status', options: ['Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'] },
        columns: [
          { key: 'guest', label: 'Guest', sortable: true, render: guestCell },
          { key: 'room', label: 'Room', sortable: true }, { key: 'nat', label: 'Nationality', sortable: true },
          { key: 'arrival', label: 'Arrived', sortable: true },
          { key: 'departure', label: 'Departure', sortable: true, render: function (r) { return esc(r.departure) + (r.departure === t ? ' ' + UI.badge('Today', 'warning', { dot: false }) : ''); } },
          { key: 'nights', label: 'Nights', sortable: true },
          { key: 'sub', label: 'Government', render: function (r) { return UI.statusBadge(r.sub); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'ghost', action: 'hotel-view-reg', data: { ref: r.ref } }); } }] });
    }
  };

  /* ================= Check-out, Amend & Cancel ================= */
  M.pages['hotel/stay-changes'] = {
    title: 'Check-out, Amend & Cancel',
    render: function () {
      var rd = !can('registration:edit'), recent = S.log.filter(function (l) { return /Checked out|Cancelled|Amended|Check-out|Cancellation|Amendment/.test(l.e); }).slice(0, 6);
      return UI.pageHead({ crumbs: crumbs('Check-out, Amend & Cancel'), title: 'Check-out, amend & cancel', description: 'Change an existing stay. Each action asks for confirmation, is validated by the shared store and is written to the audit trail.' }) +
      '<div class="stack">' + banner('Changes update the shared synthetic records and start a SIMULATED update report. Checked-out and cancelled records are final.') +
      (rd ? UI.alert('warning', 'Read-only for the acting demo user.', 'Check-out, amendment and cancellation require ' + esc(M.dir.permLabel('registration:edit')) + '. Choose another account under “Acting as” in the user menu.') : '') +
      UI.card({ title: 'Stay records', flush: true, body: '<div id="sc-table"></div>' }) +
      UI.card({ title: 'Recent stay changes', subtitle: 'This session (synthetic)', body: recent.length ? recent.map(function (l) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(l.e) + '</div><div class="s">' + esc(l.ref + ' · ' + l.guest + ' · ' + l.t) + '</div></div></div>'; }).join('') : '<div class="hint">No stay changes yet in this session.</div>' }) + '</div>';
    },
    mount: function (root) {
      var ce = can('registration:edit'), why = 'Requires ' + M.dir.permLabel('registration:edit') + ' — not held by the acting demo user';
      UI.table.mount(root.querySelector('#sc-table'), { caption: 'Stay records', rows: S.recs, pageSize: 8, searchKeys: ['guest', 'ref', 'room'], searchPlaceholder: 'Search name, reference, room…',
        filter: { key: 'stay', label: 'Stay status', options: ['Expected', 'Draft', 'Checked in', 'Checked out', 'Cancelled'] },
        columns: [
          { key: 'guest', label: 'Guest', sortable: true, render: guestCell },
          { key: 'room', label: 'Room', sortable: true }, { key: 'departure', label: 'Departure', sortable: true },
          { key: 'stay', label: 'Stay', render: function (r) { return stayBadge(r.stay); } },
          { key: 'sub', label: 'Government', render: function (r) { return UI.statusBadge(r.sub); } },
          { key: 'a', label: 'Actions', align: 'right', render: function (r) {
            var b = [], open = r.stay === 'Checked in', pre = r.stay === 'Expected' || r.stay === 'Draft';
            function add(label, action, variant) { b.push(ce ? UI.button({ label: label, size: 'sm', variant: variant || 'secondary', action: action, data: { ref: r.ref } }) : disabledBtn(label, why, variant)); }
            if (open) add('Check out', 'sc-out', 'primary');
            if (open || r.stay === 'Expected') add('Amend', 'sc-amend');
            if (open || pre) add('Cancel', 'sc-cancel');
            b.push(UI.button({ label: 'Details', size: 'sm', variant: 'ghost', action: 'hotel-view-reg', data: { ref: r.ref } }));
            return '<div class="row" style="justify-content:flex-end;flex-wrap:wrap">' + b.join('') + '</div>';
          } }] });
    }
  };
  function stayRec(el, perm) { if (!S.guard(perm, 'Stay change')) return null; var r = S.get(el.getAttribute('data-ref')); if (!r) M.toast.danger('Record not found', 'It may have been reset.'); return r; }
  M.actions.on('sc-out', function (el) { var r = stayRec(el, 'registration:edit'); if (!r) return; if (r.stay !== 'Checked in') { M.toast.danger('Not allowed', 'Only a checked-in record can be checked out.'); return; } M.hotelCheckOut(r); });
  M.actions.on('sc-amend', function (el) { var r = stayRec(el, 'registration:edit'); if (!r) return; if (r.stay !== 'Checked in' && r.stay !== 'Expected') { M.toast.danger('Not allowed', 'A ' + String(r.stay).toLowerCase() + ' record cannot be amended.'); return; } M.hotelAmend(r); });
  M.actions.on('sc-cancel', function (el) { var r = stayRec(el, 'registration:edit'); if (!r) return; if (r.stay === 'Checked out' || r.stay === 'Cancelled') { M.toast.danger('Not allowed', 'A ' + String(r.stay).toLowerCase() + ' record cannot be cancelled.'); return; } M.hotelCancel(r); });

  /* ================= PMS Connection & Manual Fallback ================= */
  function pmsRec() { try { return M.integ && M.integ.all().filter(function (x) { return x.estId === 'PIL-001'; })[0] || null; } catch (e) { return null; } }
  M.pages['hotel/pms'] = {
    title: 'PMS Connection & Manual Fallback',
    render: function () {
      var p = pmsRec(), st = p ? p.status : (S.offline ? 'Disconnected' : 'Connected'), fb = S.offline || st !== 'Connected' || (p && !p.enabled);
      var tone = st === 'Connected' && !fb ? 'success' : st === 'Degraded' ? 'warning' : 'danger', canReg = can('registration:create'), q = S.queue().length;
      var rel = p && p.okTs && M.dir.rel ? M.dir.rel(p.okTs) : '—';
      return UI.pageHead({ crumbs: crumbs('PMS Connection & Manual Fallback'), title: 'PMS connection & manual fallback', description: 'Status of the SIMULATED property-management-system link for Demo Hotel A, and how to keep registering guests when it is unavailable.' }) +
      '<div class="stack">' + UI.alert('orange', 'Simulated PMS — no real PMS is connected.', 'The status below comes from synthetic demonstration data. Nothing is sent to or received from any real PMS, and “Fetch from demo PMS” on the registration form only fills fixed sample values. Provider names are fictional.') +
      UI.card({ title: 'Connection status (simulated)', subtitle: 'Demo Hotel A · synthetic', body:
        '<dl class="kv"><dt>Provider</dt><dd>' + esc(p ? p.provider : 'Demo PMS (simulated)') + ' ' + UI.badge('Simulated', 'info', { dot: false }) + '</dd>' +
        '<dt>Status</dt><dd>' + UI.badge(S.offline ? 'Disconnected' : st, tone) + '</dd>' +
        '<dt>Last successful sync</dt><dd>' + esc(S.offline ? 'Unavailable while offline (simulated)' : rel) + '</dd>' +
        '<dt>Registration mode</dt><dd>' + (fb ? UI.badge('Manual fallback active', 'warning') : UI.badge('PMS prefill available (simulated)', 'success')) + '</dd>' +
        '<dt>Records queued offline</dt><dd>' + q + (q ? ' · <a href="#/hotel/offline-queue">Open offline queue</a>' : '') + '</dd></dl>' +
        (p && p.health ? '<div class="hint mt-5">' + esc(p.health.summary) + '</div>' : '') +
        '<div class="row mt-5">' + UI.button({ label: S.offline ? 'Restore connection' : 'Simulate PMS outage', variant: 'secondary', icon: 'refresh', action: 'off-toggle' }) + '</div>',
        foot: 'The outage control uses the same simulated offline switch as Offline Queue & Sync; Reset demo data restores it.' }) +
      UI.card({ title: 'Manual entry fallback', subtitle: 'Uses the existing guest registration form', body:
        '<ol class="plain-list" style="padding-left:18px"><li>Open the registration form and enter the guest and document details by hand (or run the simulated scan).</li><li>Enter room and stay dates yourself — PMS prefill is not needed.</li><li>Confirm you checked the original document, then review and check in.</li><li>' + (S.offline ? 'While offline the record is saved to the local queue and is not delivered until synchronised.' : 'The record is reported through the simulated interface straight away.') + '</li></ol>' +
        '<div class="row mt-5">' + (canReg ? UI.button({ label: 'Open manual registration', icon: 'user-plus', variant: 'accent', href: '#/hotel/new-registration' }) : '<span title="Requires ' + esc(M.dir.permLabel('registration:create')) + ' — not held by the acting demo user">' + UI.button({ label: 'Open manual registration', icon: 'user-plus', variant: 'accent', disabled: true }) + '</span>') +
        UI.button({ label: 'Offline queue & sync', variant: 'secondary', href: '#/hotel/offline-queue' }) + '</div>' }) + '</div>';
    }
  };

  /* ================= Compliance & Reports ================= */
  function cmpRows() { return S.recs.map(function (r) { return Object.assign({}, r, { why: r.reason || (r.sub === 'Queued offline' ? 'Waiting for synchronisation' : r.sub === 'Conflict' ? 'Needs conflict review' : '') }); }); }
  function summary() {
    var rep = S.recs.filter(function (r) { return r.sub !== 'Not reported'; }), ack = S.count('Acknowledged'), rej = S.count('Rejected') + S.count('Conflict');
    return { total: S.recs.length, reported: rep.length, ack: ack, rej: rej, prog: S.count('Pending') + S.count('Submitted') + S.count('Queued offline'), not: S.recs.length - rep.length };
  }
  M.pages['hotel/compliance'] = {
    title: 'Compliance & Reports',
    render: function () {
      var s = summary(), pct = s.reported ? Math.round(s.ack / s.reported * 100) : 0;
      return UI.pageHead({ crumbs: crumbs('Compliance & Reports'), title: 'Compliance & reports', description: 'Reporting status of Demo Hotel A’s synthetic records. Figures are computed from the records in this browser tab.',
 }) +
      '<div class="stack">' + UI.alert('orange', 'Illustrative, simulated reporting.', 'This is not an official compliance report. Statuses are produced by the prototype, no real government interface is involved, and report types, thresholds and legal requirements are not defined (the approved URS was not supplied). The summary CSV contains counts only and is saved to your device — nothing is submitted anywhere.') +
      '<div class="row">' + UI.button({ label: 'Summary CSV (simulated)', icon: 'download', variant: 'secondary', action: 'cmp-export' }) + '</div>' +
      '<div class="grid cols-4">' + [
        { label: 'Records', value: s.total, icon: 'users', foot: s.not + ' not yet reported' },
        { label: 'Acknowledged (simulated)', value: s.ack, icon: 'check-circle', tone: 'green', delta: pct + '% of reported', dtone: 'flat' },
        { label: 'In progress', value: s.prog, icon: 'clock', delta: 'pending, submitted or queued', dtone: 'flat' },
        { label: 'Needs attention', value: s.rej, icon: 'alert', tone: s.rej ? 'red' : '', delta: 'rejected or in conflict', dtone: s.rej ? 'down' : 'flat' }].map(UI.statCard).join('') + '</div>' +
      '<div class="grid cols-2">' +
        UI.card({ title: 'Submission status', subtitle: 'Records with a simulated status', body: M.donutChart({ segments: S.segments(), centerLabel: 'Reported', ariaLabel: 'Submission status of reported records' }) }) +
        UI.card({ title: 'Needs attention', subtitle: 'From the same records', body: S.attention().map(function (a) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(a.t) + '</div><div class="s">' + esc(a.s) + '</div></div>' + UI.badge(a.tag, a.tone) + '</div>'; }).join('') + '<div class="mt-5"><a href="#/hotel/submissions">Open Submission Status &amp; History</a></div>' }) + '</div>' +
      UI.card({ title: 'Records', subtitle: 'Search, or filter by government status and stay status', flush: true,
        body: '<div class="table-toolbar" style="padding:var(--sp-3) var(--sp-4) 0"><select class="select input-sm" id="cmp-stay" aria-label="Stay status filter"><option value="">Stay status: All</option>' + ['Expected', 'Draft', 'Checked in', 'Checked out', 'Cancelled'].map(function (o) { return '<option' + (CMP.stay === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div><div id="cmp-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var rows = cmpRows().filter(function (r) { return !CMP.stay || r.stay === CMP.stay; });
      UI.table.mount(root.querySelector('#cmp-table'), { caption: 'Compliance records', rows: rows, pageSize: 8, searchKeys: ['guest', 'ref', 'room', 'nat'], searchPlaceholder: 'Search name, reference, room…', emptyText: 'No records match the filters.',
        filter: { key: 'sub', label: 'Government status', options: ['Not reported', 'Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'] },
        columns: [
          { key: 'guest', label: 'Guest', sortable: true, render: guestCell },
          { key: 'stay', label: 'Stay', render: function (r) { return stayBadge(r.stay); } },
          { key: 'sub', label: 'Government (simulated)', render: function (r) { return UI.statusBadge(r.sub); } },
          { key: 'subAt', label: 'Last update', render: function (r) { return esc(r.subAt || '—'); } },
          { key: 'why', label: 'Explanation', render: function (r) { return esc(r.why); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'View', size: 'sm', variant: 'ghost', action: 'hotel-view-reg', data: { ref: r.ref } }); } }] });
      var sel = root.querySelector('#cmp-stay');
      if (sel) sel.addEventListener('change', function () { CMP.stay = sel.value; M.rerender(); });
    }
  };
  M.actions.on('cmp-export', function () {
    if (!S.guard('submissions:read', 'Download summary')) return;
    try {
      if (!g.Blob || !g.URL || !g.URL.createObjectURL) throw new Error('This browser cannot create downloads.');
      var s = summary(), csv = '\ufeff' + ['Item,Value', 'Label,"ILLUSTRATIVE SIMULATED SUMMARY - synthetic data - not an official report"', 'Establishment,"Demo Hotel A (synthetic)"', 'Total records,' + s.total, 'Reported (has simulated status),' + s.reported, 'Acknowledged (simulated),' + s.ack, 'In progress,' + s.prog, 'Needs attention,' + s.rej, 'Not yet reported,' + s.not].join('\r\n') + '\r\n';
      var url = g.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
      a.href = url; a.download = 'msafiri-demo-hotel-a-summary-SIMULATED.csv'; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { g.URL.revokeObjectURL(url); }, 1000);
      S.aud(S.actor(), 'Report download (simulated)', 'Demo Hotel A', 'Illustrative summary CSV (counts only) downloaded', 'Success');
      M.toast.success('Summary downloaded (simulated)', 'Counts only; nothing was submitted.');
    } catch (e) { M.toast.danger('Download failed', 'Your browser could not create the file.'); }
  });
})(window);
