/* Msafiri — navigation configuration.
   To add a module: add an item here, then register a page under the same route key
   (Msafiri.pages['hotel/<id>']). Items without a registered page show the "planned module" template. */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});
  M.pages = M.pages || {};      // page registry, filled by js/pages/*.js
  M.templates = M.templates || {};

  M.portals = {
    hotel: { id: 'hotel', label: 'Hotel Portal', icon: 'building', home: 'dashboard', blurb: 'Register guests and report to government' },
    gov:   { id: 'gov',   label: 'Government Portal', icon: 'shield-check', home: 'dashboard', blurb: 'Oversight, records and analytics' },
    admin: { id: 'admin', label: 'System Administration', icon: 'sliders', home: 'dashboard', blurb: 'Users, onboarding and platform settings' }
  };
  M.portalOrder = ['hotel', 'gov', 'admin'];

  /* item: id (route), label, icon, desc, count? (badge) */
  M.nav = {
    hotel: [
      { group: 'Overview', items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid', desc: 'Today at a glance for your establishment.' }
      ]},
      { group: 'Guest Registration', items: [
        { id: 'new-registration', label: 'Guest Registration', icon: 'user-plus', desc: 'Enter details or use the simulated document scan, review fields and validate.' },
        { id: 'registrations', label: 'Registrations', icon: 'list', desc: 'Search and manage all registrations.' },
        { id: 'check-in', label: 'Check-in', icon: 'log-in', desc: 'Complete check-in after the required document check.' },
        { id: 'in-house', label: 'In-House Guests', icon: 'bed', desc: 'Guests currently staying at the establishment.' },
        { id: 'stay-changes', label: 'Check-out, Amend & Cancel', icon: 'edit', desc: 'Check-out, amendment and cancellation workflows.' }
      ]},
      { group: 'Government Reporting', items: [
        { id: 'submissions', label: 'Submission Status & History', icon: 'send', desc: 'Pending, Submitted, Acknowledged or Rejected, with history.' },
        { id: 'offline-queue', label: 'Offline Queue & Sync', icon: 'refresh', desc: 'Records captured offline, synchronisation status and conflict warnings.', count: 4 },
        { id: 'pms', label: 'PMS Connection & Manual Fallback', icon: 'database', desc: 'PMS connection status and manual entry fallback.' }
      ]},
      { group: 'Insights', items: [
        { id: 'compliance', label: 'Compliance & Reports', icon: 'bar-chart', desc: 'Compliance dashboard and reports.' }
      ]},
      { group: 'Establishment', items: [
        { id: 'profile', label: 'Establishment Profile', icon: 'building', desc: 'Establishment onboarding and profile.' },
        { id: 'staff', label: 'Staff & Users', icon: 'users', desc: 'Hotel staff and user management.' }
      ]}
    ],
    gov: [
      { group: 'Overview', items: [
        { id: 'dashboard', label: 'Government Overview', icon: 'grid', desc: 'Overview of registrations and reporting (synthetic).' }
      ]},
      { group: 'Monitoring', items: [
        { id: 'establishments', label: 'Establishment Monitoring', icon: 'building', desc: 'Establishment reporting status.' },
        { id: 'submission-quality', label: 'Submission & Data Quality', icon: 'activity', desc: 'Submission status and data-quality monitoring.' }
      ]},
      { group: 'Guest Records', items: [
        { id: 'search', label: 'Guest Record Search', icon: 'id-card', desc: 'Purpose of search and case/reference number required before identifying searches. Sensitive data masked by default.' }
      ]},
      { group: 'Governance', items: [
        { id: 'audit', label: 'Audit & Access History', icon: 'clipboard', desc: 'Searches, unmasking actions and authorised access.' },
        { id: 'notifications', label: 'Reporting Alerts', icon: 'bell', desc: 'Simulated notifications for report validation, review, preparation/export and integration events (synthetic; nothing is sent).' },
        { id: 'reports', label: 'Reporting & Trends', icon: 'bar-chart', desc: 'Reporting dashboard: summary cards, filters, report listing and report details with a permission-gated simulated CSV export (synthetic, illustrative; nothing is submitted).' }
      ]}
    ],
    admin: [
      { group: 'Overview', items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid', desc: 'Platform and onboarding overview.' }
      ]},
      { group: 'Administration', items: [
        { id: 'users', label: 'Users', icon: 'users', desc: 'User directory, accounts, role assignment and establishment association.' },
        { id: 'roles', label: 'Roles & Permissions', icon: 'key', desc: 'Demonstration roles, permission categories and role-to-permission mapping.' },
        { id: 'establishments', label: 'Establishment Administration', icon: 'building', desc: 'Establishment records, profile completeness, PMS status and onboarding.', count: 4 },
        { id: 'reference-data', label: 'Reference Data', icon: 'database', desc: 'Reference lists with effective dates and change history (synthetic).' },
        { id: 'settings', label: 'System Configuration', icon: 'sliders', desc: 'Configurable settings, validation and change history.' },
        { id: 'approvals', label: 'Configuration Approvals', icon: 'check-circle', desc: 'Maker-checker approval of security-relevant settings.' }
      ]},
      { group: 'Integrations', items: [
        { id: 'pms-health', label: 'Integration Dashboard', icon: 'activity', desc: 'PMS integration status across properties (simulated).' },
        { id: 'integration-events', label: 'Integration Event History', icon: 'clipboard', desc: 'Simulated integration events, filters and diagnostics.' },
        { id: 'connectors', label: 'Connector Status', icon: 'sliders', desc: 'Connector status and integration monitoring (simulated).' },
        { id: 'developer', label: 'API / Developer Portal', icon: 'file', desc: 'Integration documentation and API reference foundation (illustrative; sandbox and simulated webhooks — nothing is sent).' },
        { id: 'sandbox', label: 'OpenAPI & Sandbox', icon: 'edit', desc: 'OpenAPI documentation and synthetic sandbox.' }
      ]},
      { group: 'Operations', items: [
        { id: 'audit-logs', label: 'Audit Logs & Config History', icon: 'clipboard', desc: 'System audit trail and configuration history.' },
        { id: 'incidents', label: 'Notifications & Operations', icon: 'bell', desc: 'Notification centre and operational overview.' },
        { id: 'support-incidents', label: 'Support Incidents', icon: 'alert', desc: 'Support incident directory, assignment and escalation.' },
        { id: 'exceptional-access', label: 'Exceptional Access', icon: 'lock', desc: 'Controlled, time-limited support access requests.' }
      ]},
      { group: 'Prototype Toolkit', items: [
        { id: 'components', label: 'Component Library', icon: 'palette', desc: 'Design tokens and reusable components.' },
        { id: 'tpl-list', label: 'List Page Template', icon: 'list', desc: 'Searchable, sortable, paged list.' },
        { id: 'tpl-form', label: 'Form Page Template', icon: 'edit', desc: 'Sectioned form with validation.' }
      ]}
    ]
  };

  /* Lookup helpers */
  M.findItem = function (portal, id) {
    var groups = M.nav[portal] || [];
    for (var i = 0; i < groups.length; i++) {
      for (var j = 0; j < groups[i].items.length; j++) {
        if (groups[i].items[j].id === id) return { item: groups[i].items[j], group: groups[i].group };
      }
    }
    return null;
  };
  M.allItems = function () {
    var out = [];
    M.portalOrder.forEach(function (p) {
      M.nav[p].forEach(function (g) {
        g.items.forEach(function (it) { out.push({ portal: p, group: g.group, item: it, route: '#/' + p + '/' + it.id }); });
      });
    });
    return out;
  };
})(window);
