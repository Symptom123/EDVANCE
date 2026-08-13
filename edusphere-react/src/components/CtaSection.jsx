import React, { useState } from 'react';
import { ArrowRight, Shield, Lock, Globe, Server } from 'lucide-react';

const CtaSection = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    }, 1500);
  };

  return (
    <section className="cta-section" id="get-started" style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0A192F 0%, #0f2d5e 50%, #0A192F 100%)',
    }}>
      {/* Emerald glow accent */}
      <div style={{
        position: 'absolute', bottom: '-80px', right: '-80px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />
      {/* Blue glow accent */}
      <div style={{
        position: 'absolute', top: '-60px', left: '-60px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="cta-card reveal">
          <div className="cta-content">
            <h2 className="cta-headline">Ready to modernize<br/>your school?</h2>
            <p className="cta-sub">Join 2,400+ schools already running on Edvance. Get a personalized demo from our team, or start a free trial today — no setup required.</p>
          </div>
          <div className="cta-actions">
            <form className="cta-form" onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                placeholder="Enter your school email"
                className="cta-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={status === 'error' ? { borderColor: '#EF4444' } : {}}
                required
              />
              <button
                type="submit"
                className="btn-primary btn-cta-submit"
                disabled={status === 'loading'}
                style={status === 'loading' ? { opacity: 0.75 } : {}}
              >
                {status === 'loading' ? 'Setting up your account...' :
                 status === 'success' ? '✓ Check your inbox!' :
                 <><span>Start free trial</span> <ArrowRight size={16} /></>}
              </button>
            </form>
            <p className="cta-note">Or <a href="#contact">book a 30-minute demo</a> with our team.</p>
            <p className="cta-note" style={{ marginTop: '8px' }}>Already have a school? <a href="/login" style={{ color: '#10B981', fontWeight: 600 }}>Sign in →</a></p>
          </div>
          <div className="cta-trust">
            <div className="trust-item"><Shield size={14} /> SOC 2 Type II</div>
            <div className="trust-item"><Lock size={14} /> FERPA Compliant</div>
            <div className="trust-item"><Globe size={14} /> GDPR Ready</div>
            <div className="trust-item"><Server size={14} /> 99.9% Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;

