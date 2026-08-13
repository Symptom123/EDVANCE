import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('product');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`} id="siteHeader">
        <div className="header-inner">
          {/* Logo — horizontal logo (logo 3) for navbar */}
          <a className="brand" href="#" id="brand-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/images/logo-horizontal.png"
              alt="Edvance Logo"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
          </a>

          <nav className="main-nav" role="navigation" aria-label="Main navigation">
            <a href="#product" className={`nav-item ${activeNav === 'product' ? 'active' : ''}`}>Product</a>
            <a href="#solutions" className={`nav-item ${activeNav === 'solutions' ? 'active' : ''}`}>Solutions</a>
            <a href="#features" className={`nav-item ${activeNav === 'features' ? 'active' : ''}`}>Features</a>
            <a href="#pricing" className={`nav-item ${activeNav === 'pricing' ? 'active' : ''}`}>Pricing</a>
            <a href="#customers" className={`nav-item ${activeNav === 'customers' ? 'active' : ''}`}>Customers</a>
          </nav>

          <div className="header-cta">
            <a href="/login" className="btn-text">Sign in</a>
            <a href="/register" className="btn-primary"><span>Get started free</span></a>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <nav>
          <a href="#product" className="mobile-nav-item" onClick={closeMenu}>Product</a>
          <a href="#solutions" className="mobile-nav-item" onClick={closeMenu}>Solutions</a>
          <a href="#features" className="mobile-nav-item" onClick={closeMenu}>Features</a>
          <a href="#pricing" className="mobile-nav-item" onClick={closeMenu}>Pricing</a>
          <a href="#customers" className="mobile-nav-item" onClick={closeMenu}>Customers</a>
        </nav>
        <div className="mobile-drawer-cta">
          <a href="/login" className="btn-outline-full" onClick={closeMenu}>Sign in</a>
          <a href="/register" className="btn-primary-full" onClick={closeMenu}><span>Get started free</span></a>
        </div>
      </div>
    </>
  );
};

export default Header;

