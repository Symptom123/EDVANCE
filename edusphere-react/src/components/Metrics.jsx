import React, { useEffect, useRef } from 'react';

const AnimatedCounter = ({ target, suffix = '', isDecimal = false }) => {
  const nodeRef = useRef(null);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const animateCount = () => {
      const duration = 1800;
      const startTime = performance.now();
      const decimals = isDecimal ? 1 : 0;

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = eased * target;

        if (target >= 10000) {
          if (suffix === 'K') {
            el.textContent = Math.floor(val / 1000) + 'K';
          } else {
            el.textContent = Math.floor(val).toLocaleString();
          }
        } else if (target >= 100) {
          el.textContent = Math.floor(val).toLocaleString() + suffix;
        } else {
          el.textContent = val.toFixed(decimals) + suffix;
        }

        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(el);

    return () => observer.disconnect();
  }, [target, suffix, isDecimal]);

  return <div className="metric-value" ref={nodeRef}>0</div>;
};

const Metrics = () => {
  return (
    <section className="metrics-section" id="solutions">
      <div className="container">
        <div className="metrics-grid">
          <div className="metric-item">
            <AnimatedCounter target={2400} />
            <div className="metric-label">Schools worldwide</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <AnimatedCounter target={850000} suffix="K" />
            <div className="metric-label">Active students</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <AnimatedCounter target={99.9} suffix="%" isDecimal={true} />
            <div className="metric-label">Platform uptime SLA</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <AnimatedCounter target={4.9} isDecimal={true} />
            <div className="metric-label">Average customer rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Metrics;
