import React from 'react';

/* ── SVG Icons — minimalist line art ── */
const SpreadsheetIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="32" height="32" rx="6" stroke="#1a2332" strokeWidth="1.5" fill="none"/>
    <line x1="4" y1="14" x2="36" y2="14" stroke="#1a2332" strokeWidth="1.5"/>
    <line x1="4" y1="24" x2="36" y2="24" stroke="#1a2332" strokeWidth="1.5"/>
    <line x1="16" y1="4" x2="16" y2="36" stroke="#1a2332" strokeWidth="1.5"/>
    <rect x="17" y="5" width="18" height="8" fill="#1a2332" opacity="0.07"/>
    <line x1="20" y1="18" x2="32" y2="18" stroke="#1a2332" strokeWidth="1" opacity="0.4"/>
    <line x1="20" y1="28" x2="28" y2="28" stroke="#1a2332" strokeWidth="1" opacity="0.4"/>
    <line x1="7" y1="18" x2="12" y2="18" stroke="#1a2332" strokeWidth="1.5" opacity="0.5"/>
    <line x1="7" y1="28" x2="12" y2="28" stroke="#1a2332" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="15" stroke="#1a2332" strokeWidth="1.5" fill="none"/>
    <line x1="20" y1="20" x2="20" y2="11" stroke="#1a2332" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="20" x2="28" y2="24" stroke="#1a2332" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="2" fill="#1a2332"/>
    <line x1="20" y1="6" x2="20" y2="8" stroke="#1a2332" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="34" y1="20" x2="32" y2="20" stroke="#1a2332" strokeWidth="1.5" strokeLinecap="round"/>
    {/* X mark */}
    <line x1="28" y1="8" x2="32" y2="4" stroke="#e55" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="32" y1="8" x2="28" y2="4" stroke="#e55" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DisconnectedIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="3" y="8" width="14" height="10" rx="3" stroke="#1a2332" strokeWidth="1.5" fill="none"/>
    <rect x="23" y="8" width="14" height="10" rx="3" stroke="#1a2332" strokeWidth="1.5" fill="none"/>
    <rect x="3" y="24" width="14" height="10" rx="3" stroke="#1a2332" strokeWidth="1.5" fill="none"/>
    <rect x="23" y="24" width="14" height="10" rx="3" stroke="#1a2332" strokeWidth="1.5" fill="none"/>
    {/* Broken connection */}
    <line x1="17" y1="13" x2="21" y2="13" stroke="#1a2332" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4"/>
    <line x1="17" y1="29" x2="21" y2="29" stroke="#1a2332" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4"/>
    <line x1="10" y1="18" x2="10" y2="24" stroke="#1a2332" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4"/>
    <line x1="30" y1="18" x2="30" y2="24" stroke="#1a2332" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4"/>
    {/* Warning mark */}
    <circle cx="20" cy="20" r="5" fill="none" stroke="#e55" strokeWidth="1.5"/>
    <line x1="20" y1="17" x2="20" y2="20.5" stroke="#e55" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="20" cy="22.5" r="0.75" fill="#e55"/>
  </svg>
);

const problems = [
  {
    icon: <SpreadsheetIcon />,
    title: 'Mark sheets lost in spreadsheet chaos',
    desc: 'Teachers juggle dozens of unsynchronized Excel files per class, per term. Coefficient-weighted averages are calculated by hand, errors are common, and cross-verification takes days.',
    stat: '12 hrs/week lost per teacher',
  },
  {
    icon: <ClockIcon />,
    title: 'Report cards take weeks, not minutes',
    desc: 'Generating GCE and BEPC-compliant report cards means manual data entry for every student. Ranking calculations, subject averages, and grade publications delay term closures by 2–3 weeks.',
    stat: '3-week delay per term cycle',
  },
  {
    icon: <DisconnectedIcon />,
    title: 'Parents are left completely in the dark',
    desc: 'No real-time access to grades, no attendance notifications, no secure channel to communicate with teachers. Parent engagement relies entirely on physical report cards twice a year.',
    stat: '74% of parents want live updates',
  },
];

const TheProblem = () => (
  <section className="problem-section" id="problem">
    <div className="container">
      <div className="problem-header reveal">
        <span className="eyebrow">The Challenge</span>
        <h2 className="section-headline" style={{ marginBottom: 20 }}>
          Why 80% of African schools
          <br />
          still struggle with administration
        </h2>
        <p className="section-sub">
          From Yaoundé to Lagos, school administrators face the same systemic problems —
          fragmented tools, manual processes, and zero visibility for parents.
        </p>
      </div>

      <div className="problem-grid">
        {problems.map((p, i) => (
          <div
            key={i}
            className={`problem-card spotlight-card reveal reveal-delay-${i + 1}`}
          >
            <div className="problem-icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <span className="problem-stat">{p.stat}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TheProblem;
