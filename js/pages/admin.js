/* Msafiri — Stage 4A: Users, Roles & Permissions, Establishment Administration (+ Hotel Portal profile & staff views).
   All SYNTHETIC. State lives in Msafiri.dir (js/admin-data.js). Permission checks here are a frontend DEMONSTRATION, not production security.
   Sub-routes: #/admin/users[/new|/<id>[/edit]]  #/admin/roles[/new|/<id>[/edit]]  #/admin/establishments[/<id>[/edit]] */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, icon = M.icon, R = M.dir, D = M.demo, S = M.store;

  /* ---------------- shared helpers ---------------- */
  function acrumbs() { var a = [{ label: 'System Administration', href: '#/admin/dashboard' }]; for (var i = 0; i < arguments.length; i++) a.push(typeof arguments[i] === 'string' ? { label: arguments[i] } : arguments[i]); return a; }
  function can(p, portal) { return R.can(p, portal || 'admin'); }
  /* Stage 7.4: handlers re-check the permission, not only the rendered button (frontend demonstration only). */
  function need(p) { if (can(p)) return true; M.toast.danger('Not permitted', 'Your demo role does not hold ' + R.permLabel(p) + '.'); return false; }
  /* A control the acting demo role may not use is shown disabled with an explanation, never hidden silently. */
  function gate(ok, opts, why) {
    if (ok) return UI.button(opts);
    var o = Object.assign({}, opts, { href: null, action: null, disabled: true });
    return '<span title="' + esc(why || 'Not permitted for the acting demo role') + '">' + UI.button(o) + '</span>';
  }
  function ub(status) { return UI.badge(status, { 'Active': 'success', 'Invited (demo)': 'info', 'Suspended': 'warning', 'Locked': 'danger' }[status] || 'neutral'); }
  function eb(status) { return UI.badge(status, status === 'Active' ? 'success' : status === 'Onboarding' ? 'info' : 'neutral'); }
  function ob(o) { return UI.badge(o, /complete/.test(o) ? 'success' : /Awaiting/.test(o) ? 'warning' : /progress/.test(o) ? 'info' : 'neutral'); }
  function pmsb(p) { return UI.badge(p, /Simulated/.test(p) ? 'info' : /Offline/.test(p) ? 'warning' : 'neutral'); }
  function bar(pct) { return '<div class="row" style="flex-wrap:nowrap;gap:8px"><div class="progress' + (pct < 100 ? ' orange' : '') + '" style="width:80px" role="img" aria-label="' + pct + '% complete"><span style="width:' + pct + '%"></span></div><span class="num" style="font-size:var(--fs-xs)">' + pct + '%</span></div>'; }
  function notFound(what, back, label) { return UI.card({ body: UI.empty({ icon: 'search', title: what + ' not found', body: 'It may have been removed or the address is wrong.', actions: UI.button({ label: label, variant: 'primary', href: back }) }) }); }
  function note(t) { return UI.alert('info', 'Demonstration data.', esc(t)); }
  var SIM = 'Synthetic users and establishments only. No real sign-in, password, identity verification or production access control exists in this prototype; frontend permission checks are not security.';
  function selOpts(id, label, opts) { return '<select class="select input-sm" id="' + id + '" aria-label="' + esc(label) + '"><option value="">' + esc(label) + ': All</option>' + opts.map(function (o) { var v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o; return '<option value="' + esc(v) + '">' + esc(l) + '</option>'; }).join('') + '</select>'; }

  /* inline field errors (same technique as the form template) */
  function setErr(form, id, msg) {
    var inp = form.querySelector('#' + id); if (!inp) return true;
    var old = form.querySelector('#' + id + '-err'); if (old) old.remove(); inp.removeAttribute('aria-invalid');
    var hint = form.querySelector('#' + id + '-hint');
    if (!msg) { if (hint) inp.setAttribute('aria-describedby', id + '-hint'); else inp.removeAttribute('aria-describedby'); return true; }
    inp.setAttribute('aria-invalid', 'true');
    var e = document.createElement('div'); e.className = 'error-text'; e.id = id + '-err'; e.innerHTML = icon('alert', { size: 14 }) + esc(msg);
    (inp.closest('.input-icon') || inp).after(e); inp.setAttribute('aria-describedby', id + '-err' + (hint ? ' ' + id + '-hint' : '')); return false;
  }
  function showErrors(form, errs) {
    var box = form.querySelector('#form-summary'); form.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); }); form.querySelectorAll('.error-text').forEach(function (n) { n.remove(); });
    errs.forEach(function (e) { setErr(form, e.id, e.msg); });
    if (box) box.innerHTML = errs.length ? UI.alert('danger', 'Please fix ' + errs.length + (errs.length === 1 ? ' field' : ' fields') + ' before saving.', '<ul style="margin:4px 0 0 18px">' + errs.map(function (e) { return '<li><a href="#" data-action="focus-field" data-field="' + e.id + '">' + esc(e.msg) + '</a></li>'; }).join('') + '</ul>') : '';
    if (errs.length) { var f = form.querySelector('#' + errs[0].id); if (f) f.focus(); M.toast.danger('Please fix ' + errs.length + (errs.length === 1 ? ' field' : ' fields'), 'Errors are marked in the form.'); }
  }
  M.actions.on('focus-field', function (el) { var f = document.getElementById(el.getAttribute('data-field')); if (f) f.focus(); });
  function v(form, id) { var e = form.querySelector('#' + id); return e ? String(e.value).trim() : ''; }
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, PHONE = /^\+?[0-9 ()-]{7,20}$/;
  function changeList(rows) { return '<dl class="kv">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + ' → ' + esc(r[2]) + '</dd>'; }).join('') + '</dl>'; }
  function reasonDialog(o) {
    M.modal.open({ title: o.title, body: o.body + UI.textarea({ id: 'reason-box', label: 'Reason', required: true, placeholder: o.placeholder || 'Recorded in the audit trail' }),
      actions: [{ label: 'Cancel' }, { label: o.confirm, variant: o.variant || 'danger', onClick: function (wrap) {
        var ta = wrap.querySelector('#reason-box'), why = ta.value.trim();
        if (why.length < 5) { ta.setAttribute('aria-invalid', 'true'); if (!wrap.querySelector('#reason-box-err')) { var e = document.createElement('div'); e.className = 'error-text'; e.id = 'reason-box-err'; e.innerHTML = icon('alert', { size: 14 }) + 'Enter a reason (at least 5 characters).'; ta.after(e); ta.setAttribute('aria-describedby', 'reason-box-err'); } ta.focus(); return false; }
        o.onDone(why);
      } }] });
  }
  function isActing(id) { return Object.keys(R.acting).filter(function (p) { return R.acting[p] === id; }); }

  /* ======================================================================
     USERS
     ====================================================================== */
  function permSummary(role) {
    if (!role) return '<p class="muted">No role assigned.</p>';
    var rows = R.MODULES.filter(function (m) { return m.ws.indexOf(role.ws) > -1; }).map(function (m) {
      var held = R.ACTIONS.filter(function (a) { return role.perms.indexOf(m.id + ':' + a[0]) > -1; });
      return '<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><div class="t">' + esc(m.label) + '</div><div class="s">' + esc(m.cat) + '</div></div><div class="chips">' +
        (held.length ? held.map(function (a) { return UI.badge(a[1], 'navy', { dot: false }); }).join('') : UI.badge('No access', 'neutral', { dot: false })) + '</div></div>';
    });
    return rows.join('');
  }
  function userRow(u) {
    var r = R.role(u.role), e = u.est ? R.est(u.est) : null;
    return { id: u.id, name: u.name, email: u.email, roleId: u.role, roleName: r ? r.name : '—', ws: r ? R.WS[r.ws] : '—', estId: u.est || '', estName: e ? e.name : '—', status: u.status, lastTs: u.lastTs || 0, last: R.rel(u.lastTs) };
  }

  function usersList() {
    var us = R.users, c = function (s) { return us.filter(function (u) { return u.status === s; }).length; };
    return UI.pageHead({ crumbs: acrumbs('Users'), title: 'Users', description: 'Accounts, assigned roles and establishment association. ' + esc('Search, filter and open a user to see their effective permissions.'),
      actions: gate(can('users:create'), { label: 'Add user', icon: 'user-plus', variant: 'accent', href: '#/admin/users/new' }, 'Requires “User management — create”') +
        UI.button({ label: 'Roles & permissions', icon: 'key', variant: 'secondary', href: '#/admin/roles' }) }) +
      '<div class="stack">' + note(SIM) +
      '<div class="grid cols-4">' + [{ label: 'Total users', value: us.length, icon: 'users', foot: 'in the directory' }, { label: 'Active', value: c('Active'), icon: 'check-circle', tone: 'green', foot: 'can use their role' },
        { label: 'Suspended or locked', value: c('Suspended') + c('Locked'), icon: 'lock', tone: 'red', foot: 'no permissions applied' }, { label: 'Invited (demo)', value: c('Invited (demo)'), icon: 'send', tone: 'orange', foot: 'never signed in' }].map(UI.statCard).join('') + '</div>' +
      UI.card({ flush: true, body: '<div id="user-table"></div>' }) + '</div>';
  }
  function usersMount(root) {
    var all = R.users.map(userRow), ctl;
    var extra = selOpts('uf-role', 'Role', R.roles.map(function (r) { return { value: r.id, label: r.name }; })) + selOpts('uf-est', 'Establishment', [{ value: '-', label: 'None (government / platform)' }].concat(R.ests.map(function (e) { return { value: e.id, label: e.name }; })));
    ctl = UI.table.mount(root.querySelector('#user-table'), { caption: 'Users', rows: all, pageSize: 8, searchKeys: ['name', 'email', 'id', 'roleName', 'estName'], searchPlaceholder: 'Search name, email, role, establishment…',
      filter: { key: 'status', label: 'Status', options: R.USTATUS }, toolbarExtra: extra, emptyText: 'No users match the current search and filters.',
      columns: [{ key: 'name', label: 'User', sortable: true, render: function (r) { return '<div class="cell-person">' + UI.avatar(R.initials(r.name), { sm: true }) + '<div><a class="cell-main" href="#/admin/users/' + r.id + '">' + esc(r.name) + '</a><div class="cell-sub">' + esc(r.email) + '</div></div></div>'; } },
        { key: 'roleName', label: 'Role', sortable: true, render: function (r) { return '<div>' + esc(r.roleName) + '</div><div class="cell-sub">' + esc(r.ws) + '</div>'; } },
        { key: 'estName', label: 'Establishment', sortable: true, render: function (r) { return r.estId ? '<a href="#/admin/establishments/' + r.estId + '">' + esc(r.estName) + '</a>' : '<span class="muted">—</span>'; } },
        { key: 'status', label: 'Status', sortable: true, render: function (r) { return ub(r.status); } },
        { key: 'lastTs', label: 'Last activity', sortable: true, render: function (r) { return '<span title="' + esc(R.fmt(r.lastTs)) + '">' + esc(r.last) + '</span>'; } },
        { key: 'a', label: '', align: 'right', render: function (r) { return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + UI.button({ label: 'View', size: 'sm', variant: 'ghost', href: '#/admin/users/' + r.id, aria: 'View ' + r.name }) + (can('users:edit') ? UI.button({ label: 'Edit', size: 'sm', variant: 'secondary', href: '#/admin/users/' + r.id + '/edit', aria: 'Edit ' + r.name }) : '') + '</div>'; } }] });
    function apply() {
      var ro = root.querySelector('#uf-role').value, es = root.querySelector('#uf-est').value;
      ctl.setRows(all.filter(function (r) { return (!ro || r.roleId === ro) && (!es || (es === '-' ? !r.estId : r.estId === es)); }));
    }
    root.querySelector('#uf-role').addEventListener('change', apply); root.querySelector('#uf-est').addEventListener('change', apply);
  }

  function userDetail(id) {
    var u = R.user(id), back = '#/admin/users';
    if (!u) return UI.pageHead({ crumbs: acrumbs({ label: 'Users', href: back }, 'Not found'), title: 'User not found' }) + notFound('User', back, 'Back to users');
    var r = R.role(u.role), e = u.est ? R.est(u.est) : null, log = R.logFor(u.id), acting = isActing(u.id);
    var acts = gate(can('users:edit'), { label: 'Edit', icon: 'edit', variant: 'secondary', href: '#/admin/users/' + u.id + '/edit' }, 'Requires “User management — edit”');
    var adm = can('users:admin'), why = 'Requires “User management — administer”';
    if (u.status === 'Active') acts += gate(adm, { label: 'Suspend', icon: 'lock', variant: 'secondary', action: 'u-suspend', data: { id: u.id } }, why);
    if (u.status === 'Suspended' || u.status === 'Invited (demo)') acts += gate(adm, { label: u.status === 'Suspended' ? 'Reactivate' : 'Activate', icon: 'check-circle', variant: 'primary', action: 'u-reactivate', data: { id: u.id } }, why);
    if (u.status === 'Locked') acts += gate(adm, { label: 'Unlock account', icon: 'key', variant: 'primary', action: 'u-unlock', data: { id: u.id } }, why);
    acts += gate(adm && u.status === 'Active', { label: 'Reset password', icon: 'refresh', variant: 'ghost', action: 'u-reset', data: { id: u.id } }, adm ? 'Only active accounts can be reset (simulated)' : why);
    return UI.pageHead({ crumbs: acrumbs({ label: 'Users', href: back }, u.name), title: u.name, description: esc(u.title || '') + (u.title ? ' · ' : '') + esc(r ? r.name : 'No role') + (e ? ' · ' + esc(e.name) : ''), actions: acts }) +
      '<div class="stack">' + (acting.length ? UI.alert('info', 'Currently used as an acting demo user.', 'This account is the “Acting as” user in ' + acting.map(function (p) { return esc(R.WS[p]); }).join(' and ') + '. Its role therefore drives what that workspace shows.') : '') +
      (u.status !== 'Active' ? UI.alert('warning', 'Account is ' + esc(u.status.toLowerCase()) + '.', 'In the demonstration, no permissions are applied while the status is not Active.') : '') +
      '<div class="grid main-side"><div class="stack">' +
      UI.card({ title: 'Profile', body: '<dl class="kv"><dt>User ID</dt><dd class="mono">' + esc(u.id) + '</dd><dt>Email</dt><dd>' + esc(u.email) + '</dd><dt>Mobile</dt><dd>' + esc(u.phone || '—') + '</dd><dt>Job title</dt><dd>' + esc(u.title || '—') + '</dd><dt>Created</dt><dd>' + esc(R.fmt(u.created)) + '</dd><dt>Notes</dt><dd>' + esc(u.notes || '—') + '</dd></dl>' }) +
      UI.card({ title: 'Role & access', subtitle: 'Permissions follow the assigned role (demonstration)', body: '<dl class="kv"><dt>Role</dt><dd>' + (r ? '<a href="#/admin/roles/' + r.id + '">' + esc(r.name) + '</a>' : '—') + '</dd><dt>Workspace</dt><dd>' + esc(r ? R.WS[r.ws] : '—') + '</dd><dt>Scope</dt><dd>' + esc(r ? R.SCOPE[r.ws] : '—') + '</dd><dt>Establishment</dt><dd>' + (e ? '<a href="#/admin/establishments/' + e.id + '">' + esc(e.name) + '</a> <span class="muted">(' + esc(e.id) + ')</span>' : '<span class="muted">Not applicable for this role</span>') + '</dd></dl><h4 style="margin:var(--sp-5) 0 var(--sp-2);font-size:var(--fs-sm)">Effective permissions</h4>' + permSummary(r) }) +
      '</div><div class="stack">' +
      UI.card({ title: 'Account status', body: '<div class="stack" style="gap:var(--sp-3)">' + ub(u.status) + '<dl class="kv" style="grid-template-columns:110px 1fr"><dt>Last activity</dt><dd>' + esc(R.rel(u.lastTs)) + '</dd><dt>Date / time</dt><dd>' + esc(R.fmt(u.lastTs)) + '</dd></dl><div class="hint">Last activity is synthetic.</div></div>' }) +
      UI.card({ title: 'Administrative history', subtitle: 'From the shared audit trail', flush: true, body: log.length ? log.slice(0, 6).map(function (a) { return '<div class="list-row"><div class="grow"><div class="t">' + esc(a.detail) + '</div><div class="s">' + esc(a.user + ' · ' + a.t) + '</div></div></div>'; }).join('') : '<div class="list-row"><div class="grow s">No administrative changes recorded in this session.</div></div>', foot: '<a href="#/gov/audit">Open audit history (Government Portal)</a>' }) +
      '</div></div></div>';
  }

  function userForm(id, presetEst) {
    var edit = id && id !== 'new', u = edit ? R.user(id) : null, back = edit ? '#/admin/users/' + id : '#/admin/users';
    if (edit && !u) return UI.pageHead({ crumbs: acrumbs({ label: 'Users', href: '#/admin/users' }, 'Not found'), title: 'User not found' }) + notFound('User', '#/admin/users', 'Back to users');
    var need = edit ? 'users:edit' : 'users:create';
    if (!can(need)) return UI.pageHead({ crumbs: acrumbs({ label: 'Users', href: '#/admin/users' }, edit ? 'Edit' : 'New user'), title: edit ? 'Edit user' : 'New user' }) + UI.alert('warning', 'Not permitted for this demo role.', 'Requires ' + esc(R.permLabel(need)) + '. Change the “Acting as” user or the role’s permissions.');
    var d = u || { name: '', email: '', phone: '', title: '', role: '', est: presetEst && R.est(presetEst) ? presetEst : '', status: 'Active', notes: '' };
    var role = R.role(d.role), perm = can('users:admin');
    var f = UI.input({ id: 'u-name', label: 'Full name', required: true, value: d.name }) + UI.input({ id: 'u-email', label: 'Email', type: 'email', required: true, value: d.email, hint: 'Used as the account identifier in this demo. Must be unique.' }) +
      UI.input({ id: 'u-phone', label: 'Mobile (optional)', value: d.phone, hint: 'Digits, spaces, + ( ) – only.' }) + UI.input({ id: 'u-title', label: 'Job title (optional)', value: d.title }) +
      UI.select({ id: 'u-role', label: 'Role', required: true, placeholder: 'Select a role', value: d.role, disabled: !perm, hint: role ? role.desc : 'Roles are configurable demonstration roles, not an approved role matrix.', options: R.roles.map(function (r) { return { value: r.id, label: r.name + ' · ' + R.WS[r.ws] }; }) }) +
      UI.select({ id: 'u-est', label: 'Establishment', placeholder: 'None', value: d.est, disabled: !perm, hint: 'Required for Hotel Portal roles; not used for government or platform roles.', options: R.ests.map(function (e) { return { value: e.id, label: e.name + ' (' + e.id + ')' }; }) }) +
      UI.select({ id: 'u-status', label: 'Account status', required: true, value: d.status, disabled: !perm, hint: perm ? (edit ? '' : 'New accounts start as Active or Invited (demo).') : 'Changing role, establishment or status requires “User management — administer”.', options: edit ? R.USTATUS : ['Active', 'Invited (demo)'] }) +
      UI.textarea({ id: 'u-notes', label: 'Notes (optional)', value: d.notes, span2: true });
    return UI.pageHead({ crumbs: acrumbs({ label: 'Users', href: '#/admin/users' }, edit ? { label: u.name, href: back } : 'New user', edit ? 'Edit' : 'Create'), title: edit ? 'Edit ' + u.name : 'New user', description: 'Fields marked * are required. No password is set or stored — this prototype has no real authentication.' }) +
      '<div class="stack">' + UI.card({ body: '<form id="user-form" novalidate><div id="form-summary" tabindex="-1"></div><div class="form-section"><h3>Account details</h3><p>Identity and role. Role assignment drives the permissions shown across the three workspaces.</p><div class="form-grid">' + f + '</div></div>' +
        '<div class="form-actions"><a class="btn btn-ghost" href="' + back + '">Cancel</a><button type="submit" class="btn btn-primary">' + (edit ? 'Review changes' : 'Review and create') + '</button></div></form>' }) + '</div>';
  }
  function userFormMount(root, id) {
    var form = root.querySelector('#user-form'); if (!form) return;
    var edit = id !== 'new', u = edit ? R.user(id) : null, roleSel = form.querySelector('#u-role'), estSel = form.querySelector('#u-est'), hint = form.querySelector('#u-role-hint');
    function sync() {
      var r = R.role(roleSel.value); if (hint) { hint.setAttribute('aria-live', 'polite'); hint.textContent = r ? r.desc : 'Roles are configurable demonstration roles, not an approved role matrix.'; }
      if (r && r.ws !== 'hotel' && can('users:admin')) { estSel.value = ''; estSel.disabled = true; } else if (can('users:admin')) estSel.disabled = false;
    }
    roleSel.addEventListener('change', sync); sync();
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var d = { name: v(form, 'u-name'), email: v(form, 'u-email'), phone: v(form, 'u-phone'), title: v(form, 'u-title'), role: roleSel.value, est: estSel.disabled ? '' : estSel.value, status: v(form, 'u-status'), notes: v(form, 'u-notes') };
      if (!can('users:admin') && edit) { d.role = u.role; d.est = u.est || ''; d.status = u.status; }
      var errs = [], r = R.role(d.role);
      if (d.name.length < 2) errs.push({ id: 'u-name', msg: 'Enter the full name (at least 2 characters).' });
      if (!d.email) errs.push({ id: 'u-email', msg: 'Enter an email address.' }); else if (!EMAIL.test(d.email)) errs.push({ id: 'u-email', msg: 'Enter a valid email address.' });
      else if (R.users.some(function (x) { return x.id !== id && x.email.toLowerCase() === d.email.toLowerCase(); })) errs.push({ id: 'u-email', msg: 'Another user already has this email address.' });
      if (d.phone && !PHONE.test(d.phone)) errs.push({ id: 'u-phone', msg: 'Enter a valid phone number or leave it blank.' });
      if (!d.role) errs.push({ id: 'u-role', msg: 'Select a role.' });
      else if (r.ws === 'hotel' && !d.est) errs.push({ id: 'u-est', msg: 'Select the establishment this Hotel Portal user belongs to.' });
      if (edit && u) {
        var wasAdmin = u.role === 'sysadmin' && u.status === 'Active', stillAdmin = d.role === 'sysadmin' && d.status === 'Active';
        if (wasAdmin && !stillAdmin && R.activeAdmins(u.id) === 0) errs.push({ id: d.role !== 'sysadmin' ? 'u-role' : 'u-status', msg: 'At least one active System Administrator must remain.' });
        isActing(u.id).forEach(function (p) {
          if (d.status !== 'Active') errs.push({ id: 'u-status', msg: 'This account is the acting demo user for ' + R.WS[p] + '. Switch the “Acting as” user first.' });
          else if (r && r.ws !== p) errs.push({ id: 'u-role', msg: 'This account is the acting demo user for ' + R.WS[p] + '. Switch the “Acting as” user before moving it to another workspace.' });
        });
      }
      showErrors(form, errs); if (errs.length) return;
      if (!edit) {
        M.modal.confirm({ title: 'Create user?', confirmLabel: 'Create user', body: '<dl class="kv"><dt>Name</dt><dd>' + esc(d.name) + '</dd><dt>Email</dt><dd>' + esc(d.email) + '</dd><dt>Role</dt><dd>' + esc(r.name) + '</dd><dt>Establishment</dt><dd>' + esc(d.est ? R.est(d.est).name : 'Not applicable') + '</dd><dt>Status</dt><dd>' + esc(d.status) + '</dd></dl>' + UI.alert('info', 'Simulated.', 'No invitation email is sent and no password exists.'),
          onConfirm: function () { var n = R.userCreate(d); M.toast.success('User created', n.name + ' · ' + r.name); location.hash = '#/admin/users/' + n.id; } });
        return;
      }
      var rows = []; if (u.name !== d.name) rows.push(['Name', u.name, d.name]); if (u.email !== d.email) rows.push(['Email', u.email, d.email]); if (u.role !== d.role) rows.push(['Role', R.role(u.role).name, r.name]);
      if ((u.est || '') !== d.est) rows.push(['Establishment', u.est ? R.est(u.est).name : '—', d.est ? R.est(d.est).name : '—']); if (u.status !== d.status) rows.push(['Status', u.status, d.status]);
      ['phone', 'title', 'notes'].forEach(function (k) { if ((u[k] || '') !== d[k]) rows.push([k === 'phone' ? 'Mobile' : k === 'title' ? 'Job title' : 'Notes', u[k] || '—', d[k] || '—']); });
      if (!rows.length) { M.toast.info('No changes to save', 'Nothing differs from the saved record.'); location.hash = '#/admin/users/' + id; return; }
      var sensitive = u.role !== d.role || u.status !== d.status || (u.est || '') !== d.est;
      M.modal.confirm({ title: 'Save changes to ' + u.name + '?', confirmLabel: 'Save changes', variant: sensitive ? 'primary' : 'primary', body: changeList(rows) + (sensitive ? UI.alert('warning', 'Access will change.', 'Role, establishment or status changes take effect immediately in the demonstration permissions.') : ''),
        onConfirm: function () { R.userSave(id, d); M.toast.success('User updated', rows.length + (rows.length === 1 ? ' change' : ' changes') + ' saved.'); location.hash = '#/admin/users/' + id; } });
    });
  }
  M.pages['admin/users'] = {
    title: function (c) { if (!c.sub) return 'Users'; if (c.sub === 'new') return 'New user'; var u = R.user(c.sub); return (u ? u.name : 'User') + (c.sub2 === 'edit' ? ' · Edit' : ''); },
    render: function (c) { return !c.sub ? usersList() : c.sub === 'new' ? userForm('new', c.sub2) : c.sub2 === 'edit' ? userForm(c.sub) : userDetail(c.sub); },
    mount: function (root, c) { if (!c.sub) usersMount(root); else if (c.sub === 'new') userFormMount(root, 'new'); else if (c.sub2 === 'edit') userFormMount(root, c.sub); }
  };
  /* account actions (each confirmed) */
  function guardOff(id, label) {
    var u = R.user(id), act = isActing(id);
    if (act.length) { M.toast.warning('Cannot ' + label + ' this account', 'It is the acting demo user for ' + R.WS[act[0]] + '. Switch the “Acting as” user first.'); return true; }
    if (u.role === 'sysadmin' && u.status === 'Active' && R.activeAdmins(id) === 0) { M.toast.warning('Cannot ' + label + ' this account', 'At least one active System Administrator must remain.'); return true; }
    return false;
  }
  M.actions.on('u-suspend', function (el) {
    if (!need('users:admin')) return;
    var id = el.getAttribute('data-id'), u = R.user(id); if (guardOff(id, 'suspend')) return;
    reasonDialog({ title: 'Suspend ' + u.name + '?', body: '<p>The account keeps its role but no permissions apply while it is suspended.</p>', confirm: 'Suspend account', placeholder: 'e.g. Left the establishment', onDone: function (why) { R.userStatus(id, 'Suspended', why); M.rerender(); M.toast.warning('Account suspended', u.name); } });
  });
  M.actions.on('u-reactivate', function (el) {
    if (!need('users:admin')) return;
    var id = el.getAttribute('data-id'), u = R.user(id);
    M.modal.confirm({ title: (u.status === 'Suspended' ? 'Reactivate ' : 'Activate ') + u.name + '?', confirmLabel: u.status === 'Suspended' ? 'Reactivate' : 'Activate', body: '<p>The account becomes Active and the permissions of <strong>' + esc(R.role(u.role).name) + '</strong> apply again (demonstration).</p>', onConfirm: function () { R.userStatus(id, 'Active'); M.rerender(); M.toast.success('Account active', u.name); } });
  });
  M.actions.on('u-unlock', function (el) {
    if (!need('users:admin')) return;
    var id = el.getAttribute('data-id'), u = R.user(id);
    M.modal.confirm({ title: 'Unlock ' + u.name + '?', confirmLabel: 'Unlock account', body: '<p>Clears the (synthetic) lock so the account is Active again.</p>' + UI.alert('info', 'Simulated.', 'No real failed sign-in counter exists.'), onConfirm: function () { R.userStatus(id, 'Active'); M.rerender(); M.toast.success('Account unlocked', u.name); } });
  });
  M.actions.on('u-reset', function (el) {
    if (!need('users:admin')) return;
    var id = el.getAttribute('data-id'), u = R.user(id);
    M.modal.confirm({ title: 'Reset password for ' + u.name + '?', confirmLabel: 'Send reset (simulated)', body: '<p>Records a password-reset request in the audit trail.</p>' + UI.alert('warning', 'Simulated.', 'No password exists in this prototype and no message is sent.'), onConfirm: function () { R.userReset(id); M.rerender(); M.toast.info('Reset recorded (simulated)', 'Nothing was sent to ' + u.name + '.'); } });
  });

  /* ======================================================================
     ROLES & PERMISSIONS
     ====================================================================== */
  function matrix(role, edit) {
    var app = R.applicable(role.ws), locked = role.id === 'sysadmin' ? ['users:admin', 'roles:admin'] : [];
    var head = '<tr><th scope="col">Module</th>' + R.ACTIONS.map(function (a) { return '<th scope="col" class="center">' + a[1] + '</th>'; }).join('') + '</tr>', lastCat = '';
    var body = R.MODULES.map(function (m) {
      var cat = m.cat !== lastCat ? '<tr class="mx-cat"><th scope="rowgroup" colspan="6">' + esc(m.cat) + '</th></tr>' : ''; lastCat = m.cat;
      var applies = m.ws.indexOf(role.ws) > -1;
      return cat + '<tr' + (applies ? '' : ' class="mx-off"') + '><th scope="row"><div class="cell-main">' + esc(m.label) + '</div>' + (applies ? '' : '<div class="cell-sub">Not available in ' + esc(R.WS[role.ws]) + '</div>') + '</th>' + R.ACTIONS.map(function (a) {
        var key = m.id + ':' + a[0], desc = m.actions[a[0]];
        if (!desc) return '<td class="center"><span class="muted" aria-hidden="true">·</span><span class="sr-only">Not defined</span></td>';
        if (!applies) return '<td class="center"><span class="muted" aria-hidden="true">—</span><span class="sr-only">Not available for this workspace</span></td>';
        var on = role.perms.indexOf(key) > -1;
        if (edit) return '<td class="center"><label class="mx-cell" title="' + esc(desc) + '"><input type="checkbox" data-perm="' + key + '"' + (on ? ' checked' : '') + (locked.indexOf(key) > -1 ? ' disabled' : '') + ' aria-label="' + esc(role.name + ': ' + m.label + ' — ' + a[1] + ' (' + desc + ')') + '"></label></td>';
        return '<td class="center" title="' + esc(desc) + '">' + (on ? '<span class="mx-yes">' + icon('check', { size: 16 }) + '</span><span class="sr-only">Granted: ' + esc(desc) + '</span>' : '<span class="muted" aria-hidden="true">–</span><span class="sr-only">Not granted</span>') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="table-wrap"><table class="dt mx"><caption class="sr-only">Permission matrix for ' + esc(role.name) + '</caption><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="hint" style="padding:var(--sp-3) var(--sp-5)">✓ granted · – not granted · — not available in this workspace · · action not defined for the module.' + (edit && locked.length ? ' System Administrator keeps “User management — administer” and “Roles — administer” so the demo cannot lock itself out.' : '') + '</p>';
  }
  function rolesList() {
    var rows = R.roles;
    var ov = '<div class="table-wrap"><table class="dt mx"><caption class="sr-only">Permission overview by role</caption><thead><tr><th scope="col">Module</th>' + rows.map(function (r) { return '<th scope="col" class="center"><a href="#/admin/roles/' + r.id + '">' + esc(r.name) + '</a><div class="cell-sub">' + esc(R.WS[r.ws]) + '</div></th>'; }).join('') + '</tr></thead><tbody>' +
      R.MODULES.map(function (m) { return '<tr><th scope="row"><div class="cell-main">' + esc(m.label) + '</div><div class="cell-sub">' + esc(m.cat) + '</div></th>' + rows.map(function (r) {
        if (m.ws.indexOf(r.ws) < 0) return '<td class="center"><span class="muted" aria-hidden="true">—</span><span class="sr-only">Not available</span></td>';
        var held = R.ACTIONS.filter(function (a) { return r.perms.indexOf(m.id + ':' + a[0]) > -1; });
        return '<td class="center">' + (held.length ? '<span class="mx-letters" aria-label="' + held.map(function (a) { return a[1]; }).join(', ') + '">' + held.map(function (a) { return a[1][0]; }).join(' ') + '</span>' : '<span class="muted" aria-label="No access">–</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="hint" style="padding:var(--sp-3) var(--sp-5)">R = Read · C = Create · E = Edit · A = Approve · D = Administer · – no access · — not available in that workspace.</p>';
    var enf = Object.keys(R.GUARDS).map(function (k) { var p = k.split('/'), it = M.findItem(p[0], p[1]); return '<div class="list-row"><div class="grow"><div class="t">' + esc(it ? it.item.label : k) + '</div><div class="s">' + esc(R.WS[p[0]]) + '</div></div><span class="badge neutral">' + esc(R.permLabel(R.GUARDS[k])) + '</span></div>'; }).join('');
    return UI.pageHead({ crumbs: acrumbs('Roles & Permissions'), title: 'Roles & permissions', description: 'Configurable demonstration roles with least-privilege defaults. Switch the “Acting as” user in the user menu to see screens appear and disappear.',
      actions: gate(can('roles:admin'), { label: 'New demo role', icon: 'plus', variant: 'accent', href: '#/admin/roles/new' }, 'Requires “Roles — administer”') }) +
      '<div class="stack">' + UI.alert('orange', 'Demonstration roles — not an approved role matrix.', 'The final government role matrix is unresolved. Names, permissions and scopes are configurable placeholders. Frontend checks only; production access control must be enforced on the server.') +
      UI.card({ title: 'Role directory', flush: true, body: '<div id="role-table"></div>' }) +
      UI.card({ title: 'Permission overview', subtitle: 'Role-to-permission mapping at a glance', flush: true, body: ov }) +
      UI.card({ title: 'Where enforcement is demonstrated', subtitle: 'Page-level checks driven by the acting user’s role. Other permissions define the matrix but no screen enforces them yet.', flush: true, body: enf }) + '</div>';
  }
  function rolesMount(root) {
    UI.table.mount(root.querySelector('#role-table'), { caption: 'Roles', rows: R.roles.map(function (r) { return { id: r.id, name: r.name, wsLabel: R.WS[r.ws], scope: R.SCOPE[r.ws], users: R.roleUsers(r.id).length, nperm: r.perms.length, napp: R.applicable(r.ws).length, type: r.custom ? 'Custom demo role' : 'Demo role', desc: r.desc }; }),
      pageSize: 10, searchKeys: ['name', 'wsLabel', 'desc'], searchPlaceholder: 'Search roles…', filter: { key: 'wsLabel', label: 'Workspace', options: ['Hotel Portal', 'Government Portal', 'System Administration'] },
      columns: [{ key: 'name', label: 'Role', sortable: true, render: function (r) { return '<a class="cell-main" href="#/admin/roles/' + r.id + '">' + esc(r.name) + '</a><div class="cell-sub">' + esc(r.type) + '</div>'; } }, { key: 'wsLabel', label: 'Workspace', sortable: true }, { key: 'scope', label: 'Scope' },
        { key: 'users', label: 'Users', sortable: true, align: 'right', render: function (r) { return '<span class="num">' + r.users + '</span>'; } }, { key: 'nperm', label: 'Permissions', sortable: true, align: 'right', render: function (r) { return '<span class="num">' + r.nperm + ' of ' + r.napp + '</span>'; } },
        { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'View', size: 'sm', variant: 'ghost', href: '#/admin/roles/' + r.id, aria: 'View role ' + r.name }); } }] });
  }
  function roleDetail(id) {
    var r = R.role(id), back = '#/admin/roles';
    if (!r) return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: back }, 'Not found'), title: 'Role not found' }) + notFound('Role', back, 'Back to roles');
    var us = R.roleUsers(id), canDel = r.custom && !us.length;
    return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: back }, r.name), title: r.name, description: esc(r.desc),
      actions: gate(can('roles:admin'), { label: 'Edit permissions', icon: 'edit', variant: 'primary', href: '#/admin/roles/' + id + '/edit' }, 'Requires “Roles — administer”') + (r.custom ? gate(can('roles:admin') && canDel, { label: 'Delete role', variant: 'ghost', action: 'r-delete', data: { id: id } }, us.length ? 'Reassign its users first' : 'Requires “Roles — administer”') : '') }) +
      '<div class="stack">' + UI.alert('orange', r.custom ? 'Custom demonstration role.' : 'Demonstration role.', 'Configurable placeholder — not officially approved.') +
      '<div class="grid main-side"><div class="stack">' + UI.card({ title: 'Permission matrix', subtitle: r.perms.length + ' of ' + R.applicable(r.ws).length + ' permissions available in ' + R.WS[r.ws] + ' are granted', flush: true, body: matrix(r, false) }) + '</div><div class="stack">' +
      UI.card({ title: 'Overview', body: '<dl class="kv" style="grid-template-columns:110px 1fr"><dt>Workspace</dt><dd>' + esc(R.WS[r.ws]) + '</dd><dt>Scope</dt><dd>' + esc(R.SCOPE[r.ws]) + '</dd><dt>Assigned users</dt><dd>' + us.length + '</dd><dt>Type</dt><dd>' + (r.custom ? 'Custom demo role' : 'Demo role') + '</dd></dl>' }) +
      UI.card({ title: 'Assigned users', flush: true, body: us.length ? us.map(function (u) { return '<div class="list-row"><div class="grow"><a class="t" href="#/admin/users/' + u.id + '">' + esc(u.name) + '</a><div class="s">' + esc(u.est ? R.est(u.est).name : R.WS[r.ws]) + '</div></div>' + ub(u.status) + '</div>'; }).join('') : '<div class="list-row"><div class="grow s">No users hold this role.</div></div>' }) + '</div></div></div>';
  }
  function roleEdit(id) {
    var r = R.role(id), back = '#/admin/roles/' + id;
    if (!r) return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: '#/admin/roles' }, 'Not found'), title: 'Role not found' }) + notFound('Role', '#/admin/roles', 'Back to roles');
    if (!can('roles:admin')) return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: '#/admin/roles' }, r.name, 'Edit'), title: 'Edit ' + r.name }) + UI.alert('warning', 'Not permitted for this demo role.', 'Requires ' + esc(R.permLabel('roles:admin')) + '.');
    var n = R.roleUsers(id).length;
    return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: '#/admin/roles' }, { label: r.name, href: back }, 'Edit permissions'), title: 'Edit permissions · ' + r.name, description: 'Tick the permissions this role should hold. Least privilege: grant only what the role needs.' }) +
      '<div class="stack">' + (n ? UI.alert('warning', n + (n === 1 ? ' user holds' : ' users hold') + ' this role.', 'Changes apply to them immediately in the demonstration.') : '') +
      UI.card({ title: 'Permissions', subtitle: 'Only permissions that exist for ' + R.WS[r.ws] + ' can be granted', flush: true, body: '<form id="role-form" novalidate><div id="form-summary" tabindex="-1" style="padding:0 var(--sp-5)"></div>' + matrix(r, true) +
        '<div class="form-actions" style="padding:var(--sp-4) var(--sp-5)"><span class="muted grow" id="perm-count" aria-live="polite" style="margin-right:auto"></span><a class="btn btn-ghost" href="' + back + '">Cancel</a><button type="submit" class="btn btn-primary">Review changes</button></div></form>' }) + '</div>';
  }
  function roleEditMount(root, id) {
    var form = root.querySelector('#role-form'), r = R.role(id); if (!form || !r) return;
    function cur() { return Array.prototype.map.call(form.querySelectorAll('[data-perm]'), function (c) { return c.checked ? c.getAttribute('data-perm') : null; }).filter(Boolean); }
    function count() { form.querySelector('#perm-count').textContent = cur().length + ' of ' + R.applicable(r.ws).length + ' permissions selected'; }
    form.addEventListener('change', count); count();
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var perms = cur(), all = R.applicable(r.ws), add = perms.filter(function (p) { return r.perms.indexOf(p) < 0; }), rem = r.perms.filter(function (p) { return perms.indexOf(p) < 0; });
      var box = form.querySelector('#form-summary');
      if (perms.length === all.length) { box.innerHTML = UI.alert('danger', 'Least-privilege check failed.', 'No role may hold every permission available in its workspace. Untick at least one.'); M.toast.danger('Not saved', 'A role cannot hold every permission.'); return; }
      if (r.id === 'sysadmin' && (perms.indexOf('users:admin') < 0 || perms.indexOf('roles:admin') < 0)) { box.innerHTML = UI.alert('danger', 'Lock-out protection.', 'System Administrator must keep user and role administration.'); return; }
      box.innerHTML = '';
      if (!add.length && !rem.length) { M.toast.info('No changes to save', 'The permissions are unchanged.'); location.hash = '#/admin/roles/' + id; return; }
      var list = function (a, label) { return a.length ? '<div class="stack" style="gap:2px"><strong>' + label + ' (' + a.length + ')</strong>' + a.map(function (p) { return '<div>' + esc(R.permLabel(p)) + '</div>'; }).join('') + '</div>' : ''; };
      M.modal.confirm({ title: 'Save permissions for ' + r.name + '?', confirmLabel: 'Save permissions', body: '<div class="stack">' + list(add, 'Added') + list(rem, 'Removed') + '</div>' + UI.alert('warning', 'Applies immediately.', R.roleUsers(id).length + ' user(s) hold this role. Demonstration only — not production access control.'),
        onConfirm: function () { R.roleSave(id, perms); M.toast.success('Permissions saved', r.name + ': +' + add.length + ' / −' + rem.length); location.hash = '#/admin/roles/' + id; } });
    });
  }
  function roleNew() {
    if (!can('roles:admin')) return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: '#/admin/roles' }, 'New role'), title: 'New demo role' }) + UI.alert('warning', 'Not permitted for this demo role.', 'Requires ' + esc(R.permLabel('roles:admin')) + '.');
    return UI.pageHead({ crumbs: acrumbs({ label: 'Roles & Permissions', href: '#/admin/roles' }, 'New role'), title: 'New demo role', description: 'Creates a configurable demonstration role, then opens the permission editor.' }) + '<div class="stack">' +
      UI.card({ body: '<form id="role-new" novalidate><div id="form-summary" tabindex="-1"></div><div class="form-grid">' + UI.input({ id: 'rn-name', label: 'Role name', required: true }) +
        UI.select({ id: 'rn-ws', label: 'Workspace', required: true, placeholder: 'Select a workspace', options: [{ value: 'hotel', label: 'Hotel Portal' }, { value: 'gov', label: 'Government Portal' }, { value: 'admin', label: 'System Administration' }] }) +
        UI.textarea({ id: 'rn-desc', label: 'Description', span2: true }) + UI.select({ id: 'rn-clone', label: 'Start from an existing role (optional)', placeholder: 'Start empty (recommended)', hint: 'Only permissions valid for the chosen workspace are copied.', options: R.roles.map(function (r) { return { value: r.id, label: r.name }; }) }) +
        '</div><div class="form-actions"><a class="btn btn-ghost" href="#/admin/roles">Cancel</a><button type="submit" class="btn btn-primary">Create role</button></div></form>' }) + '</div>';
  }
  function roleNewMount(root) {
    var form = root.querySelector('#role-new'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var name = v(form, 'rn-name'), ws = v(form, 'rn-ws'), errs = [];
      if (name.length < 3) errs.push({ id: 'rn-name', msg: 'Enter a role name (at least 3 characters).' }); else if (R.roles.some(function (r) { return r.name.toLowerCase() === name.toLowerCase(); })) errs.push({ id: 'rn-name', msg: 'A role with this name already exists.' });
      if (!ws) errs.push({ id: 'rn-ws', msg: 'Select a workspace.' });
      showErrors(form, errs); if (errs.length) return;
      var r = R.roleCreate(name, ws, v(form, 'rn-desc') || 'Custom demonstration role.', v(form, 'rn-clone')); M.toast.success('Role created', r.name + ' — now choose its permissions.'); location.hash = '#/admin/roles/' + r.id + '/edit';
    });
  }
  M.actions.on('r-delete', function (el) {
    if (!need('roles:admin')) return;
    var id = el.getAttribute('data-id'), r = R.role(id);
    M.modal.confirm({ title: 'Delete role “' + r.name + '”?', confirmLabel: 'Delete role', variant: 'danger', body: '<p>This removes the demonstration role. No users hold it.</p>', onConfirm: function () { R.roleDelete(id); M.toast.warning('Role deleted', r.name); location.hash = '#/admin/roles'; } });
  });
  M.pages['admin/roles'] = {
    title: function (c) { if (!c.sub) return 'Roles & Permissions'; if (c.sub === 'new') return 'New demo role'; var r = R.role(c.sub); return (r ? r.name : 'Role') + (c.sub2 === 'edit' ? ' · Edit permissions' : ''); },
    render: function (c) { return !c.sub ? rolesList() : c.sub === 'new' ? roleNew() : c.sub2 === 'edit' ? roleEdit(c.sub) : roleDetail(c.sub); },
    mount: function (root, c) { if (!c.sub) rolesMount(root); else if (c.sub === 'new') roleNewMount(root); else if (c.sub2 === 'edit') roleEditMount(root, c.sub); }
  };

  /* ======================================================================
     ESTABLISHMENT ADMINISTRATION
     ====================================================================== */
  function estList() {
    var E = R.estView(), n = function (s) { return E.filter(function (e) { return e.status === s; }).length; }, avg = Math.round(E.reduce(function (t, e) { return t + e.pct; }, 0) / E.length);
    return UI.pageHead({ crumbs: acrumbs('Establishments'), title: 'Establishment administration', description: 'Central directory of synthetic establishments. Edits here appear in the Hotel Portal profile and the Government Portal directory. No licence, registration or government decision is implied.',
      actions: UI.button({ label: 'Onboarding queue', icon: 'clock', variant: 'secondary', href: '#/admin/dashboard' }) }) +
      '<div class="stack">' + note('Pilot (~20) and national (~1,500) figures are planning context only. These are not onboarded sites. Demo Hotel A (PIL-001) is live from the Hotel Portal state.') +
      '<div class="grid cols-4">' + [{ label: 'Establishments', value: E.length, icon: 'building', foot: 'in the directory' }, { label: 'Active', value: n('Active'), icon: 'activity', tone: 'green', foot: 'operational status' }, { label: 'Onboarding', value: n('Onboarding'), icon: 'clock', tone: 'orange', foot: 'not yet operational' }, { label: 'Avg. profile completeness', value: avg + '%', icon: 'clipboard', foot: '8 profile fields' }].map(UI.statCard).join('') + '</div>' +
      UI.card({ flush: true, body: '<div id="est-admin-table"></div>' }) + '</div>';
  }
  function estMount(root) {
    var all = R.estView(), ctl;
    var extra = selOpts('ef-cat', 'Category', M.ops.names('estcats', true)) + selOpts('ef-loc', 'Location', M.ops.names('divisions', true)) + selOpts('ef-pms', 'PMS', R.PMS);
    ctl = UI.table.mount(root.querySelector('#est-admin-table'), { caption: 'Establishments', rows: all, pageSize: 8, searchKeys: ['name', 'id', 'loc', 'cat', 'contact', 'email'], searchPlaceholder: 'Search name, reference, location, contact…',
      filter: { key: 'status', label: 'Operational status', options: R.STATUS }, toolbarExtra: extra, emptyText: 'No establishments match the current search and filters.',
      columns: [{ key: 'name', label: 'Establishment', sortable: true, render: function (r) { return '<a class="cell-main" href="#/admin/establishments/' + r.id + '">' + esc(r.name) + '</a><div class="cell-sub">' + esc(r.id) + ' · ' + esc(r.cat) + '</div>'; } },
        { key: 'loc', label: 'Location', sortable: true }, { key: 'status', label: 'Operational', sortable: true, render: function (r) { return eb(r.status); } }, { key: 'onb', label: 'Onboarding', render: function (r) { return ob(r.onb); } },
        { key: 'pms', label: 'PMS', render: function (r) { return pmsb(r.pms); } }, { key: 'pct', label: 'Profile', sortable: true, render: function (r) { return bar(r.pct); } },
        { key: 'users', label: 'Users', sortable: true, align: 'right', render: function (r) { return '<span class="num">' + r.users + '</span>'; } },
        { key: 'a', label: '', align: 'right', render: function (r) { return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + UI.button({ label: 'View', size: 'sm', variant: 'ghost', href: '#/admin/establishments/' + r.id, aria: 'View ' + r.name }) + (can('establishments:edit') ? UI.button({ label: 'Edit', size: 'sm', variant: 'secondary', href: '#/admin/establishments/' + r.id + '/edit', aria: 'Edit ' + r.name }) : '') + '</div>'; } }] });
    function apply() { var c = root.querySelector('#ef-cat').value, l = root.querySelector('#ef-loc').value, p = root.querySelector('#ef-pms').value; ctl.setRows(all.filter(function (r) { return (!c || r.cat === c) && (!l || r.loc === l) && (!p || r.pms === p); })); }
    ['ef-cat', 'ef-loc', 'ef-pms'].forEach(function (i) { root.querySelector('#' + i).addEventListener('change', apply); });
  }
  function estDetail(id) {
    var e = R.estViewOne(id), back = '#/admin/establishments';
    if (!e) return UI.pageHead({ crumbs: acrumbs({ label: 'Establishments', href: back }, 'Not found'), title: 'Establishment not found' }) + notFound('Establishment', back, 'Back to establishments');
    var us = R.estUsers(id);
    return UI.pageHead({ crumbs: acrumbs({ label: 'Establishments', href: back }, e.name), title: e.name, description: esc(e.id) + ' · ' + esc(e.cat) + ' · ' + esc(e.loc),
      actions: gate(can('establishments:edit'), { label: 'Edit establishment', icon: 'edit', variant: 'primary', href: '#/admin/establishments/' + id + '/edit' }, 'Requires “Establishment administration — edit”') + (id === 'PIL-001' ? UI.button({ label: 'Hotel Portal profile', variant: 'secondary', href: '#/hotel/profile' }) : '') }) +
      '<div class="stack">' + (e.sample ? UI.alert('info', 'Sample figures.', 'Reporting activity for this establishment is synthetic.') : UI.alert('info', 'Live from shared demo state.', 'Reporting activity comes from the Hotel Portal records.')) +
      '<div class="grid main-side"><div class="stack">' +
      UI.card({ title: 'Profile', body: '<dl class="kv"><dt>Name</dt><dd>' + esc(e.name) + '</dd><dt>Reference</dt><dd class="mono">' + esc(e.id) + '</dd><dt>Category</dt><dd>' + esc(e.cat) + '</dd><dt>Location</dt><dd>' + esc(e.loc) + '</dd><dt>Address</dt><dd>' + esc(e.address || '—') + '</dd><dt>Contact person</dt><dd>' + esc(e.contact || '—') + '</dd><dt>Phone</dt><dd>' + esc(e.phone || '—') + '</dd><dt>Email</dt><dd>' + esc(e.email || '—') + '</dd><dt>Notes</dt><dd>' + esc(e.notes || '—') + '</dd></dl>' }) +
      UI.card({ title: 'Reporting activity', subtitle: e.sample ? 'Synthetic sample' : 'Live from the Hotel Portal state', body: '<dl class="kv"><dt>Registrations today</dt><dd>' + e.reg + '</dd><dt>Arrivals / departures</dt><dd>' + e.arr + ' / ' + e.dep + '</dd><dt>Pending / failed</dt><dd>' + e.pend + ' / ' + e.fail + '</dd><dt>Data-quality issues</dt><dd>' + e.qual + '</dd><dt>Last report</dt><dd>' + esc(e.last) + '</dd></dl>' }) +
      UI.card({ title: 'Associated users', subtitle: us.length + (us.length === 1 ? ' account' : ' accounts') + ' linked to this establishment', flush: true, actions: gate(can('users:create'), { label: 'Add user', size: 'sm', icon: 'user-plus', variant: 'secondary', href: '#/admin/users/new/' + id }, 'Requires “User management — create”'),
        body: us.length ? us.map(function (u) { var r = R.role(u.role); return '<div class="list-row"><div class="grow"><a class="t" href="#/admin/users/' + u.id + '">' + esc(u.name) + '</a><div class="s">' + esc(r ? r.name : '—') + ' · ' + esc(R.rel(u.lastTs)) + '</div></div>' + ub(u.status) + '</div>'; }).join('') : '<div class="list-row"><div class="grow s">No users are linked to this establishment yet.</div></div>' }) +
      '</div><div class="stack">' +
      UI.card({ title: 'Status', body: '<dl class="kv" style="grid-template-columns:110px 1fr"><dt>Operational</dt><dd>' + eb(e.status) + '</dd><dt>Onboarding</dt><dd>' + ob(e.onb) + '</dd><dt>PMS / integration</dt><dd>' + pmsb(e.pms) + '</dd></dl><div class="hint" style="margin-top:var(--sp-3)">Demonstration statuses only — not a licence, approval or government decision. Integration is simulated.</div>' }) +
      UI.card({ title: 'Profile completeness', body: bar(e.pct) + (e.missing.length ? '<p class="hint" style="margin-top:var(--sp-3)">Missing: ' + esc(e.missing.join(', ')) + '</p>' : '<p class="hint" style="margin-top:var(--sp-3)">All 8 profile fields are filled.</p>') }) +
      '</div></div></div>';
  }
  function estForm(id) {
    var e = R.est(id), back = '#/admin/establishments/' + id;
    if (!e) return UI.pageHead({ crumbs: acrumbs({ label: 'Establishments', href: '#/admin/establishments' }, 'Not found'), title: 'Establishment not found' }) + notFound('Establishment', '#/admin/establishments', 'Back to establishments');
    if (!can('establishments:edit')) return UI.pageHead({ crumbs: acrumbs({ label: 'Establishments', href: '#/admin/establishments' }, e.name, 'Edit'), title: 'Edit ' + e.name }) + UI.alert('warning', 'Not permitted for this demo role.', 'Requires ' + esc(R.permLabel('establishments:edit')) + '.');
    var adm = can('establishments:admin'), live = id === 'PIL-001';
    var f = UI.input({ id: 'e-name', label: 'Establishment name', required: true, value: e.name }) + UI.input({ id: 'e-ref', label: 'Reference', value: e.id, disabled: true, hint: 'Fixed once created.' }) +
      UI.select({ id: 'e-cat', label: 'Category', required: true, value: e.cat, options: M.ops.opts('estcats', e.cat) }) + UI.select({ id: 'e-loc', label: 'Location (region)', required: true, value: e.loc, options: M.ops.opts('divisions', e.loc) }) +
      UI.input({ id: 'e-address', label: 'Address', value: e.address, span2: true }) + UI.input({ id: 'e-contact', label: 'Contact person', value: e.contact }) + UI.input({ id: 'e-phone', label: 'Phone', value: e.phone, hint: 'Synthetic placeholder numbers only.' }) +
      UI.input({ id: 'e-email', label: 'Contact email', type: 'email', value: e.email }) +
      UI.select({ id: 'e-pms', label: 'PMS / integration', value: e.pms, options: R.PMS, hint: 'Simulated — no real PMS connector exists.' }) +
      UI.select({ id: 'e-status', label: 'Operational status', required: true, value: e.status, options: R.STATUS, disabled: !adm || live, hint: live ? 'Locked: Demo Hotel A is the live demo establishment.' : adm ? 'Active requires onboarding to be complete (demo rule).' : 'Requires “Establishment administration — administer”.' }) +
      UI.select({ id: 'e-onb', label: 'Onboarding status', required: true, value: e.onb, options: R.ONB, disabled: !adm || live }) + UI.textarea({ id: 'e-notes', label: 'Notes (optional)', value: e.notes, span2: true });
    return UI.pageHead({ crumbs: acrumbs({ label: 'Establishments', href: '#/admin/establishments' }, { label: e.name, href: back }, 'Edit'), title: 'Edit ' + e.name, description: 'Changes appear in the Hotel Portal profile and Government Portal directory. Statuses are demonstration values.' }) +
      '<div class="stack">' + UI.card({ body: '<form id="est-form" novalidate><div id="form-summary" tabindex="-1"></div><div class="form-section"><h3>Establishment record</h3><p>Fields marked * are required.</p><div class="form-grid">' + f + '</div></div><div class="form-actions"><a class="btn btn-ghost" href="' + back + '">Cancel</a><button type="submit" class="btn btn-primary">Review changes</button></div></form>' }) + '</div>';
  }
  var LBL = { name: 'Name', cat: 'Category', loc: 'Location', address: 'Address', contact: 'Contact person', phone: 'Phone', email: 'Email', pms: 'PMS / integration', status: 'Operational status', onb: 'Onboarding', notes: 'Notes' };
  function estFormMount(root, id) {
    var form = root.querySelector('#est-form'), e = R.est(id); if (!form || !e) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); var adm = can('establishments:admin') && id !== 'PIL-001';
      var d = { name: v(form, 'e-name'), cat: v(form, 'e-cat'), loc: v(form, 'e-loc'), address: v(form, 'e-address'), contact: v(form, 'e-contact'), phone: v(form, 'e-phone'), email: v(form, 'e-email'), pms: v(form, 'e-pms'), status: adm ? v(form, 'e-status') : e.status, onb: adm ? v(form, 'e-onb') : e.onb, notes: v(form, 'e-notes') }, errs = [];
      if (d.name.length < 3) errs.push({ id: 'e-name', msg: 'Enter the establishment name (at least 3 characters).' }); else if (R.ests.some(function (x) { return x.id !== id && x.name.toLowerCase() === d.name.toLowerCase(); })) errs.push({ id: 'e-name', msg: 'Another establishment already uses this name.' });
      if (!d.cat) errs.push({ id: 'e-cat', msg: 'Select a category.' }); if (!d.loc) errs.push({ id: 'e-loc', msg: 'Select a location.' });
      if (d.email && !EMAIL.test(d.email)) errs.push({ id: 'e-email', msg: 'Enter a valid email address or leave it blank.' }); if (d.phone && !PHONE.test(d.phone)) errs.push({ id: 'e-phone', msg: 'Enter a valid phone number or leave it blank.' });
      if (d.status === 'Active' && d.onb !== 'Onboarding complete (demo)') errs.push({ id: 'e-status', msg: 'Operational status cannot be Active until onboarding is complete (demo rule).' });
      showErrors(form, errs); if (errs.length) return;
      var rows = []; Object.keys(LBL).forEach(function (k) { if (String(e[k] || '') !== String(d[k] || '')) rows.push([LBL[k], e[k] || '—', d[k] || '—']); });
      if (!rows.length) { M.toast.info('No changes to save', 'Nothing differs from the saved record.'); location.hash = '#/admin/establishments/' + id; return; }
      var st = d.status !== e.status || d.onb !== e.onb;
      M.modal.confirm({ title: 'Save changes to ' + e.name + '?', confirmLabel: 'Save changes', body: changeList(rows) + (st ? UI.alert('warning', 'Status change.', 'Operational and onboarding statuses feed the Government Portal counts. These are demonstration values, not government decisions.') : '') + UI.alert('info', 'Shared data.', 'The Hotel Portal profile and Government Portal directory will show these values.'),
        onConfirm: function () { R.estSave(id, d); M.toast.success('Establishment updated', rows.length + (rows.length === 1 ? ' change' : ' changes') + ' saved.'); location.hash = '#/admin/establishments/' + id; } });
    });
  }
  M.pages['admin/establishments'] = {
    title: function (c) { if (!c.sub) return 'Establishment Administration'; var e = R.est(c.sub); return (e ? e.name : 'Establishment') + (c.sub2 === 'edit' ? ' · Edit' : ''); },
    render: function (c) { return !c.sub ? estList() : c.sub2 === 'edit' ? estForm(c.sub) : estDetail(c.sub); },
    mount: function (root, c) { if (!c.sub) estMount(root); else if (c.sub2 === 'edit') estFormMount(root, c.sub); }
  };

  /* ======================================================================
     HOTEL PORTAL — establishment profile & staff (scoped to the acting user's establishment)
     ====================================================================== */
  function hcrumbs(l) { return [{ label: 'Hotel Portal', href: '#/hotel/dashboard' }, { label: l }]; }
  function myEst() { var u = R.me('hotel'); return (u && R.est(u.est)) || R.est('PIL-001'); }
  M.pages['hotel/profile'] = {
    title: 'Establishment Profile',
    render: function () {
      var m = myEst(), e = R.estViewOne(m.id), edit = can('profile:edit', 'hotel');
      return UI.pageHead({ crumbs: hcrumbs('Establishment Profile'), title: e.name, description: esc(e.id) + ' · ' + esc(e.cat) + ' · ' + esc(e.loc),
        actions: gate(edit, { label: 'Edit contact details', icon: 'edit', variant: 'primary', action: 'h-prof-edit' }, 'Requires “Own establishment profile — edit” (Establishment Manager)') }) +
        '<div class="stack">' + UI.alert('info', 'Demonstration data.', 'Name, reference, category, location and statuses are managed in System Administration. Contact details can be edited by roles holding the profile-edit permission. Statuses are demonstration values — not a licence or government decision.') +
        '<div class="grid main-side"><div class="stack">' +
        UI.card({ title: 'Contact & location', body: '<dl class="kv"><dt>Name</dt><dd>' + esc(e.name) + '</dd><dt>Reference</dt><dd class="mono">' + esc(e.id) + '</dd><dt>Category</dt><dd>' + esc(e.cat) + '</dd><dt>Location</dt><dd>' + esc(e.loc) + '</dd><dt>Address</dt><dd>' + esc(e.address || '—') + '</dd><dt>Contact person</dt><dd>' + esc(e.contact || '—') + '</dd><dt>Phone</dt><dd>' + esc(e.phone || '—') + '</dd><dt>Email</dt><dd>' + esc(e.email || '—') + '</dd></dl>' }) +
        '</div><div class="stack">' + UI.card({ title: 'Status', body: '<dl class="kv" style="grid-template-columns:110px 1fr"><dt>Operational</dt><dd>' + eb(e.status) + '</dd><dt>Onboarding</dt><dd>' + ob(e.onb) + '</dd><dt>PMS / integration</dt><dd>' + pmsb(e.pms) + '</dd></dl>' }) +
        UI.card({ title: 'Profile completeness', body: bar(e.pct) + (e.missing.length ? '<p class="hint" style="margin-top:var(--sp-3)">Missing: ' + esc(e.missing.join(', ')) + '</p>' : '') }) + '</div></div></div>';
    }
  };
  M.actions.on('h-prof-edit', function () {
    var e = myEst(); if (!can('profile:edit', 'hotel')) return;
    M.modal.open({ title: 'Edit contact details', body: '<form id="hp-form" novalidate class="form-grid">' + UI.input({ id: 'hp-contact', label: 'Contact person', value: e.contact }) + UI.input({ id: 'hp-phone', label: 'Phone', value: e.phone }) + UI.input({ id: 'hp-email', label: 'Contact email', type: 'email', value: e.email }) + UI.input({ id: 'hp-address', label: 'Address', value: e.address }) + '</form>',
      actions: [{ label: 'Cancel' }, { label: 'Save contact details', variant: 'primary', onClick: function (wrap) {
        var form = wrap.querySelector('#hp-form'), d = { contact: v(form, 'hp-contact'), phone: v(form, 'hp-phone'), email: v(form, 'hp-email'), address: v(form, 'hp-address') }, errs = [];
        if (d.email && !EMAIL.test(d.email)) errs.push({ id: 'hp-email', msg: 'Enter a valid email address or leave it blank.' }); if (d.phone && !PHONE.test(d.phone)) errs.push({ id: 'hp-phone', msg: 'Enter a valid phone number or leave it blank.' });
        form.querySelectorAll('.error-text').forEach(function (n) { n.remove(); }); errs.forEach(function (x) { setErr(form, x.id, x.msg); }); if (errs.length) { form.querySelector('#' + errs[0].id).focus(); return false; }
        var ch = R.estSave(e.id, d, 'hotel'); M.rerender(); M.toast.success(ch.length ? 'Contact details saved' : 'No changes', ch.length ? 'Visible in Administration and the Government Portal.' : 'Nothing differs from the saved record.');
      } }] });
  });
  M.pages['hotel/staff'] = {
    title: 'Staff & Users',
    render: function () {
      var e = myEst(), us = R.estUsers(e.id);
      return UI.pageHead({ crumbs: hcrumbs('Staff & Users'), title: 'Staff & users', description: 'Accounts linked to ' + esc(e.name) + '. Read-only here; accounts are created and managed by System Administration.' }) +
        '<div class="stack">' + UI.alert('info', 'Demonstration data.', 'No real sign-in exists. Roles and statuses come from the shared user directory.') + UI.card({ flush: true, body: '<div id="staff-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      var e = myEst();
      UI.table.mount(root.querySelector('#staff-table'), { caption: 'Staff', rows: R.estUsers(e.id).map(function (u) { return { id: u.id, name: u.name, email: u.email, roleName: (R.role(u.role) || {}).name || '—', status: u.status, lastTs: u.lastTs || 0, last: R.rel(u.lastTs) }; }), pageSize: 8,
        searchKeys: ['name', 'email', 'roleName'], searchPlaceholder: 'Search staff…', filter: { key: 'status', label: 'Status', options: R.USTATUS },
        columns: [{ key: 'name', label: 'Staff member', sortable: true, render: function (r) { return '<div class="cell-person">' + UI.avatar(R.initials(r.name), { sm: true }) + '<div><div class="cell-main">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.email) + '</div></div></div>'; } },
          { key: 'roleName', label: 'Role', sortable: true }, { key: 'status', label: 'Status', sortable: true, render: function (r) { return ub(r.status); } }, { key: 'lastTs', label: 'Last activity', sortable: true, render: function (r) { return esc(r.last); } }] });
    }
  };
})(window);
