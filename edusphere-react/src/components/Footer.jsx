import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <span className="footer-wordmark">
              Edv<span>ance</span>
            </span>
            <p className="footer-tagline">
              The enterprise school management standard trusted by 2,400+ leading institutions across sub-Saharan Africa.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">MINESEC Compliant</span>
              <span className="footer-badge">GCE Board Ready</span>
              <span className="footer-badge">SOC-2 & GDPR</span>
            </div>
          </div>

          {/* Links Cols */}
          <div className="footer-links-cols">
            <div>
              <span className="footer-col-title">Platform</span>
              <a href="#solution" className="footer-link">Mark Calculations</a>
              <a href="#dashboard" className="footer-link">Report Card Engine</a>
              <a href="#dashboard" className="footer-link">Parent Portal</a>
              <a href="#pricing" className="footer-link">Pricing & Plans</a>
              <a href="/login" className="footer-link highlight">Staff Login →</a>
              <a href="/register" className="footer-link highlight">Create School →</a>
            </div>

            <div>
              <span className="footer-col-title">Curriculums</span>
              <a href="#solution" className="footer-link">Cameroon GCE O/A</a>
              <a href="#solution" className="footer-link">BEPC & Baccalauréat</a>
              <a href="#solution" className="footer-link">WAEC & WASSCE</a>
              <a href="#solution" className="footer-link">Cambridge IGCSE</a>
              <a href="#solution" className="footer-link">Bilingual Systems</a>
            </div>

            <div>
              <span className="footer-col-title">Resources</span>
              <a href="#faq" className="footer-link">Documentation</a>
              <a href="#faq" className="footer-link">Coefficient Guide</a>
              <a href="#testimonials" className="footer-link">Case Studies</a>
              <a href="#faq" className="footer-link">Support Desk</a>
              <a href="#contact" className="footer-link">WhatsApp Registrar</a>
            </div>

            <div>
              <span className="footer-col-title">Institutional</span>
              <a href="#hero" className="footer-link">About Edvance</a>
              <a href="#contact" className="footer-link">Regional Offices</a>
              <a href="#contact" className="footer-link">Ministry Inquiries</a>
              <a href="#contact" className="footer-link">Trust & Security</a>
              <a href="#pricing" className="footer-link">District Partnerships</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} Edvance Educational Systems Ltd. Built with pride for Africa's educators.
          </p>
          <div className="footer-legal">
            <a href="#">Data Privacy Charter</a>
            <a href="#">Terms of Academic Service</a>
            <a href="#">Security Safeguards</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
