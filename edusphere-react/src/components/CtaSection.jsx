import React from 'react';
import { ArrowRight, Calendar, ShieldCheck, Lock, Globe, Server } from 'lucide-react';

const CtaSection = () => {
  return (
    <section className="cta-section" id="get-started">
      <div className="container">
        <div className="cta-inner reveal">
          <span className="eyebrow eyebrow--gold">Institutional Transformation</span>
          <h2 className="cta-headline">
            Ready to lead your school<br />
            <em>without spreadsheet chaos?</em>
          </h2>
          <p className="cta-sub">
            Join 2,400+ African institutions already operating on Edvance.
            Begin your complimentary 30-day evaluation today or schedule a consultation with our education leadership team.
          </p>

          <div className="cta-buttons">
            <a href="/register" className="btn btn-primary btn--lg">
              Start 30-day free trial
              <ArrowRight size={17} />
            </a>
            <a href="#contact" className="btn btn-secondary btn--lg">
              <Calendar size={17} />
              Schedule a leadership demo
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
