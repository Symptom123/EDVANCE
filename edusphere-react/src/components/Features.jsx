import React from 'react';
import { ArrowRight } from 'lucide-react';

const solutions = [
  {
    num: '01',
    title: 'Automated Grade Calculation in 30 Seconds',
    desc: 'Enter raw marks once. Edvance instantly computes weighted averages by coefficient, class rankings, and subject-level performance — exactly per GCE, BEPC, and Baccalauréat standards. No formulas, no errors.',
    tags: ['GCE O/A Level', 'BEPC', 'Baccalauréat', 'Coefficient Weighting'],
  },
  {
    num: '02',
    title: 'One-Click Report Card Generation',
    desc: 'Professional, bilingual (French/English) report cards generated and published instantly. Ranking, class average, teacher remarks, and attendance — all auto-populated, print-ready, and shareable digitally.',
    tags: ['Bilingual Output', 'Instant Ranking', 'Parent PDF Delivery'],
  },
  {
    num: '03',
    title: 'Real-Time Parent Portal with Live Alerts',
    desc: 'Parents access a secure dashboard showing live grades, attendance records, fee balances, and school announcements. SMS and push notifications sent the moment marks are published.',
    tags: ['Live Grade Feed', 'Attendance Alerts', 'Fee Payments'],
  },
  {
    num: '04',
    title: 'Multi-Campus Administration at Enterprise Scale',
    desc: 'Manage hundreds of classrooms, dozens of teachers, and thousands of students from a single command center. Role-based permissions, audit trails, and compliance reports built in from day one.',
    tags: ['Multi-Campus', 'RBAC Permissions', 'Compliance Reports'],
  },
];

const Features = () => (
  <section className="solution-section" id="solution">
    <div className="container">
      <div className="solution-header reveal">
        <span className="eyebrow eyebrow--gold">The Solution</span>
        <h2 className="section-headline section-headline--white" style={{ marginBottom: 20 }}>
          How Edvance changes
          <br />
          everything for your school
        </h2>
        <p className="section-sub section-sub--white">
          Four interconnected capabilities that eliminate manual work and give
          every stakeholder — administrators, teachers, and parents — exactly what they need.
        </p>
      </div>

      <div className="solution-grid">
        {solutions.map((s, i) => (
          <div key={i} className={`solution-card spotlight-card reveal reveal-delay-${(i % 2) + 1}`}>
            <span className="solution-card-number">{s.num}</span>

            <div className="solution-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                {i === 0 && (
                  <>
                    <rect x="2" y="2" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="8" y1="8" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 12 L16 12 M12 15 L14 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </>
                )}
                {i === 1 && (
                  <>
                    <rect x="4" y="2" width="14" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <line x1="7" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M13 14 L16 17 L19 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                )}
                {i === 2 && (
                  <>
                    <circle cx="11" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M3 20C3 16.7 6.6 14 11 14C15.4 14 19 16.7 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <circle cx="18" cy="5" r="3" fill="currentColor" opacity="0.4"/>
                    <line x1="18" y1="3" x2="18" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </>
                )}
                {i === 3 && (
                  <>
                    <rect x="2" y="4" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <rect x="12" y="4" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <rect x="2" y="14" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <rect x="12" y="14" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <line x1="10" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="10" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="6" y1="10" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="16" y1="10" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                  </>
                )}
              </svg>
            </div>

            <h3>{s.title}</h3>
            <p>{s.desc}</p>

            <div className="solution-tags">
              {s.tags.map((tag, ti) => (
                <span key={ti} className="solution-tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="reveal" style={{ marginTop: 56, textAlign: 'center' }}>
        <a href="/register" className="btn btn-primary">
          See all features
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  </section>
);

export default Features;
