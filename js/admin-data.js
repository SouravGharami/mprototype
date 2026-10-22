/* Msafiri — Stage 4A shared directory: establishments, users, roles and the demonstration permission engine.
   SYNTHETIC. Roles and permissions are CONFIGURABLE DEMONSTRATION VALUES, not an approved role matrix.
   Frontend-only checks (Msafiri.dir.can) are a demonstration of the UI behaviour — NOT production access control.
   Single source of truth: the Hotel Portal, Government Portal and Administration all read establishments/users from here. */
(function (g) {
  'use strict';
  var M = g.Msafiri, D = M.demo, S = M.store, R = M.dir = {};
  var NOW = function () { return Date.now(); };

  /* ---------------- Permission catalogue ---------------- */
  R.ACTIONS = [['read', 'Read'], ['create', 'Create'], ['edit', 'Edit'], ['approve', 'Approve'], ['admin', 'Administer']];
  /* ws = workspaces in which the module can be granted (least privilege: nothing is grantable outside its workspace). */
  R.MODULES = [
    { id: 'registration', cat: 'Hotel · Guest registration', label: 'Guest registration & check-in', ws: ['hotel'], actions: { read: 'View guest records', create: 'Register and check in guests', edit: 'Check-out, amend and cancel stays' } },
    { id: 'submissions', cat: 'Hotel · Government reporting', label: 'Submissions & offline queue', ws: ['hotel'], actions: { read: 'View submission status and queue', create: 'Submit, retry and synchronise', edit: 'Resolve offline conflicts' } },
    { id: 'profile', cat: 'Hotel · Establishment', label: 'Own establishment profile', ws: ['hotel'], actions: { read: 'View the profile', edit: 'Edit contact details' } },
    { id: 'staff', cat: 'Hotel · Establishment', label: 'Own establishment staff', ws: ['hotel'], actions: { read: 'View staff list', create: 'Add staff (defined, not wired in 4A)', edit: 'Edit staff (defined, not wired in 4A)' } },
    { id: 'govmonitor', cat: 'Government · Oversight', label: 'Establishment monitoring & data quality', ws: ['gov'], actions: { read: 'View establishments and submissions' } },
    { id: 'guestsearch', cat: 'Government · Oversight', label: 'Guest record search', ws: ['gov'], actions: { read: 'Search (purpose + case reference)', approve: 'Unmask one record with justification' } },
    { id: 'reports', cat: 'Government · Oversight', label: 'Reporting & trends', ws: ['gov'], actions: { read: 'View the reporting dashboard and trends', create: 'Export a report (defined, not wired in 4A)' } },
    { id: 'audit', cat: 'Governance', label: 'Audit & access history', ws: ['gov', 'admin'], actions: { read: 'View the audit trail' } },
    { id: 'establishments', cat: 'Administration', label: 'Establishment administration', ws: ['admin'], actions: { read: 'View all establishments', edit: 'Edit establishment records', approve: 'Approve onboarding', admin: 'Change operational status' } },
    { id: 'users', cat: 'Administration', label: 'User management', ws: ['admin'], actions: { read: 'View users', create: 'Create users', edit: 'Edit users', admin: 'Suspend, unlock, reset, assign roles' } },
    { id: 'roles', cat: 'Administration', label: 'Roles & permissions', ws: ['admin'], actions: { read: 'View roles', admin: 'Edit role permissions' } },
    { id: 'refdata', cat: 'Administration', label: 'Reference data & settings', ws: ['admin'], actions: { read: 'View reference data', admin: 'Add, edit and deactivate reference data' } },
    { id: 'config', cat: 'Administration', label: 'System configuration & approvals', ws: ['admin'], actions: { read: 'View configuration and history', edit: 'Change standard settings and propose sensitive changes', approve: 'Approve or reject proposals (not own)' } },
    { id: 'incidents', cat: 'Operations', label: 'Notifications & support incidents', ws: ['admin'], actions: { read: 'View notifications and incidents', create: 'Create incidents', edit: 'Update, assign and escalate incidents' } },
    { id: 'privaccess', cat: 'Operations', label: 'Exceptional access to guest data', ws: ['admin'], actions: { read: 'View access requests', create: 'Request exceptional access', approve: 'Approve, deny or revoke (not own request)' } },
    { id: 'integrations', cat: 'Administration', label: 'Integrations & PMS health', ws: ['admin'], actions: { read: 'View integration status', admin: 'Run simulated integration actions' } }
  ];
  R.WS = { hotel: 'Hotel Portal', gov: 'Government Portal', admin: 'System Administration' };
  R.SCOPE = { hotel: 'One establishment', gov: 'Government', admin: 'Platform' };
  R.mod = function (id) { return R.MODULES.filter(function (m) { return m.id === id; })[0]; };
  R.applicable = function (ws) { var o = []; R.MODULES.forEach(function (m) { if (m.ws.indexOf(ws) > -1) Object.keys(m.actions).forEach(function (a) { o.push(m.id + ':' + a); }); }); return o; };
  R.permLabel = function (p) { var s = p.split(':'), m = R.mod(s[0]); return (m ? m.label : s[0]) + ' — ' + s[1]; };

  /* Page-level enforcement demonstrated in Stage 4A (everything else is documented, not enforced). */
  R.GUARDS = {
    'hotel/new-registration': 'registration:create', 'hotel/registrations': 'registration:read', 'hotel/submissions': 'submissions:read', 'hotel/offline-queue': 'submissions:read',
    'hotel/check-in': 'registration:create', 'hotel/in-house': 'registration:read', 'hotel/stay-changes': 'registration:read', 'hotel/pms': 'registration:read', 'hotel/compliance': 'submissions:read',
    'hotel/profile': 'profile:read', 'hotel/staff': 'staff:read',
    'gov/establishments': 'govmonitor:read', 'gov/submission-quality': 'govmonitor:read', 'gov/search': 'guestsearch:read', 'gov/audit': 'audit:read', 'gov/reports': 'reports:read', 'gov/notifications': 'reports:read',
    'admin/users': 'users:read', 'admin/roles': 'roles:read', 'admin/establishments': 'establishments:read',
    'admin/reference-data': 'refdata:read', 'admin/settings': 'config:read', 'admin/approvals': 'config:read', 'admin/audit-logs': 'audit:read', 'admin/incidents': 'incidents:read', 'admin/support-incidents': 'incidents:read', 'admin/exceptional-access': 'privaccess:read', 'admin/pms-health': 'integrations:read', 'admin/integration-events': 'integrations:read'
  };

  /* ---------------- Seeds ---------------- */
  var NAMES = ['Demo Hotel A', 'Palm Crest Lodge', 'Savannah Rest Camp', 'Lakeview Guest House', 'Highland Court Hotel', 'Coral Bay Residences', 'Mangrove Bay Hotel', 'Kilele View Lodge', 'Riverside Guest House', 'Sunrise Apartments', 'Acacia Garden Inn', 'Baobab Ridge Resort', 'Dune Shore Hotel', 'Cedar Hill Lodge', 'Harbour Lights Inn', 'Sandstone Suites', 'Tamarind Court', 'Papyrus Lake Lodge', 'Orchid Valley Guest House', 'Meridian City Hotel'];
  R.CATS = ['Hotel', 'Lodge', 'Guest house', 'Serviced apartments', 'Resort'];
  R.REGIONS = ['Coastal', 'Central', 'Northern', 'Lake zone', 'Southern'];
  R.CATS0 = R.CATS.slice(); R.REGIONS0 = R.REGIONS.slice();
  R.PMS = ['Simulated connector', 'Manual entry', 'Not configured'];
  R.STATUS = ['Active', 'Inactive (demo)', 'Onboarding'];
  R.ONB = ['Not started (demo)', 'In progress (demo)', 'Awaiting approval review (demo)', 'Onboarding complete (demo)'];
  R.USTATUS = ['Active', 'Invited (demo)', 'Suspended', 'Locked'];
  var CONTACTS = ['Baraka Mushi', 'Juma Selemani', 'Peter Mollel', 'Neema Lukumay', 'Esther Mrema', 'Salim Barongo', 'Anna Massawe', 'Yusuf Kileo', 'Rose Mtui', 'Omari Kassim', 'Mary Chacha', 'Elias Nnko', 'Joyce Temba', 'Rashid Mfinanga', 'Catherine Msuya', 'Dotto Haule', 'Veronica Sanga', 'Hawa Mrisho', 'Gerald Ngowi', 'Lilian Moshi'];
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function seedEsts() {
    return NAMES.map(function (n, i) {
      var inactive = i % 7 === 5, queue = i >= 6 && i <= 9, st = i === 0 ? 'Active' : inactive ? 'Inactive (demo)' : (queue || i === 17) ? 'Onboarding' : 'Active';
      var e = { id: 'PIL-' + ('00' + (i + 1)).slice(-3), name: n, cat: R.CATS0[i % 5], loc: R.REGIONS0[(i * 2) % 5], status: st,
        onb: queue ? 'Awaiting approval review (demo)' : i === 17 ? 'In progress (demo)' : 'Onboarding complete (demo)',
        pms: i === 0 ? 'Simulated connector' : R.PMS[i % 3],
        address: 'Plot ' + (10 + i * 3) + ', Sample Road (synthetic)', contact: CONTACTS[i], phone: '+255 000 000 ' + (100 + i), email: 'frontdesk@' + slug(n) + '.example', notes: '' };
      if (i === 8) { e.phone = ''; e.email = ''; } if (i === 9) e.address = ''; if (i === 7) e.email = '';
      if (i === 17) { e.contact = ''; e.phone = ''; e.email = ''; e.address = ''; }
      return e;
    });
  }
  function seedRoles() {
    function r(id, name, ws, desc, perms) { return { id: id, name: name, ws: ws, desc: desc, perms: perms, custom: false }; }
    return [
      r('receptionist', 'Receptionist', 'hotel', 'Front-desk role: registers guests, checks them in and out, and follows submission status for one establishment.', ['registration:read', 'registration:create', 'registration:edit', 'submissions:read', 'submissions:create', 'profile:read']),
      r('hotel-manager', 'Establishment Manager', 'hotel', 'Runs one establishment: everything a receptionist can do, plus conflict resolution, contact-detail edits and the staff list.', ['registration:read', 'registration:create', 'registration:edit', 'submissions:read', 'submissions:create', 'submissions:edit', 'profile:read', 'profile:edit', 'staff:read']),
      r('hotel-viewer', 'Reporting Viewer (read-only)', 'hotel', 'Read-only view of one establishment’s records and submissions. Cannot register guests.', ['registration:read', 'submissions:read', 'profile:read']),
      r('gov-officer', 'Authorised Government Officer', 'gov', 'Monitors establishments and may run purpose-bound guest searches with single-record unmasking. Cannot export.', ['govmonitor:read', 'guestsearch:read', 'guestsearch:approve', 'audit:read', 'reports:read']),
      r('gov-analyst', 'Government Analyst', 'gov', 'Aggregate monitoring and trends only. No access to guest-record search or audit history.', ['govmonitor:read', 'reports:read']),
      r('gov-auditor', 'Government Auditor', 'gov', 'Reads the audit trail and monitoring views. No guest-record search.', ['govmonitor:read', 'audit:read']),
      r('sysadmin', 'System Administrator', 'admin', 'Manages users, roles and establishment records. Deliberately has no guest-record access. May run simulated integration actions.', ['establishments:read', 'establishments:edit', 'establishments:approve', 'establishments:admin', 'users:read', 'users:create', 'users:edit', 'users:admin', 'roles:read', 'roles:admin', 'refdata:read', 'refdata:admin', 'integrations:read', 'integrations:admin', 'audit:read', 'config:read', 'config:edit', 'config:approve', 'incidents:read', 'incidents:create', 'incidents:edit', 'privaccess:read', 'privaccess:approve']),
      r('support', 'Support Analyst (read-only)', 'admin', 'Read-only view of establishments, users and roles for support. Cannot change anything.', ['establishments:read', 'users:read', 'roles:read', 'refdata:read', 'integrations:read', 'audit:read', 'config:read', 'incidents:read', 'incidents:create', 'incidents:edit', 'privaccess:read', 'privaccess:create'])
    ];
  }
  function seedUsers() {
    function u(n, name, role, est, status, mins, title) {
      var dom = est ? (R.est(est) ? slug(R.est(est).name) : 'hotel') : role.indexOf('gov') === 0 ? 'gov-demo' : 'msafiri-demo';
      var parts = name.toLowerCase().split(' ');
      return { id: 'USR-' + ('00' + n).slice(-3), name: name, email: parts[0] + '.' + parts[1] + '@' + dom + '.example', phone: '+255 000 111 ' + (200 + n), title: title, role: role, est: est || null, status: status,
        lastTs: mins == null ? null : NOW() - mins * 60000, created: NOW() - (20 + n * 9) * 864e5, notes: '' };
    }
    return [
      u(1, 'Neema Kiptoo', 'receptionist', 'PIL-001', 'Active', 12, 'Front desk'), u(2, 'Baraka Mushi', 'hotel-manager', 'PIL-001', 'Active', 95, 'General manager'),
      u(3, 'Grace Lyimo', 'receptionist', 'PIL-001', 'Active', 340, 'Front desk'), u(4, 'Idris Komba', 'hotel-viewer', 'PIL-001', 'Active', 2880, 'Accounts'),
      u(5, 'Juma Selemani', 'hotel-manager', 'PIL-002', 'Active', 180, 'Manager'), u(6, 'Rehema Said', 'receptionist', 'PIL-002', 'Invited (demo)', null, 'Front desk'),
      u(7, 'Peter Mollel', 'hotel-manager', 'PIL-003', 'Active', 1500, 'Camp manager'), u(8, 'Esther Mrema', 'hotel-manager', 'PIL-005', 'Active', 60, 'Manager'),
      u(9, 'Fatuma Ally', 'receptionist', 'PIL-005', 'Locked', 4300, 'Front desk'), u(10, 'Hassani Mwinyi', 'receptionist', 'PIL-004', 'Suspended', 20000, 'Front desk'),
      u(11, 'Mary Chacha', 'hotel-manager', 'PIL-011', 'Active', 800, 'Manager'), u(12, 'Elias Nnko', 'receptionist', 'PIL-012', 'Active', 2000, 'Front desk'),
      u(13, 'Joseph Ndege', 'gov-officer', null, 'Active', 25, 'Oversight officer'), u(14, 'Amina Rashid', 'gov-analyst', null, 'Active', 400, 'Analyst'),
      u(15, 'Daudi Mkapa', 'gov-auditor', null, 'Active', 1200, 'Auditor'), u(16, 'Lucy Kimaro', 'gov-officer', null, 'Locked', 9000, 'Oversight officer'),
      u(17, 'Sofia Okello', 'sysadmin', null, 'Active', 5, 'Platform administrator'), u(18, 'Zawadi Mwita', 'sysadmin', null, 'Active', 600, 'Platform administrator'),
      u(19, 'Hamisi Juma', 'support', null, 'Active', 150, 'Support')
    ];
  }

  /* ---------------- Lookups ---------------- */
  R.est = function (id) { return (R.ests || []).filter(function (e) { return e.id === id; })[0]; };
  R.estByName = function (n) { return (R.ests || []).filter(function (e) { return e.name === n; })[0]; };
  R.role = function (id) { return (R.roles || []).filter(function (x) { return x.id === id; })[0]; };
  R.user = function (id) { return (R.users || []).filter(function (x) { return x.id === id; })[0]; };
  R.estUsers = function (id) { return R.users.filter(function (u) { return u.est === id; }); };
  R.roleUsers = function (id) { return R.users.filter(function (u) { return u.role === id; }); };
  R.initials = function (n) { return String(n).split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  R.rel = function (ts) {
    if (!ts) return 'Never signed in'; var m = Math.max(0, Math.round((NOW() - ts) / 60000));
    return m < 1 ? 'Just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
  };
  R.fmt = function (ts) { return ts ? new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; };

  /* Profile completeness: 8 equally weighted fields. */
  var CFIELDS = [['name', 'Name'], ['cat', 'Category'], ['loc', 'Location'], ['address', 'Address'], ['contact', 'Contact person'], ['phone', 'Phone'], ['email', 'Email'], ['pms', 'PMS / integration']];
  R.completeness = function (e) {
    var miss = CFIELDS.filter(function (f) { var v = e[f[0]]; return !v || (f[0] === 'pms' && v === 'Not configured'); }).map(function (f) { return f[1]; });
    return { pct: Math.round((CFIELDS.length - miss.length) / CFIELDS.length * 100), missing: miss };
  };

  /* Establishment view with reporting metrics. PIL-001 is LIVE from the shared hotel store; the rest are synthetic samples. */
  R.estView = function () {
    return R.ests.map(function (m, i) {
      var live = m.status === 'Active';
      var e = Object.assign({}, m, { onbOk: m.onb === 'Onboarding complete (demo)', pms: i === 0 && S.offline ? 'Offline (simulated)' : m.pms,
        reg: live ? 18 + (i * 7) % 40 : 0, arr: live ? 20 + (i * 7) % 40 : 0, dep: live ? 10 + (i * 3) % 25 : 0, pend: live ? (i * 5) % 7 : 0, fail: live && i % 4 === 3 ? (i % 3) + 1 : 0, qual: live ? (i * 3) % 5 : 0, last: live ? (8 + i % 6) + ':' + (10 + i * 3 % 50) : '—', sample: true });
      if (i === 0) {
        var t = new Date().toISOString().slice(0, 10), rs = S.recs, c = S.cards();
        e.reg = rs.filter(function (x) { return x.arrival === t && x.stay !== 'Cancelled' && x.stay !== 'Expected' && x.stay !== 'Draft'; }).length;
        e.arr = c[1].value; e.dep = c[2].value; e.pend = S.count('Pending') + S.count('Submitted') + S.queue().length; e.fail = S.count('Rejected'); e.qual = e.fail + S.count('Conflict');
        e.last = (rs.filter(function (x) { return x.subAt; })[0] || {}).subAt || '—'; e.sample = false;
      }
      var c2 = R.completeness(m); e.pct = c2.pct; e.missing = c2.missing; e.users = R.estUsers(m.id).length;
      return e;
    });
  };
  R.estViewOne = function (id) { return R.estView().filter(function (e) { return e.id === id; })[0]; };

  /* ---------------- Audit / logging ---------------- */
  R.log = function (module, target, detail, outcome, portal) {
    var p = portal || 'admin', me = R.me(p), who = me ? me.name : 'Demo user', tag = p === 'hotel' ? 'Hotel' : p === 'gov' ? 'Gov' : 'Admin';
    S.aud(who + ' (' + tag + ', demo)', 'Administrative action', target, detail, outcome || 'Success'); S.audit[0].mod = module; S.audit[0].ts = NOW();
    var t = new Date().toTimeString().slice(0, 5);
    D.admin.audit.unshift({ when: t, actor: who, action: detail, module: module, result: outcome || 'Success' });
    if (me) me.lastTs = NOW();
  };
  R.logFor = function (target) { return S.audit.filter(function (a) { return a.target === target && a.type === 'Administrative action'; }); };

  /* ---------------- Acting user + permission engine (DEMONSTRATION ONLY) ---------------- */
  R.acting = {};
  R.me = function (portal) { return R.user(R.acting[portal || M.state.portal]); };
  R.can = function (perm, portal) {
    var u = R.me(portal); if (!u || u.status !== 'Active') return false;
    var r = R.role(u.role); return !!r && r.perms.indexOf(perm) > -1;
  };
  R.denied = function (portal, id) {
    var perm = R.GUARDS[portal + '/' + id]; if (!perm) return null;
    var u = R.me(portal);
    if (!u || u.status !== 'Active') return { perm: perm, reason: 'account', user: u };
    return R.can(perm, portal) ? null : { perm: perm, reason: 'role', user: u };
  };
  R.eligible = function (portal) {
    return R.users.filter(function (u) { var r = R.role(u.role); return r && r.ws === portal && (portal !== 'hotel' || u.est === 'PIL-001'); });
  };
  R.actAs = function (portal, id) { if (portal === 'gov' && R.acting.gov !== id && S.unmasked) S.unmasked = {}; R.acting[portal] = id; R.syncPersonas(); };
  R.syncPersonas = function () {
    ['hotel', 'gov', 'admin'].forEach(function (p) {
      var u = R.me(p), pu = D.users[p]; if (!u) return;
      var r = R.role(u.role), e = u.est ? R.est(u.est) : null;
      pu.name = u.name; pu.initials = R.initials(u.name); pu.role = r ? r.name : 'Unassigned role'; pu.userId = u.id;
      if (p === 'hotel') pu.org = (e ? e.name : 'Unassigned establishment') + ' · pilot establishment (synthetic)';
    });
  };
  R.changed = function () {
    R.syncPersonas();
    var f = M.findItem('admin', 'establishments'); if (f) f.item.count = D.admin.queue.length;
    if (M.refreshSidebar) M.refreshSidebar();
  };

  /* ---------------- Mutations (each writes to the shared audit trail) ---------------- */
  R.estSave = function (id, patch, portal) {
    var e = R.est(id), ch = [];
    Object.keys(patch).forEach(function (k) { if (String(e[k] || '') !== String(patch[k] || '')) { ch.push(k + ': “' + (e[k] || '—') + '” → “' + (patch[k] || '—') + '”'); e[k] = patch[k]; } });
    if (ch.length) R.log('Establishments', id, 'Updated establishment ' + e.name + ' — ' + ch.join('; '), 'Success', portal);
    R.changed(); return ch;
  };
  R.estApprove = function (name) { var e = R.estByName(name); if (!e) return; e.onb = 'Onboarding complete (demo)'; e.status = 'Active'; R.log('Establishments', e.id, 'Onboarding approved (demo) for ' + e.name + ' — set Active'); R.changed(); };
  R.estReject = function (name, why) { var e = R.estByName(name); if (!e) return; e.onb = 'In progress (demo)'; R.log('Establishments', e.id, 'Onboarding application returned (demo) for ' + e.name + ' — ' + why, 'Warning'); R.changed(); };
  R.userCreate = function (d) {
    var n = R.users.reduce(function (m, u) { return Math.max(m, +u.id.slice(4)); }, 0) + 1;
    var u = Object.assign({ id: 'USR-' + ('00' + n).slice(-3), lastTs: null, created: NOW(), notes: '' }, d); R.users.push(u);
    R.log('Users & Roles', u.id, 'Created user ' + u.name + ' (' + R.role(u.role).name + (u.est ? ' · ' + R.est(u.est).name : '') + ') — status ' + u.status); R.changed(); return u;
  };
  R.userSave = function (id, d) {
    var u = R.user(id), ch = [];
    Object.keys(d).forEach(function (k) {
      if (String(u[k] || '') !== String(d[k] || '')) {
        var from = u[k], to = d[k];
        if (k === 'role') { from = R.role(from).name; to = R.role(to).name; } if (k === 'est') { from = from ? R.est(from).name : '—'; to = to ? R.est(to).name : '—'; }
        ch.push(k + ': “' + (from || '—') + '” → “' + (to || '—') + '”'); u[k] = d[k];
      }
    });
    if (ch.length) R.log('Users & Roles', id, 'Updated user ' + u.name + ' — ' + ch.join('; ')); R.changed(); return ch;
  };
  R.userStatus = function (id, status, why) { var u = R.user(id), old = u.status; u.status = status; R.log('Users & Roles', id, 'Account status for ' + u.name + ': ' + old + ' → ' + status + (why ? ' — reason: ' + why : ''), status === 'Active' ? 'Success' : 'Warning'); R.changed(); };
  R.userReset = function (id) { var u = R.user(id); R.log('Users & Roles', id, 'Password reset requested for ' + u.name + ' (simulated — no credentials exist in this prototype)'); };
  R.roleSave = function (id, perms) {
    var r = R.role(id), add = perms.filter(function (p) { return r.perms.indexOf(p) < 0; }), rem = r.perms.filter(function (p) { return perms.indexOf(p) < 0; });
    r.perms = perms.slice(); R.log('Users & Roles', 'ROLE:' + id, 'Permissions for role “' + r.name + '” changed — added ' + (add.length || 'none') + ', removed ' + (rem.length || 'none')); R.changed(); return { add: add, rem: rem };
  };
  R.roleCreate = function (name, ws, desc, cloneId) {
    var id = 'custom-' + (R.roles.filter(function (x) { return x.custom; }).length + 1) + '-' + slug(name), c = cloneId ? R.role(cloneId) : null;
    var r = { id: id, name: name, ws: ws, desc: desc, perms: c ? c.perms.filter(function (p) { return R.applicable(ws).indexOf(p) > -1; }) : [], custom: true };
    R.roles.push(r); R.log('Users & Roles', 'ROLE:' + id, 'Created demonstration role “' + name + '” in ' + R.WS[ws]); R.changed(); return r;
  };
  R.roleDelete = function (id) { var r = R.role(id); R.roles = R.roles.filter(function (x) { return x.id !== id; }); R.log('Users & Roles', 'ROLE:' + id, 'Deleted demonstration role “' + r.name + '”', 'Warning'); R.changed(); };
  R.activeAdmins = function (exceptId) { return R.users.filter(function (u) { return u.role === 'sysadmin' && u.status === 'Active' && u.id !== exceptId; }).length; };

  /* Derived admin dashboard figures (replace the static Stage 1 numbers so everything agrees). */
  R.adminStats = function (base) {
    var act = R.users.filter(function (u) { return u.status === 'Active'; }).length, lock = R.users.filter(function (u) { return u.status === 'Locked'; }).length;
    var onb = R.ests.filter(function (e) { return e.onb === 'Onboarding complete (demo)'; }).length;
    return [Object.assign({}, base[0], { value: act, delta: 'of ' + R.users.length + ' accounts', dtone: 'flat', foot: 'from the user directory' }),
      Object.assign({}, base[1], { value: onb, delta: 'of ' + R.ests.length + ' in directory', foot: 'pilot planning context' }), base[2],
      Object.assign({}, base[3], { value: lock, delta: lock ? 'Needs review' : 'None', dtone: 'flat', foot: 'from the user directory' })];
  };

  /* ---------------- Reset ---------------- */
  var auditSeed = JSON.stringify(D.admin.audit);
  R.reset = function () {
    R.ests = seedEsts(); R.roles = seedRoles(); R.users = seedUsers();
    R.acting = { hotel: 'USR-001', gov: 'USR-013', admin: 'USR-017' };
    D.admin.audit = JSON.parse(auditSeed);
    R.syncPersonas();
  };
  R.reset();
  /* Align the Stage 1 overdue list with directory names/ids so every workspace agrees. */
  D.gov.overdue.forEach(function (o) { var e = R.estByName(o.name); if (e) { o.id = e.id; o.region = e.loc; } });
  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(function () { R.reset(); R.changed(); });
})(window);
