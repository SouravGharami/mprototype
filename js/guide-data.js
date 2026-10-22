/* Msafiri — Guided journey content.
   Pure data: no behaviour. Read by js/guide.js.

   Msafiri.guide.modules['<portal>/<page id>'] = {
     purpose : one plain sentence — what the module is FOR (shown first in every tour),
     logic   : [ the unique rules implemented in this module — shown last in the tour and in the Guide Hub ],
     steps   : [ { at: target, t: title, b: body (trusted HTML), tip?: short "try this" hint } ]
   }
   Target syntax for `at` (string, or array of fallbacks tried in order; no match => centred card):
     'card:Title'   a .card whose heading contains Title      'btn:Label'  a button/link in the page containing Label
     'nav:id'       a sidebar item (desktop only)             anything else = CSS selector inside <main>
   To add a guide for a new module: add one entry here — nothing else is required. */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});
  var G = (M.guide = M.guide || {});

  /* ---------- Welcome intro (first visit) ---------- */
  G.journey = [
    { n: 1, icon: 'user', t: 'A guest arrives', s: 'At a hotel front desk with a passport or ID.' },
    { n: 2, icon: 'id-card', t: 'Hotel registers & checks', s: 'Details entered or scanned, original document physically checked.' },
    { n: 3, icon: 'send', t: 'Reported to government', s: 'Status moves Pending → Submitted → Acknowledged (or Rejected).' },
    { n: 4, icon: 'shield-check', t: 'Government oversees', s: 'Monitors, searches under strict rules, and administrators govern the platform.' }
  ];
  G.portalsIntro = [
    { id: 'hotel', icon: 'building', t: 'Hotel Portal', s: 'Front-desk staff register guests, complete check-in, follow every submission and keep working even when offline.', who: 'Receptionist · Hotel manager' },
    { id: 'gov', icon: 'shield-check', t: 'Government Portal', s: 'Officers see national figures, monitor establishments and data quality, and search guest records only for a stated purpose.', who: 'Government officer · Auditor' },
    { id: 'admin', icon: 'sliders', t: 'System Administration', s: 'Administrators manage users, roles, reference data, settings, integrations and incidents — with approvals and audit trails.', who: 'System administrator · Support' }
  ];
  G.rules = [
    { icon: 'check-circle', t: 'No check-in without a document check', s: 'The receptionist must confirm they physically checked the original document before a guest can be checked in.' },
    { icon: 'lock', t: 'Sensitive data is masked by default', s: 'Government search needs a purpose and a case number. Names and document numbers stay hidden until a justified, logged, single-record unmask.' },
    { icon: 'refresh', t: 'Offline-first, never overwritten silently', s: 'When the connection drops, records queue locally. If the server disagrees, a person chooses which value to keep — and the choice is logged.' },
    { icon: 'key', t: 'Two people for sensitive changes', s: 'Security-relevant settings and exceptional access use maker-checker: the person who proposes cannot be the one who approves.' },
    { icon: 'info', t: 'Everything here is simulated', s: 'Synthetic data and simulated integrations. Nothing is sent to a real government, PMS or webhook destination.' }
  ];

  /* ---------- Per-module guides ---------- */
  var m = (G.modules = {});

  /* ======================= HOTEL PORTAL ======================= */
  m['hotel/dashboard'] = {
    purpose: 'Your front-desk control room: who is arriving today, how many records reached government, and what needs your attention.',
    logic: [
      'Every number is calculated live from the same shared guest records — register a guest and the counters, chart and donut change.',
      'The donut only counts records that already have a simulated submission status.',
      'The “Connections & mode” card flips to Offline when you simulate a lost connection.'
    ],
    steps: [
      { at: '.page-head .actions', t: 'Start from the orange button', b: '<b>New registration</b> begins the main workflow. This is where most front-desk work starts.' },
      { at: '.grid.cols-4', t: 'Four live counters', b: 'Not hard-coded: they come from the guest records you create. Register someone and watch these change.' },
      { at: 'card:Expected arrivals today', t: 'Today’s arrivals', b: 'Guests waiting to be checked in. Open one to see the record and start check-in.' },
      { at: 'card:Needs attention', t: 'Problems float to the top', b: 'Rejected or conflicting submissions appear here with a coloured tag. Follow the link to retry them.' },
      { at: 'card:Connections', t: 'Connection and mode', b: 'Shows whether the hotel is online or offline (simulated) and how many records wait in the offline queue.' }
    ]
  };

  m['hotel/new-registration'] = {
    purpose: 'Register a guest and complete check-in — by typing the details or by using the simulated document scan.',
    logic: [
      'Check-in is blocked until the receptionist ticks “I have physically checked the original document”.',
      'A simulated scan fills the form but marks low-confidence fields in orange — a human must verify them.',
      'Demo rule: a document number ending in 9 produces a simulated government rejection, so you can see the Rejected path.',
      'If the connection is offline the record is queued locally instead of being submitted.'
    ],
    steps: [
      { at: 'btn:Run simulated scan', t: 'Scan or type — your choice', b: 'The scan pretends to read a passport and fills the guest and document fields. No real OCR happens.', tip: 'Press it and look for orange borders.' },
      { at: 'card:1 · Guest and document', t: 'Step 1 — the guest', b: 'Name, birth date, nationality and document. Nationality and document type come from the managed Reference Data lists. Document number: 6–12 letters or digits.' },
      { at: 'card:2 · Room and stay', t: 'Step 2 — the stay', b: '“Fetch from demo PMS” fills sample room and dates. Offline, this is disabled because PMS data is unreachable.' },
      { at: 'card:3 · Document check', t: 'Step 3 — the compliance gate', b: 'The tick-box is the core rule: you confirm you checked the <b>original</b> document. Without it, you cannot continue.' },
      { at: 'btn:Review & check in', t: 'Review, then confirm', b: 'You get a summary dialog first. After confirming, a simulated submission starts and you can follow it in the Submission Centre.' }
    ]
  };

  m['hotel/registrations'] = {
    purpose: 'The master list of every guest record — search, filter, open and manage them.',
    logic: [
      'Document numbers are always masked in the list and in the record dialog.',
      'The “Government” column shows simulated statuses; “Acknowledged” is produced by the prototype, never by a real authority.',
      'Actions depend on stay status and your role: Start check-in (Expected), Amend, Check out (Checked in), Cancel (needs a reason).'
    ],
    steps: [
      { at: '#rec-table', t: 'Search, sort and filter', b: 'Type a name, reference or room in the search box. Use the <b>Government status</b> filter to find Rejected or Queued records fast.' },
      { at: '#rec-table .btn', t: 'Open a record', b: '<b>View</b> opens the full record with its activity history and only the actions that are valid for that guest right now.' },
      { at: 'btn:New registration', t: 'Add a guest', b: 'Jump straight into a new registration from here.' }
    ]
  };

  m['hotel/check-in'] = {
    purpose: 'A focused queue of guests who are expected today — pick one and complete check-in after the document check.',
    logic: [
      'Readiness is shown per guest: “Ready to check in” or “Need details”.',
      'Choosing “Check in” reuses the same confirmation as Guest Registration — one consistent rule, two entry points.',
      'Offline, the check-in is saved to the local queue and not delivered to government until synchronised.'
    ],
    steps: [
      { at: 'card:Guests awaiting check-in', t: 'Who is waiting', b: 'Each row shows the guest, room, arrival and whether their details are complete.' },
      { at: 'card:Guests awaiting check-in .btn', t: 'Check in', b: 'Opens the confirmation where you must tick the physical document check. “Complete details” sends you to the form to fill what is missing.' },
      { at: 'btn:Register a new guest', t: 'Walk-in guest?', b: 'A guest with no booking is registered using the normal form.' }
    ]
  };

  m['hotel/in-house'] = {
    purpose: 'Everyone currently staying at the establishment, with departures highlighted.',
    logic: [
      'Lists only records whose stay status is “Checked in”.',
      'Check-out here triggers a simulated update to government — the same function used from the record dialog.',
      'Summary figures (in house, departing today, needs attention) are computed from the shared records.'
    ],
    steps: [
      { at: '.grid.cols-3, .grid.cols-4', t: 'In-house at a glance', b: 'Guests in house, departures due today and reports that need attention.' },
      { at: 'card:Guests in house', t: 'Search and check out', b: 'Search by name, room or reference and filter by government status. Check a guest out from the row action.' }
    ]
  };

  m['hotel/stay-changes'] = {
    purpose: 'Change a stay after check-in: check out, amend room/dates, or cancel — each with its own safeguards.',
    logic: [
      'Amendments validate room length and that departure is after arrival.',
      'Cancellation needs a written reason (max 200 characters, no personal data) that is kept in the history.',
      'These actions need the “edit registration” permission; otherwise the page is read-only and tells you why.'
    ],
    steps: [
      { at: 'card:Stay records', t: 'Pick a guest', b: 'Search, or filter by stay status to see who can be checked out, amended or cancelled.' },
      { at: '#sc-table .btn', t: 'Choose the right action', b: '<b>Check out</b> ends the stay, <b>Amend</b> corrects room or departure, <b>Cancel</b> withdraws the registration with a reason.' },
      { at: 'card:Recent stay changes', t: 'Every change is recorded', b: 'Check-outs, amendments and cancellations appear here. If your role lacks permission the page becomes read-only — switch “Acting as” in the user menu to try another role.' }
    ]
  };

  m['hotel/submissions'] = {
    purpose: 'Follow every guest record on its journey to government: Pending, Submitted, Acknowledged or Rejected.',
    logic: [
      'Status chips at the top count each state live.',
      'Rejected records show a (synthetic) reason and a Retry button; retrying re-runs the simulated submission.',
      'Everything in the “Acknowledged” state is produced by the prototype — never by a real government system.'
    ],
    steps: [
      { at: '.chip-stat', t: 'The six states', b: 'Pending, Submitted, Acknowledged, Rejected, Queued offline and Conflict — with live counts.' },
      { at: 'card:Submissions', t: 'Find and fix', b: 'Filter by status. For a <b>Rejected</b> row, press <b>Retry</b> and watch the status change. Other rows offer <b>History</b>.', tip: 'Register a guest with a document number ending in 9 to create a rejection.' },
      { at: 'card:Recent activity', t: 'Your audit trail', b: 'The latest actions in this session, newest first.' }
    ]
  };

  m['hotel/offline-queue'] = {
    purpose: 'See what happens when the internet drops — records wait safely in a queue and sync later, with conflicts resolved by a person.',
    logic: [
      '“Simulate connection loss” switches the whole prototype to offline mode: new check-ins are queued, not submitted.',
      'An offline timer compares against a configurable threshold (default 72 h); warnings appear as it approaches.',
      'On synchronise, a mismatch becomes a Conflict. Nothing is overwritten silently — you choose Keep local or Keep server, and it is logged.'
    ],
    steps: [
      { at: '.page-head .actions', t: 'Control the connection', b: '<b>Simulate connection loss</b> toggles offline mode. <b>+24 h offline</b> advances the clock to trigger the threshold warnings. <b>Synchronise now</b> sends the queue.', tip: 'Go offline, register a guest, come back and synchronise.' },
      { at: '.alert', t: 'Always-visible status', b: 'This banner says whether the connection is available and warns when the offline duration nears the limit.' },
      { at: 'card:Queued records', t: 'The queue', b: 'Waiting records appear here. A <b>Conflict</b> row shows “Review conflict”, where you compare local and server values and decide.' }
    ]
  };

  m['hotel/pms'] = {
    purpose: 'Shows the state of the hotel’s property-management-system link and the manual fallback that always works.',
    logic: [
      'Connection status is simulated from synthetic data — no real PMS is contacted.',
      'Manual entry is always available, so the front desk is never blocked by an integration failure.',
      'Provider names are fictional.'
    ],
    steps: [
      { at: 'card:Connection status', t: 'Link health', b: 'Mode, last sync and status of the (simulated) PMS connection.' },
      { at: 'card:Manual entry fallback', t: 'Never blocked', b: 'If the PMS is down, register guests manually. The registration form works with or without it.' }
    ]
  };

  m['hotel/compliance'] = {
    purpose: 'A simple compliance view for the hotel: how many records reported successfully and what needs attention.',
    logic: [
      'Illustrative only — not an official compliance report; thresholds and legal rules are undefined without the approved URS.',
      'Figures come from the same synthetic records as the dashboard.',
      'The summary CSV contains counts only, never guest details.'
    ],
    steps: [
      { at: '.grid.cols-4, .grid.cols-3', t: 'Headline numbers', b: 'Records, reported, acknowledged (simulated) and needing attention.' },
      { at: 'card:Needs attention', t: 'What to fix', b: 'Records that failed or are blocked, ready to follow up.' },
      { at: 'btn:Summary CSV', t: 'Export counts', b: 'Downloads a counts-only CSV so you can see the export pattern without exposing guest data.' }
    ]
  };

  m['hotel/profile'] = {
    purpose: 'The establishment’s own profile and onboarding information.',
    logic: [
      'Contact details are edited here; registration and licensing fields are controlled by administrators.',
      'Profile completeness feeds the Government and Admin onboarding views.'
    ],
    steps: [
      { at: '.card', t: 'Your establishment', b: 'Name, category, location and contact person as held on the platform.' },
      { at: 'btn:Edit contact details', t: 'Keep contacts current', b: 'Hotels can update their contact details; the change is validated and recorded.' }
    ]
  };

  m['hotel/staff'] = {
    purpose: 'Who works at this establishment and which role each person holds.',
    logic: [
      'Staff belong to the establishment; their permissions come entirely from the role they hold.',
      'Switch “Acting as” (user menu) to see how different roles change what the portal allows.'
    ],
    steps: [
      { at: '.card', t: 'Your team', b: 'Name, role, status and last activity. Roles decide what each person can see and do.' }
    ]
  };

  /* ======================= GOVERNMENT PORTAL ======================= */
  m['gov/dashboard'] = {
    purpose: 'The national overview: registrations, reporting health and data quality across all establishments.',
    logic: [
      'Totals are the sum of the establishments’ figures and are partly live from Hotel Portal records.',
      'Pending and failed counts reveal which establishments are slow or failing to report.',
      'Charts are synthetic samples for demonstration.'
    ],
    steps: [
      { at: '.grid.cols-4', t: 'National counters', b: 'Registered establishments, today’s registrations, pending and failed submissions.' },
      { at: 'card:Registrations per day', t: 'Trend', b: 'A 7-day view of registrations across the country.' },
      { at: 'card:Open submission issues', t: 'Where reporting is failing', b: 'Failed or pending submissions with the establishment responsible.' },
      { at: 'card:Establishments needing follow-up', t: 'Who to chase', b: 'Establishments overdue or at risk against a configurable demo threshold.' }
    ]
  };

  m['gov/establishments'] = {
    purpose: 'Monitor every establishment’s reporting status in one directory.',
    logic: [
      'Shows operational status, onboarding status and last report per establishment.',
      'Pending and failed submission counts per establishment point to data or connectivity problems.'
    ],
    steps: [
      { at: '#est-table', t: 'The directory', b: 'Every establishment with its operational status, onboarding status, last report and pending or failed counts.' },
      { at: '#est-table select', t: 'Filter by status', b: 'Narrow the list by operational status to find establishments that have stopped reporting.' }
    ]
  };

  m['gov/submission-quality'] = {
    purpose: 'Watch submission outcomes and data-quality issues nationwide.',
    logic: [
      'Separates failed and pending submissions from data-quality issues.',
      'Sample data only — no real validation rules are applied without the approved URS.'
    ],
    steps: [
      { at: '.chip-stat', t: 'Outcome counters', b: 'Counts by submission outcome across the whole country.' },
      { at: 'card:Records', t: 'Drill in', b: 'Review individual records with their (synthetic) reasons and filter by status.' },
      { at: 'card:Establishment summary', t: 'By establishment', b: 'Pending and failed counts per establishment, side by side.' }
    ]
  };

  m['gov/search'] = {
    purpose: 'Look up a guest record — but only with a stated purpose and a case reference, and with sensitive fields masked.',
    logic: [
      'Step 1 is the purpose of the search and a case/reference number. Without them you cannot search.',
      'Results are masked by default (name, document number, date of birth).',
      '“Request unmasking” works on ONE record at a time, needs a written justification and a confirmation, and is logged. Bulk unmasking does not exist.',
      'Unmasked data can be re-masked, and every search and unmask appears in Audit & Access History.'
    ],
    steps: [
      { at: 'card:1 · Purpose of search', t: 'Why are you searching?', b: 'Pick a purpose and enter the case number. This is purpose-bound access — the platform wants to know <i>why</i> before showing <i>what</i>.' },
      { at: 'card:2 · Criteria', t: 'Then narrow it down', b: 'Search by name, identification number, nationality or arrival dates. Identifying searches need the purpose to be filled in first.' },
      { at: ['#res-table', '#s-form .form-actions'], t: 'Masked results', b: 'After you press Search, results appear here with hidden values. Open a result to see details; sensitive fields stay masked until you request unmasking with a justification.', tip: 'Run a search, open a record, press “Request unmasking”.' }
    ]
  };

  m['gov/audit'] = {
    purpose: 'The accountability trail: every search, every unmasking, every authorised access.',
    logic: [
      'Each entry records who, what, when, the stated purpose and the case reference.',
      'Filter by action type or user to answer “who looked at this?”.',
      'Read-only: nothing can be edited or removed here.'
    ],
    steps: [
      { at: '#aud-table select', t: 'Filter the trail', b: 'Narrow by action type — for example only “Unmask” events — or search by user.' },
      { at: '#aud-table', t: 'Read the evidence', b: 'Each row is a logged action. Try a search in Guest Record Search, then return to see your own activity appear.' }
    ]
  };

  m['gov/notifications'] = {
    purpose: 'Reporting alerts for validation failures, reports ready for review and integration or webhook problems.',
    logic: [
      'Alerts are generated locally from synthetic data — no email, SMS or push is sent.',
      'Filter by category, severity or unread status; mark alerts read or unread.',
      'The bell in the top bar uses the same alerts.'
    ],
    steps: [
      { at: '.na-filters', t: 'Filter your alerts', b: 'Choose a category such as Validation failures or Integration & webhook issues, then reset when done.' },
      { at: '.card', t: 'Open an alert', b: '<b>Details</b> shows what happened and where to look next. Use “Mark as unread” to keep it on your list.' }
    ]
  };

  m['gov/reports'] = {
    purpose: 'A reporting dashboard with filters, weekly reports per property and a permission-gated CSV export.',
    logic: [
      'Filters (period, property, status) narrow both the summary cards and the report list.',
      'Each report opens into a validation summary with illustrative issues (placeholder codes — no guest details).',
      'Export needs the reporting export permission and produces a synthetic CSV; nothing is submitted anywhere.'
    ],
    steps: [
      { at: 'card:Filters', t: 'Narrow the data', b: 'Pick a reporting period, property or status. Cards and lists update together.' },
      { at: '#rp-cards', t: 'Summary cards', b: 'Total registrations, valid records, records with validation errors and pending submissions.' },
      { at: 'card:Reports', t: 'Open a report', b: '<b>Details</b> shows one report’s validation summary and issues. The export button is disabled if your role lacks permission.' }
    ]
  };

  /* ======================= SYSTEM ADMINISTRATION ======================= */
  m['admin/dashboard'] = {
    purpose: 'Platform health and onboarding at a glance for administrators.',
    logic: [
      'The onboarding queue lets you Approve or Reject an establishment application — try both to see the confirmation and validation patterns.',
      'Rejection requires a reason.',
      'Platform checks are simulated status indicators, not live monitoring.'
    ],
    steps: [
      { at: '.grid.cols-4', t: 'Platform counters', b: 'Establishments, users, open incidents and integrations summarised.' },
      { at: 'card:Establishment onboarding queue', t: 'Approve or reject', b: 'New establishments wait here. <b>Approve</b> activates them; <b>Reject</b> asks for a reason which is kept on record.' },
      { at: 'card:Platform checks', t: 'Health indicators', b: 'Simulated checks for the platform’s main components.' },
      { at: 'card:Recent audit events', t: 'What just happened', b: 'The latest audited changes across the platform.' }
    ]
  };

  m['admin/users'] = {
    purpose: 'Create and manage user accounts, assign roles and link people to establishments.',
    logic: [
      'A role decides all permissions; a person never gets permissions individually.',
      'Suspended or inactive accounts have every permission withheld immediately.',
      'Role, establishment or status changes take effect at once in the demo permissions.',
      'Invitations and password resets are simulated — no email is sent and no password exists.'
    ],
    steps: [
      { at: 'btn:Add user', t: 'Invite someone', b: 'Name, email, role and establishment. Validation lists every problem and lets you jump to the field.' },
      { at: 'table, .table-wrap', t: 'The directory', b: 'Search and filter. Open a user to change role, suspend, reactivate or reset the password (simulated).' }
    ]
  };

  m['admin/roles'] = {
    purpose: 'Define roles and exactly which permissions each role holds.',
    logic: [
      'Least privilege is enforced: no role may hold every permission available in its workspace.',
      'Changing a role updates everyone who holds it immediately.',
      'Roles shown are demonstration placeholders — the final government role matrix is unresolved.'
    ],
    steps: [
      { at: 'btn:New demo role', t: 'Create a role', b: 'Name it and tick permissions by category.' },
      { at: '.card', t: 'Role cards', b: 'Open a role to <b>Edit permissions</b>. If you tick everything, the safety check rejects it.', tip: 'Try ticking every box and saving.' }
    ]
  };

  m['admin/establishments'] = {
    purpose: 'Manage establishment records, profile completeness, PMS status and onboarding.',
    logic: [
      'Profile completeness is calculated per establishment and averaged.',
      'The onboarding queue count (badge in the sidebar) shows applications waiting for a decision.',
      'Editing an establishment validates fields and records the change.'
    ],
    steps: [
      { at: '.grid.cols-4, .grid.cols-3', t: 'Estate overview', b: 'Establishments, average profile completeness and onboarding counts.' },
      { at: 'table, .table-wrap', t: 'The register', b: 'Filter by onboarding or operational status. Open a row to see its profile and edit details.' }
    ]
  };

  m['admin/reference-data'] = {
    purpose: 'Maintain the lists that drive dropdowns across the platform — countries, document types, categories and more.',
    logic: [
      'Every value has effective dates and a change history; values in use cannot simply be removed.',
      'Lists marked “configurable” are unresolved placeholders, not official government lists.',
      'The Guest Registration dropdowns read from these lists, so edits show up there.'
    ],
    steps: [
      { at: '.card', t: 'Pick a list', b: 'Choose a list such as Document types or Country codes.' },
      { at: 'btn:Add value', t: 'Add with dates', b: 'New values get an “effective from” date and an optional end date, so history is preserved.' }
    ]
  };

  m['admin/settings'] = {
    purpose: 'View and propose changes to configurable system settings, with validation and history.',
    logic: [
      'Each setting is validated before it can be saved; errors name the setting and the reason.',
      'Security-relevant settings are not applied immediately — they become a pending change that needs a second person (maker-checker).',
      'A setting with a pending change cannot be edited again until it is decided.',
      '“Display-only” settings are stored but change no service.'
    ],
    steps: [
      { at: '.alert', t: 'Read this first', b: 'The banner explains that settings are a frontend demonstration and what “Display-only” means.' },
      { at: '.card', t: 'Change a setting', b: 'Edit values and add a justification. Sensitive ones go to <b>Configuration Approvals</b> instead of applying directly.' },
      { at: 'nav:approvals', t: 'Next stop: approvals', b: 'Pending changes are decided in Configuration Approvals — by a different person.' }
    ]
  };

  m['admin/approvals'] = {
    purpose: 'The “checker” half of maker-checker: approve or reject security-relevant changes proposed by someone else.',
    logic: [
      'The proposer and the approver are the “Acting as” demo users — you must switch user (user menu) to approve your own proposal.',
      'Approval or rejection is recorded with the decision maker and a reason.',
      'This is a prototype workflow, not production-grade enforcement.'
    ],
    steps: [
      { at: '.alert', t: 'Who is acting?', b: 'This notice shows who you are acting as. A proposal cannot be approved by the same person.' },
      { at: '.card', t: 'Decide', b: 'Review the proposed change, its justification and who proposed it, then <b>Approve</b> or <b>Reject</b>.', tip: 'Propose a change in System Configuration, switch user, then approve it.' }
    ]
  };

  m['admin/pms-health'] = {
    purpose: 'A dashboard of PMS (property management system) integrations across all properties.',
    logic: [
      'Each integration shows Connected, Degraded or Disconnected with its last successful sync.',
      'Actions are scripted: Test connection, Retry failed operation and Disable all give simulated outcomes.',
      'If the Hotel Portal is in simulated offline mode, integrations show as Disconnected and actions pause.'
    ],
    steps: [
      { at: '.grid.cols-5', t: 'Integration summary', b: 'Total integrations and how many are healthy, degraded or failing.' },
      { at: '#integ-table', t: 'Every property', b: 'Open one to see its capabilities, configuration (credentials are masked) and event history.' }
    ]
  };

  m['admin/integration-events'] = {
    purpose: 'A searchable history of simulated integration events with diagnostics.',
    logic: [
      'Newest first; filter by severity, integration or property.',
      'Opening an event shows its details and is clearly labelled as a synthetic record, not a real operational log.'
    ],
    steps: [
      { at: '.card', t: 'Filter the log', b: 'Narrow by severity or integration to find failures and warnings.' },
      { at: 'table, .table-wrap', t: 'Inspect an event', b: 'Open a row for time, integration, property, event type and message.' }
    ]
  };

  m['admin/connectors'] = {
    purpose: 'Reserved for connector monitoring. This page is intentionally a placeholder in this build.',
    logic: [
      'It carries a “Soon” badge on purpose: scope is awaiting a stakeholder decision.',
      'Equivalent simulated information already lives in Integration Dashboard and Integration Event History.'
    ],
    steps: [
      { at: '.alert', t: 'Honest placeholder', b: 'This module is shown so the navigation structure can be reviewed — it is not built yet.' },
      { at: 'card:Where this works', t: 'Use these today', b: 'These links lead to the existing screens that already cover part of this area.' }
    ]
  };

  m['admin/developer'] = {
    purpose: 'Integration documentation: capabilities, an API reference foundation, webhooks and the sandbox.',
    logic: [
      'Illustrative documentation only — there is no real API; HTTP methods and paths are marked as to-be-confirmed.',
      'Entries are labelled Simulated (you can try them) or Illustrative (sketch only).',
      'Webhooks: create a configuration, pick a simulated destination behaviour (200, 401, 410, 500, 503, timeout) and watch delivery attempts and retries — nothing is ever sent.',
      'Creating and editing webhooks needs the “Integrations — administer” permission.'
    ],
    steps: [
      { at: '.alert', t: 'Read the safety note', b: 'This portal documents intent — nothing here talks to the outside world.' },
      { at: 'card:API reference', t: 'API reference', b: 'Searchable entries, each marked Simulated or Illustrative.' },
      { at: 'card:Webhooks', t: 'Webhooks', b: 'Create a configuration, pick a simulated destination behaviour and watch delivery attempts and retries.' },
      { at: 'card:Sandbox', t: 'Try requests', b: 'The sandbox sends simulated requests and shows simulated responses — also reachable as “OpenAPI & Sandbox” in the sidebar.' }
    ]
  };

  m['admin/sandbox'] = {
    purpose: 'Try illustrative API calls against a synthetic, in-browser sandbox.',
    logic: [
      'Requests are evaluated by JavaScript in your browser; no data leaves it and no prototype data is changed.',
      'Pick an endpoint or example case, edit the JSON body, and format it; invalid JSON is reported clearly.',
      'Status, body and response time are all simulated.'
    ],
    steps: [
      { at: 'card:Request', t: 'Build a request', b: 'Choose an endpoint, load an example, edit headers and JSON body. <b>Format JSON</b> tidies it or tells you what is invalid.' },
      { at: 'card:Simulated response', t: 'Read the result', b: 'Status, body and time appear here — scripted by the prototype, not by a server.' }
    ]
  };

  m['admin/audit-logs'] = {
    purpose: 'The system-wide audit trail and configuration history.',
    logic: [
      'Read-only: no edit or delete is offered.',
      'Records who changed what and when across users, roles, settings and access.',
      'In-memory demonstration — not tamper-proof production logging.'
    ],
    steps: [
      { at: '.card', t: 'Search the trail', b: 'Filter by actor, module or result to answer “who changed this?”.' },
      { at: 'table, .table-wrap', t: 'Open an entry', b: 'See the full detail of any change, including before and after values for configuration.' }
    ]
  };

  m['admin/incidents'] = {
    purpose: 'The notification centre and operational overview — what needs the administrators’ attention.',
    logic: [
      'Notifications can be acknowledged, marked read, or turned into an incident.',
      'Open critical and high-priority incidents are highlighted.'
    ],
    steps: [
      { at: '.grid.cols-4, .grid.cols-3', t: 'Operational summary', b: 'Open incidents, critical items and awaiting approvals.' },
      { at: '.card', t: 'Triage', b: 'Acknowledge or escalate. “Mark all as read” clears the list.' }
    ]
  };

  m['admin/support-incidents'] = {
    purpose: 'Track support incidents from report to resolution: assign, escalate and annotate.',
    logic: [
      'Incidents have priority, category and an assignee; escalation changes visibility.',
      'Notes and status changes are kept as history.',
      'No real help desk or third-party operator is connected.'
    ],
    steps: [
      { at: 'btn:New incident', t: 'Log an incident', b: 'Describe the problem, set category and priority.' },
      { at: 'table, .table-wrap', t: 'Work the queue', b: 'Open one to <b>Assign</b>, <b>Escalate</b> or <b>Add note</b>.' }
    ]
  };

  m['admin/exceptional-access'] = {
    purpose: 'Controlled, time-limited access for support staff who normally cannot see identifiable guest data.',
    logic: [
      'There is no default access: support roles must request it for a specific record.',
      'A different administrator must approve it, and it expires automatically.',
      'The maximum duration is itself a maker-checker setting.',
      'Everything is audited; the data shown is synthetic.'
    ],
    steps: [
      { at: '.alert', t: 'No default access', b: 'Support cannot see identifiable data. Access is requested, approved by someone else, and expires.' },
      { at: 'btn:Request access', t: 'Make a request', b: 'Choose a record (reference and room only), give a duration and a justification.', tip: 'Switch “Acting as” to approve it.' }
    ]
  };

  m['admin/components'] = {
    purpose: 'The design language: tokens and reusable components used across every screen.',
    logic: [
      'Single source of truth for colour, type, spacing and states.',
      'Reusing these components is why every screen behaves consistently.'
    ],
    steps: [
      { at: '.card', t: 'Browse the library', b: 'Buttons, badges, alerts, forms, tables and charts — as used in every module.' }
    ]
  };

  m['admin/tpl-list'] = {
    purpose: 'The reusable template for searchable, sortable, paged list pages.',
    logic: ['New list screens start from this pattern: search, filter, sort, paginate, empty state.'],
    steps: [
      { at: 'table, .table-wrap, .card', t: 'Try the controls', b: 'Search, sort columns and change pages — the same table every list in Msafiri uses.' }
    ]
  };

  m['admin/tpl-form'] = {
    purpose: 'The reusable template for sectioned forms with validation.',
    logic: ['New forms start from this pattern: sections, required markers, inline errors, error summary.'],
    steps: [
      { at: 'form, .card', t: 'Test validation', b: 'Submit with empty required fields to see inline errors and the summary.' }
    ]
  };
})(window);
