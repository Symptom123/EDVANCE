import React, { useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import Metrics from '../components/Metrics';
import Features from '../components/Features';
import Showcase from '../components/Showcase';
import Analytics from '../components/Analytics';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import CtaSection from '../components/CtaSection';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

function LandingPage() {
  // Intersection Observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <TrustBar />
        <Metrics />
        <Features />
        <Showcase />
        <Analytics />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CtaSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;

