import React from 'react';

const TrustBar = () => {
  return (
    <section className="trust-section">
      <div className="container">
        <p className="trust-label reveal">Trusted by leading educational institutions</p>
        <div className="trust-logos reveal reveal-delay-1">
          <span className="trust-logo">Nexus Academy</span>
          <span className="trust-sep">·</span>
          <span className="trust-logo">Pinnacle Schools</span>
          <span className="trust-sep">·</span>
          <span className="trust-logo">Horizon Institute</span>
          <span className="trust-sep">·</span>
          <span className="trust-logo">BrightFuture District</span>
          <span className="trust-sep">·</span>
          <span className="trust-logo">Apex Learning Group</span>
          <span className="trust-sep">·</span>
          <span className="trust-logo">EduGlobal University</span>
          <span className="trust-sep">·</span>
          <span className="trust-logo">Meridian Prep</span>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
