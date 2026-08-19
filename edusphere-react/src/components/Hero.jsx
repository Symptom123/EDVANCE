import React from 'react';
import { ArrowRight, Calendar, Check, Star, ShieldCheck, Sparkles, Award, Users, Activity, FileCheck, Layers } from 'lucide-react';

/* ── Floating Proof Badges ── */
const FloatingBadges = () => (
  <>
    {/* Top-left badge */}
    <div className="sv-badge sv-badge--tl float-slow">
      <div className="sv-badge-icon sv-badge-icon--gold">
        <Star size={14} fill="#E8A23A" color="#E8A23A" />
      </div>
      <div className="sv-badge-body">
        <span className="sv-badge-title">★ 4.9 / 5</span>
        <span className="sv-badge-sub">2,400+ African Schools</span>
      </div>
    </div>

    {/* Top-right badge */}
    <div className="sv-badge sv-badge--tr float-reverse">
      <div className="sv-badge-icon sv-badge-icon--teal">
        <FileCheck size={14} color="#2D8C8C" />
      </div>
      <div className="sv-badge-body">
        <span className="sv-badge-title">GCE & BEPC Compliant</span>
        <span className="sv-badge-sub">MINESEC Official ✓</span>
      </div>
    </div>

    {/* Bottom-left badge */}
    <div className="sv-badge sv-badge--bl float-slow" style={{ animationDelay: '0.8s' }}>
      <div className="sv-badge-icon sv-badge-icon--navy">
        <Users size={14} color="#fff" />
      </div>
      <div className="sv-badge-body">
        <span className="sv-badge-title">850K+ Students</span>
        <span className="sv-badge-sub">Across 10 regions</span>
      </div>
    </div>

    {/* Bottom-right badge */}
    <div className="sv-badge sv-badge--br float-reverse" style={{ animationDelay: '0.4s' }}>
      <div className="sv-badge-icon sv-badge-icon--green">
        <Activity size={14} color="#16A34A" />
      </div>
      <div className="sv-badge-body">
        <span className="sv-badge-title">99.9% Uptime</span>
        <span className="sv-badge-sub">Offline Sync Active</span>
      </div>
    </div>
  </>
);

const Hero = () => (
  <section className="sv-hero" id="hero">

    {/* ── Full-bleed crystal 3D background ── */}
    <div className="sv-hero-bg" aria-hidden="true">
      <img
        src="/images/luxury/hero-bg-crystal.jpg"
        alt=""
        className="sv-hero-bg-img"
      />
      {/* Cinematic multi-layer overlay for legibility */}
      <div className="sv-hero-overlay" />
      {/* Radial spotlight glow emanating from center-bottom */}
      <div className="sv-hero-spotlight" />
    </div>

    {/* ── Floating proof badges positioned over BG ── */}
    <FloatingBadges />

    {/* ── Content Layer ── */}
    <div className="container sv-hero-content">

      {/* Live pill */}
      <div className="sv-live-pill reveal">
        <span className="sv-live-dot" />
        <span>MINESEC Certified · Live Telemetry</span>
      </div>

      {/* Eyebrow */}
      <p className="sv-hero-eyebrow reveal reveal-delay-1">
        The #1 African School Management Platform
      </p>

      {/* Headline — editorial split style like Severna */}
      <h1 className="sv-hero-headline reveal reveal-delay-1">
        <span className="sv-headline-line sv-hl-light">Enterprise school</span>
        <span className="sv-headline-line sv-hl-gradient">management for</span>
        <span className="sv-headline-line sv-hl-light">Africa's finest</span>
      </h1>

      {/* Sub copy */}
      <p className="sv-hero-sub reveal reveal-delay-2">
        Replace manual spreadsheets, paper mark sheets and fragmented portals with one
        unified platform built for the GCE, BEPC, and Baccalauréat.
      </p>

      {/* CTA row */}
      <div className="sv-hero-ctas reveal reveal-delay-3">
        <a href="/register" className="sv-btn-primary">
          Start free trial
          <ArrowRight size={17} />
        </a>
        <a href="#dashboard" className="sv-btn-ghost">
          <Calendar size={16} />
          Schedule a demo
        </a>
      </div>

      {/* Glass checklist cards row */}
      <div className="sv-glass-row reveal reveal-delay-3">
        <div className="sv-glass-chip">
          <Check size={13} strokeWidth={3} className="sv-chip-check" />
          <span><strong>Zero errors</strong> — automated coefficient weighting Seq 1–6</span>
        </div>
        <div className="sv-glass-chip">
          <Check size={13} strokeWidth={3} className="sv-chip-check" />
          <span><strong>1-click bilingual</strong> report cards — GCE & BEPC compliant</span>
        </div>
        <div className="sv-glass-chip">
          <Check size={13} strokeWidth={3} className="sv-chip-check" />
          <span><strong>Live SMS alerts</strong> — parents notified instantly on grades</span>
        </div>
      </div>

      {/* Proof numbers strip */}
      <div className="sv-proof-strip reveal reveal-delay-4">
        <div className="sv-proof-item">
          <span className="sv-proof-num">850K+</span>
          <span className="sv-proof-lbl">Students managed</span>
        </div>
        <div className="sv-proof-sep" />
        <div className="sv-proof-item">
          <span className="sv-proof-num">40%</span>
          <span className="sv-proof-lbl">Faster grade processing</span>
        </div>
        <div className="sv-proof-sep" />
        <div className="sv-proof-item">
          <span className="sv-proof-num">99.9%</span>
          <span className="sv-proof-lbl">Platform uptime</span>
        </div>
        <div className="sv-proof-sep" />
        <div className="sv-proof-item">
          <span className="sv-proof-num">10+</span>
          <span className="sv-proof-lbl">African regions covered</span>
        </div>
      </div>
    </div>

    {/* ── Bottom benefit icon bar ── */}
    <div className="sv-benefit-bar">
      <div className="container sv-benefit-bar-inner">
        <div className="sv-benefit-item">
          <ShieldCheck size={18} className="sv-benefit-icon" />
          <span>MINESEC Compliant</span>
        </div>
        <div className="sv-benefit-divider" />
        <div className="sv-benefit-item">
          <Sparkles size={18} className="sv-benefit-icon" />
          <span>30-Second Grading</span>
        </div>
        <div className="sv-benefit-divider" />
        <div className="sv-benefit-item">
          <FileCheck size={18} className="sv-benefit-icon" />
          <span>Bilingual PDF Reports</span>
        </div>
        <div className="sv-benefit-divider" />
        <div className="sv-benefit-item">
          <Users size={18} className="sv-benefit-icon" />
          <span>Parent SMS Alerts</span>
        </div>
        <div className="sv-benefit-divider" />
        <div className="sv-benefit-item">
          <Layers size={18} className="sv-benefit-icon" />
          <span>Multi-Campus Scale</span>
        </div>
      </div>
    </div>

  </section>
);

export default Hero;
