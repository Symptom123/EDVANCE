import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Award } from 'lucide-react';

/* ── SVG Icons — redesigned with clean palette ── */
const SpreadsheetIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="32" height="32" rx="8" stroke="#1E5FD9" strokeWidth="1.75" fill="#F0F4FC"/>
    <line x1="4" y1="14" x2="36" y2="14" stroke="#1E5FD9" strokeWidth="1.5"/>
    <line x1="4" y1="24" x2="36" y2="24" stroke="#1E5FD9" strokeWidth="1.5"/>
    <line x1="16" y1="4" x2="16" y2="36" stroke="#1E5FD9" strokeWidth="1.5"/>
    <rect x="17" y="5" width="18" height="8" fill="#1E5FD9" opacity="0.15"/>
    <line x1="20" y1="19" x2="32" y2="19" stroke="#E8A23A" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="29" x2="28" y2="29" stroke="#E8A23A" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="16" stroke="#E8A23A" strokeWidth="1.75" fill="#FEF6EB"/>
    <line x1="20" y1="20" x2="20" y2="10" stroke="#0F1E33" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="20" x2="28" y2="24" stroke="#0F1E33" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="2.5" fill="#1E5FD9"/>
  </svg>
);

const DisconnectedIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="4" y="8" width="13" height="10" rx="3" stroke="#0F1E33" strokeWidth="1.5" fill="#F0F4FC"/>
    <rect x="23" y="8" width="13" height="10" rx="3" stroke="#0F1E33" strokeWidth="1.5" fill="#F0F4FC"/>
    <rect x="4" y="22" width="13" height="10" rx="3" stroke="#0F1E33" strokeWidth="1.5" fill="#F0F4FC"/>
    <rect x="23" y="22" width="13" height="10" rx="3" stroke="#0F1E33" strokeWidth="1.5" fill="#F0F4FC"/>
    <line x1="17" y1="13" x2="23" y2="13" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3"/>
    <line x1="17" y1="27" x2="23" y2="27" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3"/>
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
      <div className="about-block-layout">
        {/* Left Column: Credibility, Checklist & Experience Badge */}
        <div className="about-credibility-col reveal">
          <div className="section-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span className="eyebrow-label">The Challenge</span>
          </div>

          <h2 className="section-headline">
            Why 80% of African schools
            <br />
            <span className="text-blue">still struggle with administration</span>
          </h2>

          <p className="section-sub">
            From Yaoundé to Lagos, school administrators face the same systemic problems —
            fragmented tools, manual processes, and zero visibility for parents.
          </p>

          {/* Credibility Checklist */}
          <div className="about-checklist">
            <div className="about-check-item">
              <CheckCircle2 size={18} className="about-check-icon text-blue" />
              <span>Full alignment with MINESEC official coefficient matrices</span>
            </div>
            <div className="about-check-item">
              <CheckCircle2 size={18} className="about-check-icon text-blue" />
              <span>Dedicated Anglophone GCE Board & Francophone BEPC modules</span>
            </div>
            <div className="about-check-item">
              <CheckCircle2 size={18} className="about-check-icon text-blue" />
              <span>Offline-first mark entry safeguards against power & network cuts</span>
            </div>
          </div>

          {/* Circular Experience / Credibility Badge */}
          <div className="about-experience-card">
            <div className="experience-circle-badge">
              <span className="exp-num">10+</span>
              <span className="exp-label">Years</span>
            </div>
            <div className="exp-info">
              <h4>Modernizing African Education</h4>
              <p>Trusted by chancellors, principals, and academic deans across 2,400+ campuses.</p>
            </div>
          </div>
        </div>

        {/* Right Column: The 3 Systemic Problem Cards */}
        <div className="problem-grid-col">
          {problems.map((p, i) => (
            <div
              key={i}
              className={`problem-card reveal reveal-delay-${i + 1}`}
            >
              <div className="problem-card-top">
                <div className="problem-icon-wrap">{p.icon}</div>
                <span className="problem-stat-pill">{p.stat}</span>
              </div>
              <h3 className="problem-card-title">{p.title}</h3>
              <p className="problem-card-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default TheProblem;
