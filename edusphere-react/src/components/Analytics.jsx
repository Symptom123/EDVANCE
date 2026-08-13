import React from 'react';
import { TrendingUp, AlertTriangle, FileText } from 'lucide-react';

// The analytics chart image — perfect for this section
const ANALYTICS_IMG = '/images/analytics.jpg';
// Growth chart for visual reinforcement
const GROWTH_IMG = '/images/1087126797584222625.jpg';

const Analytics = () => {
  return (
    <section className="analytics-section" id="analytics">
      <div className="container">
        <div className="analytics-layout" style={{ gridTemplateColumns: "1fr" }}>
          <div className="analytics-text reveal" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <p className="section-eyebrow">Analytics & Reporting</p>
            <h2 className="section-title" style={{ fontSize: '28px' }}>
              Turn school data into<br />actionable intelligence
            </h2>
            <p className="section-body">
              EDUVANCE's analytics engine surfaces the insights that matter — identifying
              at-risk students, tracking institutional performance, and generating compliance
              reports automatically.
            </p>
            <div className="analytics-points">
              <div className="analytics-point reveal ">
                <div className="ap-icon"><TrendingUp size={16} /></div>
                <div>
                  <h4>Performance Trends</h4>
                  <p>Track academic performance across subjects, classes, and time periods with clean, readable charts.</p>
                </div>
              </div>
              <div className="analytics-point reveal ">
                <div className="ap-icon"><AlertTriangle size={16} /></div>
                <div>
                  <h4>Early Warning System</h4>
                  <p>AI flags at-risk students based on attendance, grade trends, and behavioral signals — weeks before they fall behind.</p>
                </div>
              </div>
              <div className="analytics-point reveal ">
                <div className="ap-icon"><FileText size={16} /></div>
                <div>
                  <h4>Automated Reporting</h4>
                  <p>Generate board presentations, parent reports, and compliance filings in one click.</p>
                </div>
              </div>
            </div>
            <a href="/register" className="btn-primary"><span>See analytics in action</span></a>
          </div>

          {/* Image stack: analytics screenshot + growth chart inset */}
          </div></div></section>
  );
};

export default Analytics;


