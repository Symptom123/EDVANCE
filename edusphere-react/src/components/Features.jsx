import React, { useState } from 'react';
import { 
  ArrowRight, Star, Layers, Calculator, FileText, Smartphone, Building2, 
  Check, ShieldCheck, Sparkles, CreditCard, Clock, CheckCircle2, TrendingUp, Zap
} from 'lucide-react';

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
    previewType: 'calc',
    highlightMetric: '100% Accuracy',
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
    previewType: 'report',
    highlightMetric: 'Instant PDF',
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
    previewType: 'mobile',
    highlightMetric: 'Instant SMS',
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
    previewType: 'campus',
    highlightMetric: '99.9% Uptime',
  },
  {
    id: 'finance',
    num: '05',
    category: 'campus',
    cornerBadge: 'MoMo & Cash',
    rating: '4.9',
    reviews: '340+ schools',
    title: 'Automated Tuition Ledger & Mobile Money',
    desc: 'Track fee installments, generate official stamped receipts, and reconcile MTN / Orange Money payments automatically with zero accounting discrepancies.',
    tags: ['MTN MoMo', 'Orange Money', 'Receipt Printing', 'Arrears Tracking'],
    meta: ['Automated Reminders', 'Audit Ledger', 'Cashier Control'],
    author: { name: 'Institutional Bursary Suite', role: 'Finance Engine' },
    statusBadge: 'Finance Module',
    previewType: 'finance',
    highlightMetric: '0 Discrepancies',
  },
  {
    id: 'attendance',
    num: '06',
    category: 'grading',
    cornerBadge: 'Sequence Tracker',
    rating: '4.9',
    reviews: '280+ schools',
    title: 'Syllabus & Sequence Coverage Analytics',
    desc: 'Track pedagogical curriculum completion rates across all departments. Spot delayed subject coverage weeks before official national exams take place.',
    tags: ['Syllabus Progress', 'Teacher Logbook', 'Inspection Ready'],
    meta: ['Coverage Metrics', 'Department Audits', 'Discipline Log'],
    author: { name: 'Academic Inspectorate Unit', role: 'Curriculum Standard' },
    statusBadge: 'Analytics',
    previewType: 'analytics',
    highlightMetric: '100% On-Track',
  }
];

const categoryTabs = [
  { id: 'all', label: 'All Modules', count: '06', icon: Layers },
  { id: 'grading', label: 'Grade Engine', count: '02', icon: Calculator },
  { id: 'reports', label: 'Report Cards', count: '01', icon: FileText },
  { id: 'parent', label: 'Parent Portal', count: '01', icon: Smartphone },
  { id: 'campus', label: 'Campus & Finance', count: '02', icon: Building2 },
];

const Features = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredSolutions = activeTab === 'all' 
    ? solutions 
    : solutions.filter(s => s.category === activeTab);

  return (
    <section className="solution-section" id="solution">
      {/* ── Animated Background Visual Elements ── */}
      <div className="solution-bg-fx" aria-hidden="true">
        <div className="sol-orb sol-orb-1" />
        <div className="sol-orb sol-orb-2" />
        <div className="sol-grid-mesh" />
        {/* Floating tech circuit shapes */}
        <svg className="sol-circuit-svg" viewBox="0 0 1000 600" fill="none">
          <path d="M50 100 H300 L350 150 H700" stroke="var(--teal-primary)" strokeWidth="1" strokeDasharray="6 6" opacity="0.15" />
          <path d="M200 450 H600 L650 400 H950" stroke="var(--teal-primary)" strokeWidth="1" strokeDasharray="4 8" opacity="0.12" />
          <circle cx="350" cy="150" r="4" fill="var(--teal-primary)" opacity="0.3" />
          <circle cx="650" cy="400" r="4" fill="var(--orange-accent)" opacity="0.3" />
        </svg>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div className="solution-header reveal">
          <div className="section-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span className="eyebrow-label">Integrated Platform</span>
          </div>

          <h2 className="section-headline">
            How Edvance transforms
            <br />
            <span className="text-teal">every layer of school operations</span>
          </h2>

          <p className="section-sub">
            Modular, battle-tested capabilities designed specifically for African educational standards.
            Eliminate manual friction for administrators, teachers, registrars, and parents.
          </p>
        </div>

        {/* Category Selector Tabs */}
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
            <div key={s.id} className={`dense-info-card reveal reveal-delay-${(i % 3) + 1}`}>
              {/* Card Header Preview Banner */}
              <div className="card-mini-visual-banner">
                <div className="banner-badge-left">
                  <span className="card-corner-badge">{s.cornerBadge}</span>
                  <span className="card-metric-tag">
                    <Zap size={11} className="text-teal" />
                    <span>{s.highlightMetric}</span>
                  </span>
                </div>
                <div className="card-rating">
                  <div className="card-stars">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={12} fill="#E8A23A" color="#E8A23A" />
                    ))}
                  </div>
                  <span className="rating-num">{s.rating}</span>
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
                    <Check size={11} className="meta-check text-teal" />
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

              {/* Card Footer: Author Avatar & Action Button */}
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

        {/* Bottom CTA Banner inside Solution section */}
        <div className="solution-bottom-banner reveal">
          <div className="sol-banner-content">
            <div className="sol-banner-text">
              <h4>Ready to modernize your academic workflow?</h4>
              <p>Join over 2,400+ forward-thinking schools using Edvance across sub-Saharan Africa.</p>
            </div>
            <div className="sol-banner-actions">
              <a href="/register" className="btn btn-primary">
                <span>Start Free Institutional Trial</span>
                <ArrowRight size={16} className="btn-arrow-trailing" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

