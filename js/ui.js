/* Msafiri — reusable UI components.
   Most helpers return HTML strings; behaviour is attached via data-action delegation
   (Msafiri.actions) or via mount helpers (table, modal, toast). */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});
  var icon = function (n, o) { return M.icon(n, o); };

  var esc = M.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var uid = (function () { var n = 0; return function (p) { return (p || 'id') + '-' + (++n); }; })();
  M.uid = uid;

  /* ---------- Action registry (event delegation) ---------- */
  M.actions = {
    handlers: {},
    on: function (name, fn) { this.handlers[name] = fn; },
    init: function () {
      var self = this;
      document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-action]');
        if (!el) return;
        var fn = self.handlers[el.getAttribute('data-action')];
        if (fn) { e.preventDefault(); fn(el, e); }
      });
    }
  };

  var UI = (M.UI = {});

  /* ---------- Primitives ---------- */
  UI.badge = function (label, tone, opts) {
    opts = opts || {};
    return '<span class="badge ' + (tone || 'neutral') + (opts.dot === false ? '' : ' dot') + '">' + esc(label) + '</span>';
  };

  /* Map a status word to a badge tone */
  var toneMap = {
    'Submitted': 'success', 'Registered': 'success', 'Complete': 'success', 'Success': 'success', 'Active': 'success',
    'Pending': 'warning', 'Expected': 'info', 'Warning': 'warning', 'At risk': 'warning', 'Missing 1 item': 'warning',
    'Needs correction': 'danger', 'Overdue': 'danger', 'Failed': 'danger',
    'Draft': 'neutral',
    'Acknowledged': 'success', 'Rejected': 'danger', 'Queued offline': 'warning', 'Syncing': 'info', 'Conflict': 'danger',
    'Blocked': 'danger', 'Simulated': 'info', 'Not included': 'neutral', 'Checked in': 'success'
  };
  UI.statusBadge = function (status) { return UI.badge(status, toneMap[status] || 'neutral'); };

  UI.button = function (o) {
    var cls = 'btn btn-' + (o.variant || 'secondary') + (o.size ? ' btn-' + o.size : '') + (o.block ? ' btn-block' : '');
    var inner = (o.icon ? icon(o.icon) : '') + (o.label ? '<span>' + esc(o.label) + '</span>' : '');
    var attrs = '';
    if (o.action) attrs += ' data-action="' + esc(o.action) + '"';
    if (o.data) Object.keys(o.data).forEach(function (k) { attrs += ' data-' + k + '="' + esc(o.data[k]) + '"'; });
    if (o.aria) attrs += ' aria-label="' + esc(o.aria) + '"';
    if (o.disabled) attrs += ' disabled';
    if (o.href) return '<a class="' + cls + '" href="' + esc(o.href) + '"' + attrs + '>' + inner + '</a>';
    return '<button type="' + (o.type || 'button') + '" class="' + cls + '"' + attrs + '>' + inner + '</button>';
  };

  UI.avatar = function (initials, o) { o = o || {}; return '<span class="avatar' + (o.orange ? ' orange' : '') + (o.sm ? ' sm' : '') + '" aria-hidden="true">' + esc(initials) + '</span>'; };

  UI.alert = function (tone, title, body, ic) {
    var map = { info: 'info', warning: 'alert', danger: 'alert', success: 'check-circle', orange: 'info' };
    return '<div class="alert ' + tone + '" role="' + (tone === 'danger' ? 'alert' : 'note') + '">' + icon(ic || map[tone] || 'info') +
      '<div>' + (title ? '<strong>' + esc(title) + '</strong> ' : '') + body + '</div></div>';
  };

  /* ---------- Cards ---------- */
  UI.card = function (o) {
    var head = '';
    if (o.title) {
      head = '<div class="card-head"><div><h3>' + esc(o.title) + '</h3>' + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>' + (o.actions ? '<div class="row">' + o.actions + '</div>' : '') + '</div>';
    }
    return '<section class="card"' + (o.id ? ' id="' + o.id + '"' : '') + (o.title ? ' aria-label="' + esc(o.title) + '"' : '') + '>' + head +
      '<div class="card-body' + (o.flush ? ' flush' : '') + '">' + o.body + '</div>' + (o.foot ? '<div class="card-foot">' + o.foot + '</div>' : '') + '</section>';
  };

  UI.statCard = function (s) {
    var tone = s.tone && ['orange', 'red', 'green'].indexOf(s.tone) > -1 ? s.tone : '';
    var dtone = s.dtone || (s.tone === 'up' || s.tone === 'down' ? s.tone : 'flat');
    /* Stage 8.1: a trend arrow implies a comparison over time, so draw one only when the delta is itself a signed number (e.g. "+6", "-1", "+8.2%"); status wording such as "3 rejected" keeps its colour but gets no arrow */
    var signed = /^\s*[+\-\u2212\u2013]\s?\d/.test(String(s.delta == null ? '' : s.delta));
    var arrow = !signed ? '' : dtone === 'up' ? 'trending-up' : dtone === 'down' ? 'trending-down' : '';
    return '<article class="card stat' + (s.accent ? ' accent' : '') + '">' +
      '<div class="stat-top"><span class="stat-label">' + esc(s.label) + '</span><span class="stat-ico ' + tone + '">' + icon(s.icon || 'activity') + '</span></div>' +
      '<div class="stat-value">' + esc(typeof s.value === 'number' ? s.value.toLocaleString('en-US') : s.value) + '</div>' +
      '<div class="stat-foot">' + (s.delta ? '<span class="delta ' + dtone + '">' + (arrow ? icon(arrow, { size: 14 }) : '') + esc(s.delta) + '</span>' : '') + (s.foot ? '<span>' + esc(s.foot) + '</span>' : '') + '</div></article>';
  };

  UI.pageHead = function (o) {
    var crumbs = '';
    if (o.crumbs) {
      crumbs = '<nav class="crumbs" aria-label="Breadcrumb">' + o.crumbs.map(function (c, i) {
        var last = i === o.crumbs.length - 1;
        return (c.href && !last ? '<a href="' + c.href + '">' + esc(c.label) + '</a>' : '<span' + (last ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</span>') + (last ? '' : '<span aria-hidden="true">/</span>');
      }).join('') + '</nav>';
    }
    return '<div class="page-head"><div>' + crumbs + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.description ? '<p>' + o.description + '</p>' : '') + '</div>' +
      (o.actions ? '<div class="actions">' + o.actions + '</div>' : '') + '</div>';
  };

  UI.empty = function (o) {
    return '<div class="empty"><div class="ill">' + icon(o.icon || 'inbox') + '</div><h3>' + esc(o.title) + '</h3><p>' + esc(o.body || '') + '</p>' + (o.actions ? '<div class="row">' + o.actions + '</div>' : '') + '</div>';
  };

  /* ---------- Form fields ---------- */
  function fieldWrap(o, control) {
    var hintId = o.hint ? o.id + '-hint' : '';
    var errId = o.error ? o.id + '-err' : '';
    return '<div class="field' + (o.span2 ? ' span-2' : '') + '"><label for="' + o.id + '">' + esc(o.label) + (o.required ? '<span class="req" aria-hidden="true">*</span><span class="sr-only"> (required)</span>' : '') + '</label>' +
      control(hintId, errId) + (o.hint ? '<div class="hint" id="' + hintId + '">' + esc(o.hint) + '</div>' : '') +
      (o.error ? '<div class="error-text" id="' + errId + '">' + icon('alert', { size: 14 }) + esc(o.error) + '</div>' : '') + '</div>';
  }
  function describedBy(h, e) { var v = [e, h].filter(Boolean).join(' '); return v ? ' aria-describedby="' + v + '"' : ''; }

  UI.input = function (o) {
    o.id = o.id || uid('in');
    return fieldWrap(o, function (h, e) {
      var inp = '<input class="input" id="' + o.id + '" name="' + (o.name || o.id) + '" type="' + (o.type || 'text') + '"' + (o.value != null ? ' value="' + esc(o.value) + '"' : '') +
        (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.required ? ' required' : '') + (o.disabled ? ' disabled' : '') + (o.error ? ' aria-invalid="true"' : '') + describedBy(h, e) + '>';
      return o.icon ? '<div class="input-icon">' + icon(o.icon) + inp + '</div>' : inp;
    });
  };
  UI.select = function (o) {
    o.id = o.id || uid('sel');
    return fieldWrap(o, function (h, e) {
      return '<select class="select" id="' + o.id + '" name="' + (o.name || o.id) + '"' + (o.required ? ' required' : '') + (o.disabled ? ' disabled' : '') + (o.error ? ' aria-invalid="true"' : '') + describedBy(h, e) + '>' +
        (o.placeholder ? '<option value="">' + esc(o.placeholder) + '</option>' : '') +
        o.options.map(function (op) { var v = typeof op === 'object' ? op.value : op, l = typeof op === 'object' ? op.label : op; return '<option value="' + esc(v) + '"' + (v === o.value ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
    });
  };
  UI.textarea = function (o) {
    o.id = o.id || uid('ta');
    return fieldWrap(o, function (h, e) {
      return '<textarea class="textarea" id="' + o.id + '" name="' + (o.name || o.id) + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.required ? ' required' : '') + describedBy(h, e) + '>' + esc(o.value || '') + '</textarea>';
    });
  };
  UI.checkbox = function (o) {
    o.id = o.id || uid('cb');
    return '<label class="check" for="' + o.id + '"><input type="checkbox" id="' + o.id + '"' + (o.checked ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span>' + o.label + '</span></label>';
  };
  UI.switch = function (o) {
    o.id = o.id || uid('sw');
    return '<label class="switch" for="' + o.id + '"><input type="checkbox" role="switch" id="' + o.id + '"' + (o.checked ? ' checked' : '') + '><span class="track"></span><span>' + esc(o.label) + '</span></label>';
  };

  /* ---------- Scrollable table regions (Stage 8.1) ----------
     A table that is wider than its container scrolls sideways. Make that region keyboard-reachable and labelled, and mark which
     edge still has hidden columns (CSS fades that edge). Regions that fit are left alone: no extra tab stop. */
  function scrollEdges(w) {
    var l = w.scrollLeft > 1, r = w.scrollLeft + w.clientWidth < w.scrollWidth - 1;
    var v = (l ? 'left' : '') + (l && r ? ' ' : '') + (r ? 'right' : '');
    if (v) w.setAttribute('data-scroll', v); else w.removeAttribute('data-scroll');
  }
  M.syncScroll = function (root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.table-wrap'), function (w) {
      var over = w.scrollWidth > w.clientWidth + 1;
      if (over) {
        var cap = w.querySelector('caption');
        w.setAttribute('tabindex', '0'); w.setAttribute('role', 'region');
        w.setAttribute('aria-label', (cap && cap.textContent.trim() ? cap.textContent.trim() : 'Table') + ' (scrolls sideways)');
        scrollEdges(w);
      } else { w.removeAttribute('tabindex'); w.removeAttribute('role'); w.removeAttribute('aria-label'); w.removeAttribute('data-scroll'); }
      if (!w._scrollSync) { w._scrollSync = true; w.addEventListener('scroll', function () { scrollEdges(w); }, { passive: true }); }
    });
  };

  /* ---------- Tabs (ARIA; wired by delegated handler below) ---------- */
  UI.tabs = function (tabs) {
    var id = uid('tabs');
    return '<div data-tabs="' + id + '"><div class="tabs" role="tablist">' + tabs.map(function (t, i) {
      return '<button class="tab" role="tab" id="' + id + '-t' + i + '" aria-controls="' + id + '-p' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(t.label) + '</button>';
    }).join('') + '</div>' + tabs.map(function (t, i) {
      return '<div class="tab-panel" role="tabpanel" id="' + id + '-p' + i + '" aria-labelledby="' + id + '-t' + i + '"' + (i === 0 ? '' : ' hidden') + '>' + t.body + '</div>';
    }).join('') + '</div>';
  };
  function activateTab(btn) {
    var root = btn.closest('[data-tabs]');
    root.querySelectorAll('[role="tab"]').forEach(function (b) { var on = b === btn; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    root.querySelectorAll('[role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== btn.getAttribute('aria-controls'); });
    M.syncScroll(root);
    btn.focus();
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-tabs] [role="tab"]'); if (b) activateTab(b); });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('[data-tabs] [role="tab"]');
    if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var tabs = Array.prototype.slice.call(b.parentNode.querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1);
    activateTab(tabs[(i + tabs.length) % tabs.length]);
  });

  /* ---------- Toasts ---------- */
  M.toast = {
    show: function (o) {
      var region = document.getElementById('toasts');
      if (!region) return;
      var tone = o.tone || 'info';
      var el = document.createElement('div');
      el.className = 'toast ' + tone;
      el.innerHTML = '<div class="grow"><div class="t">' + esc(o.title) + '</div>' + (o.message ? '<div class="m">' + esc(o.message) + '</div>' : '') + '</div>' +
        '<button type="button" aria-label="Dismiss notification">' + icon('x', { size: 16 }) + '</button>';
      var close = function () { el.classList.add('leaving'); setTimeout(function () { el.remove(); }, 200); };
      el.querySelector('button').addEventListener('click', close);
      region.appendChild(el);
      while (region.children.length > 4) region.firstChild.remove();
      setTimeout(close, o.duration || 4500);
    },
    success: function (t, m) { this.show({ title: t, message: m, tone: 'success' }); },
    warning: function (t, m) { this.show({ title: t, message: m, tone: 'warning' }); },
    danger: function (t, m) { this.show({ title: t, message: m, tone: 'danger' }); },
    info: function (t, m) { this.show({ title: t, message: m, tone: 'info' }); }
  };
  /* Standard way to flag a control that is intentionally not built in this prototype */
  M.unavailable = function (what) {
    M.toast.show({ title: (what || 'This action') + ' is not available', message: 'Out of scope for the prototype — no data is saved or sent.', tone: 'warning' });
  };

  /* ---------- Modal (focus-trapped, Esc to close) ---------- */
  var modalState = null;
  M.modal = {
    open: function (o) {
      this.close(true);
      var root = document.getElementById('modal-root');
      var id = uid('modal');
      var wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = '<div class="modal' + (o.size === 'lg' ? ' lg' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t" aria-describedby="' + id + '-b">' +
        '<div class="modal-head"><h2 id="' + id + '-t">' + esc(o.title) + '</h2><button type="button" class="icon-btn" data-modal-close aria-label="Close dialog">' + icon('x') + '</button></div>' +
        '<div class="modal-body" id="' + id + '-b">' + (o.body || '') + '</div>' +
        '<div class="modal-foot">' + (o.actions || []).map(function (a, i) {
          return '<button type="button" class="btn btn-' + (a.variant || 'secondary') + '" data-modal-btn="' + i + '">' + esc(a.label) + '</button>';
        }).join('') + '</div></div>';
      root.appendChild(wrap);
      modalState = { wrap: wrap, opener: document.activeElement, actions: o.actions || [], onClose: o.onClose };
      document.body.style.overflow = 'hidden';
      M.syncScroll(wrap);
      wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) M.modal.close(); });
      wrap.addEventListener('click', function (e) {
        if (e.target.closest('[data-modal-close]')) return M.modal.close();
        var b = e.target.closest('[data-modal-btn]');
        if (!b) return;
        var a = modalState.actions[+b.getAttribute('data-modal-btn')];
        var keep = a.onClick ? a.onClick(wrap) === false : false;
        if (!keep) M.modal.close();
      });
      var first = wrap.querySelector('[autofocus], .modal-foot .btn-primary, .modal-foot .btn-accent, .modal-foot .btn-danger, .modal-foot .btn, [data-modal-close]');
      (first || wrap.querySelector('.modal')).focus();
      return wrap;
    },
    confirm: function (o) {
      return this.open({
        title: o.title, body: o.body,
        actions: [{ label: o.cancelLabel || 'Cancel', variant: 'secondary' }, { label: o.confirmLabel || 'Confirm', variant: o.variant || 'primary', onClick: o.onConfirm }]
      });
    },
    close: function (silent) {
      if (!modalState) return;
      var s = modalState; modalState = null;
      s.wrap.remove();
      document.body.style.overflow = '';
      if (!silent && s.opener && s.opener.focus && document.body.contains(s.opener)) s.opener.focus();
      if (s.onClose) s.onClose();
      if (!silent && M.store && M.store.flush) M.store.flush();
    }
  };
  document.addEventListener('keydown', function (e) {
    if (!modalState) return;
    if (e.key === 'Escape') { e.stopPropagation(); M.modal.close(); return; }
    if (e.key !== 'Tab') return;
    var f = modalState.wrap.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, true);

  /* ---------- Data table (search, filter, sort, paginate) ----------
     UI.table.mount(el, { columns:[{key,label,sortable,align,render(row)}], rows, pageSize, searchKeys, filter:{key,label,options}, caption, emptyText }) */
  UI.table = {
    mount: function (el, cfg) {
      var st = { q: '', f: '', sortKey: null, dir: 'asc', page: 1, rows: cfg.rows.slice() };
      var pageSize = cfg.pageSize || 8;
      var id = uid('dt');
      /* Stage 8.2: a background refresh of the same page (M.softRerender) keeps this table's search, filter, sort and page.
         Any normal navigation or reset starts from a clean table, as before. */
      var tkey = cfg.caption || 'table';
      M.tableState = M.tableState || {};
      var saved = M._keepTables && M.tableState[tkey];
      if (saved) { st.q = saved.q; st.f = saved.f; st.sortKey = saved.sortKey; st.dir = saved.dir; st.page = saved.page; }

      el.innerHTML =
        ((cfg.searchKeys || cfg.filter) ? '<div class="table-toolbar">' +
          (cfg.searchKeys ? '<div class="input-icon">' + icon('search') + '<input class="input input-sm" type="search" data-tkey="' + esc(tkey) + '" id="' + id + '-q" placeholder="' + esc(cfg.searchPlaceholder || 'Search…') + '" aria-label="Search table"></div>' : '') +
          (cfg.filter ? '<select class="select input-sm" id="' + id + '-f" aria-label="' + esc(cfg.filter.label) + '"><option value="">' + esc(cfg.filter.label) + ': All</option>' + cfg.filter.options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' : '') +
          '<span class="spacer"></span>' + (cfg.toolbarExtra || '') + '</div>' : '') +
        '<div class="table-wrap"><table class="dt"><caption class="sr-only">' + esc(cfg.caption || 'Data table') + '</caption><thead><tr>' +
        cfg.columns.map(function (c) {
          var th = c.sortable ? '<button type="button" class="sort" data-sort="' + c.key + '">' + esc(c.label) + icon('arrow-up') + '</button>' : esc(c.label);
          return '<th scope="col" data-col="' + c.key + '"' + (c.align ? ' class="' + c.align + '"' : '') + '>' + th + '</th>';
        }).join('') + '</tr></thead><tbody></tbody></table></div><div class="table-foot"><span class="count" aria-live="polite"></span><nav class="pager" aria-label="Pagination"></nav></div>';

      var tbody = el.querySelector('tbody'), countEl = el.querySelector('.count'), pager = el.querySelector('.pager');

      function view() {
        var rows = st.rows.filter(function (r) {
          if (st.f && r[cfg.filter.key] !== st.f) return false;
          if (st.q) { var q = st.q.toLowerCase(); return cfg.searchKeys.some(function (k) { return String(r[k] == null ? '' : r[k]).toLowerCase().indexOf(q) > -1; }); }
          return true;
        });
        if (st.sortKey) {
          rows.sort(function (a, b) {
            var x = a[st.sortKey], y = b[st.sortKey];
            var r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, { numeric: true });
            return st.dir === 'asc' ? r : -r;
          });
        }
        return rows;
      }
      function render() {
        var rows = view();
        var pages = Math.max(1, Math.ceil(rows.length / pageSize));
        if (st.page > pages) st.page = pages;
        var start = (st.page - 1) * pageSize, slice = rows.slice(start, start + pageSize);
        tbody.innerHTML = slice.length ? slice.map(function (r) {
          return '<tr>' + cfg.columns.map(function (c) {
            return '<td' + (c.align ? ' class="' + c.align + '"' : '') + '>' + (c.render ? c.render(r) : esc(r[c.key])) + '</td>';
          }).join('') + '</tr>';
        }).join('') : '<tr><td colspan="' + cfg.columns.length + '"><div class="table-empty">' + esc(cfg.emptyText || 'No matching records.') + '</div></td></tr>';
        countEl.textContent = rows.length ? 'Showing ' + (start + 1) + '–' + (start + slice.length) + ' of ' + rows.length : '0 results';
        el.querySelectorAll('th[data-col]').forEach(function (th) {
          th.removeAttribute('aria-sort');
          if (th.getAttribute('data-col') === st.sortKey) th.setAttribute('aria-sort', st.dir === 'asc' ? 'ascending' : 'descending');
        });
        var btns = '<button type="button" data-p="' + (st.page - 1) + '" aria-label="Previous page"' + (st.page === 1 ? ' disabled' : '') + '>' + icon('chevron-left') + '</button>';
        var gap = false;
        for (var p = 1; p <= pages; p++) {
          if (pages > 7 && p !== 1 && p !== pages && Math.abs(p - st.page) > 1) { if (!gap) btns += '<span aria-hidden="true">…</span>'; gap = true; continue; }
          gap = false;
          btns += '<button type="button" data-p="' + p + '"' + (p === st.page ? ' aria-current="page"' : '') + ' aria-label="Page ' + p + '">' + p + '</button>';
        }
        btns += '<button type="button" data-p="' + (st.page + 1) + '" aria-label="Next page"' + (st.page === pages ? ' disabled' : '') + '>' + icon('chevron-right') + '</button>';
        pager.innerHTML = pages > 1 ? btns : '';
        M.tableState[tkey] = { q: st.q, f: st.f, sortKey: st.sortKey, dir: st.dir, page: st.page };
        M.syncScroll(el);
      }

      var q = el.querySelector('#' + id + '-q'), f = el.querySelector('#' + id + '-f');
      if (q && st.q) q.value = st.q;
      if (f && st.f) f.value = st.f;
      if (q) q.addEventListener('input', function () { st.q = q.value.trim(); st.page = 1; render(); });
      if (f) f.addEventListener('change', function () { st.f = f.value; st.page = 1; render(); });
      el.addEventListener('click', function (e) {
        var s = e.target.closest('[data-sort]');
        if (s) { var k = s.getAttribute('data-sort'); st.dir = st.sortKey === k && st.dir === 'asc' ? 'desc' : 'asc'; st.sortKey = k; render(); return; }
        var p = e.target.closest('[data-p]');
        if (p && !p.disabled) { st.page = +p.getAttribute('data-p'); render(); }
      });
      render();
      return {
        setRows: function (rows) { st.rows = rows.slice(); render(); },
        getRows: function () { return st.rows.slice(); },
        refresh: render
      };
    }
  };
})(window);
