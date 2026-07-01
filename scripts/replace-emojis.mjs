import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve(process.cwd(), 'docs/user-manual.html');
let content = fs.readFileSync(filePath, 'utf8');

// Icons definition
const ICONS = {
  print: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
  book: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  zap: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  dashboard: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  users: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  send: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
  clock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  landmark: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"></line><line x1="6" y1="18" x2="6" y2="11"></line><line x1="10" y1="18" x2="10" y2="11"></line><line x1="14" y1="18" x2="14" y2="11"></line><line x1="18" y1="18" x2="18" y2="11"></line><polygon points="12 2 2 7 22 7"></polygon></svg>`,
  phone: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  alert: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  mappin: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  station: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  smartphone: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
  template: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  calendar: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  sliders: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="8" x2="14" y2="8"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>`,
  palette: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"></path><circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"></circle><circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"></circle><circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"></circle></svg>`,
  logs: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
  bulb: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>`,
  map: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>`,
  tag: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  eye: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  eyeoff: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
};

// 1. Add SVG class styling rules to the CSS
const styleToInsert = `
  /* ── Vector Icon Styling ── */
  svg.icon {
    width: 1.1em;
    height: 1.1em;
    vertical-align: -0.18em;
    display: inline-block;
    stroke-width: 2.2;
    margin-right: 0.25em;
    flex-shrink: 0;
  }
  .chapter-icon svg.icon {
    width: 1.5rem;
    height: 1.5rem;
    vertical-align: middle;
    margin: 0;
  }
  .feat-icon svg.icon {
    width: 1.7rem;
    height: 1.7rem;
    vertical-align: middle;
    margin: 0;
  }
  .dev-section-head svg.icon {
    width: 1.25rem;
    height: 1.25rem;
    vertical-align: -0.2em;
    margin-right: 0.4em;
  }
  button svg.icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.12em;
    margin-right: 0.35em;
  }
`;

// Insert the styling right before </style>
content = content.replace('</style>', `${styleToInsert}\n</style>`);

// 2. Replace CSS tip, warn, success content rules
content = content.replace(
  `.tip{background:var(--p1-bg);border:1px solid var(--p1-border);border-radius:9px;padding:.75rem 1rem;font-size:.79rem;line-height:1.6;color:var(--navy);}`,
  `.tip{background:var(--p1-bg);border:1px solid var(--p1-border);border-radius:9px;padding:.75rem 1rem .75rem 2.5rem;font-size:.79rem;line-height:1.6;color:var(--navy);position:relative;}`
);
content = content.replace(
  `.tip::before{content:'💡 ';font-size:.85rem;}`,
  `.tip::before{content:'';position:absolute;left:.95rem;top:.9rem;width:15px;height:15px;background:currentColor;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'/%3E%3Cpath d='M9 18h6'/%3E%3Cpath d='M10 22h4'/%3E%3C/svg%3E") no-repeat center/contain;WebkitMask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'/%3E%3Cpath d='M9 18h6'/%3E%3Cpath d='M10 22h4'/%3E%3C/svg%3E") no-repeat center/contain;}`
);

content = content.replace(
  `.warn{background:var(--amber-bg);border:1px solid var(--amber-border);border-radius:9px;padding:.75rem 1rem;font-size:.79rem;line-height:1.6;color:var(--amber);}`,
  `.warn{background:var(--amber-bg);border:1px solid var(--amber-border);border-radius:9px;padding:.75rem 1rem .75rem 2.5rem;font-size:.79rem;line-height:1.6;color:var(--amber);position:relative;}`
);
content = content.replace(
  `.warn::before{content:'⚠️ ';font-size:.85rem;}`,
  `.warn::before{content:'';position:absolute;left:.95rem;top:.9rem;width:15px;height:15px;background:currentColor;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E") no-repeat center/contain;WebkitMask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E") no-repeat center/contain;}`
);

content = content.replace(
  `.success-note{background:var(--green-bg);border:1px solid var(--green-border);border-radius:9px;padding:.75rem 1rem;font-size:.79rem;line-height:1.6;color:var(--green);}`,
  `.success-note{background:var(--green-bg);border:1px solid var(--green-border);border-radius:9px;padding:.75rem 1rem .75rem 2.5rem;font-size:.79rem;line-height:1.6;color:var(--green);position:relative;}`
);
content = content.replace(
  `.success-note::before{content:'✅ ';font-size:.85rem;}`,
  `.success-note::before{content:'';position:absolute;left:.95rem;top:.9rem;width:15px;height:15px;background:currentColor;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/%3E%3Cpolyline points='22 4 12 14.01 9 11.01'/%3E%3C/svg%3E") no-repeat center/contain;WebkitMask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/%3E%3Cpolyline points='22 4 12 14.01 9 11.01'/%3E%3C/svg%3E") no-repeat center/contain;}`
);

// 3. String-based replacements for HTML body
content = content.replace('📖 About This Manual.', `${ICONS.book} <strong>About This Manual.</strong>`);
content = content.replace('🖨 Print / Save PDF', `${ICONS.print} Print / Save PDF`);
content = content.replace('📖 Full Manual', `${ICONS.book} Full Manual`);
content = content.replace('⚡ Quick Reference', `${ICONS.zap} Quick Reference`);

