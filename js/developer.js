/* Msafiri — Stage 5B.1: Developer Portal foundation (#/admin/developer[/docs|/api|/sandbox[/<entry-id>]|/webhooks]). Sandbox UI: js/sandbox.js (Stage 5B.2).
   READ-ONLY, SYNTHETIC documentation. This build contains NO HTTP API: there is no fetch/XHR, server or OpenAPI document anywhere in the code base.
   Every request/response below is therefore ILLUSTRATIVE and SUBJECT TO SPECIFICATION. "Simulated" entries describe in-browser behaviour that really
   exists (Msafiri.store / Msafiri.integ) but is not an HTTP endpoint. URS v2.0 was not supplied to this build: no URS IDs are cited and no contract is reproduced. */
(function (g) {
  'use strict';
  var M = g.Msafiri, UI = M.UI, esc = M.esc, R = M.dir, I = M.integ, BASE = '#/admin/developer';
  R.GUARDS['admin/developer'] = 'integrations:read'; /* same read permission as the Integration Dashboard */

  var SECTIONS = [['', 'Overview', 'grid'], ['docs', 'Integration documentation', 'file'], ['api', 'API reference', 'list'], ['sandbox', 'Sandbox', 'wrench'], ['webhooks', 'Webhooks', 'send']];
  var KIND = { sim: ['Simulated in prototype', 'info'], ill: ['Illustrative · subject to specification', 'warning'] };
  var TBD = 'Not defined — to be specified';

  /* ---------- helpers ---------- */
  function json(o) { return JSON.stringify(o, null, 2); }
  function code(label, text) { return '<p class="dp-code-label">' + esc(label) + '</p><pre class="dp-code" tabindex="0" aria-label="' + esc(label) + '"><code>' + esc(text) + '</code></pre>'; }
  function kv(rows) { return '<dl class="kv">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + (r[2] ? r[1] : esc(r[1])) + '</dd>'; }).join('') + '</dl>'; }
  function inl(t) { return '<code class="dp-inline">' + esc(t) + '</code>'; }
  function table(cap, head, rows) {
    return '<div class="table-wrap"><table class="dt"><caption class="sr-only">' + esc(cap) + '</caption><thead><tr>' + head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  var BANNER = UI.alert('orange', 'Illustrative documentation — no real API.', 'This prototype has no HTTP API, no OpenAPI document and no external connectivity. Examples use synthetic data and are <strong>illustrative and subject to specification</strong>. Nothing here is a production contract.');
  var URS_NOTE = UI.alert('warning', 'URS v2.0 not available to this build.', 'The URS document was not included in the upload (as in earlier stages), so no URS requirement IDs are cited and no URS-defined API contract is reproduced. Reconcile every page here with the URS before client use.');
  function ok() { return !!(I && I.recs && I.events); }
  function head(crumb, title, desc) {
    return UI.pageHead({ crumbs: [{ label: 'System Administration', href: '#/admin/dashboard' }, { label: 'API / Developer Portal', href: crumb ? BASE : undefined }].concat(crumb ? [{ label: crumb }] : []), title: title, description: desc });
  }
  function subnav(cur) {
    return '<nav class="dp-nav" aria-label="Developer Portal sections">' + SECTIONS.map(function (s) {
      return '<a href="' + BASE + (s[0] ? '/' + s[0] : '') + '"' + (s[0] === cur ? ' aria-current="page"' : '') + '>' + M.icon(s[2], { size: 16 }) + esc(s[1]) + '</a>';
    }).join('') + '</nav>';
  }
  function crash() { return UI.card({ body: UI.empty({ icon: 'alert', title: 'Integration data could not be loaded', body: 'The simulated integration module did not initialise, so live counts are unavailable. Reload the page or use “Reset demo data” in the user menu.', actions: UI.button({ label: 'Back to dashboard', variant: 'primary', href: '#/admin/dashboard' }) }) }); }

  /* ---------- synthetic samples (illustrative shapes; values mirror real prototype wording where marked) ---------- */
  var S = {
    regReq: { registrationRef: 'REG-241100', establishmentId: 'PIL-001', guest: { fullName: 'Ana Sample', nationality: 'Brazil', dateOfBirth: '1988-04-11' }, document: { type: 'Passport', number: 'XX0000000' }, stay: { arrival: '2026-10-19', nights: 2, room: '112' } },
    regRes: { registrationRef: 'REG-241100', submissionStatus: 'Pending', message: 'Submission prepared (simulated). Not delivered to any government system.' },
    stReq: { registrationRef: 'REG-241100' },
    stRes: { registrationRef: 'REG-241100', submissionStatus: 'Rejected', reason: 'Document number format not accepted (synthetic example)', history: ['Submission prepared — Pending (simulated)', 'Sent to simulated government interface', 'Rejected by simulated interface: Document number format not accepted (synthetic example)'] },
    intRes: { integrationId: 'INT-1002', provider: 'RoomWave Cloud', establishmentId: 'PIL-004', status: 'Degraded', lastSuccessfulSync: '2026-10-19T02:10:00Z', failedOperations: 1, lastError: { code: 'TIMEOUT', message: 'Timeout after 30 s fetching arrivals (simulated).' }, credentials: 'masked — never returned' },
    testRes: { integrationId: 'INT-1002', outcome: 'Warning', message: 'Endpoint reachable, but 1 operation(s) are failing. Status unchanged.', correlationId: 'SIM-00000' },
    healthRes: { integrationId: 'INT-1001', outcome: 'Success', message: 'All checks passed (simulated).', correlationId: 'SIM-00000' },
    retryReq: { integrationId: 'INT-1002', operationId: 'INT-1002-OP1' },
    retryRes: { integrationId: 'INT-1002', outcome: 'Failed', code: 'RETRY_FAILED', message: 'Retry of “Arrivals fetch (timeout)” failed (simulated).' },
    evReq: { integrationId: 'INT-1004', severity: 'Critical' },
    evRes: { total: 2, events: [{ id: 'EVT-0042', type: 'Connect', outcome: 'Failed', severity: 'Critical', code: 'AUTH_EXPIRED', message: 'Authentication rejected: credentials expired (simulated).', recordedBy: 'Demo administrator (seed)' }] },
    errAuth: { error: { code: 'AUTH_EXPIRED', message: 'Authentication rejected: credentials expired (simulated).', correlationId: 'SIM-00000' } },
    errConn: { error: { code: 'CONN_REFUSED', message: 'Connection refused by simulated endpoint (host unreachable).', correlationId: 'SIM-00000' } },
    errRej: { registrationRef: 'REG-241100', submissionStatus: 'Rejected', reason: 'Document number format not accepted (synthetic example)', next: 'Correct the record, then retry submission' },
    pullReq: { integrationId: 'INT-1001', arrivalDate: '2026-10-19' },
    pullRes: { count: 1, reservations: [{ pmsReference: 'RSV-0001', guestName: 'Ana Sample', arrival: '2026-10-19', nights: 2, room: '112' }] },
    pushReq: { integrationId: 'INT-1001', registrationRef: 'REG-241100' },
    pushRes: { registrationRef: 'REG-241100', pmsAcknowledged: true },
    roomReq: { integrationId: 'INT-1009', rooms: [{ room: '112', status: 'Occupied' }, { room: '113', status: 'Vacant clean' }] },
    roomRes: { accepted: 2, rejected: 0 },
    stayEv: { integrationId: 'INT-1001', event: 'check-out', registrationRef: 'REG-241100', occurredAt: '2026-10-21T08:30:00Z' },
    stayRes: { received: true },
    hook: { event: 'integration.status_changed', integrationId: 'INT-1002', from: 'Connected', to: 'Degraded', occurredAt: '2026-10-19T02:10:00Z' },
    hookRes: { received: true }
  };

  /* Error catalogue: codes that appear in the prototype's simulated integration events (integrations.js). */
  var ERR = [
    ['AUTH_EXPIRED', 'Credentials were rejected as expired (seeded for INT-1004).', 'Renew credentials, then run Test connection.'],
    ['CONN_REFUSED', 'Endpoint unreachable or connection refused (seeded for INT-1008).', 'Retry later; manual entry stays available.'],
    ['TIMEOUT', 'No response within 30 s (seeded for INT-1002).', 'Retry the failed operation.'],
    ['RATE_LIMIT', 'Provider throttled requests; a retry succeeded in the seeded example.', 'Back off, then retry.'],
    ['PARTIAL_PAYLOAD', 'Payload received but some records lacked required fields (INT-1006).', 'Review incomplete records.'],
    ['SCHEMA_DRIFT', 'An unknown field was received and ignored (INT-1007).', 'Review provider schema change.'],
    ['DUPLICATE_REF', 'A duplicate reservation reference was skipped (INT-1010).', 'No action usually needed.'],
    ['PORTAL_OFFLINE', 'The Hotel Portal simulated offline mode is on (Demo Hotel A).', 'Restore connection; queued records synchronise.'],
    ['RETRY_FAILED', 'A retried operation failed again.', 'Investigate before retrying.']
  ];
  function seenCodes() { var o = {}; ((I && I.events) || []).forEach(function (e) { if (e.code) o[e.code] = 1; }); return o; }

  /* ---------- API reference entries ---------- */
  /* kind: sim = behaviour that exists in-browser; ill = capability named in the prototype but with no behaviour. Method/path are never given: none is defined by code or (unread) URS. */
  var API = [
    { id: 'submit-registration', name: 'Submit guest registration', kind: 'sim', cap: 'Government reporting', purpose: 'Report a checked-in guest to the (simulated) government interface. Result is Pending, then Submitted, then Acknowledged or Rejected.',
      beh: 'Hotel Portal › Guest Registration. In-browser function Msafiri.store.submit; no network call. Demo rule: a document number ending in 9 is rejected once.', where: null, req: S.regReq, res: S.regRes,
      errs: ['Validation failure — required field missing or malformed (form-level in prototype)', 'Rejected — document number format not accepted (synthetic)', 'Queued offline — connection unavailable, record held locally (not delivered)'] },
    { id: 'get-submission-status', name: 'Get submission status', kind: 'sim', cap: 'Government reporting', purpose: 'Read the current submission status and history of one registration.',
      beh: 'Hotel Portal › Submission Status & History; Government Portal › Submission & Data Quality. Statuses: Pending, Submitted, Acknowledged, Rejected, Queued offline.', where: null, req: S.stReq, res: S.stRes,
      errs: ['Not found — unknown registration reference (illustrative)', 'Rejected — includes a reason; Retry is available in the Hotel Portal'] },
    { id: 'test-connection', name: 'Test integration connection', kind: 'sim', cap: 'Integration management', purpose: 'Check whether a PMS integration endpoint is reachable and credentials are accepted.',
      beh: 'Integration details › Test connection (needs integrations:admin). 0.9 s scripted local simulation.', where: ['#/admin/pms-health', 'Integration Dashboard'], req: { integrationId: 'INT-1002' }, res: S.testRes,
      errs: ['AUTH_EXPIRED — INT-1004 always fails', 'CONN_REFUSED — INT-1008 fails once', 'Warning — reachable but operations failing (INT-1002, INT-1006)'] },
    { id: 'health-check', name: 'Run health check', kind: 'sim', cap: 'Integration management', purpose: 'Evaluate integration health (Connected, Degraded, Disconnected, Attention Required) and record the result.',
      beh: 'Integration details › Health. Scripted; INT-1007 reveals schema drift on its first check. No live monitoring.', where: ['#/admin/pms-health', 'Integration Dashboard'], req: { integrationId: 'INT-1001' }, res: S.healthRes,
      errs: ['SCHEMA_DRIFT — INT-1007, first check', 'Blocked — action not valid for the integration state (disabled with a reason in the UI)'] },
    { id: 'retry-operation', name: 'Retry failed operation', kind: 'sim', cap: 'Integration management', purpose: 'Re-attempt an operation that failed, such as an arrivals fetch or a guest-data push.',
      beh: 'Integration details › Failed operations. INT-1002 and INT-1006 contain a retry that fails once, then succeeds.', where: ['#/admin/pms-health/INT-1002', 'INT-1002 details'], req: S.retryReq, res: S.retryRes,
      errs: ['RETRY_FAILED — the retried operation failed again', 'Blocked — no failed operation to retry'] },
    { id: 'list-events', name: 'List integration events', kind: 'sim', cap: 'Monitoring', purpose: 'Read the simulated event history with filters for integration, type, severity and status.',
      beh: 'Integration Event History: search, filters, pagination and a diagnostics dialog. One shared in-memory list.', where: ['#/admin/integration-events', 'Integration Event History'], req: S.evReq, res: S.evRes,
      errs: ['Empty result — no events match the filters (empty state in the UI)'] },
    { id: 'pull-reservations', name: 'Pull reservations', kind: 'ill', cap: 'Pull reservations', purpose: 'Illustrative: fetch expected arrivals from a PMS to prefill registration.',
      beh: 'Only the capability label and a simulated PMS prefill in the Hotel Portal registration form exist. No reservation payload is exchanged.', where: null, req: S.pullReq, res: S.pullRes,
      errs: ['TIMEOUT', 'RATE_LIMIT', 'AUTH_EXPIRED', 'PARTIAL_PAYLOAD', 'SCHEMA_DRIFT'] },
    { id: 'push-registrations', name: 'Push guest registrations', kind: 'ill', cap: 'Push guest registrations', purpose: 'Illustrative: send a completed registration back to the PMS.',
      beh: 'Capability label only. “Guest data push” appears as a failed-operation label in seeded data; nothing is pushed.', where: null, req: S.pushReq, res: S.pushRes,
      errs: ['TIMEOUT', 'AUTH_EXPIRED', 'DUPLICATE_REF'] },
    { id: 'room-status', name: 'Room status feed', kind: 'ill', cap: 'Room status feed', purpose: 'Illustrative: receive room status updates from a PMS.',
      beh: 'Capability label on “Room status feed” integration records (INT-1008, INT-1009). No feed is processed.', where: null, req: S.roomReq, res: S.roomRes,
      errs: ['CONN_REFUSED', 'PARTIAL_PAYLOAD'] },
    { id: 'stay-events', name: 'Check-in / check-out events', kind: 'ill', cap: 'Check-in / check-out events', purpose: 'Illustrative: notify Msafiri when a stay starts or ends in the PMS.',
      beh: 'Capability label only. Check-in and check-out are performed manually in the Hotel Portal.', where: null, req: S.stayEv, res: S.stayRes,
      errs: ['SCHEMA_DRIFT', 'DUPLICATE_REF'] },
    { id: 'webhook-notification', name: 'Webhook notification', kind: 'ill', cap: 'Webhook notifications', purpose: 'Illustrative: outbound notification of an integration event to a subscriber.',
      beh: 'Simulated in the Webhooks section: illustrative configurations and simulated delivery attempts with retry. No real delivery or signing exists; event contract pending specification.', where: [BASE + '/webhooks', 'Webhooks section'], req: S.hook, res: S.hookRes,
      errs: ['Delivery failure and retry policy — not defined'] }
  ];

  function endpoint(e) {
    var kind = KIND[e.kind];
    return '<div class="dp-ep" id="ep-' + e.id + '" data-kind="' + e.kind + '" data-text="' + esc((e.name + ' ' + e.purpose + ' ' + e.cap).toLowerCase()) + '">' + UI.card({ title: e.name, subtitle: e.purpose,
      actions: '<div class="badges">' + UI.badge(kind[0], kind[1], { dot: false }) + '</div>',
      body: kv([['Capability', e.cap], ['HTTP method and path', TBD], ['Prototype behaviour', e.beh]].concat(e.where ? [['See in prototype', '<a href="' + e.where[0] + '">' + esc(e.where[1]) + '</a>', 1]] : []).concat(M.sandbox && M.sandbox.has(e.id) ? [['Sandbox', '<a href="' + BASE + '/sandbox/' + e.id + '">Try this in the sandbox (simulated)</a>', 1]] : [])) +
        '<div class="grid cols-2" style="margin-top:var(--sp-4)"><div>' + code('Example request (illustrative)', json(e.req)) + '</div><div>' + code('Example response (illustrative)', json(e.res)) + '</div></div>' +
        '<h4>Relevant error cases</h4><ul>' + e.errs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' }) + '</div>';
  }

  /* ---------- pages ---------- */
  function overview() {
    var recs = I.recs, provs = recs.reduce(function (a, r) { return a.indexOf(r.provider) < 0 ? a.concat(r.provider) : a; }, []);
    var me = R.me('admin'), role = me && R.role(me.role), canAdmin = R.can('integrations:admin', 'admin');
    var cards = [
      ['Integration documentation', 'file', 'Concepts, authentication, workflow, worked examples and error responses.', 'docs', 'Read documentation'],
      ['API reference', 'list', API.length + ' entries, each marked as simulated in the prototype or illustrative only.', 'api', 'Open API reference'],
      ['Sandbox', 'wrench', 'Try illustrative requests and read simulated responses. No request leaves the browser.', 'sandbox', 'Open sandbox'],
      ['Webhooks', 'send', 'Manage illustrative webhook configurations and simulate delivery attempts. Nothing is sent; no signing.', 'webhooks', 'Manage webhooks']];
    var capRows = (I.CAPS || []).map(function (c, i) {
      var n = recs.filter(function (r) { return I.CAPMAP[r.type] && I.CAPMAP[r.type][i]; }).length;
      var sim = i === 0;
      return ['<strong>' + esc(c) + '</strong>', String(n) + ' of ' + recs.length, esc(sim ? 'Simulated PMS prefill in Hotel Portal registration; capability label on integration details.' : 'Capability label on integration details only.'), UI.badge(sim ? 'Partly simulated' : 'Label only', sim ? 'info' : 'neutral', { dot: false })];
    });
    return head('', 'API / Developer Portal', 'Foundation for integration documentation and API reference. Read-only, synthetic and illustrative.') +
      subnav('') + '<div class="stack">' + BANNER + URS_NOTE +
      '<div class="grid cols-4">' + [
        { label: 'Implemented HTTP endpoints', value: 0, icon: 'lock', tone: 'orange', foot: 'none in this build — verified' },
        { label: 'API reference entries', value: API.length, icon: 'list', foot: API.filter(function (e) { return e.kind === 'sim'; }).length + ' simulated · ' + API.filter(function (e) { return e.kind === 'ill'; }).length + ' illustrative' },
        { label: 'Simulated integrations', value: recs.length, icon: 'database', foot: provs.length + ' fictional providers' },
        { label: 'Capabilities named', value: (I.CAPS || []).length, icon: 'layers', foot: 'on simulated records' }].map(UI.statCard).join('') + '</div>' +
      '<div class="grid cols-2">' + cards.map(function (c) {
        return UI.card({ body: '<div class="dp-link-card"><div class="row">' + '<span class="stat-ico" aria-hidden="true">' + M.icon(c[1]) + '</span>' + '<h3 style="font-size:var(--fs-md)">' + esc(c[0]) + '</h3></div><p>' + esc(c[2]) + '</p>' + UI.button({ label: c[4], icon: c[1], variant: c[3] === 'docs' || c[3] === 'api' ? 'primary' : 'secondary', href: BASE + '/' + c[3] }) + '</div>' });
      }).join('') + '</div>' +
      UI.card({ title: 'Integration capabilities', subtitle: 'As named on the prototype’s synthetic integration records', flush: true, body: recs.length ? table('Integration capabilities', ['Capability', 'Records listing it', 'What the prototype shows', 'Status'], capRows) : UI.empty({ icon: 'database', title: 'No simulated integration records', body: 'Use “Reset demo data” in the user menu to restore the synthetic records.' }),
        foot: 'Counts are read live from the Integration Dashboard data. Providers are fictional.' }) +
      UI.card({ title: 'Access and safety', body: kv([['Acting as', me ? me.name + ' — ' + (role ? role.name : 'no role') : 'Unknown'], ['Required permission', 'integrations:read (same as the Integration Dashboard)'], ['Simulated actions', canAdmin ? 'This role may run simulated integration actions (integrations:admin).' : 'This role is read-only; simulated actions are not available.'], ['Credentials', 'None are shown here. Masked configuration is on the integration details page.'], ['Connectivity', 'None. No request leaves the browser.']]),
        foot: 'Frontend permission checks demonstrate behaviour only and are not production security.' }) + '</div>';
  }

  function docs() {
    var recs = I.recs, provs = recs.reduce(function (a, r) { return a.indexOf(r.provider) < 0 ? a.concat(r.provider) : a; }, []);
    var toc = [['dp-overview', 'Integration overview'], ['dp-auth', 'Authentication concepts'], ['dp-workflow', 'Integration workflow'], ['dp-examples', 'Request and response examples'], ['dp-errors', 'Error responses']];
    var seen = seenCodes();
    function sec(id, title, sub, body) { return '<div class="dp-sec" id="' + id + '">' + UI.card({ title: title, subtitle: sub, body: body }) + '</div>'; }
    var flow = [['Configure the integration', 'An administrator connects and tests a PMS integration (simulated) on the Integration Dashboard.'],
      ['Receive guest or stay data', 'Reservation data may prefill the form (simulated), or staff enter it manually. Manual entry is always the fallback.'],
      ['Validate and register', 'Required fields and the document check are completed before check-in.'],
      ['Submit for reporting', 'The record becomes Pending, then Submitted to the simulated government interface.'],
      ['Acknowledged or Rejected', 'A rejection carries a reason; the record is corrected and retried. Acknowledgements are simulated.'],
      ['Offline handling', 'With no connection, records are Queued offline, never shown as delivered, and conflicts are reviewed on sync.'],
      ['Monitor', 'Health checks, event history and support incidents track integration problems (synthetic).']];
    var authRows = [['Credential type', 'Integration details list “API key + client secret”. Values appear only as masked placeholders.', UI.badge('Concept shown', 'info', { dot: false })],
      ['Expiry', 'INT-1004 is seeded with expired credentials and fails with AUTH_EXPIRED.', UI.badge('Simulated', 'info', { dot: false })],
      ['Least privilege', 'integrations:read to view, integrations:admin to run simulated actions.', UI.badge('Simulated', 'info', { dot: false })],
      ['Sensitive configuration', 'Security-relevant settings use maker-checker approval (Stage 4B).', UI.badge('Simulated', 'info', { dot: false })],
      ['No credential logging', 'Event diagnostics state “Credentials: Not logged (masked)”.', UI.badge('Simulated', 'info', { dot: false })],
      ['Token format, scopes, rotation, IP allow-listing', 'Not defined in this prototype.', UI.badge('Not defined', 'warning', { dot: false })]];
    var tabs = UI.tabs([
      { label: 'Submit registration', body: '<p class="muted" style="margin-bottom:var(--sp-3)">Prototype behaviour is in-browser only. Status wording is taken from the prototype.</p><div class="grid cols-2"><div>' + code('Request (illustrative)', json(S.regReq)) + '</div><div>' + code('Response (illustrative)', json(S.regRes)) + '</div></div>' },
      { label: 'Check submission status', body: '<div class="grid cols-2"><div>' + code('Request (illustrative)', json(S.stReq)) + '</div><div>' + code('Response (illustrative)', json(S.stRes)) + '</div></div>' },
      { label: 'Integration health', body: '<p class="muted" style="margin-bottom:var(--sp-3)">Fields mirror the synthetic integration record. Credentials are never returned.</p>' + code('Response (illustrative)', json(S.intRes)) }]);
    return head('Integration documentation', 'Integration documentation', 'How the prototype’s simulated integrations work, with illustrative examples.') + subnav('docs') +
      '<div class="stack">' + BANNER +
      UI.card({ title: 'On this page', body: '<div class="dp-toc">' + toc.map(function (t) { return UI.button({ label: t[1], size: 'sm', variant: 'secondary', action: 'dp-jump', data: { target: t[0] } }); }).join('') + '</div>' }) +
      sec('dp-overview', 'Integration overview', 'What is and is not supported', '<p style="margin-bottom:var(--sp-4);color:var(--text-2)">Msafiri lets hotels report guest registrations to government, optionally fed by a property management system (PMS). In this prototype every connection is a <strong>simulation</strong> held in the browser tab.</p>' +
        kv([['Simulated integrations', recs.length + ' records across ' + provs.length + ' fictional providers'], ['Capabilities named', (I.CAPS || []).join(' · ')], ['Statuses', 'Connected · Degraded · Disconnected'], ['Not included', 'Real PMS or government connectivity, an HTTP API, an OpenAPI document, real webhook delivery or signing, and API-key lifecycle.']])) +
      sec('dp-auth', 'Authentication concepts', 'Conceptual only — no real authentication exists', table('Authentication concepts', ['Concept', 'In the prototype', 'Status'], authRows)) +
      sec('dp-workflow', 'Integration workflow overview', 'From integration setup to government acknowledgement (all simulated)', '<ol class="dp-flow">' + flow.map(function (f) { return '<li><strong>' + esc(f[0]) + '</strong>' + esc(f[1]) + '</li>'; }).join('') + '</ol>') +
      sec('dp-examples', 'Request and response examples', 'Synthetic data · illustrative and subject to specification · no endpoint paths are defined', tabs) +
      sec('dp-errors', 'Common error responses', 'Illustrative envelope; codes appear in the prototype’s simulated events', '<div class="grid cols-2"><div>' + code('Integration error (illustrative)', json(S.errAuth)) + '</div><div>' + code('Submission rejection (illustrative)', json(S.errRej)) + '</div></div>' +
        code('Transport error (illustrative)', json(S.errConn)) +
        '<p class="muted" style="margin:var(--sp-2) 0 var(--sp-4)">HTTP status codes, retry headers and rate-limit semantics are ' + TBD.toLowerCase() + '.</p>' +
        table('Error codes seen in the prototype', ['Code', 'Meaning', 'Suggested handling', 'In current events'], ERR.map(function (e) { return [inl(e[0]), esc(e[1]), esc(e[2]), UI.badge(seen[e[0]] ? 'Yes' : 'Not currently', seen[e[0]] ? 'success' : 'neutral', { dot: false })]; }))) +
      '</div>';
  }

  function api() {
    var groups = [['sim', 'Simulated in the prototype', 'In-browser behaviour that exists today. Not HTTP endpoints.'], ['ill', 'Illustrative only', 'Capabilities named in the prototype that have no behaviour yet.']];
    return head('API reference', 'API reference', 'Readable reference layout. No entry here is an implemented endpoint.') + subnav('api') +
      '<div class="stack">' + BANNER +
      UI.alert('info', 'How to read this page.', 'HTTP methods and paths are shown as “' + esc(TBD) + '” because neither the code base nor an available URS defines them. <strong>Simulated</strong> entries describe behaviour you can try in the prototype UI. <strong>Illustrative</strong> entries are sketches only.') +
      UI.card({ body: '<div class="row" style="align-items:flex-end"><div style="flex:1;min-width:220px">' + UI.input({ id: 'dp-q', label: 'Search entries', type: 'search', icon: 'search', placeholder: 'Search by name or purpose…' }) + '</div><div style="min-width:220px">' +
        UI.select({ id: 'dp-k', label: 'Type', options: [{ value: '', label: 'All entries' }, { value: 'sim', label: 'Simulated in prototype' }, { value: 'ill', label: 'Illustrative only' }] }) + '</div></div><p class="hint" id="dp-count" role="status" aria-live="polite" style="margin-top:var(--sp-2)"></p>' }) +
      groups.map(function (gp) { return '<section class="stack" data-group="' + gp[0] + '" aria-label="' + esc(gp[1]) + '"><div><h3 style="font-size:var(--fs-lg)">' + esc(gp[1]) + '</h3><p class="muted" style="font-size:var(--fs-sm)">' + esc(gp[2]) + '</p></div>' + API.filter(function (e) { return e.kind === gp[0]; }).map(endpoint).join('') + '</section>'; }).join('') +
      '<div id="dp-empty" hidden>' + UI.card({ body: UI.empty({ icon: 'search', title: 'No entries match', body: 'Try a different search term or choose “All entries”.', actions: UI.button({ label: 'Clear filters', variant: 'secondary', action: 'dp-clear' }) }) }) + '</div></div>';
  }
  function apiMount(root) {
    var q = root.querySelector('#dp-q'), k = root.querySelector('#dp-k');
    function apply() {
      var t = q.value.trim().toLowerCase(), kd = k.value, n = 0;
      root.querySelectorAll('.dp-ep').forEach(function (el) { var show = (!kd || el.getAttribute('data-kind') === kd) && (!t || el.getAttribute('data-text').indexOf(t) > -1); el.hidden = !show; if (show) n++; });
      root.querySelectorAll('[data-group]').forEach(function (s) { s.hidden = !s.querySelector('.dp-ep:not([hidden])'); });
      root.querySelector('#dp-empty').hidden = n > 0;
      root.querySelector('#dp-count').textContent = 'Showing ' + n + ' of ' + API.length + ' entries';
    }
    q.addEventListener('input', apply); k.addEventListener('change', apply); apply();
  }

  function future(kind) {
    var sb = kind === 'sandbox', can = R.can('integrations:admin', 'admin'), n = I.recs.filter(function (r) { return sb || (I.CAPMAP[r.type] && I.CAPMAP[r.type][4]); }).length;
    var ttl = sb ? 'Sandbox' : 'Webhooks';
    var exists = sb ? [['Simulated Test connection, Health check and Retry', can ? 'Available to your role on each integration’s details page.' : 'Your role is read-only; ask a System Administrator.', '#/admin/pms-health', 'Integration Dashboard'], ['Simulated event history with diagnostics', 'Searchable list of synthetic events.', '#/admin/integration-events', 'Event history']]
      : [['“Webhook notifications” capability label', n + ' of ' + I.recs.length + ' synthetic records list it. It is a label only.', '#/admin/pms-health', 'Integration Dashboard'], ['Simulated event history', 'The nearest thing to a delivery log; events are not webhook deliveries.', '#/admin/integration-events', 'Event history']];
    var notBuilt = sb ? ['Sending requests from this page', 'Request builder or response viewer', 'Sandbox credentials or keys', 'A downloadable OpenAPI document'] : ['Creating or editing subscriptions', 'Event delivery, retries or dead-letter handling', 'Payload signing and secret rotation', 'Delivery logs'];
    return head(ttl, ttl, sb ? 'Entry point for the future API sandbox. Not implemented in this stage.' : 'Entry point for future webhook management. Not implemented in this stage.') + subnav(kind) +
      '<div class="stack">' + BANNER + UI.alert('info', 'Entry point only.', 'This section is deliberately not functional in Stage 5B.1. It may be considered in a later Stage 5B part only where the URS supports it.') +
      UI.card({ body: UI.empty({ icon: sb ? 'wrench' : 'send', title: ttl + ' is not available yet', body: sb ? 'No request can be executed from the Developer Portal. Nothing is sent anywhere.' : 'No webhook can be created or delivered. Nothing is sent anywhere.',
        actions: UI.button({ label: sb ? 'Open sandbox' : 'Manage webhooks', icon: sb ? 'wrench' : 'send', variant: 'primary', disabled: true }) + UI.button({ label: 'Integration Dashboard', icon: 'activity', variant: 'secondary', href: '#/admin/pms-health' }) }) }) +
      '<div class="grid cols-2">' + UI.card({ title: 'What exists today', subtitle: 'Simulated, in-browser', flush: true, body: exists.map(function (e) { return '<div class="list-row"><div class="grow"><div style="font-weight:600;font-size:var(--fs-sm)">' + esc(e[0]) + '</div><div class="hint">' + esc(e[1]) + '</div></div>' + UI.button({ label: e[3], size: 'sm', variant: 'secondary', href: e[2] }) + '</div>'; }).join('') }) +
      UI.card({ title: 'Not built', subtitle: 'Out of scope for Stage 5B.1', body: '<ul style="margin:0;padding-left:18px;font-size:var(--fs-sm);color:var(--text-2)">' + notBuilt.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' }) + '</div></div>';
  }

  function render(ctx) {
    if (!ok()) return head('', 'API / Developer Portal', '') + '<div class="stack">' + crash() + '</div>';
    var s = ctx.sub || '';
    if (s === '') return overview();
    if (s === 'docs') return docs();
    if (s === 'api') return api();
    if (s === 'sandbox') return M.sandbox ? M.sandbox.render(ctx) : future(s);
    if (s === 'webhooks') return M.webhooks ? M.webhooks.render(ctx) : future(s);
    return head('Section not found', 'Section not found', '') + subnav('__none') + '<div class="stack">' + UI.card({ body: UI.empty({ icon: 'search', title: 'That Developer Portal section does not exist', body: 'Choose one of the sections above.', actions: UI.button({ label: 'Developer Portal overview', variant: 'primary', href: BASE }) }) }) + '</div>';
  }

  M.actions.on('dp-jump', function (el) {
    var t = document.getElementById(el.getAttribute('data-target')); if (!t) return;
    var reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var h = t.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  M.actions.on('dp-clear', function () {
    var q = document.getElementById('dp-q'), k = document.getElementById('dp-k'); if (!q || !k) return;
    q.value = ''; k.value = ''; q.dispatchEvent(new Event('input')); q.focus();
  });

  /* Shared helpers for Stage 5B.2 (js/sandbox.js). Read-only references; nothing is duplicated. */
  M.dev = { API: API, BASE: BASE, BANNER: BANNER, KIND: KIND, head: head, subnav: subnav, code: code, json: json, kv: kv, inl: inl, ok: ok, crash: crash, future: future };

  M.pages['admin/developer'] = {
    title: function (ctx) { var f = SECTIONS.filter(function (s) { return s[0] === (ctx.sub || ''); })[0]; return f && f[0] ? f[1] + ' · Developer Portal' : 'API / Developer Portal'; },
    render: render,
    mount: function (root, ctx) { if (!ok()) return; if (ctx.sub === 'api') apiMount(root); else if (ctx.sub === 'sandbox' && M.sandbox) M.sandbox.mount(root, ctx); else if (ctx.sub === 'webhooks' && M.webhooks) M.webhooks.mount(root, ctx); }
  };
})(window);

/* Stage 7.2: the "OpenAPI & Sandbox" nav item opens the existing sandbox instead of a placeholder. */
(function (g) {
  var M = g.Msafiri;
  M.pages['admin/sandbox'] = { title: 'OpenAPI & Sandbox', render: function () { return '<p class="muted">Opening the API sandbox…</p>'; }, mount: function () { location.replace('#/admin/developer/sandbox'); } };
})(window);
