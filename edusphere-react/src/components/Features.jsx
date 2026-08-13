import React from 'react';
import { Users, GraduationCap, MessageCircle, BarChart2, CreditCard, Building, Check } from 'lucide-react';

// Education illustration used as a subtle section accent
const EDU_IMG = '/images/Blue Tech Education Concept Photo And Picture For Free Download - Pngtree.jpg';

const features = [
  {
    icon: <Users size={18} />,
    title: 'Student Management',
    desc: 'Complete student lifecycle management — enrollment, academic records, behavior tracking, and graduation in a single view.',
    items: ['Smart enrollment workflows', 'Academic progress tracking', 'Automated report generation'],
    id: 'feat-students',
  },
  {
    icon: <GraduationCap size={18} />,
    title: 'Teacher Workspace',
    desc: 'A professional workspace for educators — lesson planning, grading, attendance, and parent communication from one screen.',
    items: ['Digital gradebook', 'Lesson plan library', 'One-click attendance'],
    id: 'feat-teachers',
  },
  {
    icon: <MessageCircle size={18} />,
    title: 'Parent Portal',
    desc: 'Keep parents meaningfully engaged with real-time access to their child\'s progress, attendance, and school communications.',
    items: ['Real-time grade updates', 'Direct teacher messaging', 'Fee payment & history'],
    id: 'feat-parents',
  },
  {
    icon: <BarChart2 size={18} />,
    title: 'Analytics & Reporting',
    desc: 'Institutional intelligence at your fingertips. Track performance trends, identify risks early, and make data-driven decisions.',
    items: ['Custom report builder', 'Early-warning indicators', 'Board-ready dashboards'],
    id: 'feat-analytics',
  },
  {
    icon: <CreditCard size={18} />,
    title: 'Finance Management',
    desc: 'Streamlined fee collection, expense tracking, payroll management, and financial reporting — all compliant and auditable.',
    items: ['Online fee collection', 'Payroll processing', 'Financial audit trails'],
    id: 'feat-finance',
  },
  {
    icon: <Building size={18} />,
    title: 'Administration Hub',
    desc: 'A command center for school leaders — manage staff, campuses, compliance, and institutional strategy from one dashboard.',
    items: ['Multi-campus management', 'Role-based access control', 'Compliance reporting'],
    id: 'feat-admin',
  },
];

const Features = () => {
  return (
    <section className="features-section" id="features">
      <div className="container">
        {/* Section header with subtle education image accent */}
        <div className="section-header reveal" style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '200px',
            height: '200px',
            backgroundImage: `url("${EDU_IMG}")`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
            opacity: 0.12,
            pointerEvents: 'none',
          }} aria-hidden="true" />
          <p className="section-eyebrow">Platform Features</p>
          <h2 className="section-title">Everything your school needs,<br />in one place</h2>
          <p className="section-body">
            EDUVANCE replaces a dozen disconnected tools with a single, coherent platform.
            From admissions to alumni, every workflow is covered.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              className={`feature-card reveal ${i % 3 === 1 ? '' : i % 3 === 2 ? '' : ''}`}
              key={f.id}
              id={f.id}
            >
              <div className="feature-icon-wrap">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <ul className="feature-list">
                {f.items.map(item => (
                  <li key={item}><Check size={14} /> {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
