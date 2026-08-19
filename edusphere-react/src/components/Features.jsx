import React, { useState } from 'react';
import { ArrowRight, Star, Layers, Calculator, FileText, Smartphone, Building2, Check, ShieldCheck, Sparkles } from 'lucide-react';

const solutions = [
  {
    id: 'grading',
    num: '01',
    category: 'grading',
    cornerBadge: 'Sequence 1–6',
    rating: '4.9',
    reviews: '480+ schools',
    title: 'Automated Grade Calculation in 30 Seconds',
    desc: 'Enter raw marks once. Edvance instantly computes weighted averages by coefficient, class rankings, and subject-level performance — exactly per GCE, BEPC, and Baccalauréat standards. No formulas, no errors.',
    tags: ['GCE O/A Level', 'BEPC', 'Baccalauréat', 'Coefficient Weighting'],
    meta: ['Real-time Ranking', 'Coefficient Auto-Sum', 'Offline Validation'],
    author: { name: 'Academic Evaluation Engine', role: 'MINESEC Standard' },
    statusBadge: 'Core Module',
  },
  {
    id: 'reports',
    num: '02',
    category: 'reports',
    cornerBadge: 'MINESEC Ready',
    rating: '5.0',
    reviews: '520+ schools',
    title: 'One-Click Report Card Generation',
    desc: 'Professional, bilingual (French/English) report cards generated and published instantly. Ranking, class average, teacher remarks, and attendance — all auto-populated, print-ready, and shareable digitally.',
    tags: ['Bilingual Output', 'Instant Ranking', 'Parent PDF Delivery'],
    meta: ['Tamper-Proof QR Seal', 'Batch PDF Export', 'Custom Crest & Signature'],
    author: { name: 'Official Registrar Engine', role: 'Bilingual System' },
    statusBadge: 'Core Module',
  },
  {
    id: 'parent',
    num: '03',
    category: 'parent',
    cornerBadge: 'Live Mobile Alerts',
    rating: '4.9',
    reviews: '390+ schools',
    title: 'Real-Time Parent Portal with Live Alerts',
    desc: 'Parents access a secure dashboard showing live grades, attendance records, fee balances, and school announcements. SMS and push notifications sent the moment marks are published.',
    tags: ['Live Grade Feed', 'Attendance Alerts', 'Fee Payments'],
    meta: ['SMS & WhatsApp Gateway', 'Instant Push Feed', 'Tuition Ledger'],
    author: { name: 'Parent Engagement Suite', role: 'Family Network' },
    statusBadge: 'Core Module',
  },
  {
    id: 'campus',
    num: '04',
    category: 'campus',
    cornerBadge: 'Multi-Campus',
    rating: '4.8',
    reviews: '210+ institutions',
    title: 'Multi-Campus Administration at Enterprise Scale',
    desc: 'Manage hundreds of classrooms, dozens of teachers, and thousands of students from a single command center. Role-based permissions, audit trails, and compliance reports built in from day one.',
    tags: ['Multi-Campus', 'RBAC Permissions', 'Compliance Reports'],
    meta: ['Centralized Roster', 'Audit Trail Logging', 'District Analytics'],
    author: { name: 'District Governance Suite', role: 'Enterprise Tier' },
    statusBadge: 'Enterprise Ready',
  },
];

const categoryTabs = [
  { id: 'all', label: 'All Modules', count: '04', icon: Layers },
  { id: 'grading', label: 'Grade Engine', count: '01', icon: Calculator },
  { id: 'reports', label: 'Report Cards', count: '02', icon: FileText },
  { id: 'parent', label: 'Parent Portal', count: '03', icon: Smartphone },
  { id: 'campus', label: 'Multi-Campus', count: '04', icon: Building2 },
];

const Features = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredSolutions = activeTab === 'all' 
    ? solutions 
    : solutions.filter(s => s.category === activeTab);

  return (
    <section className="solution-section" id="solution">
      <div className="container">
        {/* Section Header */}
        <div className="solution-header reveal">
          <div className="section-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span className="eyebrow-label">The Solution</span>
          </div>

          <h2 className="section-headline">
            How Edvance changes
            <br />
            <span className="text-blue">everything for your school</span>
          </h2>

          <p className="section-sub">
            Four interconnected capabilities that eliminate manual work and give
            every stakeholder — administrators, teachers, and parents — exactly what they need.
          </p>
        </div>

        {/* Category Selector Tabs (Tab-Selector Cards: Icon + Label + Count) */}
        <div className="category-tabs-wrapper reveal reveal-delay-1">
          <div className="category-tabs-list">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`category-tab-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                >
                  <div className="tab-icon-wrap">
                    <Icon size={16} />
                  </div>
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-count-pill">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dense Information-Rich Card Grid */}
        <div className="dense-card-grid">
          {filteredSolutions.map((s, i) => (
            <div key={s.id} className={`dense-info-card reveal reveal-delay-${(i % 2) + 1}`}>
              {/* Top Banner / Corner Status Badge & Star Rating */}
              <div className="card-top-row">
                <span className="card-corner-badge">{s.cornerBadge}</span>
                <div className="card-rating">
                  <div className="card-stars">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={13} fill="#E8A23A" color="#E8A23A" />
                    ))}
                  </div>
                  <span className="rating-num">{s.rating}</span>
                  <span className="rating-reviews">({s.reviews})</span>
                </div>
              </div>

              {/* Card Title & Description */}
              <div className="card-body-content">
                <div className="card-index-title">
                  <span className="card-index-num">{s.num}</span>
                  <h3 className="card-main-title">{s.title}</h3>
                </div>
                <p className="card-main-desc">{s.desc}</p>
              </div>

              {/* Meta-Info Row */}
              <div className="card-meta-row">
                {s.meta.map((m, mi) => (
                  <span key={mi} className="meta-pill">
                    <Check size={11} className="meta-check text-blue" />
                    <span>{m}</span>
                  </span>
                ))}
              </div>

              {/* Tags Row */}
              <div className="card-tags-row">
                {s.tags.map((tag, ti) => (
                  <span key={ti} className="solution-tag">{tag}</span>
                ))}
              </div>

              {/* Card Footer: Instructor / Author Avatar with Name and Price / Status Badge */}
              <div className="card-footer-row">
                <div className="card-author-block">
                  <div className="author-avatar-circle">
                    <span>{s.num}</span>
                  </div>
                  <div className="author-info-text">
                    <div className="author-name">{s.author.name}</div>
                    <div className="author-role">{s.author.role}</div>
                  </div>
                </div>

                <div className="card-action-block">
                  <span className="card-status-pill">{s.statusBadge}</span>
                  <a href="/register" className="card-action-link" aria-label={`Explore ${s.title}`}>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="reveal" style={{ marginTop: 48, textAlign: 'center' }}>
          <a href="/register" className="btn btn-primary">
            <span>See all features</span>
            <ArrowRight size={16} className="btn-arrow-trailing" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;
