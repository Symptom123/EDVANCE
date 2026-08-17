import React, { useEffect, useState, useRef } from 'react';

const CursorSpotlight = () => {
  const [isTouch, setIsTouch] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const haloRef = useRef(null);

  // Position state with lerp interpolation
  const mousePos = useRef({ x: -100, y: -100 });
  const haloPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    let animationFrameId;

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Instantly position center dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Smooth animation loop for halo and outer ring
    const animate = () => {
      // Lerp for smooth floating halo spotlight
      const easeHalo = 0.08;
      haloPos.current.x += (mousePos.current.x - haloPos.current.x) * easeHalo;
      haloPos.current.y += (mousePos.current.y - haloPos.current.y) * easeHalo;

      // Lerp for outer cursor ring
      const easeRing = 0.18;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * easeRing;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * easeRing;

      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${haloPos.current.x}px, ${haloPos.current.y}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Interactive elements hover detector
    const handleElementOver = (e) => {
      const target = e.target;
      if (
        target.closest('a, button, input, select, textarea, [role="button"], .tab-btn, .feature-card, .pricing-card, .how-step, .testimonial-card')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }

      // Card-specific spotlight tracking
      const card = target.closest('.spotlight-card, .feature-card, .pricing-card, .testimonial-card, .how-step, .contact-form, .hero-preview-box');
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleElementOver, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleElementOver);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (isTouch) return null;

  return (
    <div className={`cursor-spotlight-system ${isVisible ? 'visible' : ''} ${isHovered ? 'hovering' : ''}`} aria-hidden="true">
      {/* Large ambient glowing halo spotlight shadow */}
      <div ref={haloRef} className="cursor-ambient-halo" />
      
      {/* Sleek magnetic ring */}
      <div ref={ringRef} className="cursor-outer-ring" />
      
      {/* Precise center dot */}
      <div ref={dotRef} className="cursor-inner-dot" />
    </div>
  );
};

export default CursorSpotlight;
