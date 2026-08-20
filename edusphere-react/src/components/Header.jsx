import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Phone, Mail, MapPin, Globe, Shield, ChevronRight } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('hero');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navLinks = [
    { id: 'solution', label: 'Product' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'how-it-works', label: 'Workflow' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'testimonials', label: 'Customers' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <>
      <header className={`site-header-wrapper ${scrolled ? 'is-scrolled' : ''}`} id="siteHeader">
        {/* Tier 1: Stylish Navy-Green Half Bar */}
        <div className="top-utility-bar">
          <div className="container">
            <div className="utility-bar-half-pill">
              <div className="utility-left">
                <a href="tel:+237670000000" className="utility-link">
                  <Phone size={12} className="utility-icon" />
                  <span>+237 670 000 000</span>
                </a>
                <span className="utility-sep">•</span>
                <a href="mailto:chancellery@edvance.io" className="utility-link">
                  <Mail size={12} className="utility-icon" />
                  <span>chancellery@edvance.io</span>
                </a>
              </div>

              <div className="utility-right">
                <span className="utility-badge">
                  <Shield size={12} className="utility-badge-icon" />
                  <span>MINESEC & GCE Compliant</span>
                </span>
                <span className="utility-sep">•</span>
                <div className="utility-lang">
                  <Globe size={12} className="utility-icon" />
                  <span>Bilingual (EN / FR)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Main White Navigation Bar */}
        <div className="main-nav-bar">
          <div className="container">
            <div className="main-nav-inner">
              {/* Brand Logo */}
              <a className="brand-logo" href="/" aria-label="Edvance Home">
                <img
                  src="/images/logo-horizontal.png"
                  alt="Edvance — Global Educational Solutions"
                  className="brand-logo-img"
                />
              </a>

              {/* Desktop Search Field */}
              <div className="nav-search-wrap">
                <Search size={15} className="nav-search-icon" />
                <input
                  type="text"
                  className="nav-search-input"
                  placeholder="Search modules, GCE, BEPC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Quick search"
                />
                <kbd className="nav-search-shortcut">⌘K</kbd>
              </div>

              {/* Desktop Nav Links */}
              <nav className="desktop-nav" role="navigation" aria-label="Main navigation">
                {navLinks.map(link => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`desktop-nav-link ${activeNav === link.id ? 'is-active' : ''}`}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Desktop Action Cluster */}
              <div className="nav-actions-cluster">
                <a href="/login" className="btn-nav-login" title="Staff Portal Sign In">
                  <span>Sign in</span>
                </a>
                <a href="/register" className="btn-nav-primary">
                  <span>Get started</span>
                  <ChevronRight size={15} className="btn-nav-arrow" />
                </a>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="mobile-toggle-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <div 
        className={`mobile-menu-overlay ${menuOpen ? 'is-visible' : ''}`} 
        aria-hidden={!menuOpen}
        onClick={(e) => {
          if (e.target.classList.contains('mobile-menu-overlay')) setMenuOpen(false);
        }}
      >
        <div className="mobile-menu-sheet">
          <div className="mobile-sheet-header">
            <a className="brand-logo" href="/">
              <img
                src="/images/logo-horizontal.png"
                alt="Edvance"
                className="brand-logo-img brand-logo-img--mobile"
              />
            </a>
            <button className="mobile-close-btn" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="mobile-search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search curriculum or portal..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="mobile-nav-list">
            {navLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`mobile-nav-link ${activeNav === link.id ? 'is-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span>{link.label}</span>
                <ChevronRight size={16} className="mobile-link-arrow" />
              </a>
            ))}
          </nav>

          <div className="mobile-sheet-actions">
            <a href="/login" className="btn-mobile-secondary" onClick={() => setMenuOpen(false)}>
              Sign in to Portal
            </a>
            <a href="/register" className="btn-mobile-primary" onClick={() => setMenuOpen(false)}>
              <span>Start 30-Day Free Trial</span>
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="mobile-sheet-footer">
            <div className="mobile-footer-pill">
              <Shield size={13} />
              <span>MINESEC & GCE Board Compliant</span>
            </div>
            <div className="mobile-contact-line">
              <Phone size={13} />
              <span>+237 670 000 000</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
