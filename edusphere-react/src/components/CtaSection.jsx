import React from 'react';
import { ArrowRight, Calendar, ShieldCheck, Lock, Globe, Server } from 'lucide-react';

const CtaSection = () => {
  return (
    <section className="cta-section" id="get-started">
      <div className="container">
        <div className="cta-inner reveal">
          <div className="section-eyebrow-pill eyebrow-on-dark">
            <span className="eyebrow-dot" />
            <span className="eyebrow-label">Institutional Transformation</span>
          </div>
          <h2 className="cta-headline">
            Ready to lead your school<br />
            <span className="text-blue-light">without spreadsheet chaos?</span>
          </h2>
          <p className="cta-sub">
            Join 2,400+ African institutions already operating on Edvance.
            Begin your complimentary 30-day evaluation today or schedule a consultation with our education leadership team.
          </p>

          <div className="cta-buttons">
            <a href="/register" className="btn btn-primary btn--lg">
              <span>Start 30-day free trial</span>
              <ArrowRight size={17} className="btn-arrow-trailing" />
            </a>
            <a href="#contact" className="btn btn-secondary-dark btn--lg">
              <Calendar size={17} />
              <span>Schedule a leadership demo</span>
              <ArrowRight size={15} className="btn-arrow-trailing opacity-70" />
            </a>
          </div>

          <div className="cta-trust-strip">
            <div className="cta-trust-item">
              <ShieldCheck className="cta-trust-icon" />
              <span>MINESEC & West Africa Compliant</span>
            </div>
            <div className="cta-trust-item">
              <Lock className="cta-trust-icon" />
              <span>End-to-End Grade Encryption</span>
            </div>
            <div className="cta-trust-item">
              <Globe className="cta-trust-icon" />
              <span>Bilingual English / Français</span>
            </div>
            <div className="cta-trust-item">
              <Server className="cta-trust-icon" />
              <span>99.9% Uptime Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
