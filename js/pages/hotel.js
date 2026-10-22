/* Msafiri — Hotel Portal Stage 2 pages (all SYNTHETIC / SIMULATED). Reads shared state from Msafiri.store. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, S = M.store;
  var NATS = ['Kenya', 'Tanzania', 'Uganda', 'Germany', 'United Kingdom', 'India', 'Japan', 'Brazil', 'Nigeria', 'France'];
  var DOCS = ['Passport', 'National ID card', 'Residence permit', 'Other (configurable)'];
  var draft = {}, scanned = null, pmsUsed = false;
  function crumbs(l) { return [{ label: 'Hotel Portal', href: '#/hotel/dashboard' }, { label: l }]; }
  function iso(d) { return new Date(Date.now() + d * 864e5).toISOString().slice(0, 10); }
  function demoBanner(t) { return UI.alert('info', 'Demonstration mode.', esc(t)); }
  function masked(n) { return '••••' + String(n).slice(-3); }
  function val(id) { var e = document.getElementById(id); return e ? (e.type === 'checkbox' ? e.checked : e.value.trim()) : ''; }
  function collect() { ['first', 'last', 'dob', 'nat', 'res', 'docType', 'docNo', 'room', 'arrival', 'departure', 'checked'].forEach(function (k) { if (document.getElementById('f-' + k)) draft[k] = val('f-' + k); }); }
  function go(h) { location.hash = h; }
  function safeDecode(t) { try { return decodeURIComponent(t); } catch (e) { return t; } }

  /* ---------- Guest registration ---------- */
  function f(k, label, extra) {
    var o = Object.assign({ id: 'f-' + k, label: label, value: draft[k] || '', error: (draft.err || {})[k] }, extra || {});
    if (scanned && scanned.low.indexOf(k) > -1) o.hint = 'Low confidence (simulated scan) — please verify against the document.';
    return (o.options ? UI.select(o) : UI.input(o));
  }
  M.pages['hotel/new-registration'] = {
    title: 'Guest Registration',
    render: function () {
      var off = S.offline;
      return UI.pageHead({ crumbs: crumbs('Guest Registration'), title: 'Guest registration & check-in', description: 'Enter details manually or use the simulated scan. * = required.',
        actions: UI.button({ label: 'Run simulated scan', icon: 'upload', variant: 'secondary', action: 'reg-scan' }) + UI.button({ label: 'Clear form', variant: 'ghost', action: 'reg-clear' }) }) +
      '<div class="stack">' + demoBanner('The scan is SIMULATED: no OCR, MRZ reading, biometric or identity verification takes place. Demo rule: a document number ending in 9 produces a simulated rejection.') +
      (off ? UI.alert('warning', 'Connection unavailable (simulated).', 'Check-in will be saved to the local offline queue. It is not delivered to government until synchronised.') : '') +
      (scanned ? UI.alert('warning', 'Review extracted fields.', 'Simulated extraction filled the fields below. Fields marked low confidence must be checked and corrected by the receptionist.') : '') +
      '<form id="reg-form" novalidate onsubmit="return false">' +
      UI.card({ title: '1 · Guest and document', body: '<div class="form-grid">' + f('first', 'First name', { required: true }) + f('last', 'Last name', { required: true }) + f('dob', 'Date of birth', { type: 'date', required: true }) +
        f('nat', 'Nationality', { required: true, placeholder: 'Select…', options: M.ops.opts('countries', draft.nat) }) + f('res', 'Country of residence', { placeholder: 'Select…', options: M.ops.opts('countries', draft.res), hint: 'Optional' }) +
        f('docType', 'Document type', { required: true, placeholder: 'Select…', options: M.ops.opts('doctypes', draft.docType) }) + f('docNo', 'Document number', { required: true, hint: 'Letters and digits, 6–12 characters.' }) + '</div>' }) +
      UI.card({ title: '2 · Room and stay', subtitle: off ? 'PMS data unavailable while offline — enter manually.' : 'Optionally prefill from demonstration PMS data.', actions: UI.button({ label: 'Fetch from demo PMS', size: 'sm', variant: 'secondary', action: 'reg-pms', disabled: off }),
        body: '<div class="form-grid">' + f('room', 'Room', { required: true }) + f('arrival', 'Arrival date', { type: 'date', required: true }) + f('departure', 'Departure date', { type: 'date', required: true }) + '</div>' + (pmsUsed ? '<div class="hint mt-5">Prefilled from SIMULATED PMS data — not a live integration.</div>' : '') }) +
      UI.card({ title: '3 · Document check', body: UI.checkbox({ id: 'f-checked', label: 'I have physically checked the guest’s original document against these details. *', checked: !!draft.checked }) + ((draft.err || {}).checked ? '<div class="error-text">' + (draft.err).checked + '</div>' : '') +
        '<div class="form-actions">' + UI.button({ label: 'Review & check in', variant: 'accent', icon: 'check', action: 'reg-review' }) + '</div>' }) + '</form></div>';
    },
    mount: function () {
      if (scanned) scanned.low.forEach(function (k) { var e = document.getElementById('f-' + k); if (e) e.style.borderColor = 'var(--warning-500)'; });
    }
  };
  function rerender() { collect(); M.rerender(); }
  M.actions.on('reg-clear', function () { draft = {}; scanned = null; pmsUsed = false; M.rerender(); M.toast.info('Form cleared', 'Nothing was saved or submitted.'); });
  var scanBusy = false;
  M.actions.on('reg-scan', function (el) {
    if (scanBusy) return; /* Stage 8.2: no second scan while one is running */
    scanBusy = true; el.disabled = true; el.textContent = 'Scanning (simulated)…';
    var started = location.hash;
    setTimeout(function () {
      scanBusy = false;
      /* Stage 8.2: if the person has moved to another page, drop the result instead of redrawing that page and wiping what they were doing there */
      if (!M.onRoute(started)) { M.toast.info('Simulated scan cancelled', 'You left the registration page before it finished; nothing was filled in.'); return; }
      collect(); /* Stage 8.2: keep room, dates and anything else already typed — the scan only supplies guest and document fields */
      draft = Object.assign(draft, { first: 'Imani', last: 'Mwangi', dob: '1991-07-23', nat: 'Kenya', res: 'Kenya', docType: 'Passport', docNo: 'AK4821735', err: {} });
      scanned = { low: ['docNo', 'dob'] }; M.rerender(); M.toast.info('Simulated scan complete', 'Two fields have low confidence — review them.');
    }, 900);
  });
  M.actions.on('reg-pms', function () { collect(); draft.room = '208'; draft.arrival = iso(0); draft.departure = iso(3); pmsUsed = true; draft.err = {}; M.rerender(); M.toast.info('Demo PMS data applied', 'Simulated values — edit if needed.'); });
  function validate() {
    /* Stage 8.7: the same rules the store enforces (S.validateReg), plus the form-only document-check confirmation. */
    var e = S.validateReg(draft);
    if (!draft.checked) e.checked = 'Confirm the document check to continue.';
    draft.err = e; return !Object.keys(e).length;
  }
  M.actions.on('reg-review', function () {
    collect();
    if (!validate()) { M.rerender(); M.toast.danger('Please fix the highlighted fields', Object.keys(draft.err).length + ' issue(s) found.'); var b = document.querySelector('[aria-invalid="true"]'); if (b) b.focus(); return; }
    /* Stage 8.2: validation passed, so remove error messages left on screen by an earlier failed attempt (the form is not redrawn on success) */
    Array.prototype.forEach.call(document.querySelectorAll('#reg-form .error-text'), function (n) { n.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll('#reg-form [aria-invalid]'), function (n) { n.removeAttribute('aria-invalid'); if (document.getElementById(n.id + '-hint')) n.setAttribute('aria-describedby', n.id + '-hint'); else n.removeAttribute('aria-describedby'); });
    var d = draft, nights = Math.round((new Date(d.departure) - new Date(d.arrival)) / 864e5);
    M.modal.open({ title: 'Confirm check-in', body: '<dl class="kv"><dt>Guest</dt><dd>' + esc(d.first + ' ' + d.last) + '</dd><dt>Nationality</dt><dd>' + esc(d.nat) + '</dd><dt>Document</dt><dd>' + esc(d.docType) + ' ' + masked(d.docNo) + '</dd><dt>Room</dt><dd>' + esc(d.room) + '</dd><dt>Stay</dt><dd>' + esc(d.arrival) + ' → ' + esc(d.departure) + ' (' + nights + ' nights)</dd></dl>' +
      UI.alert(S.offline ? 'warning' : 'info', S.offline ? 'Offline.' : 'Simulated reporting.', S.offline ? 'This record will be queued locally, not reported.' : 'A simulated submission to a demonstration government interface will start.'),
      actions: [{ label: 'Back to edit' }, { label: 'Confirm check-in', variant: 'primary', onClick: function () {
        var rec = S.checkIn({ ref: d.ref, guest: d.first + ' ' + d.last, nat: d.nat, docType: d.docType, docNo: d.docNo, dob: d.dob, room: d.room, arrival: d.arrival, departure: d.departure, nights: nights });
        if (!rec) return;
        draft = {}; scanned = null; pmsUsed = false;
        setTimeout(function () { M.modal.open({ title: 'Check-in complete', body: UI.alert('success', 'Checked in: ' + rec.ref, 'Submission status: <strong>' + esc(rec.sub) + '</strong> (simulated). Follow it in the Submission Centre.'),
          actions: [{ label: 'Open Submission Centre', onClick: function () { go('#/hotel/submissions'); } }, { label: 'View guest record', variant: 'primary', onClick: function () { go('#/hotel/registrations'); setTimeout(function () { M.openRecord(rec.ref); }, 60); } }] }); }, 30);
      } }] });
  });

  /* ---------- Guest records ---------- */
  function stayBadge(s) { return UI.badge(s, { 'Checked in': 'success', 'Checked out': 'neutral', Cancelled: 'danger', Expected: 'info', Draft: 'neutral' }[s] || 'neutral'); }
  var recCtl = null;
  M.pages['hotel/registrations'] = {
    title: 'Registrations',
    render: function (ctx) {
      /* Stage 8.2: an address like #/hotel/registrations/<ref> for a record that does not exist no longer silently shows the plain list */
      var sub = ctx && ctx.sub ? safeDecode(ctx.sub) : '', missing = !!sub && !S.get(sub);
      return UI.pageHead({ crumbs: crumbs('Registrations'), title: 'Guest records', description: 'Document numbers are masked. Open a record for actions.', actions: UI.button({ label: 'New registration', icon: 'user-plus', variant: 'accent', href: '#/hotel/new-registration' }) }) + '<div class="stack">' +
        (missing ? UI.alert('warning', 'Record not found.', 'No guest record “' + esc(sub) + '” exists in this demonstration dataset. The full list is shown below.') : '') +
        /* Stage 8.3 (Journey 5): the Government column shows statuses, so say here too that they are simulated. */
        demoBanner('The “Government” column shows simulated demonstration statuses. “Acknowledged” is produced by the prototype and is NOT a real government acknowledgement.') +
        UI.card({ flush: true, body: '<div id="rec-table"></div>' }) + '</div>'; },
    mount: function (root) {
      recCtl = UI.table.mount(root.querySelector('#rec-table'), { caption: 'Guest records', rows: S.recs, pageSize: 8, searchKeys: ['guest', 'ref', 'room', 'nat'], searchPlaceholder: 'Search name, reference, room…',
        filter: { key: 'sub', label: 'Government status', options: ['Not reported', 'Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'] },
        columns: [
          { key: 'guest', label: 'Guest', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.guest) + '</div><div class="cell-sub">' + esc(r.ref) + '</div>'; } },
          { key: 'room', label: 'Room', sortable: true },
          { key: 'arrival', label: 'Arrival', sortable: true }, { key: 'departure', label: 'Departure', sortable: true },
          { key: 'stay', label: 'Stay', render: function (r) { return stayBadge(r.stay); } },
          { key: 'sub', label: 'Government', render: function (r) { return UI.statusBadge(r.sub); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'View', size: 'sm', variant: 'ghost', action: 'hotel-view-reg', data: { ref: r.ref } }); } }] });
    }
  };

  /* Stage 9.0: small reusable hooks (behaviour unchanged) so the Check-in / Stay-changes pages reuse the existing form prefill and dialogs. */
  function startForm(r) { draft = { ref: r.ref, first: r.guest.split(' ')[0], last: r.guest.split(' ').slice(1).join(' '), nat: r.nat, docType: r.docType, docNo: r.docNo, dob: r.dob, room: r.room, arrival: r.arrival, departure: r.departure, err: {} }; scanned = null; go('#/hotel/new-registration'); }
  function checkOutConfirm(r) { M.modal.confirm({ title: 'Check out ' + r.guest + '?', body: '<p>Room ' + esc(r.room) + ' · ' + esc(r.ref) + '. A simulated check-out update will be reported.</p>', confirmLabel: 'Confirm check-out', variant: 'primary', onConfirm: function () { if (S.checkOut(r.ref)) M.toast.success('Checked out', r.ref + ' — update is simulated.'); } }); }
  M.hotelStartForm = startForm; M.hotelCheckOut = checkOutConfirm;
  M.openRecord = function (ref) {
    var r = S.get(ref); if (!r) return;
    var acts = [{ label: 'Close' }];
    if ((r.stay === 'Expected' || r.stay === 'Draft') && M.dir.can('registration:create', 'hotel')) acts.push({ label: 'Start check-in', variant: 'primary', onClick: function () { startForm(r); } });
    var canEdit = M.dir.can('registration:edit', 'hotel');
    if (canEdit && (r.stay === 'Checked in' || r.stay === 'Expected')) acts.push({ label: 'Amend', onClick: function () { setTimeout(function () { amend(r); }, 30); } });
    if (canEdit && r.stay !== 'Checked out' && r.stay !== 'Cancelled') acts.push({ label: 'Cancel registration', variant: 'danger', onClick: function () { setTimeout(function () { cancel(r); }, 30); } });
    if (canEdit && r.stay === 'Checked in') acts.push({ label: 'Check out', variant: 'primary', onClick: function () { setTimeout(function () { checkOutConfirm(r); }, 30); } });
    M.modal.open({ title: 'Guest record ' + r.ref,
      body: '<dl class="kv"><dt>Guest</dt><dd>' + esc(r.guest) + '</dd><dt>Nationality</dt><dd>' + esc(r.nat) + '</dd><dt>Document</dt><dd>' + esc(r.docType) + ' ' + masked(r.docNo) + '</dd><dt>Room</dt><dd>' + esc(r.room) + '</dd><dt>Stay</dt><dd>' + esc(r.arrival) + ' → ' + esc(r.departure) + '</dd><dt>Stay status</dt><dd>' + stayBadge(r.stay) + '</dd><dt>Government (simulated)</dt><dd>' + UI.statusBadge(r.sub) + (r.reason ? '<div class="hint">' + esc(r.reason) + '</div>' : '') + '</dd></dl>' +
        '<h3 class="mt-5" style="font-size:14px">Activity history</h3>' + r.history.slice().reverse().map(function (h) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(h.e) + '</div><div class="s">' + esc(h.t) + '</div></div></div>'; }).join(''), actions: acts });
  };
  M.actions.on('hotel-view-reg', function (el) { M.openRecord(el.getAttribute('data-ref')); });
  function cancel(r) {
    M.modal.open({ title: 'Cancel ' + r.ref + '?', body: '<p>A reason is required and will be kept in the activity history.</p>' + UI.textarea({ id: 'can-why', label: 'Reason', required: true, hint: 'Up to 200 characters. Do not enter personal data.' }),
      actions: [{ label: 'Keep registration' }, { label: 'Cancel registration', variant: 'danger', onClick: function (w) { var t = w.querySelector('#can-why'); if (!t.value.trim() || t.value.trim().length > 200) { t.setAttribute('aria-invalid', 'true'); t.focus(); M.toast.danger('Reason required', 'Enter a reason of up to 200 characters.'); return false; } if (S.cancel(r.ref, t.value.trim())) M.toast.warning('Registration cancelled', r.ref); } }] });
  }
  function amend(r) {
    M.modal.open({ title: 'Amend ' + r.ref, body: '<div class="form-grid">' + UI.input({ id: 'am-room', label: 'Room', value: r.room, required: true }) + UI.input({ id: 'am-dep', label: 'Departure date', type: 'date', value: r.departure, required: true }) + '</div>',
      actions: [{ label: 'Cancel' }, { label: 'Apply amendment', variant: 'primary', onClick: function (w) { var room = w.querySelector('#am-room').value.trim(), dep = w.querySelector('#am-dep').value; if (!room || room.length > 20 || !S.realDate(dep) || dep <= r.arrival) { M.toast.danger('Check the values', 'Room is required (up to 20 characters) and departure must be a valid date after arrival.'); return false; } if (S.amend(r.ref, { room: room, departure: dep })) M.toast.success('Amendment applied', r.ref + ' — resubmission simulated.'); } }] });
  }

  M.hotelCancel = cancel; M.hotelAmend = amend;

  /* ---------- Submission centre ---------- */
  M.pages['hotel/submissions'] = {
    title: 'Submission Status & History',
    render: function () {
      var chips = ['Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'].map(function (k) { return '<div class="chip-stat">' + UI.statusBadge(k) + ' <strong class="num">' + S.count(k) + '</strong></div>'; }).join(' ');
      return UI.pageHead({ crumbs: crumbs('Submission Centre'), title: 'Government Submission Centre', description: 'Simulated responses — demonstration mode.' }) + '<div class="stack">' +
        demoBanner('“Acknowledged” here is produced by the prototype. It is NOT a real government acknowledgement.') + '<div class="row" style="flex-wrap:wrap;gap:16px">' + chips + '</div>' +
        UI.card({ title: 'Submissions', subtitle: 'Rejected submissions can be retried; failure reasons are synthetic examples.', flush: true, body: '<div id="sub-table"></div>' }) +
        UI.card({ title: 'Recent activity', flush: true, body: recent() }) + '</div>';
    },
    mount: function (root) {
      UI.table.mount(root.querySelector('#sub-table'), { caption: 'Submissions', rows: S.recs.filter(function (x) { return x.sub !== 'Not reported'; }), pageSize: 8, searchKeys: ['guest', 'ref'], searchPlaceholder: 'Search reference or guest…',
        filter: { key: 'sub', label: 'Status', options: ['Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Queued offline', 'Conflict'] },
        columns: [
          { key: 'ref', label: 'Reference', render: function (r) { return '<span class="mono">' + esc(r.ref) + '</span><div class="cell-sub">' + esc(r.guest) + '</div>'; } },
          { key: 'sub', label: 'Status', sortable: true, render: function (r) { return UI.statusBadge(r.sub); } },
          { key: 'subAt', label: 'Last update', render: function (r) { return esc(r.subAt || '—'); } },
          { key: 'reason', label: 'Explanation', render: function (r) { return esc(r.reason || (r.sub === 'Queued offline' ? 'Waiting for synchronisation' : r.sub === 'Conflict' ? 'Needs conflict review' : '')); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return r.sub === 'Rejected' ? UI.button({ label: 'Retry', size: 'sm', variant: 'primary', action: 'sub-retry', data: { ref: r.ref } }) : UI.button({ label: 'History', size: 'sm', variant: 'ghost', action: 'hotel-view-reg', data: { ref: r.ref } }); } }] });
    }
  };
  function recent() { return (S.log.length ? S.log.slice(0, 6) : [{ t: '', ref: '—', guest: '', e: 'No activity yet in this session' }]).map(function (l) { return '<div class="list-row"><div class="grow"><div class="t">' + esc(l.e) + '</div><div class="s">' + esc(l.ref + (l.guest ? ' · ' + l.guest : '') + (l.t ? ' · ' + l.t : '')) + '</div></div></div>'; }).join(''); }
  S.recent = recent;
  M.actions.on('sub-retry', function (el) { if (!S.guard('submissions:create', 'Retry submission')) return; if (S.retry(el.getAttribute('data-ref'))) M.toast.info('Retry started (simulated)', 'Watch the status update.'); });

  /* ---------- Offline queue ---------- */
  M.pages['hotel/offline-queue'] = {
    title: 'Offline Queue & Sync',
    render: function () {
      var h = S.offHours, th = S.threshold, warn = !S.offline ? '' : h >= th ? UI.alert('danger', 'Offline-duration threshold exceeded.', 'Offline for ' + h + ' h; configurable demo threshold is ' + th + ' h (default 72 h per the brief). Escalation steps are for governance to define.') : h >= th * 0.66 ? UI.alert('warning', 'Approaching offline threshold.', 'Offline for ' + h + ' h of ' + th + ' h.') : '';
      return UI.pageHead({ crumbs: crumbs('Offline Queue'), title: 'Offline queue & synchronisation', description: 'Browser demonstration only — not secure or encrypted offline storage.',
        actions: UI.button({ label: S.offline ? 'Restore connection' : 'Simulate connection loss', icon: 'refresh', variant: 'secondary', action: 'off-toggle' }) + (S.offline ? UI.button({ label: '+24 h offline (demo)', variant: 'ghost', action: 'off-adv' }) : '') + UI.button({ label: 'Synchronise now', variant: 'accent', action: 'off-sync' }) }) +
        '<div class="stack">' + demoBanner('Queued records are NOT delivered to government until synchronisation succeeds. Conflicting records are never overwritten silently.') +
        UI.alert(S.offline ? 'warning' : 'success', S.offline ? 'Connection unavailable (simulated)' : 'Connection available (simulated)', S.offline ? 'New check-ins will be queued locally.' : 'Check-ins are submitted immediately (simulated).') + warn +
        UI.card({ title: 'Queued records', subtitle: S.queue().length + ' waiting', flush: true, body: '<div id="q-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      UI.table.mount(root.querySelector('#q-table'), { caption: 'Offline queue', rows: S.queue(), pageSize: 6, emptyText: 'The offline queue is empty.',
        columns: [{ key: 'ref', label: 'Reference', render: function (r) { return '<span class="mono">' + esc(r.ref) + '</span><div class="cell-sub">' + esc(r.guest) + '</div>'; } },
          { key: 'sub', label: 'Status', render: function (r) { return UI.statusBadge(r.sub); } },
          { key: 'a', label: '', align: 'right', render: function (r) { if (r.sub !== 'Conflict') return ''; /* Stage 8.2: a role without submissions:edit sees the button disabled with the reason, not an enabled button that only answers "Not permitted" */
          return M.dir.can('submissions:edit', 'hotel') ? UI.button({ label: 'Review conflict', size: 'sm', variant: 'primary', action: 'off-conflict', data: { ref: r.ref } }) : '<span title="Resolving a conflict requires ' + esc(M.dir.permLabel('submissions:edit')) + ' — not held by the acting demo user">' + UI.button({ label: 'Review conflict', size: 'sm', variant: 'primary', disabled: true }) + '</span>'; } }] });
    }
  };
  M.actions.on('off-toggle', function () { S.setOffline(!S.offline); M.toast.info(S.offline ? 'Connection lost (simulated)' : 'Connection restored (simulated)', S.offline ? 'New records will queue.' : 'Press Synchronise now.'); });
  M.actions.on('off-adv', function () { S.offHours += 24; S.changed(); });
  M.actions.on('off-sync', function () { if (S.offline) { M.toast.danger('Cannot synchronise', 'Connection is unavailable (simulated).'); return; } if (!S.guard('submissions:create', 'Synchronise')) return; var n = S.sync(); M.toast[n ? 'success' : 'info'](n ? 'Synchronising ' + n + ' record(s) (simulated)' : 'Nothing to synchronise', S.queue().length ? 'Conflicts need review.' : ''); });
  M.actions.on('off-conflict', function (el) {
    if (!S.guard('submissions:edit', 'Resolve conflict')) return;
    var r = S.get(el.getAttribute('data-ref')), c = r && r.conflict; if (!c) return;
    M.modal.open({ title: 'Conflict on ' + r.ref, body: UI.alert('warning', c.field + ' differs.', 'Local (this device): <strong>' + esc(c.local) + '</strong> · Server (simulated): <strong>' + esc(c.server) + '</strong>. Choose which to keep; the choice is logged.'),
      actions: [{ label: 'Decide later' }, { label: 'Keep server value', onClick: function () { S.resolve(r.ref, 'server'); } }, { label: 'Keep local value', variant: 'primary', onClick: function () { S.resolve(r.ref, 'local'); } }] });
  });
})(window);
