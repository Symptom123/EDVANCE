import React, { useState, useRef } from 'react';
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Bell, 
  Search, 
  ChevronRight, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  Activity
} from 'lucide-react';

const HeroDashboardPreview = () => {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeKpi, setActiveKpi] = useState(0);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Smooth gentle tilt limit
    const rotateY = (x / (rect.width / 2)) * 6;
    const rotateX = -(y / (rect.height / 2)) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div 
      className="hero-dashboard-wrapper reveal"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Ambient background glow beneath preview */}
      <div className="hero-preview-glow" aria-hidden="true" />

      {/* Floating 3D Badge 1: Top Left */}
      <div className="floating-badge badge-top-left float-slow">
        <div className="badge-icon-wrap icon-emerald">
          <Sparkles size={16} />
        </div>
        <div className="badge-text">
          <span className="badge-title">AI Gradebook & Reports</span>
          <span className="badge-sub">Auto-computed in seconds</span>
        </div>
      </div>

      {/* Floating 3D Badge 2: Top Right */}
      <div className="floating-badge badge-top-right float-reverse">
        <div className="badge-icon-wrap icon-blue">
          <ShieldCheck size={16} />
        </div>
        <div className="badge-text">
          <span className="badge-title">Enterprise Security</span>
          <span className="badge-sub">FERPA & SOC-2 Compliant</span>
        </div>
      </div>

      {/* Floating 3D Badge 3: Bottom Left */}
      <div className="floating-badge badge-bottom-left float-reverse">
        <div className="badge-icon-wrap icon-purple">
          <Users size={16} />
        </div>
        <div className="badge-text">
          <span className="badge-title">Multi-Role Portals</span>
          <span className="badge-sub">Admin • Teacher • Parent • Student</span>
        </div>
      </div>

      {/* Floating 3D Badge 4: Bottom Right */}
      <div className="floating-badge badge-bottom-right float-slow">
        <div className="badge-icon-wrap icon-teal">
          <Activity size={16} />
        </div>
        <div className="badge-text">
          <span className="badge-title">Live Attendance: 98.4%</span>
          <span className="badge-sub">Instant Parent SMS / WhatsApp</span>
        </div>
      </div>

      {/* Main Glassmorphic Dashboard Window */}
      <div className="hero-preview-box spotlight-card">
        {/* Browser / App Header */}
        <div className="preview-header">
          <div className="preview-dots">
            <span className="p-dot dot-red" />
            <span className="p-dot dot-yellow" />
            <span className="p-dot dot-green" />
          </div>

          <div className="preview-school-selector">
            <div className="school-pill">
              <span className="school-indicator" />
              <span className="school-name">Oakridge International Academy</span>
              <span className="school-badge">Term 2 Active</span>
            </div>
          </div>

          <div className="preview-nav-actions">
            <div className="preview-search">
              <Search size={13} />
              <span>Search student, grade, or report...</span>
              <kbd>⌘K</kbd>
            </div>
            <div className="preview-bell">
              <Bell size={15} />
              <span className="bell-badge" />
            </div>
            <div className="preview-avatar">
              <span>AD</span>
            </div>
          </div>
        </div>

        {/* Dashboard Main Content Body */}
        <div className="preview-body">
          {/* KPI Cards Row */}
          <div className="preview-kpi-grid">
            <div 
              className={`preview-kpi-card ${activeKpi === 0 ? 'active' : ''}`}
              onClick={() => setActiveKpi(0)}
            >
              <div className="kpi-top">
                <span className="kpi-label">Active Enrollment</span>
                <span className="kpi-trend trend-up">
                  <TrendingUp size={12} /> +4.8%
                </span>
              </div>
              <div className="kpi-value">2,847</div>
              <div className="kpi-footer">
                <span className="kpi-sub">Across 94 Classrooms</span>
              </div>
            </div>

            <div 
              className={`preview-kpi-card ${activeKpi === 1 ? 'active' : ''}`}
              onClick={() => setActiveKpi(1)}
            >
              <div className="kpi-top">
                <span className="kpi-label">Avg. Attendance</span>
                <span className="kpi-trend trend-up">
                  <TrendingUp size={12} /> +1.2%
                </span>
              </div>
              <div className="kpi-value">98.4%</div>
              <div className="kpi-footer">
                <span className="kpi-sub">2,801 Present Today</span>
              </div>
            </div>

            <div 
              className={`preview-kpi-card ${activeKpi === 2 ? 'active' : ''}`}
              onClick={() => setActiveKpi(2)}
            >
              <div className="kpi-top">
                <span className="kpi-label">Fee Collection</span>
                <span className="kpi-trend trend-up">
                  <TrendingUp size={12} /> 96.2%
                </span>
              </div>
              <div className="kpi-value">$184.5K</div>
              <div className="kpi-footer">
                <span className="kpi-sub">Term 2 Target Reached</span>
              </div>
            </div>

            <div 
              className={`preview-kpi-card ${activeKpi === 3 ? 'active' : ''}`}
              onClick={() => setActiveKpi(3)}
            >
              <div className="kpi-top">
                <span className="kpi-label">Report Cards</span>
                <span className="kpi-trend trend-neutral">
                  <CheckCircle2 size={12} /> Ready
                </span>
              </div>
              <div className="kpi-value">100%</div>
              <div className="kpi-footer">
                <span className="kpi-sub">Published to Parents</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart + Live Activity Grid */}
          <div className="preview-grid-split">
            {/* Left: Academic & Attendance Performance Curve */}
            <div className="preview-chart-panel">
              <div className="panel-title-bar">
                <div>
                  <h4 className="panel-heading">Institutional Academic Performance</h4>
                  <p className="panel-sub">Term-over-Term GPA & Assessment Progression</p>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="dot dot-green" /> Term 2 (Current)</span>
                  <span className="legend-item"><span className="dot dot-gray" /> Term 1</span>
                </div>
              </div>

              <div className="chart-svg-container">
                <svg viewBox="0 0 540 160" className="performance-chart-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="30" x2="540" y2="30" stroke="#f3f4f6" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="540" y2="70" stroke="#f3f4f6" strokeDasharray="3 3" />
                  <line x1="0" y1="110" x2="540" y2="110" stroke="#f3f4f6" strokeDasharray="3 3" />
                  <line x1="0" y1="150" x2="540" y2="150" stroke="#e5e7eb" />

                  {/* Area fill */}
                  <path
                    d="M 0,130 C 70,115 130,95 200,75 C 270,55 340,85 410,45 C 480,25 510,35 540,20 L 540,150 L 0,150 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Term 1 Line */}
                  <path
                    d="M 0,140 C 70,130 130,120 200,105 C 270,95 340,110 410,85 C 480,75 510,80 540,70"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Term 2 Main Curve */}
                  <path
                    d="M 0,130 C 70,115 130,95 200,75 C 270,55 340,85 410,45 C 480,25 510,35 540,20"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Highlight dots */}
                  <circle cx="200" cy="75" r="4.5" fill="#059669" stroke="#fff" strokeWidth="2.5" />
                  <circle cx="410" cy="45" r="4.5" fill="#059669" stroke="#fff" strokeWidth="2.5" />
                  <circle cx="540" cy="20" r="5" fill="#047857" stroke="#fff" strokeWidth="2.5" />
                </svg>

                {/* X-Axis labels */}
                <div className="chart-x-labels">
                  <span>Week 1</span>
                  <span>Week 4</span>
                  <span>Week 8 (Midterms)</span>
                  <span>Week 12</span>
                  <span>Week 16 (Finals)</span>
                </div>
              </div>
            </div>

            {/* Right: Live Real-time Activity Stream */}
            <div className="preview-activity-panel">
              <div className="panel-title-bar">
                <h4 className="panel-heading">Live School Feed</h4>
                <span className="live-pulse-badge">
                  <span className="live-dot" /> Live
                </span>
              </div>

              <div className="activity-items">
                <div className="activity-item">
                  <div className="act-icon-box act-green">
                    <CheckCircle2 size={13} />
                  </div>
                  <div className="act-info">
                    <p className="act-text"><strong>Grade 10 Biology</strong> report cards generated</p>
                    <span className="act-time">2 mins ago • Dr. Vance</span>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="act-icon-box act-blue">
                    <CreditCard size={13} />
                  </div>
                  <div className="act-info">
                    <p className="act-text">Tuition fee paid (<strong>$1,250</strong>)</p>
                    <span className="act-time">8 mins ago • Parent Portal</span>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="act-icon-box act-purple">
                    <Calendar size={13} />
                  </div>
                  <div className="act-info">
                    <p className="act-text">Grade 8-A attendance finalized (99.1%)</p>
                    <span className="act-time">18 mins ago • Mrs. Jenkins</span>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="act-icon-box act-teal">
                    <BookOpen size={13} />
                  </div>
                  <div className="act-info">
                    <p className="act-text">New lesson plan submitted: Physics AP</p>
                    <span className="act-time">34 mins ago • Science Dept</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDashboardPreview;