// Chapter icons and titles
content = content.replace('<div class="chapter-icon">📊</div>', `<div class="chapter-icon">${ICONS.dashboard}</div>`);
content = content.replace('<div class="chapter-icon c2">👥</div>', `<div class="chapter-icon c2">${ICONS.users}</div>`);
content = content.replace('<div class="chapter-icon">🏛</div>', `<div class="chapter-icon">${ICONS.landmark}</div>`);
content = content.replace('<div class="chapter-icon c2">📱</div>', `<div class="chapter-icon c2">${ICONS.smartphone}</div>`);
content = content.replace('<div class="chapter-icon c3">📝</div>', `<div class="chapter-icon c3">${ICONS.template}</div>`);
content = content.replace('<div class="chapter-icon">⏰</div>', `<div class="chapter-icon">${ICONS.clock}</div>`);
content = content.replace('<div class="chapter-icon c2">📅</div>', `<div class="chapter-icon c2">${ICONS.calendar}</div>`);
content = content.replace('<div class="chapter-icon c3">📊</div>', `<div class="chapter-icon c3">${ICONS.dashboard}</div>`);
content = content.replace('<div class="chapter-icon cdev">⚙️</div>', `<div class="chapter-icon cdev">${ICONS.sliders}</div>`);
content = content.replace('<div class="chapter-icon c3">💡</div>', `<div class="chapter-icon c3">${ICONS.bulb}</div>`);

// Feature cards / Stat cards icons
content = content.replace('<div class="feat-icon">👥</div>', `<div class="feat-icon">${ICONS.users}</div>`);
content = content.replace('<div class="feat-icon">📨</div>', `<div class="feat-icon">${ICONS.send}</div>`);
content = content.replace('<div class="feat-icon">⏰</div>', `<div class="feat-icon">${ICONS.clock}</div>`);
content = content.replace('<div class="feat-icon">📊</div>', `<div class="feat-icon">${ICONS.dashboard}</div>`);

// Constituency statistics icons
content = content.replace('<div class="feat-icon">👥</div>', `<div class="feat-icon">${ICONS.users}</div>`);
content = content.replace('<div class="feat-icon">📞</div>', `<div class="feat-icon">${ICONS.phone}</div>`);
content = content.replace('<div class="feat-icon">⚠️</div>', `<div class="feat-icon">${ICONS.alert}</div>`);
content = content.replace('<div class="feat-icon">📍</div>', `<div class="feat-icon">${ICONS.mappin}</div>`);
content = content.replace('<div class="feat-icon">🗳</div>', `<div class="feat-icon">${ICONS.station}</div>`);
content = content.replace('<div class="feat-icon">✅</div>', `<div class="feat-icon">${ICONS.check}</div>`);
content = content.replace('<div class="feat-icon">📱</div>', `<div class="feat-icon">${ICONS.smartphone}</div>`);

// Developer settings sections
content = content.replace('🎨 <span>Global Theming Engine</span>', `${ICONS.palette} <span>Global Theming Engine</span>`);
content = content.replace('📱 <span>Test SMS Sender</span>', `${ICONS.smartphone} <span>Test SMS Sender</span>`);
content = content.replace('⚡ <span>Simulation Playground (Stress Test)</span>', `${ICONS.zap} <span>Simulation Playground (Stress Test)</span>`);
content = content.replace('📋 <span>Recent SMS Logs</span>', `${ICONS.logs} <span>Recent SMS Logs</span>`);

// Quick reference card heading
content = content.replace('⚡ Quick Reference Card', `${ICONS.zap} Quick Reference Card`);

// Quick reference page navigation map icons
content = content.replace('<div class="chapter-icon">🗺</div>\n            <div><div class="chapter-name">Page Navigation Map</div></div>', `<div class="chapter-icon">${ICONS.map}</div>\n            <div><div class="chapter-name">Page Navigation Map</div></div>`);
content = content.replace('<div class="chapter-icon c2">📱</div>\n            <div><div class="chapter-name">How to Send a Bulk SMS — 5 Steps</div></div>', `<div class="chapter-icon c2">${ICONS.smartphone}</div>\n            <div><div class="chapter-name">How to Send a Bulk SMS — 5 Steps</div></div>`);
content = content.replace('<div class="chapter-icon c3">🏷</div>\n            <div><div class="chapter-name">Personalisation Tag Cheatsheet</div></div>', `<div class="chapter-icon c3">${ICONS.tag}</div>\n            <div><div class="chapter-name">Personalisation Tag Cheatsheet</div></div>`);
content = content.replace('<div class="chapter-icon">📊</div>\n            <div><div class="chapter-name">Message Status Reference</div></div>', `<div class="chapter-icon">${ICONS.dashboard}</div>\n            <div><div class="chapter-name">Message Status Reference</div></div>`);
content = content.replace('<div class="chapter-icon cdev">🔐</div>\n            <div><div class="chapter-name">Developer Portal Quick Access</div></div>', `<div class="chapter-icon cdev">${ICONS.lock}</div>\n            <div><div class="chapter-name">Developer Portal Quick Access</div></div>`);

// Interactive show/hide dev buttons
content = content.replace("btn.textContent = '👁 Show Dev Instructions';", `btn.innerHTML = '${ICONS.eye} Show Dev Instructions';`);
content = content.replace("btn.textContent = '🙈 Hide Dev Instructions';", `btn.innerHTML = '${ICONS.eyeoff} Hide Dev Instructions';`);
// Initial state text has emoji:
content = content.replace('Show/Hide Dev Instructions', 'Show/Hide Dev Instructions');

// Fix toggleDev initial load texts if they had emojis
content = content.replace('👁 Show Dev Instructions', `${ICONS.eye} Show Dev Instructions`);
content = content.replace('🙈 Hide Dev Instructions', `${ICONS.eyeoff} Hide Dev Instructions`);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully replaced all emojis with premium vector SVG and CSS icons in docs/user-manual.html!');
