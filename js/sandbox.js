/* Msafiri — Stage 5B.2: API Sandbox & request simulator (#/admin/developer/sandbox[/<entry-id>]).
   SIMULATION ONLY. Requests are evaluated by local JavaScript in this tab: no fetch/XHR, no WebSocket, no beacon — nothing is transmitted.
   The prototype has NO HTTP API, so every method, path, schema and status code below is an ILLUSTRATIVE PLACEHOLDER for this simulator,
   pending confirmation against the URS (not supplied to this build) and a real implementation. Paths carry an "/illustrative" prefix on purpose.
   Read-only: the sandbox never writes to prototype state. Registration lookups use private synthetic fixtures (administrators have no guest-record
   access in this prototype); integration and establishment data are READ from the existing directory/Integration Dashboard records. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, R = M.dir, I = M.integ, D = M.dev, A = M.actions;
  var TOKEN = 'Bearer SYNTHETIC-SANDBOX-TOKEN';
  var HDR0 = ['Content-Type: application/json', 'Accept: application/json', 'Authorization: ' + TOKEN, 'X-Correlation-Id: SIM-00000'].join('\n');
  var TEXT = { 200: 'OK', 202: 'Accepted', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout' };
  var seq = 0;

  /* Private synthetic registration fixtures (NOT hotel records). */
  var REGS = {
    'REG-900001': { s: 'Acknowledged', why: '', h: ['Submission prepared — Pending (simulated)', 'Sent to simulated government interface', 'Acknowledged by simulated interface (demo — not a real acknowledgement)'] },
    'REG-900002': { s: 'Rejected', why: 'Document number format not accepted (synthetic example)', h: ['Submission prepared — Pending (simulated)', 'Sent to simulated government interface', 'Rejected by simulated interface: Document number format not accepted (synthetic example)'] },
    'REG-900003': { s: 'Pending', why: '', h: ['Submission prepared — Pending (simulated)'] },
    'REG-900004': { s: 'Queued offline', why: '', h: ['Connection unavailable — queued locally. NOT delivered to government.'] }
  };

  /* ---------- tiny helpers ---------- */
  function cid() { return 'SIM-' + ('00000' + ((++seq) * 7919 % 99999)).slice(-5); }
  function out(status, body) { return { status: status, text: TEXT[status] || '', body: body }; }
  function fail(status, code, message, details) { var e = { code: code, message: message }; if (details && details.length) e.details = details; e.correlationId = cid(); return out(status, { error: e }); }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function pick(o, path) { return path.split('.').reduce(function (a, k) { return isObj(a) ? a[k] : undefined; }, o); }
  function blank(v) { return v === undefined || v === null || (typeof v === 'string' && !v.trim()); }
  function isDate(s) { if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; var d = new Date(s + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === s; }
  function missing(p, paths) { return paths.filter(function (x) { return blank(pick(p, x)); }).map(function (x) { return { path: x, message: 'is required' }; }); }
  function docTypes() { var l = M.ops && M.ops.names ? M.ops.names('doctypes') : []; return l.length ? l : ['Passport']; }

  /* ---------- simulators (pure; read-only) ---------- */
  function submit(p) {
    var m = missing(p, ['registrationRef', 'establishmentId', 'guest.fullName', 'guest.nationality', 'guest.dateOfBirth', 'document.type', 'document.number', 'stay.arrival', 'stay.nights']);
    if (m.length) return fail(400, 'VALIDATION_FAILED', m.length + ' required field(s) missing.', m);
    var v = [], today = new Date().toISOString().slice(0, 10), n = pick(p, 'stay.nights'), dob = pick(p, 'guest.dateOfBirth'), doc = pick(p, 'document.type'), no = pick(p, 'document.number');
    if (!/^REG-\d{6}$/.test(String(p.registrationRef))) v.push({ path: 'registrationRef', message: 'must look like REG-123456 (illustrative format)' });
    if (!/^PIL-\d{3}$/.test(String(p.establishmentId))) v.push({ path: 'establishmentId', message: 'must look like PIL-001 (illustrative format)' });
    if (typeof pick(p, 'guest.fullName') !== 'string' || pick(p, 'guest.fullName').trim().length < 2) v.push({ path: 'guest.fullName', message: 'must be text of at least 2 characters' });
    if (typeof pick(p, 'guest.nationality') !== 'string') v.push({ path: 'guest.nationality', message: 'must be text' });
    if (!isDate(dob)) v.push({ path: 'guest.dateOfBirth', message: 'must be a real date in YYYY-MM-DD form' }); else if (dob > today || dob < '1900-01-01') v.push({ path: 'guest.dateOfBirth', message: 'must be between 1900-01-01 and today' });
    if (docTypes().indexOf(doc) < 0) v.push({ path: 'document.type', message: 'must be one of the active document types: ' + docTypes().join(', ') });
    if (typeof no !== 'string' || !/^[A-Za-z0-9]{5,20}$/.test(no)) v.push({ path: 'document.number', message: 'must be 5–20 letters or digits (illustrative rule)' });
    if (!isDate(pick(p, 'stay.arrival'))) v.push({ path: 'stay.arrival', message: 'must be a real date in YYYY-MM-DD form' });
    if (typeof n !== 'number' || n % 1 !== 0 || n < 1 || n > 365) v.push({ path: 'stay.nights', message: 'must be a whole number from 1 to 365 (illustrative range)' });
    if (v.length) return fail(422, 'INVALID_DATA', v.length + ' value(s) are not acceptable.', v);
    var e = R.est(p.establishmentId);
    if (!e) return fail(404, 'ESTABLISHMENT_NOT_FOUND', 'No establishment ' + p.establishmentId + ' in the synthetic directory.');
    if (e.status !== 'Active') return fail(403, 'ESTABLISHMENT_NOT_ACTIVE', e.name + ' has status “' + e.status + '”; only Active establishments may submit (demonstration rule).');
    if (/9$/.test(no)) return out(422, { registrationRef: p.registrationRef, submissionStatus: 'Rejected', reason: 'Document number format not accepted (synthetic example)', note: 'Demo rule: a document number ending in 9 is rejected. In the prototype UI this arrives after “Submitted”; shown here as a single response.', correlationId: cid() });
    return out(202, { registrationRef: p.registrationRef, submissionStatus: 'Pending', message: 'Submission prepared (simulated). Not delivered to any government system.', nextStates: ['Submitted', 'Acknowledged or Rejected'], correlationId: cid() });
  }
  function status(p) {
    var m = missing(p, ['registrationRef']); if (m.length) return fail(400, 'VALIDATION_FAILED', 'registrationRef is required.', m);
    if (!/^REG-\d{6}$/.test(String(p.registrationRef))) return fail(422, 'INVALID_DATA', 'registrationRef is not in the expected format.', [{ path: 'registrationRef', message: 'must look like REG-900001 (illustrative format)' }]);
    var r = REGS[p.registrationRef]; if (!r) return fail(404, 'REGISTRATION_NOT_FOUND', 'No sandbox registration ' + p.registrationRef + '. Sandbox fixtures: ' + Object.keys(REGS).join(', ') + '.');
    var b = { registrationRef: p.registrationRef, submissionStatus: r.s }; if (r.why) b.reason = r.why; b.history = r.h.slice(); b.source = 'Sandbox fixture — not a hotel record'; b.correlationId = cid(); return out(200, b);
  }
  function integ(kind) {
    return function (p) {
      var m = missing(p, ['integrationId']); if (m.length) return fail(400, 'VALIDATION_FAILED', 'integrationId is required.', m);
      if (!/^INT-\d{4}$/.test(String(p.integrationId))) return fail(422, 'INVALID_DATA', 'integrationId is not in the expected format.', [{ path: 'integrationId', message: 'must look like INT-1001 (illustrative format)' }]);
      var v = I.one(p.integrationId); if (!v) return fail(404, 'INTEGRATION_NOT_FOUND', 'No simulated integration ' + p.integrationId + '.');
      if (!v.enabled) return fail(409, 'INTEGRATION_DISABLED', v.provider + ' is disabled; enable it before testing (simulated).');
      if (v.status === 'Disconnected') {
        var ev = I.eventsFor(v.id).filter(function (e) { return e.code && e.code !== 'NONE'; })[0], c = v.offline ? 'PORTAL_OFFLINE' : ev ? ev.code : 'CONN_REFUSED';
        var st = { AUTH_EXPIRED: 401, CONN_REFUSED: 503, TIMEOUT: 504, PORTAL_OFFLINE: 503 }[c] || 502, r = fail(st, c, v.err || 'Endpoint unavailable (simulated).'); r.ms = c === 'TIMEOUT' ? 30000 : 0; return r;
      }
      var warn = v.status === 'Degraded', n = v.ops.length;
      return out(200, { integrationId: v.id, provider: v.provider, integrationStatus: v.status, outcome: warn ? 'Warning' : 'Success',
        message: warn ? (kind === 'test' ? 'Endpoint reachable, but ' + n + ' operation(s) are failing. Status unchanged.' : 'Reachable; ' + n + ' failed operation(s) pending (simulated).') : (kind === 'test' ? 'Connection successful (simulated).' : 'All checks passed (simulated).'), credentials: 'masked — never returned', correlationId: cid() });
    };
  }

  /* ---------- endpoints and example cases (all values synthetic; build() runs at load time) ---------- */
  function reg(x) { return Object.assign({ registrationRef: 'REG-241100', establishmentId: 'PIL-001', guest: { fullName: 'Ana Sample', nationality: 'Brazil', dateOfBirth: '1988-04-11' }, document: { type: docTypes()[0], number: 'XX0000001' }, stay: { arrival: '2026-10-19', nights: 2, room: '112' } }, x || {}); }
  function inactive() { var e = (R.ests || []).filter(function (x) { return x.status !== 'Active'; })[0]; return e ? e.id : 'PIL-006'; }
  function C(id, label, expect, build) { return { id: id, label: label, expect: expect, build: build }; }
  var EP = [
    { id: 'submit-registration', name: 'Submit guest registration', method: 'POST', path: '/illustrative/registrations', fn: submit, purpose: 'Report a checked-in guest to the simulated government interface.', cases: [
      C('valid', 'Valid registration', '202 Accepted — Pending', reg),
      C('missing', 'Missing required fields', '400 — lists each missing field', function () { var r = reg(); delete r.document.number; delete r.stay; return r; }),
      C('invalid', 'Invalid data', '422 — lists each invalid value', function () { return reg({ guest: { fullName: 'Ana Sample', nationality: 'Brazil', dateOfBirth: '11/04/1988' }, document: { type: 'Library card', number: 'XX0000001' }, stay: { arrival: '2026-10-19', nights: -2 } }); }),
      C('rejected', 'Document number ending in 9', '422 — Rejected by simulated interface', function () { return reg({ document: { type: docTypes()[0], number: 'XX0000009' } }); }),
      C('inactive', 'Establishment not active', '403 — only Active establishments may submit', function () { return reg({ establishmentId: inactive() }); }),
      C('unknown', 'Unknown establishment', '404', function () { return reg({ establishmentId: 'PIL-999' }); })] },
    { id: 'get-submission-status', name: 'Get submission status', method: 'GET', path: '/illustrative/registrations/{registrationRef}', fn: status, purpose: 'Read the simulated submission status and history of one registration (sandbox fixtures only).', cases: [
      C('ack', 'Acknowledged registration', '200', function () { return { registrationRef: 'REG-900001' }; }),
      C('rej', 'Rejected registration', '200 — includes reason', function () { return { registrationRef: 'REG-900002' }; }),
      C('queued', 'Queued offline registration', '200 — not delivered', function () { return { registrationRef: 'REG-900004' }; }),
      C('unknown', 'Unknown reference', '404', function () { return { registrationRef: 'REG-999999' }; }),
      C('badfmt', 'Invalid reference format', '422', function () { return { registrationRef: 'ABC' }; }),
      C('missing', 'Missing reference', '400', function () { return {}; })] },
    { id: 'test-connection', name: 'Test integration connection', method: 'POST', path: '/illustrative/integrations/test-connection', fn: integ('test'), purpose: 'Check a simulated PMS integration. Reads the Integration Dashboard records; changes nothing.', cases: [
      C('ok', 'Connected integration', 'Seeded: 200 Success', function () { return { integrationId: 'INT-1001' }; }),
      C('degraded', 'Degraded integration', 'Seeded: 200 Warning', function () { return { integrationId: 'INT-1002' }; }),
      C('expired', 'Unavailable — credentials expired', 'Seeded: 401 AUTH_EXPIRED', function () { return { integrationId: 'INT-1004' }; }),
      C('unreachable', 'Unavailable — host unreachable', 'Seeded: 503 CONN_REFUSED', function () { return { integrationId: 'INT-1008' }; }),
      C('disabled', 'Disabled integration', 'Seeded: 409', function () { return { integrationId: 'INT-1010' }; }),
      C('unknown', 'Unknown integration', '404', function () { return { integrationId: 'INT-9999' }; }),
      C('missing', 'Missing integrationId', '400', function () { return {}; })] },
    { id: 'health-check', name: 'Run health check', method: 'POST', path: '/illustrative/integrations/health-check', fn: integ('health'), purpose: 'Evaluate a simulated integration’s health. Read-only; no event is recorded.', cases: [
      C('ok', 'Healthy integration', 'Seeded: 200 Success', function () { return { integrationId: 'INT-1001' }; }),
      C('degraded', 'Degraded integration', 'Seeded: 200 Warning', function () { return { integrationId: 'INT-1006' }; }),
      C('down', 'Unavailable integration', 'Seeded: 401 AUTH_EXPIRED', function () { return { integrationId: 'INT-1004' }; }),
      C('missing', 'Missing integrationId', '400', function () { return {}; })] }
  ];
  function ep(id) { return EP.filter(function (e) { return e.id === id; })[0]; }
  function cs(e, id) { return e.cases.filter(function (c) { return c.id === id; })[0] || e.cases[0]; }

  /* ---------- request evaluation ---------- */
  function jsonError(text, e) {
    var msg = String(e && e.message || 'Invalid JSON'), line, col, m = /position (\d+)/.exec(msg), l = /line (\d+) column (\d+)/.exec(msg);
    if (l) { line = +l[1]; col = +l[2]; } else if (m) { var pre = text.slice(0, +m[1]).split('\n'); line = pre.length; col = pre[pre.length - 1].length + 1; }
    msg = msg.replace(/\s*in JSON at position.*$/, '').replace(/\s*\(line \d+ column \d+\)/, '').replace(/^JSON\.parse: /, '');
    if (!line) msg = msg.replace(/,\s*"[\s\S]*" is not valid JSON$/, '') + ' — check quotes, commas and braces.';
    return { line: line, column: col, message: msg };
  }
  function simulate(epId, text) {
    var e = ep(epId), r;
    if (!text.trim()) { r = fail(400, 'EMPTY_BODY', 'The request body is empty. Enter a JSON object or choose an example.'); r.inline = ['The body is empty.']; return r; }
    var p; try { p = JSON.parse(text); } catch (x) { var j = jsonError(text, x); r = fail(400, 'INVALID_JSON', 'The request body is not valid JSON.', [{ path: '(body)', message: j.message, line: j.line, column: j.column }]); r.inline = [(j.line ? 'Line ' + j.line + ', column ' + j.column + ': ' : '') + j.message]; return r; }
    if (!isObj(p)) { r = fail(400, 'INVALID_BODY', 'The request body must be a JSON object.'); r.inline = ['The body must be a JSON object ({ … }).']; return r; }
    return e.fn(p);
  }

  /* ---------- headers (synthetic only; values are never echoed) ---------- */
  function parseHeaders(t) {
    var errs = [], map = {};
    t.split('\n').forEach(function (ln, i) {
      if (!ln.trim()) return; var m = /^([A-Za-z0-9-]+):\s*(.*)$/.exec(ln.trim());
      if (!m) { errs.push('Line ' + (i + 1) + ' must look like “Header-Name: value”.'); return; }
      var n = m[1].toLowerCase(); map[n] = m[2];
      if (n === 'authorization' ? m[2] !== TOKEN : /^(x-api-key|api-key|apikey|cookie|set-cookie|proxy-authorization)$/i.test(n)) errs.push('Line ' + (i + 1) + ': real credentials must never be entered here. Keep “Authorization: ' + TOKEN + '” or remove the line; the value was not used.');
    });
    return { errs: errs, map: map };
  }

  /* ---------- state ---------- */
  var st;
  function fresh() { st = { ep: 'submit-registration', cs: '', body: '', hdr: HDR0, resp: null, busy: false, err: null, recent: [], tok: 0, ms: 0 }; }
  function load(epId, csId) { var e = ep(epId) || EP[0], c = cs(e, csId); st.ep = e.id; st.cs = c.id; st.body = D.json(c.build()); st.hdr = HDR0; st.err = null; st.resp = null; }
  function reset() { var t = st ? st.tok + 1 : 1; fresh(); st.tok = t; }
  fresh();

  /* ---------- rendering ---------- */
  function tone(s) { return s < 300 ? 'success' : s < 500 ? 'warning' : 'danger'; }
  function reqBody() {
    var e = ep(st.ep), c = cs(e, st.cs), get = e.method === 'GET';
    return UI.select({ id: 'sb-ep', label: 'Endpoint', options: EP.map(function (x) { return { value: x.id, label: x.name }; }), value: st.ep }) +
      '<div class="dp-reqline" style="margin:var(--sp-3) 0"><span class="dp-method m-' + e.method + '" title="Illustrative HTTP method">' + e.method + '</span><code class="dp-inline">' + esc(e.path) + '</code></div>' +
      '<p class="hint" style="margin-bottom:var(--sp-3)">' + UI.badge('Illustrative path — pending confirmation', 'warning', { dot: false }) + ' ' + esc(e.purpose) + ' <a href="' + D.BASE + '/api">View API reference</a></p>' +
      UI.select({ id: 'sb-case', label: 'Example case', options: e.cases.map(function (x) { return { value: x.id, label: x.label }; }), value: c.id, hint: (/^Seeded: /.test(c.expect) ? 'Seeded expectation: ' + c.expect.slice(8) + ' (with unchanged demo data; the sandbox reads live simulated state).' : 'Expected: ' + c.expect + '.') }) +
      '<div class="dp-editor" style="margin-top:var(--sp-3)">' + UI.textarea({ id: 'sb-body', label: get ? 'Parameters (JSON — would be path or query values in a real API)' : 'Request body (JSON)', value: st.body, hint: 'Synthetic data only. Never paste real guest data or credentials.' }) + '</div>' +
      '<div id="sb-err" role="alert">' + errHtml() + '</div>' +
      '<details class="dp-hdrs"' + (st.err && st.err.hdr ? ' open' : '') + '><summary>Request headers (synthetic)</summary><div class="dp-editor">' + UI.textarea({ id: 'sb-hdr', label: 'Headers, one per line', value: st.hdr, hint: 'The authorisation value is a fixed placeholder; no authentication is performed.' }) + '</div></details>' +
      '<div class="row" style="margin-top:var(--sp-4)">' + UI.button({ label: st.busy ? 'Sending…' : 'Send request', icon: 'send', variant: 'primary', action: 'sb-send', disabled: st.busy }) + UI.button({ label: 'Format JSON', variant: 'secondary', action: 'sb-format' }) + UI.button({ label: 'Load example', icon: 'download', variant: 'secondary', action: 'sb-load' }) + UI.button({ label: 'Reset', icon: 'refresh', variant: 'ghost', action: 'sb-reset' }) + '</div>';
  }
  function errHtml() { return st.err ? '<div class="alert danger" style="margin-top:var(--sp-3)">' + M.icon('alert') + '<div><strong>' + esc(st.err.title) + '</strong><ul style="margin:4px 0 0;padding-left:18px">' + st.err.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>' : ''; }
  function respHtml() {
    if (st.busy) return '<div class="dp-busy" role="status"><span class="dp-spin" aria-hidden="true"></span><span>Processing simulated request…</span></div>';
    var r = st.resp, e = ep(st.ep);
    var recent = st.recent.length ? '<h4 style="margin:var(--sp-5) 0 var(--sp-2);font-size:var(--fs-sm)">Recent simulated requests (this session)</h4><ul class="dp-recent">' + st.recent.map(function (x) { return '<li><span class="dp-method m-' + x.m + '">' + x.m + '</span> <code class="dp-inline">' + esc(x.p) + '</code> ' + UI.badge(String(x.s), tone(x.s), { dot: false }) + '</li>'; }).join('') + '</ul>' : '';
    if (!r) return UI.empty({ icon: 'send', title: 'No response yet', body: 'Choose an example and select Send request. The simulated response appears here.' }) + recent;
    var ms = r.ms === 30000 ? '30.0 s (simulated timeout)' : '≈ ' + st.ms + ' ms (simulated)';
    return '<div class="row" style="margin-bottom:var(--sp-3)" id="sb-status" tabindex="-1">' + UI.badge(r.status + ' ' + r.text, tone(r.status), { dot: false }) + UI.badge('Simulated', 'info', { dot: false }) + '<span class="muted" style="font-size:var(--fs-sm)">' + esc(ms) + '</span></div>' +
      '<p class="hint" style="margin-bottom:var(--sp-3)">' + esc(e.method + ' ' + e.path) + ' — evaluated locally. No network request was made and no prototype data changed.</p>' +
      D.code('Response body (simulated)', D.json(r.body)) + D.code('Response headers (simulated)', ['Content-Type: application/json', 'Cache-Control: no-store', 'X-Msafiri-Simulated: true', 'X-Correlation-Id: ' + ((r.body.error && r.body.error.correlationId) || r.body.correlationId || 'SIM-00000')].join('\n')) + recent;
  }
  function render(ctx) {
    if (!D.ok()) return D.head('', 'API / Developer Portal', '') + '<div class="stack">' + D.crash() + '</div>';
    var want = ctx.sub2, note = '';
    if (want && ep(want)) { if (st.ep !== want || !st.body) load(want, ''); } else if (want) note = UI.alert('warning', 'Unknown sandbox entry “' + esc(want) + '”.', 'Showing the default endpoint instead. Choose an endpoint from the list.');
    if (!st.body) load(st.ep, '');
    return D.head('Sandbox', 'API sandbox & request simulator', 'Edit an illustrative request, send it and read a simulated response.') + D.subnav('sandbox') +
      '<div class="stack">' + UI.alert('orange', 'Simulated sandbox — nothing is sent.', 'Requests are evaluated by JavaScript in this browser tab. No guest data is transmitted, no PMS, government or production API is contacted, and prototype data is not changed. Methods, paths and schemas are <strong>illustrative placeholders pending confirmation against the URS</strong> (not available to this build), not a defined contract.') + note +
      '<div class="grid cols-2" style="align-items:start">' + UI.card({ title: 'Request', subtitle: 'Illustrative · synthetic data', body: '<div id="sb-reqbody">' + reqBody() + '</div>' }) +
      UI.card({ title: 'Simulated response', subtitle: 'Status, body and response time are all simulated', actions: UI.button({ label: 'Clear response', size: 'sm', variant: 'ghost', action: 'sb-clear' }), body: '<div id="sb-resp" aria-live="polite">' + respHtml() + '</div>' }) + '</div></div>';
  }

  /* ---------- behaviour ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function sendBtn() { return document.querySelector('[data-action="sb-send"]'); }
  function sync() { var b = $('sb-body'), h = $('sb-hdr'); if (b) st.body = b.value; if (h) st.hdr = h.value; }
  function paintResp() { var r = $('sb-resp'); if (r) r.innerHTML = respHtml(); }
  function paintReq(focusId) { var r = $('sb-reqbody'); if (!r) return; r.innerHTML = reqBody(); wire(); if (focusId && $(focusId)) $(focusId).focus(); }
  function mark() { var b = $('sb-body'); if (b) { if (st.err && !st.err.hdr) b.setAttribute('aria-invalid', 'true'); else b.removeAttribute('aria-invalid'); } var s = sendBtn(); if (s) { s.disabled = st.busy; } }
  function setErr(err) { st.err = err; var el = $('sb-err'); if (el) el.innerHTML = errHtml(); mark(); }
  function wire() {
    var e1 = $('sb-ep'), c1 = $('sb-case'), b = $('sb-body'), h = $('sb-hdr');
    if (e1) e1.addEventListener('change', function () { st.tok++; st.busy = false; load(e1.value, ''); history.replaceState(null, '', D.BASE + '/sandbox/' + st.ep); paintReq('sb-ep'); paintResp(); });
    if (c1) c1.addEventListener('change', function () { st.tok++; st.busy = false; load(st.ep, c1.value); paintReq('sb-case'); paintResp(); });
    if (b) b.addEventListener('input', function () { st.body = b.value; if (st.err && !st.err.hdr) setErr(null); });
    if (h) h.addEventListener('input', function () { st.hdr = h.value; if (st.err && st.err.hdr) setErr(null); });
    mark();
  }
  A.on('sb-format', function () {
    sync(); try { var p = JSON.parse(st.body); st.body = D.json(p); $('sb-body').value = st.body; setErr(null); M.toast.info('JSON formatted', 'Whitespace only; content unchanged.'); }
    catch (x) { var j = jsonError(st.body, x); setErr({ title: 'Cannot format: invalid JSON', items: [(j.line ? 'Line ' + j.line + ', column ' + j.column + ': ' : '') + j.message] }); }
  });
  A.on('sb-load', function () { st.tok++; st.busy = false; var c = $('sb-case'); load(st.ep, c ? c.value : st.cs); paintReq(); var sb = sendBtn(); if (sb) sb.focus(); paintResp(); M.toast.success('Example loaded', cs(ep(st.ep), st.cs).label + ' (synthetic).'); });
  A.on('sb-reset', function () { reset(); load(st.ep, ''); history.replaceState(null, '', D.BASE + '/sandbox'); paintReq('sb-ep'); paintResp(); M.toast.info('Sandbox reset', 'Endpoint, request, headers and response restored.'); });
  A.on('sb-send', function () {
    if (st.busy) return; sync();
    var h = parseHeaders(st.hdr);
    if (h.errs.length) { setErr({ title: 'Request headers not sent', items: h.errs, hdr: true }); var d = document.querySelector('.dp-hdrs'); if (d) d.open = true; var t = $('sb-hdr'); if (t) t.focus(); return; }
    setErr(null);
    var tok = ++st.tok, e = ep(st.ep), result = simulate(st.ep, st.body), cp = h.map['x-correlation-id'];
    if (cp && /^[A-Za-z0-9-]{1,40}$/.test(cp) && result.body) { if (result.body.error) result.body.error.correlationId = cp; else if (result.body.correlationId) result.body.correlationId = cp; }
    st.busy = true; st.resp = null; paintResp(); mark(); var sb = sendBtn(); if (sb) sb.querySelector('span').textContent = 'Sending…';
    setTimeout(function () {
      if (tok !== st.tok) return;
      st.busy = false; st.resp = result; st.ms = 90 + ((st.body.length * 31 + seq * 17) % 620);
      st.recent.unshift({ m: e.method, p: e.path, s: result.status }); st.recent = st.recent.slice(0, 5);
      paintResp(); mark(); var s2 = sendBtn(); if (s2) s2.querySelector('span').textContent = 'Send request';
      if (result.inline) setErr({ title: 'Request body is not valid', items: result.inline });
      var f = $('sb-status'); if (f) f.focus({ preventScroll: false });
    }, 700);
  });
  A.on('sb-clear', function () { st.resp = null; paintResp(); });

  M.sandbox = { render: render, mount: function () { wire(); }, has: function (id) { return !!ep(id); }, EP: EP, simulate: simulate, reset: reset };
  M.resetHandlers = M.resetHandlers || []; M.resetHandlers.push(reset);
})(window);
