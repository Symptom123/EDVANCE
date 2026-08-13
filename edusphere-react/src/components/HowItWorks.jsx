import React from 'react';
import { Settings, Upload, Users, Zap } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: <Settings size={20} />,
    title: 'Configure your school',
    desc: 'Set up your school profile, academic calendar, class structure, and fee schedules. Our onboarding team guides you through every step.',
  },
  {
    num: '02',
    icon: <Upload size={20} />,
    title: 'Import your data',
    desc: 'Migrate existing student records, staff information, and historical data securely. We support CSV imports and direct integrations.',
  },
  {
    num: '03',
    icon: <Users size={20} />,
    title: 'Invite your team',
    desc: 'Send role-specific invitations to administrators, teachers, and support staff. Each person gets a tailored experience.',
  },
  {
    num: '04',
    icon: <Zap size={20} />,
    title: 'Go live',
    desc: 'Launch EDUVANCE across your school. Parents and students get access within minutes. Real support from real people, always.',
  },
];

const HowItWorks = () => {
  return (
    <section className="how-section" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Premium emerald glow — bottom right */}
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px',
        width: '480px', height: '480px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />

      <div className="container">
        <div
          className="section-header reveal"
          style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 56px" }}
        >
          <p className="section-eyebrow">Getting Started</p>
          <h2 className="section-title">Up and running in days,<br />not months</h2>
          <p className="section-body">
            No lengthy implementation projects, no consultants required. Our streamlined
            onboarding gets your entire school live in days.
          </p>
        </div>

        <div className="how-steps">
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div className={`how-step reveal ${i > 0 ? `reveal-delay-${Math.min(i, 3)}` : ''}`}>
                <div className="step-number">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {i < steps.length - 1 && <div className="how-connector"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

