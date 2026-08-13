import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#" aria-label="Edvance Home" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/images/logo-monogram.png"
                alt="Edvance"
                style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              />
            </a>
            <p className="footer-tagline">
              The enterprise school management platform trusted by 2,400+ institutions worldwide.
            </p>
            <div className="footer-compliance">
              <span>SOC 2 Certified</span>
              <span>FERPA</span>
              <span>GDPR</span>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#showcase">Portals</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Changelog</a>
              <a href="#">Roadmap</a>
              <a href="/login" style={{ color: '#10B981', fontWeight: 600 }}>Sign in →</a>
              <a href="/register" style={{ color: '#10B981', fontWeight: 600 }}>Create school →</a>
            </div>
            <div className="footer-col">
              <h4>Solutions</h4>
              <a href="#">K-12 Schools</a>
              <a href="#">Universities</a>
              <a href="#">School Districts</a>
              <a href="#">Private Schools</a>
              <a href="#">International</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Help Centre</a>
              <a href="#">Blog</a>
              <a href="#">Webinars</a>
              <a href="#">API Reference</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
              <a href="#contact">Contact</a>
              <a href="#">Partners</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Edvance Global Educational Solutions. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
