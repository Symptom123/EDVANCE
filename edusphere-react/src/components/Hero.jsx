import React from 'react';
import { ArrowRight, Calendar, Check, Star, ShieldCheck, Sparkles, Award, Users, Activity, FileCheck, Layers } from 'lucide-react';

/* ── Circular Visual with Abstract Elements & Floating Badges ── */
const HeroCircularVisual = () => (
  <div className="hero-visual-container">
    {/* Decorative Dot-Grid Background Element */}
    <div className="hero-dot-grid" aria-hidden="true" />
    
    {/* Decorative Circular Line Pattern & Glow Ring */}
    <div className="hero-glow-ring" aria-hidden="true" />
    <div className="hero-abstract-curves" aria-hidden="true">
      <svg width="460" height="460" viewBox="0 0 460 460" fill="none">
        <circle cx="230" cy="230" r="210" stroke="#2D8C8C" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.25" />
        <circle cx="230" cy="230" r="175" stroke="#1A2B4A" strokeWidth="1" opacity="0.12" />
        <circle cx="230" cy="230" r="140" stroke="#E8A23A" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.35" />
      </svg>
    </div>

    {/* Center Circular Photo / Dashboard Framing */}
    <div className="hero-circle-frame">
      <div className="hero-circle-inner">
        {/* Crisp vector illustration representing modern African school leadership */}
        <svg viewBox="0 0 400 400" fill="none" className="hero-center-graphic">
          <defs>
            <linearGradient id="circleGrad" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2D8C8C" />
              <stop offset="100%" stopColor="#1A2B4A" />
            </linearGradient>
            <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#EDF7F6" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle cx="200" cy="200" r="190" fill="url(#circleGrad)" />

          {/* Abstract classroom / digital tablet scene */}
          <rect x="70" y="80" width="260" height="190" rx="16" fill="url(#cardGrad)" filter="drop-shadow(0 12px 24px rgba(0,0,0,0.2))" />
          
          {/* Header bar of window */}
          <rect x="70" y="80" width="260" height="34" rx="16" fill="#1A2B4A" />
          <rect x="70" y="100" width="260" height="14" fill="#1A2B4A" />
          <circle cx="90" cy="97" r="4" fill="#EF4444" />
          <circle cx="102" cy="97" r="4" fill="#E8A23A" />
          <circle cx="114" cy="97" r="4" fill="#22C55E" />
          <rect x="140" y="93" width="120" height="8" rx="4" fill="rgba(255,255,255,0.2)" />

          {/* Report Card preview rows inside screen */}
          <rect x="88" y="128" width="130" height="10" rx="5" fill="#1A2B4A" opacity="0.85" />
          <rect x="88" y="146" width="90" height="7" rx="3.5" fill="#2D8C8C" opacity="0.6" />

          {/* Mini Table Rows */}
          <rect x="88" y="165" width="224" height="24" rx="6" fill="#EDF7F6" />
          <rect x="98" y="172" width="60" height="10" rx="3" fill="#1A2B4A" opacity="0.7" />
          <rect x="230" y="171" width="36" height="12" rx="4" fill="#22C55E" opacity="0.25" />
          <rect x="235" y="174" width="26" height="6" rx="3" fill="#16A34A" />
          <rect x="278" y="171" width="24" height="12" rx="4" fill="#2D8C8C" />

          <rect x="88" y="196" width="224" height="24" rx="6" fill="#FFFFFF" />
          <rect x="98" y="203" width="75" height="10" rx="3" fill="#1A2B4A" opacity="0.7" />
          <rect x="230" y="202" width="36" height="12" rx="4" fill="#22C55E" opacity="0.25" />
          <rect x="235" y="205" width="26" height="6" rx="3" fill="#16A34A" />
          <rect x="278" y="202" width="24" height="12" rx="4" fill="#2D8C8C" />

          <rect x="88" y="227" width="224" height="24" rx="6" fill="#EDF7F6" />
          <rect x="98" y="234" width="50" height="10" rx="3" fill="#1A2B4A" opacity="0.7" />
          <rect x="230" y="233" width="36" height="12" rx="4" fill="#E8A23A" opacity="0.25" />
          <rect x="235" y="236" width="26" height="6" rx="3" fill="#C6821E" />
          <rect x="278" y="233" width="24" height="12" rx="4" fill="#2D8C8C" />

          {/* Student & Teacher Characters Representation */}
          <circle cx="200" cy="310" r="48" fill="#FFFFFF" />
          <circle cx="200" cy="295" r="22" fill="#1A2B4A" />
          <path d="M165 348 C165 315, 235 315, 235 348" fill="#2D8C8C" />
          {/* Graduation Cap Badge */}
          <polygon points="200,265 224,275 200,285 176,275" fill="#E8A23A" />
          <line x1="220" y1="277" x2="220" y2="290" stroke="#E8A23A" strokeWidth="2" />
        </svg>
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

    {/* Floating Badge 2: Top Right — Instant Report Generator */}
    <div className="floating-stat-badge badge-pos-top-right float-reverse">
      <div className="stat-badge-icon badge-icon-blue">
        <FileCheck size={16} color="#2D8C8C" />
      </div>
      <div className="stat-badge-content">
        <div className="stat-badge-title">Official Report Cards</div>
        <div className="stat-badge-sub">MINESEC Compliant ✓</div>
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

          {/* ── RIGHT: Circular Visual Framing & Floating Badges ── */}
          <div className="hero-visual reveal--right reveal reveal-delay-2">
            <HeroCircularVisual />
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
