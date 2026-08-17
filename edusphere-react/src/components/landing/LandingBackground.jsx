import React from 'react';

const LandingBackground = () => {
  return (
    <div className="landing-ambient-bg" aria-hidden="true">
      {/* Background base mesh grid */}
      <div className="ambient-grid-overlay" />
      
      {/* Dynamic floating ambient glowing orbs */}
      <div className="ambient-orb orb-emerald-1" />
      <div className="ambient-orb orb-indigo-1" />
      <div className="ambient-orb orb-teal-1" />
      <div className="ambient-orb orb-emerald-2" />
      <div className="ambient-orb orb-amber-1" />

      {/* Floating subtle particle sparkles */}
      <div className="ambient-particles">
        <span className="particle p-1" style={{ top: '12%', left: '15%', animationDelay: '0s' }} />
        <span className="particle p-2" style={{ top: '24%', left: '82%', animationDelay: '1.2s' }} />
        <span className="particle p-3" style={{ top: '48%', left: '8%', animationDelay: '2.4s' }} />
        <span className="particle p-1" style={{ top: '65%', left: '90%', animationDelay: '3.6s' }} />
        <span className="particle p-2" style={{ top: '80%', left: '20%', animationDelay: '1.8s' }} />
        <span className="particle p-3" style={{ top: '92%', left: '75%', animationDelay: '4.2s' }} />
      </div>
    </div>
  );
};

export default LandingBackground;
