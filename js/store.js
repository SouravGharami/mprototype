/* Msafiri — shared SYNTHETIC hotel state. Every Hotel Portal page reads from here so counts never contradict.
   Submission outcomes are SIMULATED. Rule (demo only): a document number ending in 9 is rejected. */
(function (g) {
  'use strict';
  var M = g.Msafiri, D = M.demo, S = M.store = {}, timers = [], tok = {};
  function iso(d) { return new Date(Date.now() + d * 864e5).toISOString().slice(0, 10); }
  function stamp() { return new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  var REJ = 'Document number format not accepted (synthetic example)';

  function seed() {
    var map = { Acknowledged: ['Checked in', 'Acknowledged'], Submitted: ['Checked in', 'Submitted'], Pending: ['Checked in', 'Pending'],
      Rejected: ['Checked in', 'Rejected'], Draft: ['Draft', 'Not reported'], Expected: ['Expected', 'Not reported'] };
    var r = JSON.parse(JSON.stringify(D.hotel.arrivals)).map(function (a, i) {
      var m = map[a.status] || map.Expected;
      return { ref: a.ref, guest: a.guest, nat: a.nat, room: a.room, eta: a.eta, nights: a.nights, stay: m[0], sub: m[1], arrival: iso(0), docType: 'Passport', docNo: 'PA' + (1000000 + i * 37137), dob: '1988-04-1' + (i % 9), reason: m[1] === 'Rejected' ? REJ : '', subAt: m[1] === 'Not reported' ? '' : '09:' + (10 + i * 4) };
    });
    [{ ref: 'REG-240950', guest: 'Hannah Weber', nat: 'Germany', room: '112', nights: 2, stay: 'Checked in', sub: 'Queued offline' },
     { ref: 'REG-240951', guest: 'Samuel Okafor', nat: 'Nigeria', room: '214', nights: 3, stay: 'Checked in', sub: 'Conflict', conflict: { field: 'Room number', local: '214', server: '216' } },
     { ref: 'REG-240940', guest: 'Ana Costa', nat: 'Brazil', room: '303', nights: 1, stay: 'Checked out', sub: 'Acknowledged', back: 1 },
     { ref: 'REG-240941', guest: 'Ken Ito', nat: 'Japan', room: '120', nights: 2, stay: 'Checked out', sub: 'Acknowledged', back: 2 }].forEach(function (x, i) {
      x.arrival = iso(-(x.back || 0)); x.eta = '12:00'; x.docType = 'Passport'; x.docNo = 'PB' + (2000000 + i * 51111); x.dob = '1985-09-0' + (i + 1); x.subAt = x.sub === 'Queued offline' || x.sub === 'Conflict' ? '' : '08:30'; x.reason = ''; r.push(x);
    });
    r.forEach(function (x) { x.departure = iso(x.nights - (iso(0) === x.arrival ? 0 : 0) + (x.back ? -x.back + 0 : 0) - (x.back ? 0 : 0)); x.history = [{ t: x.arrival, e: 'Record created (seeded demo data)' }]; if (x.stay === 'Checked in') x.history.push({ t: x.arrival, e: 'Checked in (seeded)' }); });
    r.forEach(function (x) { if (x.back) x.departure = iso(0); else x.departure = iso(x.nights); });
    return r;
  }
  /* Audit trail (read-only through the UI). Hotel events and government actions both write here. */
  function seedAudit() {
    return [['08:02', 'Neema Kiptoo (Hotel, demo)', 'Registration activity', 'REG-241012', 'Checked in (seeded demo data)', 'Success'],
      ['08:41', 'System (simulated)', 'Submission event', 'REG-240981', 'Rejected by simulated interface: ' + REJ, 'Rejected'],
      ['09:10', 'Sofia Okello (Admin, demo)', 'Administrative action', 'Reference data', 'Reviewed document-type list (demo)', 'Success']]
      .map(function (a) { return { t: a[0], user: a[1], type: a[2], target: a[3], detail: a[4], outcome: a[5] }; }).reverse();
  }
  S.aud = function (user, type, target, detail, outcome) { S.audit.unshift({ t: stamp(), user: user, type: type, target: target, detail: detail, outcome: outcome || 'Success' }); };
  S.reset = function () { timers.forEach(clearTimeout); timers = []; tok = {}; S.recs = seed(); S.offline = false; S.offHours = 0; S.log = []; S.threshold = 72; S.unmasked = {}; S.audit = seedAudit(); S.changed(); };
  S.get = function (ref) { return S.recs.filter(function (x) { return x.ref === ref; })[0]; };
  S.changed = function () {
    var f = M.findItem('hotel', 'offline-queue'); if (f) f.item.count = S.queue().length;
    if (M.refreshSidebar) M.refreshSidebar();
    syncBell();
    if (M.state && /^hotel\/(dashboard|submissions|registrations|offline-queue|check-in|in-house|stay-changes|pms|compliance)$/.test(M.state.portal + '/' + M.state.id) && M.rerender) {
      if (document.querySelector('.modal-backdrop,.modal')) S.stale = true; else { S.stale = false; (M.softRerender || M.rerender)(); }
    }
  };
  /* Stage 7.2: refresh a hotel page whose re-render was skipped because a dialog was open (called when the dialog closes). */
  S.flush = function () { if (S.stale && !document.querySelector('.modal-backdrop,.modal')) { S.stale = false; if (M.softRerender || M.rerender) (M.softRerender || M.rerender)(); } };
  /* Stage 7.2: Hotel bell items for rejected / queued counts follow the live store instead of fixed text. */
  var bellSeen = {};
  function syncBell() {
    var list = M.demo && M.demo.notifications && M.demo.notifications.hotel; if (!list) return;
    [['h1', S.count('Rejected'), 'submission(s) rejected (simulated)', 'Open the Submission Centre to review and retry', 'No rejected submissions', 'Nothing needs attention'],
     ['h2', S.queue().length, 'record(s) queued offline', 'Not delivered to government until synchronised', 'No records queued offline', 'Offline queue is empty']].forEach(function (d) {
      var n = list.filter(function (x) { return x.id === d[0]; })[0]; if (!n) return;
      n.title = d[1] ? d[1] + ' ' + d[2] : d[4]; n.sub = d[1] ? d[3] : d[5];
      if (bellSeen[d[0]] !== d[1]) { bellSeen[d[0]] = d[1]; n.unread = d[1] > 0; if (M.state && M.state.read && M.state.read.hotel) delete M.state.read.hotel[d[0]]; }
    });
    if (M.refreshBell && M.state && M.state.portal === 'hotel') M.refreshBell();
  }
  /* Stage 7.4: backstop permission check for state-changing hotel operations (frontend demonstration only — NOT production access control). */
  S.guard = function (perm, what) {
    if (!M.dir || M.dir.can(perm, 'hotel')) return true;
    var me = M.dir.me('hotel');
    S.aud((me ? me.name : 'Unknown user') + ' (Hotel, demo)', 'Permission denied', '—', what + ' blocked — requires ' + M.dir.permLabel(perm), 'Blocked');
    if (M.toast) M.toast.danger('Not permitted', 'Your demo role does not hold ' + M.dir.permLabel(perm) + '.');
    return false;
  };
  S.actor = function () { var me = M.dir && M.dir.me('hotel'); return (me ? me.name : 'Neema Kiptoo') + ' (Hotel, demo)'; };
  S.event = function (rec, text) { var e = { t: stamp(), e: text }; rec.history.push(e);
    S.aud(/Submission|Sent|Acknowledged|Rejected|queued|Retry|Synchron|update|Amendment|Cancellation/i.test(text) ? 'System (simulated)' : S.actor(), /Submission|Sent|Acknowledged|Rejected|queued|Retry|Synchron|update|Amendment|Cancellation/i.test(text) ? 'Submission event' : 'Registration activity', rec.ref, text, /Rejected/.test(text) ? 'Rejected' : 'Success'); S.log.unshift({ t: e.t, ref: rec.ref, guest: rec.guest, e: text }); };
  S.queue = function () { return S.recs.filter(function (x) { return x.sub === 'Queued offline' || x.sub === 'Conflict'; }); };

  /* Simulated government response */
  S.submit = function (rec, label) {
    var my = tok[rec.ref] = (tok[rec.ref] || 0) + 1; /* Stage 7.2: a newer submission supersedes this record's in-flight timers */
    if (S.offline) { rec.sub = 'Queued offline'; rec.subAt = ''; S.event(rec, 'Connection unavailable — queued locally. NOT delivered to government.'); S.changed(); return; }
    rec.sub = 'Pending'; rec.subAt = ''; rec.reason = ''; S.event(rec, (label || 'Submission') + ' prepared — Pending (simulated)'); S.changed();
    timers.push(setTimeout(function () { if (tok[rec.ref] !== my) return; rec.sub = 'Submitted'; rec.subAt = stamp(); S.event(rec, 'Sent to simulated government interface'); S.changed(); }, 1500));
    timers.push(setTimeout(function () {
      if (tok[rec.ref] !== my) return;
      if (/9$/.test(rec.docNo) && !rec.retried) { rec.sub = 'Rejected'; rec.reason = REJ; S.event(rec, 'Rejected by simulated interface: ' + REJ); }
      else { rec.sub = 'Acknowledged'; S.event(rec, 'Acknowledged by simulated interface (demo — not a real acknowledgement)'); }
      rec.subAt = stamp(); S.changed();
    }, 3200));
  };

  /* Stage 8.7: single validation routine shared by the registration form and the store, so a direct call cannot bypass the form's rules (the prototype's only "server side" is this store). Messages for the pre-existing rules are unchanged. Length limits below are technical bounds, not government policy. */
  function realDate(v) { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false; var d = new Date(v + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === v; }
  S.realDate = realDate;
  S.validateReg = function (d) {
    var e = {}; d = d || {};
    var t = function (k) { return typeof d[k] === 'string' ? d[k].trim() : (d[k] == null ? '' : String(d[k]).trim()); };
    var nm = function (k, lbl) { var v = t(k); if (!v) e[k] = 'Enter the guest’s ' + lbl + ' name.'; else if (v.length > 80 || /[\u0000-\u001f<>]/.test(v)) e[k] = 'Use up to 80 characters, without < > or control characters.'; };
    nm('first', 'first'); nm('last', 'last');
    if (!t('dob')) e.dob = 'Enter the date of birth.'; else if (!realDate(t('dob'))) e.dob = 'Enter a valid date of birth.'; else if (t('dob') > iso(0)) e.dob = 'Date of birth cannot be in the future.';
    if (!t('nat')) e.nat = 'Select a nationality.';
    if (!t('docType')) e.docType = 'Select a document type.';
    if (!t('docNo')) e.docNo = 'Enter the document number.'; else if (!/^[A-Za-z0-9]{6,12}$/.test(t('docNo'))) e.docNo = 'Use 6–12 letters or digits, no spaces.';
    if (!t('room')) e.room = 'Enter a room.'; else if (t('room').length > 20 || /[\u0000-\u001f<>]/.test(t('room'))) e.room = 'Use up to 20 characters, without < > or control characters.';
    if (!t('arrival')) e.arrival = 'Enter the arrival date.'; else if (!realDate(t('arrival'))) e.arrival = 'Enter a valid arrival date.';
    if (!t('departure')) e.departure = 'Enter the departure date.'; else if (!realDate(t('departure'))) e.departure = 'Enter a valid departure date.';
    if (!e.arrival && !e.departure && t('departure') <= t('arrival')) e.departure = 'Departure must be after arrival.';
    return e;
  };
  S.checkIn = function (d) {
    if (!S.guard('registration:create', 'Check-in')) return null;
    /* Stage 8.7: store-level validation (same rules as the form). The form passes guest as a joined name, so split it back for the shared check. */
    var parts = String((d && d.guest) || '').trim().split(/\s+/), ve = S.validateReg({ first: parts[0] || '', last: parts.slice(1).join(' '), dob: d && d.dob, nat: d && d.nat, docType: d && d.docType, docNo: d && d.docNo, room: d && d.room, arrival: d && d.arrival, departure: d && d.departure });
    if (Object.keys(ve).length) { S.refuse('Check-in', d && d.ref ? S.get(d.ref) : null, 'registration details are invalid (' + Object.keys(ve).join(', ') + ').'); return null; }
    var ref = d.ref || 'REG-' + (241100 + S.recs.length), rec = S.get(ref);
    /* Stage 8.4 (provisional MSF-FR-005): an existing record may only be checked in from Expected/Draft, as the record dialog already requires; a direct call must not revive a Cancelled / Checked-out / already Checked-in record. */
    if (rec && rec.stay !== 'Expected' && rec.stay !== 'Draft') { S.refuse('Check-in', rec, 'a ' + String(rec.stay).toLowerCase() + ' record cannot be checked in.'); return null; }
    if (!rec) { rec = { ref: ref, history: [] }; S.recs.unshift(rec); S.event(rec, 'Registration created'); }
    Object.assign(rec, d, { ref: ref, stay: 'Checked in', sub: 'Not reported', eta: new Date().toTimeString().slice(0, 5) });
    S.event(rec, 'Document check confirmed by receptionist; checked in'); S.submit(rec); return rec;
  };
  /* Stage 8.7: only a Rejected submission can be retried (the Submission Centre only offers Retry there); a direct call used to restart an Acknowledged record. Returns true only when a retry started. */
  S.retry = function (ref) { if (!S.guard('submissions:create', 'Retry submission')) return false; var r = S.get(ref); if (!r) return false; if (r.sub !== 'Rejected') return S.refuse('Retry submission', r, 'only a rejected submission can be retried (status is ' + r.sub + ').'); r.retried = true; S.submit(r, 'Retry'); return true; };
  /* Stage 8.4 (provisional MSF-FR-005/016, NFR-003): lifecycle rules are enforced here as well as in the record dialog, so a direct call cannot corrupt status. Same rules the dialog already applies. Returns true only when the change was made. */
  S.refuse = function (what, r, why) { S.aud(S.actor(), 'Action blocked', r ? r.ref : '—', what + ' refused — ' + why, 'Blocked'); if (M.toast) M.toast.danger('Not allowed', why); return false; };
  S.checkOut = function (ref) { if (!S.guard('registration:edit', 'Check-out')) return false; var r = S.get(ref); if (!r) return false; if (r.stay !== 'Checked in') return S.refuse('Check-out', r, 'only a checked-in record can be checked out (status is ' + r.stay + ').'); r.stay = 'Checked out'; S.event(r, 'Checked out'); S.submit(r, 'Check-out update'); return true; };
  S.cancel = function (ref, why) { if (!S.guard('registration:edit', 'Cancel registration')) return false; var r = S.get(ref); if (!r) return false; if (r.stay === 'Checked out' || r.stay === 'Cancelled') return S.refuse('Cancel registration', r, 'a ' + r.stay.toLowerCase() + ' record cannot be cancelled.'); why = typeof why === 'string' ? why.trim() : ''; if (!why || why.length > 200) return S.refuse('Cancel registration', r, 'a reason of 1–200 characters is required.'); r.stay = 'Cancelled'; S.event(r, 'Cancelled — reason: ' + why); if (r.sub !== 'Not reported') S.submit(r, 'Cancellation update'); else S.changed(); return true; };
  S.amend = function (ref, v) { if (!S.guard('registration:edit', 'Amend registration')) return false; var r = S.get(ref); if (!r) return false; if (r.stay !== 'Checked in' && r.stay !== 'Expected') return S.refuse('Amend registration', r, 'a ' + r.stay.toLowerCase() + ' record cannot be amended.'); var room = v ? String(v.room || '').trim() : ''; if (!v || !room || room.length > 20 || /[\u0000-\u001f<>]/.test(room) || !realDate(v.departure) || v.departure <= r.arrival) return S.refuse('Amend registration', r, 'room is required (up to 20 characters) and departure must be a valid date after arrival.'); v = { room: room, departure: v.departure }; S.event(r, 'Amended: room ' + r.room + '→' + v.room + ', departure ' + r.departure + '→' + v.departure); r.room = v.room; r.departure = v.departure; if (r.sub !== 'Not reported') S.submit(r, 'Amendment'); else S.changed(); return true; };
  S.setOffline = function (b) { S.offline = b; S.offHours = 0; S.log.unshift({ t: stamp(), ref: '—', guest: 'Connection', e: b ? 'Connection unavailable (simulated)' : 'Connection restored (simulated)' }); S.changed(); };
  S.sync = function () { if (!S.guard('submissions:create', 'Synchronise')) return 0; var q = S.recs.filter(function (x) { return x.sub === 'Queued offline'; }); q.forEach(function (r) { S.event(r, 'Synchronisation started (simulated)'); S.submit(r, 'Synced submission'); }); return q.length; };
  S.resolve = function (ref, keep) { if (!S.guard('submissions:edit', 'Resolve conflict')) return; var r = S.get(ref), c = r && r.conflict; if (!c) return; if (keep === 'server') r.room = c.server; else r.room = c.local; S.event(r, 'Conflict on ' + c.field + ' reviewed by user: kept ' + keep + ' value (' + (keep === 'server' ? c.server : c.local) + ')'); r.conflict = null; r.sub = 'Queued offline';
    /* Stage 8.2: resubmit ONLY the record whose conflict was just resolved (it used to synchronise every queued record as a side effect). */
    if (S.offline) { S.event(r, 'Conflict resolved — stays in the offline queue until the connection is restored (simulated)'); S.changed(); }
    else if (S.guard('submissions:create', 'Synchronise')) { S.event(r, 'Synchronisation started (simulated)'); S.submit(r, 'Synced submission'); }
    else S.changed(); };

  S.count = function (k) { return S.recs.filter(function (x) { return x.sub === k; }).length; };
  S.cards = function () {
    var inHouse = S.recs.filter(function (x) { return x.stay === 'Checked in'; }).length, today = iso(0);
    var arr = S.recs.filter(function (x) { return x.arrival === today && x.stay !== 'Cancelled'; }), reg = arr.filter(function (x) { return x.stay !== 'Expected' && x.stay !== 'Draft'; }).length;
    return [
      { label: 'Total registrations', value: S.recs.length, icon: 'users', delta: inHouse + ' in house', dtone: 'flat', tone: 'up', foot: 'synthetic records' },
      { label: 'Arrivals today', value: arr.length, icon: 'log-in', tone: 'orange', delta: reg + ' registered', dtone: 'flat', foot: (arr.length - reg) + ' remaining', accent: true },
      { label: 'Departures today', value: S.recs.filter(function (x) { return x.departure === today && x.stay !== 'Cancelled'; }).length, icon: 'log-out', delta: S.recs.filter(function (x) { return x.stay === 'Checked out'; }).length + ' checked out', dtone: 'flat', tone: 'up', foot: '' },
      { label: 'Pending submissions', value: S.count('Pending') + S.count('Submitted') + S.queue().length, icon: 'send', tone: 'red', delta: S.count('Acknowledged') + ' acknowledged · ' + S.count('Rejected') + ' rejected', dtone: S.count('Rejected') ? 'down' : 'flat', foot: 'simulated status' }
    ];
  };
  S.segments = function () {
    return [['Acknowledged', 'var(--success-500)'], ['Submitted', 'var(--chart-2)'], ['Pending', 'var(--warning-500)'], ['Queued offline', 'var(--chart-4)'], ['Conflict', 'var(--chart-3)'], ['Rejected', 'var(--danger-500)']]
      .map(function (s) { return { label: s[0], value: S.count(s[0]), color: s[1] }; }).filter(function (s) { return s.value; });
  };
  S.attention = function () {
    var out = S.recs.filter(function (x) { return x.sub === 'Rejected'; }).map(function (x) { return { t: 'Rejected: ' + (x.reason || 'see record'), s: x.ref + ' · Room ' + x.room + ' (simulated)', tone: 'danger', tag: 'Rejected' }; });
    if (S.queue().length) out.push({ t: S.queue().length + ' record(s) in the offline queue', s: 'Not delivered to government until synchronised', tone: 'warning', tag: 'Offline' });
    return out.length ? out : [{ t: 'Nothing needs attention', s: 'All simulated submissions are progressing', tone: 'success', tag: 'OK' }];
  };
  S.rows = function () { return S.recs.filter(function (x) { return x.stay === 'Expected' || x.stay === 'Draft' || x.stay === 'Checked in'; }).map(function (x) { return { ref: x.ref, guest: x.guest, nat: x.nat, room: x.room, eta: x.eta, nights: x.nights, status: x.stay === 'Checked in' ? x.sub : x.stay }; }); };
  S.reset();
  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(S.reset);
})(window);
