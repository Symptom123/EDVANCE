import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const steps = [
  {
    num: '01',
    stepLabel: 'Step 01 — Zero-Friction Setup',
    title: 'School structure & coefficient configuration',
    desc: 'Input your school profile, academic terms, streams (Anglophone GCE / Francophone BEPC & Bac), subject coefficients, and grading scales in under 15 minutes. Our regional onboarding specialists assist with roster CSV imports.',
    details: [
      'Import student rosters and previous term archives in 1 click',
      'Preset MINESEC and West African curriculum templates',
      'Automatic generation of staff accounts with role-based access'
    ]
  },
  {
    num: '02',
    stepLabel: 'Step 02 — Seamless Mark Entry',
    title: 'Teachers input continuous assessment & exam scores',
    desc: 'Educators use a rapid, keyboard-first digital mark sheet designed to work smoothly even on low-bandwidth connections. Raw marks for Sequences 1 through 6 and Mock/Official exams are logged with instant validation.',
    details: [
      'Keyboard arrow navigation for ultra-fast score input',
      'Offline-first caching prevents data loss during power cuts',
      'Automated highlight of missing entries and score anomalies'
    ]
  },
  {
    num: '03',
    stepLabel: 'Step 03 — Instantaneous Computation',
    title: 'The engine calculates weighted averages & class ranks',
    desc: 'Eliminate human error entirely. The system calculates exact weighted averages multiplied by subject coefficients, establishes class general averages, determines honors/probation, and assigns precise rankings.',
    details: [
      '100% compliant with coefficient weighting rules',
      'Automated tie-breaking and rank re-indexing',
      'Subject teacher comment generation with AI assistance'
    ]
  },
  {
    num: '04',
    stepLabel: 'Step 04 — Distribution & Visibility',
    title: 'Parents receive bilingual report cards via portal and SMS',
    desc: 'Generate official, tamper-proof PDF report cards in bulk with school crest, principal signature watermark, and QR verification. Parents receive instant notification and access via their dedicated portal.',
    details: [
      '1-click batch PDF export for physical printing ceremonies',
      'Instant SMS notifications to guardian phone numbers',
      'Real-time student progress tracking throughout the year'
    ]
  },
];

const HowItWorks = () => {
  return (
    <section className="how-section" id="how-it-works">
      <div className="container">
        <div className="how-layout">
          {/* Left Column: Sticky Header */}
          <div className="how-sticky-header reveal">
            <span className="eyebrow">The 4-Step Workflow</span>
            <h2 className="section-headline">
              From raw marks<br />
              to certified reports<br />
              in four seamless steps
            </h2>
            <p className="section-sub" style={{ marginBottom: '36px' }}>
              Designed to eliminate weeks of spreadsheet fatigue and give school leaders
              unshakable confidence before every Parent-Teacher Assembly.
            </p>
            <a href="/register" className="btn btn-primary">
              Experience the workflow
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right Column: Vertical Timeline */}
          <div className="timeline">
            {steps.map((s, idx) => (
              <div 
                key={s.num} 
                className={`timeline-item ${idx === 1 ? 'active' : ''} reveal reveal-delay-${idx + 1}`}
              >
                <div className="timeline-marker">
                  <span className="timeline-marker-inner">{s.num}</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-step-label">{s.stepLabel}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <div className="timeline-detail">
                    {s.details.map((d, di) => (
                      <div key={di} className="timeline-detail-row">
                        <div className="td-check">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
