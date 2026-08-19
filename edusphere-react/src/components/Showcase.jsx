import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  FileText, 
  Award, 
  Sliders, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Check, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const Showcase = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFeature, setActiveFeature] = useState('marks');

  const featureOptions = [
    { id: 'marks', label: 'Mark Entry & Ranks', icon: BarChart3, badge: 'Active' },
    { id: 'roster', label: 'Student Roster (Form 5)', icon: Users, badge: '70 Enrolled' },
    { id: 'reportcard', label: 'Report Card Batch', icon: FileText, badge: 'Ready' },
    { id: 'sync', label: 'GCE / BEPC Sync', icon: GraduationCap, badge: '100%' },
    { id: 'honor', label: 'Honor Roll & Ranks', icon: Award, badge: 'Top 10' },
    { id: 'matrix', label: 'Coefficient Matrix', icon: Sliders, badge: 'MINESEC' },
  ];

  return (
    <section className="showcase-section" id="dashboard">
      <div className="container">
        <div className="showcase-header reveal">
          <div className="section-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span className="eyebrow-label">Interactive Telemetry</span>
          </div>
          <h2 className="section-headline">
            Engineered for real African classrooms,<br />
            <span className="text-blue">not Silicon Valley theory</span>
          </h2>
          <p className="section-sub">
            A high-density, low-latency command center that handles Cameroon's Sequence 1–4,
            weighted coefficients, and bilingual ranking without breaking a sweat.
          </p>
        </div>

        {/* The Real SMS Dashboard Window with annotations */}
        <div className="dashboard-frame reveal reveal-delay-1 spotlight-card">
          {/* Top macOS-style bar */}
          <div className="dash-topbar">
            <div className="dash-topbar-left">
              <div className="dash-dots">
                <span className="dash-dot dd-r" />
                <span className="dash-dot dd-y" />
                <span className="dash-dot dd-g" />
              </div>
              
              {/* Feature Sidebar Toggle Button */}
              <button 
                className={`dash-sidebar-toggle-btn ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Hide Feature Sidebar (Free Up Screen Space)" : "Open Feature Sidebar"}
                aria-label="Toggle Feature Sidebar"
              >
                {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span>{sidebarOpen ? 'Collapse Features' : 'Expand Features (6)'}</span>
              </button>
            </div>

            <div className="dash-title-bar">
              edvance.io/app/school/lycee-bilingue-de-yaounde/{activeFeature}
            </div>

            <div className="dash-topbar-right">
              <span className="dash-status-pill">
                <span className="live-dot" /> Term 2 • Sequence 3
              </span>
            </div>
          </div>

          <div className={`dash-body ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            {/* Collapsible Feature Options Sidebar */}
            {sidebarOpen && (
              <div className="dash-sidebar">
                <div className="dash-sidebar-logo">
                  <div className="ds-logo-mark">E</div>
                  <div>
                    <div className="ds-logo-name">Lycée Bilingue</div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Yaoundé Campus</span>
                  </div>
                </div>

                <div className="dash-sidebar-heading">
                  <span>Feature Options</span>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="dash-sidebar-close-mini"
                    title="Close sidebar to expand data table"
                  >
                    ✕
                  </button>
                </div>

                <div className="dash-nav-list">
                  {featureOptions.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`dash-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveFeature(item.id)}
                      >
                        <Icon size={14} />
                        <span className="dash-nav-label">{item.label}</span>
                        {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="dash-sidebar-tip">
                  <Sparkles size={12} color="#c9a96e" />
                  <span>Click any module above to simulate live processing.</span>
                </div>
              </div>
            )}

            {/* Main Data Area (Expands to 100% space when sidebar is collapsed) */}
            <div className="dash-main">
              {/* Top Filter and KPI Bar (Compact & Space-Efficient) */}
              <div className="dash-kpi-row compact-kpis">
                <div className="dash-kpi">
                  <div className="dkpi-label">Class General Average</div>
                  <div className="dkpi-value">14.62<span className="dkpi-unit"> / 20</span></div>
                  <div className="dkpi-trend">↑ +0.85 pts vs Seq 2</div>
                </div>

                <div className="dash-kpi">
                  <div className="dkpi-label">Success Rate (Pass ≥ 10)</div>
                  <div className="dkpi-value">91.4%</div>
                  <div className="dkpi-trend">64 of 70 Passed</div>
                </div>

                <div className="dash-kpi">
                  <div className="dkpi-label">Official Report Cards</div>
                  <div className="dkpi-value">Generated</div>
                  <div className="dkpi-trend" style={{ color: '#c9a96e' }}>★ Ready for Print</div>
                </div>

                <div className="dash-kpi">
                  <div className="dkpi-label">Active Sequence</div>
                  <div className="dkpi-value" style={{ color: '#60a5fa' }}>Seq 3</div>
                  <div className="dkpi-trend">MINESEC Standard</div>
                </div>
              </div>

              {/* Data View 1: Mark Entry & Ranks */}
              {activeFeature === 'marks' && (
                <div className="dash-table-wrapper">
                  <div className="dash-table-mobile-hint">
                    <span>← Swipe table horizontally for all subject marks & ranks →</span>
                  </div>
                  <div className="dash-report-table compact-table">
                    <div className="drt-header">
                      <span>Candidate Name (Form 5A)</span>
                      <span>Math (Coef 4)</span>
                      <span>Phys (Coef 3)</span>
                      <span>Fren (Coef 3)</span>
                      <span>Weighted Avg</span>
                      <span>Rank & Decision</span>
                    </div>

                    <div className="drt-row">
                      <span className="drt-student-name">1. Ebot Tanyi Michael</span>
                      <span className="drt-score-high">18.50 / 20</span>
                      <span className="drt-score-high">17.00 / 20</span>
                      <span className="drt-score-high">16.50 / 20</span>
                      <span className="drt-avg-highlight">17.45 / 20</span>
                      <span className="drt-rank rank-distinction">1st (Distinction)</span>
                    </div>

                    <div className="drt-row">
                      <span className="drt-student-name">2. Ngo Bisseck Christine</span>
                      <span className="drt-score-high">16.00 / 20</span>
                      <span className="drt-score-high">16.50 / 20</span>
                      <span className="drt-score-high">18.00 / 20</span>
                      <span className="drt-avg-highlight">16.75 / 20</span>
                      <span className="drt-rank rank-honors">2nd (Honors)</span>
                    </div>

                    <div className="drt-row">
                      <span className="drt-student-name">3. Kamgaing Fotso Jean</span>
                      <span className="drt-score-mid">14.00 / 20</span>
                      <span className="drt-score-high">15.50 / 20</span>
                      <span className="drt-score-mid">13.00 / 20</span>
                      <span className="drt-avg-highlight">14.15 / 20</span>
                      <span className="drt-rank rank-pass">3rd (Encouragement)</span>
                    </div>

                    <div className="drt-row">
                      <span className="drt-student-name">4. Abena Marie Madeleine</span>
                      <span className="drt-score-mid">12.50 / 20</span>
                      <span className="drt-score-mid">13.00 / 20</span>
                      <span className="drt-score-high">15.00 / 20</span>
                      <span className="drt-avg-highlight">13.40 / 20</span>
                      <span className="drt-rank rank-pass">4th (Satisfactory)</span>
                    </div>

                    <div className="drt-row">
                      <span className="drt-student-name">5. Tamba Collins Junior</span>
                      <span className="drt-score-low">08.50 / 20</span>
                      <span className="drt-score-mid">11.00 / 20</span>
                      <span className="drt-score-mid">12.00 / 20</span>
                      <span className="drt-avg-highlight">10.30 / 20</span>
                      <span className="drt-rank rank-warning">18th (Warning)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data View 2: Student Roster */}
              {activeFeature === 'roster' && (
                <div className="dash-table-wrapper">
                  <div className="dash-report-table compact-table">
                    <div className="drt-header" style={{ gridTemplateColumns: '120px 200px 140px 140px 160px' }}>
                      <span>Matricule</span>
                      <span>Student Full Name</span>
                      <span>Subsystem</span>
                      <span>Guardian Contact</span>
                      <span>Academic Status</span>
                    </div>
                    {[
                      { id: '2026-F5-001', name: 'Ebot Tanyi Michael', stream: 'Anglophone GCE', tel: '+237 677 23 44 11', status: 'Regular • Enrolled' },
                      { id: '2026-F5-002', name: 'Ngo Bisseck Christine', stream: 'Bilingual Stream', tel: '+237 699 45 67 89', status: 'Regular • Enrolled' },
                      { id: '2026-F5-003', name: 'Kamgaing Fotso Jean', stream: 'Francophone BEPC', tel: '+237 671 90 12 34', status: 'Regular • Enrolled' },
                      { id: '2026-F5-004', name: 'Abena Marie Madeleine', stream: 'Bilingual Stream', tel: '+237 690 11 22 33', status: 'Regular • Enrolled' },
                    ].map((row) => (
                      <div key={row.id} className="drt-row" style={{ gridTemplateColumns: '120px 200px 140px 140px 160px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c9a96e' }}>{row.id}</span>
                        <span className="drt-student-name">{row.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{row.stream}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{row.tel}</span>
                        <span className="drt-rank rank-distinction">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data View 3: Report Card Batch */}
              {activeFeature === 'reportcard' && (
                <div className="dash-table-wrapper">
                  <div className="dash-report-table compact-table">
                    <div className="drt-header" style={{ gridTemplateColumns: '160px 120px 140px 140px 160px' }}>
                      <span>Batch Class</span>
                      <span>Total Students</span>
                      <span>Calculated Average</span>
                      <span>QR Seal</span>
                      <span>Action / Distribution</span>
                    </div>
                    {[
                      { cls: 'Form 5 Science A', count: '70 Students', avg: '14.62 / 20', qr: 'Verified ✓', action: 'Download 70-Page PDF' },
                      { cls: 'Form 5 Arts B', count: '65 Students', avg: '13.80 / 20', qr: 'Verified ✓', action: 'Download 65-Page PDF' },
                      { cls: 'Lower Sixth Science', count: '54 Students', avg: '15.10 / 20', qr: 'Verified ✓', action: 'Download 54-Page PDF' },
                    ].map((row, idx) => (
                      <div key={idx} className="drt-row" style={{ gridTemplateColumns: '160px 120px 140px 140px 160px' }}>
                        <span className="drt-student-name">{row.cls}</span>
                        <span style={{ color: '#fff', fontSize: '12px' }}>{row.count}</span>
                        <span className="drt-avg-highlight">{row.avg}</span>
                        <span style={{ color: '#2d7d4a', fontWeight: 600, fontSize: '12px' }}>{row.qr}</span>
                        <span className="drt-rank rank-distinction" style={{ cursor: 'pointer' }}>{row.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data View 4: Coefficient Matrix */}
              {activeFeature === 'matrix' && (
                <div className="dash-table-wrapper">
                  <div className="dash-report-table compact-table">
                    <div className="drt-header" style={{ gridTemplateColumns: '160px 100px 140px 140px 160px' }}>
                      <span>Subject Title</span>
                      <span>Coefficient</span>
                      <span>Curriculum Code</span>
                      <span>Department</span>
                      <span>Computation Rule</span>
                    </div>
                    {[
                      { sub: 'Mathematics', coef: '4', code: 'MATH-501', dept: 'Sciences', rule: 'Raw Mark × 4' },
                      { sub: 'Physics', coef: '3', code: 'PHYS-502', dept: 'Sciences', rule: 'Raw Mark × 3' },
                      { sub: 'French Language', coef: '3', code: 'FREN-503', dept: 'Bilingual Languages', rule: 'Raw Mark × 3' },
                      { sub: 'English Literature', coef: '3', code: 'ENGL-504', dept: 'Languages & Arts', rule: 'Raw Mark × 3' },
                      { sub: 'Chemistry', coef: '3', code: 'CHEM-505', dept: 'Sciences', rule: 'Raw Mark × 3' },
                    ].map((row, idx) => (
                      <div key={idx} className="drt-row" style={{ gridTemplateColumns: '160px 100px 140px 140px 160px' }}>
                        <span className="drt-student-name">{row.sub}</span>
                        <span className="drt-avg-highlight">Coef {row.coef}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c9a96e' }}>{row.code}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{row.dept}</span>
                        <span className="drt-rank rank-pass">{row.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data View 5: Sync / Honor Roll Fallback */}
              {(activeFeature === 'sync' || activeFeature === 'honor') && (
                <div className="dash-table-wrapper">
                  <div className="dash-report-table compact-table">
                    <div className="drt-header" style={{ gridTemplateColumns: '180px 140px 140px 180px' }}>
                      <span>Award / Sync Protocol</span>
                      <span>Target Subsystem</span>
                      <span>Calculated Index</span>
                      <span>Status Confirmation</span>
                    </div>
                    <div className="drt-row" style={{ gridTemplateColumns: '180px 140px 140px 180px' }}>
                      <span className="drt-student-name">Honor Roll (Grade ≥ 16/20)</span>
                      <span style={{ color: '#fff', fontSize: '12px' }}>Form 5 All Streams</span>
                      <span className="drt-avg-highlight">18 Candidates</span>
                      <span className="drt-rank rank-distinction">Award Badges Ready ✓</span>
                    </div>
                    <div className="drt-row" style={{ gridTemplateColumns: '180px 140px 140px 180px' }}>
                      <span className="drt-student-name">GCE Board Sync Format</span>
                      <span style={{ color: '#fff', fontSize: '12px' }}>Anglophone Board</span>
                      <span className="drt-avg-highlight">0 Errors Logged</span>
                      <span className="drt-rank rank-honors">Synced to Server ✓</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom live status strip (Compact) */}
              <div className="dash-status-strip compact-status">
                <div className="dash-status-item">
                  <span className="dash-status-dot">● </span>
                  <strong>Automated Sync: </strong>
                  <span>MINESEC Standards Applied • 0 Missing Marks</span>
                </div>
                <div className="dash-status-meta">
                  <span>PDF Batch: Ready (70 pages)</span>
                  <span className="dash-status-alert">SMS Parent Gateway: Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
