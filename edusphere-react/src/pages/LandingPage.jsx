import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import TheProblem from '../components/TheProblem';
import Features from '../components/Features';
import Showcase from '../components/Showcase';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import CtaSection from '../components/CtaSection';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import LandingBackground from '../components/landing/LandingBackground';
import CursorSpotlight from '../components/landing/CursorSpotlight';
import ScrollProgressBar from '../components/landing/ScrollProgressBar';
import { ArrowUp } from 'lucide-react';

function LandingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Intersection Observer for smooth reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal--left, .reveal--right').forEach((el) => observer.observe(el));

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 450);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-page-root">
      {/* Scroll Progress Bar at the Top */}
      <ScrollProgressBar />

      {/* Subtle Ambient Background Mesh */}
      <LandingBackground />

      {/* Interactive Cursor Spotlight & Shadow Follower */}
      <CursorSpotlight />

      {/* Fixed/Sticky Glass Header */}
      <Header />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: The Problem */}
        <TheProblem />

        {/* Section 3: The Solution */}
        <Features />

        {/* Section 4: Real Dashboard Showcase */}
        <Showcase />

        {/* Section 5: How It Works */}
        <HowItWorks />

        {/* Section 6: Social Proof */}
        <Testimonials />

        {/* Section 8: Pricing */}
        <Pricing />

        {/* Section 9: FAQ */}
        <FAQ />

        {/* Section 10: Final CTA */}
        <CtaSection />

        {/* Direct Inquiries / Contact */}
        <Contact />
      </main>

      {/* Section 11: Footer */}
      <Footer />

      {/* Floating Back to Top Button */}
      <button 
        className={`back-to-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll back to top"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}

export default LandingPage;
