import React from 'react';
import { ArrowRight, Calendar, Check, Star, ShieldCheck, Sparkles, Award, Users, Activity, FileCheck, Layers } from 'lucide-react';

/* ── Luxury 3D Visual with Floating Badges & Volumetric Reflections ── */
const HeroLuxuryVisual = () => (
  <div className="hero-luxury-visual-container">
    {/* Ambient Volumetric Glow & Decorative Halo */}
    <div className="hero-luxury-halo" aria-hidden="true" />
    <div className="hero-dot-grid" aria-hidden="true" />

    {/* Center 3D Floating Workstation Image with Luxury Glass Frame */}
    <div className="hero-luxury-frame">
      <div className="hero-luxury-frame-inner">
        <img
          src="/images/luxury/laptop-floating-docs.jpg"
          alt="Edvance SMS Luxury 3D Telemetry Platform"
          className="hero-luxury-main-img"
        />
        <div className="hero-glass-overlay">
          <div className="glass-chip-top">
            <span className="live-pulse-dot" />
            <span>MINESEC Official Standard • Live Telemetry</span>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Badge 1: Top Left — Rating & Social Proof */}
    <div className="floating-stat-badge badge-pos-top-left float-slow">
      <div className="stat-badge-icon badge-icon-orange">
        <Star size={16} fill="#E8A23A" color="#E8A23A" />
      </div>
      <div className="stat-badge-content">
        <div className="stat-badge-title">★ 4.9/5 Rating</div>
        <div className="stat-badge-sub">2,400+ African Schools</div>
      </div>
    </div>

    {/* Floating Badge 2: Top Right — Official 3D Report Card Generator */}
    <div className="floating-stat-badge badge-pos-top-right float-reverse">
      <div className="stat-badge-icon badge-icon-teal">
        <FileCheck size={16} color="#2D8C8C" />
      </div>
      <div className="stat-badge-content">
        <div className="stat-badge-title">Bilingual Report Cards</div>
        <div className="stat-badge-sub">MINESEC & GCE Compliant ✓</div>
      </div>
    </div>

    {/* Floating Badge 3: Bottom Left — Students Managed */}
    <div className="floating-stat-badge badge-pos-bottom-left float-reverse">
      <div className="stat-badge-icon badge-icon-navy">
        <Users size={16} color="#FFFFFF" />
      </div>
      <div className="stat-badge-content">
        <div className="stat-badge-title">850K+ Students</div>
        <div className="stat-badge-sub">Managed across 10 regions</div>
      </div>
    </div>

    {/* Floating Badge 4: Bottom Right — Cloud Uptime */}
    <div className="floating-stat-badge badge-pos-bottom-right float-slow">
      <div className="stat-badge-icon badge-icon-green">
        <Activity size={16} color="#16A34A" />
      </div>
      <div className="stat-badge-content">
        <div className="stat-badge-title">99.9% Cloud Uptime</div>
        <div className="stat-badge-sub">Offline Sync Mode Active</div>
      </div>
    </div>
  </div>
);

