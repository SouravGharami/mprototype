/* Msafiri — dashboards for the three portals (synthetic data). */
(function (global) {
  'use strict';
  var M = global.Msafiri, UI = M.UI, esc = M.esc, icon = M.icon, D = M.demo;

  function today() { return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function greeting() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function person(name, sub) {
    var ini = name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');
    return '<div class="cell-person">' + UI.avatar(ini, { sm: true }) + '<div><div class="cell-main">' + esc(name) + '</div><div class="cell-sub">' + esc(sub) + '</div></div></div>';
  }
  function simBanner(text) { return UI.alert('info', 'Prototype data.', esc(text)); }

  /* ================= HOTEL ================= */
  M.pages['hotel/dashboard'] = {
    render: function (ctx) {
      var h = D.hotel;
      return UI.pageHead({
        title: greeting() + ', ' + ctx.user.name.split(' ')[0],
        description: esc(ctx.user.org) + ' · ' + today(),
        actions: UI.button({ label: 'Export summary', icon: 'download', variant: 'secondary', action: 'unavailable', data: { label: 'Export' } }) +
                 UI.button({ label: 'New registration', icon: 'user-plus', variant: 'accent', href: '#/hotel/new-registration' })
      }) +
      '<div class="stack">' +
      simBanner('Submission statuses are simulated. Nothing on this screen is sent to, or acknowledged by, a real government system, and no PMS is connected.') +
      '<div class="grid cols-4">' + M.store.cards().map(UI.statCard).join('') + '</div>' +
      '<div class="grid main-side"><div class="stack">' +
        UI.card({ title: 'Registrations this week', subtitle: 'Registered vs. submitted', body: M.barChart({ width: 640, labels: h.week.labels, ariaLabel: 'Registrations registered and submitted per day this week', series: [
          { name: 'Registered', values: h.week.registered, color: 'var(--chart-1)' }, { name: 'Submitted (simulated)', values: h.week.submitted, color: 'var(--chart-2)' }] }) }) +
        UI.card({ title: 'Expected arrivals today', subtitle: M.store.rows().length + ' records · from shared demo state', flush: true, body: '<div id="arrivals-table"></div>' }) +
      '</div><div class="stack">' +
        UI.card({ title: 'Submission status', subtitle: 'Registrations that have a simulated submission status (expected arrivals not yet submitted are not counted)', body: M.donutChart({ segments: M.store.segments(), centerLabel: 'Registrations', ariaLabel: 'Registrations by submission status' }) }) +
        UI.card({ title: 'Needs attention', flush: true, body: M.store.attention().map(function (a) {
          return '<div class="list-row"><div class="grow"><div class="t">' + esc(a.t) + '</div><div class="s">' + esc(a.s) + '</div></div>' + UI.badge(a.tag, a.tone) + '</div>';
        }).join(''), foot: '<a href="#/hotel/submissions">Open submission history</a>' }) +
        UI.card({ title: 'Recent guest activity', flush: true, body: M.store.recent() }) +
        UI.card({ title: 'Connections & mode', subtitle: 'What is real in this prototype', body: '<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow t">Connection</div>' + UI.badge(M.store.offline ? 'Offline (simulated)' : 'Online (simulated)', M.store.offline ? 'warning' : 'success') + '</div><div class="list-row" style="padding-left:0;padding-right:0"><div class="grow t">Offline queue</div><span class="num">' + M.store.queue().length + '</span></div>' + D.integrations.map(function (i) { return '<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow t">' + esc(i.name) + '</div>' + UI.statusBadge(i.mode) + '</div>'; }).join('') + '<div class="hint mt-5">Manual entry fallback is always available.</div>', foot: '<a href="#/hotel/pms">PMS connection & fallback (planned module)</a>' }) +
        UI.card({ title: 'Quick actions', body: '<div class="qa-grid">' + [
          ['user-plus', 'New registration', 'Start a guest registration', '#/hotel/new-registration'],
          ['send', 'Submission status', 'Track simulated status', '#/hotel/submissions'],
          ['bed', 'In-house guests', 'See who is staying', '#/hotel/in-house'],
          ['refresh', 'Offline queue', 'Records awaiting sync', '#/hotel/offline-queue']
        ].map(function (q) { return '<a class="qa" href="' + q[3] + '">' + icon(q[0]) + q[1] + '<small>' + q[2] + '</small></a>'; }).join('') + '</div>' }) +
      '</div></div></div>';
    },
    mount: function (root) {
      UI.table.mount(root.querySelector('#arrivals-table'), {
        caption: 'Expected arrivals today',
        rows: M.store.rows(), pageSize: 5, searchKeys: ['guest', 'ref', 'nat', 'room'], searchPlaceholder: 'Search guest, reference or room…',
        filter: { key: 'status', label: 'Status', options: ['Acknowledged', 'Submitted', 'Pending', 'Queued offline', 'Conflict', 'Draft', 'Expected', 'Rejected'] },
        columns: [
          { key: 'guest', label: 'Guest', sortable: true, render: function (r) { return person(r.guest, r.ref); } },
          { key: 'nat', label: 'Nationality', sortable: true },
          { key: 'room', label: 'Room', sortable: true },
          { key: 'eta', label: 'ETA', sortable: true },
          { key: 'status', label: 'Status', sortable: true, render: function (r) { return UI.statusBadge(r.status); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'View', size: 'sm', variant: 'ghost', action: 'hotel-view-reg', data: { ref: r.ref } }); } }
        ]
      });
    }
  };
  M.actions.on('hotel-view-reg', function (el) {
    var r = D.hotel.arrivals.filter(function (x) { return x.ref === el.getAttribute('data-ref'); })[0];
    if (!r) return;
    M.modal.open({
      title: 'Registration ' + r.ref,
      body: UI.alert('info', 'Preview only.', 'The full registration screen is a planned module. This summary shows synthetic data.') +
        '<dl class="kv"><dt>Guest</dt><dd>' + esc(r.guest) + '</dd><dt>Nationality</dt><dd>' + esc(r.nat) + '</dd><dt>Room</dt><dd>' + esc(r.room) + '</dd><dt>Expected arrival</dt><dd>' + esc(r.eta) + '</dd><dt>Nights</dt><dd>' + r.nights + '</dd><dt>Status</dt><dd>' + UI.statusBadge(r.status) + '</dd></dl>',
      actions: [{ label: 'Close' }, { label: 'Open registration', variant: 'primary', onClick: function () { location.hash = '#/hotel/registrations'; } }]
    });
  });

  /* ================= GOVERNMENT ================= */
  var govRange = 14;
  function govChart() {
    var n = govRange, g = D.gov;
    return M.lineChart({ area: true, labels: g.days.slice(-n), ariaLabel: 'National registrations per day, last ' + n + ' days (synthetic)', series: [{ name: 'Registrations', values: g.daily.slice(-n), color: 'var(--chart-1)' }] });
  }
  M.pages['gov/dashboard'] = {
    title: 'National Dashboard',
    render: function (ctx) {
      var g = D.gov;
      return UI.pageHead({
        title: greeting() + ', ' + ctx.user.name.split(' ')[0],
        description: esc(ctx.user.org) + ' · ' + today(),
        actions: UI.button({ label: 'Export snapshot', icon: 'download', variant: 'secondary', action: 'unavailable', data: { label: 'Export' } }) +
                 UI.button({ label: 'Data-quality monitor', icon: 'flag', variant: 'accent', href: '#/gov/submission-quality' })
      }) +
      '<div class="stack">' +
      simBanner('All figures are synthetic. Pilot of ~20 hotels and national rollout of ~1,500 establishments are planning context only; no live establishments, registrations or integrations are represented. Guest-identifying data is masked by default in this workspace.') +
      '<div class="grid cols-4">' + g.stats.map(UI.statCard).join('') + '</div>' +
      '<div class="grid main-side"><div class="stack">' +
        UI.card({ title: 'Registrations per day', subtitle: 'National total (synthetic)', actions:
          '<div class="segmented" role="group" aria-label="Date range">' + [[7, '7 days'], [14, '14 days']].map(function (r) {
            return '<button type="button" data-action="gov-range" data-n="' + r[0] + '" aria-pressed="' + (r[0] === govRange) + '">' + r[1] + '</button>'; }).join('') + '</div>',
          body: '<div id="gov-chart">' + govChart() + '</div>' }) +
        UI.card({ title: 'Establishments needing follow-up', subtitle: 'Overdue or at risk against a configurable demo threshold (not a URS rule)', flush: true, body: '<div id="overdue-table"></div>' }) +
      '</div><div class="stack">' +
        UI.card({ title: 'Guests by region of origin', subtitle: 'Today', body: M.donutChart({ segments: g.origin, centerLabel: 'Guests', ariaLabel: 'Guests by region of origin' }) }) +
        UI.card({ title: 'Registrations by region', subtitle: 'Establishment location, today', body: M.hBars({ rows: g.regions, color: 'var(--chart-2)' }) }) +
      '</div></div></div>';
    },
    mount: function (root) {
      UI.table.mount(root.querySelector('#overdue-table'), {
        caption: 'Establishments needing follow-up', rows: D.gov.overdue, pageSize: 5, searchKeys: ['name', 'id', 'region'], searchPlaceholder: 'Search establishment…',
        filter: { key: 'status', label: 'Status', options: ['Overdue', 'At risk'] },
        columns: [
          { key: 'name', label: 'Establishment', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.id) + '</div>'; } },
          { key: 'region', label: 'Region', sortable: true },
          { key: 'pending', label: 'Pending', sortable: true, align: 'right', render: function (r) { return '<span class="num">' + r.pending + '</span>'; } },
          { key: 'status', label: 'Status', sortable: true, render: function (r) { return UI.statusBadge(r.status); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'Follow up', size: 'sm', variant: 'secondary', action: 'gov-follow', data: { id: r.id } }); } }
        ]
      });
    }
  };
  M.actions.on('gov-range', function (el) {
    govRange = +el.getAttribute('data-n');
    document.querySelectorAll('[data-action="gov-range"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); });
    document.getElementById('gov-chart').innerHTML = govChart();
  });
  M.actions.on('gov-follow', function (el) {
    var r = D.gov.overdue.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
    M.modal.confirm({
      title: 'Record follow-up for ' + r.name + '?',
      body: '<p>This logs a follow-up note for <strong>' + esc(r.name) + '</strong> (' + esc(r.id) + ') with ' + r.pending + ' pending registrations.</p>' + UI.alert('warning', 'Simulated.', 'No message is sent to the establishment in this prototype.'),
      confirmLabel: 'Record follow-up', variant: 'primary',
      onConfirm: function () { M.toast.success('Follow-up recorded (simulated)', r.name + ' — nothing was sent.'); }
    });
  });

  /* ================= ADMIN ================= */
  var queueSeed = JSON.stringify(D.admin.queue), queueCtl = null;
  M.resetHandlers = M.resetHandlers || [];
  M.resetHandlers.push(function () { D.admin.queue = JSON.parse(queueSeed); syncQueueCount(); });
  function syncQueueCount() {
    var f = M.findItem('admin', 'establishments'); if (f) f.item.count = D.admin.queue.length;
  }
  function refreshQueueUI() {
    syncQueueCount();
    if (queueCtl) queueCtl.setRows(D.admin.queue);
    var v = document.getElementById('admin-pending-value'); if (v) v.textContent = D.admin.queue.length;
    var c = document.getElementById('queue-count'); if (c) c.textContent = D.admin.queue.length + ' awaiting review';
    if (M.refreshSidebar) M.refreshSidebar();
  }
  M.pages['admin/dashboard'] = {
    render: function (ctx) {
      var a = D.admin;
      var stats = M.dir.adminStats(a.stats).map(function (s, i) {
        if (i === 2) { s = Object.assign({}, s, { value: a.queue.length }); }
        return UI.statCard(s).replace('class="stat-value"', i === 2 ? 'class="stat-value" id="admin-pending-value"' : 'class="stat-value"');
      }).join('');
      return UI.pageHead({
        title: greeting() + ', ' + ctx.user.name.split(' ')[0],
        description: esc(ctx.user.org) + ' · ' + today(),
        actions: UI.button({ label: 'Component library', icon: 'palette', variant: 'secondary', href: '#/admin/components' }) +
                 (M.dir.can('users:create') ? UI.button({ label: 'Add user', icon: 'user-plus', variant: 'accent', href: '#/admin/users/new' }) : UI.button({ label: 'Add user', icon: 'user-plus', variant: 'accent', disabled: true }))
      }) +
      '<div class="stack">' + simBanner('Approving or rejecting an establishment here only changes demo data held in this browser tab. It is not a real onboarding decision.') +
      '<div class="grid cols-4">' + stats + '</div>' +
      '<div class="grid main-side"><div class="stack">' +
        UI.card({ title: 'Establishment onboarding queue', subtitle: 'Approve or reject to try the confirmation and validation patterns', actions: '<span class="badge orange" id="queue-count">' + a.queue.length + ' awaiting review</span>', flush: true, body: '<div id="queue-table"></div>' }) +
        UI.card({ title: 'Recent audit events', subtitle: 'Synthetic entries', flush: true, body: '<div id="audit-table"></div>' }) +
      '</div><div class="stack">' +
        UI.card({ title: 'Daily active sessions', subtitle: 'Last 7 days (synthetic)', body: M.barChart({ labels: a.days, ariaLabel: 'Daily active sessions over the last 7 days', series: [{ name: 'Sessions', values: a.sessions, color: 'var(--chart-1)' }], width: 380, height: 230 }) }) +
        UI.card({ title: 'Platform checks', subtitle: 'Integration modes — nothing here is live monitoring', body:
          [['PMS connector', 'Simulated', 'info'], ['Government interface', 'Simulated', 'info'], ['Document scan / OCR', 'Simulated', 'info'], ['Reference data', M.ops.refState().l, M.ops.refState().t]].map(function (c) {
            return '<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow t">' + c[0] + '</div>' + UI.badge(c[1], c[2]) + '</div>'; }).join('') }) +
      '</div></div></div>';
    },
    mount: function (root) {
      queueCtl = UI.table.mount(root.querySelector('#queue-table'), {
        caption: 'Establishment onboarding queue', rows: D.admin.queue, pageSize: 5, searchKeys: ['name', 'id', 'region', 'type'], searchPlaceholder: 'Search queue…',
        emptyText: 'The onboarding queue is empty. Use “Reset demo data” in the user menu to restore it.',
        columns: [
          { key: 'name', label: 'Establishment', sortable: true, render: function (r) { return '<div class="cell-main">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.id) + ' · ' + esc(r.type) + '</div>'; } },
          { key: 'region', label: 'Region', sortable: true },
          { key: 'submitted', label: 'Submitted' },
          { key: 'docs', label: 'Documents', render: function (r) { return UI.statusBadge(r.docs); } },
          { key: 'a', label: '', align: 'right', render: function (r) {
            return '<div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + UI.button({ label: 'Reject', size: 'sm', variant: 'ghost', action: 'onb-reject', data: { id: r.id } }) + UI.button({ label: 'Approve', size: 'sm', variant: 'primary', action: 'onb-approve', data: { id: r.id } }) + '</div>'; } }
        ]
      });
      UI.table.mount(root.querySelector('#audit-table'), {
        caption: 'Recent audit events', rows: D.admin.audit, pageSize: 6,
        columns: [
          { key: 'when', label: 'Time', render: function (r) { return '<span class="mono">' + esc(r.when) + '</span>'; } },
          { key: 'actor', label: 'Actor' },
          { key: 'action', label: 'Event' },
          { key: 'module', label: 'Module' },
          { key: 'result', label: 'Result', render: function (r) { return UI.statusBadge(r.result); } }
        ]
      });
    }
  };
  function findQ(id) { return D.admin.queue.filter(function (x) { return x.id === id; })[0]; }
  M.actions.on('onb-approve', function (el) {
    if (!M.dir.can('establishments:approve', 'admin')) { M.toast.danger('Not permitted', 'Your demo role does not hold Establishment administration — approve.'); return; }
    var r = findQ(el.getAttribute('data-id')); if (!r) return;
    var warn = r.docs !== 'Complete' ? UI.alert('warning', 'Documents incomplete.', 'This application has ' + esc(r.docs.toLowerCase()) + '. Approving is still possible in the demo.') : '';
    M.modal.confirm({
      title: 'Approve ' + r.name + '?', confirmLabel: 'Approve establishment', variant: 'primary',
      body: '<p>' + esc(r.name) + ' (' + esc(r.id) + ') will be moved out of the queue as approved.</p>' + warn,
      onConfirm: function () { M.dir.estApprove(r.name); D.admin.queue = D.admin.queue.filter(function (x) { return x.id !== r.id; }); refreshQueueUI(); M.toast.success('Approved (demo)', r.name + ' removed from the queue.'); }
    });
  });
  M.actions.on('onb-reject', function (el) {
    if (!M.dir.can('establishments:approve', 'admin')) { M.toast.danger('Not permitted', 'Your demo role does not hold Establishment administration — approve.'); return; }
    var r = findQ(el.getAttribute('data-id')); if (!r) return;
    M.modal.open({
      title: 'Reject ' + r.name + '?',
      body: '<p>A reason is required so the establishment can be told what to fix.</p>' + UI.textarea({ id: 'rej-reason', label: 'Reason for rejection', required: true, placeholder: 'e.g. Business licence copy is unreadable' }),
      actions: [{ label: 'Cancel' }, { label: 'Reject application', variant: 'danger', onClick: function (wrap) {
        var ta = wrap.querySelector('#rej-reason');
        if (!ta.value.trim()) {
          ta.setAttribute('aria-invalid', 'true');
          if (!wrap.querySelector('#rej-reason-err')) { var e = document.createElement('div'); e.className = 'error-text'; e.id = 'rej-reason-err'; e.innerHTML = icon('alert', { size: 14 }) + 'Enter a reason to continue.'; ta.after(e); ta.setAttribute('aria-describedby', 'rej-reason-err'); }
          ta.focus(); return false;
        }
        M.dir.estReject(r.name, ta.value.trim()); D.admin.queue = D.admin.queue.filter(function (x) { return x.id !== r.id; }); refreshQueueUI();
        M.toast.warning('Rejected (demo)', r.name + ' — reason recorded locally only.');
      } }]
    });
  });
})(window);
