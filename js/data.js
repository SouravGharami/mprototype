/* Msafiri — SYNTHETIC demonstration data. No real people, hotels or government records. */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});

  M.demo = {
    users: {
      hotel: { name: 'Neema Kiptoo', initials: 'NK', role: 'Receptionist', org: 'Demo Hotel A · pilot establishment (synthetic)' },
      gov:   { name: 'Joseph Ndege', initials: 'JN', role: 'Authorised Government Officer', org: 'Government oversight (demo — authority name to be confirmed)' },
      admin: { name: 'Sofia Okello', initials: 'SO', role: 'System Administrator', org: 'Platform operations (demo)' }
    },

    notifications: {
      hotel: [
        { id: 'h1', icon: 'alert', tone: 'danger', title: '3 submissions were rejected (simulated)', sub: 'Validation errors need review · 20 min ago', unread: true, route: '#/hotel/submissions' },
        { id: 'h2', icon: 'refresh', tone: 'warning', title: '4 records queued offline', sub: 'Not delivered to government until synchronised · 1 h ago', unread: true, route: '#/hotel/offline-queue' },
        { id: 'h3', icon: 'database', tone: '', title: 'Demo PMS connection is simulated', sub: 'Manual fallback is always available · Yesterday', unread: false, route: '#/hotel/pms' }
      ],
      gov: [
        { id: 'g1', icon: 'flag', tone: 'danger', title: '8 records flagged by data-quality checks', sub: 'Demo validation rules · 15 min ago', unread: true, route: '#/gov/submission-quality' },
        { id: 'g2', icon: 'building', tone: 'warning', title: '3 pilot establishments overdue', sub: 'Against a configurable demo threshold · 2 h ago', unread: true, route: '#/gov/establishments' },
        { id: 'g3', icon: 'clipboard', tone: '', title: 'Searches require purpose and case reference', sub: 'All access is logged · Today', unread: false, route: '#/gov/audit' }
      ],
      admin: [
        { id: 'a1', icon: 'building', tone: 'warning', title: '4 establishments awaiting onboarding approval', sub: 'See the onboarding queue on the dashboard · 30 min ago', unread: true, route: '#/admin/dashboard' },
        { id: 'a2', icon: 'activity', tone: 'warning', title: 'Simulated PMS connector reporting errors', sub: 'Demo integration state · 2 h ago', unread: true, route: '#/admin/pms-health' },
        { id: 'a3', icon: 'database', tone: '', title: 'Reference data last reviewed 14 days ago', sub: 'Countries, document types · 2 days ago', unread: false, route: '#/admin/reference-data' }
      ]
    },

    hotel: {
      stats: [
        { label: 'Guests in house', value: 142, icon: 'bed', delta: '+6', tone: 'up', foot: 'vs. yesterday' },
        { label: 'Arrivals today', value: 38, icon: 'log-in', tone: 'orange', delta: '24 registered', dtone: 'flat', foot: '14 remaining', accent: true },
        { label: 'Departures today', value: 27, icon: 'log-out', delta: '+3', tone: 'up', foot: 'vs. yesterday' },
        { label: 'Pending submission', value: 9, icon: 'send', tone: 'red', delta: '3 rejected', dtone: 'down', foot: 'simulated status' }
      ],
      week: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], registered: [31, 28, 35, 41, 52, 58, 38], submitted: [31, 28, 34, 40, 49, 51, 24] }, /* submitted = simulated submissions */
      status: [
        { label: 'Acknowledged', value: 96, color: 'var(--success-500)' },
        { label: 'Submitted', value: 22, color: 'var(--chart-2)' },
        { label: 'Pending', value: 9, color: 'var(--warning-500)' },
        { label: 'Queued offline', value: 4, color: 'var(--chart-4)' },
        { label: 'Rejected', value: 3, color: 'var(--danger-500)' }
      ],
      attention: [
        { t: 'Rejected: missing document number', s: 'REG-240981 · Room 214 (simulated)', tone: 'danger', tag: 'Rejected' },
        { t: 'Rejected: departure earlier than arrival', s: 'REG-240977 · Room 108 (simulated)', tone: 'danger', tag: 'Rejected' },
        { t: '4 records waiting in the offline queue', s: 'Not yet delivered to government', tone: 'warning', tag: 'Offline' },
        { t: '9 registrations pending submission', s: 'Submit when validation passes', tone: 'warning', tag: 'Pending' }
      ],
      arrivals: [
        { ref: 'REG-241012', guest: 'Amara Okonkwo', nat: 'Nigeria', room: '201', eta: '14:30', nights: 3, status: 'Acknowledged' },
        { ref: 'REG-241013', guest: 'Lukas Brandt', nat: 'Germany', room: '118', eta: '15:10', nights: 5, status: 'Acknowledged' },
        { ref: 'REG-241014', guest: 'Mei Tanaka', nat: 'Japan', room: '307', eta: '15:45', nights: 2, status: 'Draft' },
        { ref: 'REG-241015', guest: 'Rafael Duarte', nat: 'Brazil', room: '210', eta: '16:20', nights: 4, status: 'Expected' },
        { ref: 'REG-241016', guest: 'Zainab Hussein', nat: 'Tanzania', room: '115', eta: '16:50', nights: 1, status: 'Expected' },
        { ref: 'REG-241017', guest: 'Oliver Grant', nat: 'United Kingdom', room: '402', eta: '17:30', nights: 7, status: 'Acknowledged' },
        { ref: 'REG-241018', guest: 'Priya Nair', nat: 'India', room: '305', eta: '18:00', nights: 3, status: 'Rejected' },
        { ref: 'REG-241019', guest: 'Daniel Mwakasege', nat: 'Kenya', room: '122', eta: '18:40', nights: 2, status: 'Expected' },
        { ref: 'REG-241020', guest: 'Elena Petrova', nat: 'Serbia', room: '219', eta: '19:15', nights: 6, status: 'Expected' }
      ]
    },

    gov: {
      stats: [
        { label: 'Registrations today', value: '572', icon: 'users', delta: '+8.2%', tone: 'up', foot: 'vs. same day last week · synthetic' },
        { label: 'Pilot establishments reporting', value: '17 of 20', icon: 'building', tone: 'orange', delta: 'Pilot planning context', dtone: 'flat', foot: 'Not live connections', accent: true },
        { label: 'Overdue establishments', value: 3, icon: 'clock', tone: 'red', delta: '-1', dtone: 'up', foot: 'demo threshold' },
        { label: 'Data-quality flags', value: 8, icon: 'flag', delta: '+2', tone: 'down', foot: 'demo validation rules' }
      ],
      days: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
      daily: [410, 445, 430, 470, 520, 560, 575, 525, 498, 515, 540, 585, 610, 572],
      origin: [
        { label: 'East Africa', value: 158, color: 'var(--chart-1)' },
        { label: 'Europe', value: 136, color: 'var(--chart-2)' },
        { label: 'Asia', value: 114, color: 'var(--chart-3)' },
        { label: 'Americas', value: 85, color: 'var(--chart-5)' },
        { label: 'Other', value: 79, color: 'var(--chart-4)' }
      ],
      regions: [
        { label: 'Coastal', value: 190 }, { label: 'Central', value: 148 }, { label: 'Northern', value: 85 },
        { label: 'Lake zone', value: 80 }, { label: 'Southern', value: 69 }
      ],
      overdue: [
        { id: 'PIL-007', name: 'Palm Crest Lodge', region: 'Coastal', last: '2 days ago', pending: 31, status: 'Overdue' },
        { id: 'PIL-012', name: 'Savannah Rest Camp', region: 'Northern', last: '1 day ago', pending: 18, status: 'Overdue' },
        { id: 'PIL-015', name: 'Lakeview Guest House', region: 'Lake zone', last: '1 day ago', pending: 9, status: 'Overdue' },
        { id: 'PIL-004', name: 'Highland Court Hotel', region: 'Central', last: '5 h ago', pending: 22, status: 'At risk' },
        { id: 'PIL-009', name: 'Coral Bay Residences', region: 'Coastal', last: '4 h ago', pending: 14, status: 'At risk' }
      ]
    },

    admin: {
      stats: [
        { label: 'Active users', value: 86, icon: 'users', delta: '+5', tone: 'up', foot: 'this month · demo' },
        { label: 'Onboarded establishments', value: 14, icon: 'building', tone: 'orange', delta: 'of ~20 pilot', dtone: 'flat', foot: 'planning context', accent: true },
        { label: 'Pending approvals', value: 4, icon: 'clock', tone: 'red', delta: 'Action needed', dtone: 'flat', foot: '' },
        { label: 'Locked accounts', value: 2, icon: 'lock', delta: '+1', tone: 'down', foot: 'last 24 h' }
      ],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sessions: [84, 91, 95, 101, 110, 76, 69],
      queue: [
        { id: 'ONB-1042', name: 'Mangrove Bay Hotel', type: 'Hotel', region: 'Coastal', submitted: '12 Oct 2026', docs: 'Complete' },
        { id: 'ONB-1043', name: 'Kilele View Lodge', type: 'Lodge', region: 'Northern', submitted: '13 Oct 2026', docs: 'Complete' },
        { id: 'ONB-1044', name: 'Riverside Guest House', type: 'Guest house', region: 'Central', submitted: '14 Oct 2026', docs: 'Missing 1 item' },
        { id: 'ONB-1045', name: 'Sunrise Apartments', type: 'Serviced apartments', region: 'Lake zone', submitted: '16 Oct 2026', docs: 'Complete' }
      ],
      audit: [
        { when: '15:42', actor: 'Sofia Okello', action: 'Updated reference data: document types', module: 'Reference Data & Settings', result: 'Success' },
        { when: '15:11', actor: 'System', action: 'Locked account after failed sign-ins', module: 'Security', result: 'Warning' },
        { when: '14:55', actor: 'Joseph Ndege', action: 'Exported weekly summary (demo)', module: 'Reports', result: 'Success' },
        { when: '14:20', actor: 'Neema Kiptoo', action: 'Submitted 24 registrations (simulated)', module: 'Submission Status', result: 'Success' },
        { when: '13:48', actor: 'Sofia Okello', action: 'Reset password for staff user', module: 'Users & Roles', result: 'Success' },
        { when: '12:05', actor: 'System', action: 'Scheduled backup check (demo)', module: 'Platform', result: 'Success' }
      ]
    },

    /* Integration honesty: every external dependency is SIMULATED in this prototype. */
    integrations: [
      { name: 'Hotel PMS connector', mode: 'Simulated' },
      { name: 'Government interface', mode: 'Simulated' },
      { name: 'Document scan / OCR', mode: 'Simulated' },
      { name: 'Identity verification', mode: 'Not included' }
    ],

    /* Rows used by the list-page template demo */
    templateRows: (function () {
      var names = ['Amara Okonkwo', 'Lukas Brandt', 'Mei Tanaka', 'Rafael Duarte', 'Zainab Hussein', 'Oliver Grant', 'Priya Nair', 'Daniel Mwakasege', 'Elena Petrova', 'Hassan Aydin', 'Chloe Martin', 'Tendai Moyo', 'Sven Lindqvist', 'Aisha Rahman', 'Mateo Silva', 'Ingrid Olsen', 'Kofi Mensah', 'Yuki Sato', 'Nadia Karim', 'Pedro Alves', 'Sara Haddad', 'Tomas Novak'];
      var nats = ['Nigeria', 'Germany', 'Japan', 'Brazil', 'Tanzania', 'United Kingdom', 'India', 'Kenya', 'Serbia', 'Türkiye', 'France', 'Zimbabwe', 'Sweden', 'Bangladesh', 'Portugal', 'Norway', 'Ghana', 'Japan', 'Egypt', 'Brazil', 'Jordan', 'Czechia'];
      var status = ['Acknowledged', 'Submitted', 'Pending', 'Draft', 'Rejected', 'Acknowledged'];
      return names.map(function (n, i) {
        return { ref: 'REG-' + (240900 + i * 7), guest: n, nat: nats[i], arrival: (1 + (i % 17)) + ' Oct 2026', nights: 1 + (i % 6), status: status[i % status.length] };
      });
    })()
  };
})(window);
