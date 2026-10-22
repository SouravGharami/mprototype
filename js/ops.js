/* Msafiri — Stage 4B: reference data, configuration (maker-checker), notifications, support incidents, exceptional access, admin audit view.
   SYNTHETIC, frontend-only. Shared state: Msafiri.ops; audit events go to the SAME trail as Stages 3/4A (Msafiri.store.audit).
   Not production security or audit integrity. URS not supplied: no requirement IDs are claimed. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, R = M.dir, S = M.store, D = M.demo, O = M.ops = {}, MIN = 6e4, DAY = 864e5;
  var N = function () { return Date.now(); }, today = function () { return new Date().toISOString().slice(0, 10); }, fmt = function (t) { return R.fmt(t); };
  var me = function () { return R.me('admin'); }, can = function (p) { return R.can(p, 'admin'); };
  var ago = function (ms) { return N() - ms; };
  function stampOf(ts) { return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function crumbs() { var a = [{ label: 'System Administration', href: '#/admin/dashboard' }]; for (var i = 0; i < arguments.length; i++) a.push(typeof arguments[i] === 'string' ? { label: arguments[i] } : arguments[i]); return a; }
  function gate(ok, o, why) { if (ok) return UI.button(o); return '<span title="' + esc(why || 'Not permitted for the acting demo role') + '">' + UI.button(Object.assign({}, o, { href: null, action: null, disabled: true })) + '</span>'; }
  var SIM = 'Synthetic data held in this browser tab. Not live monitoring, not a real help desk, and not production security or audit integrity.';
  function note(t) { return UI.alert('info', 'Demonstration data.', esc(t || SIM)); }
  function sel(id, label, opts) { return '<select class="select input-sm" id="' + id + '" aria-label="' + esc(label) + '"><option value="">' + esc(label) + ': All</option>' + opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>'; }
  function fm(title, body, label, fn, variant) {
    M.modal.open({ title: title, body: '<div id="m-err"></div>' + body, actions: [{ label: 'Cancel' }, { label: label, variant: variant || 'primary', onClick: function (w) { var e = fn(w); if (e) { w.querySelector('#m-err').innerHTML = UI.alert('danger', 'Cannot continue.', esc(e)); return false; } } }] });
  }
  var V = function (w, id) { var e = w.querySelector('#' + id); return e ? String(e.type === 'checkbox' ? e.checked : e.value).trim() : ''; };
  function tone(s) { return { Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'info', Info: 'neutral', Open: 'warning', Acknowledged: 'info', Resolved: 'success', Closed: 'neutral', Escalated: 'danger', 'In progress': 'info', Pending: 'warning', 'Pending approval': 'warning', Approved: 'success', Rejected: 'danger', Withdrawn: 'neutral', Active: 'success', Inactive: 'neutral', Scheduled: 'info', Expired: 'neutral', Revoked: 'danger', Denied: 'danger', Applied: 'success', Proposed: 'warning' }[s] || 'neutral'; }
  var B = function (s) { return UI.badge(s, tone(s)); };
  var nameOf = function (id) { var u = R.user(id); return u ? u.name : id || '—'; };

  /* ---------- audit (shared trail) ---------- */
  O.audit = function (type, mod, target, detail, outcome, rel, actor) {
    var u = me(), who = actor || (u ? u.name : 'Demo user') + ' (Admin, demo)';
    S.aud(who, type, target, detail, outcome || 'Success'); var e = S.audit[0]; e.ts = N(); e.mod = mod; e.rel = rel || '';
    D.admin.audit.unshift({ when: new Date().toTimeString().slice(0, 5), actor: u ? u.name : who, action: detail, module: mod, result: outcome || 'Success' });
  };
  var TYPEAREA = { 'Registration activity': 'Hotel registration', 'Submission event': 'Submissions', 'Identifying search': 'Guest-record access', 'Record search': 'Guest-record access', 'Search blocked': 'Guest-record access', 'Record view': 'Guest-record access', 'Unmasking': 'Guest-record access', 'Re-masked': 'Guest-record access' };
  O.area = function (a) { return a.mod || TYPEAREA[a.type] || 'Administration'; };
  O.auditTypes = function () { var o = []; S.audit.forEach(function (a) { if (o.indexOf(a.type) < 0) o.push(a.type); }); return o; };

  /* ---------- reference data ---------- */
  O.CATS = [
    { id: 'countries', label: 'Country codes (ISO 3166-1 alpha-2, synthetic subset)', basis: 'Named in the brief', use: 'Hotel registration: nationality and residence lists', code: true },
    { id: 'divisions', label: 'Administrative divisions', basis: 'Named in the brief', use: 'Establishment location (admin, hotel profile, government directory)', unresolved: true },
    { id: 'doctypes', label: 'Document types', basis: 'Named in the brief', use: 'Hotel registration: document type', unresolved: true },
    { id: 'estcats', label: 'Establishment categories', basis: 'Assumption (URS not supplied)', use: 'Establishment forms and filters', unresolved: true },
    { id: 'purposes', label: 'Search purposes', basis: 'Assumption (URS not supplied)', use: 'Government guest-record search', unresolved: true }
  ];
  O.cat = function (id) { return O.CATS.filter(function (c) { return c.id === id; })[0]; };
  function seedRef() {
    var n = 0, out = [];
    function add(cat, code, name, from, extra) { n++; out.push(Object.assign({ id: 'RD-' + ('000' + n).slice(-4), cat: cat, code: code, name: name, status: 'Active', from: from || '2026-01-01', to: '', notes: '', hist: [{ ts: ago(30 * DAY), by: 'Seed data', a: 'Created (synthetic seed)' }] }, extra || {})); }
    [['KE', 'Kenya'], ['TZ', 'Tanzania'], ['UG', 'Uganda'], ['DE', 'Germany'], ['GB', 'United Kingdom'], ['IN', 'India'], ['JP', 'Japan'], ['BR', 'Brazil'], ['NG', 'Nigeria'], ['FR', 'France']].forEach(function (c) { add('countries', c[0], c[1]); });
    add('countries', 'GH', 'Ghana'); add('countries', 'SE', 'Sweden', new Date(N() + 30 * DAY).toISOString().slice(0, 10), { notes: 'Scheduled: not selectable until the effective date (demonstrates effective dating).' });
    ['Coastal', 'Central', 'Northern', 'Lake zone', 'Southern'].forEach(function (d, i) { add('divisions', 'DV-0' + (i + 1), d, '', { notes: 'Placeholder region — real hierarchy to be confirmed.' }); });
    ['Passport', 'National ID card', 'Residence permit', 'Other (configurable)'].forEach(function (d, i) { add('doctypes', 'DT-0' + (i + 1), d); });
    R.CATS0.forEach(function (d, i) { add('estcats', 'EC-0' + (i + 1), d); });
    [1, 2, 3].forEach(function (i) { add('purposes', 'SP-0' + i, 'Sample purpose ' + i + ' (placeholder)', '', { notes: 'Legal purposes are undecided.' }); });
    return out;
  }
  O.eff = function (v) { var t = today(); return v.status === 'Inactive' ? 'Inactive' : v.from && v.from > t ? 'Scheduled' : v.to && v.to < t ? 'Expired' : 'Active'; };
  O.names = function (cat, all) { return O.ref.filter(function (v) { return v.cat === cat && (all || O.eff(v) === 'Active'); }).map(function (v) { return v.name; }); };
  O.opts = function (cat, cur) { var l = O.names(cat); if (cur && l.indexOf(cur) < 0) l.push(cur); return l; };
  O.usage = function (v) { return v.cat === 'divisions' ? R.ests.filter(function (e) { return e.loc === v.name; }).length : v.cat === 'estcats' ? R.ests.filter(function (e) { return e.cat === v.name; }).length : v.cat === 'countries' ? S.recs.filter(function (r) { return r.nat === v.name; }).length : v.cat === 'doctypes' ? S.recs.filter(function (r) { return r.docType === v.name; }).length : 0; };
  O.syncRef = function () { R.CATS.length = 0; O.names('estcats').forEach(function (x) { R.CATS.push(x); }); R.REGIONS.length = 0; O.names('divisions').forEach(function (x) { R.REGIONS.push(x); }); };
  O.refSave = function (id, d) {
    var v = id ? O.ref.filter(function (x) { return x.id === id; })[0] : null, c = O.cat(v ? v.cat : d.cat), ch = [];
    if (!d.name) return 'Enter a name.'; if (c.code && !/^[A-Z]{2}$/.test(d.code)) return 'Enter a two-letter upper-case code.'; if (!c.code && !d.code) return 'Enter a code.';
    if (O.ref.some(function (x) { return x.cat === c.id && x.id !== id && (x.name.toLowerCase() === d.name.toLowerCase() || x.code === d.code); })) return 'Another value in this list has the same name or code.';
    if (d.to && d.from && d.to < d.from) return 'Effective-to date cannot be before effective-from.';
    if (v && v.name !== d.name && O.usage(v)) return 'The name is in use by ' + O.usage(v) + ' record(s) and is locked. Deactivate it and add a new value instead.';
    if (v && d.status === 'Inactive' && v.status !== 'Inactive' && O.names(c.id).length === 1 && O.eff(v) === 'Active') return 'The last active value in a list cannot be deactivated.';
    if (!v) { v = { id: 'RD-' + ('000' + (O.ref.length + 1)).slice(-4), cat: c.id, hist: [] }; O.ref.push(v); ch.push('Created'); }
    ['code', 'name', 'status', 'from', 'to', 'notes'].forEach(function (k) { if ((v[k] || '') !== (d[k] || '')) { if (ch[0] !== 'Created') ch.push(k + ': “' + (v[k] || '—') + '” → “' + (d[k] || '—') + '”'); v[k] = d[k]; } });
    if (ch.length) { v.hist.unshift({ ts: N(), by: me().name, a: ch.join('; ') }); O.audit('Reference data change', 'Reference data', v.id, c.label + ' · ' + v.name + ' — ' + ch.join('; '), 'Success', c.id); }
    O.syncRef(); O.changed(); return null;
  };

  /* ---------- configuration + maker-checker ---------- */
  var NP = ['submissions', 'pms', 'offline', 'quality', 'approvals', 'incidents', 'access', 'refdata', 'validation', 'review', 'export', 'webhook']; /* last four: Stage 6.3 reporting/webhook alerts */
  O.SET = [
    { k: 'offlineThresholdHours', g: 'Offline & synchronisation', l: 'Offline-duration warning threshold', t: 'num', u: 'hours', min: 1, max: 240, def: 72, live: 1, h: 'Drives the Hotel Portal offline warning. 72 h is the brief’s default; the URS value is to be confirmed.' },
    { k: 'retryMax', g: 'Submission retry (demonstration)', l: 'Maximum retry attempts', t: 'num', u: 'attempts', min: 1, max: 10, def: 3, h: 'Display only — the simulated interface does not use this value.' },
    { k: 'retryInterval', g: 'Submission retry (demonstration)', l: 'Retry interval', t: 'num', u: 'seconds', min: 5, max: 3600, def: 60, h: 'Display only.' },
    { k: 'regScanPct', g: 'Registration workflow (demonstration)', l: 'Low-confidence highlight threshold (simulated scan)', t: 'num', u: '%', min: 50, max: 99, def: 80, h: 'Display only. Document-check confirmation before check-in is fixed and cannot be switched off.' },
    { k: 'refReviewDays', g: 'Reference data', l: 'Reference-data review interval', t: 'num', u: 'days', min: 7, max: 365, def: 90, live: 1, h: 'Drives the “Reference data” check on the admin dashboard.' },
    { k: 'accessMaxMin', g: 'Security-relevant (maker-checker)', l: 'Exceptional-access maximum duration', t: 'num', u: 'minutes', min: 5, max: 240, def: 60, live: 1, sens: 1, h: 'Upper limit when requesting time-limited support access.' },
    { k: 'unmaskMinChars', g: 'Security-relevant (maker-checker)', l: 'Unmasking justification minimum length', t: 'num', u: 'characters', min: 10, max: 200, def: 10, live: 1, sens: 1, h: 'Used by Government Portal unmasking. Cannot go below the prototype baseline of 10.' },
    { k: 'sessionTimeout', g: 'Security-relevant (maker-checker)', l: 'Administrator session timeout', t: 'num', u: 'minutes', min: 5, max: 120, def: 30, sens: 1, h: 'Display only — no real sessions exist.' },
    { k: 'lockoutAttempts', g: 'Security-relevant (maker-checker)', l: 'Failed sign-in lockout threshold', t: 'num', u: 'attempts', min: 3, max: 10, def: 5, sens: 1, h: 'Display only — no real sign-in exists.' }
  ].concat(NP.map(function (c) { return { k: 'notify.' + c, g: 'Notification preferences', l: 'Show “' + c + '” notifications in the top-bar bell', t: 'bool', def: true, live: 1, h: '' }; }));
  O.def = function (k) { return O.SET.filter(function (s) { return s.k === k; })[0]; };
  O.applyCfg = function (k, v) { O.cfg[k] = v; if (k === 'offlineThresholdHours') S.threshold = v; };
  O.hist = function (o) { O.history.unshift(Object.assign({ id: 'CH-' + ('000' + (O.history.length + 1)).slice(-4), ts: N() }, o)); };
  O.check = function (s, raw) { if (s.t === 'bool') return { v: !!raw }; var n = Number(raw); if (raw === '' || !isFinite(n) || n % 1) return { e: 'Enter a whole number.' }; if (n < s.min || n > s.max) return { e: 'Must be between ' + s.min + ' and ' + s.max + ' ' + s.u + '.' }; return { v: n }; };
  O.pending = function (k) { return O.props.filter(function (p) { return p.k === k && p.status === 'Pending approval'; })[0]; };
  O.saveStd = function (s, v) { var from = O.cfg[s.k]; O.applyCfg(s.k, v); O.hist({ k: s.k, l: s.l, from: from, to: v, by: me().name, mode: 'Applied' }); O.audit('Configuration change', 'Configuration', s.k, s.l + ': ' + from + ' → ' + v + (s.live ? '' : ' (display-only setting)'), 'Success', s.k); O.changed(); };
  O.propose = function (s, v, why) {
    if (O.pending(s.k)) return 'A change to this setting is already pending approval.'; if (why.length < 10) return 'Enter a justification (at least 10 characters).';
    var p = { id: 'CHG-' + ('000' + (O.props.length + 1)).slice(-4), k: s.k, l: s.l, from: O.cfg[s.k], to: v, why: why, by: me().name, byId: me().id, at: N(), status: 'Pending approval' };
    O.props.unshift(p); O.hist({ k: s.k, l: s.l, from: p.from, to: v, by: p.by, mode: 'Proposed', ref: p.id }); O.audit('Configuration proposal', 'Configuration', p.id, s.l + ': proposed ' + p.from + ' → ' + v + ' — ' + why, 'Pending', s.k); O.changed(); return null;
  };
  O.decide = function (id, ok, comment) {
    var p = O.props.filter(function (x) { return x.id === id; })[0], u = me(); if (!p || p.status !== 'Pending approval') return 'This proposal is no longer pending.';
    if (!can('config:approve')) return 'The acting demo user does not hold “approve” on configuration.';
    if (p.byId === u.id) { O.audit('Configuration approval', 'Configuration', id, 'Self-approval blocked for ' + u.name, 'Blocked', p.k); return 'Maker-checker rule: the proposer (' + p.by + ') cannot decide their own change. Switch “Acting as” to a different administrator.'; }
    if (!ok && comment.length < 5) return 'A comment is required when rejecting.';
    p.status = ok ? 'Approved' : 'Rejected'; p.decBy = u.name; p.decAt = N(); p.comment = comment; if (ok) O.applyCfg(p.k, p.to);
    O.hist({ k: p.k, l: p.l, from: p.from, to: p.to, by: u.name, mode: ok ? 'Approved' : 'Rejected', ref: id }); O.audit('Configuration approval', 'Configuration', id, p.l + ': ' + (ok ? 'approved and applied ' : 'rejected ') + p.from + ' → ' + p.to + (comment ? ' — ' + comment : ''), ok ? 'Success' : 'Rejected', p.k); O.changed(); return null;
  };
  O.withdraw = function (id) { var p = O.props.filter(function (x) { return x.id === id; })[0]; if (!p || p.byId !== me().id) return 'Only the proposer can withdraw.'; p.status = 'Withdrawn'; p.decBy = me().name; p.decAt = N(); O.hist({ k: p.k, l: p.l, from: p.from, to: p.to, by: p.decBy, mode: 'Withdrawn', ref: id }); O.audit('Configuration approval', 'Configuration', id, 'Proposal withdrawn: ' + p.l, 'Warning', p.k); O.changed(); return null; };

  /* ---------- incidents ---------- */
  O.ICAT = ['Submission delay', 'PMS integration', 'Offline synchronisation', 'Data quality', 'Access & accounts', 'Configuration', 'Other'];
  O.COMP = ['Hotel Portal', 'Government Portal', 'Administration', 'Simulated PMS connector', 'Simulated government interface', 'Document scan (simulated)'];
  O.LEVELS = ['Level 1 — Support analyst', 'Level 2 — Platform administrator', 'Level 3 — External operator (NOT connected in this prototype)'];
  O.inc = function (id) { return O.incs.filter(function (x) { return x.id === id; })[0]; };
  O.incOpen = function () { return O.incs.filter(function (i) { return i.status !== 'Resolved' && i.status !== 'Closed'; }); };
  O.incSave = function (d) {
    var i = Object.assign({ id: 'INC-' + (1001 + O.incs.length), status: 'Open', resolution: '', created: N(), updated: N(), lvl: 0, esc: [], notes: [] }, d); i.notes.push({ ts: N(), by: me().name, t: 'Incident created' }); O.incs.unshift(i);
    O.audit('Support incident', 'Support incidents', i.id, 'Created ' + i.pri + ' incident: ' + i.title, 'Success', i.est || i.comp); O.changed(); return i;
  };
  O.incUpd = function (i, text, patch, outcome) { Object.assign(i, patch || {}); i.updated = N(); i.notes.push({ ts: N(), by: me().name, t: text }); O.audit('Support incident', 'Support incidents', i.id, text, outcome || 'Success', i.est || i.comp); O.changed(); };

  /* ---------- exceptional access ---------- */
  O.acc = function (id) { return O.accs.filter(function (x) { return x.id === id; })[0]; };
  O.sweep = function () { O.accs.forEach(function (a) { if (a.status === 'Active' && N() > a.exp) { a.status = 'Expired'; O.audit('Privileged access', 'Privileged access', a.id, 'Time-limited access expired automatically (' + a.ref + ')', 'Success', a.ref, 'System (simulated)'); } }); };
  O.accReq = function (d) {
    var a = Object.assign({ id: 'ACC-' + (2001 + O.accs.length), status: 'Pending approval', by: me().name, byId: me().id, at: N() }, d); O.accs.unshift(a);
    O.audit('Privileged access', 'Privileged access', a.id, 'Exceptional access requested for ' + a.ref + ' (' + a.min + ' min) — ' + a.why, 'Pending', a.inc); O.changed(); return a;
  };
  O.accDecide = function (a, ok, comment) {
    var u = me(); if (!can('privaccess:approve')) return 'The acting demo user does not hold approval rights.';
    if (a.byId === u.id) { O.audit('Privileged access', 'Privileged access', a.id, 'Self-approval blocked for ' + u.name, 'Blocked', a.inc); return 'The requester cannot approve their own request.'; }
    if (!ok && comment.length < 5) return 'A comment is required when denying.';
    a.decBy = u.name; a.decAt = N(); a.comment = comment; a.status = ok ? 'Active' : 'Denied'; if (ok) { a.start = N(); a.exp = N() + a.min * MIN; }
    O.audit('Privileged access', 'Privileged access', a.id, (ok ? 'Approved — time-limited access to ' + a.ref + ' until ' + fmt(a.exp) : 'Denied') + (comment ? ' — ' + comment : ''), ok ? 'Success' : 'Rejected', a.inc); O.changed(); return null;
  };
  O.accRevoke = function (a, why) { a.status = 'Revoked'; a.revBy = me().name; a.revAt = N(); a.revWhy = why; O.audit('Privileged access', 'Privileged access', a.id, 'Access revoked — ' + why, 'Warning', a.inc); O.changed(); };

  /* ---------- notifications ---------- */
  var SEED_N = function () { return [
    { id: 'N-001', cat: 'submissions', sev: 'High', status: 'Open', ts: ago(2 * 3600e3), est: 'PIL-007', title: 'Delayed submissions: Palm Crest Lodge', detail: 'Sample: last submission 2 days ago, 31 pending (matches the Government overdue list).', route: '#/admin/establishments/PIL-007' },
    { id: 'N-002', cat: 'pms', sev: 'High', status: 'Open', ts: ago(3 * 3600e3), est: 'PIL-004', int: 'INT-1002', title: 'Simulated PMS connector errors: Lakeview Guest House', detail: 'Demo integration state (simulated). See the Integration Dashboard for status, health and event history.', route: '#/admin/pms-health/INT-1002' },
    { id: 'N-003', cat: 'quality', sev: 'Medium', status: 'Open', ts: ago(5 * 3600e3), est: '', title: '8 records flagged by demo data-quality checks', detail: 'Demo validation rules (same figure as the Government overview).', route: '#/admin/establishments' },
    { id: 'N-004', cat: 'refdata', sev: 'Low', status: 'Open', ts: ago(14 * DAY), est: '', read: true, title: 'Reference data last reviewed 14 days ago', detail: 'Review interval is configurable under System Configuration.', route: '#/admin/reference-data' }]; };
  O.sources = []; /* Stage 6.3: extra synthetic notification generators (reporting, integration, webhook) feed the SAME store */
  O.notes = function () {
    var out = O.seedN.slice();
    O.sources.forEach(function (fn) { try { out = out.concat(fn()); } catch (e) { /* a failing source must not break the bell */ } });
    O.props.forEach(function (p) { out.push({ id: 'N-' + p.id, cat: 'approvals', sev: 'Medium', status: p.status === 'Pending approval' ? 'Open' : 'Resolved', ts: p.status === 'Pending approval' ? p.at : p.decAt, est: '', title: p.status === 'Pending approval' ? 'Configuration change awaiting approval: ' + p.l : 'Configuration change ' + p.status.toLowerCase() + ': ' + p.l, detail: p.id + ' proposed by ' + p.by + ': ' + p.from + ' → ' + p.to + '.', route: '#/admin/approvals' }); });
    O.accs.forEach(function (a) { if (a.status === 'Pending approval') out.push({ id: 'N-' + a.id, cat: 'access', sev: 'Medium', status: 'Open', ts: a.at, est: 'PIL-001', title: 'Exceptional-access request awaiting approval: ' + a.id, detail: a.by + ' requested time-limited access to ' + a.ref + '.', route: '#/admin/exceptional-access' }); });
    O.incOpen().forEach(function (i) { if (i.pri === 'Critical' || i.status === 'Escalated') out.push({ id: 'N-' + i.id, cat: 'incidents', sev: i.pri === 'Critical' ? 'Critical' : 'High', status: 'Open', ts: i.updated, est: i.est, title: i.id + ' ' + i.status.toLowerCase() + ': ' + i.title, detail: i.cat + ' · assigned to ' + (nameOf(i.assignee) || 'unassigned'), route: '#/admin/support-incidents' }); });
    var rej = S.count('Rejected'), q = S.queue().length;
    if (rej) out.push({ id: 'N-live-rej', cat: 'submissions', sev: 'High', status: 'Open', ts: N(), est: 'PIL-001', title: rej + ' record(s) rejected by the simulated interface at Demo Hotel A', detail: 'Live from the hotel state; retry in the Hotel Portal.', route: '#/admin/establishments/PIL-001' });
    if (q) out.push({ id: 'N-live-off', cat: 'offline', sev: S.offline && S.offHours >= S.threshold ? 'High' : 'Medium', status: 'Open', ts: N(), est: 'PIL-001', title: q + ' record(s) in the offline queue at Demo Hotel A', detail: 'Not delivered until synchronised. Threshold ' + S.threshold + ' h (configuration).', route: '#/admin/establishments/PIL-001' });
    return out.map(function (n) { var s = O.nst[n.id] || {}; return Object.assign({}, n, { read: s.read != null ? s.read : !!n.read, status: n.int && M.integ && M.integ.rec(n.int) && M.integ.rec(n.int).status === 'Connected' ? 'Resolved' : n.status === 'Open' && s.ack ? 'Acknowledged' : n.status }); }).sort(function (a, b) { return b.ts - a.ts; });
  };
  O.unread = function () { return O.notes().filter(function (n) { return !n.read && n.status !== 'Resolved'; }).length; };
  O.setRead = function (id, v) { (O.nst[id] = O.nst[id] || {}).read = v; O.changed(); };
  O.readAll = function () { O.notes().forEach(function (n) { (O.nst[n.id] = O.nst[n.id] || {}).read = true; }); O.changed(); };
  O.ack = function (id) { (O.nst[id] = O.nst[id] || {}).ack = true; O.nst[id].read = true; O.changed(); };
  Object.defineProperty(D.notifications, 'admin', { configurable: true, get: function () {
    var ic = { submissions: 'send', pms: 'activity', offline: 'refresh', quality: 'flag', approvals: 'clock', incidents: 'alert', access: 'lock', refdata: 'database', validation: 'flag', review: 'clipboard', export: 'download', webhook: 'send' };
    return O.notes().filter(function (n) { return n.status !== 'Resolved' && O.cfg['notify.' + n.cat] !== false; }).map(function (n) { return { id: n.id, icon: ic[n.cat] || 'info', tone: /Critical|High/.test(n.sev) ? 'danger' : n.sev === 'Medium' ? 'warning' : '', title: n.title, sub: n.sev + ' · ' + stampOf(n.ts), unread: !n.read, route: n.route, store: true }; });
  } });
  O.refState = function () { var last = Math.max.apply(null, O.ref.map(function (v) { return v.hist[0].ts; })), d = Math.round((N() - last) / DAY); return d > O.cfg.refReviewDays ? { l: 'Review due (' + d + ' d)', t: 'warning' } : { l: 'Reviewed ' + d + ' d ago', t: 'success' }; };
  O.changed = function () {
    var a = M.findItem('admin', 'approvals'), n = M.findItem('admin', 'incidents'), x = M.findItem('admin', 'exceptional-access'), s = M.findItem('admin', 'support-incidents');
    if (a) a.item.count = O.props.filter(function (p) { return p.status === 'Pending approval'; }).length; if (n) n.item.count = O.unread();
    if (x) x.item.count = O.accs.filter(function (p) { return p.status === 'Pending approval'; }).length; if (s) s.item.count = O.incOpen().length;
    if (M.refreshSidebar) M.refreshSidebar(); if (M.refreshBell) M.refreshBell(); if (M.state && M.state.portal === 'admin' && /^(reference-data|settings|approvals|incidents|support-incidents|exceptional-access|audit-logs)$/.test(M.state.id) && M.rerender && !document.querySelector('.modal-backdrop')) M.rerender();
  };

  /* ---------- seed / reset ---------- */
  O.reset = function () {
    O.ref = seedRef(); O.cfg = {}; O.SET.forEach(function (s) { O.cfg[s.k] = s.def; }); S.threshold = O.cfg.offlineThresholdHours; O.nst = {}; O.seedN = SEED_N();
    var U = { s: 'Sofia Okello', z: 'Zawadi Mwita', h: 'Hamisi Juma' };
    O.history = [{ id: 'CH-0003', ts: ago(9 * DAY), k: 'accessMaxMin', l: 'Exceptional-access maximum duration', from: 120, to: 60, by: U.s, mode: 'Approved', ref: 'CHG-0001' }, { id: 'CH-0002', ts: ago(12 * DAY), k: 'retryMax', l: 'Maximum retry attempts', from: 5, to: 3, by: U.z, mode: 'Applied' }, { id: 'CH-0001', ts: ago(4 * DAY), k: 'lockoutAttempts', l: 'Failed sign-in lockout threshold', from: 5, to: 10, by: U.z, mode: 'Rejected', ref: 'CHG-0002' }];
    O.props = [
      { id: 'CHG-0004', k: 'sessionTimeout', l: 'Administrator session timeout', from: 30, to: 20, why: 'Shorter timeout for shared workstations (demo).', by: U.s, byId: 'USR-017', at: ago(3600e3), status: 'Pending approval' },
      { id: 'CHG-0003', k: 'unmaskMinChars', l: 'Unmasking justification minimum length', from: 10, to: 20, why: 'Require fuller justifications for unmasking (demo).', by: U.z, byId: 'USR-018', at: ago(2 * 3600e3), status: 'Pending approval' },
      { id: 'CHG-0002', k: 'lockoutAttempts', l: 'Failed sign-in lockout threshold', from: 5, to: 10, why: 'Reduce lock-outs.', by: U.s, byId: 'USR-017', at: ago(5 * DAY), status: 'Rejected', decBy: U.z, decAt: ago(4 * DAY), comment: 'Raising the threshold weakens lock-out; resubmit with a stronger rationale.' },
      { id: 'CHG-0001', k: 'accessMaxMin', l: 'Exceptional-access maximum duration', from: 120, to: 60, why: 'Limit exposure window.', by: U.z, byId: 'USR-018', at: ago(10 * DAY), status: 'Approved', decBy: U.s, decAt: ago(9 * DAY), comment: 'Agreed.' }];
    O.incs = [
      { id: 'INC-1001', title: 'Submissions delayed for Palm Crest Lodge', cat: 'Submission delay', pri: 'High', status: 'In progress', est: 'PIL-007', comp: '', assignee: 'USR-019', desc: 'Sample: no submissions acknowledged for 2 days; 31 pending.', resolution: '', created: ago(2 * DAY), updated: ago(5 * 3600e3), lvl: 0, esc: [], notes: [{ ts: ago(2 * DAY), by: U.h, t: 'Incident created' }, { ts: ago(5 * 3600e3), by: U.h, t: 'Status → In progress' }] },
      { id: 'INC-1002', title: 'Simulated PMS connector returning errors', cat: 'PMS integration', pri: 'Critical', status: 'Escalated', est: 'PIL-004', comp: 'Simulated PMS connector', assignee: 'USR-018', desc: 'Demo: connector errors for Lakeview Guest House. Manual fallback in use.', resolution: '', created: ago(DAY), updated: ago(3 * 3600e3), lvl: 1, esc: [{ ts: ago(3 * 3600e3), by: U.h, lvl: O.LEVELS[1], note: 'Beyond support scope; needs platform administrator.' }], notes: [{ ts: ago(DAY), by: U.h, t: 'Incident created' }] },
      { id: 'INC-1003', title: 'Document type missing from registration list', cat: 'Configuration', pri: 'Low', status: 'Resolved', est: '', comp: 'Hotel Portal', assignee: 'USR-017', desc: 'Receptionist could not find a document type.', resolution: 'Value added in Reference Data (demo).', created: ago(6 * DAY), updated: ago(5 * DAY), lvl: 0, esc: [], notes: [{ ts: ago(6 * DAY), by: U.h, t: 'Incident created' }, { ts: ago(5 * DAY), by: U.s, t: 'Resolved — Value added in Reference Data (demo).' }] },
      { id: 'INC-1004', title: 'Rejected submission needs investigation (REG-241018)', cat: 'Data quality', pri: 'Medium', status: 'Open', est: 'PIL-001', comp: '', assignee: '', desc: 'Record rejected by the simulated interface; guest data needed to diagnose.', resolution: '', created: ago(4 * 3600e3), updated: ago(4 * 3600e3), lvl: 0, esc: [], notes: [{ ts: ago(4 * 3600e3), by: U.h, t: 'Incident created' }] }];
    O.accs = [
      { id: 'ACC-2002', ref: 'REG-241018', est: 'PIL-001', inc: 'INC-1004', why: 'Diagnose the rejected submission; masked view is insufficient.', min: 30, by: U.h, byId: 'USR-019', at: ago(20 * MIN), status: 'Pending approval' },
      { id: 'ACC-2001', ref: 'REG-241012', est: 'PIL-001', inc: 'INC-1003', why: 'Confirm document type recorded for the guest.', min: 15, by: U.h, byId: 'USR-019', at: ago(6 * DAY), status: 'Expired', decBy: U.s, decAt: ago(6 * DAY - 5 * MIN), comment: 'Approved for 15 minutes.', start: ago(6 * DAY - 5 * MIN), exp: ago(6 * DAY - 20 * MIN) }];
    function ev(ts, who, type, mod, target, detail, out) { var e = { t: stampOf(ts), ts: ts, user: who + ' (Admin, demo)', type: type, target: target, detail: detail, outcome: out || 'Success', mod: mod, rel: '' }; return e; }
    S.audit.forEach(function (a, i) { if (!a.ts) a.ts = ago((i + 1) * 20 * MIN); a.mod = a.mod || ''; });
    S.audit = S.audit.concat([ev(ago(10 * DAY), U.z, 'Configuration proposal', 'Configuration', 'CHG-0001', 'Exceptional-access maximum duration: proposed 120 → 60', 'Pending'), ev(ago(9 * DAY), U.s, 'Configuration approval', 'Configuration', 'CHG-0001', 'Approved and applied 120 → 60 — Agreed.'), ev(ago(5 * DAY), U.s, 'Configuration proposal', 'Configuration', 'CHG-0002', 'Failed sign-in lockout threshold: proposed 5 → 10', 'Pending'), ev(ago(4 * DAY), U.z, 'Configuration approval', 'Configuration', 'CHG-0002', 'Rejected 5 → 10 — resubmit with a stronger rationale.', 'Rejected'), ev(ago(2 * 3600e3), U.z, 'Configuration proposal', 'Configuration', 'CHG-0003', 'Unmasking justification minimum length: proposed 10 → 20', 'Pending'), ev(ago(3600e3), U.s, 'Configuration proposal', 'Configuration', 'CHG-0004', 'Administrator session timeout: proposed 30 → 20', 'Pending'), ev(ago(6 * DAY), U.h, 'Privileged access', 'Privileged access', 'ACC-2001', 'Exceptional access requested for REG-241012 (15 min)', 'Pending'), ev(ago(DAY), U.h, 'Support incident', 'Support incidents', 'INC-1002', 'Created Critical incident: Simulated PMS connector returning errors')]).sort(function (a, b) { return b.ts - a.ts; });
    O.syncRef(); O.changed();
  };
  R.CATS0 = R.CATS0 || ['Hotel', 'Lodge', 'Guest house', 'Serviced apartments', 'Resort'];
  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(O.reset); O.reset();

  /* ======================= PAGES ======================= */
  function table(root, id, cfg) { return UI.table.mount(root.querySelector(id), Object.assign({ pageSize: 8 }, cfg)); }

  /* ----- Reference data ----- */
  function refForm(v, cat) {
    var c = O.cat(v ? v.cat : cat), d = v || { code: '', name: '', status: 'Active', from: '', to: '', notes: '' };
    fm(v ? 'Edit ' + v.name : 'Add value · ' + c.label, UI.input({ id: 'rf-name', label: 'Name', required: true, value: d.name }) + UI.input({ id: 'rf-code', label: c.code ? 'ISO alpha-2 code (synthetic)' : 'Code', required: true, value: d.code }) +
      UI.select({ id: 'rf-status', label: 'Status', value: d.status, options: ['Active', 'Inactive'] }) + UI.input({ id: 'rf-from', label: 'Effective from', type: 'date', value: d.from }) + UI.input({ id: 'rf-to', label: 'Effective to (optional)', type: 'date', value: d.to }) + UI.textarea({ id: 'rf-notes', label: 'Notes', value: d.notes }) +
      (v && O.usage(v) ? UI.alert('info', 'In use.', 'Used by ' + O.usage(v) + ' record(s); the name is locked.') : ''), v ? 'Save changes' : 'Add value',
      function (w) { return O.refSave(v ? v.id : null, { cat: c.id, name: V(w, 'rf-name'), code: V(w, 'rf-code').toUpperCase() === V(w, 'rf-code') ? V(w, 'rf-code') : V(w, 'rf-code').toUpperCase(), status: V(w, 'rf-status'), from: V(w, 'rf-from'), to: V(w, 'rf-to'), notes: V(w, 'rf-notes') }) || (M.toast.success(v ? 'Value updated' : 'Value added', 'Appears in the views that use this list.'), M.rerender(), null); });
  }
  M.actions.on('rd-edit', function (el) { refForm(O.ref.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]); });
  M.actions.on('rd-new', function () { fm('Add reference value', UI.select({ id: 'rn-cat', label: 'List', options: O.CATS.map(function (c) { return { value: c.id, label: c.label }; }) }), 'Continue', function (w) { var c = V(w, 'rn-cat'); setTimeout(function () { refForm(null, c); }, 20); }); });
  M.actions.on('rd-hist', function (el) { var v = O.ref.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; M.modal.open({ title: 'Change history · ' + v.name, body: v.hist.map(function (h) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(h.a) + '</div><div class="s">' + esc(h.by + ' · ' + fmt(h.ts)) + '</div></div></div>'; }).join(''), actions: [{ label: 'Close', variant: 'primary' }] }); });
  M.pages['admin/reference-data'] = {
    title: 'Reference Data',
    render: function () {
      var ok = can('refdata:admin'), rs = O.refState();
      return UI.pageHead({ crumbs: crumbs('Reference Data'), title: 'Reference data', description: 'Configurable demonstration lists. Changes update the Hotel Portal, Administration and Government views that use them.', actions: gate(ok, { label: 'Add value', icon: 'plus', variant: 'accent', action: 'rd-new' }, 'Requires “Reference data — administer”') + UI.button({ label: 'Review settings', href: '#/admin/settings', icon: 'sliders' }) }) +
        '<div class="stack">' + UI.alert('orange', 'Synthetic values — not official government lists.', 'Lists marked “configurable” are unresolved and must be confirmed. Country codes are an illustrative subset only. Review status: ' + esc(rs.l) + '.') +
        '<div class="grid cols-3">' + O.CATS.map(function (c) { var all = O.ref.filter(function (v) { return v.cat === c.id; }); return UI.card({ title: c.label, subtitle: c.basis, body: '<div class="row">' + UI.badge(O.names(c.id).length + ' active of ' + all.length, 'info') + (c.unresolved ? UI.badge('Configurable — unresolved', 'warning') : '') + '</div><p class="hint" style="margin-top:8px">Used by: ' + esc(c.use) + '</p>' }); }).join('') + '</div>' +
        UI.card({ flush: true, body: '<div id="rd-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var rows = O.ref.map(function (v) { return Object.assign({}, v, { eff: O.eff(v), catL: O.cat(v.cat).label, used: O.usage(v), last: v.hist[0].ts }); }), ctl, ok = can('refdata:admin');
      ctl = table(root, '#rd-table', { caption: 'Reference values', rows: rows, searchKeys: ['name', 'code', 'catL', 'notes'], searchPlaceholder: 'Search name, code, list…', filter: { key: 'eff', label: 'Status', options: ['Active', 'Inactive', 'Scheduled', 'Expired'] }, toolbarExtra: sel('rd-cat', 'List', O.CATS.map(function (c) { return c.label; })), pageSize: 10,
        columns: [{ key: 'name', label: 'Value', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.code) + ' · ' + esc(r.id) + '</div>'; } }, { key: 'catL', label: 'List', sortable: true }, { key: 'eff', label: 'Status', render: function (r) { return B(r.eff); } },
          { key: 'from', label: 'Effective', render: function (r) { return esc((r.from || '—') + ' → ' + (r.to || 'open')); } }, { key: 'used', label: 'In use', align: 'right', sortable: true }, { key: 'last', label: 'Last change', sortable: true, render: function (r) { return esc(fmt(r.last)); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + UI.button({ label: 'History', size: 'sm', variant: 'ghost', action: 'rd-hist', data: { id: r.id } }) + gate(ok, { label: 'Edit', size: 'sm', action: 'rd-edit', data: { id: r.id } }, 'Requires “Reference data — administer”') + '</div>'; } }] });
      root.querySelector('#rd-cat').addEventListener('change', function (e) { ctl.setRows(rows.filter(function (r) { return !e.target.value || r.catL === e.target.value; })); });
    }
  };

  /* ----- System configuration ----- */
  function field(s) {
    var cur = O.cfg[s.k], p = O.pending(s.k), id = 'cf-' + s.k.replace('.', '_');
    if (s.t === 'bool') return '<div class="field">' + UI.switch({ id: id, label: s.k.split('.')[1] + ' notifications', checked: cur }) + '</div>';
    return UI.input({ id: id, label: s.l + ' (' + s.u + ')', type: 'number', value: cur, hint: s.h + (s.live ? ' Applies in this prototype.' : ' Display-only.') + (p ? ' Pending change ' + p.id + ': ' + p.from + ' → ' + p.to + '.' : ''), disabled: !!p && false });
  }
  M.pages['admin/settings'] = {
    title: 'System Configuration',
    render: function () {
      var gs = [], ok = can('config:edit'); O.SET.forEach(function (s) { if (gs.indexOf(s.g) < 0) gs.push(s.g); });
      var env = [['Environment', 'Prototype — browser tab memory'], ['Government interface', 'Simulated'], ['Hotel PMS connector', 'Simulated'], ['Document scan / OCR', 'Simulated'], ['Identity verification', 'Not included'], ['Live monitoring', 'None — status shown is a demonstration']].map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
      return UI.pageHead({ crumbs: crumbs('System Configuration'), title: 'System configuration', description: 'Standard settings apply when saved. Security-relevant settings are proposed and need approval by a different administrator.', actions: UI.button({ label: 'Approvals', icon: 'clock', href: '#/admin/approvals' }) }) +
        '<div class="stack">' + UI.alert('warning', 'Frontend demonstration.', 'Settings marked “Display-only” are stored here but change no service. Nothing here alters a real system or any legal or government requirement. Maker-checker here is a prototype workflow, not production-grade enforcement.') +
        '<form id="cfg-form" novalidate><div class="stack"><div id="form-summary"></div>' + gs.map(function (gr) { return UI.card({ title: gr, subtitle: /Security/.test(gr) ? 'Saving creates a proposal; the value changes only after approval.' : '', body: '<div class="form-grid">' + O.SET.filter(function (s) { return s.g === gr; }).map(field).join('') + '</div>' }); }).join('') +
        UI.card({ title: 'Integration & environment status', subtitle: 'Read-only', body: '<dl class="kv">' + env + '</dl>' }) + '<div class="form-actions"><button type="button" class="btn btn-ghost" data-action="cfg-cancel">Cancel</button>' + (ok ? '<button type="submit" class="btn btn-primary">Review and save</button>' : '<button type="button" class="btn btn-primary" disabled title="Requires “System configuration — edit”">Review and save</button>') + '</div></div></form>' +
        UI.card({ title: 'Configuration-change history', subtitle: 'Applied changes, proposals and decisions (also in the shared audit trail)', flush: true, body: '<div id="ch-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      table(root, '#ch-table', { caption: 'Configuration history', rows: O.history.map(function (h) { return Object.assign({}, h, { when: h.ts }); }), searchKeys: ['l', 'by', 'mode', 'ref'], searchPlaceholder: 'Search setting, person, status…', filter: { key: 'mode', label: 'Event', options: ['Applied', 'Proposed', 'Approved', 'Rejected', 'Withdrawn'] },
        columns: [{ key: 'when', label: 'When', sortable: true, render: function (r) { return esc(fmt(r.ts)); } }, { key: 'l', label: 'Setting' }, { key: 'chg', label: 'Change', render: function (r) { return esc(r.from + ' → ' + r.to); } }, { key: 'by', label: 'By' }, { key: 'mode', label: 'Event', render: function (r) { return B(r.mode) + (r.ref ? ' <a href="#/admin/approvals">' + esc(r.ref) + '</a>' : ''); } }] });
      var form = root.querySelector('#cfg-form');
      form.addEventListener('submit', function (e) {
        e.preventDefault(); var errs = [], std = [], sens = [];
        O.SET.forEach(function (s) { var el = form.querySelector('#cf-' + s.k.replace('.', '_')); if (!el) return; var raw = s.t === 'bool' ? el.checked : el.value.trim(), r = O.check(s, raw); if (r.e) { errs.push({ s: s, m: r.e, id: el.id }); return; } if (r.v !== O.cfg[s.k]) (s.sens ? sens : std).push({ s: s, v: r.v }); });
        form.querySelectorAll('.error-text').forEach(function (n) { n.remove(); }); form.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
        var sum = form.querySelector('#form-summary'); sum.innerHTML = '';
        if (errs.length) { errs.forEach(function (x) { var i = form.querySelector('#' + x.id); i.setAttribute('aria-invalid', 'true'); i.insertAdjacentHTML('afterend', '<div class="error-text">' + esc(x.m) + '</div>'); }); sum.innerHTML = UI.alert('danger', 'Please fix ' + errs.length + ' field(s).', esc(errs.map(function (x) { return x.s.l + ': ' + x.m; }).join(' · '))); form.querySelector('#' + errs[0].id).focus(); return; }
        if (!std.length && !sens.length) { M.toast.info('No changes to save', 'Nothing differs from the current configuration.'); return; }
        var blocked = sens.filter(function (x) { return O.pending(x.s.k); }); if (blocked.length) { sum.innerHTML = UI.alert('warning', 'Pending change exists.', esc(blocked.map(function (x) { return x.s.l; }).join(', ') + ' already has a proposal awaiting approval.')); return; }
        var list = function (a, t) { return a.length ? '<p><strong>' + t + '</strong></p><dl class="kv">' + a.map(function (x) { return '<dt>' + esc(x.s.l) + '</dt><dd>' + esc(O.cfg[x.s.k] + ' → ' + x.v) + '</dd>'; }).join('') + '</dl>' : ''; };
        fm('Review configuration changes', list(std, 'Applied immediately (' + std.length + ')') + list(sens, 'Proposed for approval (' + sens.length + ') — not applied until a different administrator approves') + (sens.length ? UI.textarea({ id: 'cf-why', label: 'Justification for proposed changes', required: true }) : ''), sens.length ? 'Save and propose' : 'Save changes',
          function (w) { if (sens.length) { var why = V(w, 'cf-why'); if (why.length < 10) return 'Enter a justification (at least 10 characters).'; sens.forEach(function (x) { O.propose(x.s, x.v, why); }); } std.forEach(function (x) { O.saveStd(x.s, x.v); }); M.toast.success('Configuration saved', (std.length ? std.length + ' applied' : '') + (std.length && sens.length ? ' · ' : '') + (sens.length ? sens.length + ' pending approval' : '')); M.rerender(); return null; });
      });
    }
  };
  M.actions.on('cfg-cancel', function () { M.rerender(); M.toast.info('Changes discarded', 'The form shows the saved configuration.'); });

  /* ----- Approvals (maker-checker) ----- */
  function decideDlg(id, ok) {
    var p = O.props.filter(function (x) { return x.id === id; })[0];
    fm((ok ? 'Approve ' : 'Reject ') + id, '<dl class="kv"><dt>Setting</dt><dd>' + esc(p.l) + '</dd><dt>Change</dt><dd>' + esc(p.from + ' → ' + p.to) + '</dd><dt>Proposed by</dt><dd>' + esc(p.by) + '</dd><dt>Deciding as</dt><dd>' + esc(me().name) + '</dd></dl>' + UI.textarea({ id: 'dc', label: ok ? 'Approval comment (optional)' : 'Rejection comment', required: !ok }), ok ? 'Approve and apply' : 'Reject', function (w) { var e = O.decide(id, ok, V(w, 'dc')); if (e) return e; M.toast.success(ok ? 'Approved and applied' : 'Rejected', id); M.rerender(); return null; }, ok ? 'primary' : 'danger');
  }
  M.actions.on('cp-approve', function (el) { decideDlg(el.getAttribute('data-id'), true); });
  M.actions.on('cp-reject', function (el) { decideDlg(el.getAttribute('data-id'), false); });
  M.actions.on('cp-withdraw', function (el) { var e = O.withdraw(el.getAttribute('data-id')); if (e) M.toast.danger('Cannot withdraw', e); else { M.toast.info('Proposal withdrawn'); M.rerender(); } });
  M.pages['admin/approvals'] = {
    title: 'Configuration Approvals',
    render: function () {
      var u = me(), pend = O.props.filter(function (p) { return p.status === 'Pending approval'; }).length;
      return UI.pageHead({ crumbs: crumbs('Configuration Approvals'), title: 'Configuration approvals', description: 'Maker-checker demonstration for security-relevant settings: the proposer and the approver must be different people.' }) +
        '<div class="stack">' + UI.alert('warning', 'Prototype workflow — not production-grade enforcement.', 'The proposer and approver are the “Acting as” demo users. Use the user menu to switch between Sofia Okello and Zawadi Mwita. You are acting as <strong>' + esc(u ? u.name : '—') + '</strong>.') +
        '<div class="grid cols-3">' + [{ label: 'Pending approval', value: pend, icon: 'clock', tone: 'orange' }, { label: 'Approved', value: O.props.filter(function (p) { return p.status === 'Approved'; }).length, icon: 'check-circle', tone: 'green' }, { label: 'Rejected / withdrawn', value: O.props.filter(function (p) { return /Rejected|Withdrawn/.test(p.status); }).length, icon: 'x' }].map(UI.statCard).join('') + '</div>' + UI.card({ flush: true, body: '<div id="cp-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var u = me();
      table(root, '#cp-table', { caption: 'Configuration proposals', rows: O.props.map(function (p) { return Object.assign({}, p, { chg: p.from + ' → ' + p.to }); }), searchKeys: ['id', 'l', 'by', 'why'], searchPlaceholder: 'Search reference, setting, person…', filter: { key: 'status', label: 'Status', options: ['Pending approval', 'Approved', 'Rejected', 'Withdrawn'] }, pageSize: 6,
        columns: [{ key: 'id', label: 'Reference', sortable: true, render: function (r) { return '<span class="mono">' + esc(r.id) + '</span><div class="cell-sub">' + esc(fmt(r.at)) + '</div>'; } }, { key: 'l', label: 'Setting', render: function (r) { return '<div class="cell-main">' + esc(r.l) + '</div><div class="cell-sub">' + esc(r.chg) + ' · ' + esc(r.why) + '</div>'; } }, { key: 'by', label: 'Proposed by' }, { key: 'status', label: 'Status', render: function (r) { return B(r.status) + (r.decBy ? '<div class="cell-sub">' + esc(r.decBy + ' · ' + fmt(r.decAt)) + '</div>' : '') + (r.comment ? '<div class="cell-sub">“' + esc(r.comment) + '”</div>' : ''); } },
          { key: 'a', label: '', align: 'right', render: function (r) { if (r.status !== 'Pending approval') return ''; var own = u && r.byId === u.id, ok = can('config:approve') && !own, why = own ? 'Self-approval is not allowed: switch to a different administrator' : 'Requires “configuration — approve”'; return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + gate(ok, { label: 'Approve', size: 'sm', variant: 'primary', action: 'cp-approve', data: { id: r.id } }, why) + gate(ok, { label: 'Reject', size: 'sm', action: 'cp-reject', data: { id: r.id } }, why) + (own ? UI.button({ label: 'Withdraw', size: 'sm', variant: 'ghost', action: 'cp-withdraw', data: { id: r.id } }) : '') + '</div>'; } }] });
    }
  };

  /* ----- Audit logs (read-only view of the shared trail) ----- */
  M.actions.on('au-view', function (el) {
    var a = S.audit[+el.getAttribute('data-i')]; M.modal.open({ title: 'Audit event', body: '<dl class="kv"><dt>Timestamp</dt><dd>' + esc(a.ts ? fmt(a.ts) : a.t) + '</dd><dt>Actor</dt><dd>' + esc(a.user) + '</dd><dt>Action</dt><dd>' + esc(a.type) + '</dd><dt>Area</dt><dd>' + esc(O.area(a)) + '</dd><dt>Target</dt><dd class="mono">' + esc(a.target) + '</dd><dt>Related record</dt><dd>' + esc(a.rel || '—') + '</dd><dt>Outcome</dt><dd>' + B(a.outcome) + '</dd><dt>Detail</dt><dd>' + esc(a.detail) + '</dd></dl>' + UI.alert('info', 'Read-only.', 'No edit or delete is offered. This in-memory list is not tamper-proof production audit logging.'), actions: [{ label: 'Close', variant: 'primary' }] });
  });
  M.pages['admin/audit-logs'] = {
    title: 'Audit Logs & Config History',
    render: function () { return UI.pageHead({ crumbs: crumbs('Audit Logs'), title: 'Audit logs & configuration history', description: 'The same shared audit trail shown in the Government Portal, with administrative events from every module.', actions: UI.button({ label: 'Government audit view', href: '#/gov/audit', variant: 'secondary' }) }) + '<div class="stack">' + note('Read-only demonstration list. It cannot be edited or deleted from this interface and is NOT tamper-proof production logging.') + UI.card({ flush: true, body: '<div id="al-table"></div>' }) + '</div>'; },
    mount: function (root) {
      var rows = S.audit.map(function (a, i) { return Object.assign({}, a, { i: i, area: O.area(a), when: a.ts ? fmt(a.ts) : a.t }); }), ctl;
      ctl = table(root, '#al-table', { caption: 'Audit events', rows: rows, pageSize: 10, searchKeys: ['user', 'type', 'target', 'detail', 'rel', 'area'], searchPlaceholder: 'Search actor, action, target, detail…', filter: { key: 'type', label: 'Action', options: O.auditTypes() }, toolbarExtra: sel('al-area', 'Area', ['Users & Roles', 'Establishments', 'Reference data', 'Configuration', 'Privileged access', 'Support incidents', 'Submissions', 'Hotel registration', 'Guest-record access', 'Administration']),
        columns: [{ key: 'when', label: 'Time', render: function (r) { return '<span class="mono">' + esc(r.when) + '</span>'; } }, { key: 'user', label: 'Actor' }, { key: 'type', label: 'Action', sortable: true }, { key: 'target', label: 'Target', render: function (r) { return '<span class="mono">' + esc(r.target) + '</span>'; } }, { key: 'outcome', label: 'Outcome', render: function (r) { return B(r.outcome); } }, { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Details', size: 'sm', variant: 'ghost', action: 'au-view', data: { i: r.i } }); } }] });
      root.querySelector('#al-area').addEventListener('change', function (e) { ctl.setRows(rows.filter(function (r) { return !e.target.value || r.area === e.target.value; })); });
    }
  };

  /* ----- Notification centre & operations ----- */
  M.actions.on('nt-open', function (el) { var id = el.getAttribute('data-id'); O.setRead(id, true); location.hash = el.getAttribute('data-route'); });
  M.actions.on('nt-read', function (el) { var id = el.getAttribute('data-id'), n = O.notes().filter(function (x) { return x.id === id; })[0]; O.setRead(id, !n.read); });
  M.actions.on('nt-ack', function (el) { O.ack(el.getAttribute('data-id')); M.toast.info('Acknowledged', 'Marked as acknowledged (demonstration).'); });
  M.actions.on('nt-readall', function () { O.readAll(); M.toast.success('All notifications marked as read'); });
  M.actions.on('nt-inc', function (el) { var n = O.notes().filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; incForm({ title: n.title, est: n.est, desc: n.detail, cat: { submissions: 'Submission delay', pms: 'PMS integration', webhook: 'PMS integration', offline: 'Offline synchronisation', quality: 'Data quality' }[n.cat] || 'Other', src: n.id }); });
  M.pages['admin/incidents'] = {
    title: 'Notifications & Operations',
    render: function () {
      var ns = O.notes(), open = ns.filter(function (n) { return n.status !== 'Resolved'; }), cats = {}; open.forEach(function (n) { cats[n.cat] = (cats[n.cat] || 0) + 1; });
      return UI.pageHead({ crumbs: crumbs('Notifications & Operations'), title: 'Notification centre & operational overview', description: 'Synthetic operational notifications linked to establishments and records.', actions: UI.button({ label: 'Mark all as read', icon: 'check', action: 'nt-readall' }) + UI.button({ label: 'Support incidents', icon: 'alert', variant: 'secondary', href: '#/admin/support-incidents' }) }) +
        '<div class="stack">' + note('Notifications are generated locally from demonstration data and shared state. This is not live monitoring and no real government or PMS connectivity is implied.') +
        '<div class="grid cols-4">' + [{ label: 'Unread', value: O.unread(), icon: 'bell', tone: 'orange' }, { label: 'Open critical / high', value: open.filter(function (n) { return /Critical|High/.test(n.sev); }).length, icon: 'alert', tone: 'red' }, { label: 'Awaiting configuration approval', value: O.props.filter(function (p) { return p.status === 'Pending approval'; }).length, icon: 'clock' }, { label: 'Open incidents', value: O.incOpen().length, icon: 'activity' }].map(UI.statCard).join('') + '</div>' +
        UI.card({ title: 'Open by category', body: '<div class="chips">' + (Object.keys(cats).map(function (c) { return UI.badge(c + ': ' + cats[c], 'neutral'); }).join('') || 'Nothing open.') + '</div>' }) + UI.card({ flush: true, body: '<div id="nt-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var rows = O.notes().map(function (n) { return Object.assign({}, n, { rd: n.read ? 'Read' : 'Unread', cl: O.cfg['notify.' + n.cat] === false ? 'off' : '' }); }), ctl;
      ctl = table(root, '#nt-table', { caption: 'Notifications', rows: rows, pageSize: 8, searchKeys: ['title', 'detail', 'est', 'cat'], searchPlaceholder: 'Search notifications…', filter: { key: 'status', label: 'Status', options: ['Open', 'Acknowledged', 'Resolved'] }, toolbarExtra: sel('nt-sev', 'Severity', ['Critical', 'High', 'Medium', 'Low']) + sel('nt-cat', 'Category', NP) + sel('nt-rd', 'Read', ['Unread', 'Read']),
        columns: [{ key: 'title', label: 'Notification', render: function (n) { return '<div class="cell-main"' + (n.read ? '' : ' style="font-weight:800"') + '>' + (n.read ? '' : '● ') + esc(n.title) + '</div><div class="cell-sub">' + esc(n.detail) + '</div>'; } }, { key: 'sev', label: 'Severity', render: function (n) { return B(n.sev); } }, { key: 'status', label: 'Status', render: function (n) { return B(n.status); } }, { key: 'est', label: 'Related', render: function (n) { return n.est ? '<a href="#/admin/establishments/' + n.est + '">' + esc(n.est) + '</a>' : n.rel ? '<a href="' + n.route + '">' + esc(n.rel) + '</a>' : esc(n.cat); } }, { key: 'ts', label: 'Time', sortable: true, render: function (n) { return esc(fmt(n.ts)); } },
          { key: 'a', label: '', align: 'right', render: function (n) { return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + UI.button({ label: 'Open', size: 'sm', variant: 'primary', action: 'nt-open', data: { id: n.id, route: n.route } }) + UI.button({ label: n.read ? 'Unread' : 'Read', size: 'sm', variant: 'ghost', action: 'nt-read', data: { id: n.id } }) + (n.status === 'Open' ? UI.button({ label: 'Acknowledge', size: 'sm', variant: 'ghost', action: 'nt-ack', data: { id: n.id } }) : '') + (n.status !== 'Resolved' && can('incidents:create') ? UI.button({ label: 'Create incident', size: 'sm', variant: 'ghost', action: 'nt-inc', data: { id: n.id } }) : '') + '</div>'; } }] });
      function ap() { var s = root.querySelector('#nt-sev').value, c = root.querySelector('#nt-cat').value, r = root.querySelector('#nt-rd').value; ctl.setRows(rows.filter(function (n) { return (!s || n.sev === s) && (!c || n.cat === c) && (!r || n.rd === r); })); }
      ['nt-sev', 'nt-cat', 'nt-rd'].forEach(function (i) { root.querySelector('#' + i).addEventListener('change', ap); });
    }
  };

  /* ----- Support incidents ----- */
  var ASSIGN = function () { return R.users.filter(function (u) { return /sysadmin|support/.test(u.role) && u.status === 'Active'; }); };
  function incForm(pre) {
    pre = pre || {};
    fm('New support incident', UI.input({ id: 'ic-title', label: 'Title', required: true, value: pre.title || '' }) + UI.select({ id: 'ic-cat', label: 'Category', value: pre.cat || 'Other', options: O.ICAT }) + UI.select({ id: 'ic-pri', label: 'Priority', value: 'Medium', options: ['Critical', 'High', 'Medium', 'Low'] }) +
      UI.select({ id: 'ic-est', label: 'Related establishment', placeholder: 'None', value: pre.est || '', options: R.ests.map(function (e) { return { value: e.id, label: e.name + ' (' + e.id + ')' }; }) }) + UI.select({ id: 'ic-comp', label: 'Or system component', placeholder: 'None', options: O.COMP }) +
      UI.select({ id: 'ic-as', label: 'Assign to', placeholder: 'Unassigned', options: ASSIGN().map(function (u) { return { value: u.id, label: u.name }; }) }) + UI.textarea({ id: 'ic-desc', label: 'Description', required: true, value: pre.desc || '' }), 'Create incident',
      function (w) { var t = V(w, 'ic-title'), d = V(w, 'ic-desc'), est = V(w, 'ic-est'), comp = V(w, 'ic-comp'); if (t.length < 5) return 'Enter a title (at least 5 characters).'; if (!est && !comp) return 'Select a related establishment or a system component.'; if (d.length < 10) return 'Enter a description (at least 10 characters).';
        var i = O.incSave({ title: t, cat: V(w, 'ic-cat'), pri: V(w, 'ic-pri'), est: est, comp: comp, assignee: V(w, 'ic-as'), desc: d }); M.toast.success('Incident created', i.id + ' (demonstration — no help desk is connected)'); location.hash = '#/admin/support-incidents'; M.rerender(); return null; });
  }
  M.actions.on('inc-new', function () { incForm(); });
  function incView(id) {
    var i = O.inc(id), ed = can('incidents:edit'), act = [{ label: 'Close' }];
    if (ed && i.status !== 'Closed') { act.push({ label: 'Add note', onClick: function () { setTimeout(function () { incAct(id, 'note'); }, 20); } }, { label: 'Assign', onClick: function () { setTimeout(function () { incAct(id, 'assign'); }, 20); } }, { label: i.status === 'Resolved' ? 'Close / reopen' : 'Update status', onClick: function () { setTimeout(function () { incAct(id, 'status'); }, 20); } }); if (i.status !== 'Resolved' && i.lvl < 2) act.push({ label: 'Escalate', variant: 'danger', onClick: function () { setTimeout(function () { incAct(id, 'esc'); }, 20); } }); }
    M.modal.open({ size: 'lg', title: i.id + ' · ' + i.title, actions: act, body: '<div class="row">' + B(i.status) + B(i.pri) + UI.badge(i.cat, 'neutral') + '</div><dl class="kv" style="margin-top:12px"><dt>Related</dt><dd>' + (i.est ? '<a href="#/admin/establishments/' + i.est + '">' + esc(R.est(i.est).name) + ' (' + i.est + ')</a>' : '') + (i.est && i.comp ? ' · ' : '') + esc(i.comp || (i.est ? '' : '—')) + '</dd><dt>Assigned to</dt><dd>' + esc(i.assignee ? nameOf(i.assignee) : 'Unassigned') + '</dd><dt>Escalation level</dt><dd>' + esc(O.LEVELS[i.lvl]) + '</dd><dt>Created</dt><dd>' + esc(fmt(i.created)) + '</dd><dt>Updated</dt><dd>' + esc(fmt(i.updated)) + '</dd><dt>Description</dt><dd>' + esc(i.desc) + '</dd><dt>Resolution</dt><dd>' + esc(i.resolution || '—') + '</dd></dl>' +
      '<h3 style="font-size:14px;margin-top:16px">Escalation history</h3>' + (i.esc.length ? i.esc.map(function (e) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(e.lvl) + '</div><div class="s">' + esc(e.by + ' · ' + fmt(e.ts) + ' — ' + e.note) + '</div></div></div>'; }).join('') : '<p class="hint">Not escalated.</p>') + '<h3 style="font-size:14px;margin-top:16px">Activity</h3>' + i.notes.slice().reverse().map(function (e) { return '<div class="list-row" style="padding-left:0"><div class="grow"><div class="t">' + esc(e.t) + '</div><div class="s">' + esc(e.by + ' · ' + fmt(e.ts)) + '</div></div></div>'; }).join('') });
  }
  function incAct(id, k) {
    var i = O.inc(id), back = function () { setTimeout(function () { incView(id); }, 20); }, fin = function (e) { if (e) return e; back(); M.rerender(); return null; };
    if (k === 'note') fm('Add note', UI.textarea({ id: 'ia', label: 'Note', required: true }), 'Add note', function (w) { var t = V(w, 'ia'); if (t.length < 3) return 'Enter a note.'; O.incUpd(i, 'Note: ' + t); return fin(); });
    if (k === 'assign') fm('Assign ' + id, UI.select({ id: 'ia', label: 'Assign to', placeholder: 'Unassigned', value: i.assignee, options: ASSIGN().map(function (u) { return { value: u.id, label: u.name }; }) }), 'Assign', function (w) { var a = V(w, 'ia'); O.incUpd(i, 'Assigned to ' + (a ? nameOf(a) : 'nobody'), { assignee: a }); return fin(); });
    if (k === 'status') { var opts = i.status === 'Resolved' ? ['In progress', 'Closed'] : ['Open', 'In progress', 'Resolved']; fm('Update status', UI.select({ id: 'ia', label: 'New status', value: opts[0], options: opts }) + UI.textarea({ id: 'ib', label: 'Resolution notes (required when resolving)' }), 'Update', function (w) { var s = V(w, 'ia'), r = V(w, 'ib'); if (s === 'Resolved' && r.length < 5) return 'Resolution notes are required to resolve an incident.'; O.incUpd(i, 'Status ' + i.status + ' → ' + s + (r ? ' — ' + r : ''), { status: s, resolution: s === 'Resolved' ? r : i.resolution }); return fin(); }); }
    if (k === 'esc') fm('Escalate ' + id, '<p>Escalating to <strong>' + esc(O.LEVELS[i.lvl + 1]) + '</strong>.</p>' + (i.lvl + 1 === 2 ? UI.alert('warning', 'Simulated.', 'No third-party operator or help desk is connected; this only records the escalation.') : '') + UI.textarea({ id: 'ia', label: 'Reason', required: true }), 'Escalate', function (w) { var t = V(w, 'ia'); if (t.length < 5) return 'Enter a reason.'; i.esc.push({ ts: N(), by: me().name, lvl: O.LEVELS[i.lvl + 1], note: t }); O.incUpd(i, 'Escalated to ' + O.LEVELS[i.lvl + 1] + ' — ' + t, { lvl: i.lvl + 1, status: 'Escalated' }, 'Warning'); return fin(); }, 'danger');
  }
  M.actions.on('inc-view', function (el) { incView(el.getAttribute('data-id')); });
  M.pages['admin/support-incidents'] = {
    title: 'Support Incidents',
    render: function () { return UI.pageHead({ crumbs: crumbs('Support Incidents'), title: 'Support incidents', description: 'Demonstration incident records for establishments and system components.', actions: gate(can('incidents:create'), { label: 'New incident', icon: 'plus', variant: 'accent', action: 'inc-new' }, 'Requires “incidents — create”') }) + '<div class="stack">' + note('Synthetic incidents. No real help desk, ticketing system or third-party operator is connected. Assumed 3-level escalation model — to be confirmed against the URS.') + UI.card({ flush: true, body: '<div id="inc-table"></div>' }) + '</div>'; },
    mount: function (root) {
      var rows = O.incs.map(function (i) { return Object.assign({}, i, { estN: i.est ? R.est(i.est).name : '', who: i.assignee ? nameOf(i.assignee) : 'Unassigned' }); }), ctl;
      ctl = table(root, '#inc-table', { caption: 'Support incidents', rows: rows, searchKeys: ['id', 'title', 'estN', 'comp', 'who', 'desc'], searchPlaceholder: 'Search reference, title, establishment, assignee…', filter: { key: 'status', label: 'Status', options: ['Open', 'In progress', 'Escalated', 'Resolved', 'Closed'] }, toolbarExtra: sel('ic-fp', 'Priority', ['Critical', 'High', 'Medium', 'Low']) + sel('ic-fc', 'Category', O.ICAT),
        columns: [{ key: 'id', label: 'Reference', sortable: true, render: function (r) { return '<a href="#" data-action="inc-view" data-id="' + r.id + '" class="mono">' + esc(r.id) + '</a>'; } }, { key: 'title', label: 'Incident', render: function (r) { return '<div class="cell-main">' + esc(r.title) + '</div><div class="cell-sub">' + esc(r.cat) + ' · ' + esc(r.estN || r.comp) + '</div>'; } }, { key: 'pri', label: 'Priority', render: function (r) { return B(r.pri); } }, { key: 'status', label: 'Status', render: function (r) { return B(r.status); } }, { key: 'who', label: 'Assigned' }, { key: 'updated', label: 'Updated', sortable: true, render: function (r) { return esc(fmt(r.updated)); } }, { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Open', size: 'sm', action: 'inc-view', data: { id: r.id } }); } }] });
      function ap() { var p = root.querySelector('#ic-fp').value, c = root.querySelector('#ic-fc').value; ctl.setRows(rows.filter(function (r) { return (!p || r.pri === p) && (!c || r.cat === c); })); }
      ['ic-fp', 'ic-fc'].forEach(function (i) { root.querySelector('#' + i).addEventListener('change', ap); });
    }
  };

  /* ----- Exceptional access ----- */
  var mask = function (s) { s = String(s || ''); return s.slice(0, 2) + '•••' + s.slice(-2); };
  M.actions.on('ac-new', function () {
    var recs = S.recs.filter(function (r) { return r.stay !== 'Expected' && r.stay !== 'Draft'; }), mx = O.cfg.accessMaxMin;
    fm('Request exceptional access', UI.alert('info', 'No default access.', 'Support roles cannot see identifiable guest data. This request needs approval from a different administrator and expires automatically.') + UI.select({ id: 'ar-rec', label: 'Record (reference and room only)', placeholder: 'Select…', options: recs.map(function (r) { return { value: r.ref, label: r.ref + ' · Room ' + r.room }; }) }) +
      UI.select({ id: 'ar-inc', label: 'Related open incident', placeholder: 'Select…', options: O.incOpen().map(function (i) { return { value: i.id, label: i.id + ' · ' + i.title }; }) }) + UI.input({ id: 'ar-min', label: 'Duration (minutes, max ' + mx + ')', type: 'number', value: Math.min(15, mx) }) + UI.textarea({ id: 'ar-why', label: 'Justification', required: true }), 'Submit request',
      function (w) { var r = V(w, 'ar-rec'), inc = V(w, 'ar-inc'), m = +V(w, 'ar-min'), why = V(w, 'ar-why'); if (!r) return 'Select a record.'; if (!inc) return 'Select the related incident.'; if (!m || m < 1 || m > mx) return 'Duration must be 1–' + mx + ' minutes (configuration limit).'; if (why.length < 15) return 'Enter a justification (at least 15 characters).';
        var a = O.accReq({ ref: r, est: 'PIL-001', inc: inc, why: why, min: m }); M.toast.success('Request submitted', a.id + ' — awaiting approval by a different administrator.'); M.rerender(); return null; });
  });
  M.actions.on('ac-ok', function (el) { accDlg(el, true); }); M.actions.on('ac-no', function (el) { accDlg(el, false); });
  function accDlg(el, ok) { var a = O.acc(el.getAttribute('data-id')); fm((ok ? 'Approve ' : 'Deny ') + a.id, '<p>' + esc(a.by) + ' requests ' + a.min + ' minutes on ' + esc(a.ref) + ' (' + esc(a.inc) + ').</p><p class="hint">' + esc(a.why) + '</p>' + UI.textarea({ id: 'ac', label: ok ? 'Comment (optional)' : 'Reason for denial', required: !ok }), ok ? 'Approve time-limited access' : 'Deny', function (w) { var e = O.accDecide(a, ok, V(w, 'ac')); if (e) return e; M.toast.success(ok ? 'Access approved' : 'Request denied', a.id); M.rerender(); return null; }, ok ? 'primary' : 'danger'); }
  M.actions.on('ac-rev', function (el) { var a = O.acc(el.getAttribute('data-id')); fm('Revoke ' + a.id, UI.textarea({ id: 'ac', label: 'Reason', required: true }), 'Revoke access', function (w) { var t = V(w, 'ac'); if (t.length < 5) return 'Enter a reason.'; O.accRevoke(a, t); M.toast.warning('Access revoked', a.id); M.rerender(); return null; }, 'danger'); });
  M.actions.on('ac-exp', function (el) { var a = O.acc(el.getAttribute('data-id')); a.exp = N() - 1; O.sweep(); O.changed(); M.rerender(); M.toast.info('Expiry simulated', 'Demo control: the time limit has elapsed.'); });
  M.actions.on('ac-view', function (el) {
    O.sweep(); var a = O.acc(el.getAttribute('data-id')), r = S.get(a.ref); if (a.status !== 'Active' || !r) { M.toast.danger('Access not available', 'The grant is ' + a.status.toLowerCase() + '.'); M.rerender(); return; }
    O.audit('Privileged access', 'Privileged access', a.id, 'Guest record ' + a.ref + ' viewed under exceptional access', 'Success', a.inc);
    M.modal.open({ title: 'Time-limited view · ' + a.ref, body: UI.alert('warning', 'Exceptional access — audited.', 'Synthetic data. Expires ' + esc(fmt(a.exp)) + '. Not real personal data and not production security.') + '<dl class="kv"><dt>Guest</dt><dd>' + esc(r.guest) + '</dd><dt>Nationality</dt><dd>' + esc(r.nat) + '</dd><dt>Document</dt><dd>' + esc(r.docType + ' ' + mask(r.docNo)) + '</dd><dt>Room / stay</dt><dd>' + esc(r.room + ' · ' + r.stay) + '</dd><dt>Submission</dt><dd>' + B(r.sub) + (r.reason ? ' ' + esc(r.reason) : '') + '</dd></dl>', actions: [{ label: 'Close', variant: 'primary' }] });
  });
  M.pages['admin/exceptional-access'] = {
    title: 'Exceptional Access',
    render: function () {
      O.sweep(); var u = me(), r = u && R.role(u.role);
      return UI.pageHead({ crumbs: crumbs('Exceptional Access'), title: 'Exceptional support access', description: 'Support administrators have no default access to identifiable guest data. Access is requested, approved by someone else, time-limited and audited.', actions: gate(can('privaccess:create'), { label: 'Request access', icon: 'lock', variant: 'accent', action: 'ac-new' }, 'Requires “exceptional access — request” (Support Analyst role in the demo)') }) +
        '<div class="stack">' + UI.alert('warning', 'Demonstration only.', 'No real privileged-access management exists. Acting as <strong>' + esc(u ? u.name : '—') + '</strong> (' + esc(r ? r.name : '') + '). Maximum duration is a maker-checker setting (currently ' + O.cfg.accessMaxMin + ' min). Switch “Acting as” to approve a request you did not make.') + UI.card({ flush: true, body: '<div id="ac-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var u = me();
      table(root, '#ac-table', { caption: 'Access requests', rows: O.accs, searchKeys: ['id', 'ref', 'inc', 'by', 'why'], searchPlaceholder: 'Search request, record, incident…', filter: { key: 'status', label: 'Status', options: ['Pending approval', 'Active', 'Denied', 'Expired', 'Revoked'] }, pageSize: 6,
        columns: [{ key: 'id', label: 'Request', sortable: true, render: function (r) { return '<span class="mono">' + esc(r.id) + '</span><div class="cell-sub">' + esc(fmt(r.at)) + '</div>'; } }, { key: 'ref', label: 'Record / incident', render: function (r) { return '<span class="mono">' + esc(r.ref) + '</span><div class="cell-sub">' + esc(r.inc) + ' · ' + r.min + ' min · ' + esc(r.why) + '</div>'; } }, { key: 'by', label: 'Requested by' },
          { key: 'status', label: 'Status', render: function (r) { return B(r.status) + (r.decBy ? '<div class="cell-sub">' + esc(r.decBy) + (r.exp ? ' · expires ' + esc(fmt(r.exp)) : '') + '</div>' : '') + (r.revWhy ? '<div class="cell-sub">Revoked: ' + esc(r.revWhy) + '</div>' : '') + (r.comment ? '<div class="cell-sub">“' + esc(r.comment) + '”</div>' : ''); } },
          { key: 'a', label: '', align: 'right', render: function (r) { var own = u && r.byId === u.id, h = ''; if (r.status === 'Pending approval') { var ok = can('privaccess:approve') && !own, why = own ? 'The requester cannot approve their own request' : 'Requires approval rights'; h = gate(ok, { label: 'Approve', size: 'sm', variant: 'primary', action: 'ac-ok', data: { id: r.id } }, why) + gate(ok, { label: 'Deny', size: 'sm', action: 'ac-no', data: { id: r.id } }, why); }
            if (r.status === 'Active') h = gate(own, { label: 'View record', size: 'sm', variant: 'primary', action: 'ac-view', data: { id: r.id } }, 'Only the requester may open the record') + gate(can('privaccess:approve') || own, { label: 'Revoke', size: 'sm', action: 'ac-rev', data: { id: r.id } }) + UI.button({ label: 'Simulate expiry', size: 'sm', variant: 'ghost', action: 'ac-exp', data: { id: r.id } }); return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + h + '</div>'; } }] });
    }
  };

  O.changed();
})(window);
