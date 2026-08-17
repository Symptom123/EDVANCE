import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('hero');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
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
      { rootMargin: '-40% 0px -50% 0px' }
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
    { id: 'pricing', label: 'Pricing' },
    { id: 'testimonials', label: 'Customers' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`} id="siteHeader">
        <div className="header-inner">
          {/* Logo */}
          <a className="brand" href="/" aria-label="Edvance home">
            <img
              src="/images/logo-horizontal.png"
              alt="Edvance"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="brand-wordmark" style={{ display: 'none' }}>
              Edv<span>ance</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="main-nav" role="navigation" aria-label="Main navigation">
            {navLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`nav-item ${activeNav === link.id ? 'active' : ''}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="header-cta">
            <a href="/login" className="btn-text">Sign in</a>
            <a href="/register" className="btn btn-primary btn--sm">Get started</a>
          </div>

          {/* Mobile toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div 
        className={`mobile-drawer ${menuOpen ? 'open' : ''}`} 
        aria-hidden={!menuOpen}
        onClick={(e) => {
          if (e.target.classList.contains('mobile-drawer')) setMenuOpen(false);
        }}
      >
        <div className="mobile-drawer-inner">
          <nav className="mobile-drawer-nav">
            {navLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`mobile-nav-item ${activeNav === link.id ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span>{link.label}</span>
                <span className="mobile-nav-arrow">→</span>
              </a>
            ))}
          </nav>
          <div className="mobile-drawer-cta">
            <a href="/login" className="btn btn-outline-full" onClick={() => setMenuOpen(false)}>Sign in to Portal</a>
            <a href="/register" className="btn btn-primary-full" onClick={() => setMenuOpen(false)}>Start 30-day Free Trial</a>
          </div>
          <div className="mobile-drawer-footer">
            <span>MINESEC & GCE Board Compliant</span>
            <span>•</span>
            <span>Bilingual SMS Platform</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
