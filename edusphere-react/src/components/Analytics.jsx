import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  BarChart3, 
  PieChart, 
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

const Analytics = () => {
  const [activeMetric, setActiveMetric] = useState('performance');

  return (
    <section className="analytics-section" id="analytics">
      <div className="container">
        <div className="analytics-layout-grid">
          {/* Left Column: Context & Features */}
          <div className="analytics-text-content reveal">
            <div className="analytics-badge">
              <Sparkles size={14} />
              <span>AI Institutional Intelligence</span>
            </div>
            
            <h2 className="section-title">
              Turn school data into<br />
              <span className="gradient-text">predictive intelligence</span>
            </h2>

            <p className="section-body">
              Edvance's analytics engine processes attendance signals, grade distributions, and historical trends to give leadership clear, actionable foresight.
            </p>

            <div className="analytics-points-list">
              <div 
                className={`analytics-point-card spotlight-card ${activeMetric === 'performance' ? 'active' : ''}`}
                onClick={() => setActiveMetric('performance')}
              >
                <div className="ap-icon-box ap-icon-green">
                  <TrendingUp size={18} />
                </div>
                <div className="ap-text">
                  <h4>Cohort & Department Trends</h4>
                  <p>Compare performance across grades, subject departments, and academic terms with clean visualization curves.</p>
                </div>
              </div>

              <div 
                className={`analytics-point-card spotlight-card ${activeMetric === 'warning' ? 'active' : ''}`}
                onClick={() => setActiveMetric('warning')}
              >
                <div className="ap-icon-box ap-icon-amber">
                  <AlertTriangle size={18} />
                </div>
                <div className="ap-text">
                  <h4>AI Early Warning Detection</h4>
                  <p>Detect early signs of student disengagement or academic difficulty weeks before exam periods.</p>
                </div>
              </div>

              <div 
                className={`analytics-point-card spotlight-card ${activeMetric === 'reporting' ? 'active' : ''}`}
                onClick={() => setActiveMetric('reporting')}
              >
                <div className="ap-icon-box ap-icon-blue">
                  <FileText size={18} />
                </div>
                <div className="ap-text">
                  <h4>1-Click Board & Accreditation Packs</h4>
                  <p>Generate certified audit reports, regulatory submissions, and leadership presentations automatically.</p>
                </div>
              </div>
            </div>

            <div className="analytics-actions">
              <a href="/register" className="btn-primary">
                <span>See Analytics in Action</span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* Right Column: Live Interactive Analytics Mockup */}
          <div className="analytics-visual-wrapper reveal reveal-delay-2">
            <div className="analytics-card-preview spotlight-card">
              {/* Analytics Header */}
              <div className="ac-header">
                <div>
                  <h4 className="ac-title">Institutional Health Dashboard</h4>
                  <span className="ac-sub">Term 2 Academic Year 2026 • Real-time</span>
                </div>
                <div className="ac-tag-pill">
                  <span className="live-dot" /> Live Telemetry
                </div>
              </div>

              {/* Stat Highlights */}
              <div className="ac-stats-row">
                <div className="ac-stat-box">
                  <span className="as-label">Average School GPA</span>
                  <span className="as-val">3.64 <span className="as-trend">+0.18</span></span>
                </div>
                <div className="ac-stat-box">
                  <span className="as-label">At-Risk Interventions</span>
                  <span className="as-val">94% <span className="as-trend">Resolved</span></span>
                </div>
                <div className="ac-stat-box">
                  <span className="as-label">Pass Rate</span>
                  <span className="as-val">99.1% <span className="as-trend">Target 98%</span></span>
                </div>
              </div>

              {/* Grade Distribution Bar Visual */}
              <div className="ac-chart-block">
                <div className="ac-chart-header">
                  <span className="ach-title">Grade Distribution Breakdown</span>
                  <span className="ach-legend">A (42%) • B (38%) • C (15%) • D/F (5%)</span>
                </div>
                <div className="ac-dist-bar">
                  <div className="dist-seg seg-a" style={{ width: '42%' }} title="Grade A: 42%" />
                  <div className="dist-seg seg-b" style={{ width: '38%' }} title="Grade B: 38%" />
                  <div className="dist-seg seg-c" style={{ width: '15%' }} title="Grade C: 15%" />
                  <div className="dist-seg seg-d" style={{ width: '5%' }} title="Grade D/F: 5%" />
                </div>
              </div>

              {/* AI Early Warning Alert Card */}
              <div className="ac-alert-box">
                <div className="alert-icon-wrap">
                  <ShieldAlert size={18} />
                </div>
                <div className="alert-content">
                  <div className="alert-title">AI Predictive Insight: Early Intervention Triggered</div>
                  <p className="alert-desc">
                    Grade 9 Math: 4 students show attendance dips. Automated tutoring session scheduled for Wednesday.
                  </p>
                </div>
                <span className="alert-status">Auto-Actioned</span>
              </div>

              {/* Mini Dept Performance Table */}
              <div className="ac-dept-table">
                <div className="dept-row dept-head">
                  <span>Department</span>
                  <span>Avg. Score</span>
                  <span>Attendance</span>
                  <span>Status</span>
                </div>
                <div className="dept-row">
                  <span className="dept-name">Science & STEM</span>
                  <span className="dept-score">93.8%</span>
                  <span className="dept-att">98.9%</span>
                  <span className="dept-badge badge-green">Excellent</span>
                </div>
                <div className="dept-row">
                  <span className="dept-name">Humanities & Lit</span>
                  <span className="dept-score">89.4%</span>
                  <span className="dept-att">97.8%</span>
                  <span className="dept-badge badge-green">On Track</span>
                </div>
                <div className="dept-row">
                  <span className="dept-name">Mathematics</span>
                  <span className="dept-score">88.2%</span>
                  <span className="dept-att">96.5%</span>
                  <span className="dept-badge badge-blue">Improving</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
