import React, { useState } from 'react';
import { Search, Plus, CheckCircle, Bell } from 'lucide-react';

const Showcase = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="showcase-section" id="showcase" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Premium emerald accent glow — top right */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-header reveal">
          <p className="section-eyebrow">The Interface</p>
          <h2 className="section-title">Built for every role<br />in your school</h2>
          <p className="section-body">
            Each stakeholder gets a purpose-built experience that gives them exactly what
            they need — nothing more, nothing less.
          </p>
        </div>

        <div className="showcase-tabs reveal ">
          <div className="tab-buttons" role="tablist">
            {['overview', 'students', 'teachers', 'parents', 'admin'].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="tab-panels">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="tab-panel active" id="panel-overview">
                <div className="panel-layout" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="panel-info" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                    <h3>Complete school visibility</h3>
                    <p>The administration overview gives school leaders a real-time pulse on every dimension of their institution — enrollment trends, financial health, academic performance, and staff productivity.</p>
                    <div className="panel-stats">
                      <div className="panel-stat"><span className="pstat-value">94.3%</span><span className="pstat-label">Avg. Attendance</span></div>
                      <div className="panel-stat"><span className="pstat-value">2,847</span><span className="pstat-label">Active Students</span></div>
                      <div className="panel-stat"><span className="pstat-value">$48.2K</span><span className="pstat-label">Monthly Revenue</span></div>
                    </div>
                    <a href="/register" className="btn-primary"><span>See full demo</span></a>
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS */}
            {activeTab === 'students' && (
              <div className="tab-panel active" id="panel-students">
                <div className="panel-layout" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="panel-info" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                    <h3>Student records & progress</h3>
                    <p>Every student gets a comprehensive profile — academic history, attendance records, behavior notes, and parent contacts — accessible in seconds, not minutes.</p>
                    <div className="panel-features-list">
                      <div className="pf-item"><CheckCircle size={16} /> Academic transcript management</div>
                      <div className="pf-item"><CheckCircle size={16} /> Behavioral incident logging</div>
                      <div className="pf-item"><CheckCircle size={16} /> Progress report automation</div>
                      <div className="pf-item"><CheckCircle size={16} /> Alumni database management</div>
                    </div>
                    <a href="/register" className="btn-primary"><span>Explore student features</span></a>
                  </div>
                </div>
              </div>
            )}

            {/* TEACHERS */}
            {activeTab === 'teachers' && (
              <div className="tab-panel active" id="panel-teachers">
                <div className="panel-layout" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="panel-info" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                    <h3>Teacher tools that save hours daily</h3>
                    <p>Edvance eliminates administrative burden for teachers — automated attendance, digital grading, and structured lesson planning so educators can invest their time where it matters.</p>
                    <div className="panel-features-list">
                      <div className="pf-item"><CheckCircle size={16} /> One-click attendance marking</div>
                      <div className="pf-item"><CheckCircle size={16} /> Rubric-based digital grading</div>
                      <div className="pf-item"><CheckCircle size={16} /> Lesson plan templates</div>
                      <div className="pf-item"><CheckCircle size={16} /> Professional development tracker</div>
                    </div>
                    <a href="/register" className="btn-primary"><span>Explore teacher features</span></a>
                  </div>
                </div>
              </div>
            )}

            {/* PARENTS */}
            {activeTab === 'parents' && (
              <div className="tab-panel active" id="panel-parents">
                <div className="panel-layout" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="panel-info" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                    <h3>Parents stay genuinely informed</h3>
                    <p>The parent portal is designed to be simple and non-intrusive — giving parents exactly the information they care about without overwhelming them.</p>
                    <div className="panel-features-list">
                      <div className="pf-item"><CheckCircle size={16} /> Real-time grade notifications</div>
                      <div className="pf-item"><CheckCircle size={16} /> Attendance alerts</div>
                      <div className="pf-item"><CheckCircle size={16} /> Secure teacher messaging</div>
                      <div className="pf-item"><CheckCircle size={16} /> Online fee payment</div>
                    </div>
                    <a href="/register" className="btn-primary"><span>Explore parent features</span></a>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN */}
            {activeTab === 'admin' && (
              <div className="tab-panel active" id="panel-admin">
                <div className="panel-layout" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="panel-info" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                    <h3>Administration that scales</h3>
                    <p>From a single campus to a multi-school network, Edvance's administration hub gives you the control and visibility you need to run your institution with confidence.</p>
                    <div className="panel-features-list">
                      <div className="pf-item"><CheckCircle size={16} /> Multi-campus management</div>
                      <div className="pf-item"><CheckCircle size={16} /> Staff hiring & HR records</div>
                      <div className="pf-item"><CheckCircle size={16} /> Compliance & audit reporting</div>
                      <div className="pf-item"><CheckCircle size={16} /> Board-ready analytics</div>
                    </div>
                    <a href="/register" className="btn-primary"><span>Explore admin features</span></a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;

