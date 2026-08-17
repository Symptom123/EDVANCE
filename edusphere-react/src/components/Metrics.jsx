import React, { useEffect, useRef } from 'react';

const AnimatedCounter = ({ target, suffix = '', prefix = '', isDecimal = false }) => {
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
            el.textContent = prefix + Math.floor(val / 1000) + 'K';
          } else {
            el.textContent = prefix + Math.floor(val).toLocaleString() + suffix;
          }
        } else if (target >= 100) {
          el.textContent = prefix + Math.floor(val).toLocaleString() + suffix;
        } else {
          el.textContent = prefix + val.toFixed(decimals) + suffix;
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
    }, { threshold: 0.4 });

    observer.observe(el);

    return () => observer.disconnect();
  }, [target, suffix, prefix, isDecimal]);

  return <span ref={nodeRef}>{prefix}0{suffix}</span>;
};

const Metrics = () => {
  return (
    <section className="metrics-section" id="metrics">
      <div className="container">
        <div className="metrics-grid reveal">
          <div className="metric-item">
            <div className="metric-value">
              <AnimatedCounter target={2400} suffix="+" />
            </div>
            <div className="metric-label">
              Educational institutions across Africa
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-value">
              <AnimatedCounter target={850} suffix="K+" />
            </div>
            <div className="metric-label">
              Active students with verified digital records
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-value">
              <AnimatedCounter target={40} suffix="%" />
            </div>
            <div className="metric-label">
              Reduction in term-end administrative processing time
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-value">
              <AnimatedCounter target={99.9} suffix="%" isDecimal={true} />
            </div>
            <div className="metric-label">
              Guaranteed platform availability SLA
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Metrics;
