import React from 'react';
import { 
  CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Award, 
  XCircle, FileWarning, TrendingDown, FileSpreadsheet, Clock, BellOff, ArrowUpRight
} from 'lucide-react';

const problems = [
  {
    icon: <FileSpreadsheet size={28} strokeWidth={1.75} color="#2D8C8C" />,
    title: 'Mark sheets lost in spreadsheet chaos',
    desc: 'Teachers juggle dozens of unsynchronized Excel files per class, per term. Coefficient-weighted averages are calculated by hand, errors are common, and cross-verification takes days.',
    stat: '12 hrs/week lost per teacher',
  },
  {
    icon: <Clock size={28} strokeWidth={1.75} color="#2D8C8C" />,
    title: 'Report cards take weeks, not minutes',
    desc: 'Generating GCE and BEPC-compliant report cards means manual data entry for every student. Ranking calculations, subject averages, and grade publications delay term closures by 2–3 weeks.',
    stat: '3-week delay per term cycle',
  },
  {
    icon: <BellOff size={28} strokeWidth={1.75} color="#2D8C8C" />,
    title: 'Parents are left completely in the dark',
    desc: 'No real-time access to grades, no attendance notifications, no secure channel to communicate with teachers. Parent engagement relies entirely on physical report cards twice a year.',
    stat: '74% of parents want live updates',
  },
];

const TheProblem = () => (
  <section className="problem-section" id="problem">
    <div className="container">
      <div className="about-block-layout">
        {/* Left Column: Credibility, Checklist, Visual Image & Experience Badge */}
        <div className="about-credibility-col reveal">

          <h2 className="section-headline">
            Why 80% of African schools
            <br />
            <span className="text-teal">still struggle with legacy administration</span>
          </h2>

          <p className="section-sub">
            From Yaoundé to Lagos, school administrators face the same systemic bottlenecks —
            drowning in physical mark sheets, error-prone calculations, and zero parent transparency.
          </p>

          {/* Visual Archive Crisis Card */}
          <div className="problem-visual-card">
            <div className="problem-img-wrap">
              <img
                src="/images/luxury/paper-archives.jpg"
                alt="Manual paper archives chaos before Edvance"
                className="problem-archive-img"
              />
              <div className="problem-img-badge">
                <FileWarning size={13} color="#DC2626" />
                <span>Legacy Manual Archives</span>
              </div>
            </div>
            <div className="problem-img-caption">
              <span>Paper-based record storage costs institutions up to <strong>15% of annual operational time</strong> in retrieval and recalculation delays.</span>
            </div>
          </div>

          {/* Credibility Checklist */}
          <div className="about-checklist">
            <div className="about-check-item">
              <CheckCircle2 size={18} className="about-check-icon text-teal" />
              <span>Full alignment with MINESEC official coefficient matrices</span>
            </div>
            <div className="about-check-item">
              <CheckCircle2 size={18} className="about-check-icon text-teal" />
              <span>Dedicated Anglophone GCE Board & Francophone BEPC modules</span>
            </div>
            <div className="about-check-item">
              <CheckCircle2 size={18} className="about-check-icon text-teal" />
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