const Hero = () => (
  <section className="hero-section" id="hero">
    <div className="container">
      <div className="hero-inner">
        <div className="hero-grid">

          {/* ── LEFT: Text Content ── */}
          <div className="hero-text">
            {/* Pill Eyebrow */}
            <div className="hero-eyebrow-pill reveal">
              <span className="eyebrow-star">✦</span>
              <span className="eyebrow-text">The #1 African School Management Platform</span>
            </div>

            {/* Rounded Bold Headline mixing Vivid Blue & Dark Navy */}
            <h1 className="hero-headline reveal reveal-delay-1">
              <span className="text-navy">Enterprise school management for </span>
              <span className="text-blue">Africa's finest</span>
              <span className="text-navy"> educators</span>
            </h1>

            {/* Subhead Body */}
            <p className="hero-sub reveal reveal-delay-2">
              Replace manual spreadsheets, paper mark sheets, and fragmented portals
              with one unified system built for the GCE, BEPC, and Baccalauréat.
            </p>

            {/* Small checkmark-prefixed benefit list format for quick value props */}
            <div className="hero-benefit-checklist reveal reveal-delay-2">
              <div className="benefit-check-item">
                <div className="check-icon-circle">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span><strong>Zero spreadsheet errors:</strong> Automated coefficient weighting for Sequences 1–6</span>
              </div>
              <div className="benefit-check-item">
                <div className="check-icon-circle">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span><strong>Instant bilingual report cards:</strong> GCE & BEPC MINESEC compliant in 1 click</span>
              </div>
              <div className="benefit-check-item">
                <div className="check-icon-circle">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span><strong>Real-time parent visibility:</strong> Live SMS & WhatsApp alerts for grades & attendance</span>
              </div>
            </div>

            {/* Dual CTAs: Vivid Blue Rounded Primary + Dark Navy Secondary */}
            <div className="hero-cta-group reveal reveal-delay-3">
              <a href="/register" className="btn btn-primary btn--hero">
                <span>Start free trial</span>
                <ArrowRight size={17} className="btn-arrow-trailing" />
              </a>
              <a href="#dashboard" className="btn btn-secondary btn--hero">
                <Calendar size={17} />
                <span>Schedule a demo</span>
                <ArrowRight size={15} className="btn-arrow-trailing opacity-70" />
              </a>
            </div>

            {/* Social proof numbers strip */}
            <div className="hero-proof-strip reveal reveal-delay-3">
              <div className="hero-proof-item">
                <span className="hero-proof-value">850K+</span>
                <span className="hero-proof-label">Students managed</span>
              </div>
              <div className="hero-proof-sep" />
              <div className="hero-proof-item">
                <span className="hero-proof-value">40%</span>
                <span className="hero-proof-label">Faster grade processing</span>
              </div>
              <div className="hero-proof-sep" />
              <div className="hero-proof-item">
                <span className="hero-proof-value">99.9%</span>
                <span className="hero-proof-label">Platform uptime</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Luxury 3D Visual Framing & Floating Badges ── */}
          <div className="hero-visual reveal--right reveal reveal-delay-2">
            <HeroLuxuryVisual />
          </div>

        </div>
      </div>

      {/* ── 5-ICON BENEFIT STRIP ── */}
      <div className="benefit-strip-wrapper reveal reveal-delay-3">
        <div className="benefit-strip-grid">
          <div className="benefit-strip-card">
            <div className="benefit-strip-icon icon-blue">
              <ShieldCheck size={20} />
            </div>
            <div className="benefit-strip-info">
              <h4>MINESEC Compliant</h4>
              <p>Official Cameroon & GCE standards built in</p>
            </div>
          </div>

          <div className="benefit-strip-card">
            <div className="benefit-strip-icon icon-orange">
              <Sparkles size={20} />
            </div>
            <div className="benefit-strip-info">
              <h4>30-Second Grading</h4>
              <p>Instant weighted coefficient calculations</p>
            </div>
          </div>

          <div className="benefit-strip-card">
            <div className="benefit-strip-icon icon-blue">
              <FileCheck size={20} />
            </div>
            <div className="benefit-strip-info">
              <h4>Bilingual Reports</h4>
              <p>English & French PDF generation with QR seal</p>
            </div>
          </div>

          <div className="benefit-strip-card">
            <div className="benefit-strip-icon icon-orange">
              <Users size={20} />
            </div>
            <div className="benefit-strip-info">
              <h4>Parent SMS Alerts</h4>
              <p>Direct mobile grade & attendance notices</p>
            </div>
          </div>

          <div className="benefit-strip-card">
            <div className="benefit-strip-icon icon-navy">
              <Layers size={20} />
            </div>
            <div className="benefit-strip-info">
              <h4>Multi-Campus Scale</h4>
              <p>Unified oversight for school networks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
