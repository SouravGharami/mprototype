/* Msafiri — Prototype Toolkit pages: component library + reusable page templates.
   These are reference pages for the design team and client; they are not URS modules. */
(function (global) {
  'use strict';
  var M = global.Msafiri, UI = M.UI, esc = M.esc, icon = M.icon, D = M.demo;

  function swatch(name, varName, hex) {
    return '<div class="swatch"><div style="background:var(' + varName + ')"></div><span>' + esc(name) + '<code>' + hex + '</code></span></div>';
  }
  function section(title, sub, body) { return UI.card({ title: title, subtitle: sub, body: body }); }

  /* ================= Component library ================= */
  M.pages['admin/components'] = {
    title: 'Component Library',
    render: function () {
      var colours =
        '<div class="swatch-grid">' + [
          ['Navy 900', '--navy-900', '#0A1F44'], ['Navy 800', '--navy-800', '#0F2B5C'], ['Navy 700', '--navy-700', '#16397A'], ['Navy 600', '--navy-600', '#1E4A99'], ['Navy 100', '--navy-100', '#E3EAF6'],
          ['Orange 600', '--orange-600', '#D9620E'], ['Orange 500', '--orange-500', '#F47B20'], ['Orange 400', '--orange-400', '#F79A4F'], ['Orange 100', '--orange-100', '#FFE9D6'],
          ['Success', '--success-500', '#14935F'], ['Warning', '--warning-500', '#D49210'], ['Danger', '--danger-500', '#D64533'], ['Info', '--info-500', '#2478C4']
        ].map(function (s) { return swatch(s[0], s[1], s[2]); }).join('') + '</div>' +
        '<p class="hint mt-5">Orange is used as the accent (primary call-to-action, active-navigation marker) with navy text for contrast. Orange text on white is limited to the darker 700 shade.</p>';

      var type =
        '<div class="stack" style="gap:12px"><div style="font-size:var(--fs-3xl);font-weight:700;letter-spacing:-.02em">Display 34 / Bold</div>' +
        '<div style="font-size:var(--fs-2xl);font-weight:700">Page title 28 / Bold</div>' +
        '<div style="font-size:var(--fs-lg);font-weight:700">Section heading 18 / Bold</div>' +
        '<div>Body 15 / Regular — Registrations are grouped by establishment and reporting date.</div>' +
        '<div style="font-size:var(--fs-sm);color:var(--text-2)">Small 13 / Regular — secondary descriptions and table cells.</div>' +
        '<div class="hint">Caption 12 / Regular — hints and metadata.</div><div class="mono">REG-241012 · mono for references</div></div>';

      var buttons =
        '<div class="row">' + ['accent', 'primary', 'secondary', 'ghost', 'danger'].map(function (v) { return UI.button({ label: v[0].toUpperCase() + v.slice(1), variant: v, action: 'unavailable', data: { label: 'Demo button' } }); }).join('') + '</div>' +
        '<div class="row mt-5">' + UI.button({ label: 'With icon', icon: 'plus', variant: 'primary' }) + UI.button({ label: 'Small', size: 'sm', variant: 'secondary' }) + UI.button({ label: 'Large', size: 'lg', variant: 'accent' }) + UI.button({ label: 'Disabled', variant: 'primary', disabled: true }) +
        UI.button({ icon: 'download', aria: 'Download', variant: 'secondary' }) + '</div>';

      var badges = '<div class="chips">' + [['Acknowledged', 'success'], ['Submitted', 'success'], ['Pending', 'warning'], ['Queued offline', 'warning'], ['Rejected', 'danger'], ['Simulated', 'info'], ['Expected', 'info'], ['Draft', 'neutral'], ['Priority', 'orange'], ['Admin', 'navy']].map(function (b) { return UI.badge(b[0], b[1]); }).join('') + '</div>' +
        '<div class="chips mt-5">' + [['Compact', 'success']].map(function (b) { return UI.badge(b[0], b[1], { dot: false }); }).join('') + UI.avatar('NK') + UI.avatar('JN', { orange: true }) + UI.avatar('SO', { sm: true }) + '</div>';

      var forms = '<form class="form-grid" onsubmit="return false" novalidate>' +
        UI.input({ id: 'cl-name', label: 'Text input', placeholder: 'Placeholder text', hint: 'Helper text sits below the field.' }) +
        UI.input({ id: 'cl-err', label: 'Input with error', value: 'not-an-email', required: true, error: 'Enter a valid email address.' }) +
        UI.select({ id: 'cl-sel', label: 'Select', options: ['Option one', 'Option two', 'Option three'], placeholder: 'Choose…' }) +
        UI.input({ id: 'cl-dis', label: 'Disabled', value: 'Read-only value', disabled: true }) +
        UI.input({ id: 'cl-search', label: 'With icon', icon: 'search', placeholder: 'Search…' }) +
        UI.textarea({ id: 'cl-ta', label: 'Text area', placeholder: 'Longer text…' }) +
        '<div class="stack" style="gap:12px">' + UI.checkbox({ label: 'Checkbox option', checked: true }) + UI.switch({ label: 'Switch option', checked: true }) + '</div></form>';

      var alerts = '<div class="stack" style="gap:12px">' + UI.alert('info', 'Information.', 'Neutral guidance for the user.') + UI.alert('success', 'Success.', 'The action completed.') + UI.alert('warning', 'Warning.', 'Something needs attention.') + UI.alert('danger', 'Error.', 'Something went wrong.') + '</div>';

      var overlays = '<div class="row">' +
        UI.button({ label: 'Success toast', variant: 'secondary', action: 'demo-toast', data: { tone: 'success' } }) + UI.button({ label: 'Warning toast', variant: 'secondary', action: 'demo-toast', data: { tone: 'warning' } }) +
        UI.button({ label: 'Error toast', variant: 'secondary', action: 'demo-toast', data: { tone: 'danger' } }) + UI.button({ label: 'Info toast', variant: 'secondary', action: 'demo-toast', data: { tone: 'info' } }) + '</div>' +
        '<div class="row mt-5">' + UI.button({ label: 'Open modal', variant: 'primary', action: 'demo-modal' }) + UI.button({ label: 'Open confirm dialog', variant: 'danger', action: 'demo-confirm' }) + '</div>';

      var tabs = UI.tabs([
        { label: 'Overview', body: '<p>Tabs use ARIA roles and respond to the left and right arrow keys.</p>' },
        { label: 'Details', body: '<p>Each panel is hidden until its tab is selected.</p>' },
        { label: 'History', body: '<p>Use tabs to split dense detail pages without leaving the screen.</p>' }]) +
        '<div class="mt-5"><div class="segmented" role="group" aria-label="Segmented control demo"><button type="button" aria-pressed="true" data-action="demo-seg">Day</button><button type="button" aria-pressed="false" data-action="demo-seg">Week</button><button type="button" aria-pressed="false" data-action="demo-seg">Month</button></div></div>';

      var charts = '<div class="grid cols-2"><div>' + M.lineChart({ area: true, labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], height: 200, ariaLabel: 'Sample line chart', series: [{ name: 'Series A', values: [12, 18, 15, 24, 30, 28], color: 'var(--chart-1)' }, { name: 'Series B', values: [8, 10, 14, 13, 19, 25], color: 'var(--chart-2)' }] }) + '</div><div>' +
        M.donutChart({ centerLabel: 'Sample', ariaLabel: 'Sample donut chart', segments: [{ label: 'Alpha', value: 45, color: 'var(--chart-1)' }, { label: 'Beta', value: 30, color: 'var(--chart-2)' }, { label: 'Gamma', value: 25, color: 'var(--chart-3)' }] }) + '</div></div>';

      var stats = '<div class="grid cols-3">' + [
        { label: 'Stat card', value: '1,284', icon: 'users', delta: '+22', tone: 'up', foot: 'this month' },
        { label: 'With accent', value: 38, icon: 'clock', tone: 'orange', accent: true, delta: 'Today', dtone: 'flat' },
        { label: 'Needs action', value: 9, icon: 'alert', tone: 'red', delta: '-2', dtone: 'down', foot: 'vs. yesterday' }].map(UI.statCard).join('') + '</div>';

      return UI.pageHead({ crumbs: [{ label: 'System Administration', href: '#/admin/dashboard' }, { label: 'Prototype Toolkit' }, { label: 'Component Library' }],
        description: 'Every shared token and component used by the Msafiri prototype. New modules should compose these rather than add new styles.' }) +
        '<div class="stack">' + section('Colour tokens', 'Navy and orange programme palette plus status colours', colours) + section('Typography', 'System UI font stack — no external fonts required', type) +
        '<div class="grid cols-2">' + section('Buttons', 'Orange accent for the primary action on a page', buttons) + section('Badges & avatars', 'Status uses colour plus a text label', badges) + '</div>' +
        section('Form controls', 'Labels, hints, required and error states', forms) +
        '<div class="grid cols-2">' + section('Alerts', 'Inline messages', alerts) + section('Toasts & dialogs', 'Click to try them', overlays) + '</div>' +
        section('Stat cards', '', stats) + section('Charts', 'Dependency-free SVG; hover for values', charts) + section('Tabs & segmented control', 'Keyboard accessible', tabs) + '</div>';
    }
  };
  M.actions.on('demo-toast', function (el) {
    var t = el.getAttribute('data-tone'), msg = { success: 'Saved', warning: 'Check this', danger: 'Something failed', info: 'For your information' }[t];
    M.toast.show({ title: msg, message: 'This is a ' + t + ' toast. It dismisses itself.', tone: t });
  });
  M.actions.on('demo-modal', function () {
    M.modal.open({ title: 'Example dialog', body: '<p>Dialogs trap focus, close with Esc or the backdrop, and return focus to the button that opened them.</p>' + UI.input({ id: 'dm-in', label: 'A field inside the dialog', placeholder: 'Type here' }),
      actions: [{ label: 'Cancel' }, { label: 'Save', variant: 'primary', onClick: function () { M.toast.success('Dialog action', 'Primary button pressed.'); } }] });
  });
  M.actions.on('demo-confirm', function () {
    M.modal.confirm({ title: 'Delete this item?', body: '<p>Destructive actions use a red confirm button and a clear question.</p>', confirmLabel: 'Delete', variant: 'danger', onConfirm: function () { M.toast.danger('Deleted (demo)', 'Nothing was actually removed.'); } });
  });
  M.actions.on('demo-seg', function (el) { el.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === el); }); });

  /* ================= List page template ================= */
  M.pages['admin/tpl-list'] = {
    title: 'List Page Template',
    render: function () {
      return UI.pageHead({ crumbs: [{ label: 'System Administration', href: '#/admin/dashboard' }, { label: 'Prototype Toolkit' }, { label: 'List Page Template' }],
        description: 'Pattern for any record list: search, filter, sortable columns, pagination and row actions. Rows are synthetic.',
        actions: UI.button({ label: 'Export', icon: 'download', variant: 'secondary', action: 'unavailable', data: { label: 'Export' } }) + UI.button({ label: 'Add record', icon: 'plus', variant: 'accent', action: 'unavailable', data: { label: 'Add record' } }) }) +
        '<div class="stack">' + UI.card({ flush: true, body: '<div id="tpl-table"></div>' }) + '</div>';
    },
    mount: function (root) {
      UI.table.mount(root.querySelector('#tpl-table'), {
        caption: 'Sample records', rows: D.templateRows, pageSize: 8, searchKeys: ['guest', 'ref', 'nat'], searchPlaceholder: 'Search name, reference or nationality…',
        filter: { key: 'status', label: 'Status', options: ['Acknowledged', 'Submitted', 'Pending', 'Draft', 'Rejected'] },
        columns: [
          { key: 'ref', label: 'Reference', sortable: true, render: function (r) { return '<span class="mono">' + esc(r.ref) + '</span>'; } },
          { key: 'guest', label: 'Name', sortable: true, render: function (r) { return '<span class="cell-main">' + esc(r.guest) + '</span>'; } },
          { key: 'nat', label: 'Nationality', sortable: true },
          { key: 'arrival', label: 'Arrival' },
          { key: 'nights', label: 'Nights', sortable: true, align: 'right', render: function (r) { return '<span class="num">' + r.nights + '</span>'; } },
          { key: 'status', label: 'Status', sortable: true, render: function (r) { return UI.statusBadge(r.status); } },
          { key: 'a', label: '', align: 'right', render: function (r) { return UI.button({ label: 'View', size: 'sm', variant: 'ghost', action: 'tpl-view', data: { ref: r.ref } }); } }
        ]
      });
    }
  };
  M.actions.on('tpl-view', function (el) {
    var r = D.templateRows.filter(function (x) { return x.ref === el.getAttribute('data-ref'); })[0];
    M.modal.open({ title: r.guest, body: '<dl class="kv"><dt>Reference</dt><dd class="mono">' + esc(r.ref) + '</dd><dt>Nationality</dt><dd>' + esc(r.nat) + '</dd><dt>Arrival</dt><dd>' + esc(r.arrival) + '</dd><dt>Nights</dt><dd>' + r.nights + '</dd><dt>Status</dt><dd>' + UI.statusBadge(r.status) + '</dd></dl>' + UI.alert('info', 'Template record.', 'Detail pages follow this key–value layout.'), actions: [{ label: 'Close', variant: 'primary' }] });
  });

  /* ================= Form page template ================= */
  M.pages['admin/tpl-form'] = {
    title: 'Form Page Template',
    render: function () {
      return UI.pageHead({ crumbs: [{ label: 'System Administration', href: '#/admin/dashboard' }, { label: 'Prototype Toolkit' }, { label: 'Form Page Template' }],
        description: 'Pattern for data entry: grouped sections, required markers, inline validation and a sticky action row.' }) +
        '<div class="stack">' + UI.alert('orange', 'Illustrative fields.', 'This form demonstrates layout and validation only. It is not the guest registration form defined in the URS.') +
        UI.card({ body: '<form id="tpl-form" novalidate>' +
          '<div class="form-section"><h3>Contact details</h3><p>Who should we contact about this record?</p><div class="form-grid">' +
            UI.input({ id: 'f-org', label: 'Organisation name', required: true, placeholder: 'e.g. Sample Lodge' }) +
            UI.input({ id: 'f-person', label: 'Contact person', required: true }) +
            UI.input({ id: 'f-email', label: 'Contact email', type: 'email', required: true, hint: 'We will use this for demo notifications only.' }) +
            UI.select({ id: 'f-region', label: 'Region', required: true, placeholder: 'Select a region', options: ['Coastal', 'Central', 'Northern', 'Lake zone', 'Southern'] }) + '</div></div>' +
          '<div class="form-section"><h3>Additional information</h3><p>Optional details and preferences.</p><div class="form-grid">' +
            UI.textarea({ id: 'f-notes', label: 'Notes', span2: true, placeholder: 'Anything else worth recording?' }) +
            '<div class="span-2 stack" style="gap:12px">' + UI.switch({ id: 'f-notify', label: 'Send me demo notifications', checked: true }) + UI.checkbox({ id: 'f-confirm', label: 'I confirm this information is correct <span class="req" aria-hidden="true">*</span>' }) + '<div id="f-confirm-err"></div></div></div></div>' +
          '<div class="form-actions"><button type="button" class="btn btn-ghost" data-action="go" data-route="#/admin/dashboard">Cancel</button><button type="button" class="btn btn-secondary" data-action="tpl-draft">Save draft</button><button type="submit" class="btn btn-accent">Submit</button></div></form>' }) + '</div>';
    },
    mount: function (root) {
      var form = root.querySelector('#tpl-form');
      function setErr(id, msg) {
        var inp = form.querySelector('#' + id), errId = id + '-err', old = form.querySelector('#' + errId);
        if (old) old.remove(); inp.removeAttribute('aria-invalid');
        if (!msg) return true;
        inp.setAttribute('aria-invalid', 'true');
        var e = document.createElement('div'); e.className = 'error-text'; e.id = errId; e.innerHTML = icon('alert', { size: 14 }) + esc(msg);
        (inp.closest('.input-icon') || inp).after(e);
        inp.setAttribute('aria-describedby', errId);
        return false;
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = [];
        [['f-org', 'Enter the organisation name.'], ['f-person', 'Enter a contact person.'], ['f-region', 'Select a region.']].forEach(function (f) { if (!setErr(f[0], form.querySelector('#' + f[0]).value.trim() ? '' : f[1])) bad.push(f[0]); });
        var em = form.querySelector('#f-email').value.trim();
        if (!setErr('f-email', !em ? 'Enter an email address.' : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) ? '' : 'Enter a valid email address.')) bad.push('f-email');
        var c = form.querySelector('#f-confirm'), ce = form.querySelector('#f-confirm-err');
        ce.innerHTML = c.checked ? '' : '<div class="error-text">' + icon('alert', { size: 14 }) + 'Please confirm before submitting.</div>';
        if (!c.checked) bad.push('f-confirm');
        if (bad.length) { form.querySelector('#' + bad[0]).focus(); M.toast.danger('Please fix ' + bad.length + ' ' + (bad.length === 1 ? 'field' : 'fields'), 'Errors are marked in the form.'); return; }
        M.toast.success('Submitted (demo)', 'Nothing was saved or sent.'); form.reset();
      });
    }
  };
  M.actions.on('tpl-draft', function () { M.toast.info('Draft saved (demo)', 'Drafts are not stored in this prototype.'); });
})(window);
