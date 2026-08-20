import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, ChevronRight, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SEARCH_ITEMS = [
  { title: 'Bilingual Report Cards (GCE & BEPC)', category: 'Feature', url: '#solution', icon: '📄', desc: '1-click MINESEC compliant PDF generation' },
  { title: 'Automated 30-Second Sequence Grading', category: 'Feature', url: '#solution', icon: '⚡', desc: 'Auto coefficient weighting for Seq 1–6' },
  { title: 'Parent SMS & WhatsApp Alerts', category: 'Feature', url: '#solution', icon: '📱', desc: 'Instant real-time mobile notifications' },
  { title: 'Multi-Campus Administration', category: 'Feature', url: '#solution', icon: '🏛️', desc: 'Centralized network oversight and audit logs' },
  { title: 'Interactive Academic Dashboard', category: 'Showcase', url: '#dashboard', icon: '📊', desc: 'Live student telemetry and enrollment metrics' },
  { title: '4-Step Implementation Workflow', category: 'Guide', url: '#how-it-works', icon: '🔄', desc: 'Onboarding and campus rollout in 48 hours' },
  { title: 'Pricing & Institutional Plans', category: 'Pricing', url: '#pricing', icon: '💎', desc: 'Transparent plans for primary and secondary schools' },
  { title: 'Administrator & School Reviews', category: 'Testimonials', url: '#testimonials', icon: '⭐', desc: 'Trusted by 2,400+ institutions across Africa' },
  { title: 'Admin Management Portal', category: 'Portal', url: '/admin', icon: '🛡️', desc: 'Manage teachers, students, classes and finances' },
  { title: 'Teacher Mark Entry Portal', category: 'Portal', url: '/teacher', icon: '✏️', desc: 'Submit sequence marks, attendance and homework' },
  { title: 'Student Grade & Results Portal', category: 'Portal', url: '/student', icon: '🎓', desc: 'Access report cards, timetable and class assignments' },
  { title: 'Parent Academic Tracking Portal', category: 'Portal', url: '/parent', icon: '👨‍👩‍👧', desc: 'View child attendance, grades and message teachers' },
  { title: 'Staff & Guardian Sign In', category: 'Auth', url: '/login', icon: '🔑', desc: 'Access your institution account' },
  { title: 'Register New School', category: 'Auth', url: '/register', icon: '🚀', desc: 'Set up your school in minutes' },
  { title: 'Contact Chancellery & Support', category: 'Contact', url: '#contact', icon: '📞', desc: 'Direct technical support in Yaoundé' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('hero');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Keyboard Shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const filteredResults = searchQuery.trim() === ''
    ? SEARCH_ITEMS.slice(0, 6)
    : SEARCH_ITEMS.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectResult = (url) => {
    setSearchQuery('');
    setSearchFocused(false);
    setMenuOpen(false);
    if (url.startsWith('#')) {
      const el = document.querySelector(url);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = url;
      }
    } else {
      navigate(url);
    }
  };

  return (
    <>
      <header className={`site-header-wrapper ${scrolled ? 'is-scrolled' : ''}`} id="siteHeader">
        <div className="main-nav-bar">
          <div className="container">
            <div className="main-nav-inner">
              {/* Brand Logo */}
              <a className="brand-logo" href="/" aria-label="Edvance Home">
                <img
                  src="/images/logo-horizontal.png"
                  alt="Edvance — Global Educational Solutions"
                  className="brand-logo-img"
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
              </a>

              {/* Desktop Interactive Search Field */}
              <div className="nav-search-wrap" ref={searchWrapRef}>
                <Search size={15} className="nav-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="nav-search-input"
                  placeholder="Search modules, portals, GCE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  aria-label="Quick search"
                />
                {searchQuery ? (
                  <button 
                    className="nav-search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                ) : (
                  <kbd className="nav-search-shortcut">⌘K</kbd>
                )}

                {/* Floating Live Search Dropdown */}
                {searchFocused && (
                  <div className="nav-search-dropdown">
                    <div className="nav-search-dropdown-header">
                      <span>{searchQuery ? `Search Results (${filteredResults.length})` : 'Quick Navigation & Modules'}</span>
                      <span className="nav-search-esc-hint">ESC to close</span>
                    </div>
                    <div className="nav-search-results-list">
                      {filteredResults.length === 0 ? (
                        <div className="nav-search-empty">
                          <p>No results found for "{searchQuery}"</p>
                          <span className="nav-search-empty-sub">Try searching for "Report Cards", "Admin", "Grading", or "Pricing"</span>
                        </div>
                      ) : (
                        filteredResults.map((item, idx) => (
                          <div
                            key={idx}
                            className="nav-search-result-item"
                            onClick={() => handleSelectResult(item.url)}
                          >
                            <span className="search-item-icon">{item.icon}</span>
                            <div className="search-item-info">
                              <div className="search-item-title-row">
                                <span className="search-item-title">{item.title}</span>
                                <span className="search-item-badge">{item.category}</span>
                              </div>
                              <span className="search-item-desc">{item.desc}</span>
                            </div>
                            <ArrowRight size={14} className="search-item-arrow" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
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

              {/* Desktop Action Cluster with Refined Sign In Button */}
              <div className="nav-actions-cluster">
                <a href="/login" className="btn-nav-login" title="Staff & Parent Portal Sign In">
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
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </a>
            <button className="mobile-close-btn" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Mobile Search Field */}
          <div className="mobile-search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search curriculum, portals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Mobile Search Results (if searching) */}
          {searchQuery.trim() !== '' && (
            <div className="mobile-search-results-tray">
              {filteredResults.map((item, idx) => (
                <div
                  key={idx}
                  className="mobile-search-result-row"
                  onClick={() => handleSelectResult(item.url)}
                >
                  <span>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{item.category}</div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              ))}
            </div>
          )}

          <nav className="mobile-nav-list">
            {navLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`mobile-nav-link ${activeNav === link.id ? 'is-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span>{link.label}</span>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </a>
            ))}
          </nav>

          <div className="mobile-sheet-actions">
            <a href="/login" className="btn btn-secondary-full" onClick={() => setMenuOpen(false)}>
              <span>Sign in</span>
            </a>
            <a href="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              <span>Start free trial</span>
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="mobile-sheet-footer">
            <p><strong>Official MINESEC Standards</strong></p>
            <p>Cameroon GCE & BEPC Bilingual Systems</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
