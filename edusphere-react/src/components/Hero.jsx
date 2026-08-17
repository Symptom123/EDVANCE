import React from 'react';
import { ArrowRight, Calendar, ShieldCheck, Award, Globe } from 'lucide-react';

/* ── Inline SVG Illustration — Premium abstract school scene ── */
const HeroIllustration = () => (
  <svg
    viewBox="-15 20 515 480"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="hero-svg-graphic"
    style={{ width: '100%', height: 'auto', maxWidth: 500 }}
  >
    {/* Background card */}
    <rect x="20" y="40" width="440" height="440" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>

    {/* Top header bar */}
    <rect x="20" y="40" width="440" height="56" rx="20" fill="rgba(255,255,255,0.06)"/>
    <rect x="20" y="76" width="440" height="20" fill="rgba(255,255,255,0.06)"/>
    <circle cx="52" cy="68" r="7" fill="rgba(255,90,80,0.6)"/>
    <circle cx="72" cy="68" r="7" fill="rgba(255,189,40,0.6)"/>
    <circle cx="92" cy="68" r="7" fill="rgba(40,200,60,0.6)"/>
    {/* Title bar text */}
    <rect x="180" y="62" width="120" height="10" rx="5" fill="rgba(255,255,255,0.12)"/>

    {/* ── LEFT SIDEBAR ── */}
    <rect x="20" y="96" width="88" height="384" rx="0" fill="rgba(255,255,255,0.03)" stroke="none"/>
    {/* Nav items */}
    {[0,1,2,3,4,5,6].map((i) => (
      <g key={i}>
        <rect x="30" y={116 + i * 44} width="8" height="8" rx="2" fill={i === 1 ? '#2d7d4a' : 'rgba(255,255,255,0.15)'}/>
        <rect x="46" y={117 + i * 44} width={i === 1 ? 44 : 30} height="6" rx="3" fill={i === 1 ? 'rgba(45,125,74,0.5)' : 'rgba(255,255,255,0.1)'}/>
      </g>
    ))}
    {/* Active nav highlight */}
    <rect x="24" y="152" width="80" height="32" rx="6" fill="rgba(45,125,74,0.18)" stroke="rgba(45,125,74,0.25)" strokeWidth="1"/>

    {/* ── MAIN CONTENT AREA ── */}
    {/* KPI Cards row */}
    {[0,1,2].map((i) => (
      <g key={i}>
        <rect x={118 + i * 118} y="106" width="106" height="76" rx="10"
          fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        <rect x={130 + i * 118} y="118" width="60" height="6" rx="3" fill="rgba(255,255,255,0.18)"/>
        <rect x={130 + i * 118} y="132" width={i === 0 ? 48 : i === 1 ? 54 : 40} height="18" rx="4"
          fill={i === 0 ? 'rgba(45,125,74,0.7)' : 'rgba(255,255,255,0.15)'}/>
        <rect x={130 + i * 118} y="158" width="36" height="6" rx="3" fill="rgba(255,255,255,0.1)"/>
      </g>
    ))}

    {/* ── REPORT CARD TABLE ── */}
    <rect x="118" y="196" width="326" height="192" rx="12"
      fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
    {/* Table header */}
    <rect x="118" y="196" width="326" height="32" rx="12" fill="rgba(255,255,255,0.05)"/>
    <rect x="118" y="216" width="326" height="12" fill="rgba(255,255,255,0.05)"/>
    {['Student Name','Math','French','Avg','Rank'].map((_, ci) => (
      <rect key={ci} x={130 + ci * 60} y={206} width={ci === 0 ? 48 : 28} height="6"
        rx="3" fill="rgba(255,255,255,0.2)"/>
    ))}

    {/* Table rows */}
    {[
      { cols: ['rgba(255,255,255,0.55)','rgba(100,220,130,0.9)','rgba(100,200,130,0.8)','rgba(255,255,255,0.7)','rgba(201,169,110,0.9)'] },
      { cols: ['rgba(255,255,255,0.5)','rgba(255,200,80,0.9)','rgba(255,200,80,0.8)','rgba(255,255,255,0.65)','rgba(255,255,255,0.4)'] },
      { cols: ['rgba(255,255,255,0.5)','rgba(100,220,130,0.85)','rgba(255,200,80,0.8)','rgba(255,255,255,0.6)','rgba(255,255,255,0.35)'] },
      { cols: ['rgba(255,255,255,0.45)','rgba(255,130,130,0.8)','rgba(100,200,130,0.8)','rgba(255,255,255,0.55)','rgba(255,255,255,0.3)'] },
    ].map((row, ri) => (
      <g key={ri}>
        <rect x="118" y={234 + ri * 38} width="326" height="38"
          fill={ri % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
          stroke="none"/>
        {row.cols.map((col, ci) => (
          <rect key={ci}
            x={130 + ci * 60} y={246 + ri * 38}
            width={ci === 0 ? 44 : 22}
            height="8" rx="4" fill={col}/>
        ))}
      </g>
    ))}

    {/* ── ANALYTICS MINI CHART ── */}
    <rect x="118" y="400" width="152" height="64" rx="10"
      fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
    <rect x="128" y="410" width="60" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
    {/* Mini bar chart */}
    {[28,18,34,22,42,30,38].map((h, i) => (
      <rect key={i} x={128 + i * 18} y={450 - h * 0.7} width="10" height={h * 0.7} rx="3"
        fill={i === 4 ? '#2d7d4a' : 'rgba(255,255,255,0.12)'}/>
    ))}

    {/* ── REPORT CARD MINI PREVIEW ── */}
    <rect x="284" y="400" width="160" height="64" rx="10"
      fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
    <rect x="294" y="410" width="70" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
    <rect x="294" y="424" width="44" height="4" rx="2" fill="rgba(201,169,110,0.5)"/>
    <rect x="294" y="434" width="124" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="294" y="444" width="100" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>
    <rect x="294" y="454" width="80" height="4" rx="2" fill="rgba(255,255,255,0.06)"/>

    {/* ── FLOATING BADGE 1 — Active users ── */}
    <g filter="url(#dropShadow)">
      <rect x="-4" y="130" width="164" height="52" rx="10"
        fill="white" stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
      <circle cx="26" cy="156" r="10" fill="rgba(45,125,74,0.12)"/>
      <circle cx="26" cy="156" r="6" fill="#2d7d4a"/>
      <rect x="44" y="147" width="56" height="6" rx="3" fill="#1a2332" opacity="0.7"/>
      <rect x="44" y="159" width="36" height="5" rx="2.5" fill="#9ca3af" opacity="0.7"/>
      <rect x="104" y="149" width="44" height="14" rx="4" fill="rgba(45,125,74,0.12)"/>
      <rect x="108" y="152" width="36" height="7" rx="3" fill="rgba(45,125,74,0.5)"/>
    </g>

    {/* ── FLOATING BADGE 2 — Report generated ── */}
    <g filter="url(#dropShadow)">
      <rect x="330" y="58" width="152" height="52" rx="10"
        fill="white" stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
      <rect x="344" y="70" width="26" height="26" rx="6" fill="rgba(201,169,110,0.15)"/>
      <rect x="350" y="76" width="14" height="3" rx="1.5" fill="#c9a96e"/>
      <rect x="350" y="82" width="10" height="3" rx="1.5" fill="#c9a96e" opacity="0.5"/>
      <rect x="350" y="88" width="12" height="3" rx="1.5" fill="#c9a96e" opacity="0.3"/>
      <rect x="380" y="70" width="72" height="6" rx="3" fill="#1a2332" opacity="0.7"/>
      <rect x="380" y="82" width="50" height="5" rx="2.5" fill="#9ca3af" opacity="0.7"/>
      <rect x="380" y="92" width="36" height="5" rx="2.5" fill="rgba(45,125,74,0.4)"/>
    </g>

    {/* Drop shadow filter */}
    <defs>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.12)"/>
      </filter>
    </defs>
  </svg>
);

const Hero = () => (
  <section className="hero-section" id="hero">
    <div className="container">
      <div className="hero-inner">
        <div className="hero-grid">

          {/* ── LEFT: Text Content ── */}
          <div className="hero-text">
            <h1 className="hero-headline reveal">
              <span>Enterprise school management for </span>
              <em>Africa's finest</em>
              <span> educators</span>
            </h1>

            <p className="hero-sub reveal reveal-delay-1">
              Replace manual spreadsheets, paper mark sheets, and fragmented portals
              with one unified system built for the GCE, BEPC, and Baccalauréat.
            </p>

            <div className="hero-cta-group reveal reveal-delay-2">
              <a href="/register" className="btn btn-primary btn--hero">
                <span>Start free trial</span>
                <ArrowRight size={17} />
              </a>
              <a href="#dashboard" className="btn btn-secondary btn--hero">
                <Calendar size={17} />
                <span>Schedule a demo</span>
              </a>
            </div>

            {/* Social proof numbers */}
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

          {/* ── RIGHT: Illustration ── */}
          <div className="hero-visual reveal--right reveal reveal-delay-2">
            <div className="hero-illus-wrap">
              <HeroIllustration />
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
);

export default Hero;
